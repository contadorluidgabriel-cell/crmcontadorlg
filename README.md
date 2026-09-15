# CRM Comercial — Contador Luid Gabriel

## V2.3.1 — versão oficial

Versão oficial atual do CRM comercial do Contador Luid Gabriel.

O sistema é focado em captação, qualificação, diagnóstico, propostas, negociação, follow-up, reativação, fechamento e acompanhamento de indicadores comerciais. Depois do fechamento, a operação do cliente segue para o Meu Escritório Digital.

### Modelo comercial

```text
Contato
  └─ Empresa
      └─ Oportunidade
          ├─ Serviços
          ├─ Diagnóstico
          ├─ Propostas V1, V2, V3...
          ├─ Atividades / Follow-ups
          ├─ Histórico
          └─ Snapshot imutável da venda fechada
```

### V2.3.1

- Cadastro rápido com cadastro completo opcional.
- Busca global por cliente, telefone, e-mail, empresa, CNPJ, serviço ou etapa.
- Central Comercial com pipeline, prioridades, metas e leads parados.
- Pipeline por etapas com receita avulsa e MRR separados.
- Atividades e follow-ups com conclusão + próximo passo.
- Reativação de oportunidades perdidas ou adiadas.
- Propostas versionadas com escopo, exclusões, prazo, validade, valores e condições.
- Preço de tabela e preço final separados.
- Desconto avulso e mensal estruturado, permanente ou temporário, com teto comercial de 40%.
- PDF/A4 comercial com preço-base, desconto e preço final.
- Vendas ganhas congelam valores em `wonSnapshot`, preservando o histórico financeiro.
- Transições comerciais protegidas contra estados contraditórios.
- Relatórios por produção e por coorte.
- Catálogo com IDs estáveis compatíveis com o futuro Analista de Proposta.
- Schema 5 com migração segura do schema 4.
- Backups validados e modo de recuperação para formatos não reconhecidos.
- Proteção adicional contra sobrescrita entre abas.

### Stack

- React + JSX
- Vite
- Lucide React
- Fontsource Inter
- `localStorage` como persistência local atual

### Desenvolvimento

```bash
npm install
npm run dev
```

### Testes

```bash
npm test
```

### Build

```bash
npm run build
```

## Branches

- `main`: **versão oficial atual — V2.3.1**.
- `v2.3.1-integrity`: branch histórica da estabilização da V2.3.1.
- `v2.3-sales-ux`: branch histórica da V2.3.
- `v2.2-react`: fundação React anterior.

## Próximas evoluções

1. Importador JSON do **Analista de Proposta**.
2. Validação funcional completa desktop/mobile da versão oficial.
3. Publicação Vercel oficial conectada à `main`.
4. Persistência em banco quando o modelo comercial estiver consolidado.

### Regra de evolução

Mudanças que afetem preços, propostas, etapas, migração ou dados históricos devem incluir teste de domínio antes de chegar à `main`.
