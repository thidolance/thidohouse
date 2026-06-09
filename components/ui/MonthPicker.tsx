'use client';

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

export default function MonthPicker({ mes, ano, onChange }: Props) {
  function prev() {
    if (mes === 1) onChange(12, ano - 1);
    else onChange(mes - 1, ano);
  }

  function next() {
    if (mes === 12) onChange(1, ano + 1);
    else onChange(mes + 1, ano);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
      >
        <ChevronLeft />
      </button>
      <span className="text-base font-semibold text-slate-700 min-w-[150px] text-center">
        {MESES[mes - 1]} {ano}
      </span>
      <button
        onClick={next}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
