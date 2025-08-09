
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
  prompt: `Eres un "Planificador de Partidas" experto y entrenador de eSports de PUBG Mobile. Tu tarea es generar un plan de partida completo, profesional, muy detallado, bien explicado y accionable, como si estuvieras presentando un mapa conceptual a un equipo. El plan debe basarse en la configuración de partida proporcionada por el usuario.

Configuración de la Partida:
- Mapa: {{{map}}}
- Zona de Aterrizaje: {{{dropZone}}}
- Estilo de Juego: {{{playStyle}}}
- Tamaño de Escuadra: {{{squadSize}}}
- Nivel de Riesgo: {{{riskLevel}}}
- Enfoque Principal: {{{focus}}}
{{#if zoneCircleNumber}}
- Círculo de Zona Actual: {{{zoneCircleNumber}}}
{{/if}}
{{#if zonePointA}}
- Posible Cierre de Zona (Punto A): {{{zonePointA}}}
- Posible Cierre de Zona (Punto B): {{{zonePointB}}}
{{/if}}

Instrucciones para generar el plan (sé muy detallado y explicativo):
1.  **planTitle**: Crea un título creativo y descriptivo para el plan que incorpore la zona de aterrizaje (ej: "Dominación desde Pochinki", "Asalto Total en Sanhok").
2.  **dropZoneJustification**: Ya que el usuario proveyó la zona de aterrizaje, tu tarea es proporcionar una justificación táctica de por qué esta es una buena o mala elección según el **Nivel de Riesgo** y el mapa, y cómo sacarle el máximo provecho.
3.  **earlyGame.plan**: Define un plan muy claro para la fase inicial del juego (los primeros 5-7 minutos o círculos 1-2) comenzando desde la **zona de aterrizaje** seleccionada. Debe estar alineado con el **Enfoque Principal**. Explica las prioridades: qué edificios lootear, cómo posicionarse y si buscar o evitar enfrentamientos inmediatos.
4.  **midGame.plan**: Define un plan detallado para la fase media (aproximadamente círculos 3-5). Debe enfocarse en cómo rotar desde la zona de aterrizaje hacia la zona segura. **Si se proporcionaron los puntos de cierre de zona, la rotación debe planificarse para controlar una posición de poder entre el Punto A y el Punto B**. Explica qué áreas clave controlar (alturas, puentes, complejos) y cómo tomar decisiones de combate basadas en la información disponible (disparos, vehículos), siempre considerando el **Estilo de Juego** y el **Círculo de Zona Actual**.
5.  **lateGame.plan**: Define un plan preciso para el final de la partida (últimos círculos). Céntrate en el posicionamiento para el círculo final, anticipando el cierre entre el Punto A y el Punto B si fueron proporcionados. Explica cómo usar las coberturas (naturales y edificios) y cómo iniciar el enfrentamiento final para asegurar la victoria. La urgencia del plan debe reflejar el **Círculo de Zona Actual**.
6.  **recommendedLoadout**: Sugiere un equipamiento ideal y DETALLADO.
    *   **Arma Principal y Secundaria:** Elige armas que se encuentren en el mapa especificado y que se alineen con la estrategia general.
    *   **Miras y Accesorios:** Recomienda la mejor mira (ej. "Mira 6x", "Punto Rojo") y una lista de 2-3 accesorios clave (ej. "Culata táctica", "Cargador ampliado rápido", "Silenciador") para cada arma.
    *   **Justificación:** Proporciona una justificación concisa para cada arma, explicando por qué esa configuración es ideal para el plan.
7.  **rotationPlan**: Describe un plan de rotación completo y muy detallado.
    *   **route**: Describe la ruta general desde la zona de aterrizaje, considerando el posible cierre de zona y el círculo actual.
    *   **considerations**: Enumera 2-3 puntos clave o hitos a considerar durante la rotación.
    *   **advantages**: Menciona 1-2 ventajas de esta ruta.
    *   **disadvantages**: Menciona 1-2 desventajas o riesgos.
    *   **vehicleSuggestion**: Sugiere el mejor tipo de vehículo para el mapa y la ruta (ej. "Dacia para carreteras, UAZ para terreno abierto"), explica por qué, y añade un recordatorio sobre el combustible.

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







