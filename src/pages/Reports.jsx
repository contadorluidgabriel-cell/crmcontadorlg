import React from 'react'
import MetricCard from '../components/MetricCard.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { cohortData, funnelData, periodLabel, reportData } from '../lib/domain.js'
import { money } from '../lib/utils.js'

export default function Reports(){
 const {state,uiPeriod}=useCrm()
 const r=reportData(state,uiPeriod),cohort=cohortData(state,uiPeriod),funnel=funnelData(state,uiPeriod)
 const max=Math.max(1,...Object.values(r.bySource).map(x=>x.leads))
 const period=periodLabel(uiPeriod)
 return <>
  <div className="report-intro"><div><span className="eyebrow">Período global</span><h2>{period}</h2></div><p><b>Produção</b> usa a data real do fechamento/perda. <b>Coorte</b> acompanha os leads que entraram no período, mesmo que fechem depois.</p></div>
  <div className="metrics-grid"><MetricCard label="Vendas fechadas" value={r.won.length} hint={`Fechadas em ${period.toLowerCase()}`}/><MetricCard label="Receita avulsa" value={money(r.revenue.oneOff)} hint="Data real do ganho"/><MetricCard label="Novo MRR" value={money(r.revenue.mrr)} hint="Data real do ganho"/><MetricCard label="Conversão da coorte" value={`${cohort.decisionConversion.toFixed(1)}%`} hint={`${cohort.won.length} ganhos em ${cohort.won.length+cohort.lost.length} decisões da coorte`}/></div>

  <div className="two-grid">
   <section className="panel"><header className="panel-head"><div><h2>Funil da coorte</h2><small>Leads que entraram em {period.toLowerCase()}</small></div></header><div className="panel-body funnel-list">{funnel.map((row,index)=><div className="funnel-row" key={row.stage}><div className="funnel-label"><span>{row.stage}</span><b>{row.count}</b></div><div className="funnel-track"><span style={{width:`${row.fromStart}%`}}/></div><small>{index===0?'100% da entrada':`${row.fromPrevious.toFixed(1)}% da etapa anterior · ${row.fromStart.toFixed(1)}% da entrada`}</small></div>)}</div></section>
   <section className="panel"><header className="panel-head"><div><h2>Produção comercial</h2><small>Eventos ocorridos em {period.toLowerCase()}</small></div></header><div className="panel-body"><div className="production-grid"><div><span>Leads recebidos</span><b>{r.created.length}</b></div><div><span>Ganhos</span><b>{r.won.length}</b></div><div><span>Perdidos</span><b>{r.lost.length}</b></div><div><span>Decisões → ganho</span><b>{r.conversion.toFixed(1)}%</b></div></div><div className="notice"><b>Por que são números diferentes?</b><br/>Um lead pode entrar em agosto e fechar em setembro. A produção conta o fechamento em setembro; a coorte continua atribuindo esse resultado ao grupo que entrou em agosto.</div></div></section>
  </div>

  <div className="two-grid"><section className="panel"><header className="panel-head"><h2>Origem · entradas e receita</h2></header><div className="panel-body">{Object.entries(r.bySource).sort((a,b)=>b[1].leads-a[1].leads).map(([name,x])=><div className="bar-row" key={name}><span>{name}</span><div className="bar-track"><span style={{width:`${x.leads/max*100}%`}}/></div><b>{x.leads}</b><small>{x.wins} ganhos · {money(x.mrr)} MRR</small></div>)}{!Object.keys(r.bySource).length&&<div className="empty">Sem dados.</div>}</div></section><section className="panel"><header className="panel-head"><h2>Motivos de perda</h2></header><div className="panel-body list-stack">{Object.entries(r.lossReasons).map(([name,count])=><div className="list-row" key={name}><span className="status-dot danger"/><span><b>{name}</b><small>{count} negociação(ões) encerrada(s) no período</small></span></div>)}{!Object.keys(r.lossReasons).length&&<div className="empty">Sem perdas no período.</div>}</div></section></div>

  <section className="panel table-wrap spaced"><header className="panel-head"><div><h2>Conversão por serviço · coorte</h2><small>Denominador = oportunidades que entraram no período</small></div></header><table><thead><tr><th>Serviço</th><th>Entraram</th><th>Ganhos</th><th>Perdidos</th><th>Conversão das decisões</th><th>Taxa sobre entradas</th></tr></thead><tbody>{Object.entries(cohort.byService).map(([name,x])=>{const decisions=x.won+x.lost;return <tr key={name}><td><b>{name}</b></td><td>{x.entered}</td><td>{x.won}</td><td>{x.lost}</td><td>{decisions?`${(x.won/decisions*100).toFixed(1)}%`:'—'}</td><td>{x.entered?`${(x.won/x.entered*100).toFixed(1)}%`:'—'}</td></tr>})}{!Object.keys(cohort.byService).length&&<tr><td colSpan="6"><div className="empty">Sem oportunidades na coorte selecionada.</div></td></tr>}</tbody></table></section>
 </>
}
