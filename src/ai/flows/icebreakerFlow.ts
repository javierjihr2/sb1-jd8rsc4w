'use server';
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
  prompt: `Eres un asistente de matchmaking amigable y creativo para la app SquadUp. Tu tarea es generar 3 mensajes "rompehielos" únicos y atractivos para que el Jugador 1 pueda enviarle al Jugador 2.

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

Instrucciones:
1.  **Personaliza los Mensajes:** Basa cada mensaje en intereses compartidos o complementarios. Busca similitudes en sus armas, mapas favoritos o rangos.
2.  **Tono Amigable y Directo:** Los mensajes deben ser casuales, invitar a jugar juntos y sonar como algo que un jugador real diría.
3.  **Variedad:** Ofrece 3 opciones distintas. Una puede ser sobre su arma favorita en común, otra sobre jugar en su mapa preferido y una tercera más general sobre formar equipo.
4.  **Cortos y al Punto:** Cada mensaje debe ser conciso, ideal para un primer contacto.

Ejemplo: Si ambos aman la M416, un mensaje podría ser: "¡Hola! Vi que también eres fan de la M416. ¿Qué te parece si hacemos un dúo y dominamos con ella?".

Asegúrate de que la salida esté en el formato JSON solicitado.`,
});


const icebreakerFlow = ai.defineFlow(
  {
    name: 'icebreakerFlow',
    inputSchema: IcebreakerInputSchema,
    outputSchema: IcebreakerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("El modelo de IA no devolvió un rompehielos válido.");
    }
    return output;
  }
);

    