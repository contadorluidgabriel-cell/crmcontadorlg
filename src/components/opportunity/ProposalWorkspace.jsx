import React, { useEffect, useMemo, useState } from 'react'
import { Check, Printer, X } from 'lucide-react'
import { getCurrentProposal, proposalExpiry } from '../../lib/domain.js'
import { addDays, dateBR, money, todayStr } from '../../lib/utils.js'
import { printProposal } from '../../lib/proposalPrint.js'

const freshProposal=opp=>({status:'Rascunho',items:structuredClone(opp.items),discount:0,payment:'PIX',validity:addDays(todayStr(),7),scope:'',notIncluded:'',deadline:'',clientNotes:'',notes:''})

export default function ProposalWorkspace({opp,state,onSave,onWhatsApp,onWon,notify}){
  const current=getCurrentProposal(opp)
  const [draft,setDraft]=useState(()=>current?structuredClone(current):freshProposal(opp))
  useEffect(()=>setDraft(current?structuredClone(current):freshProposal(opp)),[opp.id,opp.proposals.length,current?.version])
  const totals=useMemo(()=>({one:draft.items.reduce((s,i)=>s+Number(i.oneOff||0),0)-Number(draft.discount||0),mrr:draft.items.reduce((s,i)=>s+Number(i.mrr||0),0)}),[draft])
  const expiry=proposalExpiry(current)

  const addService=id=>{
    const service=state.settings.services.find(x=>x.id===id)
    if(!service||draft.items.some(i=>i.serviceId===id))return
    setDraft(v=>({...v,items:[...v.items,{serviceId:service.id,name:service.name,oneOff:service.baseOneOff,mrr:service.baseMrr}]}))
  }
  const patchItem=(idx,key,value)=>setDraft(v=>({...v,items:v.items.map((item,n)=>n===idx?{...item,[key]:value}:item)}))
  const print=()=>{
    if(!current){notify('Salve a proposta antes de gerar o PDF.','warning');return}
    if(!printProposal(state,opp,current))notify('O navegador bloqueou a abertura do PDF. Libere pop-ups e tente novamente.','warning')
  }

  return <div>
    <div className="proposal-summary">
      <div><span>Versão atual</span><b>{current?`V${current.version}`:'Nova'}</b><small>{current?.code||'Será gerado ao salvar'}</small></div>
      <div><span>Avulso</span><b>{money(totals.one)}</b></div>
      <div><span>MRR</span><b>{money(totals.mrr)}</b></div>
      <div><span>Validade</span><b className={expiry<0?'text-danger':''}>{current?dateBR(current.validity):dateBR(draft.validity)}</b>{current&&<small>{expiry<0?`Vencida há ${Math.abs(expiry)} dias`:expiry===0?'Vence hoje':`${expiry} dias restantes`}</small>}</div>
    </div>

    <div className="section-heading"><h3>Escopo comercial</h3><p>Estes campos alimentam a proposta que será enviada ao cliente.</p></div>
    <label className="field"><span>O que está incluído</span><textarea value={draft.scope||''} onChange={e=>setDraft(v=>({...v,scope:e.target.value}))} placeholder={'Ex.:\n• Análise das pendências\n• Regularização cadastral\n• Entrega e orientação final'}/></label>
    <label className="field"><span>O que não está incluído</span><textarea value={draft.notIncluded||''} onChange={e=>setDraft(v=>({...v,notIncluded:e.target.value}))} placeholder="Taxas públicas, certificados, serviços extraordinários..."/></label>
    <div className="form-grid two"><label className="field"><span>Prazo estimado</span><input value={draft.deadline||''} onChange={e=>setDraft(v=>({...v,deadline:e.target.value}))} placeholder="Ex.: até 10 dias úteis após documentos"/></label><label className="field"><span>Validade</span><input type="date" value={draft.validity||''} onChange={e=>setDraft(v=>({...v,validity:e.target.value}))}/></label></div>

    <div className="section-heading"><h3>Itens e valores</h3></div>
    <div className="service-list">{draft.items.map((item,idx)=><div className="proposal-item" key={`${item.serviceId}-${idx}`}><div className="grow"><b>{item.name}</b></div><label>Avulso<input type="number" min="0" value={item.oneOff} onChange={e=>patchItem(idx,'oneOff',e.target.value)}/></label><label>MRR<input type="number" min="0" value={item.mrr} onChange={e=>patchItem(idx,'mrr',e.target.value)}/></label><button className="icon-button danger" onClick={()=>setDraft(v=>({...v,items:v.items.filter((_,n)=>n!==idx)}))} aria-label="Remover serviço"><X/></button></div>)}</div>
    <label className="field"><span>Adicionar serviço</span><select value="" onChange={e=>{addService(e.target.value);e.target.value=''}}><option value="">Selecione...</option>{state.settings.services.filter(s=>!draft.items.some(i=>i.serviceId===s.id)).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>

    <div className="form-grid two"><label className="field"><span>Desconto no avulso</span><input type="number" min="0" value={draft.discount||0} onChange={e=>setDraft(v=>({...v,discount:e.target.value}))}/></label><label className="field"><span>Status</span><select value={draft.status} onChange={e=>setDraft(v=>({...v,status:e.target.value}))}>{['Rascunho','Enviada','Negociação','Aceita','Recusada'].map(s=><option key={s}>{s}</option>)}</select></label><label className="field"><span>Condição de pagamento</span><input value={draft.payment||''} onChange={e=>setDraft(v=>({...v,payment:e.target.value}))} placeholder="Ex.: 50% na entrada + saldo na conclusão"/></label></div>
    <label className="field"><span>Observações ao cliente</span><textarea value={draft.clientNotes||''} onChange={e=>setDraft(v=>({...v,clientNotes:e.target.value}))} placeholder="Informações que devem aparecer no PDF."/></label>
    <label className="field"><span>Observação interna</span><textarea value={draft.notes||''} onChange={e=>setDraft(v=>({...v,notes:e.target.value}))} placeholder="Não precisa constar na proposta enviada."/></label>

    <div className="actions proposal-actions"><button className="btn primary" onClick={()=>onSave(draft,false)}>Salvar proposta</button>{current&&<button className="btn" onClick={()=>onSave(draft,true)}>Criar nova versão</button>}<button className="btn" onClick={print}><Printer/>PDF / imprimir</button><button className="btn" onClick={onWhatsApp}>WhatsApp</button><button className="btn success" onClick={onWon}><Check/>Marcar como ganho</button></div>

    {opp.proposals.length>0&&<><div className="section-heading"><h3>Histórico de versões</h3><p>Versões enviadas não desaparecem quando a negociação muda.</p></div><div className="version-list">{[...opp.proposals].sort((a,b)=>b.version-a.version).map(v=><div className="version-row" key={v.id}><span><b>V{v.version} · {v.status}</b><small>{v.code||'Sem código'} · criada em {dateBR(v.createdAt)} · {v.items.map(i=>i.name).join(' + ')}</small></span><span>{money(v.items.reduce((s,i)=>s+Number(i.oneOff||0),0)-Number(v.discount||0))}<small>{money(v.items.reduce((s,i)=>s+Number(i.mrr||0),0))}/mês</small></span></div>)}</div></>}
  </div>
}
