
'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile game plans.
 *
 * - getMapPlan - A function that handles the game plan generation process.
 * - MapPlannerInput - The input type for the getMapPlan function.
 * - MapPlanner - The return type for the getMapPlan function.
 */

import {ai} from '@/ai/genkit';
import { MapPlannerInputSchema, MapPlannerSchema, type MapPlanner, type MapPlannerInput } from '../schemas';

export async function getMapPlan(input: MapPlannerInput): Promise<MapPlanner> {
  return mapPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mapPlannerPrompt',
  input: {schema: MapPlannerInputSchema},
  output: {schema: MapPlannerSchema},
  prompt: `Eres un "Planificador de Partidas" experto de PUBG Mobile. Tu tarea es generar un plan de partida completo, profesional y accionable basado en las preferencias del usuario.

Parámetros de la Partida:
- Mapa: {{{map}}}
- Estilo de Juego: {{{playStyle}}}
- Tamaño de Escuadra: {{{squadSize}}}
- Nivel de Riesgo: {{{riskLevel}}}
- Enfoque Principal: {{{focus}}}

Instrucciones para generar el plan:
1.  **planTitle**: Crea un título creativo y descriptivo para el plan (ej: "Dominación Sigilosa en Erangel", "Asalto Total en Sanhok").
2.  **dropZone**: Recomienda una zona de aterrizaje específica. La recomendación debe basarse en el mapa y el **Nivel de Riesgo**. Un riesgo bajo implica zonas más seguras y aisladas, mientras que un riesgo alto implica "hot drops" (zonas de alta concurrencia). Justifica brevemente por qué es una buena elección.
3.  **earlyGame.plan**: Define un plan para la fase inicial del juego. Debe estar alineado con el **Enfoque Principal**. Si el enfoque es 'Loteo', describe las mejores áreas para lootear. Si es 'Combate', sugiere cómo buscar enfrentamientos tempranos.
4.  **midGame.plan**: Define un plan para la fase media. Debe enfocarse en cómo rotar, controlar áreas y cuándo buscar o evitar peleas, siempre considerando el **Estilo de Juego**.
5.  **lateGame.plan**: Define un plan para el final de la partida, centrándote en el posicionamiento para el círculo final y cómo asegurar la victoria.
6.  **recommendedLoadout**: Sugiere un equipamiento (arma principal y secundaria) que se alinee con la estrategia general. Por ejemplo, armas de corto alcance para un plan agresivo o rifles de francotirador para uno pasivo. Justifica la elección.
7.  **rotationPlan**: Describe una ruta de rotación general desde la zona de aterrizaje hacia el centro del mapa o zonas de poder, mencionando 1 o 2 puntos de referencia clave.

Proporciona la respuesta en el formato JSON solicitado. El tono debe ser el de un entrenador experto y seguro.
`,
});

const mapPlannerFlow = ai.defineFlow(
  {
    name: 'mapPlannerFlow',
    inputSchema: MapPlannerInputSchema,
    outputSchema: MapPlannerSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una estrategia válida.");
    }
    return output;
  }
);
