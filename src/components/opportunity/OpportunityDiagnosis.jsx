import React, { useEffect, useState } from 'react'
import { DIAG_SCHEMAS } from '../../data/catalog.js'

export default function OpportunityDiagnosis({opp,onSave}){
  const primaryId=opp.primaryServiceId||opp.items[0]?.serviceId
  const primary=opp.items.find(i=>i.serviceId===primaryId)||opp.items[0]
  const schema=DIAG_SCHEMAS[primaryId]||[['need','Necessidade principal','text'],['urgency','Urgência','text'],['details','Detalhes','text']]
  const [data,setData]=useState(opp.diagnosis||{})
  useEffect(()=>setData(opp.diagnosis||{}),[opp.id])
  return <div>
    <div className="notice">Diagnóstico principal baseado em <b>{primary?.name||'serviço geral'}</b>. O vínculo usa o ID estável do serviço, não o nome exibido.</div>
    <div className="form-grid two">{schema.map(([key,label,type])=><label className="field" key={key}><span>{label}</span>{type==='select'?<select value={data[key]||''} onChange={e=>setData(v=>({...v,[key]:e.target.value}))}><option value="">Não informado</option><option>Sim</option><option>Não</option><option>Avaliar</option></select>:<input value={data[key]||''} onChange={e=>setData(v=>({...v,[key]:e.target.value}))}/>}</label>)}</div>
    <label className="field"><span>Conclusão do diagnóstico</span><textarea value={data.notes||''} onChange={e=>setData(v=>({...v,notes:e.target.value}))}/></label>
    <button className="btn primary" onClick={()=>onSave(data)}>Salvar diagnóstico</button>
  </div>
}
