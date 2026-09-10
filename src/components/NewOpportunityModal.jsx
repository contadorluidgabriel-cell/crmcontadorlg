import React, { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'

const empty={name:'',phone:'',email:'',company:'',doc:'',city:'Belém/PA',type:'MEI',source:'Instagram',temp:'warm',note:''}
export default function NewOpportunityModal({open,onClose,onCreated,initialContact=null}){
  const {state,findContact,createOpportunity}=useCrm()
  const [form,setForm]=useState(empty)
  const [selected,setSelected]=useState(()=>new Set())
  const [prices,setPrices]=useState({})
  React.useEffect(()=>{if(!open)return;if(initialContact)setForm(f=>({...f,name:initialContact.name||'',phone:initialContact.phone||'',email:initialContact.email||'',city:initialContact.city||'Belém/PA',source:initialContact.source||'Instagram'}));setSelected(prev=>prev.size?prev:new Set(state.settings.services[0]?.id?[state.settings.services[0].id]:[]))},[open,initialContact,state.settings.services])
  const duplicate=useMemo(()=>open?findContact(form):null,[open,form.phone,form.email,state.contacts])
  const patch=(k,v)=>setForm(f=>({...f,[k]:v}))
  const toggleService=s=>{setSelected(prev=>{const n=new Set(prev);n.has(s.id)?n.delete(s.id):n.add(s.id);return n});setPrices(p=>({...p,[s.id]:p[s.id]||{oneOff:s.baseOneOff,mrr:s.baseMrr}}))}
  const submit=()=>{
    if(!form.name.trim()&&!duplicate)return
    const items=state.settings.services.filter(s=>selected.has(s.id)).map(s=>({serviceId:s.id,name:s.name,oneOff:Number(prices[s.id]?.oneOff ?? s.baseOneOff ?? 0),mrr:Number(prices[s.id]?.mrr ?? s.baseMrr ?? 0)}))
    if(!items.length)return
    const id=createOpportunity({...form,contactId:duplicate?.id||'',name:form.name||duplicate?.name||'',phone:form.phone||duplicate?.phone||'',email:form.email||duplicate?.email||'',items})
    setForm(empty);setSelected(new Set());setPrices({});onClose();onCreated?.(id)
  }
  const footer=<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={submit}>Criar oportunidade</button></>
  return <Modal open={open} onClose={onClose} title="Novo lead" subtitle="Cadastre o contato e uma ou mais oportunidades de serviço." footer={footer} size="lg">
    {duplicate&&<div className="notice warning"><b>Contato já cadastrado: {duplicate.name}</b><br/>Uma nova oportunidade será criada no mesmo contato, sem duplicar a pessoa.</div>}
    <div className="form-grid two"><label className="field"><span>Nome *</span><input value={form.name} onChange={e=>patch('name',e.target.value)} placeholder="Ex.: Maria Silva"/></label><label className="field"><span>WhatsApp</span><input value={form.phone} onChange={e=>patch('phone',e.target.value)} placeholder="(91) 99999-9999"/></label><label className="field"><span>E-mail</span><input value={form.email} onChange={e=>patch('email',e.target.value)} /></label><label className="field"><span>Empresa</span><input value={form.company} onChange={e=>patch('company',e.target.value)} /></label><label className="field"><span>CPF/CNPJ</span><input value={form.doc} onChange={e=>patch('doc',e.target.value)} /></label><label className="field"><span>Cidade/UF</span><input value={form.city} onChange={e=>patch('city',e.target.value)} /></label><label className="field"><span>Tipo</span><select value={form.type} onChange={e=>patch('type',e.target.value)}><option>MEI</option><option>ME</option><option>PF</option><option>Outro</option></select></label><label className="field"><span>Origem</span><select value={form.source} onChange={e=>patch('source',e.target.value)}>{['Instagram','Indicação','WhatsApp','Anúncio','Google','Cliente antigo','Prospecção','Outro'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Temperatura</span><select value={form.temp} onChange={e=>patch('temp',e.target.value)}><option value="hot">Quente</option><option value="warm">Morno</option><option value="cold">Frio</option></select></label></div>
    <div className="section-heading"><h3>Serviços da oportunidade</h3><p>Você pode vender mais de um serviço na mesma negociação.</p></div>
    <div className="service-picker">{state.settings.services.map(s=>{const active=selected.has(s.id),p=prices[s.id]||{oneOff:s.baseOneOff,mrr:s.baseMrr};return <div className={`service-pick ${active?'active':''}`} key={s.id}><label className="service-check"><input type="checkbox" checked={active} onChange={()=>toggleService(s)}/><span><b>{s.name}</b><small>{s.kind}</small></span></label>{active&&<div className="service-price"><label>Avulso<input type="number" min="0" value={p.oneOff} onChange={e=>setPrices(v=>({...v,[s.id]:{...p,oneOff:e.target.value}}))}/></label><label>MRR<input type="number" min="0" value={p.mrr} onChange={e=>setPrices(v=>({...v,[s.id]:{...p,mrr:e.target.value}}))}/></label></div>}</div>})}</div>
    <label className="field"><span>Observação inicial</span><textarea value={form.note} onChange={e=>patch('note',e.target.value)} placeholder="Necessidade, urgência, contexto..."/></label>
  </Modal>
}
