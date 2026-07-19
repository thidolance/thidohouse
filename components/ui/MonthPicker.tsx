'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';

interface Props {
  mes: number;
  ano: number;
  onChange: (mes: number, ano: number) => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export default function MonthPicker({ mes, ano, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  // Ano exibido no popover (pode navegar sem trocar o mês selecionado).
  const [anoView, setAnoView] = useState(ano);
  const ref = useRef<HTMLDivElement>(null);

  const hoje = new Date();
  const mesHoje = hoje.getMonth() + 1;
  const anoHoje = hoje.getFullYear();

  // Ao abrir, sincroniza o ano do popover com o ano selecionado.
  useEffect(() => {
    if (aberto) setAnoView(ano);
  }, [aberto, ano]);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [aberto]);

  function prev() {
    if (mes === 1) onChange(12, ano - 1);
    else onChange(mes - 1, ano);
  }

  function next() {
    if (mes === 12) onChange(1, ano + 1);
    else onChange(mes + 1, ano);
  }

  function selecionar(m: number) {
    onChange(m, anoView);
    setAberto(false);
  }

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      <button
        onClick={prev}
        aria-label="Mês anterior"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400"
      >
        <ChevronLeft />
      </button>

      <button
        onClick={() => setAberto((v) => !v)}
        className="min-w-[150px] rounded-lg px-2 py-1 text-center text-base font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {MESES[mes - 1]} {ano}
      </button>

      <button
        onClick={next}
        aria-label="Próximo mês"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400"
      >
        <ChevronRight />
      </button>

      {aberto && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl p-px bg-slate-200/80 dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 dark:shadow-[0_0_24px_-10px_rgba(192,132,252,0.55)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="rounded-[15px] bg-white dark:bg-zinc-950 p-3 shadow-lg">
            {/* Navegação de ano */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setAnoView((a) => a - 1)}
                aria-label="Ano anterior"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{anoView}</span>
              <button
                onClick={() => setAnoView((a) => a + 1)}
                aria-label="Próximo ano"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Grade de meses */}
            <div className="grid grid-cols-3 gap-1.5">
              {MESES_CURTOS.map((m, i) => {
                const numMes = i + 1;
                const selecionado = numMes === mes && anoView === ano;
                const ehHoje = numMes === mesHoje && anoView === anoHoje;
                return (
                  <button
                    key={m}
                    onClick={() => selecionar(numMes)}
                    className={`relative rounded-xl py-2 text-sm font-medium transition-colors ${
                      selecionado
                        ? 'bg-indigo-600 text-white dark:bg-purple-600'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {m}
                    {ehHoje && !selecionado && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-purple-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Atalho para o mês atual */}
            <button
              onClick={() => { onChange(mesHoje, anoHoje); setAberto(false); }}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Ir para o mês atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
