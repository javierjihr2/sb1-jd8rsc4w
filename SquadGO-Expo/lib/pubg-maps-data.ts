// Base de datos completa de mapas de PUBG Mobile
// Información detallada basada en estrategias profesionales de torneos PMGC/PMPL
// Mapas oficiales: Erangel, Miramar, Sanhok, Vikendi, Karakin, Livik, Rondo, Nusa

import { PUBGMap, DropZone, VehicleSpawn, SecretLocation, WeaponSpawn, RotationRoute } from './pubg-strategy';

// ERANGEL - Mapa clásico 8x8km
const erangelDropZones: DropZone[] = [
  {
    id: 'erangel_military_base',
    name: 'Base Militar',
    coordinates: { x: 200, y: 800 },
    lootQuality: 'elite',
    riskLevel: 'extreme',
    playerDensity: 'high',
    description: 'Zona favorita de equipos pro en PMGC. Estrategia: aterrizar en edificios separados, loot rápido en 60s, control de puentes para gatekeeping. Equipos asiáticos prefieren rotación agresiva temprana.',
    recommendedFor: ['equipos experimentados', 'estrategia de gatekeeping'],
    nearbyVehicles: ['boats', 'cars'],
    escapeRoutes: ['puente este con smoke cover', 'puente oeste timing', 'barcos para rotación segura']
  },
  {
    id: 'erangel_school',
    name: 'Escuela',
    coordinates: { x: 400, y: 400 },
    lootQuality: 'high',
    riskLevel: 'high',
    playerDensity: 'high',
    description: 'Hot drop clásico en torneos. Estrategia pro: aterrizar en techo principal, controlar escaleras, usar granadas para clear edificios. Rotación predictiva hacia centro antes del primer círculo.',
    recommendedFor: ['combate temprano agresivo', 'equipos con buena comunicación'],
    nearbyVehicles: ['cars', 'motorcycles'],
    escapeRoutes: ['norte hacia Rozhok con vehicle', 'sur hacia Pochinki edge play']
  },
  {
    id: 'erangel_pochinki',
    name: 'Pochinki',
    coordinates: { x: 350, y: 500 },
    lootQuality: 'high',
    riskLevel: 'high',
    playerDensity: 'medium',
    description: 'Drop spot favorito de equipos europeos en PMPL. Estrategia: dividir equipo en 2-2, loot paralelo en casas opuestas, reagrupar en 90s. Usar smokes para rotaciones entre edificios.',
    recommendedFor: ['combate urbano coordinado', 'equipos con roles definidos'],
    nearbyVehicles: ['cars'],
    escapeRoutes: ['norte hacia School con timing', 'este hacia Rozhok edge rotation']
   },
   {
    id: 'erangel_georgopol',
    name: 'Georgopol',
    coordinates: { x: 200, y: 200 },
    lootQuality: 'medium',
    riskLevel: 'medium',
    playerDensity: 'medium',
    description: 'Ciudad grande con loot distribuido',
    recommendedFor: ['equipos grandes', 'looteo seguro'],
    nearbyVehicles: ['cars', 'boats'],
    escapeRoutes: ['sur hacia centro', 'este hacia Severny']
  },
  {
    id: 'erangel_mylta_power',
    name: 'Mylta Power',
    coordinates: { x: 700, y: 600 },
    lootQuality: 'medium',
    riskLevel: 'low',
    playerDensity: 'low',
    description: 'Zona industrial con loot decente y pocos enemigos',
    recommendedFor: ['principiantes', 'juego pasivo'],
    nearbyVehicles: ['cars'],
    escapeRoutes: ['oeste hacia centro', 'norte hacia Stalber']
  }
];

const erangelSecretLocations: SecretLocation[] = [
  {
    id: 'erangel_secret_1',
    name: 'Sala Secreta Base Militar 1',
    type: 'secret_room',
    coordinates: { x: 180, y: 820 },
    keyRequired: true,
    keyLocation: 'Edificios cercanos a la base',
    lootDescription: 'Level 3 equipment, AWM, Groza',
    accessMethod: 'Usar llave en puerta marcada'
  },
  {
    id: 'erangel_secret_2',
    name: 'Sala Secreta Base Militar 2',
    type: 'secret_room',
    coordinates: { x: 220, y: 800 },
    keyRequired: true,
    keyLocation: 'Edificios cercanos a la base',
    lootDescription: 'Scopes de alto nivel, munición especial',
    accessMethod: 'Usar llave en puerta marcada'
  },
  {
    id: 'erangel_secret_3',
    name: 'Bunker Subterráneo',
    type: 'bunker',
    coordinates: { x: 400, y: 300 },
    keyRequired: true,
    keyLocation: 'Rozhok School area',
    lootDescription: 'Equipamiento militar de élite',
    accessMethod: 'Llave encontrada aleatoriamente'
  }
];

// MIRAMAR - Mapa desértico 8x8km
const miramarDropZones: DropZone[] = [
  {
    id: 'miramar_hacienda',
    name: 'Hacienda del Patrón',
    coordinates: { x: 250, y: 350 },
    lootQuality: 'elite',
    riskLevel: 'extreme',
    playerDensity: 'high',
    description: 'Zona pequeña con loot excepcional pero muy peligrosa',
    recommendedFor: ['jugadores expertos', 'combate inmediato'],
    nearbyVehicles: ['cars'],
    escapeRoutes: ['este hacia San Martin', 'sur hacia Pecado']
  },
  {
    id: 'miramar_pecado',
    name: 'Pecado',
    coordinates: { x: 400, y: 400 },
    lootQuality: 'high',
    riskLevel: 'high',
    playerDensity: 'high',
    description: 'Centro del mapa con casino y arena de boxeo',
    recommendedFor: ['combate temprano', 'posición central'],
    nearbyVehicles: ['cars', 'motorcycles'],
    escapeRoutes: ['cualquier dirección por posición central']
  },
  {
    id: 'miramar_los_leones',
    name: 'Los Leones',
    coordinates: { x: 150, y: 600 },
    lootQuality: 'medium',
    riskLevel: 'medium',
    playerDensity: 'medium',
    description: 'Ciudad más grande del mapa con loot distribuido',
    recommendedFor: ['equipos grandes', 'looteo extenso'],
    nearbyVehicles: ['cars'],
    escapeRoutes: ['norte hacia centro', 'este hacia Pecado']
  },
  {
    id: 'miramar_campo_militar',
    name: 'Campo Militar',
    coordinates: { x: 700, y: 200 },
    lootQuality: 'high',
    riskLevel: 'medium',
    playerDensity: 'low',
    description: 'Base militar en esquina con buen loot y poca competencia',
    recommendedFor: ['looteo seguro', 'equipamiento militar'],
    nearbyVehicles: ['cars', 'motorcycles'],
    escapeRoutes: ['sur hacia centro', 'oeste hacia Power Grid']
  },
  {
    id: 'miramar_prison',
    name: 'Prisión',
    coordinates: { x: 100, y: 750 },
    lootQuality: 'high',
    riskLevel: 'high',
    playerDensity: 'low',
    description: 'Isla aislada con excelente loot pero difícil escape',
    recommendedFor: ['jugadores experimentados', 'estrategia de riesgo'],
    nearbyVehicles: ['boats'],
    escapeRoutes: ['barcos únicamente']
  }
];

// SANHOK - Mapa selvático 4x4km
const sanhokDropZones: DropZone[] = [
  {
    id: 'sanhok_bootcamp',
    name: 'Bootcamp',
    coordinates: { x: 400, y: 400 },
    lootQuality: 'elite',
    riskLevel: 'extreme',
    playerDensity: 'high',
    description: 'Centro del mapa con el mejor loot pero máxima competencia',
    recommendedFor: ['jugadores expertos', 'combate intenso'],
    nearbyVehicles: ['cars', 'motorcycles'],
    escapeRoutes: ['cualquier dirección']
  },
  {
    id: 'sanhok_paradise',
    name: 'Paradise Resort',
    coordinates: { x: 200, y: 200 },
    lootQuality: 'high',
    riskLevel: 'high',
    playerDensity: 'high',
    description: 'Resort con múltiples edificios y buen loot',
    recommendedFor: ['equipos organizados', 'combate urbano'],
    nearbyVehicles: ['cars'],
    escapeRoutes: ['sur hacia Bootcamp', 'este hacia Ruins']
  },
  {
    id: 'sanhok_ruins',
    name: 'Ruins',
    coordinates: { x: 600, y: 300 },
    lootQuality: 'medium',
    riskLevel: 'medium',
    playerDensity: 'medium',
    description: 'Ruinas antiguas con loot decente',
    recommendedFor: ['combate a media distancia', 'posiciones elevadas'],
    nearbyVehicles: ['motorcycles'],
    escapeRoutes: ['oeste hacia Bootcamp', 'sur hacia Camp Charlie']
  }
];

// Spawns de vehículos por mapa
const erangelVehicleSpawns: VehicleSpawn[] = [
  {
    id: 'erangel_vehicle_1',
    type: 'car',
    location: 'Georgopol garages',
    coordinates: { x: 200, y: 200 },
    spawnRate: 0.8,
    description: 'Garajes en Georgopol con alta probabilidad de vehículos'
  },
  {
    id: 'erangel_vehicle_2',
    type: 'boat',
    location: 'Military Base docks',
    coordinates: { x: 200, y: 850 },
    spawnRate: 0.9,
    description: 'Muelles de la base militar'
  },
  {
    id: 'erangel_vehicle_3',
    type: 'motorcycle',
    location: 'School parking',
    coordinates: { x: 400, y: 400 },
    spawnRate: 0.7,
    description: 'Estacionamiento de la escuela'
  }
];

// Spawns de armas por zona
const weaponSpawns: WeaponSpawn[] = [
  {
    zone: 'Military Base',
    weapons: [
      { name: 'AWM', type: 'sniper', rarity: 'legendary', spawnRate: 0.1 },
      { name: 'Groza', type: 'assault', rarity: 'legendary', spawnRate: 0.1 },
      { name: 'M416', type: 'assault', rarity: 'epic', spawnRate: 0.3 },
      { name: 'Kar98k', type: 'sniper', rarity: 'rare', spawnRate: 0.4 },
      { name: 'Level 3 Helmet', type: 'assault', rarity: 'epic', spawnRate: 0.5 }
    ]
  },
  {
    zone: 'School',
    weapons: [
      { name: 'M416', type: 'assault', rarity: 'rare', spawnRate: 0.4 },
      { name: 'SCAR-L', type: 'assault', rarity: 'uncommon', spawnRate: 0.6 },
      { name: 'UMP45', type: 'smg', rarity: 'common', spawnRate: 0.7 },
      { name: '8x Scope', type: 'sniper', rarity: 'rare', spawnRate: 0.2 }
    ]
  },
  {
    zone: 'Pochinki',
    weapons: [
      { name: 'AKM', type: 'assault', rarity: 'uncommon', spawnRate: 0.5 },
      { name: 'SKS', type: 'sniper', rarity: 'uncommon', spawnRate: 0.4 },
      { name: 'Vector', type: 'smg', rarity: 'rare', spawnRate: 0.3 },
      { name: '4x Scope', type: 'assault', rarity: 'uncommon', spawnRate: 0.4 }
    ]
  }
];

// Rutas de rotación
const rotationRoutes: RotationRoute[] = [
  {
    id: 'erangel_military_to_center',
    from: 'Military Base',
    to: 'Center Circle',
    distance: 2000,
    riskLevel: 'high',
    vehicleRequired: true,
    description: 'Ruta desde base militar al centro, cuidado con bridge trolls',
    landmarks: ['Bridge', 'Pochinki', 'School']
  },
  {
    id: 'erangel_georgopol_rotation',
    from: 'Georgopol',
    to: 'Center Circle',
    distance: 1500,
    riskLevel: 'medium',
    vehicleRequired: false,
    description: 'Rotación segura desde Georgopol',
    landmarks: ['Severny', 'Rozhok']
  }
];

// Datos específicos de mapas
export const ERANGEL_MAP: PUBGMap = {
  id: 'erangel',
  name: 'Erangel',
  size: '8x8 km',
  terrain: 'Mixto (Urbano/Rural)',
  description: 'El mapa clásico de PUBG con una mezcla de áreas urbanas y rurales',
  dropZones: [
    {
      id: 'military_base',
      name: 'Base Militar',
      coordinates: { x: 200, y: 700 },
      lootQuality: 'elite',
      riskLevel: 'high',
      description: 'Zona de alto riesgo con el mejor loot del mapa. Ideal para equipos experimentados.',
      capacity: 8,
      secretLocations: [
        'Bunkers subterráneos con loot especial y armamento pesado',
        'Torre de control con vista estratégica de toda la isla',
        'Hangares ocultos con vehículos blindados',
        'Sala de comunicaciones con equipamiento táctico'
      ]
    },
    {
      id: 'school',
      name: 'Escuela',
      coordinates: { x: 400, y: 400 },
      lootQuality: 'high',
      riskLevel: 'high',
      description: 'Zona central muy disputada con buen loot. Punto de encuentro común.',
      capacity: 6,
      secretLocations: [
        'Aula secreta en el segundo piso con loot médico',
        'Sótano con equipamiento médico y munición',
        'Azotea con posición de francotirador',
        'Laboratorio oculto con equipos especiales'
      ]
    },
    {
      id: 'pochinki',
      name: 'Pochinki',
      coordinates: { x: 450, y: 350 },
      lootQuality: 'medium',
      riskLevel: 'medium',
      description: 'Ciudad pequeña con loot decente y acción moderada. Buena para principiantes.',
      capacity: 4,
      secretLocations: [
        'Casa con sótano oculto y loot de supervivencia',
        'Garaje con loot de vehículos y combustible',
        'Iglesia con equipamiento médico en el campanario'
      ]
    },
    {
      id: 'georgopol',
      name: 'Georgopol',
      coordinates: { x: 300, y: 200 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Ciudad costera con múltiples edificios y buen loot distribuido.',
      capacity: 6,
      secretLocations: [
        'Contenedores del puerto con armas pesadas',
        'Hospital con suministros médicos abundantes',
        'Torre de agua con vista panorámica'
      ]
    },
    {
      id: 'rozhok',
      name: 'Rozhok',
      coordinates: { x: 500, y: 300 },
      lootQuality: 'medium',
      riskLevel: 'low',
      description: 'Pueblo tranquilo ideal para looteo seguro y rotación temprana.',
      capacity: 3,
      secretLocations: [
        'Granero con equipamiento agrícola modificado',
        'Casa del alcalde con caja fuerte'
      ]
    },
    {
      id: 'mylta',
      name: 'Mylta',
      coordinates: { x: 600, y: 600 },
      lootQuality: 'medium',
      riskLevel: 'low',
      description: 'Ciudad costera del sur con loot moderado y pocas amenazas.',
      capacity: 4,
      secretLocations: [
        'Fábrica abandonada con maquinaria pesada',
        'Muelle con botes y suministros marítimos'
      ]
    }
  ],
  vehicleSpawns: [
    {
      id: 'military_garage',
      type: 'car',
      location: 'Base Militar - Garaje Principal',
      coordinates: { x: 180, y: 720 },
      spawnRate: 0.9,
      description: 'Garaje principal con vehículos militares'
    },
    {
      id: 'school_parking',
      type: 'motorcycle',
      location: 'Escuela - Estacionamiento',
      coordinates: { x: 420, y: 380 },
      spawnRate: 0.7,
      description: 'Estacionamiento escolar con motocicletas'
    },
    {
      id: 'georgopol_port',
      type: 'boat',
      location: 'Georgopol - Puerto',
      coordinates: { x: 280, y: 180 },
      spawnRate: 0.8,
      description: 'Puerto con embarcaciones'
    },
    {
      id: 'pochinki_garage',
      type: 'car',
      location: 'Pochinki - Garajes Residenciales',
      coordinates: { x: 460, y: 340 },
      spawnRate: 0.6,
      description: 'Garajes residenciales con vehículos'
    },
    {
      id: 'mylta_power',
      type: 'car',
      location: 'Mylta Power - Estación',
      coordinates: { x: 650, y: 580 },
      spawnRate: 0.7,
      description: 'Estación eléctrica con vehículos industriales'
    }
  ],
  weaponSpawns: [
    {
      zone: 'Base Militar',
      weapons: [
        { name: 'AKM', type: 'assault', rarity: 'common', spawnRate: 0.35 },
        { name: 'M416', type: 'assault', rarity: 'uncommon', spawnRate: 0.3 },
        { name: 'AWM', type: 'sniper', rarity: 'legendary', spawnRate: 0.08 },
        { name: 'Kar98k', type: 'sniper', rarity: 'uncommon', spawnRate: 0.2 }
      ]
    },
    {
      zone: 'Escuela',
      weapons: [
        { name: 'AKM', type: 'assault', rarity: 'common', spawnRate: 0.35 },
        { name: 'M416', type: 'assault', rarity: 'uncommon', spawnRate: 0.3 },
        { name: 'SCAR-L', type: 'assault', rarity: 'common', spawnRate: 0.25 },
        { name: 'Kar98k', type: 'sniper', rarity: 'uncommon', spawnRate: 0.2 }
      ]
    },
    {
      zone: 'Pochinki',
      weapons: [
        { name: 'AKM', type: 'assault', rarity: 'common', spawnRate: 0.35 },
        { name: 'SCAR-L', type: 'assault', rarity: 'common', spawnRate: 0.25 },
        { name: 'UMP45', type: 'smg', rarity: 'common', spawnRate: 0.4 }
      ]
    }
  ]
};

// Exportar mapas completos
export const ERANGEL: PUBGMap = {
  id: 'erangel',
  name: 'Erangel',
  size: '8x8km',
  terrain: 'Mixto (urbano, rural, militar)',
  description: 'El mapa clásico de PUBG con variedad de terrenos y la icónica base militar',
  hotDrops: erangelDropZones.filter(zone => zone.riskLevel === 'high' || zone.riskLevel === 'extreme'),
  safeDrops: erangelDropZones.filter(zone => zone.riskLevel === 'low' || zone.riskLevel === 'medium'),
  vehicleSpawns: erangelVehicleSpawns,
  secretLocations: erangelSecretLocations,
  weaponSpawns: weaponSpawns.filter(spawn => ['Military Base', 'School', 'Pochinki'].includes(spawn.zone)),
  rotationRoutes: rotationRoutes.filter(route => route.id.startsWith('erangel'))
};

export const MIRAMAR: PUBGMap = {
  id: 'miramar',
  name: 'Miramar',
  size: '8x8km',
  terrain: 'Desértico',
  description: 'Mapa desértico con amplios espacios abiertos, ideal para combate a larga distancia',
  hotDrops: miramarDropZones.filter(zone => zone.riskLevel === 'high' || zone.riskLevel === 'extreme'),
  safeDrops: miramarDropZones.filter(zone => zone.riskLevel === 'low' || zone.riskLevel === 'medium'),
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

export const SANHOK: PUBGMap = {
  id: 'sanhok',
  name: 'Sanhok',
  size: '4x4km',
  terrain: 'Selvático',
  description: 'Mapa pequeño y denso con vegetación abundante, combate rápido y cercano',
  hotDrops: sanhokDropZones.filter(zone => zone.riskLevel === 'high' || zone.riskLevel === 'extreme'),
  safeDrops: sanhokDropZones.filter(zone => zone.riskLevel === 'low' || zone.riskLevel === 'medium'),
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// Mapas adicionales con datos básicos
export const TAEGO: PUBGMap = {
  id: 'taego',
  name: 'Taego',
  size: '8x8km',
  terrain: 'Urbano moderno',
  description: 'Mapa urbano con rascacielos y sistema de comeback',
  hotDrops: [],
  safeDrops: [],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

export const TAEGO_MAP: PUBGMap = {
  id: 'taego',
  name: 'Taego',
  size: '8x8 km',
  terrain: 'Urbano/Rural Coreano',
  description: 'Mapa coreano moderno con ciudades, montañas y características únicas como el Comeback BR',
  dropZones: [
    {
      id: 'terminal',
      name: 'Terminal',
      coordinates: { x: 400, y: 200 },
      lootQuality: 'elite',
      riskLevel: 'high',
      description: 'Terminal de transporte principal con loot de alta calidad',
      capacity: 8,
      secretLocations: [
        'Sala VIP con equipamiento premium',
        'Torre de control con vista estratégica',
        'Hangares subterráneos con vehículos',
        'Centro de comunicaciones con equipos tácticos'
      ]
    },
    {
      id: 'power_plant',
      name: 'Power Plant',
      coordinates: { x: 600, y: 400 },
      lootQuality: 'elite',
      riskLevel: 'high',
      description: 'Planta de energía con loot industrial y armamento pesado',
      capacity: 6,
      secretLocations: [
        'Sala de control principal con equipos especiales',
        'Túneles de mantenimiento con munición',
        'Torre de refrigeración con vista panorámica',
        'Laboratorio de investigación con prototipos'
      ]
    },
    {
      id: 'apartments',
      name: 'Apartments',
      coordinates: { x: 300, y: 300 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Complejo residencial moderno con múltiples edificios',
      capacity: 5,
      secretLocations: [
        'Ático con helipuerto privado',
        'Sótano comunitario con suministros',
        'Azotea con equipos de comunicación'
      ]
    },
    {
      id: 'school_taego',
      name: 'School (Taego)',
      coordinates: { x: 500, y: 500 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Escuela moderna coreana con diseño único',
      capacity: 4,
      secretLocations: [
        'Laboratorio de ciencias con equipos especiales',
        'Gimnasio con suministros deportivos modificados',
        'Biblioteca con documentos clasificados'
      ]
    },
    {
      id: 'market',
      name: 'Market',
      coordinates: { x: 200, y: 600 },
      lootQuality: 'medium',
      riskLevel: 'low',
      description: 'Mercado tradicional coreano con loot distribuido',
      capacity: 3,
      secretLocations: [
        'Almacén refrigerado con suministros médicos',
        'Oficina del administrador con caja fuerte'
      ]
    }
  ],
  vehicleSpawns: [
    {
      id: 'terminal_parking',
      type: 'car',
      location: 'Terminal - Estacionamiento Principal',
      coordinates: { x: 380, y: 220 },
      spawnRate: 0.9,
      description: 'Estacionamiento principal con vehículos urbanos'
    },
    {
      id: 'power_plant_garage',
      type: 'car',
      location: 'Power Plant - Garaje Industrial',
      coordinates: { x: 620, y: 380 },
      spawnRate: 0.8,
      description: 'Garaje industrial con vehículos pesados'
    },
    {
      id: 'apartments_parking',
      type: 'motorcycle',
      location: 'Apartments - Estacionamiento Subterráneo',
      coordinates: { x: 290, y: 320 },
      spawnRate: 0.7,
      description: 'Estacionamiento subterráneo con motocicletas'
    }
  ],
  weaponSpawns: [
    {
      zone: 'Terminal',
      weapons: [
        { name: 'K2', type: 'assault', rarity: 'uncommon', spawnRate: 0.3 },
        { name: 'Mk12', type: 'sniper', rarity: 'rare', spawnRate: 0.25 },
        { name: 'Lynx AMR', type: 'sniper', rarity: 'legendary', spawnRate: 0.1 }
      ]
    },
    {
      zone: 'Power Plant',
      weapons: [
        { name: 'K2', type: 'assault', rarity: 'uncommon', spawnRate: 0.3 },
        { name: 'Mk12', type: 'sniper', rarity: 'rare', spawnRate: 0.25 },
        { name: 'Lynx AMR', type: 'sniper', rarity: 'legendary', spawnRate: 0.1 }
      ]
    },
    {
      zone: 'Apartments',
      weapons: [
        { name: 'K2', type: 'assault', rarity: 'uncommon', spawnRate: 0.3 },
        { name: 'MP9', type: 'smg', rarity: 'common', spawnRate: 0.35 }
      ]
    }
  ]
};

export const SANHOK_MAP: PUBGMap = {
  id: 'sanhok',
  name: 'Sanhok',
  size: '4x4 km',
  terrain: 'Tropical',
  description: 'Mapa tropical compacto con combates rápidos y vegetación densa',
  dropZones: [
    {
      id: 'bootcamp',
      name: 'Bootcamp',
      coordinates: { x: 200, y: 200 },
      lootQuality: 'elite',
      riskLevel: 'high',
      description: 'Campo de entrenamiento militar con el mejor loot del mapa',
      capacity: 6,
      secretLocations: [
        'Búnker subterráneo con armamento especial y munición',
        'Torre de observación con equipos tácticos y miras',
        'Barracas ocultas con suministros médicos',
        'Hangar secreto con vehículos blindados'
      ]
    },
    {
      id: 'paradise_resort',
      name: 'Paradise Resort',
      coordinates: { x: 300, y: 100 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Resort de lujo con múltiples edificios y loot distribuido',
      capacity: 5,
      secretLocations: [
        'Suite presidencial con caja fuerte y loot élite',
        'Spa subterráneo con suministros médicos abundantes',
        'Cocina del chef con equipamiento especial',
        'Helipuerto privado con munición'
      ]
    },
    {
      id: 'ruins',
      name: 'Ruins',
      coordinates: { x: 150, y: 300 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Ruinas antiguas con loot oculto en estructuras históricas',
      capacity: 4,
      secretLocations: [
        'Templo central con tesoros antiguos',
        'Cámaras subterráneas con armamento',
        'Torre del vigía con vista panorámica'
      ]
    },
    {
      id: 'quarry',
      name: 'Quarry',
      coordinates: { x: 350, y: 250 },
      lootQuality: 'medium',
      riskLevel: 'low',
      description: 'Cantera industrial con loot moderado y pocas amenazas',
      capacity: 3,
      secretLocations: [
        'Oficina del capataz con equipos industriales',
        'Túneles de extracción con suministros'
      ]
    }
  ],
  vehicleSpawns: [
    {
      id: 'bootcamp_motor_pool',
      type: 'car',
      location: 'Bootcamp - Área de Vehículos',
      coordinates: { x: 220, y: 180 },
      spawnRate: 0.8,
      description: 'Área de vehículos del bootcamp con transporte variado'
    },
    {
      id: 'paradise_parking',
      type: 'boat',
      location: 'Paradise Resort - Estacionamiento',
      coordinates: { x: 320, y: 90 },
      spawnRate: 0.7,
      description: 'Estacionamiento del resort con embarcaciones'
    },
    {
      id: 'quarry_vehicles',
      type: 'motorcycle',
      location: 'Quarry - Área Industrial',
      coordinates: { x: 370, y: 240 },
      spawnRate: 0.6,
      description: 'Área industrial con vehículos de trabajo'
    }
  ],
  weaponSpawns: [
    {
      zone: 'Bootcamp',
      weapons: [
        { name: 'QBZ95', type: 'assault', rarity: 'uncommon', spawnRate: 0.4 },
        { name: 'Mini14', type: 'sniper', rarity: 'uncommon', spawnRate: 0.25 },
        { name: 'SLR', type: 'sniper', rarity: 'rare', spawnRate: 0.2 }
      ]
    },
    {
      zone: 'Paradise Resort',
      weapons: [
        { name: 'QBZ95', type: 'assault', rarity: 'uncommon', spawnRate: 0.4 },
        { name: 'Vector', type: 'smg', rarity: 'rare', spawnRate: 0.3 },
        { name: 'SLR', type: 'sniper', rarity: 'rare', spawnRate: 0.2 }
      ]
    },
    {
      zone: 'Quarry',
      weapons: [
        { name: 'Vector', type: 'smg', rarity: 'rare', spawnRate: 0.3 }
      ]
    }
  ]
}

export const VIKENDI: PUBGMap = {
  id: 'vikendi',
  name: 'Vikendi',
  size: '6x6km',
  terrain: 'Nevado',
  description: 'Mapa invernal con nieve que afecta la visibilidad y movimiento',
  hotDrops: [],
  safeDrops: [],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

export const DESTON_MAP: PUBGMap = {
  id: 'deston',
  name: 'Deston',
  size: '8x8 km',
  terrain: 'Urbano Futurista',
  description: 'Mapa urbano futurista con rascacielos, tecnología avanzada y ascensores',
  dropZones: [
    {
      id: 'ripton',
      name: 'Ripton',
      coordinates: { x: 400, y: 400 },
      lootQuality: 'elite',
      riskLevel: 'high',
      description: 'Ciudad central con rascacielos conectados y loot de alta tecnología',
      capacity: 10,
      secretLocations: [
        'Azoteas conectadas con puentes aéreos y helipuertos',
        'Laboratorios subterráneos con prototipos de armas',
        'Centro de datos con equipamiento cibernético',
        'Observatorio astronómico con equipos de precisión'
      ]
    },
    {
      id: 'lodge',
      name: 'Lodge',
      coordinates: { x: 200, y: 200 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Complejo de cabañas de lujo en zona montañosa',
      capacity: 6,
      secretLocations: [
        'Cabaña principal con caja fuerte privada',
        'Spa subterráneo con suministros médicos',
        'Torre de observación con equipos de vigilancia'
      ]
    },
    {
      id: 'construction',
      name: 'Construction',
      coordinates: { x: 600, y: 300 },
      lootQuality: 'high',
      riskLevel: 'medium',
      description: 'Zona de construcción con edificios en desarrollo',
      capacity: 5,
      secretLocations: [
        'Grúas con plataformas de francotirador',
        'Contenedores de construcción con herramientas',
        'Oficina del arquitecto con planos secretos'
      ]
    },
    {
      id: 'arena',
      name: 'Arena',
      coordinates: { x: 500, y: 600 },
      lootQuality: 'medium',
      riskLevel: 'low',
      description: 'Estadio deportivo con múltiples niveles',
      capacity: 4,
      secretLocations: [
        'Palcos VIP con equipamiento premium',
        'Vestuarios con suministros deportivos',
        'Sala de prensa con equipos de comunicación'
      ]
    }
  ],
  vehicleSpawns: [
    {
      id: 'ripton_garage',
      type: 'car',
      location: 'Ripton - Garaje Subterráneo',
      coordinates: { x: 380, y: 420 },
      spawnRate: 0.9,
      description: 'Garaje subterráneo con vehículos eléctricos'
    },
    {
      id: 'lodge_parking',
      type: 'car',
      location: 'Lodge - Estacionamiento Privado',
      coordinates: { x: 220, y: 180 },
      spawnRate: 0.7,
      description: 'Estacionamiento privado con SUVs'
    },
    {
      id: 'construction_vehicles',
      type: 'car',
      location: 'Construction - Área de Maquinaria',
      coordinates: { x: 620, y: 280 },
      spawnRate: 0.8,
      description: 'Área de construcción con vehículos pesados'
    }
  ],
  weaponSpawns: [
    {
      zone: 'Ripton',
      weapons: [
        { name: 'ACE32', type: 'assault', rarity: 'uncommon', spawnRate: 0.35 },
        { name: 'P90', type: 'smg', rarity: 'rare', spawnRate: 0.3 },
        { name: 'O12', type: 'shotgun', rarity: 'uncommon', spawnRate: 0.25 }
      ]
    },
    {
      zone: 'Lodge',
      weapons: [
        { name: 'ACE32', type: 'assault', rarity: 'uncommon', spawnRate: 0.35 },
        { name: 'Mosin Nagant', type: 'sniper', rarity: 'rare', spawnRate: 0.2 }
      ]
    },
    {
      zone: 'Construction',
      weapons: [
        { name: 'ACE32', type: 'assault', rarity: 'uncommon', spawnRate: 0.35 },
        { name: 'Mosin Nagant', type: 'sniper', rarity: 'rare', spawnRate: 0.2 },
        { name: 'O12', type: 'shotgun', rarity: 'uncommon', spawnRate: 0.25 }
      ]
    }
  ]
};

export const DESTON: PUBGMap = {
  id: 'deston',
  name: 'Deston',
  size: '8x8km',
  terrain: 'Urbano futurista',
  description: 'Mapa futurista con salas de seguridad y llaves específicas',
  hotDrops: [],
  safeDrops: [],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

export const PARAMO: PUBGMap = {
  id: 'paramo',
  name: 'Paramo',
  size: '3x3km',
  terrain: 'Montañoso',
  description: 'Mapa pequeño con terreno montañoso y clima dinámico',
  hotDrops: [],
  safeDrops: [],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// KARAKIN - Mapa pequeño 2x2km para combate rápido
const KARAKIN_MAP: PUBGMap = {
  id: 'karakin',
  name: 'Karakin',
  size: '2x2',
  terrain: 'Desierto urbano',
  description: 'Mapa pequeño con edificios destructibles y combate intenso. Favorito en torneos por partidas rápidas.',
  hotDrops: [
    {
      id: 'karakin_habibi',
      name: 'Habibi',
      coordinates: { x: 400, y: 400 },
      lootQuality: 'elite',
      riskLevel: 'extreme',
      playerDensity: 'high',
      description: 'Centro del mapa con loot de élite. Estrategia pro: aterrizar en techos y usar granadas para abrir nuevas rutas',
      recommendedFor: ['equipos agresivos', 'estrategia de centro'],
      nearbyVehicles: ['motorcycles'],
      escapeRoutes: ['túneles subterráneos', 'edificios conectados']
    }
  ],
  safeDrops: [
    {
      id: 'karakin_bahr_sahir',
      name: 'Bahr Sahir',
      coordinates: { x: 200, y: 600 },
      lootQuality: 'medium',
      riskLevel: 'low',
      playerDensity: 'low',
      description: 'Zona costera segura para loot inicial. Estrategia pro: rotar rápido hacia centro usando vehículos',
      recommendedFor: ['equipos conservadores', 'estrategia de borde'],
      nearbyVehicles: ['cars', 'boats'],
      escapeRoutes: ['costa norte', 'carretera principal']
    }
  ],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// LIVIK - Mapa compacto 2x2km con mecánicas únicas
const LIVIK_MAP: PUBGMap = {
  id: 'livik',
  name: 'Livik',
  size: '2x2',
  terrain: 'Tropical volcánico',
  description: 'Mapa tropical con tirolinas y ubicaciones secretas. Limitado a 52 jugadores para partidas dinámicas.',
  hotDrops: [
    {
      id: 'livik_iceborg',
      name: 'Iceborg',
      coordinates: { x: 300, y: 300 },
      lootQuality: 'elite',
      riskLevel: 'high',
      playerDensity: 'high',
      description: 'Zona central con loot premium. Estrategia pro: usar tirolinas para rotaciones rápidas y escape',
      recommendedFor: ['combate temprano', 'equipos móviles'],
      nearbyVehicles: ['motorcycles', 'cars'],
      escapeRoutes: ['tirolinas', 'túneles volcánicos']
    }
  ],
  safeDrops: [
    {
      id: 'livik_blomster',
      name: 'Blomster',
      coordinates: { x: 600, y: 200 },
      lootQuality: 'medium',
      riskLevel: 'medium',
      playerDensity: 'medium',
      description: 'Zona de flores con loot decente. Estrategia pro: usar vegetación densa para emboscadas',
      recommendedFor: ['estrategia defensiva', 'equipos tácticos'],
      nearbyVehicles: ['motorcycles'],
      escapeRoutes: ['senderos ocultos', 'campo abierto']
    }
  ],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// RONDO - Mapa más reciente con mecánicas avanzadas
const RONDO_MAP: PUBGMap = {
  id: 'rondo',
  name: 'Rondo',
  size: '1x1',
  terrain: 'Urbano futurista',
  description: 'Mapa compacto con tecnología avanzada y combate vertical intenso.',
  hotDrops: [
    {
      id: 'rondo_center',
      name: 'Centro Rondo',
      coordinates: { x: 500, y: 500 },
      lootQuality: 'elite',
      riskLevel: 'extreme',
      playerDensity: 'high',
      description: 'Centro tecnológico con loot de élite. Estrategia pro: dominar edificios altos para control de área',
      recommendedFor: ['equipos experimentados', 'combate vertical'],
      nearbyVehicles: ['futuristic_vehicles'],
      escapeRoutes: ['ascensores rápidos', 'puentes elevados']
    }
  ],
  safeDrops: [
    {
      id: 'rondo_outskirts',
      name: 'Periferia',
      coordinates: { x: 200, y: 200 },
      lootQuality: 'medium',
      riskLevel: 'low',
      playerDensity: 'low',
      description: 'Zona exterior más segura. Estrategia pro: loot rápido y rotación hacia centro con equipo completo',
      recommendedFor: ['equipos conservadores', 'estrategia de supervivencia'],
      nearbyVehicles: ['motorcycles'],
      escapeRoutes: ['túneles subterráneos', 'rutas periféricas']
    }
  ],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// NUSA - Mapa tropical con características únicas
const NUSA_MAP: PUBGMap = {
  id: 'nusa',
  name: 'Nusa',
  size: '1x1',
  terrain: 'Isla tropical',
  description: 'Mapa tropical compacto con mecánicas de agua y vegetación densa.',
  hotDrops: [
    {
      id: 'nusa_resort',
      name: 'Resort Central',
      coordinates: { x: 400, y: 400 },
      lootQuality: 'elite',
      riskLevel: 'high',
      playerDensity: 'high',
      description: 'Resort de lujo con loot premium. Estrategia pro: usar piscinas y estructuras para cover dinámico',
      recommendedFor: ['combate acuático', 'equipos adaptativos'],
      nearbyVehicles: ['boats', 'cars'],
      escapeRoutes: ['canales acuáticos', 'senderos de playa']
    }
  ],
  safeDrops: [
    {
      id: 'nusa_village',
      name: 'Pueblo Pesquero',
      coordinates: { x: 600, y: 200 },
      lootQuality: 'medium',
      riskLevel: 'medium',
      playerDensity: 'low',
      description: 'Pueblo tradicional con loot moderado. Estrategia pro: usar barcos para rotaciones rápidas',
      recommendedFor: ['estrategia naval', 'equipos pacientes'],
      nearbyVehicles: ['boats'],
      escapeRoutes: ['rutas marítimas', 'senderos costeros']
    }
  ],
  vehicleSpawns: [],
  secretLocations: [],
  weaponSpawns: [],
  rotationRoutes: []
};

// Array con todos los mapas oficiales de PUBG Mobile
export const ALL_MAPS: PUBGMap[] = [
  ERANGEL_MAP,
  MIRAMAR,
  SANHOK_MAP,
  VIKENDI,
  KARAKIN_MAP,
  LIVIK_MAP,
  RONDO_MAP,
  NUSA_MAP
];

// Función para obtener mapa por ID
export function getMapById(id: string): PUBGMap | undefined {
  return ALL_MAPS.find(map => map.id === id);
}

// Función para obtener zonas por tipo de riesgo
export function getZonesByRisk(mapId: string, riskLevel: string): DropZone[] {
  const map = getMapById(mapId);
  if (!map) return [];
  
  return [...map.hotDrops, ...map.safeDrops].filter(zone => zone.riskLevel === riskLevel);
}

// Función para obtener ubicaciones secretas por mapa
export function getSecretLocationsByMap(mapId: string): SecretLocation[] {
  const map = getMapById(mapId);
  return map?.secretLocations || [];
}