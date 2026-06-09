export interface Entrada {
  id?: string;
  descricao: string;
  valor: number;
  data: string;
  mes: number;
  ano: number;
}

export interface Distribuicao {
  id?: string;
  mes: number;
  ano: number;
  contas: number;
  ferias: number;
  investimento: number;
  planosFuturos: number;
}

export type CategoriaContas =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros';

export interface Conta {
  id?: string;
  descricao: string;
  categoria: CategoriaContas;
  valor: number;
  vencimento: number;
  status: 'pago' | 'pendente';
  mes: number;
  ano: number;
  parcelaAtual?: number;
  totalParcelas?: number;
}

export interface Cartao {
  id?: string;
  nome: string;
  cor: string;
}

export type TipoCompra = 'Saúde' | 'Casa' | 'Filhos' | 'Comida' | 'Besteiras';

export interface FaturaCartao {
  id?: string;
  cartaoId: string;
  status: 'pago' | 'pendente';
  mes: number;
  ano: number;
}

export interface CompraParcelada {
  id?: string;
  cartaoId: string;
  descricao: string;
  tipo: TipoCompra;
  valorTotal: number;
  valorParcela: number;
  totalParcelas: number;
  parcelaAtual: number;
  mes: number;
  ano: number;
}
