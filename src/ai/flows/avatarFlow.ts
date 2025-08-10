
'use server';
/**
 * @fileOverview An AI agent for generating designs based on a user's idea.
 *
 * - generateDesigns - A function that takes a user's idea and generates design images.
 * - AvatarInput - The input type for the generateDesigns function.
 * - ImageGenOutput - The return type for the generateDesigns function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
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
  async ({history}) => {
    
    // 1. Refine the user's idea into a high-quality prompt for the image model.
    const llmResponse = await ai.generate({
      prompt: `You are an expert AI Graphic Design Assistant for gaming, specializing in the visual universe and aesthetics of PUBG Mobile and other "battle royale" games. Your mission is to transform a user's conversational requests into a high-quality, professional image generation prompt.

      You will be given the entire conversation history. Your task is to interpret the user's latest message in the context of the history to generate a new, refined image generation prompt.

      Follow these instructions rigorously:

      1.  **Analyze the Request:** Determine if the user is asking for a character avatar, a team logo, an emblem, or something else based on the conversation.
      2.  **Incorporate Image References:** If the user provides an image, use it as the primary visual reference for composition, style, or concept. Combine the text request with the visual information from the image.
      3.  **Inject Professional Style:** Always include a base set of terms to ensure a high-quality result: "high-quality concept art", "cinematic", "epic render", "intricate details", "AAA video game art style".
      4.  **Inject PUBG Mobile Aesthetics:** Based on the request, add specific visual elements from the game and "battle royale" genre. Use your knowledge of specific skins (e.g., "M416 Glacier", "Pharaoh suit") to incorporate their visual details (colors, shapes, effects). If the request is not specific, add general terms like "tactical armor", "neon lighting", "battle particle effects", "intense gaze", "destroyed battlefield background", "modern military style", "bold e-sports typography" (especially for logos).
      5.  **Strict Output Format:** The final result must be a single, concise paragraph of text in English, dense and full of impactful keywords for the image model. Do not include greetings, explanations, or filler text. Just the final prompt.

      **Example Conversation:**
      - User's First Message: "a logo for my team 'Night Wolves'"
      - **Your Inferred Prompt:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf howling at a moon, bold e-sports typography, cinematic neon blue and silver highlights, intricate details, vector art style, white background."
      - User's Second Message (with an image of a golden pharaoh mask): "ok now make the wolf look like this"
      - **Your NEW Inferred Prompt:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf with design elements inspired by the golden and blue Pharaoh X-Suit from the provided image, howling at a moon, bold e-sports typography, cinematic neon blue and gold highlights, intricate details, vector art style, white background."

      Conversation History:
      ${history.map(m => {
        let message = `${m.role}: ${m.text || ''}`;
        if (m.image) {
          message += ` [IMAGE PROVIDED]`;
        }
        return message;
      }).join('\n')}
      `,
    });

    const imageGenerationPrompt = llmResponse.text;
    const userMessageWithImage = history.find(m => m.role === 'user' && m.image);

    const promptForGeneration: (string | {media: {url: string}})[] = [imageGenerationPrompt];
    if (userMessageWithImage?.image) {
        promptForGeneration.unshift({media: {url: userMessageWithImage.image}});
    }


    // 2. Generate two images in parallel using the refined prompt.
    const generateImage = async () => {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: promptForGeneration as any, // Cast because array of strings/objects is valid
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
