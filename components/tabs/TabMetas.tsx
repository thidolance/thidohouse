'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { Plus, Trash, Pencil, Check, LinkIcon } from '../ui/Icons';
import { getMetas, addMeta, updateMeta, deleteMeta } from '@/lib/firestore';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import type { Meta } from '@/lib/types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300';

interface Props { mes: number; ano: number; }

type FormMeta = { nome: string; valor: string; link: string };
const META_EMPTY: FormMeta = { nome: '', valor: '', link: '' };

export default function TabMetas({ ano }: Props) {
  const [metas, setMetas]     = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<FormMeta>(META_EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setMetas(await getMetas(ano));
    setLoading(false);
  }, [ano]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  function abrirNova() {
    setEditId(null);
    setForm(META_EMPTY);
    setShowModal(true);
  }

  function abrirEditar(m: Meta) {
    setEditId(m.id!);
    setForm({ nome: m.nome, valor: m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), link: m.link ?? '' });
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditId(null);
    setForm(META_EMPTY);
  }

  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data: Omit<Meta, 'id'> = {
      ano,
      nome: form.nome,
      valor: parseFloat(form.valor.replace(',', '.')) || 0,
      concluida: editId ? (metas.find((m) => m.id === editId)?.concluida ?? false) : false,
      ...(form.link ? { link: form.link } : {}),
    };
    if (editId) await updateMeta(editId, data);
    else        await addMeta(data);
    fecharModal();
    load();
  }

  async function handleToggle(m: Meta) {
    const { id, ...rest } = m;
    await updateMeta(id!, { ...rest, concluida: !m.concluida });
    load();
  }

  async function handleDelete(id: string) {
    await deleteMeta(id);
    load();
  }

  const totalGeral     = metas.reduce((s, m) => s + m.valor, 0);
  const totalConcluido = metas.filter((m) => m.concluida).reduce((s, m) => s + m.valor, 0);
  const totalFaltante  = totalGeral - totalConcluido;

  const metasOrdenadas = [...metas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    return b.valor - a.valor;
  });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Metas de {ano}</h2>
          <p className="text-xs text-slate-400">{metas.length} meta(s) · {fmt(totalGeral)}</p>
        </div>
        <button onClick={abrirNova}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus /><span className="hidden sm:inline">Nova Meta</span>
        </button>
      </div>

      {/* ── Lista ── */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="font-semibold text-slate-700 text-sm">Checklist</p>
          {metas.length > 0 && <span className="text-xs text-slate-400">{metas.length} item(s)</span>}
        </div>
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : metas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-slate-400 text-sm">Nenhuma meta cadastrada para {ano}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {metasOrdenadas.map((m) => (
              <div key={m.id} className={`group flex items-center gap-3 px-4 py-3.5 transition-all ${m.concluida ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'}`}>
                <button
                  onClick={() => handleToggle(m)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
                    m.concluida ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  {m.concluida && <Check />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm leading-tight ${m.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>{m.nome}</p>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 mt-0.5">
                      <LinkIcon /> Ver item
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-bold text-sm tabular-nums ${m.concluida ? 'text-emerald-600 line-through' : 'text-slate-800'}`}>{fmt(m.valor)}</span>
                  <button onClick={() => abrirEditar(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Pencil /></button>
                  <button onClick={() => handleDelete(m.id!)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Projeção ── */}
      <Card>
        <p className="font-semibold text-slate-700 text-sm mb-3">Projeção</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-400">Total das metas</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{fmt(totalGeral)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Já conquistado</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">{fmt(totalConcluido)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Falta para realizar tudo</p>
            <p className="text-lg font-bold text-indigo-600 mt-1">{fmt(totalFaltante)}</p>
          </div>
        </div>
      </Card>

      {/* ── Modal nova/editar meta ── */}
      {showModal && (
        <Modal title={editId ? 'Editar Meta' : 'Nova Meta'} onClose={fecharModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={INPUT} placeholder="Ex: Viagem para a praia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={INPUT} placeholder="0,00" inputMode="decimal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={INPUT} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={fecharModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
