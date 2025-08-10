
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
  async ({idea}) => {
    
    // 1. Refine the user's idea into a high-quality prompt for the image model.
    const llmResponse = await ai.generate({
      prompt: `You are an expert AI Graphic Design Assistant for gaming, specializing in the visual universe and aesthetics of PUBG Mobile and other "battle royale" games. Your mission is to transform a user's simple idea into a high-quality, professional image generation prompt.

      User's Idea: "${idea}"

      Your task is to convert the user's request into a high-quality prompt for an image generation model. Follow these instructions rigorously:

      1.  **Analyze the Request:** Determine if the user is asking for a character avatar, a team logo, an emblem, or something else.
      2.  **Inject Professional Style:** Always include a base set of terms to ensure a high-quality result: "high-quality concept art", "cinematic", "epic render", "intricate details", "AAA video game art style".
      3.  **Inject PUBG Mobile Aesthetics:** Based on the request, add specific visual elements from the game and "battle royale" genre. Use your knowledge of specific skins (e.g., "M416 Glacier", "Pharaoh suit") to incorporate their visual details (colors, shapes, effects). If the request is not specific, add general terms like "tactical armor", "neon lighting", "battle particle effects", "intense gaze", "destroyed battlefield background", "modern military style", "bold e-sports typography" (especially for logos).
      4.  **Strict Output Format:** The final result must be a single, concise paragraph of text in English, dense and full of impactful keywords for the image model. Do not include greetings, explanations, or filler text. Just the final prompt.

      **Example Transformation 1 (Avatar):**
      - User Idea: "a soldier with a tiger helmet"
      - **Your Generated Prompt:** "Concept art of an elite soldier in tactical armor with a fierce tiger helmet, cinematic neon lighting, intense gaze, post-apocalyptic battlefield background, epic quality render, intricate details, AAA video game art style."
      
      **Example Transformation 2 (Logo):**
      - User Idea: "a logo for my team 'Night Wolves'"
      - **Your Generated Prompt:** "Esports team logo for 'Night Wolves', featuring a stylized, aggressive wolf howling at a moon, bold e-sports typography, cinematic neon blue and silver highlights, intricate details, vector art style, white background."
      `,
    });

    const imageGenerationPrompt = llmResponse.text;

    // 2. Generate two images in parallel using the refined prompt.
    const generateImage = async () => {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: imageGenerationPrompt,
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
