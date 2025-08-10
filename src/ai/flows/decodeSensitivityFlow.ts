
'use server';
/**
 * @fileOverview An AI agent for "decoding" and analyzing PUBG Mobile sensitivity codes.
 *
 * - decodeSensitivity - A function that takes a sensitivity code and returns a detailed analysis.
 * - DecodeSensitivityInput - The input type for the decodeSensitivity function.
 * - DecodedSensitivity - The return type for the decodeSensitivity function.
 */

import {ai} from '@/ai/genkit';
import { DecodedSensitivitySchema, DecodeSensitivityInputSchema, type DecodedSensitivity, type DecodeSensitivityInput, SensitivitySchema } from '../schemas';

export async function decodeSensitivity(input: DecodeSensitivityInput): Promise<DecodedSensitivity> {
  return decodeSensitivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'decodeSensitivityPrompt',
  input: {schema: DecodeSensitivityInputSchema},
  output: {schema: DecodedSensitivitySchema},
  prompt: `Eres un analista de datos y coach experto de eSports para PUBG Mobile. Tu tarea es recibir una configuración de sensibilidad completa y realizar un análisis profesional sobre ella.

Configuración Proporcionada:
- Sensibilidad de Cámara: {{json settings.camera}}
- Sensibilidad de ADS: {{json settings.ads}}
- Sensibilidad de Giroscopio: {{#if settings.gyroscope}}{{json settings.gyroscope}}{{else}}No usado{{/if}}

Instrucciones:
1.  **Realiza un Análisis Táctico (analysis):**
    *   **Análisis Táctico (tacticalAnalysis):** Observa los valores proporcionados. ¿Son altos, bajos o equilibrados? ¿Cómo se comparan los valores de la cámara con los de ADS? ¿La sensibilidad del giroscopio (si existe) indica un jugador que apunta principalmente con él? Escribe un análisis conciso sobre qué tipo de jugador se beneficiaría de esta configuración.
    *   **Estilo de Juego (playStyle):** Basado en tu análisis, asigna un estilo de juego principal (ej: "Agresivo (Rusher)", "Equilibrado (Soporte)", "Preciso (Francotirador)").
    *   **Armas Recomendadas (recommendedWeapons):** Sugiere 2-3 armas que se complementarían bien con esta sensibilidad.
    *   **Nombre Sugerido (suggestedName):** Crea un nombre descriptivo y atractivo para esta configuración (ej: "Garra Agresiva de Giroscopio", "Precisión de Pulgares").

2.  **Devuelve la Configuración Original (settings):**
    *   Devuelve la configuración original (camera, ads, gyroscope) que el usuario proporcionó sin cambios.

3.  **Devuelve el Código Original (code):**
    *   Devuelve el código original que el usuario proporcionó sin cambios.

Asegúrate de que la salida esté en el formato JSON solicitado. El tono debe ser el de un experto profesional y útil.`,
});

const decodeSensitivityFlow = ai.defineFlow(
  {
    name: 'decodeSensitivityFlow',
    inputSchema: DecodeSensitivityInputSchema,
    outputSchema: DecodedSensitivitySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió un análisis de sensibilidad válido.");
    }
    
    // Ensure the original settings and code are preserved in the final output
    return { 
        ...output,
        settings: input.settings,
        code: input.settings.code,
     };
  }
);
