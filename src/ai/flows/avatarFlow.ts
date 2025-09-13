
/**
 * @fileOverview An AI agent for generating designs based on a user's idea.
 *
 * - generateDesigns - A function that takes a user's idea and generates design images.
 * - AvatarInput - The input type for the generateDesigns function.
 * - ImageGenOutput - The return type for the generateDesigns function.
 */

import {ai} from '@/ai/genkit';

import { AvatarInputSchema, ImageGenOutputSchema, type AvatarInput, type ImageGenOutput } from '../schemas';

export async function generateDesigns(input: AvatarInput): Promise<ImageGenOutput> {
  return avatarFlow(input);
}

const avatarFlow = ai.defineFlow(
  {
    name: 'avatarFlow',
    inputSchema: AvatarInputSchema,
    outputSchema: ImageGenOutputSchema,
  },
  async ({history}: AvatarInput) => {
    
    // 1. Refine the user's idea into a high-quality prompt for the image model.
    const llmResponse = await ai.generate({
      prompt: `Eres un ESPECIALISTA EN DISEÑO VISUAL de PUBG Mobile con conocimiento experto sobre todos los elementos estéticos del juego, incluyendo outfits exclusivos, skins legendarios, efectos especiales y el universo visual completo del battle royale.

      **CONOCIMIENTO ESPECÍFICO DE PUBG MOBILE:**

      **SETS ICÓNICOS Y SUS CARACTERÍSTICAS VISUALES:**
      - **Glacier Set**: Azul helado cristalino, efectos de hielo, detalles plateados, partículas congeladas
      - **Pharaoh Set**: Dorado egipcio, azul real, jeroglíficos, efectos de arena dorada
      - **Joker Set**: Verde ácido, púrpura oscuro, sonrisa siniestra, caos urbano
      - **Godzilla vs Kong**: Escamas reptilianas, efectos atómicos, destrucción urbana
      - **Royale Pass Sets**: Temáticas de temporada, colores vibrantes, efectos únicos
      - **Mythic Outfits**: Efectos de partículas, animaciones especiales, auras brillantes

      **ELEMENTOS VISUALES DEL JUEGO:**
      - **Tactical/Military**: Camuflaje, gear táctico, visores nocturnos, armadura balística
      - **Urban/Street**: Hoodies, graffiti, neon urbano, estética cyberpunk
      - **Fantasy/Themed**: Efectos mágicos, auras elementales, transformaciones
      - **Vehicle Aesthetics**: Llamas, rayos, cromados, efectos de velocidad
      - **Weapon Skins**: Acabados metálicos, patrones únicos, efectos de disparo

      **PALETAS DE COLORES CARACTERÍSTICAS:**
      - **Legendary**: Dorado + negro, púrpura + plata, azul eléctrico + blanco
      - **Epic**: Naranja vibrante, verde esmeralda, rojo carmesí
      - **Military**: Verde oliva, marrón tierra, gris táctico, negro mate
      - **Neon/Cyber**: Azul neón, verde lima, magenta eléctrico, cian brillante

      **EFECTOS ESPECIALES DEL JUEGO:**
      - Partículas de spawn, auras de rareza, efectos de movimiento
      - Iluminación dramática, sombras tácticas, reflejos metálicos
      - Efectos de batalla: humo, explosiones, chispas, fuego
      - Ambientes: Erangel, Miramar, Sanhok, Livik (cada uno con su estética única)

      Tu misión es transformar las solicitudes conversacionales del usuario en prompts de generación de imágenes de alta calidad, incorporando el conocimiento específico de PUBG Mobile.

      Recibirás todo el historial de conversación. Tu tarea es interpretar el último mensaje del usuario en el contexto del historial para generar un nuevo prompt refinado.

      **INSTRUCCIONES RIGUROSAS:**

      1.  **Analizar la Solicitud:** Determina si el usuario pide un avatar de personaje, logo de equipo, emblema, skin de arma, o algo más basado en la conversación.
      2.  **Incorporar Referencias de Imagen:** Si el usuario proporciona una imagen, úsala como referencia visual primaria para composición, estilo o concepto. Combina la solicitud de texto con la información visual de la imagen.
      3.  **Inyectar Estilo Profesional:** Siempre incluye términos base para asegurar alta calidad: "high-quality concept art", "cinematic", "epic render", "intricate details", "AAA video game art style".
      4.  **Inyectar Estética PUBG Mobile Específica:** Basado en la solicitud, añade elementos visuales específicos del juego. Usa tu conocimiento de skins específicos (ej. "M416 Glacier", "Pharaoh X-Suit", "Joker outfit") para incorporar sus detalles visuales (colores, formas, efectos). Si la solicitud no es específica, añade términos generales como "tactical armor", "neon lighting", "battle particle effects", "intense gaze", "destroyed battlefield background", "modern military style", "bold e-sports typography" (especialmente para logos).
      5.  **Formato de Salida Estricto:** El resultado final debe ser un solo párrafo conciso en inglés, denso y lleno de palabras clave impactantes para el modelo de imagen. No incluyas saludos, explicaciones o texto de relleno. Solo el prompt final.

      **Ejemplo de Conversación:**
      - Primer Mensaje del Usuario: "un logo para mi equipo 'Night Wolves'"
      - **Tu Prompt Inferido:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf howling at a moon, bold e-sports typography, cinematic neon blue and silver highlights, intricate details, vector art style, white background, PUBG Mobile aesthetic."
      - Segundo Mensaje del Usuario (con imagen de máscara dorada de faraón): "ok ahora haz que el lobo se vea como esto"
      - **Tu NUEVO Prompt Inferido:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf with design elements inspired by the golden and blue Pharaoh X-Suit from PUBG Mobile, incorporating Egyptian hieroglyphs and golden particle effects, howling at a moon, bold e-sports typography, cinematic neon blue and gold highlights, intricate details, vector art style, white background."

      Historial de Conversación:
      ${history.map((m: any) => {
        let message = `${m.role}: ${m.text || ''}`;
        if (m.image) {
          message += ` [IMAGEN PROPORCIONADA]`;
        }
        return message;
      }).join('\n')}
      `,
    });

    const imageGenerationPrompt = llmResponse.text;
    const userMessageWithImage = history.find((m: any) => m.role === 'user' && m.image);

    const promptForGeneration: (string | {media: {url: string}})[] = [imageGenerationPrompt];
    if (userMessageWithImage?.image) {
        promptForGeneration.unshift({media: {url: userMessageWithImage.image}});
    }


    // 2. Generate two images in parallel using the refined prompt.
    const generateImage = async () => {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: promptForGeneration as string | object[], // Cast because array of strings/objects is valid
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
       if (!media?.url) {
        throw new Error("El modelo de IA no pudo generar una imagen.");
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
