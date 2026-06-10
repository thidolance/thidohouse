'use client';

import { useState } from 'react';
import TabVisaoGeral from '@/components/tabs/TabVisaoGeral';
import TabEntradas from '@/components/tabs/TabEntradas';
import TabContas from '@/components/tabs/TabContas';
import TabCartoes from '@/components/tabs/TabCartoes';
import TabEmpresa from '@/components/tabs/TabEmpresa';
import MonthPicker from '@/components/ui/MonthPicker';
import { LayoutGrid, TrendingUp, Receipt, CreditCard, Building } from '@/components/ui/Icons';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

const TABS = [
  { id: 'visao',    label: 'Visão Geral',   icon: <LayoutGrid /> },
  { id: 'entradas', label: 'Entradas',       icon: <TrendingUp /> },
  { id: 'contas',   label: 'Contas do Mês',  icon: <Receipt /> },
  { id: 'cartoes',  label: 'Cartões',        icon: <CreditCard /> },
  { id: 'empresa',  label: 'Empresa',        icon: <Building /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Home() {
  const now = new Date();
  const [tab, setTab] = useState<TabId>('visao');
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 font-bold text-lg tracking-tight">ThidoHouse</span>
              <span className="text-slate-400 text-sm hidden sm:block">· Controle Financeiro</span>
            </div>
            <div className="flex items-center gap-2">
              <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
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
        {tab === 'visao'    && <TabVisaoGeral mes={mes} ano={ano} />}
        {tab === 'entradas' && <TabEntradas   mes={mes} ano={ano} />}
        {tab === 'contas'   && <TabContas     mes={mes} ano={ano} />}
        {tab === 'cartoes'  && <TabCartoes    mes={mes} ano={ano} />}
        {tab === 'empresa'  && <TabEmpresa    mes={mes} ano={ano} />}
      </main>
    </div>
  );
}
