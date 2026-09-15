import { clamp, daysSince, money, periodMatches, todayStr } from './utils.js'
import { ACTIVE_STAGES, TERMINAL_STAGES } from '../data/catalog.js'

export const getContact=(state,opp)=>state.contacts.find(c=>c.id===opp.contactId)
export const getCompany=(state,opp)=>state.companies.find(c=>c.id===opp.companyId)
export const getCurrentProposal=opp=>[...(opp.proposals||[])].sort((a,b)=>b.version-a.version)[0]||null
export const getAcceptedProposal=opp=>[...(opp.proposals||[])].filter(p=>p.status==='Aceita'||p.acceptedAt).sort((a,b)=>b.version-a.version)[0]||null

const pct=(value,max=100)=>clamp(Number(value||0),0,max)
export const normalizePricing=p=>({
  oneOffDiscountType:p?.pricing?.oneOffDiscountType==='percent'?'percent':'amount',
  oneOffDiscountValue:Math.max(0,Number(p?.pricing?.oneOffDiscountValue ?? (typeof p?.discount==='number'?p.discount:0) ?? 0)),
  mrrDiscountPercent:pct(p?.pricing?.mrrDiscountPercent,100),
  mrrDiscountType:p?.pricing?.mrrDiscountType==='temporary'?'temporary':'permanent',
  mrrDiscountMonths:Math.max(0,Number(p?.pricing?.mrrDiscountMonths||0)),
})
export const proposalTotals=p=>{
  const items=p?.items||[]
  const tableOneOff=items.reduce((s,i)=>s+Number(i.tableOneOff ?? i.oneOff ?? 0),0)
  const tableMrr=items.reduce((s,i)=>s+Number(i.tableMrr ?? i.mrr ?? 0),0)
  const baseOneOff=items.reduce((s,i)=>s+Number(i.oneOff||0),0)
  const baseMrr=items.reduce((s,i)=>s+Number(i.mrr||0),0)
  const pricing=normalizePricing(p)
  const oneOffDiscount=pricing.oneOffDiscountType==='percent'?baseOneOff*pct(pricing.oneOffDiscountValue)/100:Math.min(baseOneOff,pricing.oneOffDiscountValue)
  const mrrDiscount=baseMrr*pct(pricing.mrrDiscountPercent)/100
  return {
    tableOneOff,tableMrr,baseOneOff,baseMrr,
    oneOffDiscount,mrrDiscount,
    oneOff:Math.max(0,baseOneOff-oneOffDiscount),
    mrr:Math.max(0,baseMrr-mrrDiscount),
    pricing,
  }
}
export const snapshotTotals=s=>s?{oneOff:Number(s.oneOff||0),mrr:Number(s.mrr||0),tableOneOff:Number(s.tableOneOff??s.oneOff??0),tableMrr:Number(s.tableMrr??s.mrr??0),oneOffDiscount:Number(s.oneOffDiscount||0),mrrDiscount:Number(s.mrrDiscount||0)}:null
export const opportunityTotals=opp=>{
  if(opp?.wonSnapshot){const s=snapshotTotals(opp.wonSnapshot);return{...s,pricing:opp.wonSnapshot.pricing||{}}}
  const p=getCurrentProposal(opp)
  return p?proposalTotals(p):proposalTotals({items:opp?.items||[]})
}
export const serviceNames=opp=>(opp.items||[]).map(i=>i.name).join(' + ')||'Sem serviço'
export const lastInteractionDate=opp=>{
  const dates=(opp.history||[]).filter(h=>['contact','proposal','diagnosis','stage','won','lost','reactivated','legacy'].includes(h.type)).map(h=>h.at).filter(Boolean).sort().reverse()
  return (dates[0]||opp.updatedAt||opp.createdAt||'').slice(0,10)
}
export const activeOpportunity=opp=>ACTIVE_STAGES.includes(opp.stage)
export const pipelineOpportunity=opp=>!['Perdido','Adiado'].includes(opp.stage)
export const terminalOpportunity=opp=>TERMINAL_STAGES.includes(opp.stage)
export const canSetStage=(opp,target)=>ACTIVE_STAGES.includes(opp?.stage)&&ACTIVE_STAGES.includes(target)
export const nextActivity=(state,oppId)=>state.activities.filter(a=>a.opportunityId===oppId&&!a.done).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]||null
export const isActivityOverdue=a=>!a.done&&(a.date<todayStr()||(a.date===todayStr()&&a.time&&a.time<new Date().toTimeString().slice(0,5)))

export function createWonSnapshot(opp,proposal=getAcceptedProposal(opp)||getCurrentProposal(opp)){
  const source=proposal||{items:opp.items||[],pricing:{}}
  const t=proposalTotals(source)
  return {
    proposalId:proposal?.id||'',proposalVersion:Number(proposal?.version||0),
    oneOff:t.oneOff,mrr:t.mrr,tableOneOff:t.tableOneOff,tableMrr:t.tableMrr,
    oneOffDiscount:t.oneOffDiscount,mrrDiscount:t.mrrDiscount,pricing:structuredClone(t.pricing),
    items:structuredClone(source.items||[]),capturedAt:new Date().toISOString(),
  }
}

export function scoreBreakdown(state,opp){
  if(opp.stage==='Ganho')return{score:100,parts:[['Venda ganha',100]]}
  if(opp.stage==='Perdido')return{score:0,parts:[['Oportunidade perdida',0]]}
  const parts=[]; let s=0
  const temp=opp.temp==='hot'?35:opp.temp==='warm'?22:10; parts.push(['Temperatura',temp]); s+=temp
  const sp={Contato:8,Qualificação:14,Diagnóstico:22,Proposta:30,Negociação:34,'Follow-up':28,Adiado:4}[opp.stage]||0;if(sp){parts.push([`Etapa ${opp.stage}`,sp]);s+=sp}
  if(opp.source==='Indicação'){parts.push(['Origem: indicação',8]);s+=8}
  if(Object.keys(opp.diagnosis||{}).filter(k=>k!=='notes').length){parts.push(['Diagnóstico registrado',8]);s+=8}
  const proposal=getCurrentProposal(opp);if(proposal&&['Enviada','Negociação'].includes(proposal.status)){parts.push(['Proposta ativa',10]);s+=10}
  const stale=daysSince(lastInteractionDate(opp));if(stale<=2){parts.push(['Movimentação recente',7]);s+=7}if(stale>=5){parts.push(['Parado há 5+ dias',-12]);s-=12}if(stale>=10){parts.push(['Parado há 10+ dias',-12]);s-=12}if(stale>=20){parts.push(['Parado há 20+ dias',-15]);s-=15}
  const a=nextActivity(state,opp.id);if(a&&isActivityOverdue(a)){parts.push(['Atividade atrasada',8]);s+=8}
  return{score:clamp(Math.round(s),0,100),parts}
}
export const scoreLead=(state,opp)=>scoreBreakdown(state,opp).score
export const stageAge=opp=>daysSince(opp.stageEnteredAt||opp.updatedAt||opp.createdAt)
export const proposalExpiry=p=>{if(!p?.validity)return null;return Math.ceil((new Date(`${p.validity}T12:00:00`)-new Date(`${todayStr()}T12:00:00`))/86400000)}
export const periodLabel=p=>p==='today'?'Hoje':p==='month'?'Este mês':p==='30'?'Últimos 30 dias':p==='7'?'Últimos 7 dias':'Todo período'

export function reportData(state,period='month'){
  const created=state.opportunities.filter(o=>periodMatches(o.createdAt,period))
  const won=state.opportunities.filter(o=>o.wonAt&&periodMatches(o.wonAt,period))
  const lost=state.opportunities.filter(o=>o.lostAt&&periodMatches(o.lostAt,period))
  const decisions=[...won,...lost],conversion=decisions.length?won.length/decisions.length*100:0
  const revenue=won.reduce((acc,o)=>{const t=opportunityTotals(o);acc.oneOff+=t.oneOff;acc.mrr+=t.mrr;return acc},{oneOff:0,mrr:0})
  const bySource={}
  created.forEach(o=>{const k=o.source||'Outro';bySource[k]??={leads:0,wins:0,oneOff:0,mrr:0};bySource[k].leads++})
  won.forEach(o=>{const k=o.source||'Outro';bySource[k]??={leads:0,wins:0,oneOff:0,mrr:0};const t=opportunityTotals(o);bySource[k].wins++;bySource[k].oneOff+=t.oneOff;bySource[k].mrr+=t.mrr})
  const lossReasons={};lost.forEach(o=>lossReasons[o.lostReason||'Não informado']=(lossReasons[o.lostReason||'Não informado']||0)+1)
  return{created,won,lost,conversion,revenue,bySource,lossReasons}
}

const FUNNEL_STAGES=['Novo lead','Contato','Qualificação','Diagnóstico','Proposta','Negociação','Follow-up','Ganho']
function maxReachedIndex(opp){
  let max=0
  const current=FUNNEL_STAGES.indexOf(opp.stage);if(current>=0)max=Math.max(max,current)
  for(const h of opp.history||[]){for(const value of [h.toStage,h.fromStage]){const i=FUNNEL_STAGES.indexOf(value);if(i>=0)max=Math.max(max,i)}}
  if(Object.keys(opp.diagnosis||{}).length)max=Math.max(max,FUNNEL_STAGES.indexOf('Diagnóstico'))
  if((opp.proposals||[]).length)max=Math.max(max,FUNNEL_STAGES.indexOf('Proposta'))
  if(opp.wonAt)max=FUNNEL_STAGES.indexOf('Ganho')
  return max
}

export function funnelData(state,period='month'){
  const cohort=state.opportunities.filter(o=>periodMatches(o.createdAt,period))
  const rows=FUNNEL_STAGES.map((stage,index)=>({stage,count:cohort.filter(o=>maxReachedIndex(o)>=index).length}))
  return rows.map((row,index)=>({...row,fromPrevious:index===0?100:(rows[index-1].count?row.count/rows[index-1].count*100:0),fromStart:cohort.length?row.count/cohort.length*100:0}))
}

export function cohortData(state,period='month'){
  const cohort=state.opportunities.filter(o=>periodMatches(o.createdAt,period))
  const won=cohort.filter(o=>o.stage==='Ganho'||o.wonAt),lost=cohort.filter(o=>o.stage==='Perdido'||o.lostAt)
  const decisions=won.length+lost.length
  const byService={}
  cohort.forEach(o=>(o.items||[]).forEach(i=>{byService[i.name]??={entered:0,won:0,lost:0};byService[i.name].entered++;if(o.stage==='Ganho'||o.wonAt)byService[i.name].won++;if(o.stage==='Perdido'||o.lostAt)byService[i.name].lost++}))
  return{cohort,won,lost,decisionConversion:decisions?won.length/decisions*100:0,overallWinRate:cohort.length?won.length/cohort.length*100:0,byService}
}

export function pipelineSummary(state){
  const active=state.opportunities.filter(activeOpportunity),deferred=state.opportunities.filter(o=>o.stage==='Adiado')
  const sum=list=>list.reduce((a,o)=>{const t=opportunityTotals(o);a.oneOff+=t.oneOff;a.mrr+=t.mrr;return a},{oneOff:0,mrr:0})
  return{active,count:active.length,...sum(active),deferredCount:deferred.length,deferred:sum(deferred)}
}
export const opportunityValueText=o=>{const t=opportunityTotals(o);return `${money(t.oneOff)}${t.mrr?` + ${money(t.mrr)}/mês`:''}`}
