import { DEFAULT_MESSAGES, DEFAULT_SERVICES, LEGACY_DEFAULT_SERVICE_IDS } from '../data/catalog.js'
import { createSeed } from '../data/seed.js'
import { createWonSnapshot, getAcceptedProposal, getCurrentProposal } from './domain.js'
import { nowIso, todayStr, uid } from './utils.js'

export const STORAGE_KEY='crm_luid_gabriel_v22'
export const PRE_IMPORT_BACKUP_KEY='crm_luid_gabriel_pre_import_backup'
const LEGACY_KEY='crm_luid_gabriel_v2'
export const SCHEMA_VERSION=5

const slug = s => String(s||'servico').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const normalizeService = (s,i=0) => ({
  ...s,
  id:s.id||`svc-${slug(s.name)}-${i}`,
  name:s.name||'Serviço',
  kind:s.kind||'Avulso',
  baseOneOff:Number(s.baseOneOff ?? s.base ?? 0),
  baseMrr:Number(s.baseMrr ?? 0),
})
const normalizeServices = list => (Array.isArray(list)&&list.length?list:DEFAULT_SERVICES).map(normalizeService)
const normalizeItem = item => ({
  ...item,
  serviceId:item?.serviceId||`svc-${slug(item?.name)}`,
  name:item?.name||'Serviço',
  tableOneOff:Number(item?.tableOneOff ?? item?.oneOff ?? 0),
  tableMrr:Number(item?.tableMrr ?? item?.mrr ?? 0),
  oneOff:Number(item?.oneOff ?? 0),
  mrr:Number(item?.mrr ?? 0),
})
const normalizeProposal = p => ({
  ...p,
  items:(p?.items||[]).map(normalizeItem),
  pricing:{
    oneOffDiscountType:p?.pricing?.oneOffDiscountType==='percent'?'percent':'amount',
    oneOffDiscountValue:Number(p?.pricing?.oneOffDiscountValue ?? (typeof p?.discount==='number'?p.discount:0) ?? 0),
    mrrDiscountPercent:Number(p?.pricing?.mrrDiscountPercent||0),
    mrrDiscountType:p?.pricing?.mrrDiscountType==='temporary'?'temporary':'permanent',
    mrrDiscountMonths:Number(p?.pricing?.mrrDiscountMonths||0),
  },
})

function mergeCurrentCatalog(existing=[]){
  const custom=(Array.isArray(existing)?existing:[]).filter(s=>!LEGACY_DEFAULT_SERVICE_IDS.includes(s.id)&&!DEFAULT_SERVICES.some(d=>d.id===s.id))
  return [...DEFAULT_SERVICES.map(normalizeService),...custom.map(normalizeService)]
}

export function migrateV4ToV5(raw){
  if(!raw||raw.schemaVersion!==4||!Array.isArray(raw.contacts)||!Array.isArray(raw.opportunities))return null
  const next=structuredClone(raw)
  next.schemaVersion=SCHEMA_VERSION
  next.revision=Number(raw.revision||0)+1
  next.settings={
    owner:raw.settings?.owner||'Luid Gabriel',
    business:raw.settings?.business||'Contador Luid Gabriel',
    staleDays:Number(raw.settings?.staleDays||5),
    goals:{clients:8,mrr:3000,oneOff:6000,...raw.settings?.goals},
    services:mergeCurrentCatalog(raw.settings?.services),
    messages:{...DEFAULT_MESSAGES,...raw.settings?.messages},
    commercialRules:{maxDiscountPercent:40,acquisitionMode:'aggressive',...raw.settings?.commercialRules},
  }
  next.companies=Array.isArray(raw.companies)?raw.companies:[]
  next.activities=Array.isArray(raw.activities)?raw.activities:[]
  next.opportunities=raw.opportunities.map(o=>{
    const opp={...o,primaryServiceId:o.primaryServiceId||o.items?.[0]?.serviceId||'',items:(o.items||[]).map(normalizeItem),proposals:(o.proposals||[]).map(normalizeProposal),history:Array.isArray(o.history)?o.history:[]}
    if((opp.stage==='Ganho'||opp.wonAt)&&!opp.wonSnapshot){
      const accepted=getAcceptedProposal(opp)||getCurrentProposal(opp)
      opp.wonSnapshot=createWonSnapshot(opp,accepted)
    }
    return opp
  })
  next.migratedFrom='schema-4'
  next.updatedAt=nowIso()
  return next
}

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
      companies.push({id:companyId,name:l.company||'',doc:l.doc||'',type:l.type||'Não informado',city:l.city||''})
    }
    const svc=serviceByName.get(l.service)||{id:`svc-${slug(l.service)}`,name:l.service||'Outro',kind:Number(l.mrr||l.proposal?.monthly||0)?'Misto':'Avulso',baseOneOff:Number(l.value||0),baseMrr:Number(l.mrr||0)}
    if(!serviceByName.has(svc.name)){services.push(svc);serviceByName.set(svc.name,svc)}
    const item=normalizeItem({serviceId:svc.id,name:svc.name,oneOff:Number(l.proposal?.value ?? l.value ?? 0),mrr:Number(l.proposal?.monthly ?? l.mrr ?? 0)})
    const proposalPresent=l.proposal && Object.keys(l.proposal).length && (l.proposal.status||l.proposal.value||l.proposal.monthly)
    const proposals=proposalPresent?[normalizeProposal({id:uid('pr'),version:1,status:l.proposal.status||'Rascunho',items:[item],discount:Number(l.proposal.discount||0),payment:l.proposal.payment||'',validity:l.proposal.validity||'',notes:l.proposal.notes||'',createdAt:l.updated||l.created||todayStr(),sentAt:['Enviada','Negociação','Aceita','Recusada'].includes(l.proposal.status)?(l.updated||''):'',acceptedAt:l.proposal.status==='Aceita'?(l.wonAt||l.updated||''):''})]:[]
    const oppId=uid('op'); leadToOpp.set(l.id,oppId)
    const opp={
      id:oppId,contactId,companyId,stage:l.stage==='Fechado'?'Ganho':(l.stage||'Novo lead'),temp:l.temp||'warm',source:l.source||'Outro',primaryServiceId:item.serviceId,items:[item],
      createdAt:l.created||todayStr(),updatedAt:l.updated||l.created||todayStr(),stageEnteredAt:l.updated||l.created||todayStr(),wonAt:l.wonAt||'',lostAt:l.stage==='Perdido'?(l.updated||''):'',lostReason:l.lostReason||'',lostNote:l.lostNote||'',reactivationAt:l.reactivationAt||'',diagnosis:l.diagnosis||{},proposals,note:l.note||'',
      history:(l.history||[]).map(h=>({id:uid('evt'),type:'legacy',at:h.date||nowIso(),label:h.text||'Evento importado'})),
    }
    if(opp.stage==='Ganho'||opp.wonAt)opp.wonSnapshot=createWonSnapshot(opp,getAcceptedProposal(opp)||getCurrentProposal(opp))
    opportunities.push(opp)
  }
  for(const a of raw.activities||[]){
    const opportunityId=leadToOpp.get(a.leadId); if(!opportunityId) continue
    activities.push({id:a.id||uid('act'),opportunityId,type:a.type||'Follow-up',date:a.date||todayStr(),time:a.time||'09:00',priority:a.priority||'Média',note:a.note||'',done:Boolean(a.done),createdAt:a.created||nowIso(),completedAt:a.completedAt||''})
  }
  return {schemaVersion:SCHEMA_VERSION,revision:1,settings:{owner:raw.settings?.owner||'Luid Gabriel',business:raw.settings?.business||'Contador Luid Gabriel',staleDays:Number(raw.settings?.staleDays||5),goals:{clients:8,mrr:3000,oneOff:6000,...raw.settings?.goals},services:mergeCurrentCatalog(services),messages:{...DEFAULT_MESSAGES,...raw.settings?.messages},commercialRules:{maxDiscountPercent:40,acquisitionMode:'aggressive'}},contacts,companies,opportunities,activities,createdAt:nowIso(),updatedAt:nowIso(),migratedFrom:'v2.1'}
}

export function validateState(raw){
  if(!raw||raw.schemaVersion!==SCHEMA_VERSION)throw new Error('Schema incompatível')
  for(const key of ['contacts','companies','opportunities','activities'])if(!Array.isArray(raw[key]))throw new Error(`Campo inválido: ${key}`)
  const unique=(list,label)=>{const ids=list.map(x=>x?.id).filter(Boolean);if(ids.length!==list.length||new Set(ids).size!==ids.length)throw new Error(`IDs inválidos ou duplicados em ${label}`)}
  unique(raw.contacts,'contacts');unique(raw.companies,'companies');unique(raw.opportunities,'opportunities');unique(raw.activities,'activities')
  const contactIds=new Set(raw.contacts.map(x=>x.id)),companyIds=new Set(raw.companies.map(x=>x.id)),oppIds=new Set(raw.opportunities.map(x=>x.id))
  for(const o of raw.opportunities){
    if(!contactIds.has(o.contactId))throw new Error(`Oportunidade ${o.id} sem contato válido`)
    if(!companyIds.has(o.companyId))throw new Error(`Oportunidade ${o.id} sem empresa válida`)
    if(!Array.isArray(o.items)||!Array.isArray(o.proposals)||!Array.isArray(o.history))throw new Error(`Oportunidade ${o.id} incompleta`)
  }
  for(const a of raw.activities)if(!oppIds.has(a.opportunityId))throw new Error(`Atividade ${a.id} sem oportunidade válida`)
  return true
}

function blankState(recovery=null){
  return {schemaVersion:SCHEMA_VERSION,revision:0,recovery,settings:{owner:'Luid Gabriel',business:'Contador Luid Gabriel',staleDays:5,goals:{clients:8,mrr:3000,oneOff:6000},services:DEFAULT_SERVICES,messages:DEFAULT_MESSAGES,commercialRules:{maxDiscountPercent:40,acquisitionMode:'aggressive'}},contacts:[],companies:[],opportunities:[],activities:[],createdAt:nowIso(),updatedAt:nowIso()}
}

export function readCurrentState(){
  try{const current=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return current?.schemaVersion===SCHEMA_VERSION?current:null}catch{return null}
}

export function loadState(){
  try{
    const currentText=localStorage.getItem(STORAGE_KEY)
    if(currentText){
      const current=JSON.parse(currentText)
      if(current?.schemaVersion===SCHEMA_VERSION){validateState(current);return current}
      const migrated=migrateV4ToV5(current)
      if(migrated){validateState(migrated);localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}
      return blankState({blocked:true,reason:'schema_unknown',schemaVersion:current?.schemaVersion??null,rawState:current})
    }
    const legacyText=localStorage.getItem(LEGACY_KEY)
    if(legacyText){
      const legacy=JSON.parse(legacyText)
      const migrated=migrateLegacy(legacy)
      if(migrated){validateState(migrated);localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated}
      return blankState({blocked:true,reason:'legacy_unknown',rawState:legacy})
    }
  }catch(e){
    console.warn('Falha ao carregar CRM',e)
    return blankState({blocked:true,reason:'parse_error',message:String(e?.message||e)})
  }
  return createSeed()
}

export function saveState(state){
  if(state?.recovery?.blocked)return
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...state,schemaVersion:SCHEMA_VERSION,updatedAt:nowIso()}))
}

export function backupBeforeImport(state){
  localStorage.setItem(PRE_IMPORT_BACKUP_KEY,JSON.stringify({...state,backupCreatedAt:nowIso()}))
}
