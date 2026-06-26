# ThidoHouse — Especificação do Projeto

Aplicativo web de controle financeiro familiar. Gerencia entradas, contas, cartões, empresa (MEI/PJ), metas anuais e notas mensais, com assistente de IA integrado.

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| UI | React | 19 |
| Linguagem | TypeScript | 5 |
| Estilo | Tailwind CSS | 4 |
| Banco de dados | Firebase Firestore | 12 |
| Autenticação | JWT custom (jose) | 6 |
| IA | Vercel AI SDK + Google Gemini | ai@6, @ai-sdk/google@3 |
| Gráficos | @visactor/react-vchart | 2 |
| Gráficos (alt) | Recharts | 3 (instalado, não usado ativamente) |
| Ícones | lucide-react + SVGs inline | 1 |
| Utilitários | clsx, tailwind-merge, zod | — |
| Runtime Node | 20.x | — |
| Deploy | Vercel | projeto: `thidohouse`, team: `thidolances-projects` |

---

## Estrutura de Pastas

```
thidohouse/
├── app/
│   ├── layout.tsx          # RootLayout: fontes Geist, body flex col
│   ├── page.tsx            # Página principal: tabs + MonthPicker + NotasMes
│   ├── globals.css         # Estilos globais Tailwind
│   ├── login/
│   │   └── page.tsx        # Página de login
│   ├── actions/
│   │   └── auth.ts         # Server Actions: login(), logout()
│   └── api/
│       └── chat/
│           └── route.ts    # POST /api/chat — streaming Gemini
├── components/
│   ├── login-form.tsx      # Formulário de login com useActionState
│   ├── tabs/
│   │   ├── TabVisaoGeral.tsx   # Dashboard + assistente
│   │   ├── TabEntradas.tsx     # Entradas + distribuição
│   │   ├── TabContas.tsx       # Contas do mês
│   │   ├── TabCartoes.tsx      # Compras parceladas no cartão
│   │   ├── TabEmpresa.tsx      # Custos da empresa
│   │   ├── TabMetas.tsx        # Metas do ano
│   │   └── TabAssistente.tsx   # Chat IA (usado dentro do TabVisaoGeral)
│   └── ui/
│       ├── Card.tsx            # Wrapper de card com shadow
│       ├── Modal.tsx           # Modal genérico com ESC e backdrop
│       ├── MonthPicker.tsx     # Seletor de mês/ano (header)
│       ├── NotasMes.tsx        # Bloco de notas flutuante por mês
│       ├── Icons.tsx           # SVGs inline (ChevronLeft/Right, Plus, Trash, etc.)
│       ├── button.tsx          # Componente Button (shadcn style)
│       ├── input.tsx           # Componente Input
│       └── label.tsx           # Componente Label
├── lib/
│   ├── firebase.ts         # Inicialização Firebase (apenas Firestore)
│   ├── firestore.ts        # Todas as funções de CRUD do Firestore
│   ├── types.ts            # Interfaces TypeScript de todos os domínios
│   ├── auth.ts             # validateCredentials() — usuários via env vars
│   ├── session.ts          # encryptSession / decryptSession JWT (jose)
│   ├── ai-resumo.ts        # montarResumoFinanceiro() — contexto para IA
│   ├── cartoes.ts          # DEFAULT_CARTOES, DEFAULT_CATEGORIAS
│   ├── utils.ts            # cn() = clsx + twMerge
│   └── useRefetchOnFocus.ts # Hook: refetch ao retornar foco/visibilidade
├── public/                 # Assets estáticos
├── CLAUDE.md               # Instruções para o Claude Code
├── AGENTS.md               # Aviso: Next.js com breaking changes
├── SPEC.md                 # Este arquivo
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json         # Config shadcn/ui
└── package.json
```

---

## Autenticação

- **Sem Firebase Auth** — autenticação própria com usuário/senha
- Usuários hardcoded via variáveis de ambiente:
  - `AUTH_PASSWORD_THIAGO`
  - `AUTH_PASSWORD_LORENNA`
- Sessão: JWT HS256 assínado com `SESSION_SECRET`, salvo em cookie `httpOnly`
- Duração da sessão: 7 dias
- Login via Server Action (`app/actions/auth.ts`)
- Proteção de rota via middleware (verifica o cookie antes de servir `/`)

### Variáveis de Ambiente Necessárias

```env
SESSION_SECRET=<string aleatória longa>
AUTH_PASSWORD_THIAGO=<senha>
AUTH_PASSWORD_LORENNA=<senha>
GOOGLE_GENERATIVE_AI_API_KEY=<chave Gemini>
```

---

## Firebase / Firestore

Projeto: `thidohouse` | `thidohouse.firebaseapp.com`

Apenas Firestore é usado — sem Firebase Auth, Storage ou Functions.

As chaves do Firebase são públicas por design. A segurança fica nas Firestore Rules.

### Coleções

| Coleção | Descrição | Campos principais |
|---|---|---|
| `entradas` | Receitas do mês | `descricao, valor, data, mes, ano` |
| `distribuicoes` | Distribuição % das entradas | `mes, ano, contas, ferias, investimento, planosFuturos` |
| `contas` | Contas/despesas mensais | `descricao, categoria, valor, vencimento, status, mes, ano, parcelaAtual?, totalParcelas?, fixa?, grupoId?` |
| `categorias_contas` | Categorias de contas | `nome, cor` |
| `cartoes` | Cartões de crédito | `nome, cor, bandeira?, limite?` |
| `categorias` | Categorias de compras | `nome, cor` |
| `compras` | Compras parceladas no cartão | `cartaoId, descricao, tipo, valorTotal, valorParcela, totalParcelas, parcelaAtual, mes, ano, grupoId?, fixa?, data?` |
| `faturas_cartao` | Status da fatura por cartão/mês | `cartaoId, mes, ano, status` · ID: `{cartaoId}_{MM}_{YYYY}` |
| `categorias_empresa` | Categorias de custos da empresa | `nome, cor` |
| `custos_empresa` | Custos da empresa (parcelados) | `categoriaId, descricao, valor, valorParcela, totalParcelas, parcelaAtual, mes, ano, grupoId?` |
| `faturas_empresa` | Status de pagamento por categoria/mês | `categoriaId, mes, ano, status` · ID: `{categoriaId}_{MM}_{YYYY}` |
| `metas` | Metas anuais | `ano, nome, valor, concluida, link?` |
| `notas_mes` | Anotações livres por mês | `mes, ano, texto, updatedAt` · ID: `{YYYY}_{MM}` |

### Padrões de Dados

**grupoId** — une registros de uma mesma série (contas fixas, compras parceladas). Gerado como `${Date.now()}_${random}`.

**Conta fixa** — ao criar, propaga 24 meses à frente. Ao desativar, apaga todos os meses futuros do grupo.

**Compra parcelada** — ao criar, gera um documento por parcela restante, cada um no mês correto, com `parcelaAtual` incrementado.

**Contas parceladas** — mesmo comportamento das compras: uma doc por parcela restante.

**Update com propagação** — `updateCompraAndFuture` e `updateContaAndFuture` atualizam o registro atual e todos os futuros do mesmo grupo, preservando `mes`, `ano` e `parcelaAtual` de cada um.

---

## Funcionalidades / Abas

### Navegação

Header fixo com:
- Logo ThidoHouse
- `MonthPicker` — navega entre meses/anos
- Botão logout

Tabs horizontais com scroll:

| Tab | Componente |
|---|---|
| Visão Geral | `TabVisaoGeral` |
| Contas do Mês | `TabContas` |
| Cartões | `TabCartoes` |
| Empresa | `TabEmpresa` |
| Entradas | `TabEntradas` |
| Metas do Ano | `TabMetas` |

### Visão Geral (`TabVisaoGeral`)

- Cards: Ganhos, Gastos, Saldo, Guardado do mês
- Gráfico de barras: Ganhos vs Gastos — últimos 12 meses (VChart)
- Donut: Gastos por categoria — mês atual (VChart)
- Donut: Gastos por tipo (Fixas, Rotativas, Cartões, Empresa) — mês atual (VChart)
- Gráfico de barras empilhadas: Investimentos por categoria — últimos 12 meses (VChart)
- `TabAssistente` embutido no final

### Assistente Financeiro (`TabAssistente` / `GET /api/chat`)

- Chat streaming com Gemini 2.5 Flash
- Contexto: resumo completo do mês atual (entradas, contas, compras, empresa, saldo)
- Tool: `consultarMes(mes, ano)` — busca resumo de outro mês sob demanda
- `stopWhen: stepCountIs(5)` para limitar loops
- `thinkingBudget: 0` para resposta mais rápida
- Sugestões pré-definidas na tela inicial do chat

### Entradas (`TabEntradas`)

- CRUD de receitas do mês
- Configuração de distribuição das entradas em %:
  - Contas, Férias, Investimento, Planos Futuros
- Visualização do valor absoluto de cada fatia

### Contas do Mês (`TabContas`)

- CRUD de contas com categorias coloridas
- Suporte a: fixa (recorrente), parcelada
- Status: pago / pendente
- Atualização com ou sem propagação futura
- Exclusão com ou sem propagação futura

### Cartões (`TabCartoes`)

- Gerenciamento de cartões (nome, cor, bandeira, limite)
- CRUD de compras parceladas por cartão
- Status de fatura: pago / pendente por mês

### Empresa (`TabEmpresa`)

- Categorias de custos (DAS, DARF, Renegociação, etc.)
- CRUD de custos parcelados por categoria
- Status de pagamento por categoria/mês

### Metas do Ano (`TabMetas`)

- CRUD de metas com valor alvo e link opcional
- Toggle concluída/pendente
- Filtro por ano

### Notas do Mês (`NotasMes`)

- Botão flutuante roxo no canto inferior direito
- Abre painel estilo chat ao clicar
- Textarea livre por mês/ano
- Salva no Firestore (`notas_mes`)
- Indicador visual (ponto amarelo) quando há alteração não salva

---

## Componentes UI Reutilizáveis

| Componente | Uso |
|---|---|
| `Card` | Container com borda e shadow para seções |
| `Modal` | Modal com backdrop, botão X e ESC para fechar |
| `MonthPicker` | Navegação mês/ano no header |
| `NotasMes` | Bloco de notas flutuante (botão + painel) |
| `Icons` | SVGs inline: ChevronLeft/Right, Plus, Trash, Check, X, CreditCard, TrendingUp, Receipt, LayoutGrid, Building, MessageCircle, Pencil, Target, LinkIcon, FamilyIcon |
| `button`, `input`, `label` | Primitivos estilo shadcn/ui |

---

## Hooks e Utilitários

| Arquivo | Exporta | Descrição |
|---|---|---|
| `lib/utils.ts` | `cn()` | clsx + tailwind-merge |
| `lib/useRefetchOnFocus.ts` | `useRefetchOnFocus(cb)` | Reexecuta callback ao voltar foco/visibilidade (mobile) |
| `lib/ai-resumo.ts` | `montarResumoFinanceiro(mes, ano)` | Monta string de contexto para o chat IA |

---

## Deploy

- **Plataforma**: Vercel
- **Projeto**: `thidohouse` | **Team**: `thidolances-projects`
- **Preview da branch ativa**: `https://thidohouse-git-<branch-slug>-thidolances-projects.vercel.app`
- **Branch principal**: `main`
- **Node.js**: 20.x (declarado em `package.json` → `engines`)
- Build command padrão: `next build`

---

## Padrões de Código

- Todos os componentes client-side têm `'use client'` no topo
- Server Actions têm `'use server'`
- Dados sempre buscados direto do Firestore via funções em `lib/firestore.ts`
- `useRefetchOnFocus` em todos os tabs com dados para mobile
- Formatação de moeda: `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Carregamento: estado `loading` com spinner ou texto "Carregando dados..."
- Paleta principal: indigo-600 (primário), rose/red (gastos), emerald (positivo), violet/purple (guardado/notas)
