
'use server';
/**
 * @fileOverview An AI agent for comparing two player profiles.
 *
 * - comparePlayers - A function that handles the player comparison process.
 * - PlayerComparisonInput - The input type for the comparePlayers function.
 * - PlayerComparison - The return type for the comparePlayers function.
 */

import {ai} from '@/ai/genkit';
import {
    PlayerComparisonInputSchema, 
    PlayerComparisonSchema, 
    type PlayerComparison, 
    type PlayerComparisonInput
} from '../schemas';

export async function comparePlayers(input: PlayerComparisonInput): Promise<PlayerComparison> {
  return playerComparisonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerComparisonPrompt',
  input: {schema: PlayerComparisonInputSchema},
  output: {schema: PlayerComparisonSchema},
  prompt: `Eres un analista táctico experto de eSports para PUBG Mobile. Tu tarea es comparar los perfiles de dos jugadores y proporcionar un análisis conciso y directo de su sinergia.

Perfiles de los Jugadores:
- Jugador 1:
  - Nombre: {{{player1.name}}}
  - Rango: {{{player1.rank}}}
  - Victorias: {{{player1.stats.wins}}}
  - Bajas: {{{player1.stats.kills}}}
  - K/D Ratio: {{{player1.stats.kdRatio}}}
  - Armas Favoritas: {{{player1.favoriteWeapons}}}
  - Horario de Juego: {{{player1.playSchedule}}}

- Jugador 2:
  - Nombre: {{{player2.name}}}
  - Rango: {{{player2.rank}}}
  - Victorias: {{{player2.stats.wins}}}
  - Bajas: {{{player2.stats.kills}}}
  - K/D Ratio: {{{player2.stats.kdRatio}}}
  - Armas Favoritas: {{{player2.favoriteWeapons}}}
  - Horario de Juego: {{{player2.playSchedule}}}

Instrucciones:
1.  **Análisis de Sinergia:** En 2-3 frases, describe cómo sus estilos de juego se complementan. Sé directo y evita el texto de relleno.
2.  **Fortalezas Combinadas:** Enumera 2-3 fortalezas clave que este dúo tendría. Sé breve y usa viñetas.
3.  **Consejos para el Dúo:** Ofrece 2 consejos prácticos y accionables para que maximicen su potencial. Cada consejo debe ser una sola frase.
4.  **Veredicto:** Ofrece un veredicto final en una sola frase concisa sobre su potencial como dúo.

Sé claro, profesional y muy breve en tu análisis. Prioriza la información accionable sobre las descripciones largas. Asegúrate de que la salida esté en el formato JSON solicitado.`,
});

const playerComparisonFlow = ai.defineFlow(
  {
    name: 'playerComparisonFlow',
    inputSchema: PlayerComparisonInputSchema,
    outputSchema: PlayerComparisonSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una comparación válida.");
    }
    return output;
  }
);
