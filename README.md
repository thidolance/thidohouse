# ThidoHouse · Controle Financeiro

App de controle financeiro doméstico — Next.js 16, React 19, TypeScript, Tailwind CSS v4 e Firebase Firestore.

## Funcionalidades

### Visão Geral
- Cards do mês: Ganhos, Gastos, Saldo e Guardado (com % dos ganhos)
- Evolução: Ganhos vs Gastos (últimos 12 meses, mês atual destacado)
- Gastos por Categoria (Contas + Cartões)
- Gastos por Tipo de Conta (Fixas, Rotativas, Cartões, Empresa)
- Investimentos por categoria
- Evolução do Total Guardado (últimos 12 meses)

### Entradas
- Registro de salários/receitas do mês com distribuição percentual por categoria (contas, férias, investimento, planos futuros)

### Contas do Mês
- Cadastro de contas com categoria, vencimento e status pago/pendente
- **Contas Fixas** — recorrentes, exibidas sempre no topo da lista, com opção de marcar/desmarcar recorrência
- **Contas Rotativas** — contas avulsas do mês, podendo ser parceladas
- Inclui também faturas de Cartões e custos da Empresa do mês na mesma listagem
- Gráficos: Por Categoria e Por Tipo de Conta

### Cartões
- Cadastro de cartões (nome, cor, bandeira) e categorias de compra, configuráveis pela UI
- Compras parceladas, vinculadas entre os meses por `grupoId` (permite excluir só a parcela atual ou esta e as seguintes)
- Gráficos: Gasto por Cartão e Por Categoria
- Cards visuais por cartão com total do mês e detalhamento das compras

### Empresa
- Cadastro de custos da empresa por categoria (configuráveis pela UI), com suporte a parcelamento
- Gráficos: Custo por Categoria e Distribuição

O seletor de mês no topo é global — muda os dados de todas as abas ao mesmo tempo.

## Autenticação

Login simples por usuário/senha (sem cadastro de novos usuários). A sessão é um JWT assinado (lib `jose`), guardado em cookie httpOnly por 7 dias.

Usuários disponíveis: `thiago` e `lorenna`, com senha definida via variáveis de ambiente.

## Variáveis de ambiente

Crie um `.env.local` na raiz com:

```
SESSION_SECRET=algum-segredo-aleatorio-grande
AUTH_PASSWORD_THIAGO=senha-do-thiago
AUTH_PASSWORD_LORENNA=senha-da-lorenna
```

> A configuração do Firebase está embutida em `lib/firebase.ts` — são chaves públicas do client SDK, a segurança fica por conta das Firestore Rules.

## Modelo de dados (Firestore)

- `entradas`, `contas`, `compras` (cartões) e `custos_empresa` são registros mensais (campos `mes`/`ano`)
- Contas fixas e compras/custos parcelados compartilham um `grupoId` entre os meses da mesma série, permitindo edições/exclusões em cascata ("este mês" ou "este e os seguintes")
- Cartões, categorias (de contas, compras e empresa) e a distribuição de entradas são totalmente configuráveis pela UI (sem dados fixos no código)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy

Projeto configurado para deploy na Vercel. Conecte o repositório e configure as variáveis de ambiente da seção acima no painel do projeto.
