'use server';
/**
 * @fileOverview An AI agent for generating PUBG Mobile game strategies.
 *
 * - getStrategy - A function that handles the strategy generation process.
 * - StrategyInput - The input type for the getStrategy function.
 * - Strategy - The return type for the getStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const StrategyInputSchema = z.object({
  map: z.string().describe('The game map (e.g., Erangel, Miramar).'),
  playStyle: z.string().describe('The desired team play style (e.g., Aggressive, Passive, Balanced).'),
  squadSize: z.number().describe('The number of players in the squad (1-4).'),
});
export type StrategyInput = z.infer<typeof StrategyInputSchema>;

export const StrategySchema = z.object({
  strategyTitle: z.string().describe('A creative and descriptive title for the strategy.'),
  dropZone: z.object({
      name: z.string().describe('The name of the recommended drop zone.'),
      reason: z.string().describe('A brief reason why this drop zone is recommended for the strategy.'),
  }),
  earlyGame: z.object({
      title: z.string().describe('Title for the early game phase strategy.'),
      plan: z.string().describe('The detailed plan for the early game, including looting priorities and initial positioning.'),
  }),
  midGame: z.object({
      title: z.string().describe('Title for the mid-game phase strategy.'),
      plan: z.string().describe('The detailed plan for the mid-game, focusing on rotations, positioning, and when to engage.'),
  }),
  lateGame: z.object({
      title: z.string().describe('Title for the late-game phase strategy.'),
      plan: z.string().describe('The detailed plan for the late game, including final circle strategy and identifying key positions.'),
  }),
  tips: z.array(z.object({
      title: z.string().describe('A title for the tip.'),
      description: z.string().describe('A specific, actionable tip related to the overall strategy.'),
  })).describe('An array of 2-3 essential tips for executing the strategy successfully.'),
});

export type Strategy = z.infer<typeof StrategySchema>;

export async function getStrategy(input: StrategyInput): Promise<Strategy> {
  return strategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategyPrompt',
  input: {schema: StrategyInputSchema},
  output: {schema: StrategySchema},
  prompt: `You are a world-class PUBG Mobile tactical coach. Your task is to generate a detailed, professional, and actionable game strategy based on user preferences.

The user wants to play on the map '{{{map}}}' with a squad of {{{squadSize}}} player(s) and adopt a '{{{playStyle}}}' play style.

Generate a complete strategy covering all phases of the game. Be specific and provide clear instructions. The tone should be authoritative and expert.

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
