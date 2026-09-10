import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { getContact, serviceNames } from '../lib/domain.js'
import { todayStr } from '../lib/utils.js'

export default function ActivityModal({open,onClose,opportunityId='',activity=null}){
 const {state,addActivity,updateActivity,notify}=useCrm();const [form,setForm]=useState({opportunityId:'',type:'WhatsApp',date:todayStr(),time:'09:00',priority:'Média',note:''})
 useEffect(()=>{if(!open)return;setForm(activity?{...activity}:{opportunityId:opportunityId||state.opportunities.find(o=>!['Ganho','Perdido'].includes(o.stage))?.id||'',type:'WhatsApp',date:todayStr(),time:'09:00',priority:'Média',note:''})},[open,opportunityId,activity])
 const save=()=>{if(!form.opportunityId||!form.date)return;activity?updateActivity(activity.id,form):addActivity(form);notify(activity?'Atividade atualizada.':'Atividade criada.');onClose()}
 return <Modal open={open} onClose={onClose} title={activity?'Editar atividade':'Nova atividade'} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
   <div className="form-grid two"><label className="field"><span>Oportunidade</span><select value={form.opportunityId} onChange={e=>setForm(f=>({...f,opportunityId:e.target.value}))}>{state.opportunities.filter(o=>!['Ganho','Perdido'].includes(o.stage)).map(o=><option value={o.id} key={o.id}>{getContact(state,o)?.name} — {serviceNames(o)}</option>)}</select></label><label className="field"><span>Tipo</span><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{['WhatsApp','Ligação','Reunião','Follow-up','Enviar proposta','Solicitar documento','Retornar cliente','Outra'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Data</span><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></label><label className="field"><span>Horário</span><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></label><label className="field"><span>Prioridade</span><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}><option>Alta</option><option>Média</option><option>Baixa</option></select></label></div><label className="field"><span>Observação</span><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></label>
 </Modal>
}
