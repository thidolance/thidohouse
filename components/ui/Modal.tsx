'use client';

import { useEffect } from 'react';
import { X } from './Icons';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// Conta quantos modais estão abertos para marcar/desmarcar o body só quando o
// último fecha (suporta modais aninhados).
let modaisAbertos = 0;

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Sinaliza no body que há um modal aberto — usado pelo CSS para esconder o
  // botão flutuante de anotações no mobile (ele fura o modal por stacking context).
  useEffect(() => {
    modaisAbertos += 1;
    document.body.dataset.modalAberto = 'true';
    return () => {
      modaisAbertos -= 1;
      if (modaisAbertos <= 0) delete document.body.dataset.modalAberto;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-400"
          >
            <X />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
