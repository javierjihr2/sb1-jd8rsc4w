
'use server';
/**
 * @fileOverview An AI agent for "decoding" and analyzing PUBG Mobile sensitivity codes.
 *
 * - decodeSensitivity - A function that takes a sensitivity code and returns a detailed analysis.
 * - DecodeSensitivityInput - The input type for the decodeSensitivity function.
 * - DecodedSensitivity - The return type for the decodeSensitivity function.
 */

import {ai} from '@/ai/genkit';
import { DecodedSensitivitySchema, DecodeSensitivityInputSchema, type DecodedSensitivity, type DecodeSensitivityInput } from '../schemas';

export async function decodeSensitivity(input: DecodeSensitivityInput): Promise<DecodedSensitivity> {
  return decodeSensitivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'decodeSensitivityPrompt',
  input: {schema: DecodeSensitivityInputSchema},
  output: {schema: DecodedSensitivitySchema.shape.analysis},
  prompt: `Eres un analista de datos y coach experto de eSports para PUBG Mobile. Tu tarea es analizar un conjunto de valores de sensibilidad proporcionados por el usuario y generar un análisis detallado y profesional.

Valores de Sensibilidad Proporcionados:
- Cámara: {{{json settings.camera}}}
- ADS: {{{json settings.ads}}}
{{#if settings.gyroscope}}
- Giroscopio: {{{json settings.gyroscope}}}
{{/if}}

Instrucciones:
1.  **Análisis Táctico (tacticalAnalysis):**
    *   Observa los valores proporcionados. ¿Son altos, bajos o equilibrados en general? ¿Cómo se comparan los valores de la cámara con los de ADS?
    *   Escribe un análisis conciso de 2-3 frases sobre qué tipo de jugador se beneficiaría de esta configuración. Por ejemplo, "Esta configuración con sensibilidades de cámara altas y ADS moderadas es ideal para jugadores agresivos de corto a medio alcance que necesitan reaccionar rápidamente pero mantener el control del retroceso. El control a larga distancia podría requerir práctica."
2.  **Estilo de Juego (playStyle):**
    *   Basado en tu análisis, asigna un estilo de juego principal. Opciones: "Agresivo (Rusher)", "Equilibrado (Soporte)", "Preciso (Francotirador)", "Táctico (IGL)".
3.  **Armas Recomendadas (recommendedWeapons):**
    *   Sugiere 2-3 armas que se complementarían bien con esta sensibilidad. Por ejemplo, sensibilidades altas van bien con SMGs y ARs de corta distancia (UMP45, M762). Sensibilidades bajas son mejores para DMRs y Snipers (Mini14, M24).
4.  **Nombre Sugerido (suggestedName):**
    *   Crea un nombre descriptivo y atractivo para esta configuración. Ejemplos: "Garra Agresiva de Giroscopio", "Precisión de Pulgares a Distancia", "Control Híbrido Equilibrado".

Asegúrate de que la salida esté en el formato JSON solicitado. El tono debe ser el de un experto profesional y útil.`,
});

const decodeSensitivityFlow = ai.defineFlow(
  {
    name: 'decodeSensitivityFlow',
    inputSchema: DecodeSensitivityInputSchema,
    outputSchema: DecodedSensitivitySchema,
  },
  async (input) => {
    const {output: analysis} = await prompt(input);
    if (!analysis) {
      throw new Error("El modelo de IA no devolvió un análisis de sensibilidad válido.");
    }
    
    // Combine the original settings with the new analysis
    return { 
        settings: input.settings,
        analysis: analysis,
        code: input.settings.code,
     };
  }
);
