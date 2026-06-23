'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEntradasHistorico,
  getContasHistorico,
  getDistribuicoesHistorico,
  getComprasHistorico,
  getCustosEmpresaHistorico,
  getCategoriasContas,
} from './firestore';
import type { CategoriaContaConfig } from './types';
import { useRefetchOnFocus } from './useRefetchOnFocus';

export interface MesDashboard {
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

export interface CatGasto { nome: string; total: number; fill: string; }

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

// Agrega entradas/contas/cartões/empresa dos últimos 12 meses para os dashboards
// (Visão Geral em Tailwind e o preview Horizon em /admin/default compartilham esta lógica)
export function useVisaoGeralData(mes: number, ano: number) {
  const [dados, setDados] = useState<MesDashboard[]>([]);
  const [gastosPorCat, setGastosPorCat] = useState<CatGasto[]>([]);
  const [gastosPorTipo, setGastosPorTipo] = useState<CatGasto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [entradas, contas, distribuicoes, compras, custosEmpresa, catContas] = await Promise.all([
      getEntradasHistorico(),
      getContasHistorico(),
      getDistribuicoesHistorico(),
      getComprasHistorico(),
      getCustosEmpresaHistorico(),
      getCategoriasContas() as Promise<CategoriaContaConfig[]>,
    ]);

    const meses = getLast12Months(mes, ano);

    const result: MesDashboard[] = meses.map(({ mes: m, ano: a, label, mesAno }) => {
      const ganhos = entradas.filter((e) => e.mes === m && e.ano === a).reduce((s, e) => s + e.valor, 0);
      const gastoContas = contas.filter((c) => c.mes === m && c.ano === a).reduce((s, c) => s + c.valor, 0);
      const gastoCartoes = compras.filter((c) => c.mes === m && c.ano === a).reduce((s, c) => s + c.valorParcela, 0);
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
    const gastoCartoesAtual = compras
      .filter((c) => c.mes === mes && c.ano === ano)
      .reduce((s, c) => s + c.valorParcela, 0);
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
      { nome: 'Cartões',        total: compras.filter((c) => c.mes === mes && c.ano === ano).reduce((s, c) => s + c.valorParcela, 0), fill: '#ec4899' },
      { nome: 'Empresa',        total: gastoEmpresaAtual, fill: '#38bdf8' },
    ].filter((c) => c.total > 0);

    setDados(result);
    setGastosPorCat(gpc);
    setGastosPorTipo(gpt);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  return { dados, gastosPorCat, gastosPorTipo, loading };
}
