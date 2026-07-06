import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Entrada, Distribuicao, Conta, CategoriaContaConfig,
  Cartao, CategoriaCompra, CompraParcelada, FaturaCartao,
  CategoriaEmpresa, CustoEmpresa, FaturaEmpresa, Meta, NotaMes,
} from './types';
import { DEFAULT_CARTOES, DEFAULT_CATEGORIAS } from './cartoes';

const DEFAULT_CATEGORIAS_EMPRESA: Omit<CategoriaEmpresa, 'id'>[] = [
  { nome: 'DAS',          cor: '#38bdf8' },
  { nome: 'DARF',         cor: '#0ea5e9' },
  { nome: 'Renegociação', cor: '#0284c7' },
];

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

export async function updateEntrada(id: string, e: Omit<Entrada, 'id'>): Promise<void> {
  await setDoc(doc(db, 'entradas', id), e);
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

// Todas as parcelas de uma conta parcelada/fixa, para acompanhamento
export async function getContasPorGrupo(grupoId: string): Promise<Conta[]> {
  const q = query(collection(db, 'contas'), where('grupoId', '==', grupoId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conta));
}

function makeGrupoId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Grava uma doc por parcela restante; fixas propagam 24 meses à frente
export async function addConta(c: Omit<Conta, 'id'>): Promise<void> {
  if (c.parcelaAtual && c.totalParcelas) {
    const grupoId = makeGrupoId();
    const remaining = c.totalParcelas - c.parcelaAtual + 1;
    await Promise.all(
      Array.from({ length: remaining }, (_, i) => {
        const { mes, ano } = addMonths(c.mes, c.ano, i);
        return addDoc(collection(db, 'contas'), {
          ...c, grupoId, parcelaAtual: c.parcelaAtual! + i, mes, ano, status: 'pendente',
        });
      }),
    );
    return;
  }
  if (c.fixa) {
    const grupoId = makeGrupoId();
    await Promise.all([
      addDoc(collection(db, 'contas'), { ...c, grupoId }),
      ...Array.from({ length: 24 }, (_, i) => {
        const { mes, ano } = addMonths(c.mes, c.ano, i + 1);
        return addDoc(collection(db, 'contas'), { ...c, grupoId, mes, ano, status: 'pendente' });
      }),
    ]);
    return;
  }
  await addDoc(collection(db, 'contas'), c);
}

export async function updateConta(id: string, c: Omit<Conta, 'id'>): Promise<void> {
  await setDoc(doc(db, 'contas', id), c);
}

export async function updateContaStatus(id: string, status: 'pago' | 'pendente'): Promise<void> {
  await updateDoc(doc(db, 'contas', id), { status });
}

// Ativa/desativa fixa: cria 24 cópias ou apaga todas as futuras do mesmo grupoId
export async function toggleContaFixa(id: string, conta: Conta, tornarFixa: boolean): Promise<void> {
  const { id: _id, grupoId: _grupoId, ...data } = conta;
  if (tornarFixa) {
    const grupoId = makeGrupoId();
    await Promise.all([
      setDoc(doc(db, 'contas', id), { ...data, fixa: true, grupoId }),
      ...Array.from({ length: 24 }, (_, i) => {
        const { mes, ano } = addMonths(conta.mes, conta.ano, i + 1);
        return addDoc(collection(db, 'contas'), {
          ...data, fixa: true, grupoId, mes, ano, status: 'pendente',
        });
      }),
    ]);
  } else {
    await setDoc(doc(db, 'contas', id), { ...data, fixa: false });
    if (conta.grupoId) {
      const snap = await getDocs(query(collection(db, 'contas'), where('grupoId', '==', conta.grupoId)));
      const currentAbs = conta.ano * 12 + conta.mes;
      await Promise.all(
        snap.docs
          .filter((d) => { const x = d.data(); return d.id !== id && (x.ano * 12 + x.mes) > currentAbs; })
          .map((d) => deleteDoc(d.ref)),
      );
    }
  }
}

export async function deleteConta(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contas', id));
}

// Atualiza a conta e todos os meses futuros com o mesmo grupoId
export async function updateContaAndFuture(id: string, conta: Conta, data: Omit<Conta, 'id'>): Promise<void> {
  await setDoc(doc(db, 'contas', id), data);
  if (conta.grupoId) {
    const snap = await getDocs(query(collection(db, 'contas'), where('grupoId', '==', conta.grupoId)));
    const currentAbs = conta.ano * 12 + conta.mes;
    await Promise.all(
      snap.docs
        .filter((d) => { const x = d.data(); return d.id !== id && (x.ano * 12 + x.mes) > currentAbs; })
        .map((d) => {
          const prev = d.data();
          return setDoc(d.ref, {
            ...data,
            mes: prev.mes,
            ano: prev.ano,
            status: prev.status,
            grupoId: conta.grupoId,
            ...(prev.parcelaAtual  != null ? { parcelaAtual:  prev.parcelaAtual  } : {}),
            ...(prev.totalParcelas != null ? { totalParcelas: prev.totalParcelas } : {}),
          });
        }),
    );
  }
}

// Apaga a conta e todos os meses futuros com o mesmo grupoId
export async function deleteContaAndFuture(id: string, conta: Conta): Promise<void> {
  await deleteDoc(doc(db, 'contas', id));
  if (conta.grupoId) {
    const snap = await getDocs(query(collection(db, 'contas'), where('grupoId', '==', conta.grupoId)));
    const currentAbs = conta.ano * 12 + conta.mes;
    await Promise.all(
      snap.docs
        .filter((d) => { const x = d.data(); return d.id !== id && (x.ano * 12 + x.mes) > currentAbs; })
        .map((d) => deleteDoc(d.ref)),
    );
  }
}

export async function getContasHistorico(): Promise<Conta[]> {
  const snap = await getDocs(collection(db, 'contas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conta));
}

// ─── Categorias de Contas ────────────────────────────────────────────────────

const DEFAULT_CATEGORIAS_CONTAS: Omit<CategoriaContaConfig, 'id'>[] = [
  { nome: 'Moradia',     cor: '#6366f1' },
  { nome: 'Alimentação', cor: '#f59e0b' },
  { nome: 'Transporte',  cor: '#3b82f6' },
  { nome: 'Saúde',       cor: '#10b981' },
  { nome: 'Lazer',       cor: '#ec4899' },
  { nome: 'Educação',    cor: '#8b5cf6' },
  { nome: 'Outros',      cor: '#94a3b8' },
];

export async function getCategoriasContas(): Promise<CategoriaContaConfig[]> {
  const snap = await getDocs(collection(db, 'categorias_contas'));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaContaConfig));
  await Promise.all(DEFAULT_CATEGORIAS_CONTAS.map((c) => addDoc(collection(db, 'categorias_contas'), c)));
  const seeded = await getDocs(collection(db, 'categorias_contas'));
  return seeded.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaContaConfig));
}

export async function addCategoriaContas(c: Omit<CategoriaContaConfig, 'id'>): Promise<void> {
  await addDoc(collection(db, 'categorias_contas'), c);
}

export async function deleteCategoriaContas(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categorias_contas', id));
}

// ─── Cartões ────────────────────────────────────────────────────────────────

export async function getCartoes(): Promise<Cartao[]> {
  const snap = await getDocs(collection(db, 'cartoes'));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cartao));
  // Seed na primeira vez
  await Promise.all(DEFAULT_CARTOES.map((c) => addDoc(collection(db, 'cartoes'), c)));
  const seeded = await getDocs(collection(db, 'cartoes'));
  return seeded.docs.map((d) => ({ id: d.id, ...d.data() } as Cartao));
}

export async function addCartao(c: Omit<Cartao, 'id'>): Promise<void> {
  await addDoc(collection(db, 'cartoes'), c);
}

export async function updateCartao(id: string, c: Omit<Cartao, 'id'>): Promise<void> {
  await setDoc(doc(db, 'cartoes', id), c);
}

export async function deleteCartao(id: string): Promise<void> {
  await deleteDoc(doc(db, 'cartoes', id));
}

// ─── Categorias de Compra ────────────────────────────────────────────────────

export async function getCategorias(): Promise<CategoriaCompra[]> {
  const snap = await getDocs(collection(db, 'categorias'));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaCompra));
  // Seed na primeira vez
  await Promise.all(DEFAULT_CATEGORIAS.map((c) => addDoc(collection(db, 'categorias'), c)));
  const seeded = await getDocs(collection(db, 'categorias'));
  return seeded.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaCompra));
}

export async function addCategoria(c: Omit<CategoriaCompra, 'id'>): Promise<void> {
  await addDoc(collection(db, 'categorias'), c);
}

export async function deleteCategoria(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categorias', id));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function addMonths(mes: number, ano: number, n: number): { mes: number; ano: number } {
  const total = ano * 12 + (mes - 1) + n;
  return { mes: (total % 12) + 1, ano: Math.floor(total / 12) };
}

// ─── Compras Parceladas ──────────────────────────────────────────────────────

export async function getCompras(mes: number, ano: number): Promise<CompraParcelada[]> {
  const q = query(collection(db, 'compras'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompraParcelada));
}

// Grava uma doc por parcela restante, cada uma no mês correto; fixas propagam 24 meses à frente
export async function addCompra(c: Omit<CompraParcelada, 'id'>): Promise<void> {
  if (c.fixa) {
    const grupoId = makeGrupoId();
    await Promise.all([
      addDoc(collection(db, 'compras'), { ...c, grupoId }),
      ...Array.from({ length: 24 }, (_, i) => {
        const { mes, ano } = addMonths(c.mes, c.ano, i + 1);
        return addDoc(collection(db, 'compras'), { ...c, grupoId, mes, ano });
      }),
    ]);
    return;
  }
  const grupoId = makeGrupoId();
  const remaining = c.totalParcelas - c.parcelaAtual + 1;
  await Promise.all(
    Array.from({ length: remaining }, (_, i) => {
      const { mes, ano } = addMonths(c.mes, c.ano, i);
      return addDoc(collection(db, 'compras'), { ...c, grupoId, parcelaAtual: c.parcelaAtual + i, mes, ano });
    }),
  );
}

export async function updateCompra(id: string, c: Omit<CompraParcelada, 'id'>, original?: CompraParcelada): Promise<void> {
  const grupoId = original?.grupoId;
  await setDoc(doc(db, 'compras', id), grupoId ? { ...c, grupoId } : c);
}

// Busca compras "irmãs" em meses posteriores: pelo grupoId (quando existir) e também pelas mesmas
// características (cartão + descrição + fixa), cobrindo compras antigas que perderam o grupoId
// ou cujo grupoId ficou inconsistente entre as parcelas
export async function getComprasFuturasDoGrupo(original: CompraParcelada): Promise<CompraParcelada[]> {
  const currentAbs = original.ano * 12 + original.mes;
  const candidatas = new Map<string, CompraParcelada>();

  if (original.grupoId) {
    const snap = await getDocs(query(collection(db, 'compras'), where('grupoId', '==', original.grupoId)));
    snap.docs.forEach((d) => candidatas.set(d.id, { id: d.id, ...d.data() } as CompraParcelada));
  }

  const snap = await getDocs(query(
    collection(db, 'compras'),
    where('cartaoId', '==', original.cartaoId),
    where('descricao', '==', original.descricao),
  ));
  snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CompraParcelada))
    .filter((d) => (d.fixa ?? false) === (original.fixa ?? false))
    .forEach((d) => candidatas.set(d.id!, d));

  return Array.from(candidatas.values())
    .filter((d) => d.id !== original.id && (d.ano * 12 + d.mes) > currentAbs);
}

// Atualiza a compra e propaga descrição/valor/tipo/cartão/fixa para os meses futuros relacionados,
// mantendo o mês/ano e a parcela atual de cada um. Compras antigas sem grupoId recebem um novo grupoId.
export async function updateCompraAndFuture(id: string, c: Omit<CompraParcelada, 'id'>, original: CompraParcelada): Promise<void> {
  const futuras = await getComprasFuturasDoGrupo(original);
  const grupoId = original.grupoId ?? makeGrupoId();
  await setDoc(doc(db, 'compras', id), { ...c, grupoId });

  const { mes: _mes, ano: _ano, parcelaAtual: _parcelaAtual, ...resto } = c;
  await Promise.all(
    futuras.map((f) => setDoc(doc(db, 'compras', f.id!), { ...resto, mes: f.mes, ano: f.ano, parcelaAtual: f.parcelaAtual, grupoId }, { merge: true })),
  );
}

// Todas as compras da mesma série, exceto a própria. Com grupoId usa só o grupo
// (preciso); sem grupoId cai na heurística cartão + descrição + fixa (legado).
export async function getComprasDoGrupo(original: CompraParcelada): Promise<CompraParcelada[]> {
  if (original.grupoId) {
    const snap = await getDocs(query(collection(db, 'compras'), where('grupoId', '==', original.grupoId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompraParcelada)).filter((d) => d.id !== original.id);
  }
  const snap = await getDocs(query(
    collection(db, 'compras'),
    where('cartaoId', '==', original.cartaoId),
    where('descricao', '==', original.descricao),
  ));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CompraParcelada))
    .filter((d) => d.id !== original.id && (d.fixa ?? false) === (original.fixa ?? false));
}

// Reparcelamento: quando o número de parcelas muda na edição, reconstrói a série.
// - Atualiza a parcela editada (no mês atual) e as passadas com os novos dados da série.
// - Apaga as parcelas futuras antigas e recria de acordo com o novo total.
export async function updateCompraReparcelada(id: string, c: Omit<CompraParcelada, 'id'>, original: CompraParcelada): Promise<void> {
  const grupoId = original.grupoId ?? makeGrupoId();
  const currentAbs = c.ano * 12 + c.mes;
  const doGrupo = await getComprasDoGrupo(original);
  const { mes: _mes, ano: _ano, parcelaAtual: _parcelaAtual, ...serie } = c;

  // parcela editada
  await setDoc(doc(db, 'compras', id), { ...c, grupoId });

  // passadas: atualiza dados da série (mantém mês/parcela); futuras: apaga (serão recriadas)
  await Promise.all(doGrupo.map((d) => {
    const abs = d.ano * 12 + d.mes;
    if (abs > currentAbs) return deleteDoc(doc(db, 'compras', d.id!));
    return setDoc(doc(db, 'compras', d.id!), { ...serie, mes: d.mes, ano: d.ano, parcelaAtual: d.parcelaAtual, grupoId }, { merge: true });
  }));

  // recria as parcelas seguintes conforme o novo total
  const restantes = c.totalParcelas - c.parcelaAtual;
  await Promise.all(Array.from({ length: Math.max(0, restantes) }, (_, i) => {
    const pos = addMonths(c.mes, c.ano, i + 1);
    return addDoc(collection(db, 'compras'), { ...serie, grupoId, parcelaAtual: c.parcelaAtual + i + 1, mes: pos.mes, ano: pos.ano });
  }));
}

// Ativa/desativa fixa: cria 24 cópias ou apaga todas as futuras do mesmo grupoId
export async function toggleCompraFixa(id: string, compra: CompraParcelada, tornarFixa: boolean): Promise<void> {
  const { id: _id, grupoId: _grupoId, ...data } = compra;
  if (tornarFixa) {
    const grupoId = makeGrupoId();
    await Promise.all([
      setDoc(doc(db, 'compras', id), { ...data, fixa: true, grupoId }),
      ...Array.from({ length: 24 }, (_, i) => {
        const { mes, ano } = addMonths(compra.mes, compra.ano, i + 1);
        return addDoc(collection(db, 'compras'), { ...data, fixa: true, grupoId, mes, ano });
      }),
    ]);
  } else {
    await setDoc(doc(db, 'compras', id), { ...data, fixa: false });
    if (compra.grupoId) {
      const snap = await getDocs(query(collection(db, 'compras'), where('grupoId', '==', compra.grupoId)));
      const currentAbs = compra.ano * 12 + compra.mes;
      await Promise.all(
        snap.docs
          .filter((d) => { const x = d.data(); return d.id !== id && (x.ano * 12 + x.mes) > currentAbs; })
          .map((d) => deleteDoc(d.ref)),
      );
    }
  }
}

export async function deleteCompra(id: string): Promise<void> {
  await deleteDoc(doc(db, 'compras', id));
}

// Apaga a compra e todos os meses futuros com o mesmo grupoId
export async function deleteCompraAndFuture(id: string, compra: CompraParcelada): Promise<void> {
  await deleteDoc(doc(db, 'compras', id));
  if (compra.grupoId) {
    const snap = await getDocs(query(collection(db, 'compras'), where('grupoId', '==', compra.grupoId)));
    const currentAbs = compra.ano * 12 + compra.mes;
    await Promise.all(
      snap.docs
        .filter((d) => { const x = d.data(); return d.id !== id && (x.ano * 12 + x.mes) > currentAbs; })
        .map((d) => deleteDoc(d.ref)),
    );
  }
}

export async function getComprasHistorico(): Promise<CompraParcelada[]> {
  const snap = await getDocs(collection(db, 'compras'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompraParcelada));
}

// ─── Faturas de Cartão ───────────────────────────────────────────────────────

export async function getFaturasCartao(mes: number, ano: number): Promise<FaturaCartao[]> {
  const q = query(collection(db, 'faturas_cartao'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaturaCartao));
}

export async function getFaturasCartaoHistorico(): Promise<FaturaCartao[]> {
  const snap = await getDocs(collection(db, 'faturas_cartao'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaturaCartao));
}

export async function setFaturaCartaoStatus(
  cartaoId: string, mes: number, ano: number, status: 'pago' | 'pendente',
): Promise<void> {
  const docId = `${cartaoId}_${String(mes).padStart(2, '0')}_${ano}`;
  // merge para preservar o valorAjustado eventualmente gravado
  await setDoc(doc(db, 'faturas_cartao', docId), { cartaoId, mes, ano, status }, { merge: true });
}

// Ajuste manual do valor da fatura no mês (não altera as compras). null limpa o ajuste.
export async function setFaturaCartaoValor(
  cartaoId: string, mes: number, ano: number, valorAjustado: number | null,
): Promise<void> {
  const docId = `${cartaoId}_${String(mes).padStart(2, '0')}_${ano}`;
  await setDoc(doc(db, 'faturas_cartao', docId), { cartaoId, mes, ano, valorAjustado }, { merge: true });
}

// ─── Categorias de Empresa ───────────────────────────────────────────────────

export async function getCategoriasEmpresa(): Promise<CategoriaEmpresa[]> {
  const snap = await getDocs(collection(db, 'categorias_empresa'));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaEmpresa));
  await Promise.all(DEFAULT_CATEGORIAS_EMPRESA.map((c) => addDoc(collection(db, 'categorias_empresa'), c)));
  const seeded = await getDocs(collection(db, 'categorias_empresa'));
  return seeded.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaEmpresa));
}

export async function addCategoriaEmpresa(c: Omit<CategoriaEmpresa, 'id'>): Promise<void> {
  await addDoc(collection(db, 'categorias_empresa'), c);
}

export async function deleteCategoriaEmpresa(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categorias_empresa', id));
}

// ─── Custos Empresa ──────────────────────────────────────────────────────────

export async function getCustosEmpresa(mes: number, ano: number): Promise<CustoEmpresa[]> {
  const q = query(collection(db, 'custos_empresa'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustoEmpresa));
}

export async function addCustoEmpresa(c: Omit<CustoEmpresa, 'id'>): Promise<void> {
  const grupoId = makeGrupoId();
  const remaining = c.totalParcelas - c.parcelaAtual + 1;
  await Promise.all(
    Array.from({ length: remaining }, (_, i) => {
      const { mes, ano } = addMonths(c.mes, c.ano, i);
      return addDoc(collection(db, 'custos_empresa'), { ...c, grupoId, parcelaAtual: c.parcelaAtual + i, mes, ano });
    }),
  );
}

export async function updateCustoEmpresa(id: string, c: Omit<CustoEmpresa, 'id'>): Promise<void> {
  await setDoc(doc(db, 'custos_empresa', id), c);
}

// Todos os custos da mesma série, exceto o próprio. Com grupoId usa só o grupo;
// sem grupoId (legado) cai na heurística categoria + descrição + total de parcelas.
export async function getCustosDoGrupo(original: CustoEmpresa): Promise<CustoEmpresa[]> {
  if (original.grupoId) {
    const snap = await getDocs(query(collection(db, 'custos_empresa'), where('grupoId', '==', original.grupoId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustoEmpresa)).filter((d) => d.id !== original.id);
  }
  const snap = await getDocs(query(
    collection(db, 'custos_empresa'),
    where('categoriaId', '==', original.categoriaId),
    where('descricao', '==', original.descricao),
  ));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CustoEmpresa))
    .filter((d) => d.id !== original.id && d.totalParcelas === original.totalParcelas);
}

// Reparcelamento do custo: reconstrói a série na edição (muda nº de parcelas ou propaga
// valor/descrição para os meses seguintes). Mantém as passadas, apaga as futuras antigas
// e recria conforme o novo total.
export async function updateCustoReparcelado(id: string, c: Omit<CustoEmpresa, 'id'>, original: CustoEmpresa): Promise<void> {
  const grupoId = original.grupoId ?? makeGrupoId();
  const currentAbs = c.ano * 12 + c.mes;
  const doGrupo = await getCustosDoGrupo(original);
  const { mes: _mes, ano: _ano, parcelaAtual: _parcelaAtual, ...serie } = c;

  // parcela editada
  await setDoc(doc(db, 'custos_empresa', id), { ...c, grupoId });

  // passadas: atualiza dados da série (mantém mês/parcela); futuras: apaga (serão recriadas)
  await Promise.all(doGrupo.map((d) => {
    const abs = d.ano * 12 + d.mes;
    if (abs > currentAbs) return deleteDoc(doc(db, 'custos_empresa', d.id!));
    return setDoc(doc(db, 'custos_empresa', d.id!), { ...serie, mes: d.mes, ano: d.ano, parcelaAtual: d.parcelaAtual, grupoId }, { merge: true });
  }));

  // recria as parcelas seguintes conforme o novo total
  const restantes = c.totalParcelas - c.parcelaAtual;
  await Promise.all(Array.from({ length: Math.max(0, restantes) }, (_, i) => {
    const pos = addMonths(c.mes, c.ano, i + 1);
    return addDoc(collection(db, 'custos_empresa'), { ...serie, grupoId, parcelaAtual: c.parcelaAtual + i + 1, mes: pos.mes, ano: pos.ano });
  }));
}

export async function deleteCustoEmpresa(id: string): Promise<void> {
  await deleteDoc(doc(db, 'custos_empresa', id));
}

// Apaga o custo e todos os meses futuros da mesma série.
// Séries novas têm grupoId; séries antigas (criadas antes desse campo existir)
// são identificadas por categoria + descrição + valor + total de parcelas.
export async function deleteCustoEmpresaAndFuture(id: string, custo: CustoEmpresa): Promise<void> {
  await deleteDoc(doc(db, 'custos_empresa', id));
  const currentAbs = custo.ano * 12 + custo.mes;

  const snap = custo.grupoId
    ? await getDocs(query(collection(db, 'custos_empresa'), where('grupoId', '==', custo.grupoId)))
    : await getDocs(collection(db, 'custos_empresa'));

  await Promise.all(
    snap.docs
      .filter((d) => {
        if (d.id === id) return false;
        const x = d.data() as CustoEmpresa;
        if ((x.ano * 12 + x.mes) <= currentAbs) return false;
        if (custo.grupoId) return true;
        return x.categoriaId === custo.categoriaId && x.descricao === custo.descricao
          && x.valor === custo.valor && x.totalParcelas === custo.totalParcelas;
      })
      .map((d) => deleteDoc(d.ref)),
  );
}

export async function getCustosEmpresaHistorico(): Promise<CustoEmpresa[]> {
  const snap = await getDocs(collection(db, 'custos_empresa'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustoEmpresa));
}

// ─── Faturas Empresa ─────────────────────────────────────────────────────────

export async function getFaturasEmpresa(mes: number, ano: number): Promise<FaturaEmpresa[]> {
  const q = query(collection(db, 'faturas_empresa'), where('mes', '==', mes), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaturaEmpresa));
}

export async function setFaturaEmpresaStatus(
  categoriaId: string, mes: number, ano: number, status: 'pago' | 'pendente',
): Promise<void> {
  const docId = `${categoriaId}_${String(mes).padStart(2, '0')}_${ano}`;
  await setDoc(doc(db, 'faturas_empresa', docId), { categoriaId, mes, ano, status });
}

// ─── Metas do Ano ────────────────────────────────────────────────────────────

export async function getMetas(ano: number): Promise<Meta[]> {
  const q = query(collection(db, 'metas'), where('ano', '==', ano));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meta));
}

export async function addMeta(m: Omit<Meta, 'id'>): Promise<void> {
  await addDoc(collection(db, 'metas'), m);
}

export async function updateMeta(id: string, m: Omit<Meta, 'id'>): Promise<void> {
  await setDoc(doc(db, 'metas', id), m);
}

export async function deleteMeta(id: string): Promise<void> {
  await deleteDoc(doc(db, 'metas', id));
}

// ─── Notas do Mês ────────────────────────────────────────────────────────────

function notaDocId(mes: number, ano: number): string {
  return `${ano}_${String(mes).padStart(2, '0')}`;
}

export async function getNotaMes(mes: number, ano: number): Promise<NotaMes | null> {
  const snap = await getDoc(doc(db, 'notas_mes', notaDocId(mes, ano)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as NotaMes;
}

export async function saveNotaMes(mes: number, ano: number, texto: string): Promise<void> {
  await setDoc(doc(db, 'notas_mes', notaDocId(mes, ano)), { mes, ano, texto, updatedAt: Date.now() });
}
