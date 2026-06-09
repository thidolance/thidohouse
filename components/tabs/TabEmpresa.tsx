'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil } from '../ui/Icons';
import {
  getCustosEmpresa, addCustoEmpresa, updateCustoEmpresa, deleteCustoEmpresa,
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

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300';
const fmt   = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props { mes: number; ano: number; }

type FormCusto = {
  categoriaId: string; descricao: string;
  valor: string; totalParcelas: string; parcelaAtual: string;
};
const CUSTO_EMPTY: FormCusto = { categoriaId: '', descricao: '', valor: '', totalParcelas: '1', parcelaAtual: '1' };

type FormCat = { nome: string; cor: string };
const CAT_EMPTY: FormCat = { nome: '', cor: '#38bdf8' };

export default function TabEmpresa({ mes, ano }: Props) {
  const [custos, setCustos]         = useState<CustoEmpresa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEmpresa[]>([]);
  const [loading, setLoading]       = useState(false);
  const [catFiltro, setCatFiltro]   = useState<string | null>(null);

  const [showCustoModal, setShowCustoModal]   = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [editCustoId, setEditCustoId] = useState<string | null>(null);
  const [formCusto, setFormCusto]     = useState<FormCusto>(CUSTO_EMPTY);

  const [formCat, setFormCat]       = useState<FormCat>(CAT_EMPTY);
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

  function catPorId(id: string) { return categorias.find((c) => c.id === id); }

  // ── custos ────────────────────────────────────────────────────────────────
  async function handleSaveCusto(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const total    = parseFloat(formCusto.valor.replace(',', '.'));
    const parcelas = parseInt(formCusto.totalParcelas);
    const data: Omit<CustoEmpresa, 'id'> = {
      categoriaId:   formCusto.categoriaId,
      descricao:     formCusto.descricao,
      valor:         total,
      valorParcela:  total / parcelas,
      totalParcelas: parcelas,
      parcelaAtual:  parseInt(formCusto.parcelaAtual),
      mes, ano,
    };
    if (editCustoId) await updateCustoEmpresa(editCustoId, data);
    else             await addCustoEmpresa(data);
    setShowCustoModal(false);
    setEditCustoId(null);
    setFormCusto({ ...CUSTO_EMPTY, categoriaId: categorias[0]?.id ?? '' });
    loadCustos();
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
      valor:         c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      totalParcelas: String(c.totalParcelas),
      parcelaAtual:  String(c.parcelaAtual),
    });
    setShowCustoModal(true);
  }

  async function handleDeleteCusto(id: string) {
    await deleteCustoEmpresa(id);
    loadCustos();
  }

  // ── categorias (config) ───────────────────────────────────────────────────
  async function handleSaveCategoria(e: React.FormEvent) {
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
    return { ...cat, total: itens.reduce((s, c) => s + c.valorParcela, 0), count: itens.length };
  });

  const custosFiltrados = catFiltro ? custos.filter((c) => c.categoriaId === catFiltro) : custos;
  const catAtiva        = categorias.find((c) => c.id === catFiltro);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <GearIcon /> Configurações
        </button>
        <button
          onClick={() => abrirNovoCusto()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          <Plus /> Novo Custo
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-sky-700 to-sky-800 rounded-2xl p-4 text-white">
          <p className="text-sky-200 text-xs">Total do Mês</p>
          <p className="text-xl font-bold mt-1">{fmt(totalGeral)}</p>
          <p className="text-sky-300 text-xs mt-1">{custos.length} custo(s)</p>
        </div>
        {totalPorCategoria.filter((c) => c.total > 0).map((cat) => (
          <div key={cat.id} className="relative overflow-hidden rounded-2xl p-3 text-white" style={{ backgroundColor: cat.cor }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
            <p className="relative text-white/70 text-xs">{cat.nome}</p>
            <p className="relative text-base font-bold mt-1">{fmt(cat.total)}</p>
            <p className="relative text-white/50 text-xs">{cat.count} item(s)</p>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      {totalGeral > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4">Custo por Categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={totalPorCategoria.filter((c) => c.total > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFiltro(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${!catFiltro ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-200 text-slate-500 hover:border-sky-300'}`}
        >
          Todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCatFiltro(catFiltro === cat.id ? null : cat.id!)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
            style={catFiltro === cat.id
              ? { backgroundColor: cat.cor, color: '#fff', borderColor: cat.cor }
              : { borderColor: '#e2e8f0', color: '#64748b' }}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Lista de custos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">
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
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : custosFiltrados.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            {catFiltro ? 'Nenhum custo nesta categoria este mês' : 'Nenhum custo cadastrado este mês'}
          </p>
        ) : (
          <div className="space-y-2">
            {custosFiltrados.map((c) => {
              const cat = catPorId(c.categoriaId);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.cor ?? '#38bdf8' }} />
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${cat?.cor ?? '#38bdf8'}22`, color: cat?.cor ?? '#38bdf8' }}
                    >
                      {cat?.nome ?? '—'}
                    </span>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{c.descricao}</p>
                      <p className="text-xs text-slate-400">
                        {c.parcelaAtual}/{c.totalParcelas}x
                        {c.totalParcelas > 1 && ` · total ${fmt(c.valor)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-sky-600">{fmt(c.valorParcela)}</span>
                    <button onClick={() => abrirEditCusto(c)} className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-300 hover:text-sky-500 transition-colors"><Pencil /></button>
                    <button onClick={() => handleDeleteCusto(c.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input required value={formCusto.descricao} onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })} className={INPUT} placeholder="Ex: DAS Junho 2025" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
              <input required value={formCusto.valor} onChange={(e) => setFormCusto({ ...formCusto, valor: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parcela Atual</label>
                <input required type="number" min={1} value={formCusto.parcelaAtual} onChange={(e) => setFormCusto({ ...formCusto, parcelaAtual: e.target.value })} className={INPUT} placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total de Parcelas</label>
                <input required type="number" min={1} value={formCusto.totalParcelas} onChange={(e) => setFormCusto({ ...formCusto, totalParcelas: e.target.value })} className={INPUT} placeholder="1" />
              </div>
            </div>

            {formCusto.valor && parseInt(formCusto.totalParcelas) > 1 && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                Valor por parcela: <strong>{fmt(parseFloat(formCusto.valor.replace(',', '.')) / parseInt(formCusto.totalParcelas) || 0)}</strong>
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCustoModal(false); setEditCustoId(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações — Empresa" onClose={() => { setShowConfigModal(false); setShowCatForm(false); setFormCat(CAT_EMPTY); }}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorias</p>
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                <p className="flex-1 text-sm font-medium text-slate-700">{cat.nome}</p>
                <button onClick={() => handleDeleteCategoria(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
              </div>
            ))}

            {!showCatForm ? (
              <button onClick={() => setShowCatForm(true)} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors flex items-center justify-center gap-2">
                <Plus /> Nova Categoria
              </button>
            ) : (
              <form onSubmit={handleSaveCategoria} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">Nova Categoria</p>
                <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Alvará, ISS..." />
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
                  <button type="submit" className="flex-1 py-2 bg-sky-600 text-white rounded-xl text-xs font-medium hover:bg-sky-700">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
