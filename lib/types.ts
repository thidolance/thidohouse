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

// Saque manual de uma reserva (ex: usou parte do dinheiro de Planos Futuros).
// Abate do balanço acumulado daquela categoria no mês em que foi feito.
export interface SaqueReserva {
  id?: string;
  categoria: 'ferias' | 'investimento' | 'planosFuturos';
  valor: number;
  descricao?: string;
  mes: number;
  ano: number;
}

export interface CategoriaContaConfig {
  id?: string;
  nome: string;
  cor: string;
}

export interface Conta {
  id?: string;
  descricao: string;
  categoria: string;
  valor: number;
  vencimento: number;
  status: 'pago' | 'pendente';
  mes: number;
  ano: number;
  parcelaAtual?: number;
  totalParcelas?: number;
  fixa?: boolean;
  grupoId?: string;
}

export interface Cartao {
  id?: string;
  nome: string;
  cor: string;
  bandeira?: 'Visa' | 'Mastercard';
  limite?: number;
}

export interface CategoriaCompra {
  id?: string;
  nome: string;
  cor: string;
}

export interface CategoriaEmpresa {
  id?: string;
  nome: string;
  cor: string;
}

export interface CustoEmpresa {
  id?: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  valorParcela: number;
  totalParcelas: number;
  parcelaAtual: number;
  mes: number;
  ano: number;
  grupoId?: string;
  fixa?: boolean;
}

export interface FaturaEmpresa {
  id?: string;
  categoriaId: string;
  status: 'pago' | 'pendente';
  mes: number;
  ano: number;
}

export interface FaturaCartao {
  id?: string;
  cartaoId: string;
  status: 'pago' | 'pendente';
  mes: number;
  ano: number;
  // Valor ajustado manualmente na aba Contas (ex: imposto/itens não lançados).
  // Quando definido, sobrepõe a soma das compras só na exibição da fatura.
  valorAjustado?: number | null;
}

export interface CompraParcelada {
  id?: string;
  cartaoId: string;
  descricao: string;
  tipo: string;
  valorTotal: number;
  valorParcela: number;
  totalParcelas: number;
  parcelaAtual: number;
  mes: number;
  ano: number;
  grupoId?: string;
  fixa?: boolean;
  data?: string;
}

export interface Meta {
  id?: string;
  ano: number;
  nome: string;
  valor: number;
  concluida: boolean;
  link?: string;
}

export interface NotaMes {
  id?: string;
  mes: number;
  ano: number;
  texto: string;
  updatedAt: number;
}
