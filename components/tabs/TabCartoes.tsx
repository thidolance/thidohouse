'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash } from '../ui/Icons';
import { getCompras, addCompra, deleteCompra } from '@/lib/firestore';
import type { CompraParcelada, TipoCompra } from '@/lib/types';

// ─── Cartões fixos ───────────────────────────────────────────────────────────

const CARTOES = [
  { id: 'bradesco', nome: 'Bradesco',  cor: '#CC0000', bgGrad: 'from-red-600 to-red-700',    bandeira: 'Visa'       },
  { id: 'nubank',   nome: 'Nubank',    cor: '#820AD1', bgGrad: 'from-purple-700 to-purple-800', bandeira: 'Mastercard' },
  { id: 'sicob',    nome: 'Sicob',     cor: '#0055A5', bgGrad: 'from-blue-700 to-blue-800',   bandeira: 'Visa'       },
  { id: 'inter',    nome: 'Inter',     cor: '#FF7A00', bgGrad: 'from-orange-500 to-orange-600', bandeira: 'Mastercard' },
] as const;

type CartaoId = (typeof CARTOES)[number]['id'];

// ─── Tipos de compra ─────────────────────────────────────────────────────────

const TIPOS: TipoCompra[] = ['Saúde', 'Casa', 'Filhos', 'Comida', 'Besteiras'];

const TIPO_COLOR: Record<TipoCompra, string> = {
  Saúde:     '#10b981',
  Casa:      '#6366f1',
  Filhos:    '#f59e0b',
  Comida:    '#ef4444',
  Besteiras: '#ec4899',
};

// ─── Ícones de bandeira ──────────────────────────────────────────────────────

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

// ─── Formatador ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Componente principal ────────────────────────────────────────────────────

interface Props { mes: number; ano: number; }

export default function TabCartoes({ mes, ano }: Props) {
  const [compras, setCompras] = useState<CompraParcelada[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoId | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<{
    cartaoId: CartaoId;
    descricao: string;
    tipo: TipoCompra;
    valorTotal: string;
    totalParcelas: string;
    parcelaAtual: string;
  }>({
    cartaoId: 'bradesco',
    descricao: '',
    tipo: 'Casa',
    valorTotal: '',
    totalParcelas: '',
    parcelaAtual: '1',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getCompras(mes, ano);
    setCompras(list);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const total = parseFloat(form.valorTotal.replace(',', '.'));
    const parcelas = parseInt(form.totalParcelas);
    await addCompra({
      cartaoId: form.cartaoId,
      descricao: form.descricao,
      tipo: form.tipo,
      valorTotal: total,
      valorParcela: total / parcelas,
      totalParcelas: parcelas,
      parcelaAtual: parseInt(form.parcelaAtual),
      mes,
      ano,
    });
    setShowModal(false);
    setForm((f) => ({ ...f, descricao: '', valorTotal: '', totalParcelas: '', parcelaAtual: '1' }));
    load();
  }

  async function handleDelete(id: string) {
    await deleteCompra(id);
    load();
  }

  const totalGeral = compras.reduce((s, c) => s + c.valorParcela, 0);

  const totalPorCartao = CARTOES.map((c) => ({
    ...c,
    fill: c.cor,
    total: compras.filter((p) => p.cartaoId === c.id).reduce((s, p) => s + p.valorParcela, 0),
    count: compras.filter((p) => p.cartaoId === c.id).length,
  }));

  const comprasDoCartao = cartaoSelecionado
    ? compras.filter((c) => c.cartaoId === cartaoSelecionado)
    : [];

  function abrirModal(cartaoId: CartaoId) {
    setForm((f) => ({ ...f, cartaoId, parcelaAtual: '1' }));
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus /> Nova Compra
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-white">
          <p className="text-slate-300 text-xs">Total do Mês</p>
          <p className="text-xl font-bold mt-1">{fmt(totalGeral)}</p>
          <p className="text-slate-400 text-xs mt-1">{compras.length} compra(s)</p>
        </div>
        {CARTOES.map((c) => {
          const dado = totalPorCartao.find((t) => t.id === c.id)!;
          return (
            <div key={c.id} className={`bg-gradient-to-br ${c.bgGrad} rounded-2xl p-3 text-white`}>
              <p className="text-white/70 text-xs">{c.nome}</p>
              <p className="text-base font-bold mt-1">{fmt(dado.total)}</p>
              <p className="text-white/50 text-xs">{dado.count} compra(s)</p>
            </div>
          );
        })}
      </div>

      {/* Gráfico */}
      {totalGeral > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4">Gasto por Cartão</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={totalPorCartao.filter((c) => c.total > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Cards visuais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARTOES.map((c) => {
          const dado = totalPorCartao.find((t) => t.id === c.id)!;
          const isSelected = cartaoSelecionado === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCartaoSelecionado(isSelected ? null : c.id)}
              className={`relative rounded-2xl p-5 text-left transition-all bg-gradient-to-br ${c.bgGrad} text-white shadow-lg hover:scale-105 ${isSelected ? 'ring-4 ring-white/40 scale-105' : ''}`}
              style={{ aspectRatio: '1.6 / 1', minHeight: 120 }}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-bold tracking-wide">{c.nome}</span>
                {c.bandeira === 'Visa' ? <VisaLogo /> : <MastercardLogo />}
              </div>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-xs">Mês atual</p>
                  <p className="text-base font-bold">{fmt(dado.total)}</p>
                </div>
                <p className="text-white/60 text-xs">{dado.count} compra(s)</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhe do cartão selecionado */}
      {cartaoSelecionado && (
        <Card>
          {(() => {
            const c = CARTOES.find((c) => c.id === cartaoSelecionado)!;
            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />
                    <h3 className="font-semibold text-slate-700">{c.nome}</h3>
                  </div>
                  <button
                    onClick={() => abrirModal(c.id)}
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
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${TIPO_COLOR[p.tipo]}22`, color: TIPO_COLOR[p.tipo] }}
                          >
                            {p.tipo}
                          </span>
                          <div>
                            <p className="font-medium text-slate-700 text-sm">{p.descricao}</p>
                            <p className="text-xs text-slate-400">
                              {p.parcelaAtual}/{p.totalParcelas}x · total {fmt(p.valorTotal)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm" style={{ color: c.cor }}>{fmt(p.valorParcela)}</span>
                          <button
                            onClick={() => handleDelete(p.id!)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <Trash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </Card>
      )}

      {/* Todas as compras agrupadas */}
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
                const c = CARTOES.find((c) => c.id === p.cartaoId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c?.cor ?? '#94a3b8' }} />
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${TIPO_COLOR[p.tipo]}22`, color: TIPO_COLOR[p.tipo] }}
                      >
                        {p.tipo}
                      </span>
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{p.descricao}</p>
                        <p className="text-xs text-slate-400">{c?.nome} · {p.parcelaAtual}/{p.totalParcelas}x</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-slate-700">{fmt(p.valorParcela)}</span>
                      <button
                        onClick={() => handleDelete(p.id!)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal nova compra */}
      {showModal && (
        <Modal title="Nova Compra Parcelada" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Seleção do cartão */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cartão</label>
              <div className="grid grid-cols-2 gap-2">
                {CARTOES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, cartaoId: c.id })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                      form.cartaoId === c.id
                        ? 'border-transparent text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    style={form.cartaoId === c.id ? { backgroundColor: c.cor, borderColor: c.cor } : {}}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.cor }}
                    />
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input
                required
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ex: Notebook"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, tipo: t })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      form.tipo === t ? 'text-white border-transparent' : 'border-slate-200 text-slate-500'
                    }`}
                    style={form.tipo === t ? { backgroundColor: TIPO_COLOR[t] } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
              <input
                required
                value={form.valorTotal}
                onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parcela Atual</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.parcelaAtual}
                  onChange={(e) => setForm({ ...form, parcelaAtual: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total de Parcelas</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.totalParcelas}
                  onChange={(e) => setForm({ ...form, totalParcelas: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="12"
                />
              </div>
            </div>

            {form.valorTotal && form.totalParcelas && parseInt(form.totalParcelas) > 0 && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                Valor por parcela:{' '}
                <strong>
                  {fmt(parseFloat(form.valorTotal.replace(',', '.')) / parseInt(form.totalParcelas) || 0)}
                </strong>
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
