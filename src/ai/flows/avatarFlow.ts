
'use server';
/**
 * @fileOverview An AI agent for generating custom player avatars.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - AvatarInput - The input type for the generateAvatar function.
 * - AvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import { AvatarInputSchema, AvatarSchema, type Avatar, type AvatarInput } from '../schemas';

export async function generateAvatar(input: AvatarInput): Promise<Avatar> {
  return avatarFlow(input);
}

const avatarFlow = ai.defineFlow(
  {
    name: 'avatarFlow',
    inputSchema: AvatarInputSchema,
    outputSchema: AvatarSchema,
  },
  async ({prompt}) => {
    
    const llmResponse = await ai.generate({
      prompt: `Crea un prompt detallado para un modelo de generación de imágenes de IA. El objetivo es crear un avatar de personaje para un videojuego de disparos estilo "battle royale" como PUBG Mobile. El avatar debe ser de alta calidad, dinámico y visualmente impactante.
      
      Descripción del usuario: "${prompt}"

      Instrucciones para el prompt mejorado:
      1.  **Estilo:** "Arte conceptual de personaje, detallado, cinemático, renderizado de alta calidad".
      2.  **Tema:** Basado en la descripción del usuario.
      3.  **Añade detalles:** Incorpora elementos como "armadura táctica", "iluminación de neón", "efectos de partículas", "mirada intensa", "fondo de campo de batalla".
      4.  **Formato:** Asegúrate de que el resultado sea un único párrafo de texto conciso y potente.
      
      Ejemplo: si el usuario pide "un soldado con un casco de tigre", un buen prompt sería: "Arte conceptual de personaje de un soldado de élite con armadura táctica y un casco de tigre feroz, iluminación de neón cinemática, mirada intensa, fondo de campo de batalla post-apocalíptico, renderizado de alta calidad".
      `,
    });

    const imageGenerationPrompt = llmResponse.text;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: imageGenerationPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
        throw new Error("El modelo de IA no pudo generar una imagen de avatar.");
    }

    return {
      imageUrl: media.url,
    };
  }
);
