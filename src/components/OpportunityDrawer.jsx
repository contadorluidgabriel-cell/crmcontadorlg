import React, { useEffect, useState } from 'react'
import { ExternalLink, Plus, X } from 'lucide-react'
import Modal from './Modal.jsx'
import OpportunitySummary from './opportunity/OpportunitySummary.jsx'
import OpportunityDiagnosis from './opportunity/OpportunityDiagnosis.jsx'
import ProposalWorkspace from './opportunity/ProposalWorkspace.jsx'
import OpportunityActivities from './opportunity/OpportunityActivities.jsx'
import OpportunityHistory from './opportunity/OpportunityHistory.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { getCompany, getContact, nextActivity, opportunityTotals, scoreBreakdown, serviceNames, stageAge } from '../lib/domain.js'
import { addDays, dateBR, money, normPhone, todayStr } from '../lib/utils.js'

export default function OpportunityDrawer({id,initialTab='summary',onClose,openActivity}){
  const {state,updateContactCompany,setStage,saveDiagnosis,saveProposal,markWon,markLost,defer,recordContact,notify}=useCrm()
  const opp=state.opportunities.find(o=>o.id===id)
  const contact=opp&&getContact(state,opp),company=opp&&getCompany(state,opp)
  const [tab,setTab]=useState(initialTab)
  const [action,setAction]=useState(null)
  const [editOpen,setEditOpen]=useState(false)
  useEffect(()=>setTab(initialTab),[id,initialTab])
  if(!opp)return null

  const score=scoreBreakdown(state,opp),next=nextActivity(state,opp.id),totals=opportunityTotals(opp)
  const changeStage=stage=>{
    if(stage==='Perdido')setAction('lost')
    else if(stage==='Adiado')setAction('defer')
    else if(stage==='Ganho')setAction('won')
    else{setStage(opp.id,stage);notify('Etapa atualizada.')}
  }
  const openWhatsApp=()=>{
    const phone=normPhone(contact?.phone)
    if(phone.length<10){notify('Cadastre um WhatsApp válido.','warning');return}
    const key=opp.stage==='Novo lead'?'first':opp.stage==='Proposta'?'proposal':opp.stage==='Adiado'||opp.stage==='Perdido'?'reactivation':'follow'
    const raw=state.settings.messages[key]||state.settings.messages.follow
    const text=raw.replaceAll('{nome}',(contact?.name||'').split(' ')[0]).replaceAll('{servico}',serviceNames(opp))
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`,'_blank')
    setAction({type:'whatsapp',text})
  }

  const tabs=[['summary','Resumo'],['diagnosis','Diagnóstico'],['proposal','Proposta'],['activities','Atividades'],['history','Histórico']]
  return <>
    <div className="drawer-backdrop" onClick={onClose}/>
    <aside className="drawer show">
      <header className="drawer-head"><div><h2>{contact?.name}</h2><p>{company?.name||'Sem empresa'} · {serviceNames(opp)}</p></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X/></button></header>
      <div className="drawer-body">
        <div className="commercial-band">
          <div><span className="eyebrow">Etapa atual</span><b>{opp.stage}</b><small>{stageAge(opp)} dias nesta etapa</small></div>
          <div><span className="eyebrow">Prioridade</span><b>{score.score}/100</b><small>{opp.temp==='hot'?'Lead quente':opp.temp==='warm'?'Lead morno':'Lead frio'}</small></div>
          <div><span className="eyebrow">Potencial</span><b>{money(totals.oneOff)}</b><small>{totals.mrr?`${money(totals.mrr)}/mês de MRR`:'Sem MRR'}</small></div>
        </div>
        <div className={`next-action prominent ${!next?'missing-action':''}`}><span>Próxima ação</span><b>{next?`${next.type} · ${dateBR(next.date)}${next.time?` às ${next.time}`:''}`:'Nenhuma atividade agendada'}</b>{next?.note&&<small>{next.note}</small>}{!next&&<button className="link-btn compact" onClick={()=>openActivity(opp.id)}>Agendar próximo passo</button>}</div>
        <div className="drawer-actions"><button className="btn primary" onClick={openWhatsApp}><ExternalLink/>WhatsApp</button><button className="btn" onClick={()=>setAction('contact')}>Registrar contato</button><button className="btn" onClick={()=>openActivity(opp.id)}><Plus/>Atividade</button></div>
        <div className="tabs">{tabs.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</div>
        {tab==='summary'&&<OpportunitySummary opp={opp} contact={contact} company={company} score={score} changeStage={changeStage} onEdit={()=>setEditOpen(true)}/>} 
        {tab==='diagnosis'&&<OpportunityDiagnosis opp={opp} onSave={data=>{saveDiagnosis(opp.id,data);notify('Diagnóstico salvo.')}}/>}
        {tab==='proposal'&&<ProposalWorkspace opp={opp} state={state} notify={notify} onSave={(data,newVersion)=>{saveProposal(opp.id,data,newVersion);notify(newVersion?'Nova versão da proposta criada.':'Proposta salva.')}} onWhatsApp={openWhatsApp} onWon={()=>setAction('won')}/>} 
        {tab==='activities'&&<OpportunityActivities state={state} opp={opp} openActivity={openActivity}/>} 
        {tab==='history'&&<OpportunityHistory opp={opp}/>} 
      </div>
    </aside>
    <EditModal open={editOpen} onClose={()=>setEditOpen(false)} opp={opp} contact={contact} company={company} onSave={data=>{updateContactCompany(opp.id,data);setEditOpen(false);notify('Cadastro atualizado.')}}/>
    <ActionModal action={action} setAction={setAction} opp={opp} contact={contact} markWon={markWon} markLost={markLost} defer={defer} recordContact={recordContact} notify={notify}/>
  </>
}

function EditModal({open,onClose,opp,contact,company,onSave}){
  const [form,setForm]=useState({})
  useEffect(()=>{if(open)setForm({name:contact?.name||'',phone:contact?.phone||'',email:contact?.email||'',company:company?.name||'',doc:company?.doc||'',city:contact?.city||company?.city||'',type:company?.type||'Outro',source:opp.source||contact?.source||'Outro',temp:opp.temp,note:opp.note||''})},[open,opp.id])
  const patch=(key,value)=>setForm(x=>({...x,[key]:value}))
  return <Modal open={open} onClose={onClose} title="Editar cadastro" subtitle="Contato e empresa permanecem separados da oportunidade." size="lg" footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={()=>onSave(form)}>Salvar</button></>}>
    <div className="form-grid two"><label className="field"><span>Nome</span><input value={form.name||''} onChange={e=>patch('name',e.target.value)}/></label><label className="field"><span>WhatsApp</span><input value={form.phone||''} onChange={e=>patch('phone',e.target.value)}/></label><label className="field"><span>E-mail</span><input value={form.email||''} onChange={e=>patch('email',e.target.value)}/></label><label className="field"><span>Empresa</span><input value={form.company||''} onChange={e=>patch('company',e.target.value)}/></label><label className="field"><span>CPF/CNPJ</span><input value={form.doc||''} onChange={e=>patch('doc',e.target.value)}/></label><label className="field"><span>Cidade/UF</span><input value={form.city||''} onChange={e=>patch('city',e.target.value)}/></label><label className="field"><span>Tipo</span><select value={form.type||'Outro'} onChange={e=>patch('type',e.target.value)}><option>MEI</option><option>ME</option><option>PF</option><option>Outro</option></select></label><label className="field"><span>Origem</span><select value={form.source||'Outro'} onChange={e=>patch('source',e.target.value)}>{['Instagram','Indicação','WhatsApp','Anúncio','Google','Cliente antigo','Prospecção','Outro'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Temperatura</span><select value={form.temp||'warm'} onChange={e=>patch('temp',e.target.value)}><option value="hot">Quente</option><option value="warm">Morno</option><option value="cold">Frio</option></select></label></div>
    <label className="field"><span>Observações</span><textarea value={form.note||''} onChange={e=>patch('note',e.target.value)}/></label>
  </Modal>
}

function ActionModal({action,setAction,opp,contact,markWon,markLost,defer,recordContact,notify}){
  const [reason,setReason]=useState('')
  const [note,setNote]=useState('')
  const [date,setDate]=useState('')
  useEffect(()=>{setReason('');setNote('');setDate(action==='defer'?addDays(todayStr(),30):'')},[action])
  if(!action)return null
  const kind=typeof action==='object'?action.type:action
  if(kind==='won')return <Modal open onClose={()=>setAction(null)} title="Confirmar fechamento" footer={<><button className="btn" onClick={()=>setAction(null)}>Cancelar</button><button className="btn success" onClick={()=>{markWon(opp.id);notify('Venda marcada como ganha.');setAction(null)}}>Marcar como ganho</button></>}><div className="notice success"><b>{contact?.name}</b><br/>{serviceNames(opp)} será registrado como venda fechada. Receita avulsa e MRR usarão a data de hoje.</div></Modal>
  if(kind==='lost')return <Modal open onClose={()=>setAction(null)} title="Marcar como perdida" footer={<><button className="btn" onClick={()=>setAction(null)}>Cancelar</button><button className="btn danger" onClick={()=>{if(!reason)return;markLost(opp.id,reason,note,date);notify('Oportunidade marcada como perdida.');setAction(null)}}>Confirmar perda</button></>}><label className="field"><span>Motivo</span><select value={reason} onChange={e=>setReason(e.target.value)}><option value="">Selecione...</option>{['Preço','Não respondeu','Concorrente','Adiou','Sem orçamento','Resolveu sozinho','Sem urgência','Fora do público-alvo','Outro'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Observação</span><textarea value={note} onChange={e=>setNote(e.target.value)}/></label><label className="field"><span>Tentar reativar em (opcional)</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></Modal>
  if(kind==='defer')return <Modal open onClose={()=>setAction(null)} title="Adiar oportunidade" footer={<><button className="btn" onClick={()=>setAction(null)}>Cancelar</button><button className="btn primary" onClick={()=>{if(!date)return;defer(opp.id,date,note);notify('Retorno agendado.');setAction(null)}}>Adiar</button></>}><label className="field"><span>Retomar em</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="field"><span>Motivo / contexto</span><textarea value={note} onChange={e=>setNote(e.target.value)}/></label></Modal>
  if(kind==='contact')return <Modal open onClose={()=>setAction(null)} title="Registrar contato" footer={<><button className="btn" onClick={()=>setAction(null)}>Cancelar</button><button className="btn primary" onClick={()=>{if(!note.trim())return;recordContact(opp.id,note,date);notify('Contato registrado.');setAction(null)}}>Registrar</button></>}><label className="field"><span>O que aconteceu?</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Cliente respondeu, pediu prazo, enviou documentos..."/></label><label className="field"><span>Próximo follow-up (opcional)</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></Modal>
  if(kind==='whatsapp')return <Modal open onClose={()=>setAction(null)} title="Confirmar contato pelo WhatsApp" footer={<><button className="btn" onClick={()=>setAction(null)}>Só abri o WhatsApp</button><button className="btn primary" onClick={()=>{recordContact(opp.id,'Contato realizado pelo WhatsApp',date);notify('Contato pelo WhatsApp registrado.');setAction(null)}}>Mensagem enviada</button></>}><div className="notice"><b>O WhatsApp foi aberto.</b><br/>O CRM só atualizará a última interação se você confirmar o envio.</div><div className="message-preview">{action.text}</div><label className="field"><span>Próximo follow-up</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></Modal>
  return null
}
