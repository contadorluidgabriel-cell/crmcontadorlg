import React from 'react'
import { useCrm } from '../context/CrmContext.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { getContact, getCurrentProposal, proposalExpiry, proposalTotals, serviceNames } from '../lib/domain.js'
import { dateBR, money } from '../lib/utils.js'
export default function Proposals({openOpportunity}){
 const {state}=useCrm();const rows=state.opportunities.map(o=>({o,p:getCurrentProposal(o)})).filter(x=>x.p)
 const open=rows.filter(x=>!['Aceita','Recusada'].includes(x.p.status)),one=open.reduce((s,x)=>s+proposalTotals(x.p).oneOff,0),mrr=open.reduce((s,x)=>s+proposalTotals(x.p).mrr,0)
 return <><div className="metrics-grid"><MetricCard label="Propostas abertas" value={open.length}/><MetricCard label="Avulso em proposta" value={money(one)}/><MetricCard label="MRR em proposta" value={money(mrr)}/><MetricCard label="Aceitas" value={rows.filter(x=>x.p.status==='Aceita').length}/></div><section className="panel table-wrap spaced"><table><thead><tr><th>Cliente</th><th>Serviços</th><th>Proposta</th><th>Implantação</th><th>Mensalidade</th><th>Validade</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(({o,p})=>{const t=proposalTotals(p),exp=proposalExpiry(p);return <tr key={o.id}><td><b>{getContact(state,o)?.name}</b></td><td>{serviceNames(o)}</td><td><b>{p.code||'Sem código'}</b><small>Versão {p.version}</small></td><td>{money(t.oneOff)}</td><td>{money(t.mrr)}</td><td>{dateBR(p.validity)}<small className={exp<0?'text-danger':exp===0?'text-warning':''}>{exp<0?`Vencida há ${Math.abs(exp)}d`:exp===0?'Vence hoje':exp!=null?`${exp}d restantes`:''}</small></td><td><span className="pill neutral">{p.status}</span></td><td><button className="link-btn" onClick={()=>openOpportunity(o.id,'proposal')}>Abrir</button></td></tr>})}{!rows.length&&<tr><td colSpan="8"><div className="empty">Nenhuma proposta criada.</div></td></tr>}</tbody></table></section></>
}
