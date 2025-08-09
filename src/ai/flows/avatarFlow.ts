
'use server';
/**
 * @fileOverview An AI agent for generating custom player avatars, logos, and other designs.
 *
 * - generateAvatar - A function that handles the design generation process.
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
      prompt: `Eres un Asistente de Diseño Gráfico de IA especializado en la estética de videojuegos "battle royale" como PUBG Mobile. Tu tarea es tomar la descripción de un usuario y transformarla en un prompt de generación de imágenes detallado, potente y de alta calidad. El objetivo puede ser un avatar, un logo para un equipo, un emblema, etc.

      Descripción del Usuario: "${prompt}"

      Instrucciones para el Prompt Mejorado:
      1.  **Estilo Principal:** Siempre incluye términos como "arte conceptual de alta calidad", "cinemático", "renderizado épico", "detalles intrincados".
      2.  **Analiza la Petición:** Determina si el usuario quiere un personaje, un logo, un emblema u otro diseño.
      3.  **Añade Detalles Contextuales:** Basado en la petición, inyecta elementos visuales de PUBG Mobile: "armadura táctica", "iluminación de neón", "efectos de partículas de batalla", "mirada intensa", "fondo de campo de batalla", "estilo militar moderno", "tipografía audaz de e-sports" (para logos).
      4.  **Formato de Salida:** El resultado debe ser un único párrafo de texto en inglés, conciso y lleno de palabras clave impactantes para el modelo de imagen.

      Ejemplo 1 (Avatar): Si el usuario pide "un soldado con casco de tigre", un buen prompt sería: "Concept art of an elite soldier in tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details."
      Ejemplo 2 (Logo): Si el usuario pide "un logo para mi equipo 'Águilas Mortales'", un buen prompt sería: "Epic e-sports team logo design for 'Mortal Eagles', featuring a fierce, stylized eagle head with glowing red eyes, sharp metallic wings, bold and aggressive typography, modern military aesthetic, cinematic quality, vector art style."
      `,
    });

    const imageGenerationPrompt = llmResponse.text;

    const generateImage = async () => {
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
      return media.url;
    }

    const [imageUrl1, imageUrl2] = await Promise.all([
        generateImage(),
        generateImage()
    ]);

    return {
      imageUrls: [imageUrl1, imageUrl2],
    };
  }
);
