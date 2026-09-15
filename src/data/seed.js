import { DEFAULT_MESSAGES, DEFAULT_SERVICES } from './catalog.js'
import { addDays, nowIso, todayStr, uid } from '../lib/utils.js'
import { createWonSnapshot } from '../lib/domain.js'

const history = (label, days=0, type='note', extra={}) => {
  const d=new Date(); d.setDate(d.getDate()+days)
  return { id:uid('evt'), type, at:d.toISOString(), label, ...extra }
}
const item=(serviceId,name,oneOff=0,mrr=0)=>({serviceId,name,tableOneOff:oneOff,tableMrr:mrr,oneOff,mrr})
const pricing=()=>({oneOffDiscountType:'amount',oneOffDiscountValue:0,mrrDiscountPercent:0,mrrDiscountType:'permanent',mrrDiscountMonths:0})

export function createSeed(){
  const contacts=[
    {id:'ct_mariana',name:'Mariana Souza',phone:'(91) 99123-4455',email:'',city:'Belém/PA',source:'Instagram',createdAt:addDays(todayStr(),-3)},
    {id:'ct_carlos',name:'Carlos Henrique',phone:'(91) 98877-1122',email:'',city:'Belém/PA',source:'Indicação',createdAt:addDays(todayStr(),-7)},
    {id:'ct_patricia',name:'Patrícia Lima',phone:'(91) 99770-2020',email:'',city:'Ananindeua/PA',source:'Anúncio',createdAt:addDays(todayStr(),-12)},
    {id:'ct_felipe',name:'Felipe Martins',phone:'(91) 99211-3344',email:'',city:'Belém/PA',source:'Indicação',createdAt:addDays(todayStr(),-20)},
    {id:'ct_joao',name:'João Almeida',phone:'(91) 99010-2200',email:'',city:'Belém/PA',source:'Google',createdAt:addDays(todayStr(),-45)},
  ]
  const companies=[
    {id:'co_mariana',name:'MS Doces',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_carlos',name:'CH Instalações',doc:'',type:'MEI',city:'Belém/PA'},
    {id:'co_patricia',name:'Paty Beauty',doc:'',type:'ME',city:'Ananindeua/PA'},
    {id:'co_felipe',name:'FM Comércio',doc:'',type:'ME',city:'Belém/PA'},
    {id:'co_joao',name:'JA Entregas',doc:'',type:'MEI',city:'Belém/PA'},
  ]
  const marianaItem=item('MEI_PARCELAMENTO_RFB','Parcelamento Débitos MEI Receita',150,0)
  const carlosItem=item('MEI_DESENQUADRAMENTO','Desenquadramento MEI',350,0)
  const patriciaItem=item('SN_CONT_FCDP_0_50','Contabilidade Mensal — Fiscal + Contábil + DP',0,500)
  const felipeItem=item('SN_CONT_FC_50_100','Contabilidade Mensal — Fiscal + Contábil',0,450)
  const joaoItem=item('MEI_DASN','DASN-SIMEI',150,0)
  const proposals={
    mariana:[{id:'pr_mariana_1',version:1,code:'LG-DEMO-01',status:'Rascunho',items:[marianaItem],pricing:pricing(),payment:'PIX',validity:addDays(todayStr(),7),notes:'',createdAt:addDays(todayStr(),-1),sentAt:'',acceptedAt:''}],
    carlos:[{id:'pr_carlos_1',version:1,code:'LG-DEMO-02',status:'Enviada',items:[carlosItem],pricing:pricing(),payment:'PIX',validity:addDays(todayStr(),5),notes:'',createdAt:addDays(todayStr(),-4),sentAt:addDays(todayStr(),-4),acceptedAt:''}],
    patricia:[{id:'pr_patricia_1',version:1,code:'LG-DEMO-03',status:'Enviada',items:[patriciaItem],pricing:pricing(),payment:'Mensal',validity:addDays(todayStr(),2),notes:'',createdAt:addDays(todayStr(),-7),sentAt:addDays(todayStr(),-7),acceptedAt:''}],
    felipe:[{id:'pr_felipe_1',version:1,code:'LG-DEMO-04',status:'Aceita',items:[felipeItem],pricing:pricing(),payment:'Mensal',validity:addDays(todayStr(),-2),notes:'',createdAt:addDays(todayStr(),-5),sentAt:addDays(todayStr(),-5),acceptedAt:addDays(todayStr(),-3)}],
    joao:[{id:'pr_joao_1',version:1,code:'LG-DEMO-05',status:'Recusada',items:[joaoItem],pricing:pricing(),payment:'PIX',validity:addDays(todayStr(),-35),notes:'',createdAt:addDays(todayStr(),-42),sentAt:addDays(todayStr(),-42),acceptedAt:''}],
  }
  const makeOpp=(id,contactId,companyId,stage,temp,source,items,createdDays,updatedDays,extra={})=>({
    id,contactId,companyId,stage,temp,source,primaryServiceId:items[0]?.serviceId||'',items,createdAt:addDays(todayStr(),createdDays),updatedAt:addDays(todayStr(),updatedDays),stageEnteredAt:addDays(todayStr(),updatedDays),wonAt:'',wonSnapshot:null,lostAt:'',lostReason:'',lostNote:'',reactivationAt:'',diagnosis:{},proposals:[],history:[],note:'',...extra,
  })
  const opportunities=[
    makeOpp('op_mariana','ct_mariana','co_mariana','Diagnóstico','hot','Instagram',[marianaItem],-3,-1,{diagnosis:{debits:'Sim',installment:'Não',pending:'Sim',notes:'Regularizar antes de solicitar crédito.'},proposals:proposals.mariana,note:'DAS em atraso.',history:[history('Lead recebido pelo Instagram',-3,'created'),history('Primeiro contato realizado',-3,'contact')]}),
    makeOpp('op_carlos','ct_carlos','co_carlos','Proposta','hot','Indicação',[carlosItem],-7,-4,{diagnosis:{revenue:'R$ 18.000/mês',exceeded:'Sim',employee:'Não',nf:'Sim',retroactive:'Avaliar',notes:'Possível migração ao Simples.'},proposals:proposals.carlos,note:'Faturamento acima do limite.',history:[history('Indicação recebida',-7,'created'),history('Diagnóstico concluído',-5,'diagnosis'),history('Proposta enviada',-4,'proposal')]}),
    makeOpp('op_patricia','ct_patricia','co_patricia','Follow-up','warm','Anúncio',[patriciaItem],-12,-7,{diagnosis:{regime:'Simples Nacional',revenue:'R$ 28.000/mês',employees:'2',notes:'Salão de beleza.'},proposals:proposals.patricia,note:'Comparando com outro escritório.',history:[history('Lead vindo de anúncio',-12,'created'),history('Proposta enviada',-7,'proposal')]}),
    makeOpp('op_felipe','ct_felipe','co_felipe','Ganho','hot','Indicação',[felipeItem],-20,-3,{wonAt:addDays(todayStr(),-3),proposals:proposals.felipe,note:'Cliente fechado.',history:[history('Lead recebido',-20,'created'),history('Proposta aceita',-3,'proposal'),history('Venda fechada',-3,'won')]}),
    makeOpp('op_joao','ct_joao','co_joao','Perdido','cold','Google',[joaoItem],-45,-40,{lostAt:addDays(todayStr(),-40),lostReason:'Preço',lostNote:'Achou caro.',proposals:proposals.joao,note:'Achou caro.',history:[history('Lead recebido via Google',-45,'created'),history('Negociação perdida — preço',-40,'lost')]}),
  ]
  opportunities.find(o=>o.id==='op_felipe').wonSnapshot=createWonSnapshot(opportunities.find(o=>o.id==='op_felipe'),proposals.felipe[0])
  return {
    schemaVersion:5,revision:1,
    settings:{owner:'Luid Gabriel',business:'Contador Luid Gabriel',staleDays:5,goals:{clients:8,mrr:3000,oneOff:6000},services:DEFAULT_SERVICES,messages:DEFAULT_MESSAGES,commercialRules:{maxDiscountPercent:40,acquisitionMode:'aggressive'}},
    contacts,companies,opportunities,activities:[],createdAt:nowIso(),updatedAt:nowIso(),
  }
}
