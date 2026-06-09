'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Check, Pencil } from '../ui/Icons';
import {
  getContas, addConta, updateConta, updateContaAndFuture,
  deleteConta, deleteContaAndFuture,
  updateContaStatus, toggleContaFixa,
  getCategoriasContas, addCategoriaContas, deleteCategoriaContas,
  getCompras, getFaturasCartao, setFaturaCartaoStatus, getCartoes,
  getCustosEmpresa, getFaturasEmpresa, setFaturaEmpresaStatus, getCategoriasEmpresa,
} from '@/lib/firestore';
import type { Conta, CategoriaContaConfig } from '@/lib/types';

// ── VChart (SSR-safe) ────────────────────────────────────────────────────────
const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 rounded-xl h-full w-full" /> },
);

// ── Ícones locais ────────────────────────────────────────────────────────────

function GearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PinIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  );
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

function ScopeDialog({ title, desc, labelFuture, onFuture, onThisOnly, onCancel }: {
  title: string; desc: string; labelFuture: string;
  onFuture(): void; onThisOnly(): void; onCancel(): void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-[fadeIn_0.15s_ease]">
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        <div className="space-y-2 pt-1">
          <button onClick={onFuture} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            {labelFuture}
          </button>
          <button onClick={onThisOnly} className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            Só este mês
          </button>
          <button onClick={onCancel} className="w-full py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Constantes ────────────────────────────────────────────────────────────────

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300';
const fmt   = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type OrdenacaoKey = 'vencimento-asc' | 'vencimento-desc' | 'valor-asc' | 'valor-desc' | 'nome-az' | 'nome-za' | 'status';
const ORDENACAO_OPTS: { value: OrdenacaoKey; label: string }[] = [
  { value: 'vencimento-asc',  label: 'Vencimento ↑' },
  { value: 'vencimento-desc', label: 'Vencimento ↓' },
  { value: 'valor-asc',       label: 'Valor ↑'       },
  { value: 'valor-desc',      label: 'Valor ↓'       },
  { value: 'nome-az',         label: 'Nome A→Z'      },
  { value: 'nome-za',         label: 'Nome Z→A'      },
  { value: 'status',          label: 'Pendentes 1º'  },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Props { mes: number; ano: number; }

type FormState = {
  descricao: string; categoria: string; valor: string; vencimento: string;
  parcelaAtual: string; totalParcelas: string; fixa: boolean;
};

type CartaoItem  = { tipo: 'cartao';  cartaoId: string; cartaoNome: string; cartaoCor: string; valor: number; status: 'pago' | 'pendente' };
type EmpresaItem = { categoriaId: string; categoriaNome: string; categoriaCor: string; valor: number; status: 'pago' | 'pendente' };

type DeleteDialog = { conta: Conta };
type EditScopeDialog = { conta: Conta; data: Omit<Conta, 'id'> };

// ── Componente ────────────────────────────────────────────────────────────────

export default function TabContas({ mes, ano }: Props) {
  const now = new Date();

  // dados
  const [contas, setContas]             = useState<Conta[]>([]);
  const [cats, setCats]                 = useState<CategoriaContaConfig[]>([]);
  const [itensCartao, setItensCartao]   = useState<CartaoItem[]>([]);
  const [itensEmpresa, setItensEmpresa] = useState<EmpresaItem[]>([]);
  const [loading, setLoading]           = useState(false);

  // modais
  const [showModal, setShowModal]        = useState(false);
  const [showConfigModal, setShowConfig] = useState(false);
  const [showCatForm, setShowCatForm]    = useState(false);
  const [editId, setEditId]              = useState<string | null>(null);
  const [editConta, setEditConta]        = useState<Conta | null>(null);
  const [formCat, setFormCat]            = useState({ nome: '', cor: '#6366f1' });

  // dialogs escopo
  const [deleteDialog, setDeleteDialog]       = useState<DeleteDialog | null>(null);
  const [editScopeDialog, setEditScopeDialog] = useState<EditScopeDialog | null>(null);

  // filtros
  const [busca, setBusca]                     = useState('');
  const [filtroStatus, setFiltroStatus]       = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [filtroTipo, setFiltroTipo]           = useState<'todos' | 'contas' | 'cartoes' | 'empresa'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ordenacao, setOrdenacao]             = useState<OrdenacaoKey>('vencimento-asc');

  // form
  const makeEmpty = useCallback((c: CategoriaContaConfig[]) => ({
    descricao: '', categoria: c[0]?.nome ?? '', valor: '', vencimento: '',
    parcelaAtual: '', totalParcelas: '', fixa: false,
  }), []);
  const [form, setForm] = useState<FormState>({
    descricao: '', categoria: '', valor: '', vencimento: '', parcelaAtual: '', totalParcelas: '', fixa: false,
  });

  // ── carregamento ──────────────────────────────────────────────────────────

  const loadCats = useCallback(async () => {
    const c = await getCategoriasContas();
    setCats(c);
    return c;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [contasList, comprasList, faturasList, cartoesList, custosList, faturasEmpresaList, catsEmpresaList] = await Promise.all([
      getContas(mes, ano),
      getCompras(mes, ano),
      getFaturasCartao(mes, ano),
      getCartoes(),
      getCustosEmpresa(mes, ano),
      getFaturasEmpresa(mes, ano),
      getCategoriasEmpresa(),
    ]);

    setContas(contasList);

    const cards: CartaoItem[] = cartoesList.flatMap((c): CartaoItem[] => {
      const total = comprasList.filter((p) => p.cartaoId === c.id).reduce((s, p) => s + p.valorParcela, 0);
      if (total === 0) return [];
      const fatura = faturasList.find((f) => f.cartaoId === c.id);
      return [{ tipo: 'cartao', cartaoId: c.id as string, cartaoNome: c.nome, cartaoCor: c.cor, valor: total, status: fatura?.status ?? 'pendente' }];
    });
    setItensCartao(cards);

    const empresa: EmpresaItem[] = catsEmpresaList.flatMap((cat): EmpresaItem[] => {
      const total = custosList.filter((c) => c.categoriaId === cat.id).reduce((s, c) => s + c.valorParcela, 0);
      if (total === 0) return [];
      const fatura = faturasEmpresaList.find((f) => f.categoriaId === cat.id);
      return [{ categoriaId: cat.id as string, categoriaNome: cat.nome, categoriaCor: cat.cor, valor: total, status: fatura?.status ?? 'pendente' }];
    });
    setItensEmpresa(empresa);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { loadCats().then((c) => setForm(makeEmpty(c))); }, [loadCats, makeEmpty]);
  useEffect(() => { load(); }, [load]);

  // ── empresa sum ───────────────────────────────────────────────────────────

  const empresaSum   = itensEmpresa.reduce((s, c) => s + c.valor, 0);
  const empresaStatus: 'pago' | 'pendente' = itensEmpresa.length > 0 && itensEmpresa.every((c) => c.status === 'pago') ? 'pago' : 'pendente';

  // ── listas filtradas ──────────────────────────────────────────────────────

  const catCor = (nome: string) => cats.find((c) => c.nome === nome)?.cor ?? '#94a3b8';

  const applyContaFilters = (list: Conta[]) => {
    let r = [...list];
    if (filtroStatus !== 'todos')   r = r.filter((c) => c.status === filtroStatus);
    if (filtroCategoria)            r = r.filter((c) => c.categoria === filtroCategoria);
    if (busca.trim())               r = r.filter((c) => c.descricao.toLowerCase().includes(busca.toLowerCase()));
    return r;
  };

  const sortContas = (list: Conta[]) => {
    return [...list].sort((a, b) => {
      // Pago sempre vai para o final da sua seção
      if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1;
      // Dentro do mesmo status, aplica o critério escolhido
      switch (ordenacao) {
        case 'vencimento-asc':  return a.vencimento - b.vencimento;
        case 'vencimento-desc': return b.vencimento - a.vencimento;
        case 'valor-asc':       return a.valor - b.valor;
        case 'valor-desc':      return b.valor - a.valor;
        case 'nome-az':         return a.descricao.localeCompare(b.descricao);
        case 'nome-za':         return b.descricao.localeCompare(a.descricao);
        default:                return a.vencimento - b.vencimento;
      }
    });
  };

  // Fixas sempre acima, depois ordenado pelo sort escolhido
  const contasFixas = useMemo(() => {
    const filtered = applyContaFilters(contas.filter((c) => c.fixa));
    return sortContas(filtered);
  }, [contas, filtroStatus, filtroCategoria, busca, ordenacao]); // eslint-disable-line react-hooks/exhaustive-deps

  const contasRegulares = useMemo(() => {
    const filtered = applyContaFilters(contas.filter((c) => !c.fixa));
    return sortContas(filtered);
  }, [contas, filtroStatus, filtroCategoria, busca, ordenacao]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartoesFiltrados = useMemo(() => {
    let list = [...itensCartao];
    if (filtroStatus !== 'todos') list = list.filter((c) => c.status === filtroStatus);
    if (busca.trim())             list = list.filter((c) => c.cartaoNome.toLowerCase().includes(busca.toLowerCase()));
    return list;
  }, [itensCartao, filtroStatus, busca]);

  const mostrarContas  = filtroTipo === 'todos' || filtroTipo === 'contas';
  const mostrarCartoes = filtroTipo === 'todos' || filtroTipo === 'cartoes';
  const mostrarEmpresa = filtroTipo === 'todos' || filtroTipo === 'empresa';

  const totalVisiveis = (mostrarContas  ? contasFixas.length + contasRegulares.length : 0)
    + (mostrarCartoes ? cartoesFiltrados.length : 0)
    + (mostrarEmpresa && empresaSum > 0 ? 1 : 0);

  const filtrosAtivos = !!(busca || filtroStatus !== 'todos' || filtroTipo !== 'todos' || filtroCategoria);

  // ── métricas (brutas, sem filtro) ─────────────────────────────────────────

  const totalContasPago      = contas.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalContasPendente  = contas.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPago     = itensCartao.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPendente = itensCartao.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalEmpresaPago     = itensEmpresa.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalEmpresaPendente = itensEmpresa.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalPago            = totalContasPago + totalCartoesPago + totalEmpresaPago;
  const totalPendente        = totalContasPendente + totalCartoesPendente + totalEmpresaPendente;
  const total                = totalPago + totalPendente;
  const pctPago              = total > 0 ? (totalPago / total) * 100 : 0;
  const countTotal           = contas.length + itensCartao.length + (empresaSum > 0 ? 1 : 0);
  const countPago            = contas.filter((c) => c.status === 'pago').length
    + itensCartao.filter((c) => c.status === 'pago').length
    + (empresaStatus === 'pago' && empresaSum > 0 ? 1 : 0);

  const pendentesHoje = contas.filter(
    (c) => c.status === 'pendente' && c.vencimento <= now.getDate()
      && mes === now.getMonth() + 1 && ano === now.getFullYear(),
  );

  // ── specs VChart ──────────────────────────────────────────────────────────

  const pieValues = useMemo(() => {
    const contsData = cats.map((cat) => ({
      name: cat.nome,
      value: contas.filter((c) => c.categoria === cat.nome).reduce((s, c) => s + c.valor, 0),
      fill: cat.cor,
    })).filter((d) => d.value > 0);
    const cardsData = itensCartao.map((c) => ({ name: c.cartaoNome, value: c.valor, fill: c.cartaoCor }));
    const empData   = empresaSum > 0 ? [{ name: 'Empresa', value: empresaSum, fill: '#38bdf8' }] : [];
    return [...contsData, ...cardsData, ...empData];
  }, [cats, contas, itensCartao, empresaSum]);

  const donutSpec = useMemo(() => ({
    type: 'pie',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'pie', values: pieValues }],
    valueField: 'value',
    categoryField: 'name',
    outerRadius: 0.75,
    innerRadius: 0.52,
    padAngle: 1,
    color: pieValues.map((d) => d.fill),
    pie: { style: { cornerRadius: 4 } },
    label: { visible: false },
    legends: [{
      visible: true,
      orient: 'bottom',
      padding: { top: 10 },
      maxRow: 3,
      item: {
        label: { style: { fontSize: 11, fill: '#64748b' } },
        value: { visible: false },
      },
    }],
    tooltip: {
      mark: {
        title: { visible: false },
        content: [{
          key: (d: Record<string, unknown>) => String(d['name']),
          value: (d: Record<string, unknown>) => fmt(Number(d['value'])),
        }],
      },
    },
  }), [pieValues]);

  const barSpec = useMemo(() => ({
    type: 'bar',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'bar', values: [
      { name: 'Pago',     valor: totalPago,     fill: '#10b981' },
      { name: 'Pendente', valor: totalPendente, fill: '#f59e0b' },
    ]}],
    xField: 'name',
    yField: 'valor',
    color: ['#10b981', '#f59e0b'],
    bar: {
      style: {
        cornerRadius: [8, 8, 0, 0],
        fill: (d: Record<string, unknown>) => String(d['fill']),
      },
    },
    axes: [
      { orient: 'bottom', domainLine: { visible: false }, tick: { visible: false }, label: { style: { fontSize: 12, fill: '#64748b' } } },
      {
        orient: 'left',
        grid: { style: { stroke: '#f1f5f9', lineDash: [3, 3] } },
        domainLine: { visible: false },
        tick: { visible: false },
        label: {
          style: { fontSize: 11, fill: '#94a3b8' },
          formatMethod: (v: number) => v === 0 ? 'R$0' : `R$${(v / 1000).toFixed(0)}k`,
        },
      },
    ],
    tooltip: {
      mark: {
        title: { visible: false },
        content: [{
          key: (d: Record<string, unknown>) => String(d['name']),
          value: (d: Record<string, unknown>) => fmt(Number(d['valor'])),
        }],
      },
    },
  }), [totalPago, totalPendente]);

  // ── form helpers ──────────────────────────────────────────────────────────

  const isParcelada = !!(form.parcelaAtual || form.totalParcelas);

  function abrirNova() {
    setEditId(null);
    setEditConta(null);
    setForm(makeEmpty(cats));
    setShowModal(true);
  }

  function abrirEditar(c: Conta) {
    setEditId(c.id!);
    setEditConta(c);
    setForm({
      descricao:     c.descricao,
      categoria:     c.categoria,
      valor:         c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      vencimento:    String(c.vencimento),
      parcelaAtual:  c.parcelaAtual  ? String(c.parcelaAtual)  : '',
      totalParcelas: c.totalParcelas ? String(c.totalParcelas) : '',
      fixa:          c.fixa ?? false,
    });
    setShowModal(true);
  }

  // ── handlers ─────────────────────────────────────────────────────────────

  function buildContaData(): Omit<Conta, 'id'> {
    const valor      = parseFloat(form.valor.replace(/\./g, '').replace(',', '.'));
    const vencimento = parseInt(form.vencimento);
    return {
      descricao:     form.descricao,
      categoria:     form.categoria,
      valor,
      vencimento,
      status: 'pendente',
      mes, ano,
      ...(form.parcelaAtual  ? { parcelaAtual:  parseInt(form.parcelaAtual)  } : {}),
      ...(form.totalParcelas ? { totalParcelas: parseInt(form.totalParcelas) } : {}),
      fixa: form.fixa && !form.parcelaAtual,
    };
  }

  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = buildContaData();
    if (editId) {
      const atual = editConta!;
      if (atual.grupoId) {
        // Tem meses futuros linkados → perguntar escopo
        setShowModal(false);
        setEditScopeDialog({ conta: atual, data: { ...data, grupoId: atual.grupoId } });
        return;
      }
      await updateConta(editId, { ...data, grupoId: atual.grupoId });
    } else {
      await addConta(data);
    }
    fecharModal();
    load();
  }

  async function confirmarEditScope(scope: 'this' | 'future') {
    const { conta, data } = editScopeDialog!;
    setEditScopeDialog(null);
    if (scope === 'future') {
      await updateContaAndFuture(conta.id!, conta, data);
    } else {
      await updateConta(conta.id!, data);
    }
    fecharModal();
    load();
  }

  function fecharModal() {
    setShowModal(false);
    setEditId(null);
    setEditConta(null);
    setForm(makeEmpty(cats));
  }

  async function handleTogglePago(id: string, status: 'pago' | 'pendente') {
    await updateContaStatus(id, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleToggleFixa(c: Conta) {
    await toggleContaFixa(c.id!, c, !c.fixa);
    load();
  }

  function iniciarDelete(c: Conta) {
    if (c.grupoId) {
      setDeleteDialog({ conta: c });
    } else {
      deleteConta(c.id!).then(load);
    }
  }

  async function confirmarDelete(scope: 'this' | 'future') {
    const { conta } = deleteDialog!;
    setDeleteDialog(null);
    if (scope === 'future') {
      await deleteContaAndFuture(conta.id!, conta);
    } else {
      await deleteConta(conta.id!);
    }
    load();
  }

  async function handleToggleCartao(cartaoId: string, status: 'pago' | 'pendente') {
    await setFaturaCartaoStatus(cartaoId, mes, ano, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleToggleEmpresaAll() {
    const newStatus = empresaStatus === 'pago' ? 'pendente' : 'pago';
    await Promise.all(itensEmpresa.map((c) => setFaturaEmpresaStatus(c.categoriaId, mes, ano, newStatus)));
    load();
  }

  async function handleSaveCat(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await addCategoriaContas(formCat);
    setShowCatForm(false);
    setFormCat({ nome: '', cor: '#6366f1' });
    loadCats();
  }

  async function handleDeleteCat(id: string) {
    await deleteCategoriaContas(id);
    loadCats();
  }

  function limparFiltros() {
    setBusca('');
    setFiltroStatus('todos');
    setFiltroTipo('todos');
    setFiltroCategoria('');
    setOrdenacao('vencimento-asc');
  }

  // ── render helpers ────────────────────────────────────────────────────────

  function ContaRow({ c }: { c: Conta }) {
    const pago = c.status === 'pago';
    const cor  = catCor(c.categoria);
    return (
      <div className={`group flex items-center gap-3 px-4 py-3.5 transition-all ${pago ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'}`}>
        <div className="w-0.5 h-10 rounded-full flex-shrink-0 opacity-60 transition-opacity group-hover:opacity-100" style={{ backgroundColor: cor }} />
        <button
          onClick={() => handleTogglePago(c.id!, c.status)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
            pago ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
          }`}
        >
          {pago && <Check />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`font-semibold text-sm leading-tight ${pago ? 'line-through text-slate-400' : 'text-slate-800'}`}>{c.descricao}</p>
            {c.fixa && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">fixa</span>}
            {c.totalParcelas && c.parcelaAtual && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-semibold">{c.parcelaAtual}/{c.totalParcelas}x</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${cor}18`, color: cor }}>{c.categoria}</span>
            <span className="text-[11px] text-slate-400">dia {c.vencimento}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className={`font-bold text-sm tabular-nums mr-1.5 ${pago ? 'text-emerald-600' : 'text-slate-800'}`}>{fmt(c.valor)}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {!c.parcelaAtual && (
              <button onClick={() => handleToggleFixa(c)} title={c.fixa ? 'Remover recorrência' : 'Marcar como fixa'}
                className={`p-1.5 rounded-lg transition-colors ${c.fixa ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}>
                <PinIcon filled={c.fixa} />
              </button>
            )}
            <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Pencil /></button>
            <button onClick={() => iniciarDelete(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash /></button>
          </div>
        </div>
      </div>
    );
  }

  function SectionHeader({ label, count, total: t }: { label: string; count: number; total: number }) {
    return (
      <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-transparent flex items-center justify-between border-b border-slate-100/80">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] text-slate-400">{count} · {fmt(t)}</p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Contas do Mês</h2>
          <p className="text-xs text-slate-400">{countPago}/{countTotal} pagas · {fmt(totalPendente)} pendentes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <GearIcon /><span className="hidden sm:inline">Configurações</span>
          </button>
          <button onClick={abrirNova}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus /><span className="hidden sm:inline">Nova Conta</span>
          </button>
        </div>
      </div>

      {/* ── Alerta ── */}
      {pendentesHoje.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="text-amber-800 text-sm font-semibold">{pendentesHoje.length} conta(s) vencida(s) ou vencendo hoje</p>
            <p className="text-amber-600 text-xs mt-0.5">{pendentesHoje.map((c) => c.descricao).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* ── Cards resumo ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-4 text-white shadow-md shadow-indigo-200">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide relative">Total</p>
          <p className="text-xl font-bold mt-1 tabular-nums relative">{fmt(total)}</p>
          <div className="mt-2.5 h-1 bg-white/20 rounded-full overflow-hidden relative">
            <div className="h-full bg-white/70 rounded-full transition-all duration-700" style={{ width: `${pctPago}%` }} />
          </div>
          <p className="text-indigo-200 text-[11px] mt-1 relative">{pctPago.toFixed(0)}% pago</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wide">Pago</p>
          <p className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">{fmt(totalPago)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <p className="text-[11px] text-slate-400">{countPago} item(s)</p>
          </div>
        </div>
        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wide">Pendente</p>
          <p className="text-xl font-bold text-amber-500 mt-1 tabular-nums">{fmt(totalPendente)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <p className="text-[11px] text-slate-400">{countTotal - countPago} item(s)</p>
          </div>
        </div>
      </div>

      {/* ── Gráficos VChart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="font-semibold text-slate-700 text-sm mb-3">Por Categoria</p>
          {pieValues.length > 0 ? (
            <div style={{ height: 240 }}>
              <VChart key={`donut-${pieValues.reduce((s, v) => s + v.value, 0).toFixed(0)}-${pieValues.length}`} spec={donutSpec as any} />
            </div>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm">Nenhum dado ainda</p>
            </div>
          )}
        </Card>
        <Card>
          <p className="font-semibold text-slate-700 text-sm mb-3">Pago vs Pendente</p>
          <div style={{ height: 240 }}>
            <VChart key={`bar-${totalPago.toFixed(0)}-${totalPendente.toFixed(0)}`} spec={barSpec as any} />
          </div>
        </Card>
      </div>

      {/* ── Lista com filtros ── */}
      <Card className="!p-0 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></div>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por descrição..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400" />
            </div>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><SortIcon /></div>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as OrdenacaoKey)}
                className="pl-8 pr-7 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
                {ORDENACAO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['todos', 'pendente', 'pago'] as const).map((s) => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filtroStatus === s
                    ? s === 'todos' ? 'bg-slate-800 text-white border-slate-800'
                      : s === 'pago' ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-amber-400 text-white border-amber-400'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {s === 'todos' ? 'Todos' : s === 'pago' ? '✓ Pago' : '⏳ Pendente'}
              </button>
            ))}
            <div className="w-px bg-slate-200 self-stretch" />
            {([['todos','Tudo'],['contas','Contas'],['cartoes','Cartões'],['empresa','Empresa']] as const).map(([v, l]) => (
              <button key={v} onClick={() => { setFiltroTipo(v); setFiltroCategoria(''); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filtroTipo === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >{l}</button>
            ))}
            {(filtroTipo === 'todos' || filtroTipo === 'contas') && cats.length > 0 && (
              <>
                <div className="w-px bg-slate-200 self-stretch" />
                <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all bg-white cursor-pointer focus:outline-none ${filtroCategoria ? 'border-indigo-400 text-indigo-600' : 'border-slate-200 text-slate-500'}`}>
                  <option value="">Categoria</option>
                  {cats.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </>
            )}
            {filtrosAtivos && (
              <button onClick={limparFiltros} className="ml-auto px-3 py-1 rounded-full text-xs font-semibold text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors">
                ✕ Limpar
              </button>
            )}
          </div>
        </div>

        {filtrosAtivos && totalVisiveis >= 0 && (
          <div className="px-4 py-1.5 bg-indigo-50/60 border-b border-indigo-100/50">
            <p className="text-xs text-indigo-500 font-medium">{totalVisiveis} resultado(s){filtroCategoria && <span> — categoria <strong>{filtroCategoria}</strong></span>}</p>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : totalVisiveis === 0 && !loading ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-slate-500 text-sm font-medium">
              {filtrosAtivos ? 'Nenhum resultado para este filtro' : 'Nenhuma conta cadastrada neste mês'}
            </p>
            {filtrosAtivos && (
              <button onClick={limparFiltros} className="mt-2 text-xs text-indigo-500 hover:underline">Limpar filtros</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50/80">

            {/* ── Fixas (sempre acima) ── */}
            {mostrarContas && contasFixas.length > 0 && (
              <div>
                <SectionHeader label="Contas Fixas" count={contasFixas.length} total={contasFixas.reduce((s, c) => s + c.valor, 0)} />
                {contasFixas.map((c) => <ContaRow key={c.id} c={c} />)}
              </div>
            )}

            {/* ── Cartões (segundo) ── */}
            {mostrarCartoes && cartoesFiltrados.length > 0 && (
              <div>
                {filtroTipo === 'todos' && (
                  <SectionHeader label="Cartões" count={cartoesFiltrados.length} total={cartoesFiltrados.reduce((s, c) => s + c.valor, 0)} />
                )}
                {cartoesFiltrados.map((c) => (
                  <div key={c.cartaoId} className={`group flex items-center gap-3 px-4 py-3.5 transition-all ${c.status === 'pago' ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'}`}>
                    <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: c.cartaoCor }} />
                    <button onClick={() => handleToggleCartao(c.cartaoId, c.status)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${c.status === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'}`}>
                      {c.status === 'pago' && <Check />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-800'}`}>Fatura {c.cartaoNome}</p>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold mt-0.5 inline-block" style={{ backgroundColor: `${c.cartaoCor}18`, color: c.cartaoCor }}>{c.cartaoNome}</span>
                    </div>
                    <span className={`font-bold text-sm tabular-nums ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-800'}`}>{fmt(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empresa (soma única) ── */}
            {mostrarEmpresa && empresaSum > 0 && !(filtroStatus !== 'todos' && filtroStatus !== empresaStatus) && (
              <div>
                {filtroTipo === 'todos' && (
                  <SectionHeader label="Empresa" count={1} total={empresaSum} />
                )}
                <div className={`group flex items-center gap-3 px-4 py-3.5 transition-all ${empresaStatus === 'pago' ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'}`}>
                  <div className="w-0.5 h-10 rounded-full flex-shrink-0 bg-sky-400" />
                  <button onClick={handleToggleEmpresaAll}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${empresaStatus === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'}`}>
                    {empresaStatus === 'pago' && <Check />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${empresaStatus === 'pago' ? 'line-through text-slate-400' : 'text-slate-800'}`}>Empresa</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-sky-50 text-sky-500">{itensEmpresa.length} categoria(s)</span>
                      <span className="text-[11px] text-slate-400">custos do mês</span>
                    </div>
                  </div>
                  <span className={`font-bold text-sm tabular-nums ${empresaStatus === 'pago' ? 'text-emerald-600' : 'text-slate-800'}`}>{fmt(empresaSum)}</span>
                </div>
              </div>
            )}

            {/* ── Contas regulares (por vencimento) ── */}
            {mostrarContas && contasRegulares.length > 0 && (
              <div>
                {(filtroTipo === 'todos' || contasFixas.length > 0) && (
                  <SectionHeader label="Contas" count={contasRegulares.length} total={contasRegulares.reduce((s, c) => s + c.valor, 0)} />
                )}
                {contasRegulares.map((c) => <ContaRow key={c.id} c={c} />)}
              </div>
            )}

          </div>
        )}
      </Card>

      {/* ── Modal nova/editar conta ── */}
      {showModal && (
        <Modal title={editId ? 'Editar Conta' : 'Nova Conta'} onClose={fecharModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={INPUT} placeholder="Ex: Aluguel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={INPUT}>
                {cats.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento (dia)</label>
                <input required type="number" min={1} max={31} value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} className={INPUT} placeholder="10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parcelas <span className="text-slate-400 font-normal">(opcional)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1} value={form.parcelaAtual} onChange={(e) => setForm({ ...form, parcelaAtual: e.target.value, fixa: false })} className={INPUT} placeholder="Parcela atual" />
                <input type="number" min={1} value={form.totalParcelas} onChange={(e) => setForm({ ...form, totalParcelas: e.target.value, fixa: false })} className={INPUT} placeholder="Total" />
              </div>
            </div>
            {!isParcelada && (
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div onClick={() => setForm({ ...form, fixa: !form.fixa })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${form.fixa ? 'bg-amber-400' : 'bg-slate-200'}`}>
                  <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.fixa ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Conta Fixa</p>
                  <p className="text-xs text-slate-400">Aparece automaticamente todo mês</p>
                </div>
              </label>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={fecharModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Dialog escopo de edição ── */}
      {editScopeDialog && (
        <ScopeDialog
          title="Atualizar conta fixa"
          desc="Esta conta aparece em meses seguintes. Deseja atualizar só este mês ou todos os meses a partir deste?"
          labelFuture="Atualizar este e os seguintes"
          onFuture={() => confirmarEditScope('future')}
          onThisOnly={() => confirmarEditScope('this')}
          onCancel={() => setEditScopeDialog(null)}
        />
      )}

      {/* ── Dialog escopo de exclusão ── */}
      {deleteDialog && (
        <ScopeDialog
          title="Remover conta"
          desc={`"${deleteDialog.conta.descricao}" aparece em meses seguintes. Deseja remover só este mês ou todos os meses a partir deste?`}
          labelFuture="Remover este e os seguintes"
          onFuture={() => confirmarDelete('future')}
          onThisOnly={() => confirmarDelete('this')}
          onCancel={() => setDeleteDialog(null)}
        />
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações — Contas" onClose={() => { setShowConfig(false); setShowCatForm(false); }}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorias</p>
            {cats.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                <p className="flex-1 text-sm font-medium text-slate-700">{cat.nome}</p>
                <button onClick={() => handleDeleteCat(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
              </div>
            ))}
            {!showCatForm ? (
              <button onClick={() => setShowCatForm(true)}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2">
                <Plus /> Nova Categoria
              </button>
            ) : (
              <form onSubmit={handleSaveCat} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">Nova Categoria</p>
                <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Assinaturas, Pet..." />
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formCat.cor} onChange={(e) => setFormCat({ ...formCat, cor: e.target.value })} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
                    <span className="text-xs text-slate-500 font-mono">{formCat.cor}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium ml-2" style={{ backgroundColor: `${formCat.cor}22`, color: formCat.cor }}>{formCat.nome || 'Exemplo'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowCatForm(false); setFormCat({ nome: '', cor: '#6366f1' }); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-white">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
