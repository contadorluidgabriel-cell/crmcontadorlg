import { DEFAULT_MESSAGES, DEFAULT_SERVICES } from './catalog.js'
import { addDays, nowIso, todayStr, uid } from '../lib/utils.js'

const history = (label, days=0, type='note', extra={}) => {
  const d=new Date(); d.setDate(d.getDate()+days)
  return { id:uid('evt'), type, at:d.toISOString(), label, ...extra }
}

export function createSeed(){
  const contacts=[
    {id:'ct_mariana',name:'Mariana Souza',phone:'(91) 99123-4455',email:'',city:'Belém/PA',source:'Instagram',createdAt:addDays(todayStr(),-3)},
    {id:'ct_carlos',name:'Carlos Henrique',phone:'(91) 98877-1122',email:'',city:'Belém/PA',source:'Indicação',createdAt:addDays(todayStr(),-7)},
    {id:'ct_patricia',name:'Patrícia Lima',phone:'(91) 99770-2020',email:'',city:'Ananindeua/PA',source:'Anúncio',createdAt:addDays(todayStr(),-12)},
    {id:'ct_felipe',name:'Felipe Martins',phone:'(91) 99211-3344',email:'',city:'Belém/PA',source:'Indicação',createdAt:addDays(todayStr(),-20)},
    {id:'ct_joao',name:'João Almeida',phone:'(91) 99010-2200',email:'',city:'Belém/PA',source:'Google',createdAt:addDays(todayStr(),-45)},
    {id:'ct_rafael',name:'Rafael Costa',phone:'(91) 99631-8890',email:'',city:'Belém/PA',source:'WhatsApp',createdAt:addDays(todayStr(),-2)},
    {id:'ct_amanda',name:'Amanda Rocha',phone:'(91) 98124-1212',email:'',city:'Belém/PA',source:'Instagram',createdAt:addDays(todayStr(),-35)},
  ]
  const companies=[
    {id:'co_mariana',name:'MS Doces',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_carlos',name:'CH Instalações',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_patricia',name:'Paty Beauty',doc:'',type:'ME',city:'Ananindeua/PA'},
    {id:'co_felipe',name:'FM Comércio',doc:'',type:'ME',city:'Belém/PA'},
    {id:'co_joao',name:'JA Entregas',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_rafael',name:'RC Serviços',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_amanda',name:'AR Studio',doc:'',type:'MEI',city:'Belém/PA'},
  ]
  const proposals={
    mariana:[{id:'pr_mariana_1',version:1,status:'Rascunho',items:[{serviceId:'svc-regularizacao-mei',name:'Regularização MEI',oneOff:450,mrr:0}],discount:0,payment:'PIX',validity:addDays(todayStr(),7),notes:'',createdAt:addDays(todayStr(),-1),sentAt:'',acceptedAt:''}],
    carlos:[{id:'pr_carlos_1',version:1,status:'Enviada',items:[{serviceId:'svc-desenquadramento-mei',name:'Desenquadramento MEI',oneOff:850,mrr:350}],discount:0,payment:'Entrada + mensalidade',validity:addDays(todayStr(),5),notes:'',createdAt:addDays(todayStr(),-4),sentAt:addDays(todayStr(),-4),acceptedAt:''}],
    patricia:[{id:'pr_patricia_1',version:1,status:'Enviada',items:[{serviceId:'svc-contabilidade',name:'Contabilidade mensal',oneOff:0,mrr:390}],discount:0,payment:'Mensal',validity:addDays(todayStr(),2),notes:'',createdAt:addDays(todayStr(),-7),sentAt:addDays(todayStr(),-7),acceptedAt:''}],
    felipe:[{id:'pr_felipe_1',version:1,status:'Aceita',items:[{serviceId:'svc-contabilidade',name:'Contabilidade mensal',oneOff:300,mrr:520}],discount:0,payment:'PIX',validity:addDays(todayStr(),-2),notes:'',createdAt:addDays(todayStr(),-5),sentAt:addDays(todayStr(),-5),acceptedAt:addDays(todayStr(),-3)}],
    joao:[{id:'pr_joao_1',version:1,status:'Recusada',items:[{serviceId:'svc-regularizacao-mei',name:'Regularização MEI',oneOff:300,mrr:0}],discount:0,payment:'PIX',validity:addDays(todayStr(),-35),notes:'',createdAt:addDays(todayStr(),-42),sentAt:addDays(todayStr(),-42),acceptedAt:''}],
  }
  const makeOpp=(id,contactId,companyId,stage,temp,source,items,createdDays,updatedDays,extra={})=>({
    id,contactId,companyId,stage,temp,source,items,createdAt:addDays(todayStr(),createdDays),updatedAt:addDays(todayStr(),updatedDays),stageEnteredAt:addDays(todayStr(),updatedDays),wonAt:'',lostAt:'',lostReason:'',lostNote:'',reactivationAt:'',diagnosis:{},proposals:[],history:[],note:'',...extra,
  })
  const opportunities=[
    makeOpp('op_mariana','ct_mariana','co_mariana','Diagnóstico','hot','Instagram',[{serviceId:'svc-regularizacao-mei',name:'Regularização MEI',oneOff:450,mrr:0}],-3,-1,{diagnosis:{das:'Sim',dasn:'Sim',revenue:'R$ 8.500/mês',debits:'Sim',notes:'Regularizar antes de solicitar crédito.'},proposals:proposals.mariana,note:'DAS em atraso e DASN pendente.',history:[history('Lead recebido pelo Instagram',-3,'created'),history('Primeiro contato realizado',-3,'contact'),history('Cliente enviou informações iniciais',-2,'contact')]}),
    makeOpp('op_carlos','ct_carlos','co_carlos','Proposta','hot','Indicação',[{serviceId:'svc-desenquadramento-mei',name:'Desenquadramento MEI',oneOff:850,mrr:350}],-7,-4,{diagnosis:{revenue:'R$ 18.000/mês',exceeded:'Sim',employee:'Não',nf:'Sim',retroactive:'Avaliar',notes:'Possível migração ao Simples.'},proposals:proposals.carlos,note:'Faturamento acima do limite.',history:[history('Indicação recebida',-7,'created'),history('Diagnóstico concluído',-5,'diagnosis'),history('Proposta enviada',-4,'proposal')]}),
    makeOpp('op_patricia','ct_patricia','co_patricia','Follow-up','warm','Anúncio',[{serviceId:'svc-contabilidade',name:'Contabilidade mensal',oneOff:0,mrr:390}],-12,-7,{diagnosis:{regime:'Simples Nacional',revenue:'R$ 28.000/mês',employees:'2',notes:'Salão de beleza.'},proposals:proposals.patricia,note:'Comparando com outro escritório.',history:[history('Lead vindo de anúncio',-12,'created'),history('Reunião de diagnóstico',-9,'diagnosis'),history('Proposta enviada',-7,'proposal')]}),
    makeOpp('op_felipe','ct_felipe','co_felipe','Ganho','hot','Indicação',[{serviceId:'svc-contabilidade',name:'Contabilidade mensal',oneOff:300,mrr:520}],-20,-3,{wonAt:addDays(todayStr(),-3),proposals:proposals.felipe,note:'Cliente fechado.',history:[history('Lead recebido',-20,'created'),history('Proposta aceita',-3,'proposal'),history('Venda fechada',-3,'won')]}),
    makeOpp('op_joao','ct_joao','co_joao','Perdido','cold','Google',[{serviceId:'svc-regularizacao-mei',name:'Regularização MEI',oneOff:300,mrr:0}],-45,-40,{lostAt:addDays(todayStr(),-40),lostReason:'Preço',lostNote:'Achou caro.',proposals:proposals.joao,note:'Achou caro.',history:[history('Lead recebido via Google',-45,'created'),history('Proposta enviada',-42,'proposal'),history('Negociação perdida — preço',-40,'lost')]}),
    makeOpp('op_rafael','ct_rafael','co_rafael','Qualificação','warm','WhatsApp',[{serviceId:'svc-abertura',name:'Abertura de empresa',oneOff:650,mrr:0}],-2,-2,{note:'Definindo atividade e endereço.',history:[history('Contato recebido no WhatsApp',-2,'created')]}),
    makeOpp('op_amanda','ct_amanda','co_amanda','Adiado','cold','Instagram',[{serviceId:'svc-contabilidade',name:'Contabilidade mensal',oneOff:0,mrr:290}],-35,-30,{reactivationAt:addDays(todayStr(),5),note:'Pediu para retomar no mês seguinte.',history:[history('Lead recebido pelo Instagram',-35,'created'),history('Cliente pediu para retomar depois',-30,'deferred')]}),
  ]
  return {
    schemaVersion:4,
    settings:{owner:'Luid Gabriel',business:'Contador Luid Gabriel',staleDays:5,goals:{clients:8,mrr:3000,oneOff:6000},services:DEFAULT_SERVICES,messages:DEFAULT_MESSAGES},
    contacts,companies,opportunities,activities:[],createdAt:nowIso(),updatedAt:nowIso(),
  }
}
