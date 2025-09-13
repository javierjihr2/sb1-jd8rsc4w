
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
  prompt: `Eres un ESPECIALISTA EN HUD de eSports de PUBG Mobile con experiencia en optimización de layouts para jugadores profesionales. Tu conocimiento incluye configuraciones de equipos competitivos, ergonomía avanzada y layouts específicos por dispositivo.

**CONOCIMIENTO ESPECÍFICO DE PUBG MOBILE:**

**LAYOUTS PROFESIONALES POR DEDOS:**
- **2 Dedos (Thumbs)**: Layout básico, botones grandes, acceso fácil a funciones esenciales
- **3 Dedos (Thumbs + Index)**: Añade disparo con índice, mejora aim y movimiento simultáneo
- **4 Dedos (Claw)**: Layout avanzado, control independiente de cámara y movimiento
- **5-6 Dedos (Full Claw)**: Layout profesional, máximo control, usado en torneos

**CONFIGURACIONES POR DISPOSITIVO:**
- **iPhone (6.1"-6.7")**: Botones compactos, aprovecha bordes curvos, triggers virtuales
- **iPad (10"-13")**: Botones distribuidos, mayor espacio para precisión, layout extendido
- **Android Flagship**: Configuración balanceada, adaptable a diferentes ratios
- **Android Gaming**: Optimizado para triggers físicos, cooling zones

**ELEMENTOS HUD ESENCIALES:**
- **Fire Button**: Posición óptima según dedos, tamaño según dispositivo
- **Aim Button**: Separado del fire para mejor control, accesible con índice
- **Movement Joystick**: Posición ergonómica, tamaño optimizado
- **Camera Control**: Área amplia para flicks, sensible al touch
- **Scope Button**: Acceso rápido, posición no conflictiva
- **Lean Buttons**: Para peek advantage, esenciales en competitivo
- **Grenade Wheel**: Acceso rápido a utilities, posición estratégica
- **Reload/Interact**: Botones grandes, fácil acceso en combate

**OPTIMIZACIONES POR ESTILO DE JUEGO:**
- **Aggressive/Fragger**: Fire buttons grandes, lean buttons prominentes, quick scope
- **IGL/Support**: Botones de comunicación accesibles, map button visible
- **Sniper/Lurker**: Scope buttons optimizados, hold breath button accesible
- **Versatile**: Layout balanceado, acceso rápido a todas las funciones

**CONFIGURACIONES AVANZADAS:**
- **Peek & Fire**: Combinación de lean + fire para advantage
- **Quick Scope**: Scope + fire simultáneo para sniper plays
- **Slide Jump**: Combinación de crouch + jump para movement
- **Gyroscope Integration**: Botones que no interfieren con gyro movement

**ERGONOMÍA PROFESIONAL:**
- **Thumb Zones**: Áreas cómodas para pulgares, evitar overstretch
- **Index Finger Reach**: Posiciones naturales para índices en claw
- **Palm Rejection**: Evitar activación accidental con palmas
- **Cooling Considerations**: Evitar botones en zonas de calentamiento

Parámetros del Usuario:
- Tipo de Dispositivo: {{{deviceType}}}
- Dispositivo Específico: {{{device}}}
- Tamaño de Pantalla (pulgadas): {{{screenSize}}}
- Cantidad de Dedos: {{{fingerCount}}}
- Estilo de Juego Preferido: {{{playStyle}}}

**INSTRUCCIONES PARA CONFIGURACIÓN PROFESIONAL:**

1. **Análisis de Dispositivo y Ergonomía**:
   - Considera dimensiones específicas y ratio de pantalla
   - Evalúa zonas de calentamiento y cooling
   - Adapta para triggers físicos si están disponibles
   - Optimiza para refresh rate del dispositivo

2. **Optimización por Cantidad de Dedos**:
   - **2 Dedos**: Layout simplificado, botones grandes, funciones esenciales
   - **3-4 Dedos**: Separación de funciones, mejor control independiente
   - **5-6 Dedos**: Layout profesional completo, máxima eficiencia

3. **Personalización por Estilo de Juego**:
   - Prioriza botones según rol competitivo
   - Optimiza acceso a funciones críticas del estilo
   - Considera meta actual y estrategias profesionales

4. **Configuración Avanzada**:
   - Sugiere combinaciones de botones profesionales
   - Recomienda técnicas de transición entre layouts
   - Proporciona tips de adaptación específicos

5. **Consejos de Maestría**: Ofrece 2 consejos profesionales para:
   - Técnicas de práctica específicas
   - Optimizaciones progresivas
   - Adaptación a diferentes situaciones de juego

**ESTILO DE RESPUESTA:**
Usa terminología profesional de eSports, referencias a configuraciones de pros cuando sea relevante, y proporciona explicaciones que un jugador competitivo pueda implementar inmediatamente.

NOTA: Para la imageUrl, NO generes una URL placeholder. Esta será generada automáticamente por el sistema.`,
});

const controlsFlow = ai.defineFlow(
  {
    name: 'controlsFlow',
    inputSchema: ControlsInputSchema,
    outputSchema: ControlsSchema,
  },
  async (input: ControlsInput) => {
    // 1. Generate the controls configuration
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de controles válida.");
    }

    // 2. Generate an image for the controls layout
    const imagePrompt = `Create a detailed PUBG Mobile HUD layout diagram for ${input.deviceType} with ${input.fingerCount} fingers. Show the optimal button placement, finger positions, and control scheme. The layout should be professional, clear, and optimized for ${input.deviceType === 'Tablet' ? 'tablet gaming with larger buttons and better spacing' : 'mobile gaming with compact, efficient button placement'}. Include visual indicators for movement controls, aim controls, fire buttons, and action buttons. Make it look like a professional gaming guide diagram.`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error("El modelo de IA no pudo generar una imagen para los controles.");
    }

    // 3. Return the complete controls configuration with the generated image
    return {
      ...output,
      imageUrl: media.url
    };
  }
);

export { controlsFlow };

    