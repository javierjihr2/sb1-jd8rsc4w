
import type { PlayerProfile, Tournament, Chat, NewsArticle, Team, RegistrationRequest, FeedPost, RechargeProvider, Developer, Service, UserWithRole, BankAccount, Transaction, ApprovedRegistration, ConnectionRequest, Match, ConnectionStatusResult } from './types';

// --- Admin Configuration ---
// This is the email that will have admin privileges.
// Change this to your actual email address before deploying.
export const ADMIN_EMAIL = 'javier.jihr2@gmail.com';


export const playerProfile: PlayerProfile = {
  id: 'p1',
  // Campos requeridos
  displayName: 'Player1_Pro',
  username: 'player1_pro',
  avatarUrl: 'https://placehold.co/100x100.png',
  bio: 'Jugador profesional de PUBG Mobile, especialista en rifles de asalto y estratega de equipo. Buscando dúo para dominar en los torneos.',
  region: 'MX',
  language: 'es',
  mic: true,
  roles: ['Asaltante', 'Estratega'],
  rankTier: 'Conquistador',
  stats: {
    kda: 4.8,
    wins: 124,
    matches: 200,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  // Campos opcionales para compatibilidad
  name: 'Player1_Pro',
  email: 'pro_player@email.com',
  avatar: 'https://placehold.co/100x100.png',
  level: 72,
  rank: 'Conquistador',
  countryCode: 'MX',
  gameId: '123456789',
  role: 'Jugador',
  location: { lat: 19.4326, lon: -99.1332 },
  favoriteWeapons: ['M416', 'Kar98k'],
  playSchedule: 'Noches (20:00 - 00:00)',
  favoriteMap: 'erangel'
};

export const mapOptions = [
    { value: "erangel", label: "Erangel" },
    { value: "miramar", label: "Miramar" },
    { value: "sanhok", label: "Sanhok" },
    { value: "vikendi", label: "Vikendi" },
    { value: "livik", label: "Livik" },
    { value: "rondo", label: "Rondo" },
];

export const countryFlags: { [key: string]: string } = {
  US: '🇺🇸', CA: '🇨🇦', MX: '🇲🇽',
  GT: '🇬🇹', BZ: '🇧🇿', SV: '🇸🇻', HN: '🇭🇳', NI: '🇳🇮', CR: '🇨🇷', PA: '🇵🇦',
  CU: '🇨🇺', DO: '🇩🇴', PR: '🇵🇷', JM: '🇯🇲', HT: '🇭🇹', BS: '🇧🇸',
  CO: '🇨🇴', VE: '🇻🇪', GY: '🇬🇾', SR: '🇸🇷', EC: '🇪🇨', PE: '🇵🇪', BR: '🇧🇷',
  BO: '🇧🇴', PY: '🇵🇾', CL: '🇨🇱', AR: '🇦🇷', UY: '🇺🇾'
};

export const tournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Copa Verano 2024',
    date: '2024-08-15',
    prize: '$5,000',
    mode: 'Escuadra',
    status: 'Abierto',
    region: 'N.A.',
    type: 'Competitivo',
    startTime: '18:00',
    timeZone: 'MX',
    infoSendTime: '10',
    description: 'El torneo más grande del verano en Norteamérica. Formato de puntos estándar. Solo los mejores sobrevivirán.',
    maxTeams: 23,
    maps: ['Erangel', 'Miramar', 'Sanhok'],
    streamLink: 'https://twitch.tv/squadgo_battle',
    maxWithdrawalTime: '17:00',
    maxReserves: 5,
  },
  {
    id: 't2',
    name: 'Duelo de Titanes',
    date: '2024-08-20',
    prize: '$2,500',
    mode: 'Dúo',
    status: 'Abierto',
    region: 'S.A.',
    type: 'Competitivo',
    startTime: '20:00',
    timeZone: 'AR',
    infoSendTime: '7',
    description: 'Enfréntate en dúo contra los mejores de Sudamérica. Batalla campal hasta el final.',
    maxTeams: 23,
    maps: ['Erangel', 'Livik'],
    maxWithdrawalTime: '19:00',
    maxReserves: 10,
  },
  {
    id: 't3',
    name: 'PMGC Warm-up Scrims',
    date: '2024-09-01',
    prize: '$1,000,000',
    mode: 'Escuadra',
    status: 'Próximamente',
    region: 'N.A.',
    type: 'Scrim',
    description: 'Scrims de práctica para el PMGC. Solo equipos invitados.',
  },
    {
    id: 't4',
    name: 'Desafío de la Comunidad',
    date: '2024-07-30',
    prize: '$500',
    mode: 'Solo',
    status: 'Cerrado',
    region: 'S.A.',
    type: 'Por Puntos',
  },
];

// Variable global para la plantilla del mensaje del torneo
export const tournamentMessageTemplate = `
{{header}}
_Organizado por: {{organizerName}} 🥷_

🗓️ **Fecha:** {{date}}
⏰ **Comienza:** {{startTime}} hrs {{timeZoneFlag}}
{{infoSendText}}
{{maxWithdrawalText}}

🗺️ **Mapas:**
{{mapsList}}

👥 **Equipos Inscritos ({{registeredCount}}/{{maxSlots}}):**
{{slotsList}}
{{reserveText}}

{{streamLink}}

_Por favor, mantengan una comunicación respetuosa. ¡Mucha suerte a todos!_
`.trim();


// Function to add a new tournament to the list
export const addTournament = (tournament: Tournament) => {
    tournaments.unshift(tournament);
};

// Function to update an existing tournament
export const updateTournament = (id: string, updatedData: Partial<Tournament>) => {
    const tournamentIndex = tournaments.findIndex(t => t.id === id);
    if (tournamentIndex !== -1) {
        tournaments[tournamentIndex] = { ...tournaments[tournamentIndex], ...updatedData };
    }
};


export const recentChats: Chat[] = [
  {
    id: 'c1',
    name: 'AlphaSquad',
    avatarUrl: 'https://placehold.co/40x40/1E90FF/FFFFFF.png',
    unread: true,
    lastMessageTimestamp: '20:15',
    messages: [
        { sender: 'other', text: '¿Listos para el torneo de mañana?', content: '¿Listos para el torneo de mañana?' },
        { sender: 'me', text: '¡Más que listos! Estuve practicando toda la tarde.', content: '¡Más que listos! Estuve practicando toda la tarde.' },
        { sender: 'other', text: 'Perfecto, nos vemos a las 8pm para calentar.', content: 'Perfecto, nos vemos a las 8pm para calentar.' },
    ]
  },
  {
    id: 'c2',
    name: 'Ninja_Dude',
    avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
    unread: true,
    lastMessageTimestamp: '18:42',
     messages: [
        { sender: 'other', text: '¡Buena partida la de antes!', content: '¡Buena partida la de antes!' },
        { sender: 'me', text: '¡Igualmente! Ese último squad casi nos complica.', content: '¡Igualmente! Ese último squad casi nos complica.' },
        { sender: 'other', text: 'Pero los dominamos. 🔥 ¿Jugamos otra más tarde?', content: 'Pero los dominamos. 🔥 ¿Jugamos otra más tarde?' },
    ]
  },
  {
    id: 'c3',
    name: 'ShadowStriker',
    avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
    unread: false,
    lastMessageTimestamp: 'Ayer',
     messages: [
        { sender: 'other', text: 'Te envié una solicitud de amistad.', content: 'Te envié una solicitud de amistad.' },
    ]
  },
  {
    id: 'c4',
    name: 'Phoenix_Queen',
    avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
    unread: false,
    lastMessageTimestamp: 'Ayer',
     messages: [
        { sender: 'other', text: 'Necesitamos un cuarto para la práctica de esta noche, ¿te unes?', content: 'Necesitamos un cuarto para la práctica de esta noche, ¿te unes?' },
        { sender: 'me', text: 'Claro, ¿a qué hora?', content: 'Claro, ¿a qué hora?' },
    ]
  },
];

// Función para añadir un chat nuevo (simulación)
export const addChat = (newChat: Chat) => {
    // Evita añadir un chat duplicado
    if (!recentChats.some(chat => chat.name === newChat.name)) {
        recentChats.unshift(newChat);
    }
};


const baseFriends: PlayerProfile[] = [
    {
      id: 'p1',
      // Campos requeridos
      displayName: 'Player1_Pro',
      username: 'player1_pro',
      avatarUrl: 'https://placehold.co/100x100.png',
      bio: 'Busco dúo para llegar a Conquistador. Activo principalmente por las noches.',
      region: 'MX',
      language: 'es',
      mic: true,
      roles: ['Asaltante'],
      rankTier: 'Conquistador',
      stats: { kda: 4.8, wins: 124, matches: 200 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'Player1_Pro',
      email: 'player1@example.com',
      rank: 'Conquistador',
      level: 45,
      countryCode: 'MX',
      role: 'Jugador',
      favoriteWeapons: ['M416', 'Kar98k'],
      playSchedule: 'Noches (20:00 - 00:00)',
      favoriteMap: 'erangel',
      location: { lat: 19.4326, lon: -99.1332 },
    },
    {
      id: 'c2',
      // Campos requeridos
      displayName: 'Ninja_Dude',
      username: 'ninja_dude',
      avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
      bio: 'Jugador agresivo, amante de Sanhok. Busco gente para rushear sin miedo.',
      region: 'CO',
      language: 'es',
      mic: true,
      roles: ['Asaltante'],
      rankTier: 'As Dominador',
      stats: { kda: 4.2, wins: 98, matches: 180 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'Ninja_Dude',
      email: 'ninja@example.com',
      rank: 'As Dominador',
      level: 42,
      countryCode: 'CO',
      role: 'Jugador',
      favoriteWeapons: ['AKM', 'SKS'],
      playSchedule: 'Fines de semana',
      favoriteMap: 'sanhok',
      location: { lat: 4.7110, lon: -74.0721 },
    },
    {
      id: 'c3',
      // Campos requeridos
      displayName: 'ShadowStriker',
      username: 'shadow_striker',
      avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
      bio: 'Francotirador paciente. Me gusta controlar zonas y jugar táctico en Miramar.',
      region: 'US',
      language: 'en',
      mic: true,
      roles: ['Francotirador'],
      rankTier: 'As',
      stats: { kda: 3.5, wins: 75, matches: 150 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'ShadowStriker',
      email: 'shadow@example.com',
      rank: 'As',
      level: 38,
      countryCode: 'US',
      role: 'Jugador',
      favoriteWeapons: ['UMP45', 'M24'],
      playSchedule: 'Tardes (16:00 - 19:00)',
      favoriteMap: 'miramar',
      location: { lat: 34.0522, lon: -118.2437 },
    },
    {
      id: 'c4',
      // Campos requeridos
      displayName: 'Phoenix_Queen',
      username: 'phoenix_queen',
      avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
      bio: 'Juego por diversión pero me gusta ganar. Abierta a cualquier modo de juego.',
      region: 'BR',
      language: 'pt',
      mic: true,
      roles: ['Soporte'],
      rankTier: 'Corona I',
      stats: { kda: 3.1, wins: 60, matches: 120 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'Phoenix_Queen',
      email: 'phoenix@example.com',
      rank: 'Corona I',
      level: 35,
      countryCode: 'BR',
      role: 'Jugador',
      favoriteWeapons: ['DP-28', 'Vector'],
      playSchedule: 'Variable',
      favoriteMap: 'erangel',
      location: { lat: -23.5505, lon: -46.6333 },
    },
    {
      id: 'f1',
      // Campos requeridos
      displayName: 'GamerX_Treme',
      username: 'gamerx_treme',
      avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png',
      bio: 'Mejorando cada día. Busco gente para subir de rango juntos.',
      region: 'CA',
      language: 'en',
      mic: true,
      roles: ['Asaltante'],
      rankTier: 'Platino II',
      stats: { kda: 2.5, wins: 30, matches: 80 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'GamerX_Treme',
      email: 'gamerx@example.com',
      rank: 'Platino II',
      level: 28,
      countryCode: 'CA',
      role: 'Jugador',
      favoriteWeapons: ['SCAR-L', 'UMP45'],
      playSchedule: 'Noches',
      favoriteMap: 'sanhok',
      location: { lat: 45.4215, lon: -75.6972 }
    },
    {
      id: 'f2',
      // Campos requeridos
      displayName: 'ProSlayer_99',
      username: 'proslayer_99',
      avatarUrl: 'https://placehold.co/40x40/4682B4/FFFFFF.png',
      bio: 'Conductor experto y buen support. ¡Vamos por esos Chicken Dinners!',
      region: 'AR',
      language: 'es',
      mic: true,
      roles: ['Soporte'],
      rankTier: 'Diamante V',
      stats: { kda: 2.9, wins: 55, matches: 110 },
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionales
      name: 'ProSlayer_99',
      email: 'proslayer@example.com',
      rank: 'Diamante V',
      level: 32,
      countryCode: 'AR',
      role: 'Jugador',
      favoriteWeapons: ['M762', 'Mini14'],
      playSchedule: 'Fines de semana',
      favoriteMap: 'miramar',
      location: { lat: -34.6037, lon: -58.3816 }
    }
];


export const friendsForComparison: UserWithRole[] = baseFriends.map((friend) => {
    let role: 'Jugador' | 'Creador' | 'Admin' = 'Jugador';
    if (friend.id === 'p1') role = 'Admin';
    if (['c2', 'c3'].includes(friend.id)) role = 'Creador';
    
    // Transform PlayerProfile to PlayerProfileInput format
    return {
        id: friend.id,
        name: friend.name || friend.displayName || '',
        avatarUrl: friend.avatarUrl || '',
        rank: friend.rank || friend.rankTier || '',
        stats: {
            wins: friend.stats.wins || 0,
            kills: Math.round((friend.stats.kda || 0) * (friend.stats.matches || 0) * 0.3) || 0,
            kdRatio: friend.stats.kda || 0
        },
        favoriteWeapons: friend.favoriteWeapons || [],
        playSchedule: friend.playSchedule || '',
        // Optional fields from PlayerProfileInput
        kdRatio: friend.stats.kda,
        favoriteMap: friend.favoriteMap || 'erangel',
        bio: friend.bio || '',
        countryCode: friend.countryCode || 'US',
        location: friend.location || { lat: 0, lon: 0 },
        email: friend.email || '',
        level: friend.level || 1,
        role: role,
        fcmToken: undefined,
        nickname: friend.displayName || '',
        username: friend.username || '',
        gameId: undefined,
        currentServer: undefined,
        gender: undefined,
        age: undefined
    };
});

export const initialUsers: UserWithRole[] = friendsForComparison;


export const registeredTeams: Team[] = [
  {
    id: 'team1',
    name: 'Los Invencibles',
    players: [
      { id: 'f1', name: 'GamerX_Treme', avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png' },
      { id: 'f2', name: 'ProSlayer_99', avatarUrl: 'https://placehold.co/40x40/4682B4/FFFFFF.png' },
    ]
  },
  {
    id: 'team2',
    name: 'Escuadrón Fénix',
    players: [
      { id: 'c4', name: 'Phoenix_Queen', avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png' },
      { id: 'c3', name: 'ShadowStriker', avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png' },
    ]
  }
];

export const reserveTeams: Team[] = [
    {
        id: 'team3',
        name: 'Los Reservistas',
        players: [{id: 'p-res-1', name: 'Reserva1', avatarUrl: 'https://placehold.co/40x40.png'}]
    }
];

// Datos de ejemplo para simular qué inscripciones están aprobadas para el usuario actual.
export let myApprovedRegistrations: ApprovedRegistration[] = [
  // { userId: 'p1', tournamentId: 't2', status: 'approved' },
];

export const addApprovedRegistration = (reg: ApprovedRegistration) => {
    if (!myApprovedRegistrations.some(r => r.userId === reg.userId && r.tournamentId === reg.tournamentId)) {
        myApprovedRegistrations.push(reg);
    }
}
export const removeApprovedRegistration = (tournamentId: string, userId: string = playerProfile.id) => {
    myApprovedRegistrations = myApprovedRegistrations.filter(r => !(r.userId === userId && r.tournamentId === tournamentId));
}

export const teamMates = friendsForComparison.filter(f => f.id !== 'p1');

export const initialRegistrationRequests: RegistrationRequest[] = [
  {
    id: 'req1',
    teamName: 'Dream Team',
    teamTag: 'DT',
    countryCode: 'MX',
    tournamentId: 't2',
    tournamentName: 'Duelo de Titanes',
    status: 'Pendiente',
    players: [
        { id: 'p1', name: 'Player1_Pro', avatarUrl: 'https://placehold.co/100x100.png'},
    ]
  }
];

export const newsArticles: NewsArticle[] = [
  {
    id: 'news1',
    title: 'Nueva Actualización 3.4: Modo Dinosaurio',
    summary: 'La última actualización trae un nuevo y emocionante modo de juego con dinosaurios. ¡Descubre todos los detalles y prepárate para la batalla prehistórica!',
    date: '2024-07-28',
    imageUrl: 'https://placehold.co/1200x400.png',
    category: 'Actualizaciones',
  },
  {
    id: 'news2',
    title: 'Finales de la PMGC: ¡No te lo pierdas!',
    summary: 'Los mejores equipos del mundo compiten por el título de campeón mundial. Sigue la transmisión en vivo este fin de semana.',
    date: '2024-07-27',
    imageUrl: 'https://placehold.co/1200x400.png',
    category: 'eSports',
  },
  {
    id: 'news3',
    title: 'Guía Completa del Mapa Rondo',
    summary: 'Domina cada rincón del nuevo mapa Rondo con nuestra guía completa. Descubre los mejores lugares para aterrizar, lootear y asegurar la victoria.',
    date: '2024-07-26',
    imageUrl: 'https://placehold.co/1200x400.png',
    category: 'Guías',
  }
];


export const feedPosts: FeedPost[] = [
  {
    id: 'post1',
    author: baseFriends.find(f => f.id === 'c2')!,
    timestamp: 'Hace 15 minutos',
    content: '¡Qué locura la nueva actualización! El modo de juego es increíble. ¿Alguien para probarlo?',
    likes: 12,
    comments: 3,
    shares: 2,
    commentsList: [],
    likedBy: [],
    sharedBy: [],
    interactions: []
  },
  {
    id: 'post2',
    author: baseFriends.find(f => f.id === 'c4')!,
    timestamp: 'Hace 1 hora',
    content: 'Buscando un cuarto miembro para nuestro squad para el torneo de la "Copa Verano 2024". Requisito: Rango Diamante o superior. ¡MD si te interesa!',
    imageUrl: 'https://placehold.co/800x400.png',
    likes: 25,
    comments: 8,
    shares: 5,
    commentsList: [],
    likedBy: [],
    sharedBy: [],
    interactions: []
  },
  {
    id: 'post3',
    author: baseFriends.find(f => f.id === 'c3')!,
    timestamp: 'Hace 3 horas',
    content: 'Finalmente llegué a As Dominador esta temporada. ¡El esfuerzo valió la pena! Gracias a mi dúo por el apoyo. 💪',
    likes: 42,
    comments: 11,
    shares: 8,
    commentsList: [],
    likedBy: [],
    sharedBy: [],
    interactions: []
  }
];


// Helper functions to simulate registration state persistence (using localStorage)
export const getRegistrationStatus = (tournamentId: string, userId: string = playerProfile.id) => {
  if (typeof window === 'undefined') return 'not_registered';
  const status = window.localStorage.getItem(`tourney_reg_${tournamentId}_${userId}`);
  return (status || 'not_registered') as 'not_registered' | 'pending' | 'approved' | 'rejected' | 'reserve';
}

export const updateRegistrationStatus = (tournamentId: string, status: 'not_registered' | 'pending' | 'approved' | 'rejected' | 'reserve', userId: string = playerProfile.id) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`tourney_reg_${tournamentId}_${userId}`, status);
  // Dispatch a storage event to notify other tabs (like the admin tab)
  window.dispatchEvent(new Event('storage'));
}

export const rechargeProviders: RechargeProvider[] = [
    {
        name: "Midasbuy",
        description: "Plataforma oficial para recargas de UC en juegos populares. Segura y con bonificaciones frecuentes.",
        url: "https://www.midasbuy.com/", 
        logoUrl: "https://placehold.co/100x40/000000/FFFFFF.png"
    },
    {
        name: "Eneba",
        description: "Marketplace de claves de juegos y tarjetas de regalo donde a menudo se encuentran descuentos para UC.",
        url: "https://www.eneba.com/", 
        logoUrl: "https://placehold.co/100x40/3c3c3c/FFFFFF.png"
    }
];

export const developers: Developer[] = [
    { id: 'dev-01', name: 'Alice', status: 'Activo', apiKey: 'a1b2c3d4-e5f6-g7h8' },
    { id: 'dev-02', name: 'Bob', status: 'Inactivo', apiKey: 'i9j0k1l2-m3n4-o5p6' },
];

// Planes de suscripción
export const subscriptionPlans = [
    {
        id: 'plan-basic',
        name: 'Creador Básico',
        description: 'Ideal para empezar tu carrera como creador de contenido',
        price: 9.99,
        duration: 30, // 30 días
        features: [
            'Creación de torneos ilimitados',
            'Publicar hasta 3 servicios',
            'Gestión básica de equipos',
            'Chat grupal en torneos',
            'Estadísticas básicas',
            'Soporte por email',
            'Badge de "Creador Verificado"'
        ],
        isActive: true
    },
    {
        id: 'plan-premium',
        name: 'Creador Pro',
        description: 'Para creadores profesionales que buscan maximizar su alcance',
        price: 19.99,
        duration: 30, // 30 días
        features: [
            'Todo lo del Plan Básico',
            'Servicios ilimitados',
            'Personalización avanzada de torneos',
            'Analytics detallados y métricas',
            'Streaming integrado',
            'Herramientas de marketing',
            'Soporte prioritario 24/7',
            'Comisiones reducidas en servicios',
            'Promoción destacada en la plataforma'
        ],
        isActive: true
    }
];

export const services: Service[] = [
    {
        id: 's1',
        creatorId: 'c2',
        creatorName: 'Ninja_Dude',
        avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
        uid: '5123456789',
        serviceTitle: 'Coaching de Puntería y Estrategia',
        description: 'Sesiones personalizadas para mejorar tu KD, control de retroceso y toma de decisiones. Analizo tus partidas y te doy feedback para subir de rango.',
        price: 25.00,
        voluntaryOptions: [],
        rating: 4.9,
        reviews: 28,
        isVerified: true,
        isFeatured: true,
    },
    {
        id: 's2',
        creatorId: 'c3',
        creatorName: 'ShadowStriker',
        avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
        uid: '5987654321',
        serviceTitle: 'Compañero Profesional para Dúos',
        description: '¿Cansado de jugar con randoms? Te acompaño en tus partidas de ranking para asegurar victorias y subir puntos. Paciencia y buena comunicación garantizadas.',
        price: 0,
        voluntaryOptions: ['Intercambio de Popularidad', 'Agregar como Amigo'],
        rating: 5.0,
        reviews: 42,
        isVerified: true,
        isFeatured: false,
    },
     {
        id: 's3',
        creatorId: 'c4',
        creatorName: 'Phoenix_Queen',
        avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
        uid: '5246813579',
        serviceTitle: 'Análisis de Partidas de Torneo',
        description: 'Reviso las grabaciones de tus partidas de scrims o torneos y te entrego un informe detallado sobre rotaciones, posicionamiento y errores a corregir.',
        price: 50.00,
        voluntaryOptions: [],
        rating: 4.8,
        reviews: 15,
        isVerified: false,
        isFeatured: false,
    },
     {
        id: 's4',
        creatorId: 'f1',
        creatorName: 'GamerX_Treme',
        avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png',
        uid: '5369124875',
        serviceTitle: 'IGL para tu Squad',
        description: 'Lidero a tu equipo en partidas de ranking. Me encargo de las calls, rotaciones y estrategia para que ustedes solo se preocupen por disparar.',
        price: 0,
        voluntaryOptions: ['Intercambio de Popularidad', 'Regalos UC'],
        rating: 5.0,
        reviews: 31,
        isVerified: true,
        isFeatured: false,
    },
];

export const creators = friendsForComparison.filter(f => f.role === 'Creador' || f.role === 'Admin').map(f => ({ id: f.id, name: f.name }));
    
// Finance data
export const adminBankAccounts: BankAccount[] = [
    { id: 'ba1', type: 'bank', bankName: 'Banco Regional', accountNumber: '...1234', holderName: 'SquadGO Corp', country: 'US' },
  { id: 'ba2', type: 'bank', bankName: 'Metro Bank', accountNumber: '...5678', holderName: 'SquadGO Corp', country: 'US' },
  { id: 'ba3', type: 'paypal', email: 'pagos@squadgo.com', holderName: 'SquadGO Corp' },
];

export const creatorBankAccounts: BankAccount[] = [
    { id: 'cba1', type: 'bank', bankName: 'Mi Banco Local', accountNumber: '...9876', holderName: playerProfile.name || 'Usuario', country: 'MX' },
    { id: 'cba2', type: 'paypal', email: playerProfile.email || 'usuario@example.com', holderName: playerProfile.name || 'Usuario' },
];


export const initialTransactions: Transaction[] = [
    { id: 'txn1', date: '2024-07-28', description: 'Suscripción Creador Pro - Ninja_Dude', amount: 4.99, type: 'Ingreso' },
    { id: 'txn2', date: '2024-07-27', description: 'Suscripción Creador Pro - ShadowStriker', amount: 4.99, type: 'Ingreso' },
    { id: 'txn3', date: '2024-07-25', description: 'Suscripción Creador Básico - Phoenix_Queen', amount: 2.99, type: 'Ingreso' },
];

// Sistema de Match - Datos simulados
export const connectionRequests: ConnectionRequest[] = [
    {
        id: 'req1',
        fromUserId: 'c2',
        toUserId: 'p1',
        fromUser: baseFriends.find(f => f.id === 'c2')!,
        toUser: playerProfile,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        message: '¡Hola! Me gustaría hacer match contigo para jugar algunas partidas.'
    },
    {
        id: 'req2',
        fromUserId: 'p1',
        toUserId: 'c3',
        fromUser: playerProfile,
        toUser: baseFriends.find(f => f.id === 'c3')!,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        message: 'Tu perfil me parece interesante, ¿hacemos match?'
    }
];

export const matches: Match[] = [
    {
        id: 'match1',
        user1Id: 'p1',
        user2Id: 'c4',
        user1: playerProfile,
        user2: baseFriends.find(f => f.id === 'c4')!,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
        chatId: 'c4',
        isActive: true
    }
];

// Funciones para manejar el sistema de match
export const sendConnectionRequest = (fromUserId: string, toUserId: string, message?: string) => {
    const fromUser = fromUserId === playerProfile.id ? playerProfile : baseFriends.find(f => f.id === fromUserId);
    const toUser = toUserId === playerProfile.id ? playerProfile : baseFriends.find(f => f.id === toUserId);
    
    if (!fromUser || !toUser) return { type: 'error', error: 'Usuario no encontrado' };
    
    // Verificar si ya existe una solicitud
    const existingRequest = connectionRequests.find(req => 
        (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
        (req.fromUserId === toUserId && req.toUserId === fromUserId)
    );
    
    if (existingRequest) {
        return { type: 'already_exists', error: 'Ya existe una solicitud de conexión' };
    }
    
    // Verificar si ya hay un match
    const existingMatch = matches.find(match => 
        (match.user1Id === fromUserId && match.user2Id === toUserId) ||
        (match.user1Id === toUserId && match.user2Id === fromUserId)
    );
    
    if (existingMatch) {
        return { type: 'already_matched', error: 'Ya tienes match con este usuario' };
    }
    
    // Verificar si el otro usuario ya envió una solicitud (match mutuo)
    const mutualRequest = connectionRequests.find(req => 
        req.fromUserId === toUserId && 
        req.toUserId === fromUserId &&
        req.status === 'pending'
    );
    
    if (mutualRequest) {
        // ¡Match! Ambos usuarios se han enviado solicitudes
        const newMatch: Match = {
            id: `match_${Date.now()}`,
            user1Id: fromUserId,
            user2Id: toUserId,
            user1: fromUser,
            user2: toUser,
            createdAt: new Date(),
            isActive: true
        };
        
        matches.push(newMatch);
        
        // Marcar la solicitud existente como aceptada
        mutualRequest.status = 'accepted';
        
        // Crear chat
        const chatId = `chat_${Date.now()}`;
        newMatch.chatId = chatId;
        
        addChat({
            id: chatId,
            name: toUser.displayName || toUser.name || 'Usuario',
            avatarUrl: toUser.avatarUrl,
            unread: true,
            lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [{
                sender: 'system',
                text: '¡Hicieron match! Ahora pueden chatear y jugar juntos.',
                content: '¡Hicieron match! Ahora pueden chatear y jugar juntos.'
            }]
        });
        
        return { type: 'match', match: newMatch };
    }
    
    // Solo enviar solicitud
    const newRequest: ConnectionRequest = {
        id: `req_${Date.now()}`,
        fromUserId,
        toUserId,
        fromUser,
        toUser,
        status: 'pending',
        createdAt: new Date(),
        message
    };
    
    connectionRequests.push(newRequest);
    return { type: 'request_sent', request: newRequest };
};

export const acceptConnectionRequest = (requestId: string) => {
    const request = connectionRequests.find(req => req.id === requestId);
    if (!request) return { success: false, error: 'Solicitud no encontrada' };
    
    // Verificar si el otro usuario también ha enviado una solicitud (match mutuo)
    const mutualRequest = connectionRequests.find(req => 
        req.fromUserId === request.toUserId && 
        req.toUserId === request.fromUserId &&
        req.status === 'pending'
    );
    
    if (mutualRequest) {
        // ¡Match! Ambos usuarios se han enviado solicitudes
        const newMatch: Match = {
            id: `match_${Date.now()}`,
            user1Id: request.fromUserId,
            user2Id: request.toUserId,
            user1: request.fromUser,
            user2: request.toUser,
            createdAt: new Date(),
            isActive: true
        };
        
        matches.push(newMatch);
        
        // Marcar ambas solicitudes como aceptadas
        request.status = 'accepted';
        mutualRequest.status = 'accepted';
        
        // Crear chat
        const chatId = `chat_${Date.now()}`;
        newMatch.chatId = chatId;
        
        addChat({
            id: chatId,
            name: request.fromUser.displayName || request.fromUser.name || 'Usuario',
            avatarUrl: request.fromUser.avatarUrl,
            unread: true,
            lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [{
                sender: 'system',
                text: '¡Hicieron match! Ahora pueden chatear y jugar juntos.',
                content: '¡Hicieron match! Ahora pueden chatear y jugar juntos.'
            }]
        });
        
        return { success: true, match: newMatch, isMatch: true };
    } else {
        // Solo aceptar la solicitud, esperar la del otro usuario
        request.status = 'accepted';
        return { success: true, isMatch: false };
    }
};

export const rejectConnectionRequest = (requestId: string) => {
    const request = connectionRequests.find(req => req.id === requestId);
    if (!request) return { success: false, error: 'Solicitud no encontrada' };
    
    request.status = 'rejected';
    return { success: true };
};

export const getConnectionStatus = (userId: string, targetUserId: string): ConnectionStatusResult => {
    const sentRequest = connectionRequests.find(req => 
        req.fromUserId === userId && req.toUserId === targetUserId
    );
    
    const existingMatch = matches.find(match => 
        (match.user1Id === userId && match.user2Id === targetUserId) ||
        (match.user1Id === targetUserId && match.user2Id === userId)
    );
    
    return {
        userId,
        targetUserId,
        hasRequested: !!sentRequest,
        hasMatch: !!existingMatch,
        matchId: existingMatch?.id
    };
};

export const getPendingConnectionRequests = (userId: string) => {
    return connectionRequests.filter(req => 
        req.toUserId === userId && req.status === 'pending'
    );
};

export const getUserMatches = (userId: string) => {
    return matches.filter(match => 
        (match.user1Id === userId || match.user2Id === userId) && match.isActive
    );
};
