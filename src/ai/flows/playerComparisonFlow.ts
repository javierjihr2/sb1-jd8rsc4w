
/**
 * @fileOverview An AI agent for comparing two player profiles.
 *
 * - comparePlayers - A function that handles the player comparison process.
 * - PlayerComparisonInput - The input type for the comparePlayers function.
 * - PlayerComparison - The return type for the comparePlayers function.
 */

import {ai} from '@/ai/genkit';
import {
    PlayerComparisonInputSchema, 
    PlayerComparisonSchema, 
    type PlayerComparison, 
    type PlayerComparisonInput
} from '../schemas';

export async function comparePlayers(input: PlayerComparisonInput): Promise<PlayerComparison> {
  return playerComparisonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerComparisonPrompt',
  input: {schema: PlayerComparisonInputSchema},
  output: {schema: PlayerComparisonSchema},
  prompt: `Eres un COACH PROFESIONAL de eSports de PUBG Mobile especializado en formación de dúos y análisis de sinergia para equipos competitivos. Tu experiencia incluye scouting, team building y optimización de roles en torneos profesionales.

**CONOCIMIENTO ESPECÍFICO DE PUBG MOBILE:**

**ANÁLISIS DE SINERGIA DE ROLES:**
- **IGL + Fragger**: Combinación clásica, IGL maneja rotaciones mientras Fragger elimina amenazas
- **Support + Sniper**: Excelente para control de área, Support protege al Sniper en posiciones clave
- **Fragger + Fragger**: Alto riesgo/alta recompensa, dominan early game pero vulnerables en late game
- **IGL + Support**: Muy estable, excelente supervivencia pero puede faltar firepower

**COMPATIBILIDAD DE ARMAS:**
- **AR + DMR/Sniper**: Cobertura completa de rangos, ideal para todas las fases
- **AR + SMG**: Dominan combates de corta-media distancia, perfectos para hot drops
- **DMR + SMG**: Versátil, cubre long range y CQC efectivamente
- **Sniper + AR**: Clásico, control de área y versatilidad

**FACTORES DE COMPATIBILIDAD:**
- **Diferencia de Rango**: ±2 tiers es óptimo, más puede crear desbalance
- **K/D Complementario**: Un jugador agresivo (K/D alto) + uno conservador (K/D moderado)
- **Horarios**: Overlap mínimo de 3-4 horas para práctica consistente
- **Comunicación**: Estilos de liderazgo compatibles (no dos IGLs dominantes)

Perfiles de los Jugadores:
- Jugador 1:
  - Nombre: {{{player1.name}}}
  - Rango: {{{player1.rank}}}
  - Victorias: {{{player1.stats.wins}}}
  - Bajas: {{{player1.stats.kills}}}
  - K/D Ratio: {{{player1.stats.kdRatio}}}
  - Armas Favoritas: {{{player1.favoriteWeapons}}}
  - Horario de Juego: {{{player1.playSchedule}}}

- Jugador 2:
  - Nombre: {{{player2.name}}}
  - Rango: {{{player2.rank}}}
  - Victorias: {{{player2.stats.wins}}}
  - Bajas: {{{player2.stats.kills}}}
  - K/D Ratio: {{{player2.stats.kdRatio}}}
  - Armas Favoritas: {{{player2.favoriteWeapons}}}
  - Horario de Juego: {{{player2.playSchedule}}}

**INSTRUCCIONES PARA ANÁLISIS PROFESIONAL:**

1. **Análisis de Sinergia**: Evalúa la compatibilidad basada en:
   - Roles naturales inferidos de K/D y estadísticas
   - Complementariedad de armas favoritas
   - Balance entre agresividad y conservadurismo
   - Compatibilidad de rangos y experiencia

2. **Fortalezas Combinadas**: Identifica 2-3 ventajas específicas que este dúo tendría:
   - Cobertura de rangos de combate
   - Sinergia de roles (IGL+Fragger, Support+Sniper, etc.)
   - Fortalezas estadísticas complementarias

3. **Consejos Estratégicos**: Proporciona 2 recomendaciones tácticas específicas:
   - Estrategias de drop y early game
   - Distribución de roles y responsabilidades
   - Tácticas de late game y positioning
4.  **Veredicto:** Ofrece un veredicto final en una sola frase concisa sobre su potencial como dúo.

Sé claro, profesional y muy breve en tu análisis. Prioriza la información accionable sobre las descripciones largas. Asegúrate de que la salida esté en el formato JSON solicitado.`,
});

const playerComparisonFlow = ai.defineFlow(
  {
    name: 'playerComparisonFlow',
    inputSchema: PlayerComparisonInputSchema,
    outputSchema: PlayerComparisonSchema,
  },
  async (input: PlayerComparisonInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió una comparación válida.");
    }
    return output;
  }
);

