
import {z} from 'zod';

export const PlayerAnalysisInputSchema = z.object({
  wins: z.number().describe('El número de victorias que tiene el jugador.'),
  kills: z.number().describe('El número de bajas que tiene el jugador.'),
  kdRatio: z.number().describe('La relación bajas/muertes del jugador.'),
  rank: z.string().describe('El rango competitivo del jugador.'),
  friends: z.array(z.object({
    name: z.string(),
    avatarUrl: z.string(),
  })).describe('Una lista de amigos disponibles para elegir como compañero ideal.'),
});
export type PlayerAnalysisInput = z.infer<typeof PlayerAnalysisInputSchema>;

const RecommendedFriendSchema = z.object({
    name: z.string().describe("El nombre del amigo recomendado."),
    avatarUrl: z.string().describe("La URL del avatar del amigo recomendado."),
    reason: z.string().describe("Una razón coqueta y profesional de por qué este amigo es el compañero ideal."),
});

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
  recommendedFriend: z.optional(RecommendedFriendSchema).describe("El compañero de equipo recomendado para formar un 'Dúo Dinámico'."),
});
export type PlayerAnalysis = z.infer<typeof PlayerAnalysisSchema>;


export const MapPlannerInputSchema = z.object({
  map: z.string().describe('El mapa del juego (ej., Erangel, Miramar).'),
  playStyle: z.string().describe('El estilo de juego deseado para el equipo (ej., Agresivo, Pasivo, Equilibrado).'),
  squadSize: z.number().describe('El número de jugadores en la escuadra (1-4).'),
  riskLevel: z.string().describe("El nivel de riesgo que el jugador está dispuesto a asumir (Bajo, Medio, Alto)."),
  focus: z.string().describe("El enfoque principal de la partida (Rotación, Combate, Loteo).")
});
export type MapPlannerInput = z.infer<typeof MapPlannerInputSchema>;

export const MapPlannerSchema = z.object({
  planTitle: z.string().describe('Un título creativo y descriptivo para el plan de partida.'),
  dropZone: z.object({
      name: z.string().describe('El nombre de la zona de aterrizaje recomendada.'),
      reason: z.string().describe('Una breve razón por la cual esta zona de aterrizaje se recomienda para la estrategia.'),
  }),
  earlyGame: z.object({
      plan: z.string().describe('El plan conciso para el juego temprano, incluyendo prioridades de looteo y posicionamiento inicial.'),
  }),
  midGame: z.object({
      plan: z.string().describe('El plan conciso para el juego intermedio, centrándose en rotaciones, posicionamiento y cuándo enfrentarse.'),
  }),
  lateGame: z.object({
      plan: z.string().describe('El plan conciso para el juego tardío, incluyendo la estrategia del círculo final e identificación de posiciones clave.'),
  }),
  recommendedLoadout: z.object({
      primaryWeapon: z.string().describe("El arma principal recomendada para este plan."),
      secondaryWeapon: z.string().describe("El arma secundaria recomendada para este plan."),
      reason: z.string().describe("Una breve explicación de por qué este equipamiento es ideal."),
  }).describe("Equipamiento recomendado para ejecutar el plan con éxito."),
  rotationPlan: z.string().describe("Un plan de rotación sugerido, mencionando puntos de referencia o zonas a controlar."),
});
export type MapPlanner = z.infer<typeof MapPlannerSchema>;

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


export const ControlsInputSchema = z.object({
  deviceType: z.string().describe("El tipo de dispositivo del jugador (ej. 'Teléfono' o 'Tablet')."),
  fingerCount: z.number().describe("El número de dedos que el jugador usa para jugar (2, 3, 4, o 5)."),
});
export type ControlsInput = z.infer<typeof ControlsInputSchema>;

export const ControlsSchema = z.object({
  layoutName: z.string().describe("Un nombre descriptivo para el diseño de controles, ej. 'Garra de 4 Dedos'.") ,
  imageUrl: z.string().describe("Una URL a una imagen placeholder que ilustra la disposición de los controles. Debe ser de 400x300. ej: https://placehold.co/400x300.png"),
  advantages: z.array(z.string()).describe("Una lista de 2-3 ventajas clave de usar esta configuración de controles."),
  disadvantages: z.array(z.string()).describe("Una lista de 1-2 desventajas o desafíos de esta configuración."),
  keyActions: z.object({
    movement: z.string().describe("El/los dedo(s) responsable(s) del movimiento."),
    aim: z.string().describe("El/los dedo(s) responsable(s) de apuntar."),
    shoot: z.string().describe("El/los dedo(s) responsable(s) de disparar."),
    mainActions: z.string().describe("El/los dedo(s) responsable(s) de acciones principales como saltar, agacharse, recargar."),
  }).describe("Una descripción de qué dedos controlan las acciones clave."),
  tips: z.array(z.object({
    title: z.string().describe("Un título corto para el consejo."),
    description: z.string().describe("Un consejo práctico para acostumbrarse o dominar esta configuración de controles."),
  })).describe("Un array de 2 consejos para dominar la configuración."),
});
export type Controls = z.infer<typeof ControlsSchema>;


const PlayerStatsSchema = z.object({
    wins: z.number(),
    kills: z.number(),
    kdRatio: z.number(),
});

export const PlayerProfileInputSchema = z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    rank: z.string(),
    stats: PlayerStatsSchema,
    favoriteWeapons: z.array(z.string()).describe("Una lista de las armas preferidas del jugador."),
    playSchedule: z.string().describe("El horario típico en que el jugador está activo."),
});
export type PlayerProfileInput = z.infer<typeof PlayerProfileInputSchema>;

export const PlayerComparisonInputSchema = z.object({
    player1: PlayerProfileInputSchema,
    player2: PlayerProfileInputSchema,
});
export type PlayerComparisonInput = z.infer<typeof PlayerComparisonInputSchema>;

export const PlayerComparisonSchema = z.object({
  synergyAnalysis: z.string().describe("Un análisis conciso y directo de la sinergia entre los estilos de juego."),
  combinedStrengths: z.array(z.string()).describe("Una lista de 2-3 fortalezas clave que este dúo tendría."),
  duoTips: z.array(z.string()).describe("Una lista de 2 consejos prácticos para que el dúo maximice su potencial."),
  verdict: z.string().describe("Un veredicto final en una sola frase concisa sobre su potencial como dúo."),
});
export type PlayerComparison = z.infer<typeof PlayerComparisonSchema>;

export const AvatarInputSchema = z.object({
  prompt: z.string().describe('La descripción del usuario para el avatar que desea generar.'),
});
export type AvatarInput = z.infer<typeof AvatarInputSchema>;

export const AvatarSchema = z.object({
  imageUrls: z.array(z.string()).describe('Una lista de URLs de las imágenes de avatar generadas, deben ser data URIs.'),
});
export type Avatar = z.infer<typeof AvatarSchema>;
