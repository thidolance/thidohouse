'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil } from '../ui/Icons';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import { formatCurrencyInput, parseCurrencyInput, formatCurrencyBRL } from '@/lib/currency';
import {
  getCustosEmpresa, addCustoEmpresa, updateCustoEmpresa, updateCustoReparcelado, updateCustoEmpresaFixa,
  updateCustoEmpresaAndFuture, getCustosFuturosDoGrupo,
  toggleCustoEmpresaFixa, deleteCustoEmpresa, deleteCustoEmpresaAndFuture,
  getCategoriasEmpresa, addCategoriaEmpresa, deleteCategoriaEmpresa,
} from '@/lib/firestore';
import type { CustoEmpresa, CategoriaEmpresa } from '@/lib/types';

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

const INPUT = 'w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-300';
const fmt   = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props { mes: number; ano: number; }

type FormCusto = {
  categoriaId: string; descricao: string;
  valor: string; totalParcelas: string; parcelaAtual: string; fixa: boolean;
};
const CUSTO_EMPTY: FormCusto = { categoriaId: '', descricao: '', valor: '', totalParcelas: '1', parcelaAtual: '1', fixa: false };

type FormCat = { nome: string; cor: string };
const CAT_EMPTY: FormCat = { nome: '', cor: '#06b6d4' };

export default function TabEmpresa({ mes, ano }: Props) {
  const [custos, setCustos]         = useState<CustoEmpresa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEmpresa[]>([]);
  const [loading, setLoading]       = useState(false);
  const [catFiltro, setCatFiltro]   = useState<string | null>(null);

  const [showCustoModal, setShowCustoModal]   = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [editCustoId, setEditCustoId] = useState<string | null>(null);
  const [formCusto, setFormCusto]     = useState<FormCusto>(CUSTO_EMPTY);
  const [deleteCustoDialog, setDeleteCustoDialog] = useState<CustoEmpresa | null>(null);
  const [editCustoDialog, setEditCustoDialog] = useState<{ id: string; data: Omit<CustoEmpresa, 'id'>; original: CustoEmpresa } | null>(null);

  const [formCat, setFormCat]         = useState<FormCat>(CAT_EMPTY);
  const [showCatForm, setShowCatForm] = useState(false);

  const loadCategorias = useCallback(async () => {
    const cats = await getCategoriasEmpresa();
    setCategorias(cats);
    return cats;
  }, []);

  const loadCustos = useCallback(async () => {
    setLoading(true);
    setCustos(await getCustosEmpresa(mes, ano));
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => {
    loadCategorias().then((cats) => {
      if (!formCusto.categoriaId && cats.length > 0) {
        setFormCusto((f) => ({ ...f, categoriaId: cats[0].id! }));
      }
    });
  }, [loadCategorias]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCustos(); }, [loadCustos]);
  useRefetchOnFocus(loadCustos);

  function catPorId(id: string) { return categorias.find((c) => c.id === id); }

  async function handleSaveCusto(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const total    = parseCurrencyInput(formCusto.valor);
    const parcelas = parseInt(formCusto.totalParcelas);
    const data: Omit<CustoEmpresa, 'id'> = {
      categoriaId:   formCusto.categoriaId,
      descricao:     formCusto.descricao,
      valor:         total,
      valorParcela:  total / parcelas,
      totalParcelas: parcelas,
      parcelaAtual:  parseInt(formCusto.parcelaAtual),
      mes, ano,
      fixa: formCusto.fixa && parcelas <= 1,
    };
    if (editCustoId) {
      const original = custos.find((c) => c.id === editCustoId);
      const isFixa  = !!(original?.fixa || data.fixa);
      const isSerie = !isFixa && ((original?.totalParcelas ?? 1) > 1 || data.totalParcelas > 1);

      if (original && isSerie) {
        const futuras = await getCustosFuturosDoGrupo(original);
        const countChanged     = original.totalParcelas !== data.totalParcelas;
        const futurosEsperados = Math.max(0, data.totalParcelas - data.parcelaAtual);
        // Reparcela se o total mudou ou se a série está inconsistente (nº de docs futuros
        // diferente do esperado) — isso também conserta séries já corrompidas.
        if (countChanged || futuras.length !== futurosEsperados) {
          await updateCustoReparcelado(editCustoId, data, original);
          fecharModalCusto();
          loadCustos();
          return;
        }
        if (futuras.length > 0) {
          // Mesma qtd de parcelas, mas há meses futuros → perguntar escopo
          setShowCustoModal(false);
          setEditCustoDialog({ id: editCustoId, data, original });
          return;
        }
        await updateCustoEmpresa(editCustoId, data);
      } else if (original && isFixa) {
        const futuras = await getCustosFuturosDoGrupo(original);
        if (futuras.length > 0) {
          setShowCustoModal(false);
          setEditCustoDialog({ id: editCustoId, data, original });
          return;
        }
        await updateCustoEmpresaFixa(editCustoId, data, original);
      } else {
        await updateCustoEmpresa(editCustoId, data);
      }
    } else {
      await addCustoEmpresa(data);
    }
    fecharModalCusto();
    loadCustos();
  }

  async function confirmarEditCusto(scope: 'this' | 'future') {
    const { id, data, original } = editCustoDialog!;
    setEditCustoDialog(null);
    if (scope === 'future') {
      if (original.fixa) await updateCustoEmpresaFixa(id, data, original);
      else                await updateCustoEmpresaAndFuture(id, data, original);
    } else {
      await updateCustoEmpresa(id, data);
    }
    fecharModalCusto();
    loadCustos();
  }

  function fecharModalCusto() {
    setShowCustoModal(false);
    setEditCustoId(null);
    setFormCusto({ ...CUSTO_EMPTY, categoriaId: categorias[0]?.id ?? '' });
  }

  function abrirNovoCusto(categoriaId?: string) {
    setEditCustoId(null);
    setFormCusto({ ...CUSTO_EMPTY, categoriaId: categoriaId ?? categorias[0]?.id ?? '' });
    setShowCustoModal(true);
  }

  function abrirEditCusto(c: CustoEmpresa) {
    setEditCustoId(c.id!);
    setFormCusto({
      categoriaId:   c.categoriaId,
      descricao:     c.descricao,
      valor:         formatCurrencyBRL(c.valor),
      totalParcelas: String(c.totalParcelas),
      parcelaAtual:  String(c.parcelaAtual),
      fixa:          c.fixa ?? false,
    });
    setShowCustoModal(true);
  }

  async function handleToggleFixaCusto(c: CustoEmpresa) {
    await toggleCustoEmpresaFixa(c.id!, c, !c.fixa);
    loadCustos();
  }

  function iniciarDeleteCusto(c: CustoEmpresa) {
    if (c.fixa || c.totalParcelas > c.parcelaAtual) {
      setDeleteCustoDialog(c);
    } else {
      deleteCustoEmpresa(c.id!).then(loadCustos);
    }
  }

  async function confirmarDeleteCusto(scope: 'this' | 'future') {
    const c = deleteCustoDialog!;
    setDeleteCustoDialog(null);
    if (scope === 'future') {
      await deleteCustoEmpresaAndFuture(c.id!, c);
    } else {
      await deleteCustoEmpresa(c.id!);
    }
    loadCustos();
  }

  async function handleSaveCategoria(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await addCategoriaEmpresa(formCat);
    setShowCatForm(false);
    setFormCat(CAT_EMPTY);
    loadCategorias();
  }

  async function handleDeleteCategoria(id: string) {
    await deleteCategoriaEmpresa(id);
    loadCategorias();
  }

  // ── dados derivados ───────────────────────────────────────────────────────
  const totalGeral = custos.reduce((s, c) => s + c.valorParcela, 0);

  const totalPorCategoria = categorias.map((cat) => {
    const itens = custos.filter((c) => c.categoriaId === cat.id);
    return { ...cat, fill: cat.cor, total: itens.reduce((s, c) => s + c.valorParcela, 0), count: itens.length };
  });

  const custosFiltrados = catFiltro ? custos.filter((c) => c.categoriaId === catFiltro) : custos;
  const catAtiva        = categorias.find((c) => c.id === catFiltro);

  // Ranking "Custo por Categoria" (mesmo formato dos outros gráficos).
  const rankingEmpresa = useMemo(
    () => totalPorCategoria
      .filter((c) => c.total > 0)
      .map((c) => ({ name: c.nome, value: c.total, fill: c.fill }))
      .sort((a, b) => b.value - a.value),
    [totalPorCategoria],
  );
  const totalEmpCat = useMemo(() => rankingEmpresa.reduce((s, v) => s + v.value, 0), [rankingEmpresa]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Empresa</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-400">{custos.length} custo(s) · {fmt(totalGeral)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-sky-200 text-sky-500 rounded-xl text-sm font-medium hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <GearIcon /><span className="hidden sm:inline">Configurações</span>
          </button>
          <button
            onClick={() => abrirNovoCusto()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm shadow-sky-200 dark:shadow-sky-500/20"
          >
            <Plus /><span className="hidden sm:inline">Novo Custo</span>
          </button>
        </div>
      </div>

      {/* ── Card total ── */}
      <div className="bg-gradient-to-br from-cyan-600 dark:from-cyan-600 to-sky-700 rounded-2xl px-4 py-3 text-white shadow-lg shadow-cyan-200 dark:shadow-cyan-500/20">
        <p className="text-cyan-100 dark:text-cyan-100 text-xs font-medium uppercase tracking-wide">Total do Mês — Empresa</p>
        <p className="text-2xl font-bold mt-0.5 tabular-nums">{fmt(totalGeral)}</p>
        <p className="text-cyan-100 dark:text-cyan-100 text-[11px] mt-1">{custos.length} custo(s) em {categorias.length} categoria(s)</p>
      </div>

      {/* ── Gráfico (ranking) ── */}
      {rankingEmpresa.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">Custo por Categoria</p>
            <span className="text-[11px] text-slate-400 dark:text-zinc-400 flex-shrink-0">{rankingEmpresa.length} categoria(s)</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
            {rankingEmpresa.map((it, idx) => {
              const pctTotal = totalEmpCat > 0 ? (it.value / totalEmpCat) * 100 : 0;
              const pctBar   = (it.value / rankingEmpresa[0].value) * 100;
              return (
                <div key={it.name} className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ backgroundColor: it.fill }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate flex items-center gap-1.5">
                        {it.name}
                        {idx === 0 && rankingEmpresa.length > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 font-semibold whitespace-nowrap">maior</span>
                        )}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 tabular-nums flex-shrink-0">{fmt(it.value)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctBar}%`, backgroundColor: it.fill }} />
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-400 tabular-nums w-9 text-right flex-shrink-0">{pctTotal.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Filtros de categoria ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFiltro(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${!catFiltro ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-sky-300 hover:text-sky-600'}`}
        >
          Todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCatFiltro(catFiltro === cat.id ? null : cat.id!)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
            style={catFiltro === cat.id
              ? { backgroundColor: cat.cor, color: '#fff', borderColor: cat.cor }
              : { borderColor: '#e2e8f0', color: '#64748b' }}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* ── Lista de custos ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">
            {catAtiva ? `Custos — ${catAtiva.nome}` : 'Todos os Custos do Mês'}
          </h3>
          {catAtiva && (
            <button
              onClick={() => abrirNovoCusto(catAtiva.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 transition-colors"
            >
              <Plus /> Adicionar
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400 dark:text-zinc-400 text-sm text-center py-8">Carregando...</p>
        ) : custosFiltrados.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-400">
            <span className="text-3xl">🏢</span>
            <p className="text-sm">{catFiltro ? 'Nenhum custo nesta categoria' : 'Nenhum custo cadastrado este mês'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {custosFiltrados.map((c) => {
              const cat = catPorId(c.categoriaId);
              return (
                <div key={c.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.cor ?? '#06b6d4' }} />
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ backgroundColor: `${cat?.cor ?? '#06b6d4'}22`, color: cat?.cor ?? '#06b6d4' }}
                    >
                      {cat?.nome ?? '—'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-700 dark:text-zinc-200 text-sm truncate">{c.descricao}</p>
                        {c.fixa && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">Fixo</span>}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-zinc-400">
                        {c.fixa
                          ? 'todo mês'
                          : <>{c.parcelaAtual}/{c.totalParcelas}x{c.totalParcelas > 1 && ` · total ${fmt(c.valor)}`}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-sm text-sky-600 tabular-nums">{fmt(c.valorParcela)}</span>
                    <div className="w-[5.5rem] flex items-center gap-0.5">
                      {c.totalParcelas <= 1 && (
                        <button onClick={() => handleToggleFixaCusto(c)} title={c.fixa ? 'Remover recorrência' : 'Marcar como fixo'}
                          className={`p-1.5 rounded-lg transition-all ${c.fixa ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-300 dark:text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}>
                          <PinIcon filled={c.fixa} />
                        </button>
                      )}
                      <button onClick={() => abrirEditCusto(c)} className="p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-sky-100 text-slate-300 dark:text-zinc-500 hover:text-sky-500 transition-all"><Pencil /></button>
                      <button onClick={() => iniciarDeleteCusto(c)} className="p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 dark:text-zinc-500 hover:text-red-400 transition-all"><Trash /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Modal novo/editar custo ── */}
      {showCustoModal && (
        <Modal
          title={editCustoId ? 'Editar Custo' : 'Novo Custo'}
          onClose={() => { setShowCustoModal(false); setEditCustoId(null); setFormCusto(CUSTO_EMPTY); }}
        >
          <form onSubmit={handleSaveCusto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormCusto({ ...formCusto, categoriaId: cat.id! })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                    style={formCusto.categoriaId === cat.id
                      ? { backgroundColor: cat.cor, color: '#fff', borderColor: cat.cor }
                      : { borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Descrição</label>
              <input required value={formCusto.descricao} onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })} className={INPUT} placeholder="Ex: DAS Junho 2025" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Valor Total (R$)</label>
              <input required value={formCusto.valor} onChange={(e) => setFormCusto({ ...formCusto, valor: formatCurrencyInput(e.target.value) })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Parcela Atual</label>
                <input required type="number" min={1} value={formCusto.parcelaAtual} onChange={(e) => setFormCusto({ ...formCusto, parcelaAtual: e.target.value })} className={INPUT} placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Total de Parcelas</label>
                <input required type="number" min={1} value={formCusto.totalParcelas} onChange={(e) => setFormCusto({ ...formCusto, totalParcelas: e.target.value })} className={INPUT} placeholder="1" />
              </div>
            </div>

            {formCusto.valor && parseInt(formCusto.totalParcelas) > 1 && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 bg-sky-50 rounded-lg p-2">
                Valor por parcela: <strong>{fmt(parseCurrencyInput(formCusto.valor) / parseInt(formCusto.totalParcelas) || 0)}</strong>
              </p>
            )}

            {!editCustoId && parseInt(formCusto.totalParcelas || '1') <= 1 && (
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                <div onClick={() => setFormCusto({ ...formCusto, fixa: !formCusto.fixa })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${formCusto.fixa ? 'bg-amber-400' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                  <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${formCusto.fixa ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Custo Fixo</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-400">Repete automaticamente todo mês</p>
                </div>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCustoModal(false); setEditCustoId(null); }} className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações — Empresa" onClose={() => { setShowConfigModal(false); setShowCatForm(false); setFormCat(CAT_EMPTY); }}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Categorias</p>
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-sky-100 hover:bg-sky-50/50">
                <span className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.cor }} />
                <p className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200">{cat.nome}</p>
                <button onClick={() => handleDeleteCategoria(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 dark:text-zinc-500 hover:text-red-400 transition-colors"><Trash /></button>
              </div>
            ))}

            {!showCatForm ? (
              <button onClick={() => setShowCatForm(true)} className="w-full py-2.5 border-2 border-dashed border-sky-200 rounded-xl text-sm text-slate-400 dark:text-zinc-400 hover:border-sky-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-2">
                <Plus /> Nova Categoria
              </button>
            ) : (
              <form onSubmit={handleSaveCategoria} className="border border-sky-200 rounded-xl p-4 space-y-3 bg-sky-50/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Nova Categoria</p>
                <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Alvará, ISS..." />
                <div>
                  <label className="block text-xs text-slate-500 dark:text-zinc-400 mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formCat.cor} onChange={(e) => setFormCat({ ...formCat, cor: e.target.value })} className="w-10 h-9 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer p-0.5 bg-white dark:bg-zinc-900" />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{formCat.cor}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium ml-2" style={{ backgroundColor: `${formCat.cor}22`, color: formCat.cor }}>
                      {formCat.nome || 'Exemplo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowCatForm(false); setFormCat(CAT_EMPTY); }} className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-sky-600 text-white rounded-xl text-xs font-medium hover:bg-sky-700">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* ── Dialog exclusão de custos futuros ── */}
      {deleteCustoDialog && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100">Remover custo da empresa</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              <strong>&quot;{deleteCustoDialog.descricao}&quot;</strong> {deleteCustoDialog.fixa ? 'se repete nos meses seguintes' : 'tem parcelas em meses seguintes'}. Deseja remover só {deleteCustoDialog.fixa ? 'este mês' : 'esta parcela'} ou {deleteCustoDialog.fixa ? 'este e os seguintes' : 'todas as parcelas restantes'}?
            </p>
            <div className="space-y-2 pt-1">
              <button onClick={() => confirmarDeleteCusto('future')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
                {deleteCustoDialog.fixa ? 'Remover este e os seguintes' : 'Remover esta e as seguintes'}
              </button>
              <button onClick={() => confirmarDeleteCusto('this')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700 dark:bg-zinc-700 text-white hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors">
                {deleteCustoDialog.fixa ? 'Só este mês' : 'Só esta parcela'}
              </button>
              <button onClick={() => setDeleteCustoDialog(null)}
                className="w-full py-2.5 rounded-xl text-sm text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog escopo de edição: este mês ou também os seguintes ── */}
      {editCustoDialog && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100">Aplicar alteração</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              <strong>&quot;{editCustoDialog.original.descricao}&quot;</strong> também aparece em meses seguintes. Deseja aplicar essa alteração só a este mês ou também aos próximos?
            </p>
            <div className="space-y-2 pt-1">
              <button onClick={() => confirmarEditCusto('future')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                Este e os seguintes
              </button>
              <button onClick={() => confirmarEditCusto('this')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-700 dark:bg-zinc-700 text-white hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors">
                Só este mês
              </button>
              <button onClick={() => { setEditCustoDialog(null); fecharModalCusto(); }}
                className="w-full py-2.5 rounded-xl text-sm text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
