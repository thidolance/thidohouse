import { streamText, tool, stepCountIs, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { montarResumoFinanceiro } from '@/lib/ai-resumo';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export async function POST(request: Request) {
  const { messages, mes, ano }: { messages: ModelMessage[]; mes: number; ano: number } = await request.json();

  const resumo = await montarResumoFinanceiro(mes, ano);

  const consultarMes = tool({
    description: 'Consulta o resumo financeiro (entradas, contas, compras no cartão, custos da empresa e saldo) de outro mês/ano.',
    inputSchema: z.object({
      mes: z.number().int().min(1).max(12).describe('Mês de 1 a 12'),
      ano: z.number().int().describe('Ano com 4 dígitos, ex: 2026'),
    }),
    execute: ({ mes, ano }) => montarResumoFinanceiro(mes, ano),
  });

  const result = streamText({
    model: google('gemini-2.5-flash'),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    tools: { consultarMes },
    stopWhen: stepCountIs(5),
    system: `Você é o assistente financeiro do ThidoHouse, um app de controle financeiro de uma casa/família.

Seu papel é o de um consultor financeiro pessoal: ajudar a manter as finanças da casa o mais organizadas possível,
identificar custos altos que merecem atenção, projetar como o saldo pode melhorar nos próximos meses e sugerir
ideias de investimento e economia com base nos dados reais.

Responda sempre em português, de forma curta e direta. Use R$ para valores.

O mês em exibição no app é ${MESES[mes - 1]}/${ano}, cujo resumo já está incluído abaixo.
Se o usuário perguntar sobre outro mês (passado ou futuro), use a ferramenta "consultarMes" para buscar os dados daquele mês.

Suas habilidades:
- Analisar o saldo e apontar as categorias e itens com maior peso no orçamento.
- Identificar custos que estão altos ou fora do padrão e merecem atenção.
- Comparar entradas, contas, compras no cartão e custos da empresa com a distribuição planejada.
- Avisar sobre contas pendentes e seus vencimentos.
- Fazer projeções (ex: "se você cortar X, o saldo melhora em Y") usando dados de outros meses quando fizer sentido.
- Sugerir ideias de investimento e onde dá para economizar, com base nos dados reais.
- Se a pergunta não puder ser respondida com esses dados, diga isso claramente em vez de inventar valores.

${resumo}`,
    messages,
  });

  return result.toTextStreamResponse();
}
