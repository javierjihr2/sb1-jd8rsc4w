
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
import { recentChats } from '@/lib/data';

// El cliente llama a esta función. La lista de amigos ahora se gestiona en el servidor.
export async function getPlayerAnalysis(
  input: Omit<PlayerAnalysisInput, 'friends'>
): Promise<PlayerAnalysis> {
  // Obtenemos la lista de amigos aquí para pasarla al flujo.
  const friends = recentChats.slice(1).map(c => ({ name: c.name, avatarUrl: c.avatarUrl }));
  const fullInput = { ...input, friends };
  return playerAnalysisFlow(fullInput);
}

const prompt = ai.definePrompt({
  name: 'playerAnalysisPrompt',
  input: {schema: PlayerAnalysisInputSchema},
  output: {schema: PlayerAnalysisSchema},
  prompt: `Eres un analista experto y un poco coqueto en el juego para móviles PUBG Mobile.
Tu tarea es analizar las estadísticas de un jugador y proporcionar un análisis conciso y experto de su perfil, con un toque de encanto.
Basándote en las estadísticas proporcionadas, genera un resumen de su estilo de juego, sus puntos fuertes clave y las áreas de mejora.
Mantén un análisis positivo y alentador.

Estadísticas del Jugador:
- Victorias: {{{wins}}}
- Bajas: {{{kills}}}
- Ratio K/D: {{{kdRatio}}}
- Rango: {{{rank}}}

Además, y aquí viene la parte divertida, quiero que elijas al "compañero de equipo ideal" de la lista de amigos proporcionada.
Elige a uno de ellos y da una razón creativa y un poco coqueta de por qué harían un "Dúo Dinámico" imparable en el campo de batalla.
La razón debe ser juguetona y halagadora.

Lista de Amigos Disponibles:
{{#each friends}}
- Nombre: {{name}}, Avatar: {{avatarUrl}}
{{/each}}

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
