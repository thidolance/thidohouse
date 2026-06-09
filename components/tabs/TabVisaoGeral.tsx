'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Area,
} from 'recharts';
import Card from '../ui/Card';
import {
  getEntradasHistorico,
  getContasHistorico,
  getDistribuicoesHistorico,
  getComprasHistorico,
} from '@/lib/firestore';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface MesDashboard {
  label: string;
  mesAno: string;
  ganhos: number;
  gastos: number;
  saldo: number;
  ferias: number;
  investimento: number;
  planosFuturos: number;
}

interface Props {
  mes: number;
  ano: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLast12Months(mesAtual: number, anoAtual: number) {
  const result: { mes: number; ano: number; label: string; mesAno: string }[] = [];
  let m = mesAtual;
  let a = anoAtual;
  for (let i = 0; i < 12; i++) {
    result.unshift({
      mes: m,
      ano: a,
      label: `${MESES_CURTOS[m - 1]}/${String(a).slice(2)}`,
      mesAno: `${String(m).padStart(2, '0')}/${a}`,
    });
    m--;
    if (m === 0) { m = 12; a--; }
  }
  return result;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK = (v: number | undefined) => {
  const n = Number(v ?? 0);
  return n >= 1000 ? `R$${(n / 1000).toFixed(1)}k` : `R$${n.toFixed(0)}`;
};

// ─── CustomTooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function TabVisaoGeral({ mes, ano }: Props) {
  const [dados, setDados] = useState<MesDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [entradas, contas, distribuicoes, compras] = await Promise.all([
        getEntradasHistorico(),
        getContasHistorico(),
        getDistribuicoesHistorico(),
        getComprasHistorico(),
      ]);

      const meses = getLast12Months(mes, ano);

      const result: MesDashboard[] = meses.map(({ mes: m, ano: a, label, mesAno }) => {
        const ganhos = entradas
          .filter((e) => e.mes === m && e.ano === a)
          .reduce((s, e) => s + e.valor, 0);

        const gastoContas = contas
          .filter((c) => c.mes === m && c.ano === a)
          .reduce((s, c) => s + c.valor, 0);

        const gastoCartoes = compras
          .filter((c) => c.mes === m && c.ano === a)
          .reduce((s, c) => s + c.valorParcela, 0);

        const gastos = gastoContas + gastoCartoes;

        const dist = distribuicoes.find((d) => d.mes === m && d.ano === a);
        const ferias = ganhos * (dist?.ferias ?? 0) / 100;
        const investimento = ganhos * (dist?.investimento ?? 0) / 100;
        const planosFuturos = ganhos * (dist?.planosFuturos ?? 0) / 100;

        return {
          label,
          mesAno,
          ganhos,
          gastos,
          saldo: ganhos - gastos,
          ferias,
          investimento,
          planosFuturos,
        };
      });

      setDados(result);
      setLoading(false);
    }
    load();
  }, [mes, ano]);

  const atual = dados.find((d) => {
    const [m, a] = d.mesAno.split('/');
    return parseInt(m) === mes && parseInt(a) === ano;
  });

  const totalGuardado = (atual?.ferias ?? 0) + (atual?.investimento ?? 0) + (atual?.planosFuturos ?? 0);
  const pctGuardado = atual?.ganhos ? (totalGuardado / atual.ganhos) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do mês atual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <p className="text-indigo-100 text-xs">Ganhos do mês</p>
          <p className="text-xl font-bold mt-1">{fmt(atual?.ganhos ?? 0)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0">
          <p className="text-rose-100 text-xs">Gastos do mês</p>
          <p className="text-xl font-bold mt-1">{fmt(atual?.gastos ?? 0)}</p>
        </Card>
        <Card className={`border-0 text-white bg-gradient-to-br ${(atual?.saldo ?? 0) >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-amber-500 to-amber-600'}`}>
          <p className="text-white/80 text-xs">Saldo do mês</p>
          <p className="text-xl font-bold mt-1">{fmt(atual?.saldo ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-slate-500 text-xs">Guardado no mês</p>
          <p className="text-xl font-bold text-violet-600 mt-1">{fmt(totalGuardado)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{pctGuardado.toFixed(0)}% dos ganhos</p>
        </Card>
      </div>

      {/* Evolução ganhos vs gastos */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-1">Evolução — Ganhos vs Gastos</h3>
        <p className="text-xs text-slate-400 mb-4">Últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={dados} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
            />
            <Bar dataKey="ganhos" name="Ganhos" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={14} />
            <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={14} />
            <Area
              dataKey="saldo"
              name="Saldo"
              fill="#a5f3fc"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={0.25}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Evolução dos gastos (detalhado) */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-1">Evolução dos Gastos</h3>
        <p className="text-xs text-slate-400 mb-4">Contas + Cartões — Últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* O que está sendo guardado por categoria */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-1">Quanto está sendo guardado — por categoria</h3>
        <p className="text-xs text-slate-400 mb-4">Com base na distribuição configurada · Últimos 12 meses</p>

        {dados.every((d) => d.ferias === 0 && d.investimento === 0 && d.planosFuturos === 0) ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
            <p>Configure a distribuição na aba Entradas para ver esta análise.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              <Bar dataKey="ferias" name="Férias" stackId="a" fill="#22d3ee" radius={[0, 0, 0, 0]} />
              <Bar dataKey="investimento" name="Investimento" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="planosFuturos" name="Planos Futuros" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Mini resumo categorias do mês atual */}
        {totalGuardado > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-50">
            {[
              { label: 'Férias', valor: atual?.ferias ?? 0, color: '#22d3ee', bg: 'bg-cyan-50' },
              { label: 'Investimento', valor: atual?.investimento ?? 0, color: '#a78bfa', bg: 'bg-violet-50' },
              { label: 'Planos Futuros', valor: atual?.planosFuturos ?? 0, color: '#34d399', bg: 'bg-emerald-50' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
                <p className="font-bold text-slate-700 text-sm">{fmt(item.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Evolução dos ganhos (detalhado) */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-1">Evolução dos Ganhos</h3>
        <p className="text-xs text-slate-400 mb-4">Últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ganhos" name="Ganhos" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
