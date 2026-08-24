'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import DatePicker from '../ui/DatePicker';
import { Plus, Trash, Pencil, TrendingUp } from '../ui/Icons';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import {
  getEntradas, addEntrada, updateEntrada, deleteEntrada,
  getEntradasHistorico, getDistribuicao, saveDistribuicao,
  getDistribuicoesHistorico,
  getSaquesReserva, getSaquesReservaHistorico, addSaqueReserva, deleteSaqueReserva,
} from '@/lib/firestore';
import { formatCurrencyInput as formatBRL, parseCurrencyInput as parseBRL, formatCurrencyBRL } from '@/lib/currency';
import type { Entrada, Distribuicao, SaqueReserva } from '@/lib/types';

const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 dark:bg-zinc-800 rounded-xl h-full w-full" /> },
);

// ── helpers ───────────────────────────────────────────────────────────────────

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

type ReservaKey = Exclude<DistKey, 'contas'>;
const RESERVA_LABELS: { key: ReservaKey; label: string }[] = [
  { key: 'investimento',  label: 'Investimento' },
  { key: 'ferias',        label: 'Férias' },
  { key: 'planosFuturos', label: 'Planos Futuros' },
];

export default function TabEntradas({ mes, ano }: Props) {
  const [entradas, setEntradas]   = useState<Entrada[]>([]);
  const [historico, setHistorico] = useState<{ mes: string; total: number; fill: string }[]>([]);
  // Balanço acumulado do que foi guardado (investimento/férias/planos), all-time.
  const [balanco, setBalanco] = useState<{
    invest: number; ferias: number; planos: number; total: number; contribMes: number; deltaPct: number;
  }>({ invest: 0, ferias: 0, planos: 0, total: 0, contribMes: 0, deltaPct: 0 });
  const [distribuicao, setDistribuicao] = useState<Distribuicao>({
    mes, ano, contas: 50, ferias: 10, investimento: 20, planosFuturos: 20,
  });
  const [saquesMes, setSaquesMes]       = useState<SaqueReserva[]>([]);
  const [showModal, setShowModal]       = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [showSaqueModal, setShowSaqueModal] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState({ descricao: '', valor: '', data: '' });
  // `restante` = reserva de onde tirar o excedente quando o valor estoura a reserva principal.
  const [saqueForm, setSaqueForm]       = useState<{ categoria: ReservaKey; valor: string; descricao: string; restante: ReservaKey | null }>({ categoria: 'planosFuturos', valor: '', descricao: '', restante: null });
  // Ids do saque em edição (principal + restante, se houver). Ignorados no cálculo
  // do disponível para não contarem contra o próprio limite.
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
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
    const [list, hist, dist, distHist, saquesDoMes, saquesHist] = await Promise.all([
      getEntradas(mes, ano),
      getEntradasHistorico(),
      getDistribuicao(mes, ano),
      getDistribuicoesHistorico(),
      getSaquesReserva(mes, ano),
      getSaquesReservaHistorico(),
    ]);
    setEntradas(list);
    setSaquesMes(saquesDoMes);

    // ── Balanço do que foi guardado (acumulado nos últimos 12 meses até o mês
    // selecionado) — mesma janela do "Investimentos por categoria" da Visão Geral. ──
    const distByKey = new Map(distHist.map((d) => [`${d.ano}-${d.mes}`, d]));
    const ganhosByKey: Record<string, number> = {};
    hist.forEach((e) => {
      const k = `${e.ano}-${e.mes}`;
      ganhosByKey[k] = (ganhosByKey[k] ?? 0) + e.valor;
    });
    // Saques (retiradas manuais de reserva) somados por mês/categoria — abatem o
    // que foi guardado naquele mês, como se fosse uma contribuição negativa.
    const saquesByKey: Record<string, Record<ReservaKey, number>> = {};
    saquesHist.forEach((s) => {
      const k = `${s.ano}-${s.mes}`;
      const atual = saquesByKey[k] ?? { ferias: 0, investimento: 0, planosFuturos: 0 };
      atual[s.categoria] += s.valor;
      saquesByKey[k] = atual;
    });
    // Janela rolante de 12 meses terminando em (mes, ano).
    const janela: string[] = [];
    let jm = mes, ja = ano;
    for (let i = 0; i < 12; i++) {
      janela.unshift(`${ja}-${jm}`);
      jm--; if (jm === 0) { jm = 12; ja--; }
    }
    let accInvest = 0, accFerias = 0, accPlanos = 0;
    janela.forEach((k) => {
      const d = distByKey.get(k);
      const g = ganhosByKey[k];
      const s = saquesByKey[k];
      if (d && g) {
        accInvest += g * (d.investimento / 100);
        accFerias += g * (d.ferias / 100);
        accPlanos += g * (d.planosFuturos / 100);
      }
      if (s) {
        accInvest -= s.investimento;
        accFerias -= s.ferias;
        accPlanos -= s.planosFuturos;
      }
    });
    const totalAcc = accInvest + accFerias + accPlanos;

    const kAtual = `${ano}-${mes}`;
    const gAtual = ganhosByKey[kAtual] ?? 0;
    const dAtual = distByKey.get(kAtual);
    const sAtual = saquesByKey[kAtual];
    const saquesMesTotal = sAtual ? sAtual.investimento + sAtual.ferias + sAtual.planosFuturos : 0;
    const contribMes = (dAtual
      ? gAtual * ((dAtual.investimento + dAtual.ferias + dAtual.planosFuturos) / 100)
      : 0) - saquesMesTotal;
    const priorTotal = totalAcc - contribMes;
    const deltaPct = priorTotal > 0 ? (contribMes / priorTotal) * 100 : 0;
    setBalanco({ invest: accInvest, ferias: accFerias, planos: accPlanos, total: totalAcc, contribMes, deltaPct });

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
    setForm({ descricao: e.descricao, valor: formatCurrencyBRL(e.valor), data: e.data });
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

  const editandoSaque = editGroupIds.length > 0;

  function abrirSaque() {
    setSaqueForm({ categoria: 'planosFuturos', valor: '', descricao: '', restante: null });
    setEditGroupIds([]);
    setShowSaqueModal(true);
  }

  // Membros do grupo de um saque (principal + restante). Saques antigos sem
  // grupoId são tratados isoladamente.
  function membrosGrupo(s: SaqueReserva): SaqueReserva[] {
    if (!s.grupoId) return [s];
    return saquesMes.filter((x) => x.grupoId === s.grupoId);
  }

  function handleEditSaque(s: SaqueReserva) {
    const grupo = membrosGrupo(s);
    const principal = grupo.find((x) => !x.restante) ?? grupo[0];
    const restante = grupo.find((x) => x.restante);
    const total = grupo.reduce((acc, x) => acc + x.valor, 0);
    setSaqueForm({
      categoria: principal.categoria,
      valor: formatCurrencyBRL(total),
      descricao: principal.descricao ?? '',
      restante: restante?.categoria ?? null,
    });
    setEditGroupIds(grupo.map((x) => x.id!));
    setShowSaqueModal(true);
  }

  // Disponível na reserva NESTE mês: o que foi alocado no mês (entradas do mês ×
  // % da distribuição) menos os saques já feitos no mês naquela reserva. Os saques
  // do grupo em edição são ignorados (não contam contra o próprio limite).
  function dispCategoria(cat: ReservaKey): number {
    const alocado = totalMes * ((distribuicao[cat] ?? 0) / 100);
    const jaSacado = saquesMes
      .filter((s) => s.categoria === cat && !editGroupIds.includes(s.id!))
      .reduce((acc, s) => acc + s.valor, 0);
    return alocado - jaSacado;
  }

  async function handleSaveSaque(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const total = parseBRL(saqueForm.valor);
    if (total <= 0) return;
    const { categoria, descricao } = saqueForm;
    const disp = dispCategoria(categoria);
    const maxPrincipal = Math.max(disp, 0);
    const precisaRestante = total > disp + 0.005;
    const labelPrincipal = RESERVA_LABELS.find((r) => r.key === categoria)?.label ?? '';

    // Reserva de onde tirar o excedente (a escolhida, ou a primeira outra por padrão).
    const restanteCat: ReservaKey | null = precisaRestante
      ? (saqueForm.restante && saqueForm.restante !== categoria
          ? saqueForm.restante
          : RESERVA_LABELS.find((r) => r.key !== categoria)!.key)
      : null;

    // Idempotente: apaga o grupo atual (se editando) e regrava do zero.
    await Promise.all(editGroupIds.map((id) => deleteSaqueReserva(id)));

    if (!precisaRestante) {
      await addSaqueReserva({ categoria, valor: total, ...(descricao ? { descricao } : {}), mes, ano });
    } else if (maxPrincipal <= 0.005) {
      // Reserva principal vazia no mês → tudo vem da outra reserva.
      await addSaqueReserva({ categoria: restanteCat!, valor: total, ...(descricao ? { descricao } : {}), mes, ano });
    } else {
      const grupoId = crypto.randomUUID();
      await addSaqueReserva({ categoria, valor: maxPrincipal, ...(descricao ? { descricao } : {}), mes, ano, grupoId });
      await addSaqueReserva({
        categoria: restanteCat!,
        valor: total - maxPrincipal,
        descricao: descricao ? `${descricao} (restante de ${labelPrincipal})` : `Restante de ${labelPrincipal}`,
        mes, ano, grupoId, restante: true,
      });
    }
    setShowSaqueModal(false);
    load();
  }

  async function handleDeleteSaque(s: SaqueReserva) {
    await Promise.all(membrosGrupo(s).map((x) => deleteSaqueReserva(x.id!)));
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

      {/* ── Balanço de investimentos / reservas (acumulado 12m) ── */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Investimentos &amp; Reservas</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Com base na distribuição · acumulado dos últimos 12 meses</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={abrirSaque}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors">
              <span className="font-bold leading-none">−</span> Saque
            </button>
            <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-purple-400 flex-shrink-0">
              <TrendingUp />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-4">
          <span className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white tabular-nums">{fmt(balanco.total)}</span>
          {balanco.contribMes !== 0 && (
            <span className={`mb-1 text-sm font-semibold ${balanco.contribMes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {balanco.contribMes > 0 ? '+' : '-'}{fmt(Math.abs(balanco.contribMes))}
              {balanco.contribMes > 0 && balanco.deltaPct > 0 && <span className="ml-1 text-emerald-500/80">(+{balanco.deltaPct.toFixed(1)}%)</span>}
              <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">este mês</span>
            </span>
          )}
        </div>

        <div className="border-b border-slate-100 dark:border-zinc-800 mb-4" />

        {balanco.total > 0 ? (
          (() => {
            const itens = ([
              { key: 'investimento' as const, label: 'Investimento', value: balanco.invest },
              { key: 'ferias' as const,        label: 'Férias',       value: balanco.ferias },
              { key: 'planosFuturos' as const, label: 'Planos',       value: balanco.planos },
            ]).filter((b) => b.value > 0);
            return (
              <div className="space-y-3">
                {/* Barra segmentada proporcional */}
                <div className="flex items-stretch gap-1 w-full h-2.5">
                  {itens.map((b) => (
                    <div key={b.key} className="rounded-sm transition-all" style={{ width: `${(b.value / balanco.total) * 100}%`, backgroundColor: distColors[b.key] }} />
                  ))}
                </div>
                {/* Legenda com valores — largura fixa, sem sobreposição */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {itens.map((b) => (
                    <div key={b.key} className="flex flex-col min-w-0">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: distColors[b.key] }} />
                        <span className="truncate">{b.label} · {((b.value / balanco.total) * 100).toFixed(0)}%</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-white tabular-nums">{fmt(b.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          <p className="text-sm text-slate-400 dark:text-zinc-400 py-2 text-center">
            Configure a distribuição e adicione entradas para acompanhar o crescimento.
          </p>
        )}

        {/* ── Saques deste mês ── */}
        {saquesMes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Saques deste mês</p>
            {saquesMes.filter((s) => !s.restante).map((principal) => {
              const restante = principal.grupoId
                ? saquesMes.find((x) => x.restante && x.grupoId === principal.grupoId)
                : undefined;
              return (
                <div key={principal.id} className="group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: distColors[principal.categoria] }} />
                      <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        {RESERVA_LABELS.find((r) => r.key === principal.categoria)?.label}{principal.descricao ? ` · ${principal.descricao}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-semibold text-red-500 dark:text-red-400 tabular-nums">-{fmt(principal.valor)}</span>
                      <button onClick={() => handleEditSaque(principal)}
                        className="p-1 rounded-lg text-slate-300 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-purple-400 hover:bg-indigo-50 dark:hover:bg-purple-500/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <Pencil />
                      </button>
                      <button onClick={() => handleDeleteSaque(principal)}
                        className="p-1 rounded-lg text-slate-300 dark:text-zinc-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <Trash />
                      </button>
                    </div>
                  </div>
                  {restante && (
                    <div className="flex items-center justify-between gap-2 mt-1 pl-3 ml-0.5 border-l border-slate-200 dark:border-zinc-700">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-slate-300 dark:text-zinc-600">↳</span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: distColors[restante.categoria] }} />
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                          restante em {RESERVA_LABELS.find((r) => r.key === restante.categoria)?.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-red-400 dark:text-red-400/80 tabular-nums flex-shrink-0">-{fmt(restante.valor)}</span>
                    </div>
                  )}
                </div>
              );
            })}
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
              <DatePicker required value={form.data} onChange={(v) => setForm({ ...form, data: v })} className={INPUT} />
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

      {/* ── Modal Saque de Reserva (novo / editar) ── */}
      {showSaqueModal && (() => {
        const dispSel = dispCategoria(saqueForm.categoria);
        const valorNum = parseBRL(saqueForm.valor);
        const maxPrincipal = Math.max(dispSel, 0);
        const estoura = valorNum > dispSel + 0.005;
        const falta = valorNum - maxPrincipal;
        // Restante efetivo (default = primeira outra reserva) quando estoura.
        const restanteCat = saqueForm.restante && saqueForm.restante !== saqueForm.categoria
          ? saqueForm.restante
          : RESERVA_LABELS.find((r) => r.key !== saqueForm.categoria)!.key;
        return (
        <Modal title={editandoSaque ? 'Editar Saque' : 'Registrar Saque'} onClose={() => setShowSaqueModal(false)}>
          <form onSubmit={handleSaveSaque} className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 rounded-lg p-2">
              Use quando retirar dinheiro de uma reserva (ex: usou parte dos Planos Futuros). O valor é abatido do que foi guardado nesta reserva neste mês.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">Reserva</label>
              <div className="flex flex-wrap gap-2">
                {RESERVA_LABELS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSaqueForm({ ...saqueForm, categoria: key, restante: saqueForm.restante === key ? null : saqueForm.restante })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                    style={saqueForm.categoria === key
                      ? { backgroundColor: distColors[key], color: '#fff', borderColor: distColors[key] }
                      : { borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Valor (R$)</label>
              <input required value={saqueForm.valor} onChange={(e) => setSaqueForm({ ...saqueForm, valor: formatBRL(e.target.value) })} className={INPUT} placeholder="0,00" inputMode="decimal" />
              <p className={`mt-1.5 text-xs ${estoura ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-zinc-500'}`}>
                {estoura
                  ? `Disponível nesta reserva: ${fmt(maxPrincipal)} — faltam ${fmt(falta)}`
                  : `Disponível nesta reserva: ${fmt(maxPrincipal)}`}
              </p>
            </div>

            {/* Transbordo: de qual reserva tirar o que faltar */}
            {estoura && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {maxPrincipal > 0
                    ? <>Saem {fmt(maxPrincipal)} de <span className="font-semibold">{RESERVA_LABELS.find((r) => r.key === saqueForm.categoria)?.label}</span> e os {fmt(falta)} restantes de:</>
                    : <>Esta reserva não tem saldo no mês. Tirar os {fmt(falta)} de:</>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {RESERVA_LABELS.filter((r) => r.key !== saqueForm.categoria).map(({ key, label }) => {
                    const saldo = Math.max(dispCategoria(key), 0);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSaqueForm({ ...saqueForm, restante: key })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                        style={restanteCat === key
                          ? { backgroundColor: distColors[key], color: '#fff', borderColor: distColors[key] }
                          : { borderColor: '#e2e8f0', color: '#64748b' }}
                      >
                        {label} · {fmt(saldo)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1">Descrição (opcional)</label>
              <input value={saqueForm.descricao} onChange={(e) => setSaqueForm({ ...saqueForm, descricao: e.target.value })} className={INPUT} placeholder="Ex: conserto do carro" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowSaqueModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 shadow-sm">
                {editandoSaque ? 'Salvar' : 'Registrar Saque'}
              </button>
            </div>
          </form>
        </Modal>
        );
      })()}
    </div>
  );
}
