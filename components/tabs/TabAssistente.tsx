'use client';

import { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import { MessageCircle } from '../ui/Icons';

interface Props { mes: number; ano: number; }

interface Mensagem {
  role: 'user' | 'assistant';
  content: string;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const SUGESTOES = [
  'Quanto sobrou esse mês?',
  'Quais são minhas maiores contas?',
  'Como estão os custos da empresa?',
];

export default function TabAssistente({ mes, ano }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mensagens.length === 0) return;
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mensagens]);

  async function enviarMensagem(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    const novas: Mensagem[] = [...mensagens, { role: 'user', content: conteudo }];
    setMensagens(novas);
    setInput('');
    setEnviando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novas, mes, ano }),
      });

      if (!res.ok || !res.body) throw new Error('Falha na resposta do assistente');

      setMensagens((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        const textoAtual = acumulado;
        setMensagens((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { role: 'assistant', content: textoAtual };
          return copia;
        });
      }
    } catch {
      setMensagens((prev) => [...prev, {
        role: 'assistant',
        content: 'Não consegui me conectar ao assistente. Tente novamente em instantes.',
      }]);
    } finally {
      setEnviando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviarMensagem(input);
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-purple-500/10 text-indigo-500 dark:text-purple-400 flex-shrink-0">
          <MessageCircle />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Assistente Financeiro</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Pergunte sobre seus gastos de {MESES[mes - 1]}/{ano}</p>
        </div>
      </div>

      <Card className="flex flex-col h-[480px]">
        {/* ── Mensagens ── */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {mensagens.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-slate-400 dark:text-zinc-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-purple-500/10 text-indigo-500 dark:text-purple-400">
                <MessageCircle />
              </div>
              <p className="text-sm">Pergunte algo sobre suas finanças deste mês.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviarMensagem(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 dark:bg-purple-600 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-bl-sm'
              }`}>
                {m.content || (enviando && i === mensagens.length - 1 ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={fimRef} />
        </div>

        {/* ── Input ── */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre seus gastos..."
            disabled={enviando}
            className="flex-1 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={enviando || !input.trim()}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </Card>
    </div>
  );
}
