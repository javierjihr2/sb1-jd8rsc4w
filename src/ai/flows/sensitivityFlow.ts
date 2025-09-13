
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
  prompt: `Eres un COACH PROFESIONAL de eSports de PUBG Mobile especializado en optimización de sensibilidades para jugadores competitivos. Tu conocimiento incluye configuraciones de equipos profesionales, meta actual de sensibilidades y optimización por dispositivo.

**CONOCIMIENTO ESPECÍFICO DE PUBG MOBILE:**

**CONFIGURACIONES PROFESIONALES POR DISPOSITIVO:**
- **iPhone (6.1"-6.7")**: Sensibilidades base más altas debido a pantalla responsive, gyro muy efectivo
- **iPad (10"-13")**: Sensibilidades más bajas por mayor área de pantalla, mejor control de precisión
- **Android Flagship (6"-6.8")**: Configuración balanceada, ajustar según refresh rate (90Hz/120Hz)
- **Android Gaming (6.5"+)**: Sensibilidades optimizadas para triggers físicos si disponibles

**META COMPETITIVO DE SENSIBILIDADES:**
- **Cámara TPP**: 95-150% (agresivo), 70-95% (equilibrado), 50-70% (preciso)
- **Cámara FPP**: 85-130% (agresivo), 60-85% (equilibrado), 40-60% (preciso)
- **ADS Ranges**:
  - Red Dot/Holo: 45-65% (CQC), 35-45% (equilibrado), 25-35% (preciso)
  - 2x: 35-50% (agresivo), 25-35% (equilibrado), 18-25% (preciso)
  - 3x: 25-40% (agresivo), 18-25% (equilibrado), 12-18% (preciso)
  - 4x: 20-30% (agresivo), 15-20% (equilibrado), 10-15% (preciso)
  - 6x: 15-25% (agresivo), 10-15% (equilibrado), 7-10% (preciso)
  - 8x: 10-18% (agresivo), 7-10% (equilibrado), 5-7% (preciso)

**CONFIGURACIÓN DE GIROSCOPIO PROFESIONAL:**
- **Always On**: Para máximo control, usado por pros
- **Scope On**: Para precisión en ADS únicamente
- **Sensibilidades Gyro**: 95-300% según preferencia y dispositivo

**ESTILOS DE JUEGO COMPETITIVOS:**
- **Fragger/Entry**: Sensibilidades altas para flicks rápidos y tracking agresivo
- **IGL/Support**: Sensibilidades equilibradas para versatilidad en todas las situaciones
- **Sniper/Lurker**: Sensibilidades bajas para máxima precisión en long range
- **Flex/Versatile**: Configuración híbrida que permite adaptarse a cualquier rol

Parámetros del Usuario:
- Tipo de Dispositivo: {{{deviceType}}}
- Dispositivo Específico: {{{device}}}
- Tamaño de Pantalla (pulgadas): {{{screenSize}}}
- Estilo de Juego Preferido: {{{playStyle}}}
- Usa Giroscopio: {{{gyroscope}}}

**INSTRUCCIONES PARA CONFIGURACIÓN PROFESIONAL:**

1. **Análisis de Dispositivo**: Considera las características específicas:
   - Tamaño de pantalla y resolución
   - Refresh rate (60Hz/90Hz/120Hz)
   - Calidad del giroscopio
   - Ergonomía para el estilo de agarre

2. **Optimización por Estilo de Juego**:
   - **Agresivo/Fragger**: Prioriza sensibilidades altas para flicks y tracking rápido
   - **Equilibrado/IGL**: Configuración versátil para todas las situaciones
   - **Preciso/Sniper**: Sensibilidades bajas para máxima precisión
   - **Versátil**: Balance óptimo entre velocidad y precisión

3. **Configuración de Giroscopio**: Si está habilitado:
   - Recomienda sensibilidades específicas por scope
   - Sugiere modo de activación (Always On vs Scope On)
   - Considera la curva de aprendizaje

4. **Justificación Técnica**: Explica por qué cada valor es óptimo para:
   - El dispositivo específico
   - El estilo de juego
   - El meta competitivo actual
2.  Utiliza el dispositivo específico proporcionado para afinar aún más la configuración. Ciertos modelos pueden tener tasas de refresco o respuestas táctiles específicas que puedes tener en cuenta para generar valores más reales y precisos.
3.  Genera valores numéricos para la sensibilidad de la "Cámara", "ADS" (Aim Down Sight).
4.  Si el usuario ha especificado 'si' para el giroscopio, genera también una configuración completa para la "Sensibilidad del Giroscopio". Si es 'no', omite el campo del giroscopio en la respuesta.
5.  Los valores deben ser lógicos, realistas y estar optimizados para el tipo de dispositivo y el tamaño de la pantalla. Las tablets generalmente requieren sensibilidades ligeramente más bajas que los teléfonos.
6.  Usa valores de sensibilidad realistas basados en configuraciones profesionales:
    - Cámara TPP/FPP: 15-35% (más bajo para precisión, más alto para velocidad)
    - Miras de corto alcance (Red Dot, Holo): 20-40%
    - Miras medias (2x, 3x, 4x): 15-30%
    - Miras largas (6x, 8x): 8-20%
    - Giroscopio: 100-400% (más bajo para precisión fina)
7.  NO generes un campo "código" en la respuesta. Solo genera los valores de sensibilidad.
8.  Asegúrate de que la salida esté en el formato JSON solicitado sin campos adicionales.`,
});

const sensitivityFlow = ai.defineFlow(
  {
    name: 'sensitivityFlow',
    inputSchema: SensitivityInputSchema,
    outputSchema: SensitivitySchema,
  },
  async (input: SensitivityInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de sensibilidad válida.");
    }
    return output;
  }
);
