
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
  output: {schema: DecodedSensitivitySchema},
  prompt: `Eres un analista de datos y coach experto de eSports para PUBG Mobile. Tu tarea es "decodificar" un código de sensibilidad proporcionado por el usuario y generar un análisis detallado. Aunque no puedes decodificarlo literalmente, debes generar una configuración de sensibilidad realista y plausible que corresponda al formato del código, y luego analizarla.

Código Proporcionado: {{{code}}}

Instrucciones:
1.  **Genera Valores de Sensibilidad:** Basado en la estructura del código, crea un conjunto completo y realista de valores de sensibilidad para "Cámara", "ADS" y "Giroscopio". Los números deben ser coherentes entre sí. No dejes ningún campo en 0.
2.  **Análisis Táctico (analysis.tacticalAnalysis):**
    *   Observa los valores que generaste. ¿Son altos, bajos o equilibrados?
    *   Escribe un análisis conciso de 2-3 frases sobre qué tipo de jugador se beneficiaría de esta configuración. Por ejemplo, "Esta configuración con sensibilidades de cámara altas es ideal para jugadores agresivos de corto alcance que necesitan reaccionar rápidamente. Sin embargo, el control de retroceso a larga distancia podría ser un desafío."
3.  **Estilo de Juego (analysis.playStyle):**
    *   Basado en tu análisis, asigna un estilo de juego principal. Opciones: "Agresivo (Rusher)", "Equilibrado (Soporte)", "Preciso (Francotirador)", "Táctico (IGL)".
4.  **Armas Recomendadas (analysis.recommendedWeapons):**
    *   Sugiere 2-3 armas que se complementarían bien con esta sensibilidad. Por ejemplo, sensibilidades altas van bien con SMGs y ARs de corta distancia (UMP45, M762). Sensibilidades bajas son mejores para DMRs y Snipers (Mini14, M24).
5.  **Nombre Sugerido (analysis.suggestedName):**
    *   Crea un nombre descriptivo y atractivo para esta configuración. Ejemplos: "Garra Agresiva de Giroscopio", "Precisión de Pulgares a Distancia", "Control Híbrido Equilibrado".
6.  **Código Original (code):**
    *   Asegúrate de que el campo 'code' en la salida sea exactamente el mismo código que el usuario proporcionó en la entrada.

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
    // Ensure the original code is preserved in the output
    return { ...output, code: input.code };
  }
);
