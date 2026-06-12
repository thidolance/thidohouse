import {
  getEntradas, getContas, getCompras, getCartoes,
  getCustosEmpresa, getCategoriasEmpresa, getDistribuicao,
} from './firestore';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Monta um resumo em texto dos dados financeiros do mês, usado como contexto para o assistente de IA
export async function montarResumoFinanceiro(mes: number, ano: number): Promise<string> {
  const [entradas, contas, compras, cartoes, custosEmpresa, categoriasEmpresa, distribuicao] = await Promise.all([
    getEntradas(mes, ano),
    getContas(mes, ano),
    getCompras(mes, ano),
    getCartoes(),
    getCustosEmpresa(mes, ano),
    getCategoriasEmpresa(),
    getDistribuicao(mes, ano),
  ]);

  const cartaoNome = (id: string) => cartoes.find((c) => c.id === id)?.nome ?? 'cartão';
  const categoriaEmpresaNome = (id: string) => categoriasEmpresa.find((c) => c.id === id)?.nome ?? 'outros';

  const totalEntradas = entradas.reduce((s, e) => s + e.valor, 0);
  const totalContas = contas.reduce((s, c) => s + c.valor, 0);
  const totalContasPendentes = contas.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const totalCompras = compras.reduce((s, c) => s + c.valorParcela, 0);
  const totalEmpresa = custosEmpresa.reduce((s, c) => s + c.valorParcela, 0);
  const saldo = totalEntradas - totalContas - totalCompras - totalEmpresa;

  const linhas: string[] = [];
  linhas.push(`Resumo financeiro de ${MESES[mes - 1]}/${ano}:`);

  linhas.push('');
  linhas.push(`ENTRADAS (total: ${brl(totalEntradas)}):`);
  if (entradas.length === 0) linhas.push('- nenhuma entrada cadastrada');
  entradas.forEach((e) => linhas.push(`- ${e.descricao}: ${brl(e.valor)} (${e.data})`));

  if (distribuicao) {
    linhas.push('');
    linhas.push('DISTRIBUIÇÃO PLANEJADA DAS ENTRADAS:');
    linhas.push(`- Contas: ${brl(distribuicao.contas)}`);
    linhas.push(`- Férias: ${brl(distribuicao.ferias)}`);
    linhas.push(`- Investimento: ${brl(distribuicao.investimento)}`);
    linhas.push(`- Metas do ano: ${brl(distribuicao.planosFuturos)}`);
  }

  linhas.push('');
  linhas.push(`CONTAS DO MÊS (total: ${brl(totalContas)}, pendente: ${brl(totalContasPendentes)}):`);
  if (contas.length === 0) linhas.push('- nenhuma conta cadastrada');
  contas.forEach((c) => {
    const parcela = c.totalParcelas ? ` (parcela ${c.parcelaAtual}/${c.totalParcelas})` : '';
    const fixa = c.fixa ? ' [fixa]' : '';
    linhas.push(`- ${c.descricao} [${c.categoria}]: ${brl(c.valor)} - vence dia ${c.vencimento} - ${c.status}${parcela}${fixa}`);
  });

  linhas.push('');
  linhas.push(`COMPRAS NO CARTÃO (total das parcelas do mês: ${brl(totalCompras)}):`);
  if (compras.length === 0) linhas.push('- nenhuma compra cadastrada');
  compras.forEach((c) => {
    linhas.push(`- ${c.descricao} [${cartaoNome(c.cartaoId)}, ${c.tipo}]: ${brl(c.valorParcela)} (parcela ${c.parcelaAtual}/${c.totalParcelas})`);
  });

  linhas.push('');
  linhas.push(`CUSTOS DA EMPRESA (total: ${brl(totalEmpresa)}):`);
  if (custosEmpresa.length === 0) linhas.push('- nenhum custo cadastrado');
  custosEmpresa.forEach((c) => {
    linhas.push(`- ${c.descricao} [${categoriaEmpresaNome(c.categoriaId)}]: ${brl(c.valorParcela)} (parcela ${c.parcelaAtual}/${c.totalParcelas})`);
  });

  linhas.push('');
  linhas.push(`SALDO DO MÊS (entradas - contas - compras no cartão - custos da empresa): ${brl(saldo)}`);

  return linhas.join('\n');
}
