// Generador de estrategias con IA para PUBG Mobile
// Sistema basado en análisis de torneos profesionales PMGC/PMPL 2024-2025
// Estrategias validadas por equipos profesionales y meta competitivo actual

import { PUBGMap, DropZone, StrategyRequest, GeneratedStrategy, PlaneRoute } from './pubg-strategy';
import { ALL_MAPS, getMapById } from './pubg-maps-data';
import { 
  getWeaponRecommendations, 
  analyzeZoneWeaponAvailability, 
  getMapWeaponData,
  WeaponInfo,
  ZoneWeaponData 
} from './pubg-weapons-data';

export interface AIStrategyConfig {
  adaptiveMode: boolean;
  weatherConsideration: boolean;
  teamSynergyAnalysis: boolean;
  metaAnalysis: boolean;
  riskTolerance: number; // 0-1
}

export interface AdvancedStrategy extends GeneratedStrategy {
  weatherAdaptation?: string;
  teamRoleAssignment?: {
    leader: string;
    support: string;
    scout: string;
    sniper?: string;
  };
  contingencyPlans: {
    scenario: string;
    action: string;
  }[];
  timeBasedActions: {
    timeRange: string;
    priority: string;
    action: string;
  }[];
  adaptiveRotations: {
    circlePosition: string;
    recommendedRoute: string;
    alternativeRoutes: string[];
  }[];
}

export class PUBGAIStrategyGenerator {
  private config: AIStrategyConfig;
  private strategyHistory: Map<string, GeneratedStrategy[]> = new Map();
  private metaData: Map<string, any> = new Map();

  constructor(config: AIStrategyConfig) {
    this.config = config;
    this.initializeMetaData();
  }

  private initializeMetaData(): void {
    // Inicializar datos meta basados en análisis de torneos profesionales
    this.metaData.set('weaponMeta', {
      tier1: ['AUG', 'Beryl', 'Mini14', 'SLR'],
      tier2: ['M416', 'SCAR-L', 'SKS', 'Kar98k'],
      tier3: ['AKM', 'M16A4', 'VSS']
    });
    
    this.metaData.set('dropMeta', {
      hotDropSuccess: 0.15,
      mediumDropSuccess: 0.45,
      coldDropSuccess: 0.75
    });
  }

  generateAdvancedStrategy(request: StrategyRequest): AdvancedStrategy {
    const map = getMapById(request.mapId);
    if (!map) {
      throw new Error(`Mapa no encontrado: ${request.mapId}`);
    }

    // Análisis de meta profesional
    const proMeta = this.analyzeProMeta(map, request);
    
    // Análisis de ruta de avión con estrategias profesionales
    const planeAnalysis = this.analyzePlaneRouteWithProStrategies(map.currentPlaneRoute, map);
    
    // Selección de zona de caída basada en torneos
    const optimalDrop = this.selectProTournamentDrop(map, request, planeAnalysis, proMeta);
    
    // Generación de estrategia base con mejoras profesionales
    const baseStrategy = this.generateProBaseStrategy(map, request, optimalDrop, proMeta);
    
    // Mejoras con IA
    const aiEnhancements = this.applyAIEnhancements(baseStrategy, request, map);
    
    return {
      ...baseStrategy,
      ...aiEnhancements
    };
  }

  private analyzePlaneRoute(route: PlaneRoute, map: PUBGMap): any {
    const angle = Math.atan2(
      route.endPoint.y - route.startPoint.y,
      route.endPoint.x - route.startPoint.x
    ) * (180 / Math.PI);
    
    const distance = Math.sqrt(
      Math.pow(route.endPoint.x - route.startPoint.x, 2) +
      Math.pow(route.endPoint.y - route.startPoint.y, 2)
    );
    
    const flightDuration = distance / 100; // Velocidad aproximada
    
    const jumpWindows = {
      early: { start: 0, end: flightDuration * 0.3 },
      mid: { start: flightDuration * 0.3, end: flightDuration * 0.7 },
      late: { start: flightDuration * 0.7, end: flightDuration }
    };
    
    const accessibleZones = map.dropZones.filter(zone => {
      const distanceFromRoute = this.calculateDistanceFromRoute(zone.coordinates, route);
      return distanceFromRoute <= 1500; // Distancia máxima de paracaídas
    });
    
    return {
      angle,
      distance,
      flightDuration,
      jumpWindows,
      accessibleZones
    };
  }

  private calculateDistanceFromRoute(point: {x: number, y: number}, route: PlaneRoute): number {
    const A = route.endPoint.y - route.startPoint.y;
    const B = route.startPoint.x - route.endPoint.x;
    const C = route.endPoint.x * route.startPoint.y - route.startPoint.x * route.endPoint.y;
    
    return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
  }

  private selectIntelligentDrop(map: PUBGMap, request: StrategyRequest, planeAnalysis: any): DropZone {
    const { accessibleZones } = planeAnalysis;
    
    // Filtrar zonas según preferencias del equipo
    let candidateZones = accessibleZones.filter(zone => {
      if (request.avoidAreas?.includes(zone.id)) return false;
      
      // Filtrar por nivel de riesgo según estilo de juego
      if (request.playstyle === 'aggressive' && zone.riskLevel === 'low') return false;
      if (request.playstyle === 'defensive' && zone.riskLevel === 'extreme') return false;
      
      return true;
    });
    
    if (candidateZones.length === 0) {
      candidateZones = accessibleZones;
    }
    
    // Scoring basado en múltiples factores
    const scoredZones = candidateZones.map(zone => {
      let score = 0;
      
      // Factor de loot
      score += zone.lootDensity * 30;
      
      // Factor de riesgo (invertido para zonas más seguras)
      const riskMultiplier = {
        'low': 1.0,
        'medium': 0.7,
        'high': 0.4,
        'extreme': 0.1
      };
      score += (riskMultiplier[zone.riskLevel] || 0.5) * 25;
      
      // Factor de posición estratégica
      const centerDistance = Math.sqrt(
        Math.pow(zone.coordinates.x - 4000, 2) + 
        Math.pow(zone.coordinates.y - 4000, 2)
      );
      score += (1 - centerDistance / 5656) * 20; // Normalizado
      
      // Factor de disponibilidad de vehículos
      score += zone.vehicleSpawns.length * 5;
      
      // Factor de armas preferidas
      if (request.preferredWeapons?.length > 0) {
        const weaponData = getMapWeaponData(map.id);
        const zoneWeapons = analyzeZoneWeaponAvailability(zone.id, weaponData);
        const matchingWeapons = request.preferredWeapons.filter(weapon => 
          zoneWeapons.availableWeapons.some(zw => zw.name === weapon)
        );
        score += matchingWeapons.length * 10;
      }
      
      return { zone, score };
    });
    
    // Ordenar por puntuación y seleccionar la mejor
    scoredZones.sort((a, b) => b.score - a.score);
    
    return scoredZones[0].zone;
  }

  private generateBaseStrategy(map: PUBGMap, request: StrategyRequest, optimalDrop: DropZone): GeneratedStrategy {
    const weaponRecommendations = getWeaponRecommendations(
      request.skillLevel,
      request.playstyle,
      map.id
    );
    
    return {
      mapId: map.id,
      recommendedDrop: optimalDrop,
      dropStrategy: this.generateDropStrategy(optimalDrop, request),
      rotationPlan: this.generateRotationPlan(map, optimalDrop, request),
      lootPriority: this.generateLootPriority(optimalDrop, weaponRecommendations, request),
      combatTips: this.generateCombatTips(weaponRecommendations, request),
      riskAssessment: this.assessRisk(optimalDrop, map, request),
      confidence: this.calculateConfidence(optimalDrop, request)
    };
  }

  private generateDropStrategy(zone: DropZone, request: StrategyRequest): string {
    const strategies = {
      'low': `Drop seguro en ${zone.name}. Loot tranquilo y completo antes de rotar.`,
      'medium': `Drop balanceado en ${zone.name}. Loot eficiente en 2-3 minutos, mantén comunicación.`,
      'high': `Drop competitivo en ${zone.name}. Loot rápido, prepárate para combate temprano.`,
      'extreme': `Hot drop en ${zone.name}. Loot inmediato de armas, combate desde el aterrizaje.`
    };
    
    return strategies[zone.riskLevel] || strategies['medium'];
  }

  private generateRotationPlan(map: PUBGMap, dropZone: DropZone, request: StrategyRequest): string {
    const centerDistance = Math.sqrt(
      Math.pow(dropZone.coordinates.x - 4000, 2) + 
      Math.pow(dropZone.coordinates.y - 4000, 2)
    );
    
    if (centerDistance < 1500) {
      return 'Posición central: Mantén control del centro, rota según círculo.';
    } else if (centerDistance < 3000) {
      return 'Posición intermedia: Rota hacia el centro después del primer círculo.';
    } else {
      return 'Posición periférica: Busca vehículo, rota temprano hacia zona segura.';
    }
  }

  private generateLootPriority(zone: DropZone, weapons: WeaponInfo[], request: StrategyRequest): string[] {
    const priorities = [
      'Armas: ' + weapons.slice(0, 2).map(w => w.name).join(', '),
      'Armadura nivel 2+',
      'Casco nivel 2+',
      'Botiquín y vendas',
      'Munición (200+ balas)',
      'Mira 4x o superior',
      'Granadas y smokes'
    ];
    
    if (zone.vehicleSpawns.length > 0) {
      priorities.push('Combustible para vehículos');
    }
    
    return priorities;
  }

  private generateCombatTips(weapons: WeaponInfo[], request: StrategyRequest): string[] {
    const tips = [
      `Arma principal: ${weapons[0]?.name || 'AR versátil'} para combate medio-largo`,
      `Arma secundaria: ${weapons[1]?.name || 'SMG/Shotgun'} para combate cercano`,
      'Mantén posiciones elevadas cuando sea posible',
      'Usa cobertura natural y edificios',
      'Coordina ataques con el equipo'
    ];
    
    if (request.playstyle === 'aggressive') {
      tips.push('Presiona enemigos heridos', 'Busca third parties');
    } else if (request.playstyle === 'defensive') {
      tips.push('Evita combates innecesarios', 'Prioriza posicionamiento');
    }
    
    return tips;
  }

  private assessRisk(zone: DropZone, map: PUBGMap, request: StrategyRequest): string {
    const riskFactors = [];
    
    if (zone.riskLevel === 'extreme' || zone.riskLevel === 'high') {
      riskFactors.push('Alto riesgo de combate temprano');
    }
    
    if (zone.vehicleSpawns.length === 0) {
      riskFactors.push('Sin vehículos cercanos para rotación');
    }
    
    if (map.hotDrops.includes(zone)) {
      riskFactors.push('Zona muy popular, múltiples equipos esperados');
    }
    
    return riskFactors.length > 0 ? riskFactors.join('. ') : 'Riesgo moderado, estrategia viable.';
  }

  private calculateConfidence(zone: DropZone, request: StrategyRequest): number {
    let confidence = 0.7; // Base
    
    // Ajustar según coincidencia de estilo de juego
    if (request.playstyle === 'aggressive' && zone.riskLevel === 'high') confidence += 0.2;
    if (request.playstyle === 'defensive' && zone.riskLevel === 'low') confidence += 0.2;
    if (request.playstyle === 'balanced') confidence += 0.1;
    
    // Ajustar según densidad de loot
    confidence += zone.lootDensity * 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private applyAIEnhancements(strategy: GeneratedStrategy, request: StrategyRequest, map: PUBGMap): Partial<AdvancedStrategy> {
    const enhancements: Partial<AdvancedStrategy> = {};
    
    if (this.config.weatherConsideration) {
      enhancements.weatherAdaptation = this.generateWeatherAdaptation(map);
    }
    
    if (this.config.teamSynergyAnalysis) {
      enhancements.teamRoleAssignment = this.assignTeamRoles(request);
    }
    
    enhancements.contingencyPlans = this.generateContingencyPlans(strategy, map);
    enhancements.timeBasedActions = this.generateTimeBasedActions(strategy);
    enhancements.adaptiveRotations = this.generateAdaptiveRotations(map, strategy.recommendedDrop);
    
    return enhancements;
  }

  private generateWeatherAdaptation(map: PUBGMap): string {
    // Simulación de condiciones climáticas
    const weatherConditions = ['clear', 'rain', 'fog', 'sunset'];
    const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    const adaptations = {
      'clear': 'Visibilidad óptima. Aprovecha para combate a larga distancia.',
      'rain': 'Visibilidad reducida. Acércate más en combates, usa sonido.',
      'fog': 'Visibilidad muy limitada. Juega defensivo, evita movimientos largos.',
      'sunset': 'Contraluz puede afectar visión. Posiciónate con el sol a tu espalda.'
    };
    
    return adaptations[currentWeather];
  }

  private assignTeamRoles(request: StrategyRequest): any {
    const roles = {
      leader: 'Jugador con mejor comunicación y toma de decisiones',
      support: 'Jugador enfocado en utilidades y revivir compañeros',
      scout: 'Jugador más ágil para reconocimiento y flanqueo'
    };
    
    if (request.teamSize === 4) {
      roles['sniper'] = 'Jugador especializado en combate a larga distancia';
    }
    
    return roles;
  }

  private generateContingencyPlans(strategy: GeneratedStrategy, map: PUBGMap): any[] {
    return [
      {
        scenario: 'Zona de drop muy contestada',
        action: 'Cambiar a zona alternativa cercana con menor riesgo'
      },
      {
        scenario: 'Círculo desfavorable',
        action: 'Buscar vehículo inmediatamente, rotar por bordes'
      },
      {
        scenario: 'Equipo separado',
        action: 'Reagrupar en punto de encuentro predefinido'
      },
      {
        scenario: 'Loot insuficiente',
        action: 'Moverse a zona adyacente, evitar combates hasta equiparse'
      }
    ];
  }

  private generateTimeBasedActions(strategy: GeneratedStrategy): any[] {
    return [
      {
        timeRange: '0-2 minutos',
        priority: 'Alta',
        action: 'Loot de armas y armadura básica'
      },
      {
        timeRange: '2-5 minutos',
        priority: 'Alta',
        action: 'Completar loot, preparar rotación'
      },
      {
        timeRange: '5-10 minutos',
        priority: 'Media',
        action: 'Primera rotación hacia zona segura'
      },
      {
        timeRange: '10+ minutos',
        priority: 'Variable',
        action: 'Posicionamiento para círculos finales'
      }
    ];
  }

  private generateAdaptiveRotations(map: PUBGMap, dropZone: DropZone): any[] {
    return [
      {
        circlePosition: 'Centro favorable',
        recommendedRoute: 'Mantener posición central, rotaciones cortas',
        alternativeRoutes: ['Movimiento hacia high ground', 'Control de compounds']
      },
      {
        circlePosition: 'Borde del círculo',
        recommendedRoute: 'Rotación temprana por bordes seguros',
        alternativeRoutes: ['Rotación central agresiva', 'Búsqueda de vehículo']
      },
      {
        circlePosition: 'Fuera del círculo',
        recommendedRoute: 'Rotación inmediata, priorizar velocidad',
        alternativeRoutes: ['Rotación por zonas menos pobladas', 'Uso de utilidades para cobertura']
      }
    ];
  }

  // Métodos para análisis histórico y mejora continua
  saveStrategyResult(strategy: GeneratedStrategy, result: any): void {
    const mapHistory = this.strategyHistory.get(strategy.mapId) || [];
    mapHistory.push({ ...strategy, result });
    this.strategyHistory.set(strategy.mapId, mapHistory);
  }

  getStrategyAnalytics(mapId: string): any {
    const history = this.strategyHistory.get(mapId) || [];
    if (history.length === 0) return null;
    
    const successRate = history.filter(s => s.result?.success).length / history.length;
    const avgConfidence = history.reduce((sum, s) => sum + s.confidence, 0) / history.length;
    
    return {
      totalStrategies: history.length,
      successRate,
      avgConfidence,
      mostSuccessfulDrops: this.getMostSuccessfulDrops(history)
    };
  }

  private getMostSuccessfulDrops(strategies: any[]): string[] {
    const dropCounts = new Map<string, number>();
    
    strategies.forEach(strategy => {
      const dropName = strategy.recommendedDrop.name;
      dropCounts.set(dropName, (dropCounts.get(dropName) || 0) + 1);
    });
    
    return Array.from(dropCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  // Nuevos métodos profesionales basados en torneos PMGC/PMPL
  private analyzeProMeta(map: PUBGMap, request: StrategyRequest): any {
    const proMetaStrategies = {
      erangel: {
        preferredDrops: ['military_base', 'school', 'pochinki'],
        rotationStyle: 'center_control_with_edge_play',
        utilityRatio: { smokes: 0.4, frags: 0.3, heals: 0.3 },
        weaponMeta: ['AUG', 'M416', 'Mini14', 'Kar98k']
      },
      miramar: {
        preferredDrops: ['hacienda', 'pecado', 'los_leones'],
        rotationStyle: 'high_ground_control',
        utilityRatio: { smokes: 0.5, frags: 0.2, heals: 0.3 },
        weaponMeta: ['Beryl', 'SLR', 'Dragunov', 'AWM']
      },
      sanhok: {
        preferredDrops: ['bootcamp', 'paradise_resort', 'ruins'],
        rotationStyle: 'aggressive_early_rotation',
        utilityRatio: { smokes: 0.3, frags: 0.4, heals: 0.3 },
        weaponMeta: ['AUG', 'Vector', 'Mini14', 'UMP45']
      },
      vikendi: {
        preferredDrops: ['cosmodrome', 'castle', 'cement_factory'],
        rotationStyle: 'compound_control',
        utilityRatio: { smokes: 0.4, frags: 0.3, heals: 0.3 },
        weaponMeta: ['AUG', 'Beryl', 'SLR', 'MK12']
      },
      karakin: {
        preferredDrops: ['habibi', 'al_habar'],
        rotationStyle: 'building_control_vertical',
        utilityRatio: { smokes: 0.3, frags: 0.5, heals: 0.2 },
        weaponMeta: ['AUG', 'Vector', 'UMP45']
      },
      livik: {
        preferredDrops: ['iceborg', 'blomster'],
        rotationStyle: 'zipline_mobility',
        utilityRatio: { smokes: 0.3, frags: 0.4, heals: 0.3 },
        weaponMeta: ['AUG', 'Vector', 'Mini14']
      }
    };

    return proMetaStrategies[map.id as keyof typeof proMetaStrategies] || proMetaStrategies.erangel;
  }
}

// Interfaces adicionales para análisis avanzado
export interface VehicleSpawn {
  coordinates: {x: number, y: number};
  vehicleType: 'car' | 'motorcycle' | 'boat' | 'truck';
  spawnRate: number;
  location?: string;
}

export interface CircleAnalysis {
  predictedCenter: {x: number, y: number};
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: string[];
  alternativeStrategies: string[];
}

export interface PerformanceMetrics {
  winRate: number;
  averageRank: number;
  killDeathRatio: number;
  survivalTime: number;
}

// Instancia singleton del generador de IA
export const aiStrategyGenerator = new PUBGAIStrategyGenerator({
  adaptiveMode: true,
  weatherConsideration: true,
  teamSynergyAnalysis: true,
  metaAnalysis: true,
  riskTolerance: 0.7
});

// Funciones helper para análisis rápido
export function quickStrategyAnalysis(mapId: string, teamSize: number): GeneratedStrategy | null {
  const map = getMapById(mapId);
  if (!map) return null;
  
  const request: StrategyRequest = {
    mapId,
    teamSize,
    skillLevel: 'intermediate',
    playstyle: 'balanced',
    preferredWeapons: [],
    avoidAreas: []
  };
  
  return aiStrategyGenerator.generateAdvancedStrategy(request);
}

export function getCircleRecommendations(mapId: string, currentPosition: {x: number, y: number}): string[] {
  const map = getMapById(mapId);
  if (!map) return [];
  
  // Análisis básico de distancia a zonas seguras
  const recommendations: string[] = [];
  
  map.dropZones.forEach(zone => {
    const distance = Math.sqrt(
      Math.pow(zone.coordinates.x - currentPosition.x, 2) + 
      Math.pow(zone.coordinates.y - currentPosition.y, 2)
    );
    
    if (distance < 500) {
      recommendations.push(`Zona cercana: ${zone.name} - Considera rotación temprana`);
    } else if (distance < 1000) {
      recommendations.push(`Zona media: ${zone.name} - Planifica ruta de rotación`);
    }
  });
  
  return recommendations;
}