
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
  prompt: `Eres un analista de datos y coach experto de eSports para PUBG Mobile. Tu tarea es recibir un código de sensibilidad de PUBG Mobile y, aunque no puedes decodificarlo literalmente, debes generar una configuración de sensibilidad realista y plausible que podría corresponder a un código con ese formato, para luego realizar un análisis profesional sobre la configuración generada.

Código Proporcionado: {{{settings.code}}}

Instrucciones:
1.  **Genera una Configuración Plausible (settings):**
    *   Crea un conjunto completo de valores de sensibilidad (Cámara, ADS y, si lo consideras apropiado, Giroscopio). Los valores deben ser coherentes entre sí. No inventes una decodificación, simplemente crea un perfil de sensibilidad completo y realista que sirva como base para tu análisis.
    *   No hagas los valores demasiado bajos o altos, a menos que quieras analizar un perfil extremo. Por ejemplo, puedes generar una configuración balanceada.
    *   Asegúrate de que la salida de esta sección coincida con el esquema de 'SensitivitySchema'.

2.  **Realiza un Análisis Táctico (analysis):**
    *   Basado en los valores que TÚ generaste, realiza el siguiente análisis:
    *   **Análisis Táctico (tacticalAnalysis):** Observa los valores que creaste. ¿Son altos, bajos o equilibrados? ¿Cómo se comparan los valores de la cámara con los de ADS? Escribe un análisis conciso sobre qué tipo de jugador se beneficiaría de esta configuración.
    *   **Estilo de Juego (playStyle):** Asigna un estilo de juego principal (ej: "Agresivo (Rusher)", "Equilibrado (Soporte)", "Preciso (Francotirador)").
    *   **Armas Recomendadas (recommendedWeapons):** Sugiere 2-3 armas que se complementarían bien con esta sensibilidad.
    *   **Nombre Sugerido (suggestedName):** Crea un nombre descriptivo y atractivo para esta configuración (ej: "Garra Agresiva de Giroscopio", "Precisión de Pulgares").

3. **Mantén el Código Original (code):**
    * Devuelve el código original que el usuario proporcionó sin cambios.

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
    
    // Ensure the original code is preserved in the final output
    return { 
        ...output,
        code: input.settings.code,
     };
  }
);

    