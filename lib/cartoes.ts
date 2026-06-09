import type { Cartao, CategoriaCompra } from './types';

export const DEFAULT_CARTOES: Omit<Cartao, 'id'>[] = [
  { nome: 'Bradesco', cor: '#CC0000', bandeira: 'Visa' },
  { nome: 'Nubank',   cor: '#820AD1', bandeira: 'Mastercard' },
  { nome: 'Sicob',    cor: '#16a34a', bandeira: 'Visa' },
  { nome: 'Inter',    cor: '#FF7A00', bandeira: 'Mastercard' },
];

export const DEFAULT_CATEGORIAS: Omit<CategoriaCompra, 'id'>[] = [
  { nome: 'Saúde',     cor: '#10b981' },
  { nome: 'Casa',      cor: '#6366f1' },
  { nome: 'Filhos',    cor: '#f59e0b' },
  { nome: 'Comida',    cor: '#ef4444' },
  { nome: 'Besteiras', cor: '#ec4899' },
];
