# CRM Comercial — Contador Luid Gabriel

## V2.3 Sales UX

Evolução da arquitetura React/JSX com foco em velocidade de cadastro, execução comercial, propostas profissionais e métricas confiáveis.

### Modelo comercial

```text
Contato
  └─ Empresa
      └─ Oportunidade
          ├─ Serviços
          ├─ Diagnóstico
          ├─ Propostas V1, V2, V3...
          ├─ Atividades / Follow-ups
          └─ Histórico
```

### Melhorias da V2.3

- Cadastro rápido por padrão: nome, WhatsApp, origem e serviço.
- Cadastro completo opcional sem atrapalhar a captação rápida.
- Busca global por cliente, telefone, e-mail, empresa, CNPJ, serviço ou etapa.
- Período global: hoje, 7 dias, 30 dias, este mês ou todo período.
- Central Comercial separa pipeline atual de resultado do período.
- Atividade pode ser concluída já criando o próximo follow-up.
- Ficha da oportunidade dividida em componentes independentes.
- Próxima ação ganha destaque e alerta quando está ausente.
- Proposta com código, versão, escopo, exclusões, prazo, valores, condição e observações ao cliente.
- Saída A4 profissional para imprimir ou salvar como PDF.
- Produção comercial usa datas reais de ganho/perda.
- Conversão por serviço usa coorte de entrada, evitando misturar vendas de meses diferentes.
- Funil acumulado por etapa para localizar gargalos comerciais.
- MRR permanece separado de receita avulsa.

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

### Testes

```bash
npm test
```

### Build

```bash
npm run build
```

## Branches

- `main`: baseline anterior à refatoração React.
- `v2.2-react`: fundação Contatos + Oportunidades.
- `v2.3-sales-ux`: experiência comercial e relatórios avançados.

## Próximo passo após validação

Depois de validar a V2.3 visualmente e no fluxo real de vendas, a persistência em `src/lib/storage.js` pode ser substituída por Supabase sem reescrever a interface. A prioridade antes disso é manter GitHub → Vercel Preview automatizado e revisar o fluxo completo em desktop e mobile.
