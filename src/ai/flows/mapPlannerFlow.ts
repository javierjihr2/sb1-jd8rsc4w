
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
{{#if currentLocation}}
- Ubicación Actual: {{{currentLocation}}}
{{/if}}
{{#if zoneCircleNumber}}
- Cantidad de zonas cerradas: {{{zoneCircleNumber}}}
{{/if}}
{{#if zonePointA}}
- Posible Cierre de Zona (Punto A): {{{zonePointA}}}
- Posible Cierre de Zona (Punto B): {{{zonePointB}}}
{{/if}}

Instrucciones para generar el plan (sé muy detallado y explicativo):
1.  **planTitle**: Crea un título creativo y descriptivo para el plan que incorpore la zona de aterrizaje (ej: "Dominación desde Pochinki", "Asalto Total en Sanhok").
2.  **dropZoneJustification**: Ya que el usuario proveyó la zona de aterrizaje, tu tarea es proporcionar una justificación táctica de por qué esta es una buena o mala elección según el **Estilo de Juego** y el mapa, y cómo sacarle el máximo provecho.
3.  **earlyGame.plan**: Define un plan muy claro para la fase inicial del juego (los primeros 5-7 minutos o círculos 1-2) comenzando desde la **zona de aterrizaje** seleccionada. Explica las prioridades: qué edificios lootear, cómo posicionarse y si buscar o evitar enfrentamientos inmediatos. Si se proporciona una **Ubicación Actual**, esta fase debe considerarse ya completada.
4.  **midGame.plan**: Define un plan detallado para la fase media (aproximadamente círculos 3-5). Debe enfocarse en cómo rotar (desde la **Zona de Aterrizaje** o la **Ubicación Actual**) hacia la zona segura. **Si se proporcionaron los puntos de cierre de zona, la rotación debe planificarse para controlar una posición de poder entre el Punto A y el Punto B**. Explica qué áreas clave controlar (alturas, puentes, complejos) y cómo tomar decisiones de combate basadas en la información disponible (disparos, vehículos), siempre considerando el **Estilo de Juego** y la **Cantidad de zonas cerradas**.
5.  **lateGame.plan**: Define un plan preciso para el final de la partida (últimos círculos). Céntrate en el posicionamiento para el círculo final, anticipando el cierre entre el Punto A y el Punto B si fueron proporcionados. Explica cómo usar las coberturas (naturales y edificios) y cómo iniciar el enfrentamiento final para asegurar la victoria. La urgencia del plan debe reflejar la **Cantidad de zonas cerradas**.
6.  **recommendedLoadout**: Sugiere un equipamiento DETALLADO y basado en roles.
    *   **Adaptación al Tamaño de Escuadra:** Adapta las recomendaciones de roles al tamaño de la escuadra. Para una escuadra completa (4 jugadores), sugiere equipamiento para roles clave como **IGL (In-Game Leader), Fragger, Support y Sniper**. Para un dúo (2 jugadores), sugiere roles complementarios (ej: Fragger y Support/Sniper). Para un jugador solo, sugiere un equipamiento versátil.
    *   **Armas por Rol:** Para cada rol, elige una **Arma Principal y Secundaria**. ¡MUY IMPORTANTE! Elige armas que **REALMENTE se encuentren en el mapa especificado**. Por ejemplo, la MP5K no está en Livik. Sé preciso.
    *   **Miras y Accesorios:** Para cada arma, recomienda la mejor **mira** (ej. "Mira 6x", "Punto Rojo") y una lista de 2-3 **accesorios clave** (ej. "Culata táctica", "Cargador ampliado rápido", "Silenciador"). Las recomendaciones deben ser **prácticas y efectivas**; por ejemplo, no recomiendes una mira 4x para una AKM, ya que no es una combinación óptima para la mayoría de los jugadores.
    *   **Justificación por Rol:** Proporciona una justificación concisa para cada equipamiento, explicando por qué esa configuración es ideal para ese rol específico dentro del plan general.
7.  **rotationPlan**: Describe un plan de rotación completo y muy detallado.
    *   **route**: Describe la ruta general (desde la zona de aterrizaje o la ubicación actual), considerando el posible cierre de zona y el círculo actual.
    *   **considerations**: Enumera 2-3 puntos clave o hitos a considerar durante la rotación.
    *   **advantages**: Menciona 1-2 ventajas de esta ruta.
    *   **disadvantages**: Menciona 1-2 desventajas o riesgos.
    *   **vehicleSuggestion**: Sugiere el mejor tipo de vehículo **disponible en ese mapa** para la ruta (ej. "UAZ para terreno abierto en Erangel", "Motocicleta para velocidad en Sanhok", "Tukshai en Sanhok"). Explica por qué, y añade un recordatorio sobre el combustible. ¡NO sugieras vehículos que no existen en el mapa especificado (ej. Dacia en Livik)!

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
