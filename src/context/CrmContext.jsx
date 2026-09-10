import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadState, migrateLegacy, saveState, STORAGE_KEY } from '../lib/storage.js'
import { createSeed } from '../data/seed.js'
import { addDays, normDoc, normEmail, normPhone, nowIso, todayStr, uid } from '../lib/utils.js'
import { getCurrentProposal } from '../lib/domain.js'

const CrmContext=createContext(null)

export function CrmProvider({children}){
  const [state,setState]=useState(loadState)
  const [uiPeriod,setUiPeriod]=useState('month')
  const [toast,setToast]=useState(null)
  useEffect(()=>saveState(state),[state])

  const notify=(message,type='success')=>{setToast({id:Date.now(),message,type});setTimeout(()=>setToast(null),3200)}
  const mutate=fn=>setState(prev=>{const next=structuredClone(prev);fn(next);next.updatedAt=nowIso();return next})
  const event=(opp,type,label,extra={})=>opp.history.push({id:uid('evt'),type,at:nowIso(),label,...extra})
  const findContact=data=>state.contacts.find(c=>{
    const p=normPhone(data.phone),e=normEmail(data.email)
    return (p&&normPhone(c.phone)===p)||(e&&normEmail(c.email)===e)
  })
  const findCompany=data=>state.companies.find(c=>{
    const d=normDoc(data.doc)
    return (d&&normDoc(c.doc)===d)||(data.company&&c.name?.toLowerCase()===data.company.toLowerCase())
  })

  const createOpportunity=form=>{
    let createdId=''
    mutate(next=>{
      let contact=next.contacts.find(c=>c.id===form.contactId)
      if(!contact){const match=findContact(form);contact=match?next.contacts.find(c=>c.id===match.id):null}
      if(!contact){
        contact={id:uid('ct'),name:form.name.trim(),phone:form.phone||'',email:form.email||'',city:form.city||'',source:form.source||'Outro',createdAt:todayStr()}
        next.contacts.unshift(contact)
      }else{
        Object.assign(contact,{name:form.name||contact.name,phone:form.phone||contact.phone,email:form.email||contact.email,city:form.city||contact.city,source:form.source||contact.source})
      }
      let company=next.companies.find(c=>c.id===form.companyId)
      if(!company){const existing=findCompany(form);company=existing?next.companies.find(c=>c.id===existing.id):null}
      if(!company){company={id:uid('co'),name:form.company||'',doc:form.doc||'',type:form.type||'Outro',city:form.city||''};next.companies.unshift(company)}
      const items=(form.items||[]).length?form.items:[{serviceId:form.serviceId,name:form.serviceName,oneOff:Number(form.oneOff||0),mrr:Number(form.mrr||0)}]
      const opp={id:uid('op'),contactId:contact.id,companyId:company.id,stage:'Novo lead',temp:form.temp||'warm',source:form.source||contact.source||'Outro',items,createdAt:todayStr(),updatedAt:todayStr(),stageEnteredAt:todayStr(),wonAt:'',lostAt:'',lostReason:'',lostNote:'',reactivationAt:'',diagnosis:{},proposals:[],history:[],note:form.note||''}
      event(opp,'created','Oportunidade criada')
      next.opportunities.unshift(opp);createdId=opp.id
    })
    notify('Oportunidade criada.')
    return createdId
  }

  const updateContactCompany=(oppId,data)=>mutate(next=>{
    const opp=next.opportunities.find(o=>o.id===oppId);if(!opp)return
    const c=next.contacts.find(x=>x.id===opp.contactId),co=next.companies.find(x=>x.id===opp.companyId)
    if(c)Object.assign(c,{name:data.name,phone:data.phone,email:data.email,city:data.city,source:data.source})
    if(co)Object.assign(co,{name:data.company,doc:data.doc,type:data.type,city:data.city})
    Object.assign(opp,{temp:data.temp,source:data.source,note:data.note,updatedAt:todayStr()});event(opp,'edit','Cadastro atualizado')
  })

  const setStage=(id,stage)=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o||o.stage===stage)return
    const old=o.stage;o.stage=stage;o.stageEnteredAt=todayStr();o.updatedAt=todayStr();o.reactivationAt=''
    event(o,'stage',`Etapa alterada: ${old} → ${stage}`,{fromStage:old,toStage:stage})
  })

  const saveDiagnosis=(id,data)=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    o.diagnosis=data;o.updatedAt=todayStr()
    if(['Novo lead','Contato','Qualificação'].includes(o.stage)){const old=o.stage;o.stage='Diagnóstico';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Diagnóstico`,{fromStage:old,toStage:'Diagnóstico'})}
    event(o,'diagnosis','Diagnóstico atualizado')
  })

  const saveProposal=(id,draft,forceVersion=false)=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    const current=getCurrentProposal(o),shouldVersion=forceVersion||(current&&current.status!=='Rascunho')
    const version=shouldVersion||!current?(current?.version||0)+1:current.version
    const code=current?.code||`LG-${todayStr().replaceAll('-','')}-${String(o.proposals.length+1).padStart(2,'0')}`
    const record={
      id:shouldVersion||!current?uid('pr'):current.id,version,code,status:draft.status||'Rascunho',items:structuredClone(draft.items||o.items),discount:Number(draft.discount||0),payment:draft.payment||'',validity:draft.validity||addDays(todayStr(),7),notes:draft.notes||'',
      scope:draft.scope||'',notIncluded:draft.notIncluded||'',deadline:draft.deadline||'',clientNotes:draft.clientNotes||'',
      createdAt:shouldVersion||!current?todayStr():current.createdAt,
      sentAt:['Enviada','Negociação','Aceita','Recusada'].includes(draft.status)?(current?.sentAt||todayStr()):'',
      acceptedAt:draft.status==='Aceita'?todayStr():''
    }
    if(shouldVersion||!current)o.proposals.push(record);else o.proposals[o.proposals.findIndex(p=>p.id===current.id)]=record
    o.items=structuredClone(record.items);o.updatedAt=todayStr()
    if(['Novo lead','Contato','Qualificação','Diagnóstico'].includes(o.stage)){const old=o.stage;o.stage='Proposta';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Proposta`,{fromStage:old,toStage:'Proposta'})}
    if(record.status==='Negociação'&&o.stage!=='Negociação'){const old=o.stage;o.stage='Negociação';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Negociação`,{fromStage:old,toStage:'Negociação'})}
    event(o,'proposal',`Proposta V${record.version} atualizada — ${record.status}`,{proposalVersion:record.version})
  })

  const markWon=id=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    const old=o.stage;o.stage='Ganho';o.wonAt=todayStr();o.lostAt='';o.reactivationAt='';o.stageEnteredAt=todayStr();o.updatedAt=todayStr()
    const p=getCurrentProposal(o);if(p){p.status='Aceita';p.acceptedAt=todayStr()}
    event(o,'won','Venda fechada',{fromStage:old,toStage:'Ganho'})
  })

  const markLost=(id,reason,note,reactivationAt='')=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    const old=o.stage;o.stage='Perdido';o.lostAt=todayStr();o.lostReason=reason;o.lostNote=note;o.reactivationAt=reactivationAt;o.stageEnteredAt=todayStr();o.updatedAt=todayStr()
    const p=getCurrentProposal(o);if(p&&p.status!=='Aceita')p.status='Recusada'
    event(o,'lost',`Oportunidade perdida · ${reason}`,{fromStage:old,toStage:'Perdido'})
  })

  const defer=(id,date,note)=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    const old=o.stage;o.stage='Adiado';o.reactivationAt=date;o.note=note||o.note;o.stageEnteredAt=todayStr();o.updatedAt=todayStr()
    event(o,'deferred',`Oportunidade adiada até ${date}`,{fromStage:old,toStage:'Adiado'})
  })

  const reactivate=id=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    o.stage='Contato';o.reactivationAt='';o.lostReason='';o.lostNote='';o.lostAt='';if(o.temp==='cold')o.temp='warm';o.stageEnteredAt=todayStr();o.updatedAt=todayStr();event(o,'reactivated','Oportunidade reativada')
  })

  const recordContact=(id,label,nextDate='')=>mutate(next=>{
    const o=next.opportunities.find(x=>x.id===id);if(!o)return
    o.updatedAt=todayStr();event(o,'contact',label)
    if(nextDate)next.activities.push({id:uid('act'),opportunityId:id,type:'Follow-up',date:nextDate,time:'09:00',priority:'Média',note:'Retorno após contato',done:false,createdAt:nowIso(),completedAt:''})
  })

  const addActivity=data=>mutate(next=>next.activities.push({id:uid('act'),done:false,createdAt:nowIso(),completedAt:'',...data}))
  const updateActivity=(id,data)=>mutate(next=>{const a=next.activities.find(x=>x.id===id);if(a)Object.assign(a,data)})
  const completeActivity=(id,nextDate='',nextType='Follow-up')=>mutate(next=>{
    const a=next.activities.find(x=>x.id===id);if(!a)return
    a.done=true;a.completedAt=nowIso()
    const o=next.opportunities.find(x=>x.id===a.opportunityId)
    if(o){o.updatedAt=todayStr();event(o,'contact',`Atividade concluída: ${a.type}`)}
    if(nextDate)next.activities.push({id:uid('act'),opportunityId:a.opportunityId,type:nextType,date:nextDate,time:a.time||'09:00',priority:a.priority||'Média',note:`Próximo passo após ${a.type}`,done:false,createdAt:nowIso(),completedAt:''})
  })
  const deleteActivity=id=>mutate(next=>{next.activities=next.activities.filter(a=>a.id!==id)})

  const updateSettings=patch=>mutate(next=>{next.settings={...next.settings,...patch}})
  const addService=data=>mutate(next=>next.settings.services.push({id:uid('svc'),...data}))
  const removeService=id=>mutate(next=>{next.settings.services=next.settings.services.filter(s=>s.id!==id)})
  const resetDemo=()=>{localStorage.removeItem(STORAGE_KEY);setState(createSeed());notify('Dados de demonstração restaurados.','warning')}
  const importBackup=text=>{
    const raw=JSON.parse(text)
    if(raw.schemaVersion===4&&raw.contacts&&raw.opportunities){setState(raw);notify('Backup V2.2/V2.3 importado.');return}
    const migrated=migrateLegacy(raw);if(migrated){setState(migrated);notify('Backup antigo migrado para V2.3.');return}
    throw new Error('Formato inválido')
  }

  const api=useMemo(()=>({state,setState,uiPeriod,setUiPeriod,notify,findContact,createOpportunity,updateContactCompany,setStage,saveDiagnosis,saveProposal,markWon,markLost,defer,reactivate,recordContact,addActivity,updateActivity,completeActivity,deleteActivity,updateSettings,addService,removeService,resetDemo,importBackup}),[state,uiPeriod])
  return <CrmContext.Provider value={api}>{children}{toast&&<div className={`toast ${toast.type}`}>{toast.message}</div>}</CrmContext.Provider>
}
export const useCrm=()=>useContext(CrmContext)
