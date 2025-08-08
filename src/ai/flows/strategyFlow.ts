'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile game strategies.
 *
 * - getStrategy - A function that handles the strategy generation process.
 * - StrategyInput - The input type for the getStrategy function.
 * - Strategy - The return type for the getStrategy function.
 */

import {ai} from '@/ai/genkit';
import { StrategyInputSchema, StrategySchema, type Strategy, type StrategyInput } from '../schemas';

export async function getStrategy(input: StrategyInput): Promise<Strategy> {
  return strategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategyPrompt',
  input: {schema: StrategyInputSchema},
  output: {schema: StrategySchema},
  prompt: `You are a world-class PUBG Mobile tactical coach. You are an expert on the most likely final zone locations for each map. Your task is to generate a detailed, professional, and actionable game strategy based on user preferences.

The user wants to play on the map '{{{map}}}' with a squad of {{{squadSize}}} player(s) and adopt a '{{{playStyle}}}' play style.

Generate a complete strategy covering all phases of the game. Be specific and provide clear instructions. The tone should be authoritative and expert. The late-game plan should heavily factor in your knowledge of common zone shifts and final circles for the selected map.

Provide the response in the requested JSON format. The tips should be concise and highly relevant to the strategy.`,
});

const strategyFlow = ai.defineFlow(
  {
    name: 'strategyFlow',
    inputSchema: StrategyInputSchema,
    outputSchema: StrategySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid strategy.");
    }
    return output;
  }
);
