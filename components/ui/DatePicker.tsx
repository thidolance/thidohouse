'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';
import { Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  value: string;                 // formato YYYY-MM-DD
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;            // classe do gatilho (mesmo INPUT dos forms)
  placeholder?: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseISO(v: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!match) return null;
  return { y: +match[1], m: +match[2] - 1, d: +match[3] };
}
function displayDate(v: string): string {
  const p = parseISO(v);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : '';
}

export default function DatePicker({ value, onChange, required, className = '', placeholder = 'Selecione a data' }: Props) {
  const [aberto, setAberto] = useState(false);
  const hoje = new Date();
  const parsed = parseISO(value);
  const [viewY, setViewY] = useState(parsed?.y ?? hoje.getFullYear());
  const [viewM, setViewM] = useState(parsed?.m ?? hoje.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Ao abrir, posiciona a visão no mês do valor (ou no mês atual).
  useEffect(() => {
    if (!aberto) return;
    const p = parseISO(value);
    setViewY(p?.y ?? hoje.getFullYear());
    setViewM(p?.m ?? hoje.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

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

  function prevMes() {
    setViewM((m) => (m === 0 ? (setViewY((y) => y - 1), 11) : m - 1));
  }
  function nextMes() {
    setViewM((m) => (m === 11 ? (setViewY((y) => y + 1), 0) : m + 1));
  }

  function escolher(d: number) {
    onChange(toISO(viewY, viewM, d));
    setAberto(false);
  }

  const primeiroDiaSemana = new Date(viewY, viewM, 1).getDay();
  const diasNoMes = new Date(viewY, viewM + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Gatilho no estilo dos inputs */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center justify-between text-left ${className}`}
      >
        <span className={value ? 'text-slate-900 dark:text-zinc-50' : 'text-slate-400 dark:text-zinc-500'}>
          {value ? displayDate(value) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-slate-400 dark:text-purple-400 flex-shrink-0" />
      </button>
      {/* Campo oculto para validação nativa (required) */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute left-3 bottom-1 h-0 w-0 opacity-0"
        />
      )}

      {aberto && (
        <div className="mt-2 w-full overflow-hidden rounded-2xl p-px bg-slate-200/80 dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 dark:shadow-[0_0_24px_-10px_rgba(192,132,252,0.55)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="rounded-[15px] bg-white dark:bg-zinc-950 p-3 shadow-lg">
            {/* Cabeçalho mês/ano */}
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={prevMes} aria-label="Mês anterior"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400">
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{MESES[viewM]} {viewY}</span>
              <button type="button" onClick={nextMes} aria-label="Próximo mês"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400">
                <ChevronRight />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS.map((d, i) => (
                <span key={i} className="text-center text-[10px] font-medium uppercase text-slate-400 dark:text-zinc-500">{d}</span>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-1">
              {celulas.map((d, i) => {
                if (d === null) return <span key={`e-${i}`} className="h-8" />;
                const iso = toISO(viewY, viewM, d);
                const selecionado = iso === value;
                const ehHoje = d === hoje.getDate() && viewM === hoje.getMonth() && viewY === hoje.getFullYear();
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => escolher(d)}
                    className={`relative h-8 rounded-lg text-sm font-medium transition-colors ${
                      selecionado
                        ? 'bg-indigo-600 text-white dark:bg-purple-600'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {d}
                    {ehHoje && !selecionado && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-purple-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Atalho hoje */}
            <button
              type="button"
              onClick={() => { const t = new Date(); onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate())); setAberto(false); }}
              className="mt-2 w-full rounded-xl border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
