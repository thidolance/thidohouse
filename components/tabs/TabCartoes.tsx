'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-zinc-800 rounded-xl h-full w-full" /> },
);
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil } from '../ui/Icons';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import {
  getCompras, addCompra, updateCompra, updateCompraAndFuture, updateCompraReparcelada, getComprasFuturasDoGrupo,
  deleteCompra, deleteCompraAndFuture, toggleCompraFixa,
  getCartoes, addCartao, updateCartao, deleteCartao,
  getCategorias, addCategoria, deleteCategoria,
} from '@/lib/firestore';
import type { CompraParcelada, Cartao, CategoriaCompra } from '@/lib/types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-auto fill-current text-white opacity-90">
      <text x="0" y="14" fontSize="16" fontWeight="bold" fontStyle="italic" fontFamily="Arial, sans-serif">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 36 24" className="h-4 w-auto">
      <circle cx="14" cy="12" r="10" fill="#EB001B" opacity="0.9" />
      <circle cx="22" cy="12" r="10" fill="#F79E1B" opacity="0.9" />
      <path d="M18 5.5 A10 10 0 0 1 18 18.5 A10 10 0 0 1 18 5.5Z" fill="#FF5F00" opacity="0.9" />
    </svg>
  );
}

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

const INPUT = 'w-full border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-50 bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-300';

interface Props { mes: number; ano: number; }

type FormCompra = {
  cartaoId: string; descricao: string; tipo: string; data: string;
  valorTotal: string; totalParcelas: string; parcelaAtual: string; fixa: boolean;
};
const COMPRA_EMPTY: FormCompra = {
  cartaoId: '', descricao: '', tipo: '', data: '',
  valorTotal: '', totalParcelas: '', parcelaAtual: '1', fixa: false,
};

type FormCartao = { nome: string; cor: string; bandeira: 'Visa' | 'Mastercard'; limite: string };
const CARTAO_EMPTY: FormCartao = { nome: '', cor: '#6366f1', bandeira: 'Visa', limite: '' };

type FormCategoria = { nome: string; cor: string };
const CAT_EMPTY: FormCategoria = { nome: '', cor: '#10b981' };

export default function TabCartoes({ mes, ano }: Props) {
  const [compras, setCompras]       = useState<CompraParcelada[]>([]);
  const [cartoes, setCartoes]       = useState<Cartao[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCompra[]>([]);
  const [loading, setLoading]       = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria]     = useState<string | null>(null);

  // modais
  const [showCompraModal, setShowCompraModal]   = useState(false);
  const [showConfigModal, setShowConfigModal]   = useState(false);
  const [configTab, setConfigTab]               = useState<'cartoes' | 'categorias'>('cartoes');

  // form compra
  const [editCompraId, setEditCompraId] = useState<string | null>(null);
  const [formCompra, setFormCompra]     = useState<FormCompra>(COMPRA_EMPTY);

  // form cartão
  const [editCartaoId, setEditCartaoId] = useState<string | null>(null);
  const [formCartao, setFormCartao]     = useState<FormCartao>(CARTAO_EMPTY);
  const [showCartaoForm, setShowCartaoForm] = useState(false);

  // form categoria
  const [formCat, setFormCat]           = useState<FormCategoria>(CAT_EMPTY);
  const [showCatForm, setShowCatForm]   = useState(false);

  // dialog exclusão de compra
  const [deleteCompraDialog, setDeleteCompraDialog] = useState<CompraParcelada | null>(null);

  // dialog escopo de edição (este mês ou também os seguintes)
  const [editCompraDialog, setEditCompraDialog] = useState<{ id: string; data: Omit<CompraParcelada, 'id'>; original: CompraParcelada } | null>(null);

  const loadConfig = useCallback(async () => {
    const [c, cat] = await Promise.all([getCartoes(), getCategorias()]);
    setCartoes(c);
    setCategorias(cat);
    if (!formCompra.cartaoId && c.length > 0) setFormCompra((f) => ({ ...f, cartaoId: c[0].id! }));
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const loadCompras = useCallback(async () => {
    setLoading(true);
    setCompras(await getCompras(mes, ano));
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { loadCompras(); }, [loadCompras]);
  useRefetchOnFocus(loadConfig);
  useRefetchOnFocus(loadCompras);

  // ── helpers de cor ─────────────────────────────────────────────────────────
  function catCor(nome: string) {
    return categorias.find((c) => c.nome === nome)?.cor ?? '#94a3b8';
  }

  // ── compras ────────────────────────────────────────────────────────────────
  async function handleSaveCompra(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const total   = parseFloat(formCompra.valorTotal.replace(',', '.'));
    const parcelas = parseInt(formCompra.totalParcelas);
    const data: Omit<CompraParcelada, 'id'> = {
      cartaoId:      formCompra.cartaoId,
      descricao:     formCompra.descricao,
      tipo:          formCompra.tipo,
      data:          formCompra.data,
      valorTotal:    total,
      valorParcela:  total / parcelas,
      totalParcelas: parcelas,
      parcelaAtual:  parseInt(formCompra.parcelaAtual),
      mes, ano,
      fixa: formCompra.fixa && parcelas <= 1,
    };
    if (editCompraId) {
      const original = compras.find((c) => c.id === editCompraId);
      const isSerie = (original?.totalParcelas ?? 1) > 1 || data.totalParcelas > 1;
      const futuras = original ? await getComprasFuturasDoGrupo(original) : [];

      if (original && isSerie && !data.fixa) {
        const countChanged   = original.totalParcelas !== data.totalParcelas;
        const futurosEsperados = Math.max(0, data.totalParcelas - data.parcelaAtual);
        // Reparcela se o total mudou ou se a série está inconsistente (nº de docs futuros
        // diferente do esperado) — isso também conserta registros já corrompidos.
        if (countChanged || futuras.length !== futurosEsperados) {
          await updateCompraReparcelada(editCompraId, data, original);
          setShowCompraModal(false);
          setEditCompraId(null);
          setFormCompra({ ...COMPRA_EMPTY, cartaoId: cartoes[0]?.id ?? '', tipo: categorias[0]?.nome ?? '' });
          loadCompras();
          return;
        }
      }

      if (futuras.length > 0) {
        setShowCompraModal(false);
        setEditCompraDialog({ id: editCompraId, data, original: original! });
        return;
      }
      await updateCompra(editCompraId, data, original);
    } else {
      await addCompra(data);
    }
    setShowCompraModal(false);
    setEditCompraId(null);
    setFormCompra({ ...COMPRA_EMPTY, cartaoId: cartoes[0]?.id ?? '', tipo: categorias[0]?.nome ?? '' });
    loadCompras();
  }

  async function confirmarEditCompra(scope: 'this' | 'future') {
    const { id, data, original } = editCompraDialog!;
    setEditCompraDialog(null);
    if (scope === 'future') await updateCompraAndFuture(id, data, original);
    else                    await updateCompra(id, data, original);
    setEditCompraId(null);
    setFormCompra({ ...COMPRA_EMPTY, cartaoId: cartoes[0]?.id ?? '', tipo: categorias[0]?.nome ?? '' });
    loadCompras();
  }

  function abrirNovaCompra(cartaoId?: string) {
    setEditCompraId(null);
    setFormCompra({
      ...COMPRA_EMPTY,
      cartaoId: cartaoId ?? cartoes[0]?.id ?? '',
      tipo: categorias[0]?.nome ?? '',
      data: new Date().toISOString().slice(0, 10),
    });
    setShowCompraModal(true);
  }

  function abrirEditCompra(p: CompraParcelada) {
    setEditCompraId(p.id!);
    setFormCompra({
      cartaoId:      p.cartaoId,
      descricao:     p.descricao,
      tipo:          p.tipo,
      data:          p.data ?? '',
      valorTotal:    p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      totalParcelas: String(p.totalParcelas),
      parcelaAtual:  String(p.parcelaAtual),
      fixa:          p.fixa ?? false,
    });
    setShowCompraModal(true);
  }

  function iniciarDeleteCompra(p: CompraParcelada) {
    if (p.grupoId) {
      setDeleteCompraDialog(p);
    } else {
      deleteCompra(p.id!).then(loadCompras);
    }
  }

  async function confirmarDeleteCompra(scope: 'this' | 'future') {
    const p = deleteCompraDialog!;
    setDeleteCompraDialog(null);
    if (scope === 'future') {
      await deleteCompraAndFuture(p.id!, p);
    } else {
      await deleteCompra(p.id!);
    }
    loadCompras();
  }

  async function handleToggleFixa(p: CompraParcelada) {
    await toggleCompraFixa(p.id!, p, !p.fixa);
    loadCompras();
  }

  // ── cartões (config) ───────────────────────────────────────────────────────
  function abrirNovoCartao() {
    setEditCartaoId(null);
    setFormCartao(CARTAO_EMPTY);
    setShowCartaoForm(true);
  }

  function abrirEditCartao(c: Cartao) {
    setEditCartaoId(c.id!);
    setFormCartao({ nome: c.nome, cor: c.cor, bandeira: c.bandeira ?? 'Visa', limite: c.limite ? String(c.limite) : '' });
    setShowCartaoForm(true);
  }

  async function handleSaveCartao(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data: Omit<Cartao, 'id'> = {
      nome: formCartao.nome,
      cor: formCartao.cor,
      bandeira: formCartao.bandeira,
      limite: parseFloat(formCartao.limite.replace(',', '.')) || 0,
    };
    if (editCartaoId) await updateCartao(editCartaoId, data);
    else              await addCartao(data);
    setShowCartaoForm(false);
    setEditCartaoId(null);
    setFormCartao(CARTAO_EMPTY);
    loadConfig();
  }

  async function handleDeleteCartao(id: string) {
    await deleteCartao(id);
    loadConfig();
  }

  // ── categorias (config) ────────────────────────────────────────────────────
  async function handleSaveCategoria(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await addCategoria(formCat);
    setShowCatForm(false);
    setFormCat(CAT_EMPTY);
    loadConfig();
  }

  async function handleDeleteCategoria(id: string) {
    await deleteCategoria(id);
    loadConfig();
  }

  // ── dados derivados ────────────────────────────────────────────────────────
  const totalGeral = compras.reduce((s, c) => s + c.valorParcela, 0);

  const totalPorCartao = cartoes.map((c) => {
    const comprasCartao = compras.filter((p) => p.cartaoId === c.id);
    return {
      ...c,
      fill: c.cor,
      total: comprasCartao.reduce((s, p) => s + p.valorParcela, 0),
      count: comprasCartao.length,
      // Limite usado: parcelas em aberto contam pelo valor restante (todas as parcelas futuras), não só a do mês
      usado: comprasCartao.reduce((s, p) => s + p.valorParcela * Math.max(1, p.totalParcelas - p.parcelaAtual + 1), 0),
    };
  });

  const totalPorCategoria = categorias.map((cat) => ({
    ...cat,
    fill: cat.cor,
    total: compras.filter((p) => p.tipo === cat.nome).reduce((s, p) => s + p.valorParcela, 0),
  })).filter((c) => c.total > 0);

  // Ordena pela data da compra (mais recente primeiro); fixas sempre vão para o final
  const porDataComFixaPorUltimo = (a: CompraParcelada, b: CompraParcelada) => {
    if (!!a.fixa !== !!b.fixa) return a.fixa ? 1 : -1;
    return (b.data ?? '').localeCompare(a.data ?? '');
  };

  const comprasDoCartao = cartaoSelecionado
    ? compras.filter((c) => c.cartaoId === cartaoSelecionado).sort(porDataComFixaPorUltimo)
    : [];

  const comprasOrdenadas = [...compras]
    .filter((c) => !filtroCategoria || c.tipo === filtroCategoria)
    .sort(porDataComFixaPorUltimo);

  // Categorias que realmente têm compras no mês, para montar os chips do filtro
  const categoriasComCompras = categorias.filter((cat) => compras.some((c) => c.tipo === cat.nome));

  const cartaoAtivo = cartoes.find((c) => c.id === cartaoSelecionado);

  const isParcelada = parseInt(formCompra.totalParcelas || '0') > 1;

  // ── specs VChart ──────────────────────────────────────────────────────────

  const cartaoBarSpec = useMemo(() => ({
    type: 'bar',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'bar', values: totalPorCartao.filter((c) => c.total > 0) }],
    xField: 'nome',
    yField: 'total',
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
        grid: { style: { stroke: '#27272a', lineDash: [3, 3] } },
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
        content: [{ key: (d: Record<string, unknown>) => String(d['nome']), value: (d: Record<string, unknown>) => fmt(Number(d['total'])) }],
      },
    },
  }), [totalPorCartao]);

  const catDonutSpec = useMemo(() => ({
    type: 'pie',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'cat', values: totalPorCategoria }],
    valueField: 'total',
    categoryField: 'nome',
    outerRadius: 0.75,
    innerRadius: 0.52,
    padAngle: 0.8,
    color: totalPorCategoria.map((d) => d.fill),
    pie: { style: { cornerRadius: 4 } },
    label: { visible: false },
    legends: [{
      visible: true,
      orient: 'bottom',
      padding: { top: 8 },
      maxRow: 3,
      item: {
        label: { style: { fontSize: 11, fill: '#64748b' } },
        value: { visible: false },
      },
    }],
    tooltip: {
      mark: {
        title: { visible: false },
        content: [{ key: (d: Record<string, unknown>) => String(d['nome']), value: (d: Record<string, unknown>) => fmt(Number(d['total'])) }],
      },
    },
  }), [totalPorCategoria]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Cartões</h2>
          <p className="text-xs text-zinc-500">{compras.length} compra(s) · {fmt(totalGeral)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowConfigModal(true); setConfigTab('cartoes'); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-800 text-zinc-400 rounded-xl text-sm font-medium hover:bg-zinc-950 hover:text-zinc-200 transition-colors"
          >
            <GearIcon /><span className="hidden sm:inline">Configurações</span>
          </button>
          <button
            onClick={() => abrirNovaCompra()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus /><span className="hidden sm:inline">Nova Compra</span>
          </button>
        </div>
      </div>

      {/* ── Card total ── */}
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl px-4 py-3 text-white shadow-lg shadow-purple-500/20">
        <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Total do Mês</p>
        <p className="text-2xl font-bold mt-0.5 tabular-nums">{fmt(totalGeral)}</p>
        <p className="text-purple-100 text-[11px] mt-1">{compras.length} compra(s) em {cartoes.length} cartão(s)</p>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="font-semibold text-zinc-200 text-sm mb-3">Gasto por Cartão</p>
          {totalGeral > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`cartao-bar-${totalGeral.toFixed(0)}`} spec={cartaoBarSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <span className="text-3xl">💳</span>
              <p className="text-sm">Sem compras neste mês</p>
            </div>
          )}
        </Card>
        <Card>
          <p className="font-semibold text-zinc-200 text-sm mb-3">Por Categoria</p>
          {totalPorCategoria.length > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`cat-donut-${totalGeral.toFixed(0)}`} spec={catDonutSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-zinc-500 gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm">Sem dados de categoria</p>
            </div>
          )}
        </Card>
      </div>

      {/* Cards visuais dos cartões (seletor) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cartoes.map((c) => {
          const dado     = totalPorCartao.find((t) => t.id === c.id)!;
          const isSelected = cartaoSelecionado === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCartaoSelecionado(isSelected ? null : c.id!)}
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all text-white shadow-lg hover:scale-105 flex flex-col justify-between ${isSelected ? 'ring-4 ring-white/40 scale-105' : ''}`}
              style={{ backgroundColor: c.cor, minHeight: 120 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/25 pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <span className="text-sm font-bold tracking-wide">{c.nome}</span>
                {c.bandeira === 'Visa' && <VisaLogo />}
                {c.bandeira === 'Mastercard' && <MastercardLogo />}
              </div>
              <div className="relative flex items-end justify-between mt-4">
                <div>
                  <p className="text-white/60 text-xs">Mês atual</p>
                  <p className="text-base font-bold">{fmt(dado?.total ?? 0)}</p>
                </div>
                <p className="text-white/60 text-xs">{dado?.count ?? 0} compra(s)</p>
              </div>
              {!!c.limite && c.limite > 0 && (() => {
                const pctUso = Math.min(100, ((dado?.usado ?? 0) / c.limite!) * 100);
                return (
                  <div className="relative mt-3">
                    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-700" style={{ width: `${pctUso}%` }}>
                        {/* Gradiente verde→vermelho revelado conforme o limite é consumido */}
                        <div
                          className="h-full"
                          style={{
                            width: `${pctUso > 0 ? 10000 / pctUso : 100}%`,
                            background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)',
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-white/60 text-[11px] mt-1">{fmt(dado?.usado ?? 0)} de {fmt(c.limite)}</p>
                  </div>
                );
              })()}
            </button>
          );
        })}
      </div>

      {/* Detalhe do cartão selecionado */}
      {cartaoSelecionado && cartaoAtivo && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cartaoAtivo.cor }} />
              <h3 className="font-semibold text-zinc-200">{cartaoAtivo.nome}</h3>
            </div>
            <button
              onClick={() => abrirNovaCompra(cartaoAtivo.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus /> Adicionar
            </button>
          </div>
          {loading ? (
            <p className="text-zinc-500 text-sm text-center py-6">Carregando...</p>
          ) : comprasDoCartao.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6">Nenhuma compra neste mês</p>
          ) : (
            <div className="space-y-2">
              {comprasDoCartao.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-950 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catCor(p.tipo)}22`, color: catCor(p.tipo) }}>
                      {p.tipo}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-200 text-sm">{p.descricao}</p>
                      {p.data && <p className="text-[11px] text-zinc-500 leading-tight">{new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">{p.parcelaAtual}/{p.totalParcelas}</span>
                        <span className="text-zinc-600 text-[11px]">·</span>
                        <span className="text-[11px] text-zinc-500">total {fmt(p.valorTotal)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: cartaoAtivo.cor }}>{fmt(p.valorParcela)}</span>
                    <button onClick={() => handleToggleFixa(p)} title={p.fixa ? 'Remover recorrência' : 'Marcar como fixa'}
                      className={`p-1.5 rounded-lg transition-colors ${p.fixa ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10'}`}>
                      <PinIcon filled={p.fixa} />
                    </button>
                    <button onClick={() => abrirEditCompra(p)} className="p-1.5 rounded-lg hover:bg-purple-500/10 text-zinc-600 hover:text-purple-400 transition-colors"><Pencil /></button>
                    <button onClick={() => iniciarDeleteCompra(p)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"><Trash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Todas as compras */}
      {!cartaoSelecionado && (
        <Card>
          <h3 className="font-semibold text-zinc-200 mb-3">Todas as Compras do Mês</h3>

          {/* Filtro por categoria */}
          {categoriasComCompras.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFiltroCategoria(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${!filtroCategoria ? 'bg-purple-600 text-white border-purple-600' : 'border-zinc-800 text-zinc-400 hover:border-purple-300 hover:text-purple-400'}`}
              >
                Todas
              </button>
              {categoriasComCompras.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFiltroCategoria(filtroCategoria === cat.nome ? null : cat.nome)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={filtroCategoria === cat.nome
                    ? { backgroundColor: cat.cor, color: '#fff', borderColor: cat.cor }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
          ) : compras.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Clique em um cartão para filtrar ou adicione uma compra</p>
          ) : comprasOrdenadas.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Nenhuma compra nesta categoria</p>
          ) : (
            <div className="space-y-2">
              {comprasOrdenadas.map((p) => {
                const c = cartoes.find((c) => c.id === p.cartaoId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-950 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.cor ?? '#94a3b8' }} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catCor(p.tipo)}22`, color: catCor(p.tipo) }}>
                        {p.tipo}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-200 text-sm">{p.descricao}</p>
                        {p.data && <p className="text-[11px] text-zinc-500 leading-tight">{new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-semibold" style={{ color: c?.cor ?? '#94a3b8' }}>{c?.nome}</span>
                          <span className="text-zinc-600 text-[11px]">·</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">{p.parcelaAtual}/{p.totalParcelas}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-200">{fmt(p.valorParcela)}</span>
                      <button onClick={() => handleToggleFixa(p)} title={p.fixa ? 'Remover recorrência' : 'Marcar como fixa'}
                        className={`p-1.5 rounded-lg transition-colors ${p.fixa ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10'}`}>
                        <PinIcon filled={p.fixa} />
                      </button>
                      <button onClick={() => abrirEditCompra(p)} className="p-1.5 rounded-lg hover:bg-purple-500/10 text-zinc-600 hover:text-purple-400 transition-colors"><Pencil /></button>
                      <button onClick={() => iniciarDeleteCompra(p)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"><Trash /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Modal nova/editar compra ── */}
      {showCompraModal && (
        <Modal
          title={editCompraId ? 'Editar Compra' : 'Nova Compra Parcelada'}
          onClose={() => { setShowCompraModal(false); setEditCompraId(null); setFormCompra(COMPRA_EMPTY); }}
        >
          <form onSubmit={handleSaveCompra} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Cartão</label>
              <div className="grid grid-cols-2 gap-2">
                {cartoes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormCompra({ ...formCompra, cartaoId: c.id! })}
                    className="flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm font-medium"
                    style={formCompra.cartaoId === c.id
                      ? { backgroundColor: c.cor, borderColor: c.cor, color: '#fff' }
                      : { borderColor: '#e2e8f0', color: '#475569' }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Descrição</label>
              <input required value={formCompra.descricao} onChange={(e) => setFormCompra({ ...formCompra, descricao: e.target.value })} className={INPUT} placeholder="Ex: Notebook" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormCompra({ ...formCompra, tipo: cat.nome })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                    style={formCompra.tipo === cat.nome
                      ? { backgroundColor: cat.cor, color: '#fff', borderColor: cat.cor }
                      : { borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Valor Total (R$)</label>
              <input required value={formCompra.valorTotal} onChange={(e) => setFormCompra({ ...formCompra, valorTotal: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Data da Compra</label>
              <input required type="date" value={formCompra.data} onChange={(e) => setFormCompra({ ...formCompra, data: e.target.value })} className={INPUT} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">Parcela Atual</label>
                <input required type="number" min={1} value={formCompra.parcelaAtual} onChange={(e) => setFormCompra({ ...formCompra, parcelaAtual: e.target.value, fixa: false })} className={INPUT} placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">Total de Parcelas</label>
                <input required type="number" min={1} value={formCompra.totalParcelas} onChange={(e) => setFormCompra({ ...formCompra, totalParcelas: e.target.value, fixa: false })} className={INPUT} placeholder="12" />
              </div>
            </div>

            {formCompra.valorTotal && formCompra.totalParcelas && parseInt(formCompra.totalParcelas) > 0 && (
              <p className="text-xs text-zinc-400 bg-zinc-950 rounded-lg p-2">
                Valor por parcela: <strong>{fmt(parseFloat(formCompra.valorTotal.replace(',', '.')) / parseInt(formCompra.totalParcelas) || 0)}</strong>
              </p>
            )}

            {!editCompraId && !isParcelada && (
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-zinc-800 hover:bg-zinc-950 transition-colors">
                <div onClick={() => setFormCompra({ ...formCompra, fixa: !formCompra.fixa })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${formCompra.fixa ? 'bg-amber-400' : 'bg-zinc-800'}`}>
                  <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${formCompra.fixa ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Compra Fixa</p>
                  <p className="text-xs text-zinc-500">Repete automaticamente todo mês</p>
                </div>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCompraModal(false); setEditCompraId(null); }} className="flex-1 py-2.5 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:bg-zinc-950">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações" onClose={() => { setShowConfigModal(false); setShowCartaoForm(false); setShowCatForm(false); }}>
          {/* Abas */}
          <div className="flex gap-1 bg-zinc-800 p-1 rounded-xl mb-5">
            {(['cartoes', 'categorias'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setConfigTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${configTab === tab ? 'bg-purple-600 shadow text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {tab === 'cartoes' ? 'Cartões' : 'Categorias'}
              </button>
            ))}
          </div>

          {/* ── Aba cartões ── */}
          {configTab === 'cartoes' && (
            <div className="space-y-3">
              {cartoes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-950">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow" style={{ backgroundColor: c.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{c.nome}</p>
                    <p className="text-xs text-zinc-500">{c.bandeira ?? '—'}</p>
                  </div>
                  <button onClick={() => abrirEditCartao(c)} className="p-1.5 rounded-lg hover:bg-purple-500/10 text-zinc-600 hover:text-purple-400 transition-colors"><Pencil /></button>
                  <button onClick={() => handleDeleteCartao(c.id!)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"><Trash /></button>
                </div>
              ))}

              {!showCartaoForm ? (
                <button onClick={abrirNovoCartao} className="w-full py-2.5 border-2 border-dashed border-zinc-800 rounded-xl text-sm text-zinc-500 hover:border-purple-300 hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
                  <Plus /> Novo Cartão
                </button>
              ) : (
                <form onSubmit={handleSaveCartao} className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950">
                  <p className="text-sm font-semibold text-zinc-200">{editCartaoId ? 'Editar Cartão' : 'Novo Cartão'}</p>
                  <input required value={formCartao.nome} onChange={(e) => setFormCartao({ ...formCartao, nome: e.target.value })} className={INPUT} placeholder="Nome do cartão" />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-400 mb-1">Cor</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formCartao.cor}
                          onChange={(e) => setFormCartao({ ...formCartao, cor: e.target.value })}
                          className="w-10 h-9 rounded-lg border border-zinc-800 cursor-pointer p-0.5 bg-zinc-900"
                        />
                        <span className="text-xs text-zinc-400 font-mono">{formCartao.cor}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-400 mb-1">Bandeira</label>
                      <div className="flex gap-2">
                        {(['Visa', 'Mastercard'] as const).map((b) => (
                          <button
                            key={b} type="button"
                            onClick={() => setFormCartao({ ...formCartao, bandeira: b })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${formCartao.bandeira === b ? 'bg-purple-600 text-white border-purple-600' : 'border-zinc-800 text-zinc-400'}`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Limite (R$)</label>
                    <input value={formCartao.limite} onChange={(e) => setFormCartao({ ...formCartao, limite: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
                  </div>
                  {/* Preview */}
                  <div className="relative overflow-hidden rounded-xl h-14 flex items-center px-4" style={{ backgroundColor: formCartao.cor }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20" />
                    <span className="relative text-white font-bold text-sm">{formCartao.nome || 'Pré-visualização'}</span>
                    <div className="relative ml-auto">
                      {formCartao.bandeira === 'Visa' ? <VisaLogo /> : <MastercardLogo />}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowCartaoForm(false); setEditCartaoId(null); setFormCartao(CARTAO_EMPTY); }} className="flex-1 py-2 border border-zinc-800 rounded-xl text-xs text-zinc-300 hover:bg-zinc-800">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700">Salvar</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Aba categorias ── */}
          {configTab === 'categorias' && (
            <div className="space-y-3">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-950">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                  <p className="flex-1 text-sm font-medium text-zinc-200">{cat.nome}</p>
                  <button onClick={() => handleDeleteCategoria(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"><Trash /></button>
                </div>
              ))}

              {!showCatForm ? (
                <button onClick={() => setShowCatForm(true)} className="w-full py-2.5 border-2 border-dashed border-zinc-800 rounded-xl text-sm text-zinc-500 hover:border-purple-300 hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
                  <Plus /> Nova Categoria
                </button>
              ) : (
                <form onSubmit={handleSaveCategoria} className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950">
                  <p className="text-sm font-semibold text-zinc-200">Nova Categoria</p>
                  <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Carro, Roupas..." />
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={formCat.cor} onChange={(e) => setFormCat({ ...formCat, cor: e.target.value })} className="w-10 h-9 rounded-lg border border-zinc-800 cursor-pointer p-0.5 bg-zinc-900" />
                      <span className="text-xs text-zinc-400 font-mono">{formCat.cor}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium ml-2" style={{ backgroundColor: `${formCat.cor}22`, color: formCat.cor }}>
                        {formCat.nome || 'Exemplo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowCatForm(false); setFormCat(CAT_EMPTY); }} className="flex-1 py-2 border border-zinc-800 rounded-xl text-xs text-zinc-300 hover:bg-zinc-800">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700">Salvar</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Dialog exclusão de parcelas futuras ── */}
      {deleteCompraDialog && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-zinc-100">Remover compra</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong>"{deleteCompraDialog.descricao}"</strong> aparece em meses seguintes. Deseja remover só este mês ou todos os meses a partir deste?
            </p>
            <div className="space-y-2 pt-1">
              <button onClick={() => confirmarDeleteCompra('future')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
                Remover este e os seguintes
              </button>
              <button onClick={() => confirmarDeleteCompra('this')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-zinc-700 text-white hover:bg-zinc-800 transition-colors">
                Só este mês
              </button>
              <button onClick={() => setDeleteCompraDialog(null)}
                className="w-full py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:bg-zinc-950 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog escopo de edição: este mês ou também os seguintes ── */}
      {editCompraDialog && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-zinc-100">Aplicar alteração</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong>&ldquo;{editCompraDialog.original.descricao}&rdquo;</strong> também aparece em meses seguintes. Deseja aplicar essa alteração só a este mês ou também aos próximos?
            </p>
            <div className="space-y-2 pt-1">
              <button onClick={() => confirmarEditCompra('future')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                Este e os seguintes
              </button>
              <button onClick={() => confirmarEditCompra('this')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-zinc-700 text-white hover:bg-zinc-800 transition-colors">
                Só este mês
              </button>
              <button onClick={() => { setEditCompraDialog(null); setEditCompraId(null); setFormCompra(COMPRA_EMPTY); }}
                className="w-full py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:bg-zinc-950 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
