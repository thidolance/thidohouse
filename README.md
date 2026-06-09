# ThidoHouse · Controle Financeiro

App de controle financeiro doméstico — Next.js 16, TypeScript, Tailwind CSS e Firebase Firestore.

## Funcionalidades

- **Visão Geral** — gráficos de evolução de ganhos, gastos e poupança por categoria (últimos 12 meses)
- **Entradas** — registro de salários/receitas com distribuição percentual por categoria (contas, férias, investimento, planos futuros)
- **Contas do Mês** — cadastro de contas com categoria, vencimento e status pago/pendente
- **Cartões** — compras parceladas agrupadas por cartão (Bradesco, Nubank, Sicob, Inter)

O seletor de mês no topo é global — muda todos os dados de todas as abas ao mesmo tempo.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy

O projeto está configurado para deploy na Vercel. Basta conectar o repositório — o Firebase config já está embutido em `lib/firebase.ts`.
