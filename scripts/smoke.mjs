import assert from 'node:assert/strict'
import { createSeed } from '../src/data/seed.js'
import { activeOpportunity, canSetStage, cohortData, createWonSnapshot, funnelData, opportunityTotals, pipelineSummary, proposalTotals, reportData, serviceNames } from '../src/lib/domain.js'
import { migrateLegacy, migrateV4ToV5, SCHEMA_VERSION, validateState } from '../src/lib/storage.js'
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

console.log('CRM V2.3.1 integrity smoke tests: OK')
