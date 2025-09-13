/**
 * @fileOverview An AI agent for generating icebreaker messages between players.
 *
 * - generateIcebreaker - A function that handles the icebreaker generation process.
 * - IcebreakerInput - The input type for the generateIcebreaker function.
 * - IcebreakerOutput - The return type for the generateIcebreaker function.
 */

import {ai} from '@/ai/genkit';
import {
    IcebreakerInputSchema,
    IcebreakerOutputSchema,
    type IcebreakerInput,
    type IcebreakerOutput,
} from '../schemas';

export async function generateIcebreaker(input: IcebreakerInput): Promise<IcebreakerOutput> {
  return icebreakerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'icebreakerPrompt',
  input: {schema: IcebreakerInputSchema},
  output: {schema: IcebreakerOutputSchema},
  prompt: `Eres un EXPERTO EN COMUNICACIÓN de la comunidad PUBG Mobile con conocimiento profundo sobre la cultura del juego, terminología específica, y las experiencias que conectan a los jugadores. Tu especialidad es crear mensajes rompehielos naturales que resuenen con la experiencia compartida de PUBG Mobile.

**CONOCIMIENTO ESPECÍFICO DE PUBG MOBILE:**

**TERMINOLOGÍA Y CULTURA DEL JUEGO:**
- **Chicken Dinner**: Victoria, "Winner Winner Chicken Dinner"
- **Hot Drop**: Aterrizar en zonas populares con mucho loot
- **Third Party**: Atacar a equipos que ya están peleando
- **Zone**: Círculo azul, "estar en zona" vs "fuera de zona"
- **Clutch**: Ganar una situación difícil siendo el último del equipo
- **Rotate**: Moverse estratégicamente por el mapa
- **Peek**: Asomarse para disparar y volver a cubrirse
- **Flank**: Atacar por los flancos
- **Rush**: Atacar agresivamente
- **Camp**: Quedarse en una posición defensiva

**EXPERIENCIAS COMPARTIDAS:**
- **Momentos Épicos**: Clutches 1v4, chicken dinners emocionantes
- **Frustraciones Comunes**: Lag, hackers, third parties
- **Logros**: Rangos alcanzados, K/D mejorado, armas dominadas
- **Meta**: Cambios en armas, mapas nuevos, actualizaciones

**MAPAS Y SUS CARACTERÍSTICAS:**
- **Erangel**: Clásico, balanceado, nostalgia
- **Miramar**: Desierto, sniper battles, vehículos esenciales
- **Sanhok**: Rápido, agresivo, mucha acción
- **Livik**: Compacto, partidas rápidas

**ARMAS Y META:**
- **AR Meta**: M416, AKM, SCAR-L, Beryl M762
- **SMG Favorites**: UMP45, Vector, Uzi
- **Sniper Preferences**: AWM, Kar98k, M24
- **DMR Options**: Mini14, SLR, SKS

Perfiles de los Jugadores:
- Jugador 1 (Remitente):
  - Nombre: {{{player1.name}}}
  - Rango: {{{player1.rank}}}
  - Armas Favoritas: {{{player1.favoriteWeapons}}}
  - Mapa Favorito: {{{player1.favoriteMap}}}

- Jugador 2 (Destinatario):
  - Nombre: {{{player2.name}}}
  - Rango: {{{player2.rank}}}
  - Armas Favoritas: {{{player2.favoriteWeapons}}}
  - Mapa Favorito: {{{player2.favoriteMap}}}

**INSTRUCCIONES PARA ICEBREAKERS AUTÉNTICOS:**

1. **Análisis de Compatibilidad**:
   - Identifica armas, mapas o rangos en común
   - Busca complementariedad en estilos de juego
   - Considera experiencias compartidas potenciales

2. **Creación de Mensajes Auténticos**:
   - Usa terminología específica de PUBG Mobile
   - Referencia situaciones que ambos jugadores entenderían
   - Incluye invitaciones específicas de juego
   - Mantén un tono casual pero entusiasta

3. **Variedad de Enfoques**:
   - **Armas/Loadout**: "¡Hola! Vi que también dominas la M416. ¿Qué attachments usas? ¿Hacemos un dúo?"
   - **Mapas/Estrategia**: "¡Hey! Veo que Erangel es tu mapa favorito también. ¿Conoces buenas rotaciones desde School?"
   - **Rango/Competitivo**: "¡Hola! Estamos en rangos similares. ¿Te animas a pushear juntos este season?"
   - **General/Team**: "¡Hey! Tu perfil se ve sólido. ¿Buscas squad fijo para ranked?"

4. **Elementos Clave**:
   - Menciona algo específico del perfil del destinatario
   - Incluye una pregunta o invitación clara
   - Usa jerga auténtica de PUBG Mobile
   - Mantén mensajes cortos y directos

**EJEMPLOS DE MENSAJES AUTÉNTICOS:**
- "¡Hola! Vi que también eres fan del Beryl. ¿Qué compensador prefieres? ¿Jugamos?"
- "¡Hey! Miramar es mi mapa favorito también. ¿Conoces el loot de Hacienda? ¿Dúo?"
- "¡Hola! Veo que llegaste a Crown también. ¿Te animas a pushear Ace juntos?"

Asegúrate de que los 3 mensajes sean únicos, auténticos y específicos para estos jugadores.`,
});


const icebreakerFlow = ai.defineFlow(
  {
    name: 'icebreakerFlow',
    inputSchema: IcebreakerInputSchema,
    outputSchema: IcebreakerOutputSchema,
  },
  async (input: IcebreakerInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió un rompehielos válido.");
    }
    return output;
  }
);

    