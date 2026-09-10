import assert from 'node:assert/strict'
import { createSeed } from '../src/data/seed.js'
import { activeOpportunity, cohortData, funnelData, pipelineSummary, reportData, serviceNames } from '../src/lib/domain.js'
import { migrateLegacy } from '../src/lib/storage.js'
import { todayStr } from '../src/lib/utils.js'

const state=createSeed()
assert.equal(state.schemaVersion,4)
assert.ok(state.contacts.length>0)
assert.ok(state.opportunities.length>0)
assert.equal(state.opportunities.filter(activeOpportunity).some(o=>o.stage==='Adiado'),false)

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

const legacy={settings:{services:[{name:'Contabilidade mensal',kind:'Recorrente',base:350}]},leads:[{id:'l1',name:'Teste',phone:'91999999999',company:'Teste LTDA',type:'ME',service:'Contabilidade mensal',stage:'Ganho',created:'2026-08-01',updated:todayStr(),wonAt:todayStr(),mrr:350,proposal:{monthly:350,status:'Aceita'},history:[]}],activities:[]}
const migrated=migrateLegacy(legacy)
assert.equal(migrated.contacts.length,1)
assert.equal(migrated.opportunities.length,1)
assert.equal(migrated.opportunities[0].wonAt,todayStr())
assert.equal(reportData(migrated,'month').won.length,1,'Venda deve cair no mês do wonAt, não no mês de criação do lead')
assert.equal(cohortData(migrated,'month').cohort.length,0,'Coorte do mês deve usar createdAt e não wonAt')
assert.equal(cohortData(migrated,'all').won.length,1)

console.log('CRM V2.3 smoke tests: OK')
