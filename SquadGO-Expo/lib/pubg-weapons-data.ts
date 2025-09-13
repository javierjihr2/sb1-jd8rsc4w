// Sistema de información de armas por zona y mapa para PUBG Mobile

export interface WeaponInfo {
  name: string;
  type: 'AR' | 'SMG' | 'SR' | 'LMG' | 'Shotgun' | 'Pistol' | 'DMR';
  damage: number;
  range: 'Short' | 'Medium' | 'Long';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  spawnRate: number; // 0-1
  attachments: string[];
  ammoType: string;
  description: string;
}

export interface ZoneWeaponData {
  zoneName: string;
  primaryWeapons: WeaponInfo[];
  secondaryWeapons: WeaponInfo[];
  attachmentAvailability: {
    scopes: string[];
    grips: string[];
    muzzles: string[];
    stocks: string[];
  };
  ammoAvailability: {
    [key: string]: number; // ammo type -> spawn rate
  };
  lootDensity: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface MapWeaponProfile {
  mapName: string;
  globalWeaponSpawns: WeaponInfo[];
  zoneSpecificData: ZoneWeaponData[];
  weaponTierDistribution: {
    tier1Zones: string[]; // High-tier weapons
    tier2Zones: string[]; // Medium-tier weapons
    tier3Zones: string[]; // Low-tier weapons
  };
  specialWeaponZones: {
    zoneName: string;
    specialWeapons: WeaponInfo[];
    exclusiveItems: string[];
  }[];
}

// Base de datos de armas
export const WEAPONS_DATABASE: { [key: string]: WeaponInfo } = {
  // Assault Rifles
  'AKM': {
    name: 'AKM',
    type: 'AR',
    damage: 49,
    range: 'Medium',
    rarity: 'Common',
    spawnRate: 0.8,
    attachments: ['Red Dot', '2x Scope', '4x Scope', 'Compensator', 'Flash Hider'],
    ammoType: '7.62mm',
    description: 'Rifle de asalto potente con alto daño pero retroceso considerable'
  },
  'M416': {
    name: 'M416',
    type: 'AR',
    damage: 43,
    range: 'Medium',
    rarity: 'Uncommon',
    spawnRate: 0.7,
    attachments: ['Red Dot', '2x Scope', '4x Scope', '6x Scope', 'Compensator', 'Tactical Stock'],
    ammoType: '5.56mm',
    description: 'Rifle versátil con buena estabilidad y múltiples opciones de personalización'
  },
  'SCAR-L': {
    name: 'SCAR-L',
    type: 'AR',
    damage: 43,
    range: 'Medium',
    rarity: 'Common',
    spawnRate: 0.75,
    attachments: ['Red Dot', '2x Scope', '4x Scope', 'Compensator', 'Tactical Stock'],
    ammoType: '5.56mm',
    description: 'Rifle estable con buen equilibrio entre daño y control'
  },
  'M762': {
    name: 'M762',
    type: 'AR',
    damage: 47,
    range: 'Medium',
    rarity: 'Rare',
    spawnRate: 0.6,
    attachments: ['Red Dot', '2x Scope', '4x Scope', 'Compensator', 'Tactical Stock'],
    ammoType: '7.62mm',
    description: 'Rifle de alto daño con retroceso manejable con accesorios'
  },
  'Groza': {
    name: 'Groza',
    type: 'AR',
    damage: 49,
    range: 'Medium',
    rarity: 'Legendary',
    spawnRate: 0.1,
    attachments: ['Red Dot', '2x Scope', '4x Scope'],
    ammoType: '7.62mm',
    description: 'Rifle exclusivo de caja de suministros con alto daño'
  },

  // Submachine Guns
  'UMP45': {
    name: 'UMP45',
    type: 'SMG',
    damage: 39,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.8,
    attachments: ['Red Dot', '2x Scope', 'Compensator', 'Tactical Stock'],
    ammoType: '.45 ACP',
    description: 'SMG versátil para combate cercano y medio'
  },
  'Vector': {
    name: 'Vector',
    type: 'SMG',
    damage: 31,
    range: 'Short',
    rarity: 'Rare',
    spawnRate: 0.5,
    attachments: ['Red Dot', '2x Scope', 'Compensator', 'Extended Mag'],
    ammoType: '.45 ACP',
    description: 'SMG de alta cadencia de fuego para combate cercano'
  },
  'Uzi': {
    name: 'Uzi',
    type: 'SMG',
    damage: 26,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.9,
    attachments: ['Red Dot', 'Compensator', 'Extended Mag'],
    ammoType: '9mm',
    description: 'SMG básica con alta cadencia de fuego'
  },

  // Sniper Rifles
  'Kar98k': {
    name: 'Kar98k',
    type: 'SR',
    damage: 79,
    range: 'Long',
    rarity: 'Uncommon',
    spawnRate: 0.6,
    attachments: ['4x Scope', '8x Scope', 'Cheek Pad'],
    ammoType: '7.62mm',
    description: 'Rifle de francotirador de cerrojo con alto daño'
  },
  'M24': {
    name: 'M24',
    type: 'SR',
    damage: 84,
    range: 'Long',
    rarity: 'Rare',
    spawnRate: 0.4,
    attachments: ['4x Scope', '8x Scope', '15x Scope', 'Cheek Pad'],
    ammoType: '7.62mm',
    description: 'Rifle de francotirador de alta precisión'
  },
  'AWM': {
    name: 'AWM',
    type: 'SR',
    damage: 120,
    range: 'Long',
    rarity: 'Legendary',
    spawnRate: 0.05,
    attachments: ['4x Scope', '8x Scope', '15x Scope'],
    ammoType: '.300 Magnum',
    description: 'Rifle de francotirador más poderoso, solo en cajas de suministros'
  },

  // Designated Marksman Rifles
  'SKS': {
    name: 'SKS',
    type: 'DMR',
    damage: 53,
    range: 'Long',
    rarity: 'Common',
    spawnRate: 0.7,
    attachments: ['Red Dot', '2x Scope', '4x Scope', '8x Scope', 'Compensator'],
    ammoType: '7.62mm',
    description: 'Rifle de tirador designado semiautomático'
  },
  'Mini14': {
    name: 'Mini14',
    type: 'DMR',
    damage: 46,
    range: 'Long',
    rarity: 'Uncommon',
    spawnRate: 0.6,
    attachments: ['Red Dot', '2x Scope', '4x Scope', '8x Scope', 'Compensator'],
    ammoType: '5.56mm',
    description: 'DMR ligero con buena velocidad de bala'
  },

  // Shotguns
  'S1897': {
    name: 'S1897',
    type: 'Shotgun',
    damage: 26,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.8,
    attachments: ['Red Dot', 'Choke'],
    ammoType: '12 Gauge',
    description: 'Escopeta de acción de bomba para combate cercano'
  },
  'S686': {
    name: 'S686',
    type: 'Shotgun',
    damage: 26,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.7,
    attachments: ['Red Dot', 'Choke'],
    ammoType: '12 Gauge',
    description: 'Escopeta de doble cañón con alto daño por disparo'
  },

  // Light Machine Guns
  'M249': {
    name: 'M249',
    type: 'LMG',
    damage: 45,
    range: 'Medium',
    rarity: 'Legendary',
    spawnRate: 0.08,
    attachments: ['Red Dot', '2x Scope', '4x Scope', '6x Scope'],
    ammoType: '5.56mm',
    description: 'Ametralladora ligera con gran capacidad de munición'
  },

  // Pistols
  'P1911': {
    name: 'P1911',
    type: 'Pistol',
    damage: 35,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.9,
    attachments: ['Red Dot', 'Suppressor'],
    ammoType: '.45 ACP',
    description: 'Pistola estándar para combate de emergencia'
  },
  'P92': {
    name: 'P92',
    type: 'Pistol',
    damage: 29,
    range: 'Short',
    rarity: 'Common',
    spawnRate: 0.9,
    attachments: ['Red Dot', 'Suppressor'],
    ammoType: '9mm',
    description: 'Pistola con mayor capacidad de munición'
  }
};

// Datos de armas por mapa
export const ERANGEL_WEAPONS: MapWeaponProfile = {
  mapName: 'Erangel',
  globalWeaponSpawns: Object.values(WEAPONS_DATABASE).filter(w => w.rarity !== 'Legendary'),
  zoneSpecificData: [
    {
      zoneName: 'Pochinki',
      primaryWeapons: [WEAPONS_DATABASE['AKM'], WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['SCAR-L']],
      secondaryWeapons: [WEAPONS_DATABASE['UMP45'], WEAPONS_DATABASE['Vector']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope'],
        grips: ['Vertical Grip', 'Angled Grip'],
        muzzles: ['Compensator', 'Flash Hider'],
        stocks: ['Tactical Stock']
      },
      ammoAvailability: {
        '7.62mm': 0.8,
        '5.56mm': 0.7,
        '.45 ACP': 0.6
      },
      lootDensity: 'High'
    },
    {
      zoneName: 'School',
      primaryWeapons: [WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['SCAR-L'], WEAPONS_DATABASE['M762']],
      secondaryWeapons: [WEAPONS_DATABASE['UMP45'], WEAPONS_DATABASE['Uzi']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '8x Scope'],
        grips: ['Vertical Grip', 'Angled Grip'],
        muzzles: ['Compensator', 'Suppressor'],
        stocks: ['Tactical Stock', 'Cheek Pad']
      },
      ammoAvailability: {
        '5.56mm': 0.8,
        '7.62mm': 0.7,
        '9mm': 0.6
      },
      lootDensity: 'Very High'
    },
    {
      zoneName: 'Military Base',
      primaryWeapons: [WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['AKM'], WEAPONS_DATABASE['M762']],
      secondaryWeapons: [WEAPONS_DATABASE['Vector'], WEAPONS_DATABASE['UMP45']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '8x Scope', '15x Scope'],
        grips: ['Vertical Grip', 'Angled Grip', 'Half Grip'],
        muzzles: ['Compensator', 'Suppressor', 'Flash Hider'],
        stocks: ['Tactical Stock', 'Cheek Pad']
      },
      ammoAvailability: {
        '5.56mm': 0.9,
        '7.62mm': 0.8,
        '.45 ACP': 0.7
      },
      lootDensity: 'Very High'
    },
    {
      zoneName: 'Georgopol',
      primaryWeapons: [WEAPONS_DATABASE['SCAR-L'], WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['SKS']],
      secondaryWeapons: [WEAPONS_DATABASE['UMP45'], WEAPONS_DATABASE['S1897']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope'],
        grips: ['Vertical Grip'],
        muzzles: ['Compensator', 'Flash Hider'],
        stocks: ['Tactical Stock']
      },
      ammoAvailability: {
        '5.56mm': 0.7,
        '7.62mm': 0.6,
        '12 Gauge': 0.5
      },
      lootDensity: 'High'
    }
  ],
  weaponTierDistribution: {
    tier1Zones: ['Military Base', 'School', 'Pochinki'],
    tier2Zones: ['Georgopol', 'Rozhok', 'Mylta'],
    tier3Zones: ['Primorsk', 'Lipovka', 'Kameshki']
  },
  specialWeaponZones: [
    {
      zoneName: 'Military Base',
      specialWeapons: [WEAPONS_DATABASE['M24'], WEAPONS_DATABASE['Kar98k']],
      exclusiveItems: ['8x Scope', '15x Scope', 'Ghillie Suit']
    }
  ]
};

export const SANHOK_WEAPONS: MapWeaponProfile = {
  mapName: 'Sanhok',
  globalWeaponSpawns: Object.values(WEAPONS_DATABASE).filter(w => w.rarity !== 'Legendary'),
  zoneSpecificData: [
    {
      zoneName: 'Paradise Resort',
      primaryWeapons: [WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['SCAR-L'], WEAPONS_DATABASE['Vector']],
      secondaryWeapons: [WEAPONS_DATABASE['UMP45'], WEAPONS_DATABASE['Mini14']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '6x Scope'],
        grips: ['Vertical Grip', 'Angled Grip'],
        muzzles: ['Compensator', 'Suppressor'],
        stocks: ['Tactical Stock']
      },
      ammoAvailability: {
        '5.56mm': 0.8,
        '.45 ACP': 0.7,
        '7.62mm': 0.6
      },
      lootDensity: 'Very High'
    },
    {
      zoneName: 'Bootcamp',
      primaryWeapons: [WEAPONS_DATABASE['AKM'], WEAPONS_DATABASE['M762'], WEAPONS_DATABASE['SKS']],
      secondaryWeapons: [WEAPONS_DATABASE['Vector'], WEAPONS_DATABASE['S686']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '8x Scope'],
        grips: ['Vertical Grip', 'Angled Grip'],
        muzzles: ['Compensator', 'Flash Hider'],
        stocks: ['Tactical Stock', 'Cheek Pad']
      },
      ammoAvailability: {
        '7.62mm': 0.8,
        '.45 ACP': 0.7,
        '12 Gauge': 0.5
      },
      lootDensity: 'High'
    }
  ],
  weaponTierDistribution: {
    tier1Zones: ['Paradise Resort', 'Bootcamp', 'Ruins'],
    tier2Zones: ['Cave', 'Quarry', 'Lakawi'],
    tier3Zones: ['Mongnai', 'Sahmee', 'Pai Nan']
  },
  specialWeaponZones: [
    {
      zoneName: 'Paradise Resort',
      specialWeapons: [WEAPONS_DATABASE['M24'], WEAPONS_DATABASE['Vector']],
      exclusiveItems: ['6x Scope', '8x Scope', 'Extended QuickDraw Mag']
    }
  ]
};

export const TAEGO_WEAPONS: MapWeaponProfile = {
  mapName: 'Taego',
  globalWeaponSpawns: Object.values(WEAPONS_DATABASE).filter(w => w.rarity !== 'Legendary'),
  zoneSpecificData: [
    {
      zoneName: 'Terminal',
      primaryWeapons: [WEAPONS_DATABASE['M416'], WEAPONS_DATABASE['SCAR-L'], WEAPONS_DATABASE['M762']],
      secondaryWeapons: [WEAPONS_DATABASE['Vector'], WEAPONS_DATABASE['UMP45']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '6x Scope'],
        grips: ['Vertical Grip', 'Angled Grip', 'Half Grip'],
        muzzles: ['Compensator', 'Suppressor'],
        stocks: ['Tactical Stock']
      },
      ammoAvailability: {
        '5.56mm': 0.8,
        '7.62mm': 0.7,
        '.45 ACP': 0.6
      },
      lootDensity: 'Very High'
    },
    {
      zoneName: 'Power Plant',
      primaryWeapons: [WEAPONS_DATABASE['AKM'], WEAPONS_DATABASE['M762'], WEAPONS_DATABASE['SKS']],
      secondaryWeapons: [WEAPONS_DATABASE['UMP45'], WEAPONS_DATABASE['Kar98k']],
      attachmentAvailability: {
        scopes: ['Red Dot', '2x Scope', '4x Scope', '8x Scope'],
        grips: ['Vertical Grip', 'Angled Grip'],
        muzzles: ['Compensator', 'Flash Hider'],
        stocks: ['Tactical Stock', 'Cheek Pad']
      },
      ammoAvailability: {
        '7.62mm': 0.8,
        '5.56mm': 0.6,
        '.45 ACP': 0.5
      },
      lootDensity: 'High'
    }
  ],
  weaponTierDistribution: {
    tier1Zones: ['Terminal', 'Power Plant', 'Neuhausen'],
    tier2Zones: ['Grezhka', 'Volnova', 'Krasnoye'],
    tier3Zones: ['Dobro Mesto', 'Lumber Yard', 'Winery']
  },
  specialWeaponZones: [
    {
      zoneName: 'Terminal',
      specialWeapons: [WEAPONS_DATABASE['M24'], WEAPONS_DATABASE['Vector']],
      exclusiveItems: ['6x Scope', '8x Scope', 'Tactical Stock']
    }
  ]
};

// Función para obtener recomendaciones de armas por zona
export function getWeaponRecommendations(
  mapName: string,
  zoneName: string,
  playStyle: 'aggressive' | 'balanced' | 'passive',
  teamSize: number
): {
  primaryWeapon: WeaponInfo;
  secondaryWeapon: WeaponInfo;
  attachmentPriority: string[];
  ammoRequirement: { [key: string]: number };
  reasoning: string;
} {
  const mapData = getMapWeaponData(mapName);
  const zoneData = mapData?.zoneSpecificData.find(z => z.zoneName === zoneName);
  
  if (!zoneData) {
    throw new Error(`Zone ${zoneName} not found in map ${mapName}`);
  }

  let primaryWeapon: WeaponInfo;
  let secondaryWeapon: WeaponInfo;
  let reasoning: string;

  // Selección basada en estilo de juego
  switch (playStyle) {
    case 'aggressive':
      primaryWeapon = zoneData.primaryWeapons.find(w => w.type === 'AR' && w.damage > 45) || zoneData.primaryWeapons[0];
      secondaryWeapon = zoneData.secondaryWeapons.find(w => w.type === 'SMG') || zoneData.secondaryWeapons[0];
      reasoning = 'Configuración agresiva: AR de alto daño + SMG para combate cercano';
      break;
    
    case 'passive':
      primaryWeapon = zoneData.primaryWeapons.find(w => w.type === 'DMR') || 
                     zoneData.primaryWeapons.find(w => w.range === 'Long') || 
                     zoneData.primaryWeapons[0];
      secondaryWeapon = zoneData.secondaryWeapons.find(w => w.type === 'AR') || zoneData.secondaryWeapons[0];
      reasoning = 'Configuración pasiva: Arma de largo alcance + AR versátil';
      break;
    
    default: // balanced
      primaryWeapon = zoneData.primaryWeapons.find(w => w.type === 'AR') || zoneData.primaryWeapons[0];
      secondaryWeapon = zoneData.secondaryWeapons[0];
      reasoning = 'Configuración equilibrada: AR versátil + arma secundaria adaptable';
  }

  // Prioridad de accesorios basada en armas seleccionadas
  const attachmentPriority: string[] = [];
  
  if (primaryWeapon.range === 'Long' || primaryWeapon.type === 'DMR') {
    attachmentPriority.push('4x Scope', '8x Scope', 'Compensator', 'Cheek Pad');
  } else {
    attachmentPriority.push('Red Dot', '2x Scope', 'Compensator', 'Vertical Grip');
  }

  // Requerimientos de munición basados en tamaño del equipo
  const baseAmmo = teamSize === 1 ? 200 : teamSize <= 2 ? 150 : 120;
  const ammoRequirement: { [key: string]: number } = {
    [primaryWeapon.ammoType]: baseAmmo,
    [secondaryWeapon.ammoType]: Math.floor(baseAmmo * 0.6)
  };

  return {
    primaryWeapon,
    secondaryWeapon,
    attachmentPriority,
    ammoRequirement,
    reasoning
  };
}

// Función para obtener datos de armas por mapa
export function getMapWeaponData(mapName: string): MapWeaponProfile | null {
  switch (mapName.toLowerCase()) {
    case 'erangel':
      return ERANGEL_WEAPONS;
    case 'sanhok':
      return SANHOK_WEAPONS;
    case 'taego':
      return TAEGO_WEAPONS;
    default:
      return null;
  }
}

// Función para analizar disponibilidad de armas en una zona
export function analyzeZoneWeaponAvailability(mapName: string, zoneName: string): {
  weaponDiversity: number;
  attachmentAvailability: number;
  ammoSecurity: number;
  overallRating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  recommendations: string[];
} {
  const mapData = getMapWeaponData(mapName);
  const zoneData = mapData?.zoneSpecificData.find(z => z.zoneName === zoneName);
  
  if (!zoneData) {
    return {
      weaponDiversity: 0,
      attachmentAvailability: 0,
      ammoSecurity: 0,
      overallRating: 'Poor',
      recommendations: ['Zona no encontrada']
    };
  }

  // Calcular diversidad de armas (0-1)
  const totalWeapons = zoneData.primaryWeapons.length + zoneData.secondaryWeapons.length;
  const weaponTypes = new Set([...zoneData.primaryWeapons, ...zoneData.secondaryWeapons].map(w => w.type));
  const weaponDiversity = Math.min(weaponTypes.size / 6, 1); // 6 tipos máximos

  // Calcular disponibilidad de accesorios (0-1)
  const totalAttachments = Object.values(zoneData.attachmentAvailability).reduce((sum, arr) => sum + arr.length, 0);
  const attachmentAvailability = Math.min(totalAttachments / 20, 1); // 20 accesorios máximos

  // Calcular seguridad de munición (0-1)
  const ammoTypes = Object.keys(zoneData.ammoAvailability);
  const avgAmmoRate = ammoTypes.reduce((sum, type) => sum + zoneData.ammoAvailability[type], 0) / ammoTypes.length;
  const ammoSecurity = avgAmmoRate;

  // Calcular calificación general
  const overallScore = (weaponDiversity + attachmentAvailability + ammoSecurity) / 3;
  let overallRating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  
  if (overallScore >= 0.8) overallRating = 'Excellent';
  else if (overallScore >= 0.6) overallRating = 'Good';
  else if (overallScore >= 0.4) overallRating = 'Fair';
  else overallRating = 'Poor';

  // Generar recomendaciones
  const recommendations: string[] = [];
  
  if (weaponDiversity < 0.5) {
    recommendations.push('Limitada variedad de armas - considera rotar temprano');
  }
  
  if (attachmentAvailability < 0.5) {
    recommendations.push('Pocos accesorios disponibles - prioriza armas básicas');
  }
  
  if (ammoSecurity < 0.6) {
    recommendations.push('Munición limitada - conserva disparos y busca reabastecimiento');
  }
  
  if (zoneData.lootDensity === 'Low') {
    recommendations.push('Densidad de loot baja - explora múltiples edificios');
  }

  return {
    weaponDiversity,
    attachmentAvailability,
    ammoSecurity,
    overallRating,
    recommendations
  };
}

export const ALL_WEAPON_MAPS = [ERANGEL_WEAPONS, SANHOK_WEAPONS, TAEGO_WEAPONS];