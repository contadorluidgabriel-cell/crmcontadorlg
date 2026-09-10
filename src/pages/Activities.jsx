import React, { useState } from 'react'
import { useCrm } from '../context/CrmContext.jsx'
import FilterChips from '../components/FilterChips.jsx'
import CompleteActivityModal from '../components/CompleteActivityModal.jsx'
import { getContact, isActivityOverdue, serviceNames } from '../lib/domain.js'
import { addDays, dateBR, todayStr } from '../lib/utils.js'

export default function Activities({openOpportunity,openActivity}){
  const {state,deleteActivity,updateActivity}=useCrm()
  const [period,setPeriod]=useState('all')
  const [type,setType]=useState('all')
  const [completing,setCompleting]=useState(null)
  const types=[...new Set(state.activities.map(a=>a.type))]
  const filtered=state.activities.filter(a=>{
    if(type!=='all'&&a.type!==type)return false
    if(period==='today')return a.date===todayStr()
    if(period==='7')return a.date>=todayStr()&&a.date<=addDays(todayStr(),7)
    if(period==='30')return a.date>=todayStr()&&a.date<=addDays(todayStr(),30)
    return true
  }).sort((a,b)=>Number(a.done)-Number(b.done)||`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const groups=[['Atrasadas',filtered.filter(isActivityOverdue),'danger'],['Hoje',filtered.filter(a=>!a.done&&a.date===todayStr()),'hot'],['Próximas',filtered.filter(a=>!a.done&&a.date>todayStr()),'neutral'],['Concluídas',filtered.filter(a=>a.done),'success']]

  return <>
    <div className="filter-stack"><FilterChips label="Período" value={period} onChange={setPeriod} items={[["all","Todos"],["today","Hoje"],["7","Próx. 7 dias"],["30","Próx. 30 dias"]]}/></div>
    <div className="toolbar"><select value={type} onChange={e=>setType(e.target.value)}><option value="all">Todos os tipos</option>{types.map(t=><option key={t}>{t}</option>)}</select><button className="btn primary" onClick={()=>openActivity('')}>Nova atividade</button></div>
    <div className="two-grid">{groups.map(([label,list,tone])=><section className="panel" key={label}><header className="panel-head"><h2>{label}</h2><span className={`pill ${tone}`}>{list.length}</span></header><div className="panel-body list-stack">{list.slice(0,30).map(a=>{const o=state.opportunities.find(x=>x.id===a.opportunityId),c=o&&getContact(state,o);return <article className="activity-row" key={a.id}><span className={`status-dot ${a.done?'success':isActivityOverdue(a)?'danger':''}`}/><div className="grow"><button className="link-btn compact" onClick={()=>o&&openOpportunity(o.id)}>{c?.name||'Oportunidade'}</button><b>{a.type}</b><small>{o?serviceNames(o):''} · {dateBR(a.date)} {a.time} · {a.priority}</small>{a.note&&<p>{a.note}</p>}<div className="actions"><button className="btn small" onClick={()=>openActivity(a.opportunityId,a)}>Editar</button>{!a.done&&<><button className="btn small success" onClick={()=>setCompleting(a)}>Concluir + próximo</button><button className="btn small" onClick={()=>updateActivity(a.id,{date:addDays(todayStr(),1)})}>Amanhã</button></>}<button className="btn small danger" onClick={()=>deleteActivity(a.id)}>Excluir</button></div></div></article>})}{!list.length&&<div className="empty">Nenhum item.</div>}</div></section>)}</div>
    <CompleteActivityModal activity={completing} onClose={()=>setCompleting(null)}/>
  </>
}
