
'use server';
/**
 * @fileOverview An AI agent for generating weapon-specific sensitivity settings.
 *
 * - getWeaponSensitivity - A function that handles the sensitivity generation process for a specific weapon.
 * - WeaponSensitivityInput - The input type for the getWeaponSensitivity function.
 * - WeaponSensitivity - The return type for the getWeaponSensitivity function.
 */

import {ai} from '@/ai/genkit';
import { WeaponSensitivityInputSchema, WeaponSensitivitySchema, type WeaponSensitivity, type WeaponSensitivityInput } from '../schemas';

export async function getWeaponSensitivity(input: WeaponSensitivityInput): Promise<WeaponSensitivity> {
  return weaponSensitivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weaponSensitivityPrompt',
  input: {schema: WeaponSensitivityInputSchema},
  output: {schema: WeaponSensitivitySchema},
  prompt: `Eres un armero experto y jugador profesional de PUBG Mobile, especializado en optimizar la sensibilidad para cada arma individualmente. Tu tarea es generar una configuración de sensibilidad de CÁMARA y ADS específica para el arma proporcionada, teniendo en cuenta el perfil del jugador.

Perfil del Jugador:
- Tipo de Dispositivo: {{{deviceType}}}
- Dispositivo Específico: {{{device}}}
- Tamaño de Pantalla (pulgadas): {{{screenSize}}}
- Estilo de Juego Preferido: {{{playStyle}}}
- Usa Giroscopio: {{{gyroscope}}}

Arma a Optimizar:
- Nombre: {{{weaponName}}}
- Categoría: {{{weaponCategory}}}

Instrucciones:
1.  **Analiza el Arma:** Considera las características únicas del arma:
    *   **Retroceso (Vertical y Horizontal):** Armas como el M762 tienen un alto retroceso y necesitan una sensibilidad de ADS más alta para controlarlo. Armas como la M416 (con todos los accesorios) son más estables y pueden usar una sensibilidad ligeramente menor.
    *   **Cadencia de Fuego:** Las armas con alta cadencia (Vector, M762) pueden requerir una sensibilidad mayor para seguir objetivos en movimiento a corta distancia.
    *   **Uso Típico:** Un rifle de francotirador (Kar98K, M24) necesita una sensibilidad de mira alta (6x, 8x) muy baja para la precisión, mientras que un SMG necesita sensibilidades altas en miras de corto alcance (Punto Rojo, Holo). Un DMR es un híbrido.
2.  **Ajusta según el Perfil:** Cruza las características del arma con el perfil del jugador. Por ejemplo, un jugador de "Combate Cercano" necesitará valores de sensibilidad más altos para un SMG que un jugador de "Larga Distancia".
3.  **Genera Valores de Sensibilidad:** Crea valores numéricos para la sensibilidad de "Cámara" (sin disparar) y "ADS" (disparando). Estos valores deben ser lógicos y estar finamente ajustados para el arma específica. No generes una sección de giroscopio, ya que esta suele ser una configuración más general.
4.  **Genera un Código:** Proporciona un código de sensibilidad de ejemplo, diferente al de una configuración general, que un jugador podría usar para el arma (ej: 7111-2222-3333-4444-555).
5.  **Formato de Salida:** Asegúrate de que la salida esté en el formato JSON solicitado.`,
});

const weaponSensitivityFlow = ai.defineFlow(
  {
    name: 'weaponSensitivityFlow',
    inputSchema: WeaponSensitivityInputSchema,
    outputSchema: WeaponSensitivitySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de sensibilidad de arma válida.");
    }
    // Omit gyroscope from the response even if the AI generates it.
    const { gyroscope, ...rest } = output as any;
    return rest;
  }
);
