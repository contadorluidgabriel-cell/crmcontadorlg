# CRM Comercial — Contador Luid Gabriel

## V2.2 React/JSX

Refatoração do CRM Comercial para React/JSX, mudando o modelo de dados para separar **Contato / Empresa / Oportunidade**.

### Objetivo da arquitetura

Um contato pode possuir várias oportunidades comerciais. Uma oportunidade pode conter vários serviços, propostas versionadas, atividades e histórico estruturado.

```text
Contato
  └─ Empresa
      └─ Oportunidade
          ├─ Serviços
          ├─ Diagnóstico
          ├─ Propostas V1, V2, V3...
          ├─ Atividades
          └─ Histórico
```

### O que já está implementado

- Central Comercial com pipeline ativo separado de adiados.
- Pipeline Kanban.
- Contatos com múltiplas oportunidades.
- Vários serviços na mesma oportunidade.
- Diagnóstico comercial por serviço principal.
- Propostas versionadas.
- Receita avulsa separada de MRR.
- Datas comerciais separadas: `createdAt`, `wonAt`, `lostAt`, `stageEnteredAt`, `reactivationAt`.
- Relatórios por data real de entrada, ganho e perda.
- Tempo na etapa.
- Score de prioridade explicável.
- Atividades e follow-ups.
- Reativação de adiados e perdidos.
- WhatsApp sem API com confirmação manual antes de registrar contato.
- Catálogo de serviços configurável.
- Backup/importação JSON.
- Migração automática da V2.1 armazenada em `crm_luid_gabriel_v2` para o novo schema.
- Design system único com Inter self-hosted e ícones SVG Lucide.

### Stack

- React + JSX
- Vite
- Lucide React
- Fontsource Inter
- localStorage como persistência temporária

### Rodar localmente

```bash
npm install
npm run dev
```

### Validar regras de domínio

```bash
npm test
```

### Build

```bash
npm run build
```

## Branches

- `main`: baseline da fase V2.1.
- `v2.2-react`: nova arquitetura React/JSX.

## Próximo passo técnico

Quando o fluxo V2.2 estiver validado visualmente, a camada de persistência em `src/lib/storage.js` pode ser substituída por Supabase sem reescrever as páginas e componentes.
