'use server';
/**
 * @fileOverview A player analysis AI agent.
 *
 * - getPlayerAnalysis - A function that handles the player analysis process.
 * - PlayerAnalysisInput - The input type for the getPlayerAnalysis function.
 * - PlayerAnalysis - The return type for the getPlayerAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const PlayerAnalysisInputSchema = z.object({
  wins: z.number().describe('The number of wins the player has.'),
  kills: z.number().describe('The number of kills the player has.'),
  kdRatio: z.number().describe('The kill/death ratio of the player.'),
  rank: z.string().describe('The competitive rank of the player.'),
});
export type PlayerAnalysisInput = z.infer<typeof PlayerAnalysisInputSchema>;

export const PlayerAnalysisSchema = z.object({
  playStyle: z
    .string()
    .describe('A descriptive title for the main play style of the player.'),
  strengths: z
    .array(z.string())
    .describe('An array of key strengths of the player.'),
  improvementAreas: z
    .array(z.string())
    .describe('An array of key areas where the player can improve.'),
});
export type PlayerAnalysis = z.infer<typeof PlayerAnalysisSchema>;

export async function getPlayerAnalysis(
  input: PlayerAnalysisInput
): Promise<PlayerAnalysis> {
  return playerAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playerAnalysisPrompt',
  input: {schema: PlayerAnalysisInputSchema},
  output: {schema: PlayerAnalysisSchema},
  prompt: `You are an expert analyst for the mobile game PUBG Mobile.
Your task is to analyze a player's statistics and provide a concise, expert analysis of their profile.
Based on the provided stats, generate a summary of their play style, their key strengths, and areas for improvement.
Keep the analysis positive and encouraging.

Player Stats:
- Wins: {{{wins}}}
- Kills: {{{kills}}}
- K/D Ratio: {{{kdRatio}}}
- Rank: {{{rank}}}

Provide the analysis in the requested JSON format.`,
});

const playerAnalysisFlow = ai.defineFlow(
  {
    name: 'playerAnalysisFlow',
    inputSchema: PlayerAnalysisInputSchema,
    outputSchema: PlayerAnalysisSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid analysis.");
    }
    return output;
  }
);
