
'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile sensitivity settings.
 *
 * - getSensitivity - A function that handles the sensitivity generation process.
 * - SensitivityInput - The input type for the getSensitivity function.
 * - Sensitivity - The return type for the getSensitivity function.
 */

import {ai} from '@/ai/genkit';
import { SensitivityInputSchema, SensitivitySchema, type Sensitivity, type SensitivityInput } from '../schemas';

export async function getSensitivity(input: SensitivityInput): Promise<Sensitivity> {
  return sensitivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sensitivityPrompt',
  input: {schema: SensitivityInputSchema},
  output: {schema: SensitivitySchema},
  prompt: `Eres un jugador profesional y entrenador de PUBG Mobile, experto en optimizar la configuración de sensibilidad para un rendimiento máximo. Tu tarea es generar una configuración de sensibilidad completa y personalizada basada en el dispositivo y las preferencias del usuario.

Parámetros del Usuario:
- Tipo de Dispositivo: {{{deviceType}}}
- Marca del Dispositivo: {{{deviceBrand}}}
- Modelo del Dispositivo: {{{deviceModel}}}
- Tamaño de Pantalla (pulgadas): {{{screenSize}}}
- Usa Giroscopio: {{{gyroscope}}}

Instrucciones:
1.  Utiliza la marca y el modelo del dispositivo, si se proporcionan, para afinar aún más la configuración. Ciertos modelos pueden tener tasas de refresco o respuestas táctiles específicas que puedes tener en cuenta.
2.  Genera valores numéricos para la sensibilidad de la "Cámara", "ADS" (Aim Down Sight).
3.  Si el usuario ha especificado 'si' para el giroscopio, genera también una configuración completa para la "Sensibilidad del Giroscopio". Si es 'no', omite el campo del giroscopio en la respuesta.
4.  Los valores deben ser lógicos y estar optimizados para el tipo de dispositivo y el tamaño de la pantalla. Las tablets generalmente requieren sensibilidades ligeramente más bajas que los teléfonos.
5.  Proporciona un "código" de ejemplo que un jugador podría usar en el juego. Puede ser un código ficticio pero realista.
6.  Asegúrate de que la salida esté en el formato JSON solicitado.`,
});

const sensitivityFlow = ai.defineFlow(
  {
    name: 'sensitivityFlow',
    inputSchema: SensitivityInputSchema,
    outputSchema: SensitivitySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de sensibilidad válida.");
    }
    return output;
  }
);
