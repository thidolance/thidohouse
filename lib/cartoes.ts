export const CARTOES = [
  { id: 'bradesco', nome: 'Bradesco', cor: '#CC0000', bgGrad: 'from-red-600 to-red-700',       bandeira: 'Visa'        },
  { id: 'nubank',   nome: 'Nubank',   cor: '#820AD1', bgGrad: 'from-purple-700 to-purple-800', bandeira: 'Mastercard'  },
  { id: 'sicob',    nome: 'Sicob',    cor: '#16a34a', bgGrad: 'from-green-600 to-green-700',   bandeira: 'Visa'        },
  { id: 'inter',    nome: 'Inter',    cor: '#FF7A00', bgGrad: 'from-orange-500 to-orange-600', bandeira: 'Mastercard'  },
] as const;

export type CartaoId = (typeof CARTOES)[number]['id'];
