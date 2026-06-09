'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 rounded-xl h-full w-full" /> },
);
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil } from '../ui/Icons';
import {
  getCompras, addCompra, updateCompra, deleteCompra, deleteCompraAndFuture,
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

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300';

interface Props { mes: number; ano: number; }

type FormCompra = {
  cartaoId: string; descricao: string; tipo: string;
  valorTotal: string; totalParcelas: string; parcelaAtual: string;
};
const COMPRA_EMPTY: FormCompra = {
  cartaoId: '', descricao: '', tipo: '',
  valorTotal: '', totalParcelas: '', parcelaAtual: '1',
};

type FormCartao = { nome: string; cor: string; bandeira: 'Visa' | 'Mastercard' };
const CARTAO_EMPTY: FormCartao = { nome: '', cor: '#6366f1', bandeira: 'Visa' };

type FormCategoria = { nome: string; cor: string };
const CAT_EMPTY: FormCategoria = { nome: '', cor: '#10b981' };

export default function TabCartoes({ mes, ano }: Props) {
  const [compras, setCompras]       = useState<CompraParcelada[]>([]);
  const [cartoes, setCartoes]       = useState<Cartao[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCompra[]>([]);
  const [loading, setLoading]       = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string | null>(null);

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
      valorTotal:    total,
      valorParcela:  total / parcelas,
      totalParcelas: parcelas,
      parcelaAtual:  parseInt(formCompra.parcelaAtual),
      mes, ano,
    };
    if (editCompraId) await updateCompra(editCompraId, data);
    else              await addCompra(data);
    setShowCompraModal(false);
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
    });
    setShowCompraModal(true);
  }

  function abrirEditCompra(p: CompraParcelada) {
    setEditCompraId(p.id!);
    setFormCompra({
      cartaoId:      p.cartaoId,
      descricao:     p.descricao,
      tipo:          p.tipo,
      valorTotal:    p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      totalParcelas: String(p.totalParcelas),
      parcelaAtual:  String(p.parcelaAtual),
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

  // ── cartões (config) ───────────────────────────────────────────────────────
  function abrirNovoCartao() {
    setEditCartaoId(null);
    setFormCartao(CARTAO_EMPTY);
    setShowCartaoForm(true);
  }

  function abrirEditCartao(c: Cartao) {
    setEditCartaoId(c.id!);
    setFormCartao({ nome: c.nome, cor: c.cor, bandeira: c.bandeira ?? 'Visa' });
    setShowCartaoForm(true);
  }

  async function handleSaveCartao(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editCartaoId) await updateCartao(editCartaoId, formCartao);
    else              await addCartao(formCartao);
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

  const totalPorCartao = cartoes.map((c) => ({
    ...c,
    fill: c.cor,
    total: compras.filter((p) => p.cartaoId === c.id).reduce((s, p) => s + p.valorParcela, 0),
    count: compras.filter((p) => p.cartaoId === c.id).length,
  }));

  const totalPorCategoria = categorias.map((cat) => ({
    ...cat,
    fill: cat.cor,
    total: compras.filter((p) => p.tipo === cat.nome).reduce((s, p) => s + p.valorParcela, 0),
  })).filter((c) => c.total > 0);

  const comprasDoCartao = cartaoSelecionado
    ? compras.filter((c) => c.cartaoId === cartaoSelecionado)
    : [];

  const cartaoAtivo = cartoes.find((c) => c.id === cartaoSelecionado);

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
          <h2 className="text-lg font-bold text-slate-800">Cartões</h2>
          <p className="text-xs text-slate-400">{compras.length} compra(s) · {fmt(totalGeral)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowConfigModal(true); setConfigTab('cartoes'); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <GearIcon /><span className="hidden sm:inline">Configurações</span>
          </button>
          <button
            onClick={() => abrirNovaCompra()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus /><span className="hidden sm:inline">Nova Compra</span>
          </button>
        </div>
      </div>

      {/* ── Card total ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-md shadow-indigo-200">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide relative">Total do Mês</p>
        <p className="text-3xl font-bold mt-1 tabular-nums relative">{fmt(totalGeral)}</p>
        <p className="text-indigo-200 text-[11px] mt-1 relative">{compras.length} compra(s) em {cartoes.length} cartão(s)</p>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="font-semibold text-slate-700 text-sm mb-3">Gasto por Cartão</p>
          {totalGeral > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`cartao-bar-${totalGeral.toFixed(0)}`} spec={cartaoBarSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-3xl">💳</span>
              <p className="text-sm">Sem compras neste mês</p>
            </div>
          )}
        </Card>
        <Card>
          <p className="font-semibold text-slate-700 text-sm mb-3">Por Categoria</p>
          {totalPorCategoria.length > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`cat-donut-${totalGeral.toFixed(0)}`} spec={catDonutSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-2">
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
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all text-white shadow-lg hover:scale-105 ${isSelected ? 'ring-4 ring-white/40 scale-105' : ''}`}
              style={{ backgroundColor: c.cor, aspectRatio: '1.6 / 1', minHeight: 120 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/25 pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <span className="text-sm font-bold tracking-wide">{c.nome}</span>
                {c.bandeira === 'Visa' && <VisaLogo />}
                {c.bandeira === 'Mastercard' && <MastercardLogo />}
              </div>
              <div className="relative absolute bottom-4 left-5 right-5 flex items-end justify-between mt-4">
                <div>
                  <p className="text-white/60 text-xs">Mês atual</p>
                  <p className="text-base font-bold">{fmt(dado?.total ?? 0)}</p>
                </div>
                <p className="text-white/60 text-xs">{dado?.count ?? 0} compra(s)</p>
              </div>
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
              <h3 className="font-semibold text-slate-700">{cartaoAtivo.nome}</h3>
            </div>
            <button
              onClick={() => abrirNovaCompra(cartaoAtivo.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus /> Adicionar
            </button>
          </div>
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-6">Carregando...</p>
          ) : comprasDoCartao.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Nenhuma compra neste mês</p>
          ) : (
            <div className="space-y-2">
              {comprasDoCartao.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catCor(p.tipo)}22`, color: catCor(p.tipo) }}>
                      {p.tipo}
                    </span>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{p.descricao}</p>
                      <p className="text-xs text-slate-400">{p.parcelaAtual}/{p.totalParcelas}x · total {fmt(p.valorTotal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: cartaoAtivo.cor }}>{fmt(p.valorParcela)}</span>
                    <button onClick={() => abrirEditCompra(p)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-400 transition-colors"><Pencil /></button>
                    <button onClick={() => iniciarDeleteCompra(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
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
          <h3 className="font-semibold text-slate-700 mb-4">Todas as Compras do Mês</h3>
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
          ) : compras.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Clique em um cartão para filtrar ou adicione uma compra</p>
          ) : (
            <div className="space-y-2">
              {compras.map((p) => {
                const c = cartoes.find((c) => c.id === p.cartaoId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.cor ?? '#94a3b8' }} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catCor(p.tipo)}22`, color: catCor(p.tipo) }}>
                        {p.tipo}
                      </span>
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{p.descricao}</p>
                        <p className="text-xs text-slate-400">{c?.nome} · {p.parcelaAtual}/{p.totalParcelas}x</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-700">{fmt(p.valorParcela)}</span>
                      <button onClick={() => abrirEditCompra(p)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-400 transition-colors"><Pencil /></button>
                      <button onClick={() => iniciarDeleteCompra(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Cartão</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input required value={formCompra.descricao} onChange={(e) => setFormCompra({ ...formCompra, descricao: e.target.value })} className={INPUT} placeholder="Ex: Notebook" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
              <input required value={formCompra.valorTotal} onChange={(e) => setFormCompra({ ...formCompra, valorTotal: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parcela Atual</label>
                <input required type="number" min={1} value={formCompra.parcelaAtual} onChange={(e) => setFormCompra({ ...formCompra, parcelaAtual: e.target.value })} className={INPUT} placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total de Parcelas</label>
                <input required type="number" min={1} value={formCompra.totalParcelas} onChange={(e) => setFormCompra({ ...formCompra, totalParcelas: e.target.value })} className={INPUT} placeholder="12" />
              </div>
            </div>

            {formCompra.valorTotal && formCompra.totalParcelas && parseInt(formCompra.totalParcelas) > 0 && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                Valor por parcela: <strong>{fmt(parseFloat(formCompra.valorTotal.replace(',', '.')) / parseInt(formCompra.totalParcelas) || 0)}</strong>
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCompraModal(false); setEditCompraId(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações" onClose={() => { setShowConfigModal(false); setShowCartaoForm(false); setShowCatForm(false); }}>
          {/* Abas */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
            {(['cartoes', 'categorias'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setConfigTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${configTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'cartoes' ? 'Cartões' : 'Categorias'}
              </button>
            ))}
          </div>

          {/* ── Aba cartões ── */}
          {configTab === 'cartoes' && (
            <div className="space-y-3">
              {cartoes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow" style={{ backgroundColor: c.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{c.nome}</p>
                    <p className="text-xs text-slate-400">{c.bandeira ?? '—'}</p>
                  </div>
                  <button onClick={() => abrirEditCartao(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-400 transition-colors"><Pencil /></button>
                  <button onClick={() => handleDeleteCartao(c.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
                </div>
              ))}

              {!showCartaoForm ? (
                <button onClick={abrirNovoCartao} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                  <Plus /> Novo Cartão
                </button>
              ) : (
                <form onSubmit={handleSaveCartao} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">{editCartaoId ? 'Editar Cartão' : 'Novo Cartão'}</p>
                  <input required value={formCartao.nome} onChange={(e) => setFormCartao({ ...formCartao, nome: e.target.value })} className={INPUT} placeholder="Nome do cartão" />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">Cor</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formCartao.cor}
                          onChange={(e) => setFormCartao({ ...formCartao, cor: e.target.value })}
                          className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                        <span className="text-xs text-slate-500 font-mono">{formCartao.cor}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">Bandeira</label>
                      <div className="flex gap-2">
                        {(['Visa', 'Mastercard'] as const).map((b) => (
                          <button
                            key={b} type="button"
                            onClick={() => setFormCartao({ ...formCartao, bandeira: b })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${formCartao.bandeira === b ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-500'}`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
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
                    <button type="button" onClick={() => { setShowCartaoForm(false); setEditCartaoId(null); setFormCartao(CARTAO_EMPTY); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-white">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700">Salvar</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Aba categorias ── */}
          {configTab === 'categorias' && (
            <div className="space-y-3">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                  <p className="flex-1 text-sm font-medium text-slate-700">{cat.nome}</p>
                  <button onClick={() => handleDeleteCategoria(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
                </div>
              ))}

              {!showCatForm ? (
                <button onClick={() => setShowCatForm(true)} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                  <Plus /> Nova Categoria
                </button>
              ) : (
                <form onSubmit={handleSaveCategoria} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">Nova Categoria</p>
                  <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Carro, Roupas..." />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={formCat.cor} onChange={(e) => setFormCat({ ...formCat, cor: e.target.value })} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
                      <span className="text-xs text-slate-500 font-mono">{formCat.cor}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium ml-2" style={{ backgroundColor: `${formCat.cor}22`, color: formCat.cor }}>
                        {formCat.nome || 'Exemplo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowCatForm(false); setFormCat(CAT_EMPTY); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-white">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700">Salvar</button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800">Remover compra parcelada</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              <strong>"{deleteCompraDialog.descricao}"</strong> tem parcelas em meses seguintes. Deseja remover só esta parcela ou todas as parcelas restantes?
            </p>
            <div className="space-y-2 pt-1">
              <button onClick={() => confirmarDeleteCompra('future')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
                Remover esta e as seguintes
              </button>
              <button onClick={() => confirmarDeleteCompra('this')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors">
                Só esta parcela
              </button>
              <button onClick={() => setDeleteCompraDialog(null)}
                className="w-full py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
