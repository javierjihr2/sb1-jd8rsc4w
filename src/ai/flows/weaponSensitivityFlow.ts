
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
  prompt: `Eres un ESPECIALISTA EN ARMAS de eSports de PUBG Mobile con conocimiento profundo sobre balística, retroceso y configuraciones profesionales específicas por arma. Tu experiencia incluye análisis de patrones de retroceso y optimización de sensibilidades para equipos competitivos.

**CONOCIMIENTO ESPECÍFICO DE ARMAS PUBG MOBILE:**

**ASSAULT RIFLES - PATRONES DE RETROCESO:**
- **M416**: Retroceso bajo y controlable, patrón vertical predecible. Sens ADS: 25-35%
- **AKM**: Retroceso alto vertical + horizontal, requiere control activo. Sens ADS: 30-40%
- **M762**: Retroceso muy alto, patrón en S, cadencia alta. Sens ADS: 35-45%
- **SCAR-L**: Retroceso moderado, muy estable con accesorios. Sens ADS: 22-32%
- **QBZ95**: Retroceso bajo, exclusivo de Sanhok, muy controlable. Sens ADS: 24-34%
- **G36C**: Retroceso moderado, exclusivo de Vikendi. Sens ADS: 26-36%

**SMGs - CARACTERÍSTICAS CQC:**
- **Vector**: Cadencia extrema, retroceso vertical alto pero corto. Sens ADS: 40-55%
- **UMP45**: Retroceso muy bajo, ideal para principiantes. Sens ADS: 35-45%
- **MP5K**: Retroceso bajo, buen balance. Sens ADS: 38-48%
- **P90**: Retroceso moderado, exclusivo de Livik. Sens ADS: 36-46%

**DMRs - PRECISIÓN A DISTANCIA:**
- **SLR**: Retroceso alto, damage alto, requiere control. Sens ADS: 18-28%
- **SKS**: Retroceso moderado, semi-auto rápido. Sens ADS: 20-30%
- **Mini14**: Retroceso bajo, muy estable. Sens ADS: 16-26%
- **Mk14**: Retroceso muy alto, full-auto disponible. Sens ADS: 22-32%

**SNIPER RIFLES - MÁXIMA PRECISIÓN:**
- **Kar98k**: Bolt-action, sin retroceso en ADS. Sens ADS: 12-22%
- **M24**: Similar al Kar98k, ligeramente más estable. Sens ADS: 12-22%
- **AWM**: Crate weapon, máximo damage. Sens ADS: 10-20%

**CONFIGURACIONES PROFESIONALES POR ESTILO:**
- **Aggressive Fragger**: +15-25% sobre base para tracking rápido
- **Balanced Player**: Valores base optimizados por arma
- **Precision Sniper**: -10-20% bajo base para máximo control
- **Versatile Flex**: Configuración híbrida adaptable

**FACTORES DE OPTIMIZACIÓN:**
- **Miras Recomendadas**: Red Dot/Holo para CQC, 3x/4x para mid-range, 6x+ para long-range
- **Accesorios Impact**: Compensador (-15% retroceso), Culata Táctica (-10% retroceso)
- **Dispositivo Scaling**: iPhone (+5-10%), iPad (-5-10%), Android (base)

Perfil del Jugador:
- Tipo de Dispositivo: {{{deviceType}}}
- Dispositivo Específico: {{{device}}}
- Tamaño de Pantalla (pulgadas): {{{screenSize}}}
- Estilo de Juego Preferido: {{{playStyle}}}
- Usa Giroscopio: {{{gyroscope}}}

Arma a Optimizar:
- Nombre: {{{weaponName}}}
- Categoría: {{{weaponCategory}}}

**INSTRUCCIONES PARA OPTIMIZACIÓN PROFESIONAL:**

1. **Análisis Balístico del Arma**: Considera características específicas:
   - Patrón de retroceso vertical y horizontal
   - Cadencia de fuego y tiempo entre disparos
   - Damage por bala y efectividad por rango
   - Accesorios recomendados para control

2. **Optimización por Dispositivo**:
   - Ajusta según tamaño de pantalla y responsividad
   - Considera refresh rate del dispositivo
   - Adapta para ergonomía de agarre

3. **Configuración por Estilo de Juego**:
   - **Agresivo**: Sensibilidades más altas para flicks y tracking
   - **Equilibrado**: Valores optimizados para versatilidad
   - **Preciso**: Sensibilidades bajas para máximo control

4. **Integración con Giroscopio**: Si está habilitado:
   - Recomienda sensibilidades gyro específicas para el arma
   - Sugiere técnicas de control híbrido (dedos + gyro)
   - Considera curva de aprendizaje por tipo de arma
    *   **Uso Típico:** Un rifle de francotirador (Kar98K, M24) necesita una sensibilidad de mira alta (6x, 8x) muy baja para la precisión, mientras que un SMG necesita sensibilidades altas en miras de corto alcance (Punto Rojo, Holo). Un DMR es un híbrido.
2.  **Ajusta según el Perfil:** Cruza las características del arma con el perfil del jugador. Por ejemplo, un jugador de "Combate Cercano" necesitará valores de sensibilidad más altos para un SMG que un jugador de "Larga Distancia".
3.  **Genera Valores de Sensibilidad:** Crea valores numéricos para la sensibilidad de "Cámara" (sin disparar) y "ADS" (disparando). Estos valores deben ser lógicos y estar finamente ajustados para el arma específica. No generes una sección de giroscopio, ya que esta suele ser una configuración más general.
4.  **Genera Valores Realistas:** Usa valores de sensibilidad realistas basados en configuraciones profesionales para el arma específica:
    - Cámara TPP/FPP: 15-35% (más bajo para precisión, más alto para velocidad)
    - Miras de corto alcance (Red Dot, Holo): 20-40%
    - Miras medias (2x, 3x, 4x): 15-30%
    - Miras largas (6x, 8x): 8-20%
    Los valores deben ser lógicos, realistas y estar optimizados para el tipo de dispositivo, el tamaño de la pantalla y las características específicas del arma. Las tablets generalmente requieren sensibilidades ligeramente más bajas que los teléfonos.
5.  **Formato de Salida:** NO generes un campo "código" en la respuesta. Solo genera los valores de sensibilidad. Asegúrate de que la salida esté en el formato JSON solicitado sin campos adicionales.`,
});

const weaponSensitivityFlow = ai.defineFlow(
  {
    name: 'weaponSensitivityFlow',
    inputSchema: WeaponSensitivityInputSchema,
    outputSchema: WeaponSensitivitySchema,
  },
  async (input: WeaponSensitivityInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una configuración de sensibilidad de arma válida.");
    }
    // Omit gyroscope from the response even if the AI generates it.
    const { gyroscope: _, ...rest } = output as WeaponSensitivity & { gyroscope?: any };
    return rest;
  }
);
