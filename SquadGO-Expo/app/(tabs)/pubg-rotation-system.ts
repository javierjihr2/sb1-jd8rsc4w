// Sistema de Rutas de Rotación Optimizadas para PUBG Mobile

export interface RoutePoint {
  x: number;
  y: number;
  elevation?: number;
  cover: 'high' | 'medium' | 'low' | 'none';
  riskLevel: number; // 0-1, donde 1 es muy peligroso
  vehicleAccessible: boolean;
  landmarks?: string[];
}

export interface RotationRoute {
  id: string;
  name: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  waypoints: RoutePoint[];
  totalDistance: number;
  estimatedTime: number; // en segundos
  riskScore: number; // 0-1
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  vehicleRequired: boolean;
  coverAvailable: boolean;
  alternativeRoutes: string[];
  circlePhase: number[]; // fases del círculo donde es útil esta ruta
}

export interface RotationStrategy {
  primaryRoute: RotationRoute;
  alternativeRoutes: RotationRoute[];
  emergencyRoutes: RotationRoute[];
  vehicleStrategy: VehicleStrategy;
  timingRecommendations: TimingRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface VehicleStrategy {
  recommended: boolean;
  vehicleTypes: string[];
  pickupLocations: RoutePoint[];
  abandonPoints: RoutePoint[];
  fuelConsideration: boolean;
}

export interface TimingRecommendation {
  circlePhase: number;
  startTime: number; // segundos antes del cierre del círculo
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  hotSpots: RoutePoint[];
  safeZones: RoutePoint[];
  chokePoinst: RoutePoint[];
  recommendations: string[];
}

// Datos de rutas por mapa
const ROTATION_DATA: Record<string, RotationRoute[]> = {
  'Erangel': [
    {
      id: 'erangel_north_south_1',
      name: 'Pochinki a Georgopol',
      startPoint: { x: 500, y: 400, cover: 'medium', riskLevel: 0.6, vehicleAccessible: true },
      endPoint: { x: 300, y: 200, cover: 'high', riskLevel: 0.3, vehicleAccessible: true },
      waypoints: [
        { x: 450, y: 350, cover: 'low', riskLevel: 0.7, vehicleAccessible: true, landmarks: ['Rozhok'] },
        { x: 400, y: 300, cover: 'medium', riskLevel: 0.5, vehicleAccessible: true, landmarks: ['School'] },
        { x: 350, y: 250, cover: 'high', riskLevel: 0.4, vehicleAccessible: true }
      ],
      totalDistance: 2800,
      estimatedTime: 180,
      riskScore: 0.5,
      difficulty: 'medium',
      vehicleRequired: true,
      coverAvailable: true,
      alternativeRoutes: ['erangel_north_south_2'],
      circlePhase: [2, 3, 4]
    },
    {
      id: 'erangel_coastal_route',
      name: 'Ruta Costera Este',
      startPoint: { x: 700, y: 300, cover: 'low', riskLevel: 0.4, vehicleAccessible: true },
      endPoint: { x: 600, y: 600, cover: 'medium', riskLevel: 0.5, vehicleAccessible: true },
      waypoints: [
        { x: 680, y: 400, cover: 'low', riskLevel: 0.3, vehicleAccessible: true, landmarks: ['Stalber'] },
        { x: 650, y: 500, cover: 'medium', riskLevel: 0.4, vehicleAccessible: true }
      ],
      totalDistance: 2200,
      estimatedTime: 150,
      riskScore: 0.4,
      difficulty: 'easy',
      vehicleRequired: false,
      coverAvailable: false,
      alternativeRoutes: [],
      circlePhase: [1, 2, 3]
    }
  ],
  'Sanhok': [
    {
      id: 'sanhok_center_rotation',
      name: 'Rotación Central',
      startPoint: { x: 400, y: 400, cover: 'high', riskLevel: 0.7, vehicleAccessible: false },
      endPoint: { x: 300, y: 300, cover: 'high', riskLevel: 0.6, vehicleAccessible: false },
      waypoints: [
        { x: 380, y: 380, cover: 'high', riskLevel: 0.6, vehicleAccessible: false, landmarks: ['Bootcamp'] },
        { x: 350, y: 350, cover: 'medium', riskLevel: 0.5, vehicleAccessible: true }
      ],
      totalDistance: 1400,
      estimatedTime: 120,
      riskScore: 0.6,
      difficulty: 'hard',
      vehicleRequired: false,
      coverAvailable: true,
      alternativeRoutes: ['sanhok_jungle_route'],
      circlePhase: [2, 3, 4, 5]
    }
  ],
  'Miramar': [
    {
      id: 'miramar_desert_crossing',
      name: 'Cruce del Desierto',
      startPoint: { x: 200, y: 200, cover: 'none', riskLevel: 0.8, vehicleAccessible: true },
      endPoint: { x: 600, y: 600, cover: 'low', riskLevel: 0.7, vehicleAccessible: true },
      waypoints: [
        { x: 300, y: 300, cover: 'none', riskLevel: 0.9, vehicleAccessible: true, landmarks: ['Crater Fields'] },
        { x: 450, y: 450, cover: 'low', riskLevel: 0.8, vehicleAccessible: true, landmarks: ['Oasis'] }
      ],
      totalDistance: 5600,
      estimatedTime: 300,
      riskScore: 0.8,
      difficulty: 'extreme',
      vehicleRequired: true,
      coverAvailable: false,
      alternativeRoutes: [],
      circlePhase: [1, 2, 3]
    }
  ]
};

// Algoritmo de pathfinding optimizado
export function calculateOptimalRoute(
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  mapName: string,
  circlePhase: number,
  playerCount: number,
  hasVehicle: boolean
): RotationStrategy {
  const availableRoutes = ROTATION_DATA[mapName] || [];
  
  // Filtrar rutas relevantes para la fase del círculo
  const relevantRoutes = availableRoutes.filter(route => 
    route.circlePhase.includes(circlePhase)
  );
  
  // Calcular puntuación de cada ruta
  const scoredRoutes = relevantRoutes.map(route => {
    let score = 0;
    
    // Factor de distancia (menor distancia = mejor puntuación)
    score += (1 - (route.totalDistance / 6000)) * 0.3;
    
    // Factor de riesgo (menor riesgo = mejor puntuación)
    score += (1 - route.riskScore) * 0.4;
    
    // Factor de vehículo
    if (hasVehicle && route.vehicleRequired) {
      score += 0.2;
    } else if (!hasVehicle && !route.vehicleRequired) {
      score += 0.1;
    }
    
    // Factor de cobertura
    if (route.coverAvailable) {
      score += 0.1;
    }
    
    return { route, score };
  });
  
  // Ordenar por puntuación
  scoredRoutes.sort((a, b) => b.score - a.score);
  
  const primaryRoute = scoredRoutes[0]?.route;
  const alternativeRoutes = scoredRoutes.slice(1, 3).map(sr => sr.route);
  
  if (!primaryRoute) {
    // Crear ruta de emergencia si no hay rutas predefinidas
    const emergencyRoute: RotationRoute = {
      id: 'emergency_route',
      name: 'Ruta de Emergencia',
      startPoint,
      endPoint,
      waypoints: [],
      totalDistance: calculateDistance(startPoint, endPoint),
      estimatedTime: calculateTravelTime(startPoint, endPoint, hasVehicle),
      riskScore: 0.7,
      difficulty: 'hard',
      vehicleRequired: hasVehicle,
      coverAvailable: false,
      alternativeRoutes: [],
      circlePhase: [circlePhase]
    };
    
    return {
      primaryRoute: emergencyRoute,
      alternativeRoutes: [],
      emergencyRoutes: [emergencyRoute],
      vehicleStrategy: generateVehicleStrategy(hasVehicle, mapName),
      timingRecommendations: generateTimingRecommendations(circlePhase),
      riskAssessment: assessRouteRisk(emergencyRoute, playerCount)
    };
  }
  
  return {
    primaryRoute,
    alternativeRoutes,
    emergencyRoutes: generateEmergencyRoutes(startPoint, endPoint, mapName),
    vehicleStrategy: generateVehicleStrategy(hasVehicle, mapName),
    timingRecommendations: generateTimingRecommendations(circlePhase),
    riskAssessment: assessRouteRisk(primaryRoute, playerCount)
  };
}

// Funciones auxiliares
function calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

function calculateTravelTime(point1: RoutePoint, point2: RoutePoint, hasVehicle: boolean): number {
  const distance = calculateDistance(point1, point2);
  const speed = hasVehicle ? 60 : 20; // km/h
  return (distance / speed) * 3.6; // convertir a segundos
}

function generateVehicleStrategy(hasVehicle: boolean, mapName: string): VehicleStrategy {
  const vehicleSpawns: Record<string, RoutePoint[]> = {
    'Erangel': [
      { x: 400, y: 400, cover: 'medium', riskLevel: 0.3, vehicleAccessible: true, landmarks: ['Pochinki Garage'] },
      { x: 300, y: 200, cover: 'high', riskLevel: 0.2, vehicleAccessible: true, landmarks: ['Georgopol Containers'] }
    ],
    'Sanhok': [
      { x: 350, y: 350, cover: 'medium', riskLevel: 0.4, vehicleAccessible: true, landmarks: ['Bootcamp'] }
    ],
    'Miramar': [
      { x: 250, y: 250, cover: 'low', riskLevel: 0.5, vehicleAccessible: true, landmarks: ['Pecado Arena'] }
    ]
  };
  
  return {
    recommended: !hasVehicle && ['Miramar', 'Erangel'].includes(mapName),
    vehicleTypes: mapName === 'Sanhok' ? ['Motocicleta', 'Buggy'] : ['Coche', 'UAZ', 'Motocicleta'],
    pickupLocations: vehicleSpawns[mapName] || [],
    abandonPoints: [],
    fuelConsideration: mapName === 'Miramar'
  };
}

function generateTimingRecommendations(circlePhase: number): TimingRecommendation[] {
  const timings: Record<number, TimingRecommendation> = {
    1: {
      circlePhase: 1,
      startTime: 120,
      urgency: 'low',
      reasoning: 'Tiempo suficiente para lootear y posicionarse'
    },
    2: {
      circlePhase: 2,
      startTime: 90,
      urgency: 'medium',
      reasoning: 'Comenzar rotación temprana para evitar multitudes'
    },
    3: {
      circlePhase: 3,
      startTime: 60,
      urgency: 'high',
      reasoning: 'Rotación crítica, muchos equipos en movimiento'
    },
    4: {
      circlePhase: 4,
      startTime: 45,
      urgency: 'critical',
      reasoning: 'Última oportunidad para rotación segura'
    }
  };
  
  return [timings[circlePhase] || timings[1]];
}

function assessRouteRisk(route: RotationRoute, playerCount: number): RiskAssessment {
  const riskMultiplier = playerCount > 50 ? 1.2 : playerCount > 30 ? 1.0 : 0.8;
  const adjustedRisk = Math.min(route.riskScore * riskMultiplier, 1.0);
  
  let overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  if (adjustedRisk < 0.3) overallRisk = 'low';
  else if (adjustedRisk < 0.6) overallRisk = 'medium';
  else if (adjustedRisk < 0.8) overallRisk = 'high';
  else overallRisk = 'extreme';
  
  return {
    overallRisk,
    hotSpots: route.waypoints.filter(wp => wp.riskLevel > 0.7),
    safeZones: route.waypoints.filter(wp => wp.riskLevel < 0.3),
    chokePoinst: route.waypoints.filter(wp => wp.cover === 'none' && wp.riskLevel > 0.6),
    recommendations: generateRiskRecommendations(overallRisk, route)
  };
}

function generateRiskRecommendations(risk: string, route: RotationRoute): string[] {
  const recommendations: string[] = [];
  
  if (risk === 'extreme') {
    recommendations.push('Considera esperar al siguiente círculo');
    recommendations.push('Usa granadas de humo para cobertura');
    recommendations.push('Evita esta ruta si es posible');
  } else if (risk === 'high') {
    recommendations.push('Mantén cobertura en todo momento');
    recommendations.push('Considera usar vehículo para velocidad');
    recommendations.push('Ten granadas de humo preparadas');
  } else if (risk === 'medium') {
    recommendations.push('Mantente alerta a otros equipos');
    recommendations.push('Usa cobertura natural cuando sea posible');
  } else {
    recommendations.push('Ruta relativamente segura');
    recommendations.push('Buen momento para lootear en el camino');
  }
  
  if (route.vehicleRequired) {
    recommendations.push('Vehículo requerido para esta ruta');
  }
  
  if (!route.coverAvailable) {
    recommendations.push('Poca cobertura disponible, mantente en movimiento');
  }
  
  return recommendations;
}

function generateEmergencyRoutes(start: RoutePoint, end: RoutePoint, mapName: string): RotationRoute[] {
  return [
    {
      id: 'emergency_direct',
      name: 'Ruta Directa de Emergencia',
      startPoint: start,
      endPoint: end,
      waypoints: [],
      totalDistance: calculateDistance(start, end),
      estimatedTime: calculateTravelTime(start, end, false),
      riskScore: 0.8,
      difficulty: 'extreme',
      vehicleRequired: false,
      coverAvailable: false,
      alternativeRoutes: [],
      circlePhase: [1, 2, 3, 4, 5]
    }
  ];
}

// Función principal para obtener estrategia de rotación
export function getRotationStrategy(
  currentPosition: RoutePoint,
  targetZone: RoutePoint,
  mapName: string,
  circlePhase: number,
  playerCount: number,
  hasVehicle: boolean = false
): RotationStrategy {
  return calculateOptimalRoute(
    currentPosition,
    targetZone,
    mapName,
    circlePhase,
    playerCount,
    hasVehicle
  );
}

// Función para analizar múltiples rutas
export function analyzeMultipleRoutes(
  routes: RotationRoute[],
  circlePhase: number,
  playerCount: number
): { bestRoute: RotationRoute; analysis: string[] } {
  if (routes.length === 0) {
    throw new Error('No hay rutas disponibles para analizar');
  }
  
  const analysis: string[] = [];
  let bestRoute = routes[0];
  let bestScore = 0;
  
  routes.forEach(route => {
    let score = 0;
    const routeAnalysis: string[] = [];
    
    // Evaluar tiempo
    if (route.estimatedTime < 120) {
      score += 0.3;
      routeAnalysis.push('Tiempo de viaje rápido');
    } else if (route.estimatedTime > 240) {
      score -= 0.2;
      routeAnalysis.push('Tiempo de viaje largo');
    }
    
    // Evaluar riesgo
    if (route.riskScore < 0.4) {
      score += 0.4;
      routeAnalysis.push('Ruta segura');
    } else if (route.riskScore > 0.7) {
      score -= 0.3;
      routeAnalysis.push('Ruta peligrosa');
    }
    
    // Evaluar cobertura
    if (route.coverAvailable) {
      score += 0.2;
      routeAnalysis.push('Buena cobertura disponible');
    }
    
    // Evaluar fase del círculo
    if (route.circlePhase.includes(circlePhase)) {
      score += 0.1;
      routeAnalysis.push('Apropiada para la fase actual');
    }
    
    analysis.push(`${route.name}: ${routeAnalysis.join(', ')} (Puntuación: ${score.toFixed(2)})`);
    
    if (score > bestScore) {
      bestScore = score;
      bestRoute = route;
    }
  });
  
  return { bestRoute, analysis };
}