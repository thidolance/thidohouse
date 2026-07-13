'use client';

import { useState, useEffect } from 'react';
import { getContas } from '@/lib/firestore';
import TabVisaoGeral from '@/components/tabs/TabVisaoGeral';
import TabEntradas from '@/components/tabs/TabEntradas';
import TabContas from '@/components/tabs/TabContas';
import TabCartoes from '@/components/tabs/TabCartoes';
import TabEmpresa from '@/components/tabs/TabEmpresa';
import TabMetas from '@/components/tabs/TabMetas';
import MonthPicker from '@/components/ui/MonthPicker';
import NotasMes from '@/components/ui/NotasMes';
import { LayoutGrid, TrendingUp, Receipt, CreditCard, Building, FamilyIcon, Target } from '@/components/ui/Icons';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

const TABS = [
  { id: 'visao',    label: 'Visão Geral',   icon: <LayoutGrid /> },
  { id: 'contas',   label: 'Contas do Mês',  icon: <Receipt /> },
  { id: 'cartoes',  label: 'Cartões',        icon: <CreditCard /> },
  { id: 'empresa',  label: 'Empresa',        icon: <Building /> },
  { id: 'entradas', label: 'Entradas',       icon: <TrendingUp /> },
  { id: 'metas',    label: 'Metas do Ano',   icon: <Target /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

function proximoMes(mes: number, ano: number) {
  return mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };
}

// Mês inicial ao abrir o app: depois do dia 15 já mostra o mês seguinte,
// para dar tempo de se programar. (O caso "tudo pago" é tratado no useEffect.)
function periodoInicial() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  return now.getDate() > 15 ? proximoMes(mes, ano) : { mes, ano };
}

export default function Home() {
  const [tab, setTab] = useState<TabId>('visao');
  const [periodo, setPeriodo] = useState(periodoInicial);
  const { mes, ano } = periodo;

  // Se ainda estamos no mês atual (até o dia 15) e todas as contas dele já
  // estão pagas, adianta para o mês seguinte na abertura.
  useEffect(() => {
    const now = new Date();
    if (now.getDate() > 15) return; // já adiantou no estado inicial
    const m = now.getMonth() + 1;
    const a = now.getFullYear();
    let cancelado = false;
    getContas(m, a).then((contas) => {
      if (cancelado) return;
      const tudoPago = contas.length > 0 && contas.every((c) => c.status === 'pago');
      if (tudoPago) {
        setPeriodo((p) => (p.mes === m && p.ano === a ? proximoMes(m, a) : p));
      }
    });
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 py-2.5 sm:h-14 sm:py-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <FamilyIcon className="h-4 w-4" />
              </div>
              <span className="text-indigo-600 font-bold text-lg tracking-tight">ThidoHouse</span>
              <span className="text-slate-400 text-sm hidden sm:block">· Controle Financeiro</span>
            </div>
            <div className="order-3 w-full flex items-center justify-center gap-2 sm:order-none sm:w-auto sm:justify-start">
              <MonthPicker mes={mes} ano={ano} onChange={(m, a) => setPeriodo({ mes: m, ano: a })} />
              <form action={logout}>
                <button
                  type="submit"
                  title="Sair"
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'visao'    && <TabVisaoGeral mes={mes} ano={ano} onNavigate={setTab} />}
        {tab === 'entradas' && <TabEntradas   mes={mes} ano={ano} />}
        {tab === 'contas'   && <TabContas     mes={mes} ano={ano} />}
        {tab === 'cartoes'  && <TabCartoes    mes={mes} ano={ano} />}
        {tab === 'empresa'  && <TabEmpresa    mes={mes} ano={ano} />}
        {tab === 'metas'    && <TabMetas      mes={mes} ano={ano} />}
      </main>

      <NotasMes mes={mes} ano={ano} />
    </div>
  );
}
