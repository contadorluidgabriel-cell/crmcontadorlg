import { addDays, normDoc, normEmail, normPhone, nowIso, todayStr, uid } from './utils.js'

const SERVICE_ALIASES = {
  'dasn-simei declaracao anual do mei':'MEI_DASN',
  'dasn-simei':'MEI_DASN',
  'parcelamento de debitos do mei':'MEI_PARCELAMENTO_RFB',
  'parcelamento debitos mei':'MEI_PARCELAMENTO_RFB',
  'plano essencial mei':'MEI_ESSENCIAL',
}

const normalizeText=value=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()

const sectionLabel=key=>({
  initial_regularization:'Regularização inicial',
  monthly_plan:'Plano mensal',
  recurring_service:'Serviço recorrente',
}[key]||String(key||'').replaceAll('_',' '))

const bulletList=list=>(list||[]).filter(Boolean).map(x=>`• ${x}`).join('\n')

const sectionText=obj=>Object.entries(obj||{}).map(([key,value])=>{
  if(Array.isArray(value))return `${sectionLabel(key)}\n${bulletList(value)}`
  return `${sectionLabel(key)}: ${value}`
}).join('\n\n')

const paymentText=conditions=>{
  const c=conditions||{},parts=[]
  if(c.initial_price!=null)parts.push(`Regularização inicial: R$ ${Number(c.initial_price).toFixed(2).replace('.',',')}`)
  if(c.monthly_price!=null)parts.push(`Mensalidade: R$ ${Number(c.monthly_price).toFixed(2).replace('.',',')}/mês`)
  if(Array.isArray(c.monthly_due_date_options)&&c.monthly_due_date_options.length)parts.push(`Vencimento disponível: dias ${c.monthly_due_date_options.join(', ')}`)
  if(c.first_month_rule)parts.push(c.first_month_rule)
  if(c.cancellation_notice_days!=null)parts.push(`Aviso de cancelamento: ${c.cancellation_notice_days} dias`)
  return parts.join(' · ')
}

const internalNotesText=raw=>{
  const parts=[]
  if(raw.internal_notes?.approved_structure)parts.push(`Estrutura aprovada: ${raw.internal_notes.approved_structure}`)
  if(raw.internal_notes?.commercial_strategy)parts.push(`Estratégia comercial: ${raw.internal_notes.commercial_strategy}`)
  if(raw.analysis?.confidence)parts.push(`Confiança do Analista: ${raw.analysis.confidence}`)
  if(raw.export_id)parts.push(`Importação do Analista: ${raw.export_id}`)
  return parts.join('\n')
}

const clientNotesText=raw=>[raw.client_notes?.summary,raw.client_notes?.public_charges_notice].filter(Boolean).join('\n\n')

function resolveService(rawService,catalog){
  const explicit=String(rawService?.service_id||'').trim()
  if(explicit){
    const found=catalog.find(s=>s.id===explicit)
    if(found)return found
  }
  const wanted=normalizeText(rawService?.service_name)
  if(!wanted)return null
  const aliasId=SERVICE_ALIASES[wanted]
  if(aliasId){const found=catalog.find(s=>s.id===aliasId);if(found)return found}
  return catalog.find(s=>[s.name,s.proposalName].some(name=>normalizeText(name)===wanted))||null
}

export function prepareAnalystImport(input,catalog=[]){
  const raw=typeof input==='string'?JSON.parse(input):input
  const errors=[],warnings=[]
  if(!raw||typeof raw!=='object')throw new Error('JSON vazio ou inválido.')
  if(raw.integration_version!=='1.0')errors.push(`Versão de integração não suportada: ${raw.integration_version||'não informada'}.`)
  if(raw.source!=='analista_proposta')errors.push('Origem inválida. Esperado: analista_proposta.')
  if(raw.destination!=='crm')errors.push('Destino inválido. Esperado: crm.')
  if(raw.event!=='proposal_analysis.approved'||raw.analysis?.status!=='approved')errors.push('A análise precisa estar aprovada antes da importação.')
  if(!raw.export_id)errors.push('export_id não informado.')
  const cnpj=normDoc(raw.company?.cnpj)
  if(cnpj.length!==14)errors.push('CNPJ da empresa ausente ou inválido.')
  if(!Array.isArray(raw.services)||!raw.services.length)errors.push('Nenhum serviço informado pelo Analista.')

  const unresolvedServices=[]
  const services=(raw.services||[]).map(service=>{
    const catalogService=resolveService(service,catalog)
    if(!catalogService){unresolvedServices.push(service.service_name||'Serviço sem nome');return null}
    const recurring=service.billing_type==='recurring'
    const table=Number(service.table_price||0)
    return {
      serviceId:catalogService.id,
      name:catalogService.proposalName||catalogService.name,
      catalogName:catalogService.name,
      billingType:service.billing_type||'one_time',
      quantity:Number(service.quantity||1),
      tableOneOff:recurring?0:table,
      tableMrr:recurring?table:0,
      oneOff:recurring?0:table,
      mrr:recurring?table:0,
      analystFinalPrice:Number(service.final_price||0),
      sourceService:service,
    }
  }).filter(Boolean)

  if(unresolvedServices.length)errors.push(`Serviços sem correspondência no catálogo do CRM: ${unresolvedServices.join(', ')}.`)

  const tableOneOff=services.reduce((sum,s)=>sum+s.tableOneOff,0)
  const tableMrr=services.reduce((sum,s)=>sum+s.tableMrr,0)
  const jsonOneOffTable=Number(raw.prices?.one_time?.table_total ?? tableOneOff)
  const jsonOneOffDiscount=Number(raw.prices?.one_time?.discount_total ?? Math.max(0,jsonOneOffTable-Number(raw.prices?.one_time?.final_total||jsonOneOffTable)))
  const jsonOneOffFinal=Number(raw.prices?.one_time?.final_total ?? Math.max(0,jsonOneOffTable-jsonOneOffDiscount))
  const jsonMrrTable=Number(raw.prices?.recurring?.table_monthly_total ?? tableMrr)
  const jsonMrrDiscount=Number(raw.prices?.recurring?.discount_monthly_total ?? Math.max(0,jsonMrrTable-Number(raw.prices?.recurring?.final_monthly_total||jsonMrrTable)))
  const jsonMrrFinal=Number(raw.prices?.recurring?.final_monthly_total ?? Math.max(0,jsonMrrTable-jsonMrrDiscount))

  if(Math.abs(tableOneOff-jsonOneOffTable)>.01)warnings.push(`Total avulso dos serviços (${tableOneOff}) difere do total informado em prices (${jsonOneOffTable}). O CRM usará os itens do arquivo e o desconto consolidado.`)
  if(Math.abs(tableMrr-jsonMrrTable)>.01)warnings.push(`MRR dos serviços (${tableMrr}) difere do total informado em prices (${jsonMrrTable}).`)
  if(Math.abs(Math.max(0,tableOneOff-jsonOneOffDiscount)-jsonOneOffFinal)>.01)warnings.push('O total avulso final informado não fecha exatamente com os itens e o desconto consolidado.')

  const mrrDiscountPercent=tableMrr?Number(((jsonMrrDiscount/tableMrr)*100).toFixed(6)):0
  const recurringDiscount=(raw.services||[]).find(s=>s.billing_type==='recurring'&&s.discount_type)
  const pricing={
    oneOffDiscountType:'amount',
    oneOffDiscountValue:Math.max(0,jsonOneOffDiscount),
    mrrDiscountPercent:Math.max(0,mrrDiscountPercent),
    mrrDiscountType:recurringDiscount?.discount_type==='temporary'?'temporary':'permanent',
    mrrDiscountMonths:Math.max(0,Number(recurringDiscount?.discount_months||0)),
  }

  const pains=(raw.pains||[]).map(p=>p.description).filter(Boolean)
  const alerts=(raw.alerts||[]).map(a=>`${a.level||'INFO'}: ${a.description}`).filter(Boolean)
  const diagnosisNotes=[
    raw.analysis?.current_situation&&`Situação atual: ${raw.analysis.current_situation}`,
    raw.analysis?.main_need&&`Necessidade principal: ${raw.analysis.main_need}`,
    raw.analysis?.recommended_solution&&`Solução recomendada: ${raw.analysis.recommended_solution}`,
    pains.length&&`Dores identificadas:\n${bulletList(pains)}`,
    alerts.length&&`Alertas do Analista:\n${bulletList(alerts)}`,
  ].filter(Boolean).join('\n\n')

  const diagnosis={
    notes:diagnosisNotes,
    analystSummary:raw.analysis||{},
    analystPains:raw.pains||[],
    analystAlerts:raw.alerts||[],
    taxRegime:raw.company?.tax_regime||'',
    mainActivity:raw.company?.main_activity||null,
    employees:raw.company?.employees??'',
    invoices:raw.company?.average_invoices_per_month??'',
    pending:pains.length?'Sim':'Não',
  }

  const scope=sectionText(raw.scope)
  const notIncluded=bulletList(raw.exclusions)
  const deadline=sectionText(raw.deadline)
  const suggestedPrimaryServiceId=(services.find(s=>s.billingType==='recurring')||services[0])?.serviceId||''
  const companyType=String(raw.company?.tax_regime||'').toUpperCase().includes('SIMEI')?'MEI':'Não informado'

  return {
    raw,errors,warnings,unresolvedServices,
    exportId:raw.export_id,
    integrationVersion:raw.integration_version,
    contact:{name:raw.contact?.name||'',phone:raw.contact?.phone||'',email:raw.contact?.email||''},
    company:{
      cnpj,
      name:raw.company?.trade_name||raw.company?.legal_name||'',
      legalName:raw.company?.legal_name||'',
      tradeName:raw.company?.trade_name||'',
      openingDate:raw.company?.opening_date||'',
      type:companyType,
      taxRegime:raw.company?.tax_regime||'',
      simplesStatus:raw.company?.simples_nacional_status||'',
      simeiStatus:raw.company?.simei_status||'',
      mainActivity:raw.company?.main_activity||null,
      employees:raw.company?.employees??null,
      averageInvoicesPerMonth:raw.company?.average_invoices_per_month??null,
    },
    analysis:raw.analysis||{},services,diagnosis,suggestedPrimaryServiceId,
    proposal:{
      status:'Rascunho',items:services.map(({sourceService,analystFinalPrice,catalogName,billingType,quantity,...item})=>item),pricing,
      payment:paymentText(raw.conditions),validity:addDays(todayStr(),7),scope,notIncluded,deadline,
      clientNotes:clientNotesText(raw),notes:internalNotesText(raw),
    },
    totals:{tableOneOff,tableMrr,oneOffDiscount:jsonOneOffDiscount,mrrDiscount:jsonMrrDiscount,finalOneOff:Math.max(0,tableOneOff-jsonOneOffDiscount),finalMrr:Math.max(0,tableMrr-jsonMrrDiscount),reportedFinalOneOff:jsonOneOffFinal,reportedFinalMrr:jsonMrrFinal},
  }
}

export function applyAnalystImport(state,prepared,options={}){
  if(prepared.errors?.length)throw new Error(prepared.errors.join(' '))
  if(state.opportunities.some(o=>o.importMeta?.exportId===prepared.exportId))throw new Error('Este export_id já foi importado anteriormente.')
  const next=structuredClone(state)
  const today=todayStr(),now=nowIso()
  const source=options.source||'Outro'

  let contact=options.contactId?next.contacts.find(c=>c.id===options.contactId):null
  if(!contact){
    const phone=normPhone(options.contact?.phone||prepared.contact.phone),email=normEmail(options.contact?.email||prepared.contact.email)
    contact=next.contacts.find(c=>(phone&&normPhone(c.phone)===phone)||(email&&normEmail(c.email)===email))||null
  }
  if(!contact){
    const data={...prepared.contact,...options.contact}
    if(!String(data.name||'').trim())throw new Error('Defina o contato responsável antes de importar.')
    contact={id:uid('ct'),name:String(data.name).trim(),phone:data.phone||'',email:data.email||'',city:'',source,createdAt:today}
    next.contacts.unshift(contact)
  }

  let company=next.companies.find(c=>normDoc(c.doc)===prepared.company.cnpj)||null
  if(!company){
    company={
      id:uid('co'),name:prepared.company.name,doc:prepared.company.cnpj,type:prepared.company.type,city:'',
      legalName:prepared.company.legalName,tradeName:prepared.company.tradeName,openingDate:prepared.company.openingDate,taxRegime:prepared.company.taxRegime,
      simplesStatus:prepared.company.simplesStatus,simeiStatus:prepared.company.simeiStatus,mainActivity:prepared.company.mainActivity,
      employees:prepared.company.employees,averageInvoicesPerMonth:prepared.company.averageInvoicesPerMonth,
    }
    next.companies.unshift(company)
  }

  const opportunityId=uid('op'),proposalId=uid('pr')
  const primaryServiceId=options.primaryServiceId||prepared.suggestedPrimaryServiceId||prepared.services[0]?.serviceId||''
  const code=`LG-${today.replaceAll('-','')}-${prepared.company.cnpj.slice(-4)}`
  const proposal={id:proposalId,version:1,code,status:'Rascunho',...structuredClone(prepared.proposal),createdAt:today,sentAt:'',acceptedAt:''}
  const history=[
    {id:uid('evt'),type:'created',at:now,label:'Oportunidade criada por importação do Analista de Proposta'},
    {id:uid('evt'),type:'diagnosis',at:now,label:'Diagnóstico importado do Analista de Proposta'},
    {id:uid('evt'),type:'proposal',at:now,label:'Proposta V1 importada como rascunho',proposalVersion:1},
  ]
  const opp={
    id:opportunityId,contactId:contact.id,companyId:company.id,stage:'Proposta',temp:'unclassified',source,primaryServiceId,
    items:structuredClone(proposal.items),createdAt:today,updatedAt:today,stageEnteredAt:today,wonAt:'',wonSnapshot:null,lostAt:'',lostReason:'',lostNote:'',reactivationAt:'',
    diagnosis:structuredClone(prepared.diagnosis),proposals:[proposal],history,note:prepared.analysis?.main_need||prepared.analysis?.current_situation||'',
    importMeta:{source:'analista_proposta',exportId:prepared.exportId,integrationVersion:prepared.integrationVersion,importedAt:now},
    analystSnapshot:{analysis:structuredClone(prepared.raw.analysis||{}),pains:structuredClone(prepared.raw.pains||[]),alerts:structuredClone(prepared.raw.alerts||[]),internalNotes:structuredClone(prepared.raw.internal_notes||{})},
  }
  next.opportunities.unshift(opp)
  next.revision=Number(next.revision||0)+1
  next.updatedAt=now
  return {state:next,opportunityId,contactId:contact.id,companyId:company.id}
}
