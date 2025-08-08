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
