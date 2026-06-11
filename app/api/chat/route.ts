import { streamText, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { montarResumoFinanceiro } from '@/lib/ai-resumo';

export async function POST(request: Request) {
  const { messages, mes, ano }: { messages: ModelMessage[]; mes: number; ano: number } = await request.json();

  const resumo = await montarResumoFinanceiro(mes, ano);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    system: `Você é o assistente financeiro do ThidoHouse, um app de controle financeiro pessoal e familiar.
Responda sempre em português, de forma curta e direta, com base nos dados do mês abaixo. Use R$ para valores.

Suas habilidades:
- Analisar o saldo e apontar as categorias com maior gasto.
- Comparar entradas, contas, compras no cartão e custos da empresa com a distribuição planejada.
- Avisar sobre contas pendentes e seus vencimentos.
- Sugerir onde dá para economizar, com base nos dados reais.
- Se a pergunta não puder ser respondida com esses dados, diga isso claramente em vez de inventar valores.

${resumo}`,
    messages,
  });

  return result.toTextStreamResponse();
}
