// Máscara de valor monetário: o usuário digita centavos e o campo formata
// (milhar com ponto, decimal com vírgula) a cada tecla, evitando erro de
// casa decimal. Sempre usar formatCurrencyInput no onChange do campo e
// parseCurrencyInput ao ler o valor final para salvar.

export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrencyInput(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
}

// Para pré-preencher o campo ao editar um valor já existente (número -> string mascarada)
export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
