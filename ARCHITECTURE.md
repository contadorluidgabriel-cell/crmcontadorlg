# Arquitetura V2.2

## Entidades

### contacts
Pessoa responsável pelo contato comercial.

Campos principais: `id`, `name`, `phone`, `email`, `city`, `source`, `createdAt`.

### companies
Empresa vinculada à oportunidade.

Campos principais: `id`, `name`, `doc`, `type`, `city`.

### opportunities
Unidade central de venda. Um mesmo contato pode possuir várias oportunidades.

Campos principais: `contactId`, `companyId`, `stage`, `temp`, `source`, `items`, `createdAt`, `updatedAt`, `stageEnteredAt`, `wonAt`, `lostAt`, `reactivationAt`, `diagnosis`, `proposals`, `history`.

### opportunity.items
Serviços negociados dentro da oportunidade.

Cada item separa `oneOff` de `mrr`.

### proposals
Array versionado dentro da oportunidade.

Uma proposta já enviada ou em negociação não é sobrescrita silenciosamente: uma alteração gera uma nova versão.

### activities
Atividades comerciais vinculadas à oportunidade, não diretamente ao contato.

## Regra financeira

- Pipeline ativo exclui `Adiado` e `Perdido`.
- Receita fechada usa `wonAt`.
- Perdas usam `lostAt`.
- Entrada de lead usa `createdAt`.
- MRR nunca é somado como se fosse receita avulsa.

## Persistência

A interface usa o Context do React e uma camada isolada em `src/lib/storage.js`.

Hoje: `React -> storage.js -> localStorage`.

Futuro: `React -> repository/API -> Supabase`.
