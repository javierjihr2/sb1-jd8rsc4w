
'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile control layouts (HUD).
 *
 * - getControls - A function that handles the control layout generation process.
 * - ControlsInput - The input type for the getControls function.
 * - Controls - The return type for the getControls function.
 */

import {ai} from '@/ai/genkit';
import { ControlsInputSchema, ControlsSchema, type Controls, type ControlsInput } from '../schemas';

export async function getControls(input: ControlsInput): Promise<Controls> {
  return controlsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'controlsPrompt',
  input: {schema: ControlsInputSchema},
  output: {schema: ControlsSchema},
  prompt: `Eres un entrenador profesional de eSports de PUBG Mobile, especializado en la ergonomía y optimización de controles (HUD) para jugadores de todos los niveles. Tu tarea es generar una recomendación detallada para un diseño de controles basado en el número de dedos que el jugador utiliza.

Parámetros del Usuario:
- Número de dedos: {{{fingerCount}}}

Instrucciones:
1.  **Nombra el Layout:** Crea un nombre descriptivo para el diseño (ej: "Garra de 4 Dedos Híbrida", "Pulgares Dinámicos", "Garra Invertida de 5 Dedos").
2.  **Genera una Imagen Placeholder:** Proporciona una URL a una imagen placeholder de 400x300.
3.  **Analiza Ventajas y Desventajas:** Enumera las principales ventajas (velocidad, precisión, capacidad multitarea) y las desventajas (curva de aprendizaje, fatiga) del layout.
4.  **Distribución de Acciones Clave:** Explica qué dedos o pulgares se encargan de las acciones fundamentales:
    *   Movimiento
    *   Apuntar
    *   Disparar
    *   Acciones principales (saltar, agacharse, inclinarse, recargar)
5.  **Proporciona Consejos de Adaptación:** Ofrece 2 consejos prácticos y accionables para ayudar al jugador a acostumbrarse y dominar esta nueva configuración de controles. Los consejos deben ser específicos y útiles.
6.  Asegúrate de que la salida esté en el formato JSON solicitado. Sé claro, conciso y motivador en tu tono.`,
});

const controlsFlow = ai.defineFlow(
  {
    name: 'controlsFlow',
    inputSchema: ControlsInputSchema,
    outputSchema: ControlsSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de controles válida.");
    }
    return output;
  }
);
