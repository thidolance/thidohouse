'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, TrendingUp } from '../ui/Icons';
import {
  getEntradas,
  addEntrada,
  deleteEntrada,
  getEntradasHistorico,
  getDistribuicao,
  saveDistribuicao,
} from '@/lib/firestore';
import type { Entrada, Distribuicao } from '@/lib/types';

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRL(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DIST_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399'];
const DIST_LABELS = [
  { key: 'contas', label: 'Contas', color: '#6366f1' },
  { key: 'ferias', label: 'Férias', color: '#22d3ee' },
  { key: 'investimento', label: 'Investimento', color: '#a78bfa' },
  { key: 'planosFuturos', label: 'Planos Futuros', color: '#34d399' },
] as const;

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props { mes: number; ano: number; }

export default function TabEntradas({ mes, ano }: Props) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [historico, setHistorico] = useState<{ mes: string; total: number }[]>([]);
  const [distribuicao, setDistribuicao] = useState<Distribuicao>({
    mes, ano, contas: 50, ferias: 10, investimento: 20, planosFuturos: 20,
  });

  const [showModal, setShowModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', data: '' });
  const [distForm, setDistForm] = useState({ contas: 50, ferias: 10, investimento: 20, planosFuturos: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    const [list, hist, dist] = await Promise.all([
      getEntradas(mes, ano),
      getEntradasHistorico(),
      getDistribuicao(mes, ano),
    ]);
    setEntradas(list);

    const byMonth: Record<string, number> = {};
    hist.forEach((e) => {
      const key = `${String(e.mes).padStart(2, '0')}/${e.ano}`;
      byMonth[key] = (byMonth[key] ?? 0) + e.valor;
    });
    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, total]) => {
        const [m] = k.split('/');
        return { mes: MESES_CURTOS[parseInt(m, 10) - 1], total };
      });
    setHistorico(sorted);

    if (dist) {
      setDistribuicao(dist);
      setDistForm({ contas: dist.contas, ferias: dist.ferias, investimento: dist.investimento, planosFuturos: dist.planosFuturos });
    } else {
      const defaultDist = { mes, ano, contas: 50, ferias: 10, investimento: 20, planosFuturos: 20 };
      setDistribuicao(defaultDist);
      setDistForm({ contas: 50, ferias: 10, investimento: 20, planosFuturos: 20 });
    }
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);

  const totalMes = entradas.reduce((s, e) => s + e.valor, 0);

  async function handleAddEntrada(e: React.SubmitEvent) {
    e.preventDefault();
    const [y, m] = form.data.split('-').map(Number);
    await addEntrada({
      descricao: form.descricao,
      valor: parseBRL(form.valor),
      data: form.data,
      mes: m,
      ano: y,
    });
    setForm({ descricao: '', valor: '', data: '' });
    setShowModal(false);
    load();
  }

  async function handleDelete(id: string) {
    await deleteEntrada(id);
    load();
  }

  async function handleSaveDistribuicao(e: React.SubmitEvent) {
    e.preventDefault();
    const soma = distForm.contas + distForm.ferias + distForm.investimento + distForm.planosFuturos;
    if (soma !== 100) return alert('Os percentuais devem somar 100%');
    await saveDistribuicao({ ...distForm, mes, ano }, distribuicao.id);
    setShowDistModal(false);
    load();
  }

  const distPieData = DIST_LABELS.map(({ key, label, color }, i) => ({
    name: label,
    value: distribuicao[key],
    valor: totalMes * (distribuicao[key] / 100),
    fill: color ?? DIST_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus /> Nova Entrada
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <p className="text-indigo-100 text-sm">Total do Mês</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalMes)}</p>
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Entradas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{entradas.length}</p>
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Média por Entrada</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {entradas.length > 0 ? fmt(totalMes / entradas.length) : 'R$ 0,00'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp />
            <h3 className="font-semibold text-slate-700">Histórico de Entradas</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={historico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Distribuição</h3>
            <button
              onClick={() => setShowDistModal(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Editar %
            </button>
          </div>
          {totalMes > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} ${value}%`} labelLine={false} />
                <Tooltip formatter={(v, name, entry) => {
                  const pct = Number(v);
                  const brl = (entry as { payload?: { valor?: number } })?.payload?.valor ?? totalMes * pct / 100;
                  return [`${pct}% · ${fmt(brl)}`, String(name)];
                }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              Adicione entradas para ver a distribuição
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DIST_LABELS.map(({ label, color, key }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-600">{label}: {distribuicao[key]}%</span>
                {totalMes > 0 && (
                  <span className="text-xs text-slate-400 ml-auto">{fmt(totalMes * distribuicao[key] / 100)}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-4">Entradas do Mês</h3>
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : entradas.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhuma entrada neste mês</p>
        ) : (
          <div className="space-y-2">
            {entradas.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{e.descricao}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-indigo-600">{fmt(e.valor)}</span>
                  <button
                    onClick={() => handleDelete(e.id!)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Nova Entrada */}
      {showModal && (
        <Modal title="Nova Entrada" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAddEntrada} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input
                required
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ex: Salário"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input
                required
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: formatBRL(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <input
                required
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
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

      {/* Modal Distribuição */}
      {showDistModal && (
        <Modal title="Editar Distribuição" onClose={() => setShowDistModal(false)}>
          <form onSubmit={handleSaveDistribuicao} className="space-y-4">
            <p className="text-xs text-slate-500">Os percentuais devem somar 100%</p>
            {DIST_LABELS.map(({ key, label, color }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
                  {label} (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={distForm[key]}
                  onChange={(e) => setDistForm({ ...distForm, [key]: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            ))}
            <p className={`text-xs font-medium ${distForm.contas + distForm.ferias + distForm.investimento + distForm.planosFuturos === 100 ? 'text-green-500' : 'text-red-500'}`}>
              Soma: {distForm.contas + distForm.ferias + distForm.investimento + distForm.planosFuturos}%
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDistModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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
