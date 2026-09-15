import React, { useEffect, useMemo, useState } from 'react'
import { Check, Printer, X } from 'lucide-react'
import { getCurrentProposal, proposalExpiry, proposalTotals } from '../../lib/domain.js'
import { addDays, dateBR, money, todayStr } from '../../lib/utils.js'
import { printProposal } from '../../lib/proposalPrint.js'

const defaultPricing=()=>({oneOffDiscountType:'amount',oneOffDiscountValue:0,mrrDiscountPercent:0,mrrDiscountType:'permanent',mrrDiscountMonths:0})
const freshProposal=opp=>({status:'Rascunho',items:structuredClone(opp.items),pricing:defaultPricing(),payment:'PIX',validity:addDays(todayStr(),7),scope:'',notIncluded:'',deadline:'',clientNotes:'',notes:''})

export default function ProposalWorkspace({opp,state,onSave,onWhatsApp,onWon,notify}){
  const current=getCurrentProposal(opp)
  const [draft,setDraft]=useState(()=>current?structuredClone(current):freshProposal(opp))
  useEffect(()=>setDraft(current?structuredClone(current):freshProposal(opp)),[opp.id,opp.proposals.length,current?.version])
  const maxDiscount=Number(state.settings?.commercialRules?.maxDiscountPercent||40)
  const locked=['Ganho','Perdido'].includes(opp.stage)
  const totals=useMemo(()=>proposalTotals(draft),[draft])
  const expiry=proposalExpiry(current)

  const addService=id=>{
    const service=state.settings.services.find(x=>x.id===id)
    if(!service||draft.items.some(i=>i.serviceId===id))return
    setDraft(v=>({...v,items:[...v.items,{serviceId:service.id,name:service.proposalName||service.name,tableOneOff:service.baseOneOff,tableMrr:service.baseMrr,oneOff:service.baseOneOff,mrr:service.baseMrr}]}))
  }
  const patchItem=(idx,key,value)=>setDraft(v=>({...v,items:v.items.map((item,n)=>n===idx?{...item,[key]:value}:item)}))
  const patchPricing=(key,value)=>setDraft(v=>({...v,pricing:{...defaultPricing(),...(v.pricing||{}),[key]:value}}))
  const print=()=>{
    if(!current){notify('Salve a proposta antes de gerar o PDF.','warning');return}
    if(!printProposal(state,opp,current))notify('O navegador bloqueou a abertura do PDF. Libere pop-ups e tente novamente.','warning')
  }

  return <div>
    {locked&&<div className="notice warning"><b>Proposta histórica bloqueada</b><br/>A oportunidade está {opp.stage.toLowerCase()}. Os valores foram preservados para não alterar a receita histórica. Para uma nova negociação, reative quando aplicável ou crie outra oportunidade.</div>}
    <div className="proposal-summary">
      <div><span>Versão atual</span><b>{current?`V${current.version}`:'Nova'}</b><small>{current?.code||'Será gerado ao salvar'}</small></div>
      <div><span>Avulso final</span><b>{money(totals.oneOff)}</b>{totals.oneOffDiscount>0&&<small>Base {money(totals.baseOneOff)} · desconto {money(totals.oneOffDiscount)}</small>}</div>
      <div><span>MRR final</span><b>{money(totals.mrr)}</b>{totals.mrrDiscount>0&&<small>Base {money(totals.baseMrr)} · desconto {money(totals.mrrDiscount)}/mês</small>}</div>
      <div><span>Validade</span><b className={expiry<0?'text-danger':''}>{current?dateBR(current.validity):dateBR(draft.validity)}</b>{current&&<small>{expiry<0?`Vencida há ${Math.abs(expiry)} dias`:expiry===0?'Vence hoje':`${expiry} dias restantes`}</small>}</div>
    </div>

    <fieldset disabled={locked} className="proposal-fieldset">
      <div className="section-heading"><h3>Escopo comercial</h3><p>Estes campos alimentam a proposta que será enviada ao cliente.</p></div>
      <label className="field"><span>O que está incluído</span><textarea value={draft.scope||''} onChange={e=>setDraft(v=>({...v,scope:e.target.value}))} placeholder={'Ex.:\n• Análise das pendências\n• Regularização cadastral\n• Entrega e orientação final'}/></label>
      <label className="field"><span>O que não está incluído</span><textarea value={draft.notIncluded||''} onChange={e=>setDraft(v=>({...v,notIncluded:e.target.value}))} placeholder="Taxas públicas, certificados, serviços extraordinários..."/></label>
      <div className="form-grid two"><label className="field"><span>Prazo estimado</span><input value={draft.deadline||''} onChange={e=>setDraft(v=>({...v,deadline:e.target.value}))} placeholder="Ex.: até 10 dias úteis após documentos"/></label><label className="field"><span>Validade</span><input type="date" value={draft.validity||''} onChange={e=>setDraft(v=>({...v,validity:e.target.value}))}/></label></div>

      <div className="section-heading"><h3>Itens e valores-base</h3><p>Os descontos são registrados separadamente para preservar preço de tabela e preço final.</p></div>
      <div className="service-list">{draft.items.map((item,idx)=><div className="proposal-item" key={`${item.serviceId}-${idx}`}><div className="grow"><b>{item.name}</b></div><label>Avulso base<input type="number" min="0" value={item.oneOff} onChange={e=>patchItem(idx,'oneOff',e.target.value)}/></label><label>MRR base<input type="number" min="0" value={item.mrr} onChange={e=>patchItem(idx,'mrr',e.target.value)}/></label><button type="button" className="icon-button danger" onClick={()=>setDraft(v=>({...v,items:v.items.filter((_,n)=>n!==idx)}))} aria-label="Remover serviço"><X/></button></div>)}</div>
      <label className="field"><span>Adicionar serviço</span><select value="" onChange={e=>{addService(e.target.value);e.target.value=''}}><option value="">Selecione...</option>{state.settings.services.filter(s=>!draft.items.some(i=>i.serviceId===s.id)).map(s=><option value={s.id} key={s.id}>{s.name}{s.requiresHumanReview?' · sob análise':''}</option>)}</select></label>

      <div className="section-heading"><h3>Negociação e desconto</h3><p>Política atual: até {maxDiscount}% de desconto. Em mensalidades, descontos altos devem preferencialmente ser temporários.</p></div>
      <div className="form-grid two">
        <label className="field"><span>Tipo de desconto no avulso</span><select value={draft.pricing?.oneOffDiscountType||'amount'} onChange={e=>patchPricing('oneOffDiscountType',e.target.value)}><option value="amount">Valor em R$</option><option value="percent">Percentual</option></select></label>
        <label className="field"><span>{draft.pricing?.oneOffDiscountType==='percent'?'Desconto avulso (%)':'Desconto avulso (R$)'}</span><input type="number" min="0" max={draft.pricing?.oneOffDiscountType==='percent'?maxDiscount:undefined} value={draft.pricing?.oneOffDiscountValue||0} onChange={e=>patchPricing('oneOffDiscountValue',e.target.value)}/></label>
        <label className="field"><span>Desconto na mensalidade (%)</span><input type="number" min="0" max={maxDiscount} value={draft.pricing?.mrrDiscountPercent||0} onChange={e=>patchPricing('mrrDiscountPercent',e.target.value)}/></label>
        <label className="field"><span>Tipo do desconto mensal</span><select value={draft.pricing?.mrrDiscountType||'permanent'} onChange={e=>patchPricing('mrrDiscountType',e.target.value)}><option value="permanent">Permanente</option><option value="temporary">Temporário</option></select></label>
        {(draft.pricing?.mrrDiscountType||'permanent')==='temporary'&&<label className="field"><span>Duração do desconto (meses)</span><input type="number" min="1" value={draft.pricing?.mrrDiscountMonths||1} onChange={e=>patchPricing('mrrDiscountMonths',e.target.value)}/></label>}
        <label className="field"><span>Status</span><select value={draft.status} onChange={e=>setDraft(v=>({...v,status:e.target.value}))}>{['Rascunho','Enviada','Negociação','Aceita','Recusada'].map(s=><option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Condição de pagamento</span><input value={draft.payment||''} onChange={e=>setDraft(v=>({...v,payment:e.target.value}))} placeholder="Ex.: 50% na entrada + saldo na conclusão"/></label>
      </div>
      <label className="field"><span>Observações ao cliente</span><textarea value={draft.clientNotes||''} onChange={e=>setDraft(v=>({...v,clientNotes:e.target.value}))} placeholder="Informações que devem aparecer no PDF."/></label>
      <label className="field"><span>Observação interna</span><textarea value={draft.notes||''} onChange={e=>setDraft(v=>({...v,notes:e.target.value}))} placeholder="Não precisa constar na proposta enviada."/></label>
    </fieldset>

    <div className="actions proposal-actions">{!locked&&<><button className="btn primary" onClick={()=>onSave(draft,false)}>Salvar proposta</button>{current&&<button className="btn" onClick={()=>onSave(draft,true)}>Criar nova versão</button>}</>}<button className="btn" onClick={print}><Printer/>PDF / imprimir</button>{!locked&&<><button className="btn" onClick={onWhatsApp}>WhatsApp</button><button className="btn success" onClick={onWon}><Check/>Marcar como ganho</button></>}</div>

    {opp.proposals.length>0&&<><div className="section-heading"><h3>Histórico de versões</h3><p>Versões enviadas não desaparecem quando a negociação muda.</p></div><div className="version-list">{[...opp.proposals].sort((a,b)=>b.version-a.version).map(v=>{const t=proposalTotals(v);return <div className="version-row" key={v.id}><span><b>V{v.version} · {v.status}</b><small>{v.code||'Sem código'} · criada em {dateBR(v.createdAt)} · {v.items.map(i=>i.name).join(' + ')}</small></span><span>{money(t.oneOff)}<small>{money(t.mrr)}/mês</small></span></div>})}</div></>}
  </div>
}
