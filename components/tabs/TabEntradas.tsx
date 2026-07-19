'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil, TrendingUp } from '../ui/Icons';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import {
  getEntradas, addEntrada, updateEntrada, deleteEntrada,
  getEntradasHistorico, getDistribuicao, saveDistribuicao,
} from '@/lib/firestore';
import type { Entrada, Distribuicao } from '@/lib/types';

const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 dark:bg-zinc-800 rounded-xl h-full w-full" /> },
);

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRL(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
}

function toInt(value: string): number {
  return parseInt(value) || 0;
}

function GearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type DistKey = 'contas' | 'ferias' | 'investimento' | 'planosFuturos';
type DistColors = Record<DistKey, string>;

const DEFAULT_DIST_COLORS: DistColors = {
  contas: '#6366f1',
  ferias: '#22d3ee',
  investimento: '#a78bfa',
  planosFuturos: '#34d399',
};

const DIST_LABELS: { key: DistKey; label: string }[] = [
  { key: 'contas',        label: 'Contas' },
  { key: 'ferias',        label: 'Férias' },
  { key: 'investimento',  label: 'Investimento' },
  { key: 'planosFuturos', label: 'Planos Futuros' },
];

const LS_COLORS_KEY = 'thidohouse-dist-colors';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const INPUT = 'w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-purple-500';

interface Props { mes: number; ano: number; }

export default function TabEntradas({ mes, ano }: Props) {
  const [entradas, setEntradas]   = useState<Entrada[]>([]);
  const [historico, setHistorico] = useState<{ mes: string; total: number; fill: string }[]>([]);
  const [distribuicao, setDistribuicao] = useState<Distribuicao>({
    mes, ano, contas: 50, ferias: 10, investimento: 20, planosFuturos: 20,
  });
  const [showModal, setShowModal]       = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState({ descricao: '', valor: '', data: '' });
  const [distForm, setDistForm]         = useState<Record<DistKey, string>>({ contas: '50', ferias: '10', investimento: '20', planosFuturos: '20' });
  const [distColors, setDistColors]     = useState<DistColors>(DEFAULT_DIST_COLORS);
  const [distColorForm, setDistColorForm] = useState<DistColors>(DEFAULT_DIST_COLORS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLORS_KEY);
      if (stored) { const c = JSON.parse(stored) as DistColors; setDistColors(c); setDistColorForm(c); }
    } catch { /* noop */ }
  }, []);

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
      const key = `${String(e.ano).padStart(4,'0')}${String(e.mes).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + e.valor;
    });
    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, total], i, arr) => ({
        mes: MESES_CURTOS[parseInt(k.slice(4), 10) - 1],
        total,
        fill: i === arr.length - 1 ? '#6366f1' : '#a5b4fc',
      }));
    setHistorico(sorted);

    if (dist) {
      setDistribuicao(dist);
      setDistForm({ contas: String(dist.contas), ferias: String(dist.ferias), investimento: String(dist.investimento), planosFuturos: String(dist.planosFuturos) });
    } else {
      const d = { mes, ano, contas: 50, ferias: 10, investimento: 20, planosFuturos: 20 };
      setDistribuicao(d);
      setDistForm({ contas: '50', ferias: '10', investimento: '20', planosFuturos: '20' });
    }
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  const totalMes = entradas.reduce((s, e) => s + e.valor, 0);

  // ── handlers ─────────────────────────────────────────────────────────────

  async function handleSaveEntrada(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m] = form.data.split('-').map(Number);
    const data = { descricao: form.descricao, valor: parseBRL(form.valor), data: form.data, mes: m, ano: y };
    if (editId) await updateEntrada(editId, data);
    else        await addEntrada(data);
    setForm({ descricao: '', valor: '', data: '' });
    setEditId(null);
    setShowModal(false);
    load();
  }

  function handleEdit(e: Entrada) {
    setEditId(e.id!);
    setForm({ descricao: e.descricao, valor: e.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), data: e.data });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    await deleteEntrada(id);
    load();
  }

  async function handleSaveDistribuicao(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = {
      contas: toInt(distForm.contas),
      ferias: toInt(distForm.ferias),
      investimento: toInt(distForm.investimento),
      planosFuturos: toInt(distForm.planosFuturos),
    };
    const soma = parsed.contas + parsed.ferias + parsed.investimento + parsed.planosFuturos;
    if (soma !== 100) return alert('Os percentuais devem somar 100%');
    await saveDistribuicao({ ...parsed, mes, ano }, distribuicao.id);
    setDistColors(distColorForm);
    localStorage.setItem(LS_COLORS_KEY, JSON.stringify(distColorForm));
    setShowDistModal(false);
    load();
  }

  // ── dados derivados ───────────────────────────────────────────────────────

  const distPieData = DIST_LABELS.map(({ key, label }) => ({
    name: label,
    value: distribuicao[key],
    valor: totalMes * (distribuicao[key] / 100),
    fill: distColors[key],
  }));

  const distSoma = toInt(distForm.contas) + toInt(distForm.ferias) + toInt(distForm.investimento) + toInt(distForm.planosFuturos);

  // ── specs VChart ──────────────────────────────────────────────────────────

  const historicoSpec = useMemo(() => ({
    type: 'bar',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'hist', values: historico }],
    xField: 'mes',
    yField: 'total',
    bar: {
      style: {
        cornerRadius: [6, 6, 0, 0],
        fill: (d: Record<string, unknown>) => String(d['fill']),
      },
    },
    axes: [
      { orient: 'bottom', domainLine: { visible: false }, tick: { visible: false }, label: { style: { fontSize: 11, fill: '#94a3b8' } } },
      {
        orient: 'left',
        grid: { style: { stroke: 'rgba(113,113,122,0.2)', lineDash: [3, 3] } },
        domainLine: { visible: false },
        tick: { visible: false },
        label: {
          style: { fontSize: 10, fill: '#94a3b8' },
          formatMethod: (v: number) => v === 0 ? 'R$0' : `R$${(v / 1000).toFixed(0)}k`,
        },
      },
    ],
    tooltip: {
      mark: {
        title: { visible: false },
        content: [{ key: (d: Record<string, unknown>) => String(d['mes']), value: (d: Record<string, unknown>) => fmt(Number(d['total'])) }],
      },
    },
  }), [historico]);

  const distSpec = useMemo(() => ({  // eslint-disable-line react-hooks/exhaustive-deps
    type: 'pie',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'dist', values: distPieData }],
    valueField: 'value',
    categoryField: 'name',
    outerRadius: 0.75,
    innerRadius: 0.52,
    padAngle: 0.8,
    color: distPieData.map((d) => d.fill),
    pie: { style: { cornerRadius: 4 } },
    label: { visible: false },
    legends: [{
      visible: true,
      orient: 'bottom',
      padding: { top: 8 },
      maxRow: 2,
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
          value: (d: Record<string, unknown>) => `${d['value']}% · ${fmt(Number(d['valor']))}`,
        }],
      },
    },
  }), [distPieData, distColors]);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Entradas</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-400">{entradas.length} entrada(s) · {fmt(totalMes)}</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ descricao: '', valor: '', data: '' }); setShowModal(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-sm">
          <Plus /><span className="hidden sm:inline">Nova Entrada</span>
        </button>
      </div>

      {/* ── Card resumo ── */}
      <div className="bg-gradient-to-br from-indigo-600 dark:from-purple-600 to-violet-700 rounded-2xl px-4 py-3 text-white shadow-lg shadow-indigo-200 dark:shadow-purple-500/20">
        <p className="text-indigo-100 dark:text-purple-100 text-xs font-medium uppercase tracking-wide">Total do Mês</p>
        <p className="text-2xl font-bold mt-0.5 tabular-nums">{fmt(totalMes)}</p>
        <p className="text-indigo-100 dark:text-purple-100 text-[11px] mt-1">{entradas.length} entrada(s)</p>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp />
            <p className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">Histórico (12 meses)</p>
          </div>
          {historico.length > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`hist-${historico.length}-${historico.at(-1)?.total?.toFixed(0) ?? 0}`} spec={historicoSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 dark:text-zinc-400 gap-2">
              <span className="text-3xl">📈</span>
              <p className="text-sm">Sem histórico ainda</p>
            </div>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">Distribuição</p>
            <button onClick={() => { setDistColorForm(distColors); setShowDistModal(true); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors">
              <GearIcon /> Editar %
            </button>
          </div>
          {totalMes > 0 ? (
            <div style={{ height: 220 }}>
              <VChart key={`dist-${totalMes.toFixed(0)}-${Object.values(distColors).join('')}`} spec={distSpec as any} />
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 dark:text-zinc-400 gap-2">
              <span className="text-3xl">🥧</span>
              <p className="text-sm">Adicione entradas para ver a distribuição</p>
            </div>
          )}
          {/* Legenda com valores */}
          {totalMes > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {DIST_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: distColors[key] }} />
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{label} {distribuicao[key]}%</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200 tabular-nums flex-shrink-0">{fmt(totalMes * distribuicao[key] / 100)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Lista de entradas ── */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">Entradas do Mês</p>
          {entradas.length > 0 && <span className="text-xs text-slate-400 dark:text-zinc-400">{entradas.length} item(s)</span>}
        </div>
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-400 dark:text-zinc-400">
            <div className="w-5 h-5 border-2 border-slate-200 dark:border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : entradas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl mb-2">📥</p>
            <p className="text-slate-400 dark:text-zinc-400 text-sm">Nenhuma entrada neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-zinc-800">
            {entradas.map((e) => (
              <div key={e.id} className="group flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-zinc-100 text-sm leading-tight">{e.descricao}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5">
                      {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-600 dark:text-purple-400 tabular-nums">{fmt(e.valor)}</span>
                  <button onClick={() => handleEdit(e)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-purple-400 hover:bg-indigo-50 dark:hover:bg-purple-500/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <Pencil />
                  </button>
                  <button onClick={() => handleDelete(e.id!)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-zinc-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <Trash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Modal Nova/Editar Entrada ── */}
      {showModal && (
        <Modal title={editId ? 'Editar Entrada' : 'Nova Entrada'} onClose={() => { setShowModal(false); setEditId(null); }}>
          <form onSubmit={handleSaveEntrada} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Descrição</label>
              <input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={INPUT} placeholder="Ex: Salário" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Valor (R$)</label>
              <input required value={form.valor} onChange={(e) => setForm({ ...form, valor: formatBRL(e.target.value) })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Data</label>
              <input required type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={INPUT} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-purple-700 shadow-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal Distribuição ── */}
      {showDistModal && (
        <Modal title="Editar Distribuição" onClose={() => setShowDistModal(false)}>
          <form onSubmit={handleSaveDistribuicao} className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 rounded-lg p-2">Os percentuais devem somar exatamente 100%.</p>
            {DIST_LABELS.map(({ key, label }) => (
              <div key={key}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">
                  <input
                    type="color"
                    value={distColorForm[key]}
                    onChange={(e) => setDistColorForm({ ...distColorForm, [key]: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer p-0.5 bg-white dark:bg-zinc-900 flex-shrink-0"
                  />
                  {label} (%)
                </label>
                <input type="number" min={0} max={100}
                  value={distForm[key]}
                  onChange={(e) => setDistForm({ ...distForm, [key]: e.target.value })}
                  className={INPUT} />
              </div>
            ))}
            <div className={`flex items-center justify-between text-sm p-2 rounded-lg ${distSoma === 100 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
              <span className="font-medium">Soma:</span>
              <span className="font-bold">{distSoma}%</span>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowDistModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-purple-700 shadow-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
