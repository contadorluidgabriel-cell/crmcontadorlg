import React from 'react'
import { dateTimeBR } from '../../lib/utils.js'

export default function OpportunityHistory({opp}){
  const items=[...(opp.history||[])].sort((a,b)=>new Date(b.at)-new Date(a.at))
  return <div className="timeline">{items.map(h=><div className="timeline-item" key={h.id}><span/><div><b>{h.label}</b><small>{dateTimeBR(h.at)} · {h.type}</small></div></div>)}{!items.length&&<div className="empty">Sem histórico.</div>}</div>
}
