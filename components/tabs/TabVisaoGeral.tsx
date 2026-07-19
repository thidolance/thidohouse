'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Card from '../ui/Card';
import TabAssistente from './TabAssistente';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import {
  getEntradasHistorico,
  getContasHistorico,
  getDistribuicoesHistorico,
  getComprasHistorico,
  getCustosEmpresaHistorico,
  getCategoriasContas,
  getFaturasCartaoHistorico,
} from '@/lib/firestore';
import type { CategoriaContaConfig, CompraParcelada, FaturaCartao } from '@/lib/types';

// Gasto de cartões no mês considerando o valorAjustado da fatura (ex: imposto/itens
// não lançados): por cartão usa o ajuste se houver, senão a soma das compras.
function gastoCartoesDoMes(compras: CompraParcelada[], faturas: FaturaCartao[], m: number, a: number): number {
  const somaPorCartao = new Map<string, number>();
  compras
    .filter((c) => c.mes === m && c.ano === a)
    .forEach((c) => somaPorCartao.set(c.cartaoId, (somaPorCartao.get(c.cartaoId) ?? 0) + c.valorParcela));

  let total = 0;
  somaPorCartao.forEach((soma, cartaoId) => {
    const fatura = faturas.find((f) => f.cartaoId === cartaoId && f.mes === m && f.ano === a);
    total += fatura?.valorAjustado != null ? fatura.valorAjustado : soma;
  });
  return total;
}

const VChart = dynamic(
  () => import('@visactor/react-vchart').then((m) => m.VChart),
  { ssr: false, loading: () => <div className="animate-pulse bg-zinc-800 rounded-xl h-full w-full" /> },
);

interface MesDashboard {
  label: string;
  mesAno: string;
  ganhos: number;
  gastos: number;
  saldo: number;
  ferias: number;
  investimento: number;
  planosFuturos: number;
  isAtual: boolean;
}

interface CatGasto { nome: string; total: number; fill: string; }

interface Props { mes: number; ano: number; onNavigate: (tab: 'entradas' | 'contas') => void; }

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLast12Months(mesAtual: number, anoAtual: number) {
  const result: { mes: number; ano: number; label: string; mesAno: string }[] = [];
  let m = mesAtual;
  let a = anoAtual;
  for (let i = 0; i < 12; i++) {
    result.unshift({ mes: m, ano: a, label: `${MESES_CURTOS[m - 1]}/${String(a).slice(2)}`, mesAno: `${String(m).padStart(2, '0')}/${a}` });
    m--;
    if (m === 0) { m = 12; a--; }
  }
  return result;
}

const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`;

const AXIS_BOTTOM = {
  orient: 'bottom',
  domainLine: { visible: false },
  tick: { visible: false },
  label: { style: { fontSize: 11, fill: '#94a3b8' } },
};

const AXIS_LEFT = (formatMethod: (v: number) => string) => ({
  orient: 'left',
  grid: { style: { stroke: '#27272a', lineDash: [3, 3] } },
  domainLine: { visible: false },
  tick: { visible: false },
  label: { style: { fontSize: 11, fill: '#94a3b8' }, formatMethod },
});

export default function TabVisaoGeral({ mes, ano, onNavigate }: Props) {
  const [dados, setDados]               = useState<MesDashboard[]>([]);
  const [gastosPorCat, setGastosPorCat] = useState<CatGasto[]>([]);
  const [gastosPorTipo, setGastosPorTipo] = useState<CatGasto[]>([]);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [entradas, contas, distribuicoes, compras, custosEmpresa, catContas, faturas] = await Promise.all([
      getEntradasHistorico(),
      getContasHistorico(),
      getDistribuicoesHistorico(),
      getComprasHistorico(),
      getCustosEmpresaHistorico(),
      getCategoriasContas() as Promise<CategoriaContaConfig[]>,
      getFaturasCartaoHistorico(),
    ]);

    const meses = getLast12Months(mes, ano);

    const result: MesDashboard[] = meses.map(({ mes: m, ano: a, label, mesAno }) => {
      const ganhos = entradas.filter((e) => e.mes === m && e.ano === a).reduce((s, e) => s + e.valor, 0);
      const gastoContas = contas.filter((c) => c.mes === m && c.ano === a).reduce((s, c) => s + c.valor, 0);
      const gastoCartoes = gastoCartoesDoMes(compras, faturas, m, a);
      const gastoEmpresa = custosEmpresa.filter((c) => c.mes === m && c.ano === a).reduce((s, c) => s + c.valorParcela, 0);
      const gastos = gastoContas + gastoCartoes + gastoEmpresa;
      const dist = distribuicoes.find((d) => d.mes === m && d.ano === a);
      const ferias = ganhos * (dist?.ferias ?? 0) / 100;
      const investimento = ganhos * (dist?.investimento ?? 0) / 100;
      const planosFuturos = ganhos * (dist?.planosFuturos ?? 0) / 100;
      const guardado = ferias + investimento + planosFuturos;
      return { label, mesAno, ganhos, gastos, saldo: ganhos - gastos - guardado, ferias, investimento, planosFuturos, isAtual: m === mes && a === ano };
    });

    // Gastos por categoria — mês atual
    const catMap = new Map<string, { total: number; fill: string }>();
    contas
      .filter((c) => c.mes === mes && c.ano === ano)
      .forEach((c) => {
        const cc = catContas.find((x) => x.nome === c.categoria);
        const prev = catMap.get(c.categoria) ?? { total: 0, fill: cc?.cor ?? '#94a3b8' };
        catMap.set(c.categoria, { total: prev.total + c.valor, fill: prev.fill });
      });
    const gastoCartoesAtual = gastoCartoesDoMes(compras, faturas, mes, ano);
    if (gastoCartoesAtual > 0) {
      catMap.set('Cartões', { total: gastoCartoesAtual, fill: '#ec4899' });
    }
    const gastoEmpresaAtual = custosEmpresa
      .filter((c) => c.mes === mes && c.ano === ano)
      .reduce((s, c) => s + c.valorParcela, 0);
    if (gastoEmpresaAtual > 0) {
      const prev = catMap.get('Empresa') ?? { total: 0, fill: '#38bdf8' };
      catMap.set('Empresa', { total: prev.total + gastoEmpresaAtual, fill: prev.fill });
    }
    const gpc: CatGasto[] = Array.from(catMap.entries())
      .map(([nome, { total, fill }]) => ({ nome, total, fill }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    // Gastos por tipo de conta — mês atual
    const contasAtual = contas.filter((c) => c.mes === mes && c.ano === ano);
    const gpt: CatGasto[] = [
      { nome: 'Contas Fixas',   total: contasAtual.filter((c) => c.fixa).reduce((s, c) => s + c.valor, 0),  fill: '#f59e0b' },
      { nome: 'Conta Rotativa', total: contasAtual.filter((c) => !c.fixa).reduce((s, c) => s + c.valor, 0), fill: '#6366f1' },
      { nome: 'Cartões',        total: gastoCartoesAtual, fill: '#ec4899' },
      { nome: 'Empresa',        total: gastoEmpresaAtual, fill: '#38bdf8' },
    ].filter((c) => c.total > 0);

    setDados(result);
    setGastosPorCat(gpc);
    setGastosPorTipo(gpt);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  const atual = dados.find((d) => d.isAtual);
  const totalGuardado = (atual?.ferias ?? 0) + (atual?.investimento ?? 0) + (atual?.planosFuturos ?? 0);
  const pctGuardado = atual?.ganhos ? (totalGuardado / atual.ganhos) * 100 : 0;
  const totalAcumulado = dados.reduce((s, d) => s + d.ferias + d.investimento + d.planosFuturos, 0);
  const feriasAcumulado = dados.reduce((s, d) => s + d.ferias, 0);
  const investimentoAcumulado = dados.reduce((s, d) => s + d.investimento, 0);
  const planosFuturosAcumulado = dados.reduce((s, d) => s + d.planosFuturos, 0);

  // ── specs VChart ──────────────────────────────────────────────────────────

  const evoSpec = useMemo(() => ({
    type: 'bar',
    autoFit: true,
    background: 'transparent',
    data: [{
      id: 'evo',
      values: dados.flatMap((d) => [
        { label: d.label, valor: d.ganhos, tipo: 'Ganhos', isAtual: d.isAtual },
        { label: d.label, valor: d.gastos, tipo: 'Gastos', isAtual: d.isAtual },
      ]),
    }],
    xField: ['label', 'tipo'],
    yField: 'valor',
    seriesField: 'tipo',
    color: ['#6366f1', '#f43f5e'],
    bar: {
      style: {
        cornerRadius: [4, 4, 0, 0],
        opacity: (d: Record<string, unknown>) => d['isAtual'] ? 1 : 0.65,
      },
    },
    axes: [AXIS_BOTTOM, AXIS_LEFT(fmtK)],
    legends: [{
      visible: true,
      orient: 'top',
      padding: { bottom: 8 },
      item: { label: { style: { fontSize: 11, fill: '#64748b' } } },
    }],
    tooltip: {
      mark: {
        title: { visible: false },
        content: [{ key: (d: Record<string, unknown>) => String(d['tipo']), value: (d: Record<string, unknown>) => fmt(Number(d['valor'])) }],
      },
    },
  }), [dados]);

  const catDonutSpec = useMemo(() => ({
    type: 'pie',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'cat', values: gastosPorCat }],
    valueField: 'total',
    categoryField: 'nome',
    outerRadius: 0.75,
    innerRadius: 0.52,
    padAngle: 0.8,
    color: gastosPorCat.map((d) => d.fill),
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
  }), [gastosPorCat]);

  const tipoDonutSpec = useMemo(() => ({
    type: 'pie',
    autoFit: true,
    background: 'transparent',
    data: [{ id: 'tipo', values: gastosPorTipo }],
    valueField: 'total',
    categoryField: 'nome',
    outerRadius: 0.75,
    innerRadius: 0.52,
    padAngle: 0.8,
    color: gastosPorTipo.map((d) => d.fill),
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
  }), [gastosPorTipo]);

  const guardadoSpec = useMemo(() => {
    const vals = dados.flatMap((d) => [
      { label: d.label, valor: d.ferias, tipo: 'Férias', isAtual: d.isAtual },
      { label: d.label, valor: d.investimento, tipo: 'Investimento', isAtual: d.isAtual },
      { label: d.label, valor: d.planosFuturos, tipo: 'Planos Futuros', isAtual: d.isAtual },
    ]).filter((d) => d.valor > 0);
    return {
      type: 'bar',
      autoFit: true,
      background: 'transparent',
      data: [{ id: 'guard', values: vals }],
      xField: ['label', 'tipo'],
      yField: 'valor',
      seriesField: 'tipo',
      stack: true,
      color: ['#22d3ee', '#a78bfa', '#34d399'],
      bar: { style: { cornerRadius: [4, 4, 0, 0] } },
      axes: [AXIS_BOTTOM, AXIS_LEFT(fmtK)],
      legends: [{
        visible: true,
        orient: 'top',
        padding: { bottom: 8 },
        item: { label: { style: { fontSize: 11, fill: '#64748b' } } },
      }],
      tooltip: {
        mark: {
          title: { visible: false },
          content: [{ key: (d: Record<string, unknown>) => String(d['tipo']), value: (d: Record<string, unknown>) => fmt(Number(d['valor'])) }],
        },
      },
    };
  }, [dados]);

  const dataKey = dados.map((d) => d.gastos + d.ganhos).join('-');

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">Carregando dados...</div>;
  }

  return (
    <div className="space-y-5">
      {/* ── Cards do mês atual ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" onClick={() => onNavigate('entradas')} className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl px-4 py-3 text-white shadow-lg shadow-purple-500/20 text-left cursor-pointer hover:brightness-110 transition-all">
          <p className="text-purple-100 text-xs">Ganhos do mês</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{fmt(atual?.ganhos ?? 0)}</p>
        </button>
        <button type="button" onClick={() => onNavigate('contas')} className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl px-4 py-3 text-white shadow-lg shadow-rose-500/20 text-left cursor-pointer hover:brightness-110 transition-all">
          <p className="text-rose-100 text-xs">Gastos do mês</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{fmt(atual?.gastos ?? 0)}</p>
        </button>
        <div className={`rounded-2xl px-4 py-3 text-white shadow-lg bg-gradient-to-br ${(atual?.saldo ?? 0) >= 0 ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/20' : 'from-amber-500 to-amber-600 shadow-amber-500/20'}`}>
          <p className="text-white/90 text-xs">Saldo do mês</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{fmt(atual?.saldo ?? 0)}</p>
        </div>
        <button type="button" onClick={() => onNavigate('entradas')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl px-4 py-3 text-white shadow-lg shadow-blue-500/20 text-left cursor-pointer hover:brightness-110 transition-all">
          <p className="text-blue-100 text-xs">Guardado no mês</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{fmt(totalGuardado)}</p>
          <p className="text-blue-100 text-[11px] mt-0.5">{pctGuardado.toFixed(0)}% dos ganhos</p>
        </button>
      </div>

      {/* ── Evolução Ganhos vs Gastos ── */}
      <Card>
        <div className="mb-3">
          <p className="font-semibold text-zinc-200 text-sm">Evolução: Ganhos vs Gastos</p>
          <p className="text-xs text-zinc-500">Últimos 12 meses · mês atual destacado</p>
        </div>
        <div style={{ height: 240 }}>
          <VChart key={`evo-${dataKey}`} spec={evoSpec as any} />
        </div>
      </Card>

      {/* ── Gastos por Categoria (mês atual) ── */}
      <Card>
        <div className="mb-3">
          <p className="font-semibold text-zinc-200 text-sm">Gastos por Categoria</p>
          <p className="text-xs text-zinc-500">Contas + Cartões — mês atual</p>
        </div>
        {gastosPorCat.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div style={{ height: 260 }}>
              <VChart key={`cat-${gastosPorCat.map((c) => c.total).join('-')}`} spec={catDonutSpec as any} />
            </div>
            <div className="space-y-2">
              {gastosPorCat.map((c) => {
                const pct = atual ? (c.total / (atual.gastos || 1)) * 100 : 0;
                return (
                  <div key={c.nome} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.fill }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-zinc-300 truncate">{c.nome}</span>
                        <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.fill }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 flex-shrink-0 tabular-nums">{fmt(c.total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500 gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">Sem gastos neste mês</p>
          </div>
        )}
      </Card>

      {/* ── Gastos por Tipo de Conta (mês atual) ── */}
      <Card>
        <div className="mb-3">
          <p className="font-semibold text-zinc-200 text-sm">Gastos por Tipo de Conta</p>
          <p className="text-xs text-zinc-500">Contas Fixas, Conta Rotativa, Cartões e Empresa — mês atual</p>
        </div>
        {gastosPorTipo.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div style={{ height: 260 }}>
              <VChart key={`tipo-${gastosPorTipo.map((c) => c.total).join('-')}`} spec={tipoDonutSpec as any} />
            </div>
            <div className="space-y-2">
              {gastosPorTipo.map((c) => {
                const pct = atual ? (c.total / (atual.gastos || 1)) * 100 : 0;
                return (
                  <div key={c.nome} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.fill }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-zinc-300 truncate">{c.nome}</span>
                        <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.fill }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 flex-shrink-0 tabular-nums">{fmt(c.total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500 gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm">Sem gastos neste mês</p>
          </div>
        )}
      </Card>

      {/* ── Quanto está sendo guardado ── */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-zinc-200 text-sm">Investimentos por categoria</p>
            <p className="text-xs text-zinc-500">Com base na distribuição configurada · Últimos 12 meses</p>
          </div>
          <div className="bg-violet-50 rounded-xl px-3 py-2 text-right flex-shrink-0">
            <p className="text-[11px] text-violet-400">Total guardado</p>
            <p className="font-bold text-violet-600 text-sm tabular-nums">{fmt(totalAcumulado)}</p>
          </div>
        </div>

        {dados.every((d) => d.ferias === 0 && d.investimento === 0 && d.planosFuturos === 0) ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
            <span className="text-3xl">💰</span>
            <p>Configure a distribuição na aba Entradas para ver esta análise.</p>
          </div>
        ) : (
          <>
            <div style={{ height: 220 }}>
              <VChart key={`guard-${dataKey}`} spec={guardadoSpec as any} />
            </div>
            {totalGuardado > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
                {[
                  { label: 'Férias', valor: atual?.ferias ?? 0, color: '#22d3ee', bg: 'bg-cyan-50' },
                  { label: 'Investimento', valor: atual?.investimento ?? 0, color: '#a78bfa', bg: 'bg-violet-50' },
                  { label: 'Planos Futuros', valor: atual?.planosFuturos ?? 0, color: '#34d399', bg: 'bg-emerald-500/10' },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-zinc-400">{item.label}</span>
                    </div>
                    <p className="font-bold text-zinc-200 text-sm tabular-nums">{fmt(item.valor)}</p>
                  </div>
                ))}
              </div>
            )}

            {totalAcumulado > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Férias', valor: feriasAcumulado, color: '#22d3ee' },
                  { label: 'Investimento', valor: investimentoAcumulado, color: '#a78bfa' },
                  { label: 'Planos Futuros', valor: planosFuturosAcumulado, color: '#34d399' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl px-3 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-zinc-500">Acumulado 12m</span>
                    </div>
                    <p className="font-semibold text-zinc-400 text-xs tabular-nums mt-0.5">{fmt(item.valor)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Assistente ── */}
      <TabAssistente mes={mes} ano={ano} />
    </div>
  );
}
