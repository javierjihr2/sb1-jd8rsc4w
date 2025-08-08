
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

Genera una estrategia completa que cubra todas las fases del juego. Sé específico y proporciona instrucciones claras. El tono debe ser autoritario y experto. El plan para el final del juego debe tener muy en cuenta tu conocimiento de los cambios de zona comunes y los círculos finales para el mapa seleccionado.

Proporciona la respuesta en el formato JSON solicitado. Los consejos deben ser concisos y muy relevantes para la estrategia.`,
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
