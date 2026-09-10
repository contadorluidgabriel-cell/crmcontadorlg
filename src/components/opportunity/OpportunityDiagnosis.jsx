import React, { useEffect, useState } from 'react'
import { DIAG_SCHEMAS } from '../../data/catalog.js'

export default function OpportunityDiagnosis({opp,onSave}){
  const first=opp.items[0]?.name
  const schema=DIAG_SCHEMAS[first]||[['need','Necessidade principal','text'],['urgency','Urgência','text'],['details','Detalhes','text']]
  const [data,setData]=useState(opp.diagnosis||{})
  useEffect(()=>setData(opp.diagnosis||{}),[opp.id])
  return <div>
    <div className="notice">Diagnóstico principal baseado em <b>{first||'serviço geral'}</b>. Os demais serviços permanecem vinculados à mesma oportunidade.</div>
    <div className="form-grid two">{schema.map(([key,label,type])=><label className="field" key={key}><span>{label}</span>{type==='select'?<select value={data[key]||''} onChange={e=>setData(v=>({...v,[key]:e.target.value}))}><option value="">Não informado</option><option>Sim</option><option>Não</option><option>Avaliar</option></select>:<input value={data[key]||''} onChange={e=>setData(v=>({...v,[key]:e.target.value}))}/>}</label>)}</div>
    <label className="field"><span>Conclusão do diagnóstico</span><textarea value={data.notes||''} onChange={e=>setData(v=>({...v,notes:e.target.value}))}/></label>
    <button className="btn primary" onClick={()=>onSave(data)}>Salvar diagnóstico</button>
  </div>
}
