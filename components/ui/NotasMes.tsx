'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NotebookPen, X, Save } from 'lucide-react';
import { getNotaMes, saveNotaMes } from '@/lib/firestore';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface Props {
  mes: number;
  ano: number;
}

export default function NotasMes({ mes, ano }: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [salvo, setSalvo] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const nota = await getNotaMes(mes, ano);
      const t = nota?.texto ?? '';
      setTexto(t);
      setSalvo(t);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    if (aberto) {
      carregar();
    }
  }, [aberto, carregar]);

  useEffect(() => {
    if (aberto) {
      textareaRef.current?.focus();
    }
  }, [aberto, loading]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveNotaMes(mes, ano, texto);
      setSalvo(texto);
    } finally {
      setSaving(false);
    }
  }

  const alterado = texto !== salvo;

  return (
    <>
      {/* Painel */}
      {aberto && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              <span className="font-semibold text-sm">
                {MESES[mes]} {ano}
              </span>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Corpo */}
          <div className="flex flex-col flex-1 p-3 gap-2">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="h-5 w-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Anotações do mês..."
                rows={8}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
              />
            )}

            <button
              onClick={handleSave}
              disabled={!alterado || saving || loading}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto((v) => !v)}
        title="Anotações do mês"
        className={`fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          aberto
            ? 'bg-purple-700 scale-95'
            : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'
        }`}
      >
        <NotebookPen className="h-5 w-5 text-white" />
        {alterado && !aberto && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </button>
    </>
  );
}
