import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import CompleteActivityModal from '../CompleteActivityModal.jsx'
import { isActivityOverdue } from '../../lib/domain.js'
import { dateBR } from '../../lib/utils.js'

export default function OpportunityActivities({state,opp,openActivity}){
  const [completing,setCompleting]=useState(null)
  const list=state.activities.filter(a=>a.opportunityId===opp.id).sort((a,b)=>Number(a.done)-Number(b.done)||`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  return <div>
    <button className="btn primary" onClick={()=>openActivity(opp.id)}><Plus/>Nova atividade</button>
    <div className="list-stack spaced">{list.map(a=><div className="activity-row" key={a.id}><span className={`status-dot ${a.done?'success':isActivityOverdue(a)?'danger':''}`}/><div className="grow"><b>{a.type}</b><small>{dateBR(a.date)} {a.time} · {a.priority}</small>{a.note&&<p>{a.note}</p>}</div>{!a.done&&<button className="btn small success" onClick={()=>setCompleting(a)}>Concluir + próximo</button>}<button className="btn small" onClick={()=>openActivity(opp.id,a)}>Editar</button></div>)}{!list.length&&<div className="empty">Nenhuma atividade. Agende o próximo passo para esta oportunidade.</div>}</div>
    <CompleteActivityModal activity={completing} onClose={()=>setCompleting(null)}/>
  </div>
}
