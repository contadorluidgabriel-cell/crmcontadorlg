import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileJson, Upload } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import { applyAnalystImport, prepareAnalystImport } from '../lib/analystImport.js'
import { money, normDoc, normEmail, normPhone } from '../lib/utils.js'

const SOURCES=['Instagram','Indicação','WhatsApp','Anúncio','Google','Cliente antigo','Prospecção','Outro']

export default function ImportAnalyst({openOpportunity}){
  const {state,setState,notify}=useCrm()
  const [prepared,setPrepared]=useState(null)
  const [fileName,setFileName]=useState('')
  const [readError,setReadError]=useState('')
  const [source,setSource]=useState('Outro')
  const [contactMode,setContactMode]=useState('new')
  const [contactId,setContactId]=useState('')
  const [contact,setContact]=useState({name:'',phone:'',email:''})
  const [primaryServiceId,setPrimaryServiceId]=useState('')

  const existingCompany=useMemo(()=>prepared?state.companies.find(c=>normDoc(c.doc)===prepared.company.cnpj):null,[prepared,state.companies])
  const matchedContact=useMemo(()=>{
    if(!prepared)return null
    const p=normPhone(prepared.contact.phone),e=normEmail(prepared.contact.email)
    return state.contacts.find(c=>(p&&normPhone(c.phone)===p)||(e&&normEmail(c.email)===e))||null
  },[prepared,state.contacts])
  const alreadyImported=useMemo(()=>prepared?state.opportunities.find(o=>o.importMeta?.exportId===prepared.exportId):null,[prepared,state.opportunities])

  const loadFile=file=>{
    if(!file)return
    setReadError('');setFileName(file.name)
    const reader=new FileReader()
    reader.onload=()=>{
      try{
        const next=prepareAnalystImport(String(reader.result||''),state.settings.services)
        setPrepared(next)
        setPrimaryServiceId(next.suggestedPrimaryServiceId)
        setContact({name:next.contact.name,phone:next.contact.phone,email:next.contact.email})
        const p=normPhone(next.contact.phone),e=normEmail(next.contact.email)
        const found=state.contacts.find(c=>(p&&normPhone(c.phone)===p)||(e&&normEmail(c.email)===e))||null
        if(found){setContactMode('existing');setContactId(found.id)}else{setContactMode('new');setContactId('')}
      }catch(err){setPrepared(null);setReadError(err?.message||'Não foi possível ler o JSON.')}
    }
    reader.readAsText(file)
  }

  const effectiveDiscount=prepared?.totals.tableOneOff?prepared.totals.oneOffDiscount/prepared.totals.tableOneOff*100:0
  const maxDiscount=Number(state.settings?.commercialRules?.maxDiscountPercent||40)
  const contactReady=contactMode==='existing'?Boolean(contactId):Boolean(contact.name.trim())
  const canImport=prepared&&!prepared.errors.length&&!alreadyImported&&contactReady&&!state.recovery?.blocked

  const doImport=()=>{
    if(!canImport)return
    try{
      const result=applyAnalystImport(state,prepared,{
        source,
        primaryServiceId,
        contactId:contactMode==='existing'?contactId:'',
        contact:contactMode==='new'?contact:undefined,
      })
      setState(result.state)
      notify('Análise importada. A oportunidade e a proposta foram criadas como rascunho.')
      openOpportunity?.(result.opportunityId,'proposal')
    }catch(err){notify(err?.message||'Falha ao importar o arquivo.','danger')}
  }

  return <div>
    <section className="panel">
      <div className="panel-head"><div><h2>Importar do Analista de Proposta</h2><small>Adiciona dados ao CRM. Não substitui o backup nem apaga registros existentes.</small></div></div>
      <div className="panel-body">
        <div className="notice"><b>Fluxo seguro</b><br/>O CRM valida o contrato JSON, reconcilia os serviços com o catálogo, procura o CNPJ existente e mostra uma prévia antes de gravar.</div>
        <div className="actions spaced">
          <label className="btn primary"><Upload/>Selecionar JSON<input type="file" hidden accept="application/json,.json" onChange={e=>{loadFile(e.target.files?.[0]);e.target.value=''}}/></label>
          {fileName&&<span className="muted"><FileJson style={{display:'inline-block',verticalAlign:'middle',marginRight:6}}/>{fileName}</span>}
        </div>
        {readError&&<div className="notice warning spaced"><b>Arquivo não carregado</b><br/>{readError}</div>}
      </div>
    </section>

    {prepared&&<>
      {(prepared.errors.length>0||alreadyImported)&&<div className="notice warning spaced"><b>Importação bloqueada</b><br/>{alreadyImported?'Este export_id já existe no CRM. O mesmo arquivo não será importado novamente.':prepared.errors.join(' ')}</div>}
      {prepared.warnings.map((w,i)=><div className="notice warning spaced" key={i}><AlertTriangle/><b>Conferir</b><br/>{w}</div>)}
      {effectiveDiscount>maxDiscount&&<div className="notice warning spaced"><b>Desconto acima da política</b><br/>O desconto efetivo da entrada é {effectiveDiscount.toFixed(2)}% e a política atual é {maxDiscount}%. Revise antes de enviar a proposta.</div>}

      <div className="two-grid">
        <section className="setting-card" style={{padding:20}}>
          <h2>Empresa</h2>
          <p><b>{prepared.company.name||'Sem razão social'}</b><br/><span className="muted">CNPJ {prepared.company.cnpj}</span></p>
          <div className={existingCompany?'notice success':'notice'}>{existingCompany?<><CheckCircle2/><b>Empresa já cadastrada</b><br/>O importador vinculará a oportunidade a {existingCompany.name} e não criará outro CNPJ.</>:<><b>Nova empresa</b><br/>Será criado um único cadastro para este CNPJ.</>}</div>
          <div className="spaced"><span className="eyebrow">Regime</span><b>{prepared.company.taxRegime||'Não informado'}</b></div>
          {prepared.company.mainActivity&&<div className="spaced"><span className="eyebrow">Atividade principal</span><b>{prepared.company.mainActivity.description}</b><small className="muted"> {prepared.company.mainActivity.cnae}</small></div>}
        </section>

        <section className="setting-card" style={{padding:20}}>
          <h2>Contato responsável</h2>
          {matchedContact&&<div className="notice success spaced"><b>Contato localizado</b><br/>{matchedContact.name} coincide com telefone/e-mail do arquivo.</div>}
          <div className="filter-group spaced">
            <button type="button" className="filter-chip" aria-pressed={contactMode==='existing'} onClick={()=>setContactMode('existing')}>Usar contato existente</button>
            <button type="button" className="filter-chip" aria-pressed={contactMode==='new'} onClick={()=>setContactMode('new')}>Cadastrar contato</button>
          </div>
          {contactMode==='existing'?<label className="field spaced"><span>Contato</span><select value={contactId} onChange={e=>setContactId(e.target.value)}><option value="">Selecione...</option>{[...state.contacts].sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option value={c.id} key={c.id}>{c.name}{c.phone?` · ${c.phone}`:''}</option>)}</select></label>:<div className="form-grid spaced"><label className="field"><span>Nome *</span><input value={contact.name} onChange={e=>setContact(v=>({...v,name:e.target.value}))} placeholder="Responsável pelo cliente"/></label><label className="field"><span>WhatsApp</span><input value={contact.phone} onChange={e=>setContact(v=>({...v,phone:e.target.value}))}/></label><label className="field"><span>E-mail</span><input value={contact.email} onChange={e=>setContact(v=>({...v,email:e.target.value}))}/></label></div>}
          {!contactReady&&<div className="notice warning spaced"><b>Contato obrigatório</b><br/>O arquivo não informou o responsável. Selecione um contato existente ou cadastre o nome antes de importar.</div>}
        </section>
      </div>

      <section className="panel spaced">
        <div className="panel-head"><div><h2>Serviços e proposta</h2><small>{prepared.exportId} · integração {prepared.integrationVersion}</small></div></div>
        <div className="panel-body">
          <div className="proposal-summary">
            <div><span>Tabela avulsa</span><b>{money(prepared.totals.tableOneOff)}</b></div>
            <div><span>Desconto entrada</span><b>{money(prepared.totals.oneOffDiscount)}</b><small>{effectiveDiscount.toFixed(2)}%</small></div>
            <div><span>Entrada final</span><b>{money(prepared.totals.finalOneOff)}</b></div>
            <div><span>MRR final</span><b>{money(prepared.totals.finalMrr)}</b></div>
          </div>
          <div className="service-list spaced">{prepared.services.map(s=><div className="service-row" key={s.serviceId}><span><b>{s.name}</b><small>{s.serviceId} · {s.billingType==='recurring'?'Recorrente':'Avulso'}{s.quantity>1?` · quantidade ${s.quantity}`:''}</small></span><span><b>{money(s.billingType==='recurring'?s.tableMrr:s.tableOneOff)}</b><small>Preço-base importado</small></span></div>)}</div>
          <div className="form-grid two spaced">
            <label className="field"><span>Serviço principal</span><select value={primaryServiceId} onChange={e=>setPrimaryServiceId(e.target.value)}>{prepared.services.map(s=><option value={s.serviceId} key={s.serviceId}>{s.name}</option>)}</select></label>
            <label className="field"><span>Origem comercial</span><select value={source} onChange={e=>setSource(e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></label>
          </div>
        </div>
      </section>

      <div className="two-grid">
        <section className="setting-card" style={{padding:20}}><h2>Diagnóstico importado</h2><p><b>{prepared.analysis.main_need||'Sem necessidade principal informada'}</b></p><p className="muted">{prepared.analysis.current_situation}</p><p>{prepared.analysis.recommended_solution}</p></section>
        <section className="setting-card" style={{padding:20}}><h2>O que será criado</h2><div className="list-stack spaced"><div className="list-row"><span className="status-dot success"/><span><b>{existingCompany?'Vincular empresa':'Criar empresa'}</b><small>{prepared.company.name}</small></span></div><div className="list-row"><span className="status-dot success"/><span><b>{contactMode==='existing'?'Vincular contato':'Criar contato'}</b><small>{contactMode==='existing'?(state.contacts.find(c=>c.id===contactId)?.name||'Selecione um contato'):(contact.name||'Informe o responsável')}</small></span></div><div className="list-row"><span className="status-dot success"/><span><b>Criar oportunidade em Proposta</b><small>Com diagnóstico e histórico da importação</small></span></div><div className="list-row"><span className="status-dot success"/><span><b>Criar proposta V1 como Rascunho</b><small>Você revisa antes de gerar o PDF e enviar ao cliente</small></span></div></div></section>
      </div>

      <div className="actions spaced" style={{justifyContent:'flex-end'}}><button className="btn primary" disabled={!canImport} onClick={doImport}><CheckCircle2/>Importar para o CRM</button></div>
    </>}
  </div>
}
