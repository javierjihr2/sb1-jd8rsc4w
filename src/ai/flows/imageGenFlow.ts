
'use server';
/**
 * @fileOverview An AI agent for generating images from a given prompt.
 *
 * - generateImages - A function that handles the image generation process.
 * - ImageGenInput - The input type for the generateImages function.
 * - ImageGenOutput - The return type for the generateImages function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const ImageGenInputSchema = z.string().describe('The detailed text prompt for image generation.');
export type ImageGenInput = z.infer<typeof ImageGenInputSchema>;

const ImageGenOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the generated images, as data URIs.'),
});
export type ImageGenOutput = z.infer<typeof ImageGenOutputSchema>;


export async function generateImages(prompt: ImageGenInput): Promise<ImageGenOutput> {
  return imageGenFlow(prompt);
}

const imageGenFlow = ai.defineFlow(
  {
    name: 'imageGenFlow',
    inputSchema: ImageGenInputSchema,
    outputSchema: ImageGenOutputSchema,
  },
  async (prompt) => {
    
    const generateImage = async () => {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
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
