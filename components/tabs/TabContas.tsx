'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Check, Receipt } from '../ui/Icons';
import {
  getContas, addConta, deleteConta, updateContaStatus,
  getCompras, getFaturasCartao, setFaturaCartaoStatus,
} from '@/lib/firestore';
import type { Conta, CategoriaContas } from '@/lib/types';
import { CARTOES } from '@/lib/cartoes';

const CATEGORIAS: CategoriaContas[] = [
  'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Outros',
];

const CAT_COLORS: Record<string, string> = {
  Moradia: '#6366f1',
  Alimentação: '#f59e0b',
  Transporte: '#3b82f6',
  Saúde: '#10b981',
  Lazer: '#ec4899',
  Educação: '#8b5cf6',
  Outros: '#94a3b8',
};

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props { mes: number; ano: number; }

type FormState = {
  descricao: string; categoria: CategoriaContas; valor: string; vencimento: string;
  parcelaAtual: string; totalParcelas: string;
};
const FORM_EMPTY: FormState = {
  descricao: '', categoria: 'Moradia', valor: '', vencimento: '',
  parcelaAtual: '', totalParcelas: '',
};

// Item unificado para a lista
type CartaoItem = {
  tipo: 'cartao'; cartaoId: string; cartaoNome: string;
  cartaoCor: string; valor: number; status: 'pago' | 'pendente';
};

export default function TabContas({ mes, ano }: Props) {
  const now = new Date();
  const [contas, setContas] = useState<Conta[]>([]);
  const [itensCartao, setItensCartao] = useState<CartaoItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    const [contasList, comprasList, faturasList] = await Promise.all([
      getContas(mes, ano),
      getCompras(mes, ano),
      getFaturasCartao(mes, ano),
    ]);

    // Ordena: pendentes primeiro por vencimento, pagos por último
    contasList.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1;
      return a.vencimento - b.vencimento;
    });
    setContas(contasList);

    // Agrupa compras por cartão e cria item por cartão com gasto > 0
    type CartaoItem = { tipo: 'cartao'; cartaoId: string; cartaoNome: string; cartaoCor: string; valor: number; status: 'pago' | 'pendente' };
    const cards: CartaoItem[] = CARTOES.flatMap((c): CartaoItem[] => {
      const total = comprasList
        .filter((p) => p.cartaoId === c.id)
        .reduce((s, p) => s + p.valorParcela, 0);
      if (total === 0) return [];
      const fatura = faturasList.find((f) => f.cartaoId === c.id);
      return [{
        tipo: 'cartao',
        cartaoId: c.id as string,
        cartaoNome: c.nome as string,
        cartaoCor: c.cor as string,
        valor: total,
        status: fatura?.status ?? 'pendente',
      }];
    });

    // Mesmo critério de ordenação dos cartões
    cards.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1;
      return a.cartaoNome.localeCompare(b.cartaoNome);
    });
    setItensCartao(cards);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);

  const totalContasPago     = contas.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalContasPendente = contas.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPago     = itensCartao.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPendente = itensCartao.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);

  const totalPago     = totalContasPago + totalCartoesPago;
  const totalPendente = totalContasPendente + totalCartoesPendente;
  const total         = totalPago + totalPendente;
  const pctPago       = total > 0 ? (totalPago / total) * 100 : 0;
  const countPago     = contas.filter((c) => c.status === 'pago').length + itensCartao.filter((c) => c.status === 'pago').length;
  const countTotal    = contas.length + itensCartao.length;

  async function handleAdd(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await addConta({
      descricao: form.descricao,
      categoria: form.categoria,
      valor: parseFloat(form.valor.replace(',', '.')),
      vencimento: parseInt(form.vencimento),
      status: 'pendente',
      mes,
      ano,
      parcelaAtual:  form.parcelaAtual  ? parseInt(form.parcelaAtual)  : undefined,
      totalParcelas: form.totalParcelas ? parseInt(form.totalParcelas) : undefined,
    });
    setForm(FORM_EMPTY);
    setShowModal(false);
    load();
  }

  async function handleToggleConta(id: string, status: 'pago' | 'pendente') {
    await updateContaStatus(id, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleToggleCartao(cartaoId: string, status: 'pago' | 'pendente') {
    await setFaturaCartaoStatus(cartaoId, mes, ano, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleDelete(id: string) {
    await deleteConta(id);
    load();
  }

  const pieData = CATEGORIAS
    .map((cat) => ({
      name: cat,
      value: contas.filter((c) => c.categoria === cat).reduce((s, c) => s + c.valor, 0),
      fill: CAT_COLORS[cat] ?? '#94a3b8',
    }))
    .filter((d) => d.value > 0);

  // Inclui cartões no pie de categorias
  const pieFaturas = itensCartao.map((c) => ({ name: c.cartaoNome, value: c.valor, fill: c.cartaoCor }));
  const pieDataFull = [...pieData, ...pieFaturas];

  const barData = [
    { name: 'Pago',     valor: totalPago,     fill: '#10b981' },
    { name: 'Pendente', valor: totalPendente, fill: '#f59e0b' },
  ];

  const pendentesHoje = contas.filter(
    (c) => c.status === 'pendente'
      && c.vencimento <= new Date().getDate()
      && mes === now.getMonth() + 1
      && ano === now.getFullYear(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus /> Nova Conta
        </button>
      </div>

      {/* Alertas */}
      {pendentesHoje.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-medium">
            {pendentesHoje.length} conta(s) vencida(s) ou vencendo hoje
          </p>
          <p className="text-amber-600 text-xs mt-1">
            {pendentesHoje.map((c) => c.descricao).join(', ')}
          </p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-0">
          <p className="text-slate-300 text-sm">Total do Mês</p>
          <p className="text-2xl font-bold mt-1">{fmt(total)}</p>
          {itensCartao.length > 0 && (
            <p className="text-slate-400 text-xs mt-1">
              incl. {fmt(totalCartoesPago + totalCartoesPendente)} em cartões
            </p>
          )}
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Pago</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalPago)}</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pctPago}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Pendente</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{fmt(totalPendente)}</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: total > 0 ? `${(totalPendente / total) * 100}%` : '0%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico por categoria */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Receipt />
            <h3 className="font-semibold text-slate-700">Por Categoria</h3>
          </div>
          {pieDataFull.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieDataFull} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} />
                <Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Nenhuma conta cadastrada
            </div>
          )}
        </Card>

        {/* Pago vs Pendente */}
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4">Pago vs Pendente</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Lista unificada */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">Contas do Mês</h3>
          {countTotal > 0 && (
            <span className="text-xs text-slate-500">{countPago}/{countTotal} pagas</span>
          )}
        </div>

        {/* Barra de progresso */}
        {countTotal > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">{fmt(totalPago)} pagos</span>
              <span className="text-xs font-semibold text-emerald-600">{pctPago.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pctPago}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{fmt(totalPendente)} ainda pendentes</p>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : countTotal === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhuma conta cadastrada neste mês</p>
        ) : (
          <div className="space-y-2">
            {/* ── Contas manuais ── */}
            {contas.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                  c.status === 'pago'
                    ? 'bg-emerald-50 border border-emerald-100'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleConta(c.id!, c.status)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      c.status === 'pago'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {c.status === 'pago' && <Check />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {c.descricao}
                      </p>
                      {c.totalParcelas && c.parcelaAtual && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                          {c.parcelaAtual}/{c.totalParcelas}x
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ backgroundColor: `${CAT_COLORS[c.categoria]}22`, color: CAT_COLORS[c.categoria] }}
                      >
                        {c.categoria}
                      </span>
                      <span className="text-xs text-slate-400">vence dia {c.vencimento}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {fmt(c.valor)}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id!)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            ))}

            {/* ── Faturas de cartão ── */}
            {itensCartao.map((c) => (
              <div
                key={c.cartaoId}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 border ${
                  c.status === 'pago'
                    ? 'border-emerald-100 bg-emerald-50'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleCartao(c.cartaoId, c.status)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      c.status === 'pago'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {c.status === 'pago' && <Check />}
                  </button>
                  <div>
                    <p className={`font-medium text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      Fatura {c.cartaoNome}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Badge na cor do cartão */}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                        style={{ backgroundColor: `${c.cartaoCor}22`, color: c.cartaoCor }}
                      >
                        {c.cartaoNome}
                      </span>
                      <span className="text-xs text-slate-400">fatura do mês</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Barra lateral colorida */}
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: c.cartaoCor }} />
                  <span className={`font-semibold text-sm ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {fmt(c.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal nova conta */}
      {showModal && (
        <Modal title="Nova Conta" onClose={() => { setShowModal(false); setForm(FORM_EMPTY); }}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input
                required
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className={INPUT}
                placeholder="Ex: Aluguel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaContas })}
                className={INPUT}
              >
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input
                  required
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className={INPUT}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento (dia)</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={31}
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                  className={INPUT}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Parcelas <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  value={form.parcelaAtual}
                  onChange={(e) => setForm({ ...form, parcelaAtual: e.target.value })}
                  className={INPUT}
                  placeholder="Parcela atual"
                />
                <input
                  type="number"
                  min={1}
                  value={form.totalParcelas}
                  onChange={(e) => setForm({ ...form, totalParcelas: e.target.value })}
                  className={INPUT}
                  placeholder="Total parcelas"
                />
              </div>
              {form.parcelaAtual && form.totalParcelas && (
                <p className="text-xs text-slate-400 mt-1">
                  Parcela {form.parcelaAtual} de {form.totalParcelas}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); setForm(FORM_EMPTY); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
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
