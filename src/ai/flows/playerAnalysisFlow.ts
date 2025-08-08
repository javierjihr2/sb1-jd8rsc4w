'use server';
/**
 * @fileOverview A player analysis AI agent.
 *
 * - getPlayerAnalysis - A function that handles the player analysis process.
 * - PlayerAnalysisInput - The input type for the getPlayerAnalysis function.
 * - PlayerAnalysis - The return type for the getPlayerAnalysis function.
 */

import {ai} from '@/ai/genkit';
import { PlayerAnalysisInputSchema, PlayerAnalysisSchema, type PlayerAnalysis, type PlayerAnalysisInput } from '../schemas';

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
