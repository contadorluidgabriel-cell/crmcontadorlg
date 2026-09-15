export const STAGES = ['Novo lead','Contato','Qualificação','Diagnóstico','Proposta','Negociação','Follow-up','Ganho','Perdido','Adiado']
export const PIPELINE_STAGES = STAGES.slice(0, 8)
export const ACTIVE_STAGES = STAGES.slice(0, 7)
export const TERMINAL_STAGES = ['Ganho','Perdido','Adiado']
export const MAX_DISCOUNT_PERCENT = 40

export const LEGACY_DEFAULT_SERVICE_IDS = [
  'svc-regularizacao-mei','svc-desenquadramento-mei','svc-contabilidade','svc-abertura',
  'svc-alteracao','svc-baixa','svc-irpf','svc-dp','svc-consultoria',
]

export const DEFAULT_SERVICES = [
  { id:'MEI_ABERTURA', name:'Abertura / Formalização MEI', kind:'Avulso', regime:'MEI', baseOneOff:100, baseMrr:0 },
  { id:'MEI_ALTERACAO', name:'Alteração Cadastral MEI', kind:'Avulso', regime:'MEI', baseOneOff:100, baseMrr:0 },
  { id:'MEI_BAIXA', name:'Baixa MEI', kind:'Avulso', regime:'MEI', baseOneOff:100, baseMrr:0 },
  { id:'MEI_DASN', name:'DASN-SIMEI', kind:'Avulso', regime:'MEI', baseOneOff:150, baseMrr:0, extraSameEngagement:75 },
  { id:'MEI_DESENQUADRAMENTO', name:'Desenquadramento MEI', kind:'Avulso', regime:'MEI', baseOneOff:350, baseMrr:0 },
  { id:'MEI_PARCELAMENTO_RFB', name:'Parcelamento Débitos MEI Receita', kind:'Avulso', regime:'MEI', baseOneOff:150, baseMrr:0 },
  { id:'MEI_PGFN', name:'Regularização Dívida Ativa PGFN', kind:'Avulso', regime:'MEI', baseOneOff:150, baseMrr:0 },
  { id:'MEI_MIGRACAO_ME', name:'Migração MEI → ME', kind:'Avulso', regime:'MEI', baseOneOff:500, baseMrr:0, warning:'Benefício de 50% do Próximo Nível ainda pendente de reconciliação.' },
  { id:'MEI_ESSENCIAL', name:'Plano Essencial MEI', kind:'Recorrente', regime:'MEI', baseOneOff:0, baseMrr:150 },
  { id:'MEI_PROFISSIONAL', name:'Plano Profissional MEI', kind:'Recorrente', regime:'MEI', baseOneOff:0, baseMrr:250, includedInvoices:10, extraInvoice:20 },
  { id:'MEI_PROXIMO_NIVEL', name:'Plano Próximo Nível MEI', kind:'Recorrente', regime:'MEI', baseOneOff:0, baseMrr:350 },

  { id:'SN_ABERTURA', name:'Abertura de empresa', kind:'Avulso', regime:'Simples Nacional', baseOneOff:800, baseMrr:0 },
  { id:'SN_ALTERACAO', name:'Alteração Contratual / Cadastral', kind:'Avulso', regime:'Simples Nacional', baseOneOff:500, baseMrr:0, priceMax:1000 },
  { id:'SN_BAIXA', name:'Baixa de empresa', kind:'Avulso', regime:'Simples Nacional', baseOneOff:150, baseMrr:0 },
  { id:'SN_REG_FISCAL', name:'Regularização Fiscal', kind:'Avulso', regime:'Simples Nacional', baseOneOff:400, baseMrr:0 },
  { id:'SN_PARCELAMENTO', name:'Parcelamento de Débitos', kind:'Avulso', regime:'Simples Nacional', baseOneOff:200, baseMrr:0 },
  { id:'SN_REENQUADRAMENTO', name:'Desenquadramento / Reenquadramento do Simples', kind:'Avulso', regime:'Simples Nacional', baseOneOff:200, baseMrr:0 },
  { id:'SN_CONSULTORIA_TRIBUTARIA', name:'Consultoria Tributária', kind:'Avulso', regime:'Simples Nacional', baseOneOff:0, baseMrr:0, requiresHumanReview:true },

  { id:'SN_CONT_FC_0_50', name:'Contabilidade Mensal — Fiscal + Contábil (até R$ 50 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:350, revenueMax:50000 },
  { id:'SN_CONT_FCDP_0_50', name:'Contabilidade Mensal — Fiscal + Contábil + DP (até R$ 50 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil + DP', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:500, revenueMax:50000, includesDp:true },
  { id:'SN_CONT_FC_50_100', name:'Contabilidade Mensal — Fiscal + Contábil (R$ 50–100 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:450, revenueMinExclusive:50000, revenueMax:100000 },
  { id:'SN_CONT_FCDP_50_100', name:'Contabilidade Mensal — Fiscal + Contábil + DP (R$ 50–100 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil + DP', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:600, revenueMinExclusive:50000, revenueMax:100000, includesDp:true },
  { id:'SN_CONT_FC_100_200', name:'Contabilidade Mensal — Fiscal + Contábil (R$ 100–200 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:600, revenueMinExclusive:100000, revenueMax:200000 },
  { id:'SN_CONT_FCDP_100_200', name:'Contabilidade Mensal — Fiscal + Contábil + DP (R$ 100–200 mil)', proposalName:'Contabilidade Mensal — Fiscal + Contábil + DP', kind:'Recorrente', regime:'Simples Nacional', baseOneOff:0, baseMrr:750, revenueMinExclusive:100000, revenueMax:200000, includesDp:true },

  { id:'PF_IRPF', name:'IRPF', kind:'Avulso', regime:'Pessoa física', baseOneOff:0, baseMrr:0, requiresHumanReview:true },
]

export const DEFAULT_MESSAGES = {
  first:'Olá, {nome}! Tudo bem? Sou Luid Gabriel, contador. Vi seu contato sobre {servico}. Posso entender melhor sua situação para te orientar?',
  proposal:'Olá, {nome}! Passando para confirmar se conseguiu analisar a proposta de {servico}. Se ficou alguma dúvida sobre escopo, valores ou próximos passos, me chama que eu explico.',
  follow:'Olá, {nome}! Tudo bem? Estou retomando nosso contato sobre {servico}. Ainda faz sentido para você resolver isso agora?',
  docs:'Olá, {nome}! Para avançarmos com {servico}, preciso das informações/documentos que combinamos. Se quiser, posso te lembrar exatamente o que está faltando.',
  reactivation:'Olá, {nome}! Tudo bem? Lembrei do seu caso de {servico} e queria saber se ainda faz sentido retomarmos isso agora.',
}

const CONTABILIDADE_SCHEMA = [
  ['regime','Regime atual','text'],['revenue','Faturamento médio mensal','text'],['employees','Quantidade de funcionários','text'],['proLabores','Quantidade de pró-labores','text'],['invoices','Volume de notas/mês','text'],['accountant','Possui contador atual?','select'],['pending','Possui pendências?','select'],
]

export const DIAG_SCHEMAS = {
  MEI_DASN:[['dasn','Quantos exercícios?','text'],['pending','Existem outras pendências?','select'],['notes','Observação','text']],
  MEI_DESENQUADRAMENTO:[['revenue','Faturamento aproximado','text'],['exceeded','Excedeu o limite?','select'],['excessDate','Quando ocorreu o excesso?','text'],['employee','Possui funcionário?','select'],['nf','Emite nota fiscal?','select'],['retroactive','Possível retroatividade','text']],
  MEI_PARCELAMENTO_RFB:[['debits','Débitos aproximados','text'],['installment','Já existe parcelamento?','select'],['pending','Há outras pendências?','select']],
  MEI_PGFN:[['debits','Dívida aproximada','text'],['agreement','Já existe negociação?','select'],['pending','Há outras pendências?','select']],
  MEI_MIGRACAO_ME:[['revenue','Faturamento aproximado','text'],['activity','Atividade principal','text'],['employees','Funcionários','text'],['reason','Motivo da migração','text']],
  MEI_ESSENCIAL:[['revenue','Faturamento médio','text'],['invoices','Notas por mês','text'],['pending','Possui pendências?','select']],
  MEI_PROFISSIONAL:[['revenue','Faturamento médio','text'],['invoices','Notas por mês','text'],['pending','Possui pendências?','select']],
  MEI_PROXIMO_NIVEL:[['revenue','Faturamento médio','text'],['invoices','Notas por mês','text'],['employee','Possui funcionário?','select'],['bookkeeping','Precisa de escrituração?','select']],
  SN_ABERTURA:[['activity','Atividade principal','text'],['address','Endereço definido?','select'],['partners','Quantidade de sócios','text'],['capital','Capital estimado','text'],['revenue','Faturamento estimado','text'],['employees','Pretende ter funcionários?','select']],
  SN_REG_FISCAL:[['pending','Pendência principal','text'],['periods','Períodos envolvidos','text'],['notices','Recebeu notificação/intimação?','select'],['deadline','Existe prazo?','text']],
  SN_PARCELAMENTO:[['debits','Débitos aproximados','text'],['origin','Origem dos débitos','text'],['existing','Já existe parcelamento?','select']],
  SN_REENQUADRAMENTO:[['situation','Situação atual','text'],['reason','Motivo','text'],['deadline','Prazo relevante','text']],
  SN_CONSULTORIA_TRIBUTARIA:[['question','Questão principal','text'],['scenario','Cenário atual','text'],['decision','Decisão que precisa tomar','text']],
  SN_CONT_FC_0_50:CONTABILIDADE_SCHEMA,
  SN_CONT_FCDP_0_50:CONTABILIDADE_SCHEMA,
  SN_CONT_FC_50_100:CONTABILIDADE_SCHEMA,
  SN_CONT_FCDP_50_100:CONTABILIDADE_SCHEMA,
  SN_CONT_FC_100_200:CONTABILIDADE_SCHEMA,
  SN_CONT_FCDP_100_200:CONTABILIDADE_SCHEMA,
  PF_IRPF:[['income','Principais fontes de renda','text'],['assets','Possui bens relevantes?','select'],['investments','Possui investimentos?','select'],['dependents','Dependentes','text'],['pending','Pendência/malha?','select']],
}
