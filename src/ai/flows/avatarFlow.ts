
'use server';
/**
 * @fileOverview An AI agent for generating custom player avatars, logos, and other designs through a conversational interface.
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
  async ({history}) => {
    
    const llmResponse = await ai.generate({
      prompt: `Eres un Asistente de Diseño Gráfico de IA especializado en la estética de videojuegos "battle royale" como PUBG Mobile. Tu tarea es actuar como un chatbot que refina un prompt de generación de imágenes basado en una conversación con un usuario.

      Historial de la Conversación (el último mensaje es la petición más reciente del usuario):
      ${JSON.stringify(history)}

      Instrucciones para el Prompt Mejorado:
      1.  **Analiza la Conversación:** Revisa todo el historial para entender el contexto, pero enfócate en la última petición del usuario para aplicar los cambios.
      2.  **Estilo Principal:** Siempre incluye términos como "arte conceptual de alta calidad", "cinemático", "renderizado épico", "detalles intrincados".
      3.  **Añade Detalles Contextuales:** Basado en la petición, inyecta elementos visuales de PUBG Mobile: "armadura táctica", "iluminación de neón", "efectos de partículas de batalla", "mirada intensa", "fondo de campo de batalla", "estilo militar moderno", "tipografía audaz de e-sports" (para logos).
      4.  **Formato de Salida:** El resultado debe ser un único párrafo de texto en inglés, conciso y lleno de palabras clave impactantes para el modelo de imagen. No incluyas saludos ni texto de relleno, solo el prompt final.

      Ejemplo de Conversación:
      - Usuario: "un soldado con casco de tigre"
      - Tu prompt generado: "Concept art of an elite soldier in tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details."
      - Usuario: "perfecto, ahora haz que la armadura sea dorada"
      - Tu nuevo prompt generado: "Concept art of an elite soldier in golden tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details."
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
      revisedPrompt: imageGenerationPrompt,
    };
  }
);
