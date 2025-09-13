
import {z} from 'zod';
export { z } from 'zod';

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
  dropZone: z.string().describe('La zona de aterrizaje específica seleccionada por el jugador (ej. Pochinki, School).'),
  playStyle: z.string().describe('El estilo de juego deseado para el equipo (ej., Agresivo, Estratégico, Equilibrado).'),
  squadSize: z.number().describe('El número de jugadores en la escuadra (1-4).'),
  currentLocation: z.string().optional().describe("La ubicación actual del jugador en el mapa desde donde se necesita el plan de rotación."),
  zonePointA: z.string().optional().describe("El primer punto de un posible corredor de cierre de zona para el final de la partida."),
  zonePointB: z.string().optional().describe("El segundo punto de un posible corredor de cierre de zona para el final de la partida."),
  zoneCircleNumber: z.number().optional().describe("La cantidad de zonas seguras que ya se han cerrado."),
});
export type MapPlannerInput = z.infer<typeof MapPlannerInputSchema>;

const WeaponLoadoutSchema = z.object({
  name: z.string().describe("El nombre del arma recomendada."),
  sight: z.string().describe("La mira recomendada para el arma (ej. 'Mira 6x', 'Punto Rojo')."),
  attachments: z.array(z.string()).describe("Una lista de 2-3 accesorios clave recomendados para el arma (ej. 'Culata táctica', 'Cargador ampliado rápido')."),
});

const RoleBasedLoadoutSchema = z.object({
    role: z.string().describe("El rol del jugador en la escuadra (ej. IGL, Fragger, Support, Sniper). Para 'Solo', el rol puede ser 'Versátil'."),
    primaryWeapon: WeaponLoadoutSchema,
    secondaryWeapon: WeaponLoadoutSchema,
    justification: z.string().describe("Una justificación concisa de por qué este equipamiento es ideal para este rol específico dentro del plan general."),
});

export const MapPlannerSchema = z.object({
  planTitle: z.string().describe('Un título creativo y descriptivo para el plan de partida.'),
  dropZoneJustification: z.string().describe('Una justificación táctica de por qué la zona de aterrizaje elegida es una buena (o mala) elección y cómo aprovecharla.'),
  earlyGame: z.object({
      plan: z.string().describe('El plan conciso para el juego temprano, incluyendo prioridades de looteo y posicionamiento inicial.'),
  }),
  midGame: z.object({
      plan: z.string().describe('El plan conciso para el juego intermedio, centrándose en rotaciones, posicionamiento y cuándo enfrentarse.'),
  }),
  lateGame: z.object({
      plan: z.string().describe('El plan conciso para el juego tardío, incluyendo la estrategia del círculo final e identificación de posiciones clave.'),
  }),
  recommendedLoadout: z.array(RoleBasedLoadoutSchema).describe("Una lista de equipamientos recomendados basados en roles de jugador, adaptado al tamaño de la escuadra."),
  rotationPlan: z.object({
    route: z.string().describe("La descripción de la ruta de rotación principal."),
    considerations: z.array(z.string()).describe("Una lista de 2-3 puntos clave o hitos a considerar durante la rotación."),
    advantages: z.array(z.string()).describe("Una lista de las ventajas clave de esta ruta."),
    disadvantages: z.array(z.string()).describe("Una lista de los riesgos o desventajas de esta ruta."),
    vehicleSuggestion: z.object({
      vehicleType: z.string().describe("El tipo de vehículo recomendado (ej: Dacia, UAZ)."),
      reason: z.string().describe("La razón por la que este vehículo es ideal para el mapa."),
      fuelCheck: z.string().describe("Un recordatorio sobre la importancia de verificar el combustible."),
    }).describe("Sugerencia de vehículo para la rotación."),
  }).describe("Un plan de rotación detallado con puntos a considerar, ventajas, desventajas y sugerencias de vehículos."),
});
export type MapPlanner = z.infer<typeof MapPlannerSchema>;

export const SensitivityInputSchema = z.object({
    deviceType: z.string().describe("El tipo de dispositivo del jugador (ej. 'Teléfono' o 'Tablet')."),
    deviceBrand: z.string().optional().describe("La marca del dispositivo del jugador (ej. 'Apple', 'Samsung')."),
    device: z.string().optional().describe("El dispositivo específico del jugador (ej. 'Apple iPhone 15 Pro Max', 'Samsung Galaxy Tab S9 Ultra')."),
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
    code: z.optional(z.string()).describe("Código de importación de la configuración de sensibilidad."),
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

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().optional(),
  image: z.string().optional().describe("An optional image provided by the user, as a data URI."),
});

export const AvatarInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The entire conversation history between the user and the model."),
});
export type AvatarInput = z.infer<typeof AvatarInputSchema>;

export const ImageGenOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the generated images, as data URIs.'),
});
export type ImageGenOutput = z.infer<typeof ImageGenOutputSchema>;


const PlayerProfileForIcebreakerSchema = z.object({
    name: z.string(),
    rank: z.string(),
    favoriteWeapons: z.array(z.string()),
    favoriteMap: z.string(),
});

export const IcebreakerInputSchema = z.object({
    player1: PlayerProfileForIcebreakerSchema.describe("El perfil del jugador que envía el mensaje."),
    player2: PlayerProfileForIcebreakerSchema.describe("El perfil del jugador que recibe el mensaje."),
});
export type IcebreakerInput = z.infer<typeof IcebreakerInputSchema>;

export const IcebreakerOutputSchema = z.object({
    messages: z.array(z.string()).length(3).describe("Una lista de exactamente 3 mensajes rompehielos únicos y creativos."),
});
export type IcebreakerOutput = z.infer<typeof IcebreakerOutputSchema>;

// Schema for weapon-specific sensitivity
export const WeaponSensitivityInputSchema = SensitivityInputSchema.extend({
    weaponName: z.string().describe("El nombre del arma para la que se genera la sensibilidad (ej. M416, Kar98K)."),
    weaponCategory: z.string().describe("La categoría del arma (ej. Rifle de Asalto, Rifle de Francotirador).")
});
export type WeaponSensitivityInput = z.infer<typeof WeaponSensitivityInputSchema>;

// The output can reuse the main Sensitivity schema, but we'll create a specific type for clarity.
export const WeaponSensitivitySchema = z.object({
    camera: ScopeSensitivitySchema.describe("Sensibilidad de la cámara optimizada para el arma."),
    ads: ScopeSensitivitySchema.describe("Sensibilidad de ADS optimizada para el arma."),
});
export type WeaponSensitivity = z.infer<typeof WeaponSensitivitySchema>;


// Schema for decoding/analyzing sensitivity
export const DecodeSensitivityInputSchema = z.object({
  settings: SensitivitySchema.describe("Los valores de sensibilidad proporcionados por el usuario para ser analizados."),
  code: z.string().optional().describe("El código de sensibilidad original proporcionado por el usuario."),
});
export type DecodeSensitivityInput = z.infer<typeof DecodeSensitivityInputSchema>;

export const DecodedSensitivitySchema = z.object({
  settings: SensitivitySchema.describe("Los valores de sensibilidad originales que fueron analizados."),
  analysis: z.object({
    suggestedName: z.string().describe("Un nombre atractivo y descriptivo para esta configuración de sensibilidad."),
    playStyle: z.string().describe("El estilo de juego principal asociado con esta sensibilidad (ej. Agresivo, Preciso)."),
    tacticalAnalysis: z.string().describe("Un breve análisis táctico de las fortalezas y debilidades de la configuración."),
    recommendedWeapons: z.array(z.string()).describe("Una lista de 2-3 armas que funcionarían bien con esta configuración."),
  }),
  code: z.string().describe("El código de sensibilidad original proporcionado por el usuario, si lo hubo."),
  isPublic: z.boolean().optional().describe("Si la sensibilidad debe ser visible para otros jugadores."),
});
export type DecodedSensitivity = z.infer<typeof DecodedSensitivitySchema>;
