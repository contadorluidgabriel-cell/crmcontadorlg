import { DEFAULT_MESSAGES, DEFAULT_SERVICES } from '../data/catalog.js'
import { createSeed } from '../data/seed.js'
import { nowIso, todayStr, uid } from './utils.js'

export const STORAGE_KEY='crm_luid_gabriel_v22'
const LEGACY_KEY='crm_luid_gabriel_v2'
export const SCHEMA_VERSION=4

const slug = s => String(s||'servico').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const normalizeServices = list => (Array.isArray(list)&&list.length?list:DEFAULT_SERVICES).map((s,i)=>({
  id:s.id||`svc-${slug(s.name)}-${i}`,
  name:s.name||'Serviço', kind:s.kind||'Avulso',
  baseOneOff:Number(s.baseOneOff ?? s.base ?? 0), baseMrr:Number(s.baseMrr ?? 0),
}))

export function migrateLegacy(raw){
  if(!raw || !Array.isArray(raw.leads)) return null
  const services=normalizeServices(raw.settings?.services)
  const serviceByName=new Map(services.map(s=>[s.name,s]))
  const contacts=[],companies=[],opportunities=[],activities=[]
  const contactMap=new Map(), companyMap=new Map(), leadToOpp=new Map()
  const identity=l=>String(l.phone||l.email||l.doc||l.name||uid('legacy')).replace(/\W/g,'').toLowerCase()
  for(const l of raw.leads){
    const key=identity(l)
    let contactId=contactMap.get(key)
    if(!contactId){
      contactId=uid('ct'); contactMap.set(key,contactId)
      contacts.push({id:contactId,name:l.name||'Lead sem nome',phone:l.phone||'',email:l.email||'',city:l.city||'',source:l.source||'Outro',createdAt:l.created||todayStr()})
    }
    const compKey=String(l.doc||l.company||`${key}-company`).toLowerCase()
    let companyId=companyMap.get(compKey)
    if(!companyId){
      companyId=uid('co'); companyMap.set(compKey,companyId)
      companies.push({id:companyId,name:l.company||'',doc:l.doc||'',type:l.type||'Outro',city:l.city||''})
    }
    const svc=serviceByName.get(l.service)||{id:`svc-${slug(l.service)}`,name:l.service||'Outro',kind:Number(l.mrr||l.proposal?.monthly||0)?'Misto':'Avulso',baseOneOff:Number(l.value||0),baseMrr:Number(l.mrr||0)}
    if(!serviceByName.has(svc.name)){services.push(svc);serviceByName.set(svc.name,svc)}
    const item={serviceId:svc.id,name:svc.name,oneOff:Number(l.proposal?.value ?? l.value ?? 0),mrr:Number(l.proposal?.monthly ?? l.mrr ?? 0)}
    const proposalPresent=l.proposal && Object.keys(l.proposal).length && (l.proposal.status||l.proposal.value||l.proposal.monthly)
    const proposals=proposalPresent?[{id:uid('pr'),version:1,status:l.proposal.status||'Rascunho',items:[item],discount:Number(l.proposal.discount||0),payment:l.proposal.payment||'',validity:l.proposal.validity||'',notes:l.proposal.notes||'',createdAt:l.updated||l.created||todayStr(),sentAt:['Enviada','Negociação','Aceita','Recusada'].includes(l.proposal.status)?(l.updated||''):'',acceptedAt:l.proposal.status==='Aceita'?(l.wonAt||l.updated||''):''}]:[]
    const oppId=uid('op'); leadToOpp.set(l.id,oppId)
    opportunities.push({
      id:oppId,contactId,companyId,stage:l.stage==='Fechado'?'Ganho':(l.stage||'Novo lead'),temp:l.temp||'warm',source:l.source||'Outro',items:[item],
      createdAt:l.created||todayStr(),updatedAt:l.updated||l.created||todayStr(),stageEnteredAt:l.updated||l.created||todayStr(),wonAt:l.wonAt||'',lostAt:l.stage==='Perdido'?(l.updated||''):'',lostReason:l.lostReason||'',lostNote:l.lostNote||'',reactivationAt:l.reactivationAt||'',diagnosis:l.diagnosis||{},proposals,note:l.note||'',
      history:(l.history||[]).map(h=>({id:uid('evt'),type:'legacy',at:h.date||nowIso(),label:h.text||'Evento importado'})),
    })
  }
  for(const a of raw.activities||[]){
    const opportunityId=leadToOpp.get(a.leadId); if(!opportunityId) continue
    activities.push({id:a.id||uid('act'),opportunityId,type:a.type||'Follow-up',date:a.date||todayStr(),time:a.time||'09:00',priority:a.priority||'Média',note:a.note||'',done:Boolean(a.done),createdAt:a.created||nowIso(),completedAt:a.completedAt||''})
  }
  return {schemaVersion:SCHEMA_VERSION,settings:{owner:raw.settings?.owner||'Luid Gabriel',business:raw.settings?.business||'Contador Luid Gabriel',staleDays:Number(raw.settings?.staleDays||5),goals:{clients:8,mrr:3000,oneOff:6000,...raw.settings?.goals},services,messages:{...DEFAULT_MESSAGES,...raw.settings?.messages}},contacts,companies,opportunities,activities,createdAt:nowIso(),updatedAt:nowIso(),migratedFrom:'v2.1'}
}

export function loadState(){
  try{
    const current=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')
    if(current?.schemaVersion===SCHEMA_VERSION) return current
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null')
    const migrated=migrateLegacy(legacy)
    if(migrated){localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}
  }catch(e){console.warn('Falha ao carregar CRM',e)}
  return createSeed()
}
export function saveState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify({...state,schemaVersion:SCHEMA_VERSION,updatedAt:nowIso()}))}
