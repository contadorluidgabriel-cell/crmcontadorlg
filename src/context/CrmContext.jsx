import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { backupBeforeImport, loadState, migrateLegacy, migrateV4ToV5, readCurrentState, saveState, SCHEMA_VERSION, STORAGE_KEY, validateState } from '../lib/storage.js'
import { createSeed } from '../data/seed.js'
import { addDays, clamp, normDoc, normEmail, normPhone, nowIso, todayStr, uid } from '../lib/utils.js'
import { canSetStage, createWonSnapshot, getCurrentProposal, terminalOpportunity } from '../lib/domain.js'

const CrmContext=createContext(null)

export function CrmProvider({children}){
  const [state,setState]=useState(loadState)
  const [uiPeriod,setUiPeriod]=useState('month')
  const [toast,setToast]=useState(null)
  useEffect(()=>saveState(state),[state])

  const notify=(message,type='success')=>{setToast({id:Date.now(),message,type});setTimeout(()=>setToast(null),3200)}
  const mutate=fn=>setState(prev=>{
    const disk=readCurrentState()
    const base=disk&&Number(disk.revision||0)>Number(prev.revision||0)?disk:prev
    const next=structuredClone(base)
    fn(next)
    next.revision=Number(base.revision||0)+1
    next.updatedAt=nowIso()
    return next
  })
  const event=(opp,type,label,extra={})=>opp.history.push({id:uid('evt'),type,at:nowIso(),label,...extra})
  const findContact=data=>state.contacts.find(c=>{
    const p=normPhone(data.phone),e=normEmail(data.email)
    return (p&&normPhone(c.phone)===p)||(e&&normEmail(c.email)===e)
  })
  const findCompany=data=>state.companies.find(c=>{
    const d=normDoc(data.doc)
    return (d&&normDoc(c.doc)===d)
  })

  const createOpportunity=form=>{
    let createdId=''
    mutate(next=>{
      let contact=next.contacts.find(c=>c.id===form.contactId)
      if(!contact&&!form.forceNewContact){
        const p=normPhone(form.phone),e=normEmail(form.email)
        contact=next.contacts.find(c=>(p&&normPhone(c.phone)===p)||(e&&normEmail(c.email)===e))
      }
      if(!contact){
        contact={id:uid('ct'),name:form.name.trim(),phone:form.phone||'',email:form.email||'',city:form.city||'',source:form.source||'Outro',createdAt:todayStr()}
        next.contacts.unshift(contact)
      }else{
        Object.assign(contact,{name:form.name||contact.name,phone:form.phone||contact.phone,email:form.email||contact.email,city:form.city||contact.city,source:form.source||contact.source})
      }
      let company=next.companies.find(c=>c.id===form.companyId)
      if(!company){const d=normDoc(form.doc);company=d?next.companies.find(c=>normDoc(c.doc)===d):null}
      if(!company){company={id:uid('co'),name:form.company||'',doc:form.doc||'',type:form.type||'Não informado',city:form.city||''};next.companies.unshift(company)}
      const rawItems=(form.items||[]).length?form.items:[{serviceId:form.serviceId,name:form.serviceName,oneOff:Number(form.oneOff||0),mrr:Number(form.mrr||0)}]
      const items=rawItems.map(i=>({...i,tableOneOff:Number(i.tableOneOff??i.oneOff??0),tableMrr:Number(i.tableMrr??i.mrr??0),oneOff:Number(i.oneOff||0),mrr:Number(i.mrr||0)}))
      const opp={id:uid('op'),contactId:contact.id,companyId:company.id,stage:'Novo lead',temp:form.temp||'unclassified',source:form.source||contact.source||'Outro',primaryServiceId:form.primaryServiceId||items[0]?.serviceId||'',items,createdAt:todayStr(),updatedAt:todayStr(),stageEnteredAt:todayStr(),wonAt:'',wonSnapshot:null,lostAt:'',lostReason:'',lostNote:'',reactivationAt:'',diagnosis:{},proposals:[],history:[],note:form.note||''}
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

  const setStage=(id,stage)=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(!current||current.stage===stage)return true
    if(!canSetStage(current,stage)){notify('Use as ações específicas para ganhar, perder, adiar ou reativar uma oportunidade.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||!canSetStage(o,stage))return
      const old=o.stage;o.stage=stage;o.stageEnteredAt=todayStr();o.updatedAt=todayStr();o.reactivationAt=''
      event(o,'stage',`Etapa alterada: ${old} → ${stage}`,{fromStage:old,toStage:stage})
    })
    return true
  }

  const saveDiagnosis=(id,data)=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(current&&terminalOpportunity(current)){notify('Oportunidade encerrada. Reative ou crie uma nova oportunidade para continuar.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o)return
      o.diagnosis=data;o.updatedAt=todayStr()
      if(['Novo lead','Contato','Qualificação'].includes(o.stage)){const old=o.stage;o.stage='Diagnóstico';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Diagnóstico`,{fromStage:old,toStage:'Diagnóstico'})}
      event(o,'diagnosis','Diagnóstico atualizado')
    })
    return true
  }

  const saveProposal=(id,draft,forceVersion=false)=>{
    const currentOpp=state.opportunities.find(x=>x.id===id)
    if(!currentOpp||terminalOpportunity(currentOpp)){notify('Oportunidade encerrada. A proposta histórica foi bloqueada para preservar os valores fechados.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||terminalOpportunity(o))return
      const current=getCurrentProposal(o),shouldVersion=forceVersion||(current&&current.status!=='Rascunho')
      const version=shouldVersion||!current?(current?.version||0)+1:current.version
      const code=current?.code||`LG-${todayStr().replaceAll('-','')}-${String(o.proposals.length+1).padStart(2,'0')}`
      const maxDiscount=Number(next.settings?.commercialRules?.maxDiscountPercent||40)
      const pricing={
        oneOffDiscountType:draft.pricing?.oneOffDiscountType==='percent'?'percent':'amount',
        oneOffDiscountValue:Math.max(0,Number(draft.pricing?.oneOffDiscountValue||0)),
        mrrDiscountPercent:clamp(Number(draft.pricing?.mrrDiscountPercent||0),0,maxDiscount),
        mrrDiscountType:draft.pricing?.mrrDiscountType==='temporary'?'temporary':'permanent',
        mrrDiscountMonths:Math.max(0,Number(draft.pricing?.mrrDiscountMonths||0)),
      }
      if(pricing.oneOffDiscountType==='percent')pricing.oneOffDiscountValue=clamp(pricing.oneOffDiscountValue,0,maxDiscount)
      const record={
        id:shouldVersion||!current?uid('pr'):current.id,version,code,status:draft.status||'Rascunho',
        items:structuredClone((draft.items||o.items).map(i=>({...i,tableOneOff:Number(i.tableOneOff??i.oneOff??0),tableMrr:Number(i.tableMrr??i.mrr??0),oneOff:Number(i.oneOff||0),mrr:Number(i.mrr||0)}))),
        pricing,payment:draft.payment||'',validity:draft.validity||addDays(todayStr(),7),notes:draft.notes||'',scope:draft.scope||'',notIncluded:draft.notIncluded||'',deadline:draft.deadline||'',clientNotes:draft.clientNotes||'',
        createdAt:shouldVersion||!current?todayStr():current.createdAt,
        sentAt:['Enviada','Negociação','Aceita','Recusada'].includes(draft.status)?((shouldVersion||!current)?todayStr():(current?.sentAt||todayStr())):'',
        acceptedAt:draft.status==='Aceita'?todayStr():'',
      }
      if(shouldVersion||!current)o.proposals.push(record);else o.proposals[o.proposals.findIndex(p=>p.id===current.id)]=record
      o.items=structuredClone(record.items);o.primaryServiceId=o.primaryServiceId||record.items[0]?.serviceId||'';o.updatedAt=todayStr()
      if(record.status==='Aceita'){
        const old=o.stage;o.stage='Ganho';o.wonAt=todayStr();o.lostAt='';o.lostReason='';o.lostNote='';o.reactivationAt='';o.stageEnteredAt=todayStr();o.wonSnapshot=createWonSnapshot(o,record)
        event(o,'won','Venda fechada pela proposta aceita',{fromStage:old,toStage:'Ganho',proposalVersion:record.version})
      }else{
        if(['Novo lead','Contato','Qualificação','Diagnóstico'].includes(o.stage)){const old=o.stage;o.stage='Proposta';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Proposta`,{fromStage:old,toStage:'Proposta'})}
        if(record.status==='Negociação'&&o.stage!=='Negociação'){const old=o.stage;o.stage='Negociação';o.stageEnteredAt=todayStr();event(o,'stage',`Etapa alterada: ${old} → Negociação`,{fromStage:old,toStage:'Negociação'})}
        event(o,'proposal',`Proposta V${record.version} atualizada — ${record.status}`,{proposalVersion:record.version})
      }
    })
    return true
  }

  const markWon=id=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(!current||terminalOpportunity(current)){notify('Esta oportunidade já está encerrada.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||terminalOpportunity(o))return
      const old=o.stage,p=getCurrentProposal(o)
      if(p){p.status='Aceita';p.acceptedAt=todayStr()}
      o.stage='Ganho';o.wonAt=todayStr();o.lostAt='';o.lostReason='';o.lostNote='';o.reactivationAt='';o.stageEnteredAt=todayStr();o.updatedAt=todayStr();o.wonSnapshot=createWonSnapshot(o,p)
      event(o,'won','Venda fechada',{fromStage:old,toStage:'Ganho',proposalVersion:p?.version||0})
    })
    return true
  }

  const markLost=(id,reason,note,reactivationAt='')=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(!current||terminalOpportunity(current)){notify('Esta oportunidade já está encerrada.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||terminalOpportunity(o))return
      const old=o.stage;o.stage='Perdido';o.wonAt='';o.wonSnapshot=null;o.lostAt=todayStr();o.lostReason=reason;o.lostNote=note;o.reactivationAt=reactivationAt;o.stageEnteredAt=todayStr();o.updatedAt=todayStr()
      const p=getCurrentProposal(o);if(p&&p.status!=='Aceita')p.status='Recusada'
      event(o,'lost',`Oportunidade perdida · ${reason}`,{fromStage:old,toStage:'Perdido'})
    })
    return true
  }

  const defer=(id,date,note)=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(!current||terminalOpportunity(current)){notify('Esta oportunidade já está encerrada.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||terminalOpportunity(o))return
      const old=o.stage;o.stage='Adiado';o.reactivationAt=date;o.note=note||o.note;o.stageEnteredAt=todayStr();o.updatedAt=todayStr()
      event(o,'deferred',`Oportunidade adiada até ${date}`,{fromStage:old,toStage:'Adiado'})
    })
    return true
  }

  const reactivate=id=>{
    const current=state.opportunities.find(x=>x.id===id)
    if(!current||!['Perdido','Adiado'].includes(current.stage)){notify('Somente oportunidades perdidas ou adiadas podem ser reativadas.','warning');return false}
    mutate(next=>{
      const o=next.opportunities.find(x=>x.id===id);if(!o||!['Perdido','Adiado'].includes(o.stage))return
      const old=o.stage;o.stage='Contato';o.reactivationAt='';o.lostReason='';o.lostNote='';o.lostAt='';o.wonAt='';o.wonSnapshot=null;if(o.temp==='cold')o.temp='warm';o.stageEnteredAt=todayStr();o.updatedAt=todayStr();event(o,'reactivated','Oportunidade reativada',{fromStage:old,toStage:'Contato'})
    })
    return true
  }

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
    let normalized=null
    if(raw.schemaVersion===SCHEMA_VERSION)normalized=raw
    else if(raw.schemaVersion===4)normalized=migrateV4ToV5(raw)
    else normalized=migrateLegacy(raw)
    if(!normalized)throw new Error('Formato inválido ou schema não suportado')
    validateState(normalized)
    backupBeforeImport(state)
    setState(normalized);notify('Backup validado e importado. Uma cópia de segurança do estado anterior foi preservada.');return true
  }

  const api=useMemo(()=>({state,setState,uiPeriod,setUiPeriod,notify,findContact,createOpportunity,updateContactCompany,setStage,saveDiagnosis,saveProposal,markWon,markLost,defer,reactivate,recordContact,addActivity,updateActivity,completeActivity,deleteActivity,updateSettings,addService,removeService,resetDemo,importBackup}),[state,uiPeriod])
  return <CrmContext.Provider value={api}>{children}{toast&&<div className={`toast ${toast.type}`}>{toast.message}</div>}</CrmContext.Provider>
}
export const useCrm=()=>useContext(CrmContext)
