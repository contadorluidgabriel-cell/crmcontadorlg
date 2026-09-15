import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'

const empty={name:'',phone:'',email:'',company:'',doc:'',city:'',type:'Não informado',source:'Instagram',temp:'unclassified',note:''}

export default function NewOpportunityModal({open,onClose,onCreated,initialContact=null}){
  const {state,findContact,createOpportunity}=useCrm()
  const [form,setForm]=useState(empty)
  const [advanced,setAdvanced]=useState(false)
  const [selected,setSelected]=useState(()=>new Set())
  const [prices,setPrices]=useState({})
  const [duplicateMode,setDuplicateMode]=useState('link')

  React.useEffect(()=>{
    if(!open)return
    setAdvanced(false);setDuplicateMode('link')
    if(initialContact){
      setForm(f=>({...empty,name:initialContact.name||'',phone:initialContact.phone||'',email:initialContact.email||'',city:initialContact.city||'',source:initialContact.source||'Instagram'}))
    }else setForm(empty)
    const first=state.settings.services[0]
    setSelected(new Set(first?[first.id]:[]))
    setPrices(first?{[first.id]:{oneOff:first.baseOneOff,mrr:first.baseMrr}}:{})
  },[open,initialContact,state.settings.services])

  const duplicate=useMemo(()=>open&&!initialContact?findContact(form):null,[open,form.phone,form.email,state.contacts,initialContact])
  const patch=(k,v)=>setForm(f=>({...f,[k]:v}))
  const toggleService=s=>{
    setSelected(prev=>{const n=new Set(prev);n.has(s.id)?n.delete(s.id):n.add(s.id);return n})
    setPrices(p=>({...p,[s.id]:p[s.id]||{oneOff:s.baseOneOff,mrr:s.baseMrr}}))
  }
  const setPrimary=id=>{
    const s=state.settings.services.find(x=>x.id===id);if(!s)return
    setSelected(new Set([s.id]));setPrices({[s.id]:{oneOff:s.baseOneOff,mrr:s.baseMrr}})
  }
  const submit=()=>{
    if(!form.name.trim()&&!duplicate)return
    const items=state.settings.services.filter(s=>selected.has(s.id)).map(s=>({serviceId:s.id,name:s.proposalName||s.name,tableOneOff:Number(s.baseOneOff||0),tableMrr:Number(s.baseMrr||0),oneOff:Number(prices[s.id]?.oneOff ?? s.baseOneOff ?? 0),mrr:Number(prices[s.id]?.mrr ?? s.baseMrr ?? 0)}))
    if(!items.length)return
    const id=createOpportunity({...form,contactId:duplicate&&duplicateMode==='link'?duplicate.id:'',forceNewContact:Boolean(duplicate&&duplicateMode==='new'),name:form.name||duplicate?.name||'',phone:form.phone||duplicate?.phone||'',email:form.email||duplicate?.email||'',primaryServiceId:items[0]?.serviceId||'',items})
    setForm(empty);setSelected(new Set());setPrices({});onClose();onCreated?.(id)
  }

  const primary=[...selected][0]||''
  const footer=<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={submit}>Salvar lead</button></>

  return <Modal open={open} onClose={onClose} title={initialContact?'Nova oportunidade':'Novo lead'} subtitle={advanced?'Cadastro comercial completo':'Cadastre o essencial agora e complete o restante depois.'} footer={footer} size={advanced?'lg':'md'}>
    {duplicate&&<div className="notice warning"><b>Possível contato existente: {duplicate.name}</b><br/>Telefone ou e-mail coincidem. Escolha como tratar para evitar união silenciosa de pessoas diferentes.<div className="actions spaced"><button type="button" className={`btn small ${duplicateMode==='link'?'primary':''}`} onClick={()=>setDuplicateMode('link')}>Vincular ao existente</button><button type="button" className="btn small" onClick={()=>setDuplicateMode('new')}>Criar novo contato</button></div></div>}

    <div className="quick-lead-grid">
      <label className="field"><span>Nome *</span><input autoFocus={!initialContact} value={form.name} onChange={e=>patch('name',e.target.value)} placeholder="Ex.: Maria Silva"/></label>
      <label className="field"><span>WhatsApp</span><input value={form.phone} onChange={e=>patch('phone',e.target.value)} placeholder="(91) 99999-9999"/></label>
      <label className="field"><span>Origem</span><select value={form.source} onChange={e=>patch('source',e.target.value)}>{['Instagram','Indicação','WhatsApp','Anúncio','Google','Cliente antigo','Prospecção','Outro'].map(x=><option key={x}>{x}</option>)}</select></label>
      {!advanced&&<label className="field"><span>Serviço</span><select value={primary} onChange={e=>setPrimary(e.target.value)}>{state.settings.services.map(s=><option key={s.id} value={s.id}>{s.name}{s.requiresHumanReview?' · sob análise':''}</option>)}</select></label>}
    </div>

    <button className="advanced-toggle" type="button" aria-expanded={advanced} onClick={()=>setAdvanced(v=>!v)}>{advanced?<ChevronUp/>:<ChevronDown/>}{advanced?'Ocultar dados adicionais':'Completar cadastro e valores'}</button>

    {advanced&&<>
      <div className="form-grid two">
        <label className="field"><span>E-mail</span><input value={form.email} onChange={e=>patch('email',e.target.value)}/></label>
        <label className="field"><span>Empresa</span><input value={form.company} onChange={e=>patch('company',e.target.value)}/></label>
        <label className="field"><span>CPF/CNPJ</span><input value={form.doc} onChange={e=>patch('doc',e.target.value)}/></label>
        <label className="field"><span>Cidade/UF</span><input value={form.city} onChange={e=>patch('city',e.target.value)} placeholder="Não informado"/></label>
        <label className="field"><span>Tipo</span><select value={form.type} onChange={e=>patch('type',e.target.value)}><option>Não informado</option><option>MEI</option><option>ME</option><option>PF</option><option>Outro</option></select></label>
        <label className="field"><span>Temperatura</span><select value={form.temp} onChange={e=>patch('temp',e.target.value)}><option value="unclassified">Não classificado</option><option value="hot">Quente</option><option value="warm">Morno</option><option value="cold">Frio</option></select></label>
      </div>
      <div className="section-heading"><h3>Serviços da oportunidade</h3><p>Selecione um ou mais serviços e ajuste os valores-base apenas se necessário.</p></div>
      <div className="service-picker">{state.settings.services.map(s=>{const active=selected.has(s.id),p=prices[s.id]||{oneOff:s.baseOneOff,mrr:s.baseMrr};return <div className={`service-pick ${active?'active':''}`} key={s.id}><label className="service-check"><input type="checkbox" checked={active} onChange={()=>toggleService(s)}/><span><b>{s.name}</b><small>{s.kind}{s.requiresHumanReview?' · preço sob análise':''}</small></span></label>{active&&<div className="service-price"><label>Avulso<input type="number" min="0" value={p.oneOff} onChange={e=>setPrices(v=>({...v,[s.id]:{...p,oneOff:e.target.value}}))}/></label><label>MRR<input type="number" min="0" value={p.mrr} onChange={e=>setPrices(v=>({...v,[s.id]:{...p,mrr:e.target.value}}))}/></label></div>}</div>})}</div>
      <label className="field"><span>Observação inicial</span><textarea value={form.note} onChange={e=>patch('note',e.target.value)} placeholder="Necessidade, urgência, contexto..."/></label>
    </>}
  </Modal>
}
