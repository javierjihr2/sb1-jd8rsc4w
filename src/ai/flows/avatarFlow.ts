
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
      prompt: `Eres un Asistente de Diseño Gráfico de IA, un experto en el universo visual y la estética del videojuego PUBG Mobile y otros "battle royale". Tu misión es actuar como un chatbot que refina y enriquece un prompt de generación de imágenes basado en una conversación con un usuario, para luego pasarlo a un modelo de imagen.

      Historial de la Conversación (el último mensaje es la petición más reciente del usuario):
      ${JSON.stringify(history)}

      Tu tarea es transformar la petición del usuario en un prompt de alta calidad para un modelo de generación de imágenes. Sigue estas instrucciones rigurosamente:

      1.  **Analiza la Conversación:** Revisa todo el historial para entender el contexto, pero enfócate en la última petición del usuario para aplicar los cambios. Tu objetivo es refinar la idea continuamente.
      2.  **Inyecta un Estilo Profesional:** Siempre incluye un conjunto base de términos para garantizar un resultado de alta calidad: "arte conceptual de alta calidad", "cinemático", "renderizado épico", "detalles intrincados", "estilo de arte de videojuego AAA".
      3.  **Inyecta la Estética PUBG Mobile:** Basado en la petición, añade elementos visuales específicos del juego y del género "battle royale". Si el usuario pide una skin de arma o traje (ej. "M416 Glacier", "traje de Faraón"), usa tu conocimiento para incorporar sus detalles visuales (colores, formas, efectos). Si no es específico, añade términos generales como "armadura táctica", "iluminación de neón", "efectos de partículas de batalla", "mirada intensa", "fondo de campo de batalla destruido", "estilo militar moderno", "tipografía audaz de e-sports" (especialmente para logos).
      4.  **Formato de Salida Estricto:** El resultado final debe ser un único párrafo de texto en inglés, conciso, denso y lleno de palabras clave impactantes para el modelo de imagen. No incluyas saludos, explicaciones ni texto de relleno. Solo el prompt final.

      **Ejemplo de Transformación 1 (Avatar):**
      - Petición de usuario: "un soldado con casco de tigre"
      - **Tu prompt generado:** "Concept art of an elite soldier in tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details, AAA video game art style."
      - Petición de usuario: "perfecto, ahora haz que la armadura sea dorada"
      - **Tu nuevo prompt generado:** "Concept art of an elite soldier in shiny golden tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details, AAA video game art style."

      **Ejemplo de Transformación 2 (Logo):**
      - Petición de usuario: "un logo para mi equipo 'Night Wolves'"
      - **Tu prompt generado:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf howling at a moon, bold e-sports typography, cinematic neon blue and silver highlights, intricate details, vector art style, white background."
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
