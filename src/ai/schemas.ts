
import {z} from 'zod';

export const PlayerAnalysisInputSchema = z.object({
  wins: z.number().describe('El número de victorias que tiene el jugador.'),
  kills: z.number().describe('El número de bajas que tiene el jugador.'),
  kdRatio: z.number().describe('La relación bajas/muertes del jugador.'),
  rank: z.string().describe('El rango competitivo del jugador.'),
});
export type PlayerAnalysisInput = z.infer<typeof PlayerAnalysisInputSchema>;

export const PlayerAnalysisSchema = z.object({
  playStyle: z
    .string()
    .describe('Un título descriptivo para el principal estilo de juego del jugador.'),
  strengths: z
    .array(z.string())
    .describe('Un array de las fortalezas clave del jugador.'),
  improvementAreas: z
    .array(z.string())
    .describe('Un array de las áreas clave donde el jugador puede mejorar.'),
});
export type PlayerAnalysis = z.infer<typeof PlayerAnalysisSchema>;


export const StrategyInputSchema = z.object({
  map: z.string().describe('El mapa del juego (ej., Erangel, Miramar).'),
  playStyle: z.string().describe('El estilo de juego deseado para el equipo (ej., Agresivo, Pasivo, Equilibrado).'),
  squadSize: z.number().describe('El número de jugadores en la escuadra (1-4).'),
});
export type StrategyInput = z.infer<typeof StrategyInputSchema>;

export const StrategySchema = z.object({
  strategyTitle: z.string().describe('Un título creativo y descriptivo para la estrategia.'),
  dropZone: z.object({
      name: z.string().describe('El nombre de la zona de aterrizaje recomendada.'),
      reason: z.string().describe('Una breve razón por la cual esta zona de aterrizaje se recomienda para la estrategia.'),
  }),
  earlyGame: z.object({
      title: z.string().describe('Título para la estrategia de la fase inicial del juego.'),
      plan: z.string().describe('El plan conciso para el juego temprano, incluyendo prioridades de looteo y posicionamiento inicial.'),
  }),
  midGame: z.object({
      title: z.string().describe('Título para la estrategia de la fase intermedia del juego.'),
      plan: z.string().describe('El plan conciso para el juego intermedio, centrándose en rotaciones, posicionamiento y cuándo enfrentarse.'),
  }),
  lateGame: z.object({
      title: z.string().describe('Título para la estrategia de la fase final del juego.'),
      plan: z.string().describe('El plan conciso para el juego tardío, incluyendo la estrategia del círculo final e identificación de posiciones clave.'),
  }),
  tips: z.array(z.object({
      title: z.string().describe('Un título para el consejo.'),
      description: z.string().describe('Un consejo específico y accionable relacionado con la estrategia general.'),
  })).describe('Un array de 2-3 consejos esenciales para ejecutar la estrategia con éxito.'),
});
export type Strategy = z.infer<typeof StrategySchema>;

export const SensitivityInputSchema = z.object({
    deviceType: z.string().describe("El tipo de dispositivo del jugador (ej. 'Teléfono' o 'Tablet')."),
    deviceBrand: z.string().optional().describe("La marca del dispositivo del jugador (ej. 'Samsung', 'Apple')."),
    deviceModel: z.string().optional().describe("El modelo del dispositivo del jugador (ej. 'Galaxy S23', 'iPhone 14 Pro')."),
    screenSize: z.number().describe("El tamaño de la pantalla en pulgadas."),
    playStyle: z.string().describe("El estilo de juego preferido del jugador (ej. 'cercano', 'larga', 'versatil')."),
    gyroscope: z.string().describe("Si el jugador usa giroscopio ('si' o 'no')."),
});
export type SensitivityInput = z.infer<typeof SensitivityInputSchema>;

const ScopeSensitivitySchema = z.object({
    tpp: z.number().describe("Sensibilidad para la perspectiva en tercera persona (TPP)."),
    fpp: z.number().describe("Sensibilidad para la perspectiva en primera persona (FPP)."),
    redDot: z.number().describe("Sensibilidad para miras de punto rojo, holográficas y de asistencia de mira."),
    scope2x: z.number().describe("Sensibilidad para miras 2x."),
    scope3x: z.number().describe("Sensibilidad para miras 3x."),
    scope4x: z.number().describe("Sensibilidad para miras 4x."),
    scope6x: z.number().describe("Sensibilidad para miras 6x."),
    scope8x: z.number().describe("Sensibilidad para miras 8x."),
});

export const SensitivitySchema = z.object({
    camera: ScopeSensitivitySchema.describe("Sensibilidad de la cámara (al deslizar la pantalla sin disparar)."),
    ads: ScopeSensitivitySchema.describe("Sensibilidad al apuntar con la mira (ADS) mientras se dispara."),
    gyroscope: z.optional(ScopeSensitivitySchema).describe("Sensibilidad del giroscopio (si se solicita)."),
    code: z.string().describe("Un código de sensibilidad de ejemplo que los jugadores podrían usar para importar la configuración."),
});
export type Sensitivity = z.infer<typeof SensitivitySchema>;
