
'use server';
/**
 * @fileOverview A player analysis AI agent.
 *
 * - getPlayerAnalysis - A function that handles the player analysis process.
 * - PlayerAnalysisInput - The input type for the getPlayerAnalysis function.
 * - PlayerAnalysis - The return type for the getPlayerAnalysis function.
 */

import {ai} from '@/ai/genkit';
import { PlayerAnalysisInputSchema, PlayerAnalysisSchema, type PlayerAnalysis, type PlayerAnalysisInput } from '../schemas';

export async function getPlayerAnalysis(
  input: PlayerAnalysisInput
): Promise<PlayerAnalysis> {
  return playerAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerAnalysisPrompt',
  input: {schema: PlayerAnalysisInputSchema},
  output: {schema: PlayerAnalysisSchema},
  prompt: `Eres un analista experto en el juego para móviles PUBG Mobile.
Tu tarea es analizar las estadísticas de un jugador y proporcionar un análisis conciso y experto de su perfil.
Basándote en las estadísticas proporcionadas, genera un resumen de su estilo de juego, sus puntos fuertes clave y las áreas de mejora.
Mantén un análisis positivo y alentador.

Estadísticas del Jugador:
- Victorias: {{{wins}}}
- Bajas: {{{kills}}}
- Ratio K/D: {{{kdRatio}}}
- Rango: {{{rank}}}

Proporciona el análisis en el formato JSON solicitado.`,
});

const playerAnalysisFlow = ai.defineFlow(
  {
    name: 'playerAnalysisFlow',
    inputSchema: PlayerAnalysisInputSchema,
    outputSchema: PlayerAnalysisSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("El modelo de IA no devolvió un análisis válido.");
    }
    return output;
  }
);
