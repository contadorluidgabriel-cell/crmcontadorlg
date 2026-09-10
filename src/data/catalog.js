export const STAGES = ['Novo lead','Contato','Qualificação','Diagnóstico','Proposta','Negociação','Follow-up','Ganho','Perdido','Adiado']
export const PIPELINE_STAGES = STAGES.slice(0, 8)

export const DEFAULT_SERVICES = [
  { id:'svc-regularizacao-mei', name:'Regularização MEI', kind:'Avulso', baseOneOff:450, baseMrr:0 },
  { id:'svc-desenquadramento-mei', name:'Desenquadramento MEI', kind:'Misto', baseOneOff:850, baseMrr:350 },
  { id:'svc-contabilidade', name:'Contabilidade mensal', kind:'Recorrente', baseOneOff:0, baseMrr:350 },
  { id:'svc-abertura', name:'Abertura de empresa', kind:'Avulso', baseOneOff:650, baseMrr:0 },
  { id:'svc-alteracao', name:'Alteração empresarial', kind:'Avulso', baseOneOff:600, baseMrr:0 },
  { id:'svc-baixa', name:'Baixa', kind:'Avulso', baseOneOff:450, baseMrr:0 },
  { id:'svc-irpf', name:'IRPF', kind:'Avulso', baseOneOff:250, baseMrr:0 },
  { id:'svc-dp', name:'Folha / DP', kind:'Recorrente', baseOneOff:0, baseMrr:180 },
  { id:'svc-consultoria', name:'Consultoria', kind:'Avulso', baseOneOff:300, baseMrr:0 },
]

export const DEFAULT_MESSAGES = {
  first:'Olá, {nome}! Tudo bem? Sou Luid Gabriel, contador. Vi seu contato sobre {servico}. Posso entender melhor sua situação para te orientar?',
  proposal:'Olá, {nome}! Passando para confirmar se conseguiu analisar a proposta de {servico}. Se ficou alguma dúvida sobre escopo, valores ou próximos passos, me chama que eu explico.',
  follow:'Olá, {nome}! Tudo bem? Estou retomando nosso contato sobre {servico}. Ainda faz sentido para você resolver isso agora?',
  docs:'Olá, {nome}! Para avançarmos com {servico}, preciso das informações/documentos que combinamos. Se quiser, posso te lembrar exatamente o que está faltando.',
  reactivation:'Olá, {nome}! Tudo bem? Lembrei do seu caso de {servico} e queria saber se ainda faz sentido retomarmos isso agora.',
}

export const DIAG_SCHEMAS = {
  'Regularização MEI': [
    ['das','DAS em atraso?','select'],['dasn','DASN pendente?','select'],['revenue','Faturamento aproximado','text'],['debits','Possui débitos?','select'],['installment','Existe parcelamento?','select'],['nf','Emite nota fiscal?','select'],
  ],
  'Desenquadramento MEI': [
    ['revenue','Faturamento aproximado','text'],['exceeded','Excedeu o limite?','select'],['excessDate','Quando ocorreu o excesso?','text'],['employee','Possui funcionário?','select'],['nf','Emite nota fiscal?','select'],['retroactive','Possível retroatividade','text'],
  ],
  'Contabilidade mensal': [
    ['regime','Regime atual','text'],['revenue','Faturamento médio mensal','text'],['employees','Quantidade de funcionários','text'],['invoices','Volume de notas/mês','text'],['accountant','Possui contador atual?','select'],['pending','Possui pendências?','select'],
  ],
  'Abertura de empresa': [
    ['activity','Atividade principal','text'],['address','Endereço definido?','select'],['partners','Quantidade de sócios','text'],['capital','Capital estimado','text'],['revenue','Faturamento estimado','text'],['employees','Pretende ter funcionários?','select'],
  ],
  'IRPF': [
    ['income','Principais fontes de renda','text'],['assets','Possui bens relevantes?','select'],['investments','Possui investimentos?','select'],['dependents','Dependentes','text'],['pending','Pendência/malha?','select'],
  ],
}
