import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Entrada, Distribuicao, Conta, Cartao, CompraParcelada } from './types';

// ─── Entradas ───────────────────────────────────────────────────────────────

export async function getEntradas(mes: number, ano: number): Promise<Entrada[]> {
  const q = query(collection(db, 'entradas'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entrada));
}

export async function getEntradasHistorico(): Promise<Entrada[]> {
  const snap = await getDocs(collection(db, 'entradas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entrada));
}

export async function addEntrada(e: Omit<Entrada, 'id'>): Promise<void> {
  await addDoc(collection(db, 'entradas'), e);
}

export async function deleteEntrada(id: string): Promise<void> {
  await deleteDoc(doc(db, 'entradas', id));
}

// ─── Distribuição ───────────────────────────────────────────────────────────

export async function getDistribuicao(mes: number, ano: number): Promise<Distribuicao | null> {
  const q = query(
    collection(db, 'distribuicoes'),
    where('mes', '==', mes),
    where('ano', '==', ano),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Distribuicao;
}

export async function saveDistribuicao(d: Omit<Distribuicao, 'id'>, id?: string): Promise<void> {
  if (id) {
    await setDoc(doc(db, 'distribuicoes', id), d);
  } else {
    await addDoc(collection(db, 'distribuicoes'), d);
  }
}

export async function getDistribuicoesHistorico(): Promise<Distribuicao[]> {
  const snap = await getDocs(collection(db, 'distribuicoes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Distribuicao));
}

// ─── Contas ─────────────────────────────────────────────────────────────────

export async function getContas(mes: number, ano: number): Promise<Conta[]> {
  const q = query(collection(db, 'contas'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conta));
}

export async function addConta(c: Omit<Conta, 'id'>): Promise<void> {
  await addDoc(collection(db, 'contas'), c);
}

export async function updateContaStatus(id: string, status: 'pago' | 'pendente'): Promise<void> {
  await updateDoc(doc(db, 'contas', id), { status });
}

export async function deleteConta(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contas', id));
}

export async function getContasHistorico(): Promise<Conta[]> {
  const snap = await getDocs(collection(db, 'contas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conta));
}

// ─── Cartões ────────────────────────────────────────────────────────────────

export async function getCartoes(): Promise<Cartao[]> {
  const snap = await getDocs(collection(db, 'cartoes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cartao));
}

export async function addCartao(c: Omit<Cartao, 'id'>): Promise<void> {
  await addDoc(collection(db, 'cartoes'), c);
}

export async function deleteCartao(id: string): Promise<void> {
  await deleteDoc(doc(db, 'cartoes', id));
}

// ─── Compras Parceladas ──────────────────────────────────────────────────────

export async function getCompras(mes: number, ano: number): Promise<CompraParcelada[]> {
  const q = query(collection(db, 'compras'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompraParcelada));
}

export async function addCompra(c: Omit<CompraParcelada, 'id'>): Promise<void> {
  await addDoc(collection(db, 'compras'), c);
}

export async function deleteCompra(id: string): Promise<void> {
  await deleteDoc(doc(db, 'compras', id));
}

export async function getComprasHistorico(): Promise<CompraParcelada[]> {
  const snap = await getDocs(collection(db, 'compras'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompraParcelada));
}
