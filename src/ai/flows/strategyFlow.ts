
'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile game strategies.
 *
 * - getStrategy - A function that handles the strategy generation process.
 * - StrategyInput - The input type for the getStrategy function.
 * - Strategy - The return type for the getStrategy function.
 */

import {ai} from '@/ai/genkit';
import { StrategyInputSchema, StrategySchema, type Strategy, type StrategyInput } from '../schemas';

export async function getStrategy(input: StrategyInput): Promise<Strategy> {
  return strategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategyPrompt',
  input: {schema: StrategyInputSchema},
  output: {schema: StrategySchema},
  prompt: `Eres un entrenador táctico de PUBG Mobile de clase mundial. Eres un experto en las ubicaciones más probables de las zonas finales para cada mapa. Tu tarea es generar una estrategia de juego detallada, profesional y accionable basada en las preferencias del usuario.

El usuario quiere jugar en el mapa '{{{map}}}' con una escuadra de {{{squadSize}}} jugador(es) y adoptar un estilo de juego '{{{playStyle}}}'.

Genera una estrategia completa que cubra todas las fases del juego. Sé específico y proporciona instrucciones claras y concisas. El tono debe ser autoritario y experto.

Instrucciones:
1.  **strategyTitle**: Un título creativo y descriptivo para la estrategia.
2.  **dropZone**: Recomienda una zona de aterrizaje específica y da una razón táctica para ello.
3.  **earlyGame**: Define un plan para la fase inicial (looteo, primera rotación).
4.  **midGame**: Define un plan para la fase media (control de zonas, cuándo luchar).
5.  **lateGame**: Define un plan para el final de la partida (posicionamiento en el círculo final, control de zonas de poder).
6.  **lateGame.zonePrediction**: Basándote en tu conocimiento experto del mapa '{{{map}}}', predice una ubicación probable para el círculo final. Nombra la ubicación y da una razón táctica de por qué esa zona es un final común o ventajoso.
7.  **tips**: Ofrece 2-3 consejos tácticos esenciales para ejecutar con éxito el plan.

Proporciona la respuesta en el formato JSON solicitado. Los consejos deben ser concisos y muy relevantes para la estrategia.
`,
});

const strategyFlow = ai.defineFlow(
  {
    name: 'strategyFlow',
    inputSchema: StrategyInputSchema,
    outputSchema: StrategySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una estrategia válida.");
    }
    return output;
  }
);
