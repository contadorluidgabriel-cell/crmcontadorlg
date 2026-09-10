import React from 'react'
import { Edit3 } from 'lucide-react'
import { STAGES } from '../../data/catalog.js'
import { lastInteractionDate } from '../../lib/domain.js'
import { dateBR, money } from '../../lib/utils.js'

export default function OpportunitySummary({opp,contact,company,score,changeStage,onEdit}){
  return <div>
    <div className="between section-row"><h3>Dados comerciais</h3><button className="btn small" onClick={onEdit}><Edit3/>Editar cadastro</button></div>
    <div className="info-grid">
      <Info label="WhatsApp" value={contact?.phone||'—'}/><Info label="E-mail" value={contact?.email||'—'}/><Info label="Empresa" value={company?.name||'—'}/><Info label="CPF/CNPJ" value={company?.doc||'—'}/><Info label="Tipo" value={company?.type||'—'}/><Info label="Origem" value={opp.source||contact?.source||'—'}/><Info label="Última interação" value={dateBR(lastInteractionDate(opp))}/><Info label="Criado em" value={dateBR(opp.createdAt)}/>
    </div>
    <label className="field"><span>Etapa</span><select value={opp.stage} onChange={e=>changeStage(e.target.value)}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></label>
    <div className="section-heading"><h3>Serviços desta oportunidade</h3></div>
    <div className="service-list">{opp.items.map((i,idx)=><div className="service-row" key={`${i.serviceId}-${idx}`}><span><b>{i.name}</b><small>{money(i.oneOff)} avulso · {money(i.mrr)}/mês</small></span></div>)}</div>
    {opp.note&&<div className="note-box"><b>Observações</b><p>{opp.note}</p></div>}
    <div className="score-card"><div className="between"><h3>Composição do score</h3><strong>{score.score}/100</strong></div>{score.parts.map(([label,value])=><div className="score-line" key={label}><span>{label}</span><b className={value<0?'negative':''}>{value>0?'+':''}{value}</b></div>)}</div>
  </div>
}
function Info({label,value}){return <div className="info"><span>{label}</span><b>{value}</b></div>}
