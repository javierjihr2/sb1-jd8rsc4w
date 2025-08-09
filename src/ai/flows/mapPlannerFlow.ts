
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
  prompt: `Eres un "Planificador de Partidas" experto de PUBG Mobile. Tu tarea es generar un plan de partida completo, profesional, bien explicado y accionable, como si estuvieras presentando un mapa conceptual a un equipo. El plan debe basarse en el punto de caída proporcionado por el usuario.

Parámetros de la Partida:
- Mapa: {{{map}}}
- Zona de Aterrizaje: {{{dropZone}}}
- Estilo de Juego: {{{playStyle}}}
- Tamaño de Escuadra: {{{squadSize}}}
- Nivel de Riesgo: {{{riskLevel}}}
- Enfoque Principal: {{{focus}}}

Instrucciones para generar el plan (sé muy detallado y explicativo):
1.  **planTitle**: Crea un título creativo y descriptivo para el plan que incorpore la zona de aterrizaje (ej: "Dominación desde Pochinki", "Asalto Total en Sanhok").
2.  **dropZoneJustification**: Ya que el usuario proveyó la zona de aterrizaje, tu tarea es proporcionar una justificación táctica de por qué esta es una buena o mala elección según el **Nivel de Riesgo** y el mapa, y cómo sacarle el máximo provecho.
3.  **earlyGame.plan**: Define un plan muy claro para la fase inicial del juego (los primeros 5-7 minutos) comenzando desde la **zona de aterrizaje** seleccionada. Debe estar alineado con el **Enfoque Principal**. Explica las prioridades: qué edificios lootear, cómo posicionarse y si buscar o evitar enfrentamientos inmediatos.
4.  **midGame.plan**: Define un plan detallado para la fase media. Debe enfocarse en cómo rotar desde la zona de aterrizaje hacia la zona segura, qué áreas clave controlar (alturas, puentes, complejos) y cómo tomar decisiones de combate basadas en la información disponible (disparos, vehículos), siempre considerando el **Estilo de Juego**.
5.  **lateGame.plan**: Define un plan preciso para el final de la partida (últimos 2-3 círculos), centrándote en el posicionamiento para el círculo final, cómo usar las coberturas (naturales y edificios) y cómo iniciar el enfrentamiento final para asegurar la victoria.
6.  **recommendedLoadout**: Sugiere un equipamiento ideal (arma principal, secundaria, y accesorios clave) que se alinee con la estrategia general y la zona de aterrizaje. Por ejemplo, armas de corto alcance para un plan agresivo en una ciudad o rifles de francotirador para uno pasivo en campo abierto. Justifica la elección de cada arma en el contexto del plan.
7.  **rotationPlan**: Describe una ruta de rotación general y bien explicada desde la **zona de aterrizaje** hacia el centro del mapa o zonas de poder, mencionando 1 o 2 puntos de referencia clave y por qué son importantes para la estrategia.

Proporciona la respuesta en el formato JSON solicitado. El tono debe ser el de un entrenador experto, seguro y muy didáctico.
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



