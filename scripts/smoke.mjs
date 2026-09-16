import assert from 'node:assert/strict'
import { createSeed } from '../src/data/seed.js'
import { activeOpportunity, canSetStage, cohortData, createWonSnapshot, funnelData, opportunityTotals, pipelineSummary, proposalTotals, reportData, serviceNames } from '../src/lib/domain.js'
import { migrateLegacy, migrateV4ToV5, SCHEMA_VERSION, validateState } from '../src/lib/storage.js'
import { applyAnalystImport, prepareAnalystImport } from '../src/lib/analystImport.js'
import { todayStr } from '../src/lib/utils.js'

const state=createSeed()
assert.equal(state.schemaVersion,SCHEMA_VERSION)
assert.equal(SCHEMA_VERSION,5)
assert.ok(state.contacts.length>0)
assert.ok(state.opportunities.length>0)
assert.equal(state.opportunities.filter(activeOpportunity).some(o=>o.stage==='Adiado'),false)
validateState(state)

const pipe=pipelineSummary(state)
assert.equal(pipe.count,state.opportunities.filter(activeOpportunity).length)
assert.ok(pipe.oneOff>=0)
assert.ok(pipe.mrr>=0)

const report=reportData(state,'month')
assert.ok(report.revenue.mrr>=0)
assert.ok(state.opportunities.every(o=>serviceNames(o).length>0))

const funnel=funnelData(state,'all')
assert.equal(funnel[0].count,state.opportunities.length)
for(let i=1;i<funnel.length;i++)assert.ok(funnel[i].count<=funnel[i-1].count,'Funil acumulado não pode crescer nas etapas posteriores')

const cohort=cohortData(state,'all')
assert.equal(cohort.cohort.length,state.opportunities.length)
assert.ok(cohort.decisionConversion>=0&&cohort.decisionConversion<=100)

const discounted={items:[{serviceId:'x',name:'Teste',oneOff:500,mrr:500,tableOneOff:500,tableMrr:500}],pricing:{oneOffDiscountType:'percent',oneOffDiscountValue:40,mrrDiscountPercent:20,mrrDiscountType:'temporary',mrrDiscountMonths:3}}
const dt=proposalTotals(discounted)
assert.equal(dt.oneOff,300)
assert.equal(dt.mrr,400)
assert.equal(dt.oneOffDiscount,200)
assert.equal(dt.mrrDiscount,100)

const won={id:'won',stage:'Ganho',wonAt:todayStr(),items:discounted.items,proposals:[{id:'p1',version:1,status:'Aceita',...discounted}],wonSnapshot:null,history:[],createdAt:todayStr(),updatedAt:todayStr(),stageEnteredAt:todayStr()}
won.wonSnapshot=createWonSnapshot(won,won.proposals[0])
assert.equal(opportunityTotals(won).mrr,400)
won.proposals.push({id:'p2',version:2,status:'Rascunho',items:[{serviceId:'x',name:'Teste',oneOff:0,mrr:50,tableOneOff:0,tableMrr:50}],pricing:{oneOffDiscountType:'amount',oneOffDiscountValue:0,mrrDiscountPercent:0,mrrDiscountType:'permanent',mrrDiscountMonths:0}})
assert.equal(opportunityTotals(won).mrr,400,'Venda ganha deve usar snapshot, não a proposta mais recente')
assert.equal(canSetStage(won,'Contato'),false,'Venda ganha não pode voltar para etapa ativa por setStage genérico')
assert.equal(canSetStage({stage:'Proposta'},'Negociação'),true)
assert.equal(canSetStage({stage:'Proposta'},'Ganho'),false,'Ganho deve usar ação específica')

const analystFixture={
  integration_version:'1.0',event:'proposal_analysis.approved',source:'analista_proposta',destination:'crm',export_id:'proposal_55881208000159_test',
  contact:{name:null,phone:null,email:null},
  company:{cnpj:'55881208000159',legal_name:'L.S PRIME COMERCIO ATACADISTA LTDA',trade_name:null,tax_regime:'SIMEI',employees:0,average_invoices_per_month:2,main_activity:{cnae:'46.42-7-02',description:'Comércio atacadista'}},
  analysis:{status:'approved',confidence:'HIGH',current_situation:'Pendências acumuladas.',main_need:'Regularizar o MEI.',recommended_solution:'Regularização + Plano Essencial.'},
  pains:[{type:'fiscal',description:'DAS em atraso.'}],alerts:[],
  services:[
    {service_id:null,service_name:'DASN-SIMEI — Declaração Anual do MEI',billing_type:'one_time',quantity:2,table_price:225,discount_percent:33.33,final_price:150},
    {service_id:null,service_name:'Parcelamento de Débitos do MEI',billing_type:'one_time',quantity:1,table_price:150,discount_percent:33.33,final_price:100},
    {service_id:null,service_name:'Plano Essencial — MEI',billing_type:'recurring',table_price:150,discount_percent:0,final_price:150,billing_frequency:'monthly'},
  ],
  prices:{one_time:{table_total:375,discount_total:125,final_total:250},recurring:{table_monthly_total:150,discount_monthly_total:0,final_monthly_total:150}},
  scope:{initial_regularization:['Regularizar declarações e débitos'],monthly_plan:['Acompanhamento mensal']},
  exclusions:['Taxas públicas'],deadline:{initial_regularization:'Após acessos.'},conditions:{initial_price:250,monthly_price:150,monthly_due_date_options:[10,15,20]},
  internal_notes:{commercial_strategy:'Desconto só na entrada.',approved_structure:'R$ 250 + R$ 150/mês'},client_notes:{summary:'Regularização e acompanhamento.'},
}
const prepared=prepareAnalystImport(analystFixture,state.settings.services)
assert.deepEqual(prepared.errors,[])
assert.deepEqual(prepared.services.map(s=>s.serviceId),['MEI_DASN','MEI_PARCELAMENTO_RFB','MEI_ESSENCIAL'])
assert.equal(prepared.totals.tableOneOff,375)
assert.equal(prepared.totals.oneOffDiscount,125)
assert.equal(prepared.totals.finalOneOff,250)
assert.equal(prepared.totals.finalMrr,150)
assert.equal(prepared.suggestedPrimaryServiceId,'MEI_ESSENCIAL')
assert.throws(()=>applyAnalystImport(state,prepared),/contato responsável/i)
const imported=applyAnalystImport(state,prepared,{contact:{name:'Contato Teste',phone:'91999999999'},source:'Indicação'})
validateState(imported.state)
const importedOpp=imported.state.opportunities.find(o=>o.id===imported.opportunityId)
assert.equal(importedOpp.stage,'Proposta')
assert.equal(importedOpp.primaryServiceId,'MEI_ESSENCIAL')
assert.equal(importedOpp.proposals.length,1)
assert.equal(importedOpp.proposals[0].status,'Rascunho')
const importedTotals=proposalTotals(importedOpp.proposals[0])
assert.equal(importedTotals.oneOff,250,'Importação não pode aplicar o desconto duas vezes')
assert.equal(importedTotals.mrr,150)
assert.equal(imported.state.companies.filter(c=>String(c.doc).replace(/\D/g,'')==='55881208000159').length,1)
assert.throws(()=>applyAnalystImport(imported.state,prepared,{contactId:imported.contactId}),/export_id já foi importado/i)

const legacy={settings:{services:[{name:'Contabilidade mensal',kind:'Recorrente',base:350}]},leads:[{id:'l1',name:'Teste',phone:'91999999999',company:'Teste LTDA',type:'ME',service:'Contabilidade mensal',stage:'Ganho',created:'2026-08-01',updated:todayStr(),wonAt:todayStr(),mrr:350,proposal:{monthly:350,status:'Aceita'},history:[]}],activities:[]}
const migrated=migrateLegacy(legacy)
validateState(migrated)
assert.equal(migrated.contacts.length,1)
assert.equal(migrated.opportunities.length,1)
assert.ok(migrated.opportunities[0].wonSnapshot)
assert.equal(reportData(migrated,'month').won.length,1,'Venda deve cair no mês do wonAt, não no mês de criação do lead')
assert.equal(cohortData(migrated,'month').cohort.length,0,'Coorte do mês deve usar createdAt e não wonAt')

const v4={...createSeed(),schemaVersion:4,revision:0}
delete v4.opportunities[0].wonSnapshot
const migratedV4=migrateV4ToV5(v4)
assert.equal(migratedV4.schemaVersion,5)
validateState(migratedV4)
assert.ok(migratedV4.settings.services.some(s=>s.id==='MEI_ABERTURA'))
assert.ok(migratedV4.settings.services.some(s=>s.id==='SN_ABERTURA'))

console.log('CRM V2.3.2 smoke tests: OK')
