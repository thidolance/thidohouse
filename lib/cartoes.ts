import type { Cartao, CategoriaCompra } from './types';

export const DEFAULT_CARTOES: Omit<Cartao, 'id'>[] = [
  { nome: 'Bradesco', cor: '#CC0000', bandeira: 'Visa' },
  { nome: 'Nubank',   cor: '#820AD1', bandeira: 'Mastercard' },
  { nome: 'Sicob',    cor: '#16a34a', bandeira: 'Visa' },
  { nome: 'Inter',    cor: '#FF7A00', bandeira: 'Mastercard' },
];

export const DEFAULT_CATEGORIAS: Omit<CategoriaCompra, 'id'>[] = [
  { nome: 'Mercado',     cor: '#16a34a', icone: 'mercado' },
  { nome: 'Comida',      cor: '#ef4444', icone: 'comida' },
  { nome: 'Carro',       cor: '#3b82f6', icone: 'carro' },
  { nome: 'Abastecimento', cor: '#eab308', icone: 'abastecimento' },
  { nome: 'Filhos',      cor: '#f59e0b', icone: 'filhos' },
  { nome: 'Besteiras',   cor: '#ec4899', icone: 'besteiras' },
  { nome: 'Entretenimento', cor: '#0ea5e9', icone: 'entretenimento' },
  { nome: 'Farmácia',    cor: '#06b6d4', icone: 'farmacia' },
  { nome: 'Educação',    cor: '#8b5cf6', icone: 'educacao' },
  { nome: 'Academia',    cor: '#f97316', icone: 'academia' },
  { nome: 'Streaming',   cor: '#d946ef', icone: 'streaming' },
  { nome: 'Assinaturas', cor: '#14b8a6', icone: 'assinaturas' },
  { nome: 'Trabalho',    cor: '#64748b', icone: 'trabalho' },
  { nome: 'Casa',        cor: '#6366f1', icone: 'casa' },
  { nome: 'Outros',      cor: '#94a3b8', icone: 'outro' },
];
