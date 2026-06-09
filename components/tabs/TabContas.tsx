'use client';

import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Check, Receipt, Pencil } from '../ui/Icons';
import {
  getContas, addConta, updateConta, deleteConta, updateContaStatus, toggleContaFixa,
  getCategoriasContas, addCategoriaContas, deleteCategoriaContas,
  getCompras, getFaturasCartao, setFaturaCartaoStatus, getCartoes,
  getCustosEmpresa, getFaturasEmpresa, setFaturaEmpresaStatus, getCategoriasEmpresa,
} from '@/lib/firestore';
import type { Conta, CategoriaContaConfig } from '@/lib/types';

function GearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PinIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300';
const fmt   = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props { mes: number; ano: number; }

type FormState = {
  descricao: string; categoria: string; valor: string; vencimento: string;
  parcelaAtual: string; totalParcelas: string; fixa: boolean;
};

type CartaoItem  = { tipo: 'cartao';  cartaoId: string;    cartaoNome: string;    cartaoCor: string;    valor: number; status: 'pago' | 'pendente' };
type EmpresaItem = { tipo: 'empresa'; categoriaId: string; categoriaNome: string; categoriaCor: string; valor: number; status: 'pago' | 'pendente' };

export default function TabContas({ mes, ano }: Props) {
  const now = new Date();

  const [contas, setContas]         = useState<Conta[]>([]);
  const [cats, setCats]             = useState<CategoriaContaConfig[]>([]);
  const [itensCartao, setItensCartao]   = useState<CartaoItem[]>([]);
  const [itensEmpresa, setItensEmpresa] = useState<EmpresaItem[]>([]);
  const [loading, setLoading]       = useState(false);

  const [showModal, setShowModal]         = useState(false);
  const [showConfigModal, setShowConfig]  = useState(false);
  const [showCatForm, setShowCatForm]     = useState(false);
  const [editId, setEditId]               = useState<string | null>(null);
  const [formCat, setFormCat]             = useState({ nome: '', cor: '#6366f1' });

  const makeEmpty = useCallback((c: CategoriaContaConfig[]) => ({
    descricao: '', categoria: c[0]?.nome ?? '', valor: '', vencimento: '',
    parcelaAtual: '', totalParcelas: '', fixa: false,
  }), []);
  const [form, setForm] = useState<FormState>({ descricao: '', categoria: '', valor: '', vencimento: '', parcelaAtual: '', totalParcelas: '', fixa: false });

  // ── carregamento ────────────────────────────────────────────────────────────
  const loadCats = useCallback(async () => {
    const c = await getCategoriasContas();
    setCats(c);
    return c;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [contasList, comprasList, faturasList, cartoesList, custosList, faturasEmpresaList, catsEmpresaList] = await Promise.all([
      getContas(mes, ano),
      getCompras(mes, ano),
      getFaturasCartao(mes, ano),
      getCartoes(),
      getCustosEmpresa(mes, ano),
      getFaturasEmpresa(mes, ano),
      getCategoriasEmpresa(),
    ]);

    contasList.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1;
      return a.vencimento - b.vencimento;
    });
    setContas(contasList);

    type CI = CartaoItem;
    const cards: CI[] = cartoesList.flatMap((c): CI[] => {
      const total = comprasList.filter((p) => p.cartaoId === c.id).reduce((s, p) => s + p.valorParcela, 0);
      if (total === 0) return [];
      const fatura = faturasList.find((f) => f.cartaoId === c.id);
      return [{ tipo: 'cartao', cartaoId: c.id as string, cartaoNome: c.nome, cartaoCor: c.cor, valor: total, status: fatura?.status ?? 'pendente' }];
    });
    cards.sort((a, b) => { if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1; return a.cartaoNome.localeCompare(b.cartaoNome); });
    setItensCartao(cards);

    type EI = EmpresaItem;
    const empresa: EI[] = catsEmpresaList.flatMap((cat): EI[] => {
      const total = custosList.filter((c) => c.categoriaId === cat.id).reduce((s, c) => s + c.valorParcela, 0);
      if (total === 0) return [];
      const fatura = faturasEmpresaList.find((f) => f.categoriaId === cat.id);
      return [{ tipo: 'empresa', categoriaId: cat.id as string, categoriaNome: cat.nome, categoriaCor: cat.cor, valor: total, status: fatura?.status ?? 'pendente' }];
    });
    empresa.sort((a, b) => { if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1; return a.categoriaNome.localeCompare(b.categoriaNome); });
    setItensEmpresa(empresa);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { loadCats().then((c) => setForm(makeEmpty(c))); }, [loadCats, makeEmpty]);
  useEffect(() => { load(); }, [load]);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const catCor = (nome: string) => cats.find((c) => c.nome === nome)?.cor ?? '#94a3b8';

  function abrirNova() {
    setEditId(null);
    setForm(makeEmpty(cats));
    setShowModal(true);
  }

  function abrirEditar(c: Conta) {
    setEditId(c.id!);
    setForm({
      descricao:     c.descricao,
      categoria:     c.categoria,
      valor:         c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      vencimento:    String(c.vencimento),
      parcelaAtual:  c.parcelaAtual  ? String(c.parcelaAtual)  : '',
      totalParcelas: c.totalParcelas ? String(c.totalParcelas) : '',
      fixa:          c.fixa ?? false,
    });
    setShowModal(true);
  }

  // ── handlers ─────────────────────────────────────────────────────────────────
  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const valor      = parseFloat(form.valor.replace(/\./g, '').replace(',', '.'));
    const vencimento = parseInt(form.vencimento);
    const data: Omit<Conta, 'id'> = {
      descricao:     form.descricao,
      categoria:     form.categoria,
      valor,
      vencimento,
      status: 'pendente',
      mes, ano,
      ...(form.parcelaAtual  ? { parcelaAtual:  parseInt(form.parcelaAtual)  } : {}),
      ...(form.totalParcelas ? { totalParcelas: parseInt(form.totalParcelas) } : {}),
      fixa: form.fixa && !form.parcelaAtual,
    };
    if (editId) {
      // Obtém dados atuais para preservar grupoId/fixa se necessário
      const atual = contas.find((c) => c.id === editId)!;
      await updateConta(editId, { ...data, grupoId: atual.grupoId });
    } else {
      await addConta(data);
    }
    setShowModal(false);
    setEditId(null);
    setForm(makeEmpty(cats));
    load();
  }

  async function handleTogglePago(id: string, status: 'pago' | 'pendente') {
    await updateContaStatus(id, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleToggleFixa(c: Conta) {
    await toggleContaFixa(c.id!, c, !c.fixa);
    load();
  }

  async function handleDelete(id: string) {
    await deleteConta(id);
    load();
  }

  async function handleToggleCartao(cartaoId: string, status: 'pago' | 'pendente') {
    await setFaturaCartaoStatus(cartaoId, mes, ano, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleToggleEmpresa(categoriaId: string, status: 'pago' | 'pendente') {
    await setFaturaEmpresaStatus(categoriaId, mes, ano, status === 'pago' ? 'pendente' : 'pago');
    load();
  }

  async function handleSaveCat(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await addCategoriaContas(formCat);
    setShowCatForm(false);
    setFormCat({ nome: '', cor: '#6366f1' });
    loadCats();
  }

  async function handleDeleteCat(id: string) {
    await deleteCategoriaContas(id);
    loadCats();
  }

  // ── métricas ─────────────────────────────────────────────────────────────────
  const totalContasPago      = contas.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalContasPendente  = contas.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPago     = itensCartao.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalCartoesPendente = itensCartao.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalEmpresaPago     = itensEmpresa.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const totalEmpresaPendente = itensEmpresa.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalPago            = totalContasPago + totalCartoesPago + totalEmpresaPago;
  const totalPendente        = totalContasPendente + totalCartoesPendente + totalEmpresaPendente;
  const total                = totalPago + totalPendente;
  const pctPago              = total > 0 ? (totalPago / total) * 100 : 0;
  const countPago            = contas.filter((c) => c.status === 'pago').length + itensCartao.filter((c) => c.status === 'pago').length + itensEmpresa.filter((c) => c.status === 'pago').length;
  const countTotal           = contas.length + itensCartao.length + itensEmpresa.length;

  const pieData     = cats.map((cat) => ({ name: cat.nome, value: contas.filter((c) => c.categoria === cat.nome).reduce((s, c) => s + c.valor, 0), fill: cat.cor })).filter((d) => d.value > 0);
  const pieFaturas  = itensCartao.map((c) => ({ name: c.cartaoNome, value: c.valor, fill: c.cartaoCor }));
  const pieEmpresa  = itensEmpresa.map((c) => ({ name: c.categoriaNome, value: c.valor, fill: c.categoriaCor }));
  const pieDataFull = [...pieData, ...pieFaturas, ...pieEmpresa];

  const barData = [
    { name: 'Pago',     valor: totalPago,     fill: '#10b981' },
    { name: 'Pendente', valor: totalPendente, fill: '#f59e0b' },
  ];

  const pendentesHoje = contas.filter(
    (c) => c.status === 'pendente' && c.vencimento <= new Date().getDate()
      && mes === now.getMonth() + 1 && ano === now.getFullYear(),
  );

  const isParcelada = !!(form.parcelaAtual || form.totalParcelas);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowConfig(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
          <GearIcon /> Configurações
        </button>
        <button onClick={abrirNova} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus /> Nova Conta
        </button>
      </div>

      {/* Alertas */}
      {pendentesHoje.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-medium">{pendentesHoje.length} conta(s) vencida(s) ou vencendo hoje</p>
          <p className="text-amber-600 text-xs mt-1">{pendentesHoje.map((c) => c.descricao).join(', ')}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-0">
          <p className="text-slate-300 text-sm">Total do Mês</p>
          <p className="text-2xl font-bold mt-1">{fmt(total)}</p>
          {itensCartao.length > 0 && <p className="text-slate-400 text-xs mt-1">incl. {fmt(totalCartoesPago + totalCartoesPendente)} em cartões</p>}
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Pago</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalPago)}</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pctPago}%` }} /></div>
        </Card>
        <Card>
          <p className="text-slate-500 text-sm">Pendente</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{fmt(totalPendente)}</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: total > 0 ? `${(totalPendente / total) * 100}%` : '0%' }} /></div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4"><Receipt /><h3 className="font-semibold text-slate-700">Por Categoria</h3></div>
          {pieDataFull.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={pieDataFull} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} /><Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} /><Legend /></PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Nenhuma conta cadastrada</div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4">Pago vs Pendente</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 13 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v) => v != null ? fmt(Number(v)) : ''} /><Bar dataKey="valor" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Lista unificada */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">Contas do Mês</h3>
          {countTotal > 0 && <span className="text-xs text-slate-500">{countPago}/{countTotal} pagas</span>}
        </div>
        {countTotal > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">{fmt(totalPago)} pagos</span>
              <span className="text-xs font-semibold text-emerald-600">{pctPago.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pctPago}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{fmt(totalPendente)} ainda pendentes</p>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : countTotal === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhuma conta cadastrada neste mês</p>
        ) : (
          <div className="space-y-2">
            {/* ── Contas manuais ── */}
            {contas.map((c) => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${c.status === 'pago' ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePago(c.id!, c.status)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${c.status === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                  >
                    {c.status === 'pago' && <Check />}
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-medium text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.descricao}</p>
                      {c.fixa && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-semibold">fixa</span>
                      )}
                      {c.totalParcelas && c.parcelaAtual && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{c.parcelaAtual}/{c.totalParcelas}x</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: `${catCor(c.categoria)}22`, color: catCor(c.categoria) }}>{c.categoria}</span>
                      <span className="text-xs text-slate-400">vence dia {c.vencimento}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold text-sm ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>{fmt(c.valor)}</span>
                  {/* Botão fixa — apenas para não-parceladas */}
                  {!c.parcelaAtual && (
                    <button
                      onClick={() => handleToggleFixa(c)}
                      title={c.fixa ? 'Remover recorrência' : 'Marcar como fixa'}
                      className={`p-1.5 rounded-lg transition-colors ${c.fixa ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}
                    >
                      <PinIcon filled={c.fixa} />
                    </button>
                  )}
                  <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-400 transition-colors"><Pencil /></button>
                  <button onClick={() => handleDelete(c.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
                </div>
              </div>
            ))}

            {/* ── Custos empresa ── */}
            {itensEmpresa.map((c) => (
              <div key={`emp-${c.categoriaId}`} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 border ${c.status === 'pago' ? 'border-emerald-100 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleEmpresa(c.categoriaId, c.status)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${c.status === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}>
                    {c.status === 'pago' && <Check />}
                  </button>
                  <div>
                    <p className={`font-medium text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-700'}`}>Empresa — {c.categoriaNome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${c.categoriaCor}22`, color: c.categoriaCor }}>{c.categoriaNome}</span>
                      <span className="text-xs text-slate-400">custo do mês</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: c.categoriaCor }} />
                  <span className={`font-semibold text-sm ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>{fmt(c.valor)}</span>
                </div>
              </div>
            ))}

            {/* ── Faturas cartão ── */}
            {itensCartao.map((c) => (
              <div key={c.cartaoId} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 border ${c.status === 'pago' ? 'border-emerald-100 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleCartao(c.cartaoId, c.status)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${c.status === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}>
                    {c.status === 'pago' && <Check />}
                  </button>
                  <div>
                    <p className={`font-medium text-sm ${c.status === 'pago' ? 'line-through text-slate-400' : 'text-slate-700'}`}>Fatura {c.cartaoNome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${c.cartaoCor}22`, color: c.cartaoCor }}>{c.cartaoNome}</span>
                      <span className="text-xs text-slate-400">fatura do mês</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: c.cartaoCor }} />
                  <span className={`font-semibold text-sm ${c.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>{fmt(c.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Modal nova/editar conta ── */}
      {showModal && (
        <Modal title={editId ? 'Editar Conta' : 'Nova Conta'} onClose={() => { setShowModal(false); setEditId(null); setForm(makeEmpty(cats)); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={INPUT} placeholder="Ex: Aluguel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={INPUT}>
                {cats.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento (dia)</label>
                <input required type="number" min={1} max={31} value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} className={INPUT} placeholder="10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parcelas <span className="text-slate-400 font-normal">(opcional)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1} value={form.parcelaAtual} onChange={(e) => setForm({ ...form, parcelaAtual: e.target.value, fixa: false })} className={INPUT} placeholder="Parcela atual" />
                <input type="number" min={1} value={form.totalParcelas} onChange={(e) => setForm({ ...form, totalParcelas: e.target.value, fixa: false })} className={INPUT} placeholder="Total parcelas" />
              </div>
            </div>
            {/* Conta Fixa — oculto quando parcelada */}
            {!isParcelada && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, fixa: !form.fixa })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.fixa ? 'bg-amber-400' : 'bg-slate-200'}`}
                >
                  <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.fixa ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Conta Fixa</p>
                  <p className="text-xs text-slate-400">Aparece automaticamente todo mês</p>
                </div>
              </label>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditId(null); setForm(makeEmpty(cats)); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal configurações ── */}
      {showConfigModal && (
        <Modal title="Configurações — Contas" onClose={() => { setShowConfig(false); setShowCatForm(false); }}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorias</p>
            {cats.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                <p className="flex-1 text-sm font-medium text-slate-700">{cat.nome}</p>
                <button onClick={() => handleDeleteCat(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"><Trash /></button>
              </div>
            ))}
            {!showCatForm ? (
              <button onClick={() => setShowCatForm(true)} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2">
                <Plus /> Nova Categoria
              </button>
            ) : (
              <form onSubmit={handleSaveCat} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">Nova Categoria</p>
                <input required value={formCat.nome} onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })} className={INPUT} placeholder="Ex: Assinaturas, Pet..." />
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formCat.cor} onChange={(e) => setFormCat({ ...formCat, cor: e.target.value })} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
                    <span className="text-xs text-slate-500 font-mono">{formCat.cor}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium ml-2" style={{ backgroundColor: `${formCat.cor}22`, color: formCat.cor }}>{formCat.nome || 'Exemplo'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowCatForm(false); setFormCat({ nome: '', cor: '#6366f1' }); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-white">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
