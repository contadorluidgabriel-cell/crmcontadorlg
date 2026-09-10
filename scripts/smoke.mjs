import assert from 'node:assert/strict'
import { createSeed } from '../src/data/seed.js'
import { activeOpportunity, pipelineSummary, reportData, serviceNames } from '../src/lib/domain.js'
import { migrateLegacy } from '../src/lib/storage.js'
import { todayStr } from '../src/lib/utils.js'

const state=createSeed()
assert.equal(state.schemaVersion,4)
assert.ok(state.contacts.length>0)
assert.ok(state.opportunities.length>0)
assert.equal(state.opportunities.filter(activeOpportunity).some(o=>o.stage==='Adiado'),false)
const pipe=pipelineSummary(state)
assert.equal(pipe.count,state.opportunities.filter(activeOpportunity).length)
const report=reportData(state,'month')
assert.ok(report.revenue.mrr>=0)
assert.ok(state.opportunities.every(o=>serviceNames(o).length>0))

const legacy={settings:{services:[{name:'Contabilidade mensal',kind:'Recorrente',base:350}]},leads:[{id:'l1',name:'Teste',phone:'91999999999',company:'Teste LTDA',type:'ME',service:'Contabilidade mensal',stage:'Ganho',created:'2026-08-01',updated:todayStr(),wonAt:todayStr(),mrr:350,proposal:{monthly:350,status:'Aceita'},history:[]}],activities:[]}
const migrated=migrateLegacy(legacy)
assert.equal(migrated.contacts.length,1)
assert.equal(migrated.opportunities.length,1)
assert.equal(migrated.opportunities[0].wonAt,todayStr())
assert.equal(reportData(migrated,'month').won.length,1,'Venda deve cair no mês do wonAt, não no mês de criação do lead')

console.log('CRM V2.2 smoke tests: OK')
