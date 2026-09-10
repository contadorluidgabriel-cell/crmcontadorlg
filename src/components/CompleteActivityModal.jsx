import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { addDays, dateBR, todayStr } from '../lib/utils.js'

const presets=[['none','Encerrar sem próximo passo'],['1','Amanhã'],['3','Em 3 dias'],['7','Em 7 dias'],['custom','Escolher data']]

export default function CompleteActivityModal({activity,onClose}){
  const {completeActivity,notify}=useCrm()
  const [choice,setChoice]=useState('3')
  const [customDate,setCustomDate]=useState('')
  const [nextType,setNextType]=useState('Follow-up')

  useEffect(()=>{if(activity){setChoice('3');setCustomDate('');setNextType('Follow-up')}},[activity?.id])
  if(!activity)return null

  const resolveDate=()=>choice==='none'?'':choice==='custom'?customDate:addDays(todayStr(),Number(choice))
  const nextDate=resolveDate()
  const submit=()=>{
    if(choice==='custom'&&!customDate)return
    completeActivity(activity.id,nextDate,nextType)
    notify(nextDate?`Atividade concluída. Próximo passo em ${dateBR(nextDate)}.`:'Atividade concluída sem novo follow-up.')
    onClose()
  }

  return <Modal open title="Concluir atividade" subtitle="Feche esta ação e defina o próximo passo sem sair do fluxo." onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn success" onClick={submit}>Concluir atividade</button></>}>
    <div className="notice success"><b>{activity.type}</b><br/>{activity.note||'Sem observação registrada.'}</div>
    <div className="section-heading"><h3>Próximo passo</h3><p>Evite deixar uma negociação sem data de retorno.</p></div>
    <div className="choice-grid">{presets.map(([value,label])=><button type="button" key={value} className="choice-card" aria-pressed={choice===value} onClick={()=>setChoice(value)}>{label}</button>)}</div>
    {choice!=='none'&&<label className="field"><span>Tipo da próxima atividade</span><select value={nextType} onChange={e=>setNextType(e.target.value)}>{['Follow-up','WhatsApp','Ligação','Enviar proposta','Solicitar documento','Retornar cliente','Reunião'].map(x=><option key={x}>{x}</option>)}</select></label>}
    {choice==='custom'&&<label className="field"><span>Data</span><input type="date" min={todayStr()} value={customDate} onChange={e=>setCustomDate(e.target.value)}/></label>}
  </Modal>
}
