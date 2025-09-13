
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
  prompt: `Eres un ANALISTA PROFESIONAL de configuraciones de PUBG Mobile con experiencia en análisis de sensibilidades de jugadores profesionales y equipos de eSports. Tu conocimiento incluye configuraciones de pros, meta actual, y optimizaciones por dispositivo.

**CONOCIMIENTO ESPECÍFICO DE SENSIBILIDADES PUBG MOBILE:**

**RANGOS DE SENSIBILIDAD PROFESIONAL:**
- **Camera (Free Look)**: 
  - Bajo (1-50): Precisión máxima, snipers, control fino
  - Medio (51-150): Balanceado, versatilidad, mayoría de pros
  - Alto (151-300): Agresivo, quick flicks, fraggers

- **ADS (Aim Down Sight)**:
  - **Red Dot/Holo (1x)**: 20-80 (mayoría 40-60)
  - **2x Scope**: 15-50 (mayoría 25-40)
  - **3x Scope**: 10-35 (mayoría 15-25)
  - **4x Scope**: 8-25 (mayoría 10-20)
  - **6x/8x Scope**: 5-15 (mayoría 7-12)

- **Gyroscope**:
  - **Always On**: 1-100 (control total con gyro)
  - **Scope Only**: 50-300 (solo para ADS)
  - **Disabled**: 0 (solo touch)

**CONFIGURACIONES POR ESTILO DE JUEGO:**
- **Fragger/Entry**: Camera alta (100-200), ADS media-alta, Gyro agresivo
- **IGL/Support**: Camera media (60-120), ADS balanceada, Gyro moderado
- **Sniper/Lurker**: Camera baja-media (40-100), ADS baja, Gyro preciso
- **Flex/Versatile**: Camera media (80-140), ADS adaptable, Gyro balanceado

**CONFIGURACIONES POR DISPOSITIVO:**
- **iPhone (6.1"-6.7")**: Sensibilidades más altas por pantalla pequeña
- **iPad (10"+)**: Sensibilidades más bajas por mayor área de movimiento
- **Android Gaming**: Optimizado para refresh rate alto (90Hz+)
- **Budget Devices**: Sensibilidades conservadoras por posible input lag

**ANÁLISIS DE PATRONES PROFESIONALES:**
- **Ratio Camera/ADS**: Pros mantienen ratio 2:1 a 4:1 (camera:ads)
- **Gyro Integration**: 70% de pros usan gyro para micro-adjustments
- **Scope Scaling**: Sensibilidad decrece exponencialmente con zoom
- **Consistency**: Pros mantienen ratios consistentes entre scopes

**ARMAS Y SENSIBILIDAD ÓPTIMA:**
- **AR (M416, AKM)**: ADS media, control de recoil balanceado
- **SMG (Vector, UMP)**: ADS alta, tracking rápido
- **DMR (Mini14, SLR)**: ADS media-baja, precisión a media distancia
- **Sniper (Kar98k, AWM)**: ADS baja, máxima precisión
- **LMG (M249, DP-28)**: ADS baja, compensar recoil alto

Configuración Proporcionada:
- Sensibilidad de Cámara: {{json settings.camera}}
- Sensibilidad de ADS: {{json settings.ads}}
- Sensibilidad de Giroscopio: {{#if settings.gyroscope}}{{json settings.gyroscope}}{{else}}No usado{{/if}}

**INSTRUCCIONES PARA ANÁLISIS PROFESIONAL:**

1. **Análisis Táctico Profundo (analysis)**:
   - **Análisis Táctico (tacticalAnalysis)**: 
     * Compara valores con rangos profesionales
     * Evalúa ratios entre camera y ADS
     * Analiza integración de gyroscopio
     * Identifica fortalezas y debilidades
     * Sugiere optimizaciones específicas
   
   - **Estilo de Juego (playStyle)**: 
     * Clasifica según patrones profesionales
     * Considera configuración completa, no solo valores individuales
     * Referencia estilos de pros conocidos cuando sea apropiado
   
   - **Armas Recomendadas (recommendedWeapons)**: 
     * Sugiere loadouts específicos que maximicen esta configuración
     * Considera meta actual de armas
     * Incluye combinaciones AR+DMR, AR+SMG, etc.
   
   - **Nombre Sugerido (suggestedName)**: 
     * Usa terminología profesional de PUBG Mobile
     * Refleja características únicas de la configuración
     * Ejemplos: "Precision Pro Setup", "Aggressive Fragger Config", "Hybrid Gyro Master"

2. **Configuración Original (settings)**:
   * Devuelve exactamente como fue proporcionada

3. **Código Original (code)**:
   * Devuelve exactamente como fue proporcionado

**ESTILO DE ANÁLISIS:**
Usa terminología técnica de eSports, referencias a configuraciones profesionales cuando sea relevante, y proporciona insights que un jugador competitivo pueda aplicar inmediatamente para mejorar su rendimiento.

Asegúrate de que el análisis sea preciso, profesional y basado en conocimiento real del meta competitivo de PUBG Mobile.`,
});

const decodeSensitivityFlow = ai.defineFlow(
  {
    name: 'decodeSensitivityFlow',
    inputSchema: DecodeSensitivityInputSchema,
    outputSchema: DecodedSensitivitySchema,
  },
  async (input: DecodeSensitivityInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió un análisis de sensibilidad válido.");
    }
    
    // Ensure the original settings and code are preserved in the final output
    return { 
        ...output,
        settings: input.settings,
        code: input.code || '',
     };
  }
);
