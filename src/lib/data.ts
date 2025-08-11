

import type { PlayerProfile, Tournament, Chat, NewsArticle, Team, RegistrationRequest, FeedPost, RechargeProvider, Developer, Service, UserWithRole, BankAccount, Transaction, ApprovedRegistration } from './types';
import type { PlayerProfileInput } from '@/ai/schemas';

export const playerProfile: PlayerProfile = {
  id: 'p1',
  name: 'Player1_Pro',
  email: 'pro_player@email.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  bio: 'Jugador profesional de PUBG Mobile, especialista en rifles de asalto y estratega de equipo. Buscando dúo para dominar en los torneos.',
  level: 72,
  rank: 'Conquistador',
  countryCode: 'MX',
  stats: {
    wins: 124,
    kills: 2345,
    kdRatio: 4.8,
  },
  role: 'Admin', // El admin también puede ser creador
  location: { lat: 19.4326, lon: -99.1332 }, // Mexico City
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

export let tournaments: Tournament[] = [
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
    streamLink: 'https://twitch.tv/squadup_esports',
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
export let tournamentMessageTemplate = `
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
        { sender: 'other', text: '¿Listos para el torneo de mañana?' },
        { sender: 'me', text: '¡Más que listos! Estuve practicando toda la tarde.' },
        { sender: 'other', text: 'Perfecto, nos vemos a las 8pm para calentar.' },
    ]
  },
  {
    id: 'c2',
    name: 'Ninja_Dude',
    avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
    unread: true,
    lastMessageTimestamp: '18:42',
     messages: [
        { sender: 'other', text: '¡Buena partida la de antes!' },
        { sender: 'me', text: '¡Igualmente! Ese último squad casi nos complica.' },
        { sender: 'other', text: 'Pero los dominamos. 🔥 ¿Jugamos otra más tarde?' },
    ]
  },
  {
    id: 'c3',
    name: 'ShadowStriker',
    avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
    unread: false,
    lastMessageTimestamp: 'Ayer',
     messages: [
        { sender: 'other', text: 'Te envié una solicitud de amistad.' },
    ]
  },
  {
    id: 'c4',
    name: 'Phoenix_Queen',
    avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
    unread: false,
    lastMessageTimestamp: 'Ayer',
     messages: [
        { sender: 'other', text: 'Necesitamos un cuarto para la práctica de esta noche, ¿te unes?' },
        { sender: 'me', text: 'Claro, ¿a qué hora?' },
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


const baseFriends: (Omit<PlayerProfileInput, 'location'> & {location: {lat: number, lon: number}})[] = [
    {
      id: 'p1',
      name: 'Player1_Pro',
      avatarUrl: 'https://placehold.co/100x100.png',
      rank: 'Conquistador',
      countryCode: 'MX',
      stats: { wins: 124, kills: 2345, kdRatio: 4.8 },
      favoriteWeapons: ['M416', 'Kar98k'],
      playSchedule: 'Noches (20:00 - 00:00)',
      favoriteMap: 'erangel',
      bio: 'Busco dúo para llegar a Conquistador. Activo principalmente por las noches.',
      location: { lat: 19.4326, lon: -99.1332 }, // Mexico City
    },
    {
      id: 'c2',
      name: 'Ninja_Dude',
      avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
      rank: 'As Dominador',
      countryCode: 'CO',
      stats: { wins: 98, kills: 1890, kdRatio: 4.2 },
      favoriteWeapons: ['AKM', 'SKS'],
      playSchedule: 'Fines de semana',
      favoriteMap: 'sanhok',
      bio: 'Jugador agresivo, amante de Sanhok. Busco gente para rushear sin miedo.',
      location: { lat: 4.7110, lon: -74.0721 }, // Bogotá
    },
    {
      id: 'c3',
      name: 'ShadowStriker',
      avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
      rank: 'As',
      countryCode: 'US',
      stats: { wins: 75, kills: 1500, kdRatio: 3.5 },
      favoriteWeapons: ['UMP45', 'M24'],
      playSchedule: 'Tardes (16:00 - 19:00)',
      favoriteMap: 'miramar',
      bio: 'Francotirador paciente. Me gusta controlar zonas y jugar táctico en Miramar.',
      location: { lat: 34.0522, lon: -118.2437 }, // Los Angeles
    },
    {
      id: 'c4',
      name: 'Phoenix_Queen',
      avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
      rank: 'Corona I',
      countryCode: 'BR',
      stats: { wins: 60, kills: 1200, kdRatio: 3.1 },
      favoriteWeapons: ['DP-28', 'Vector'],
      playSchedule: 'Variable',
      favoriteMap: 'erangel',
      bio: 'Juego por diversión pero me gusta ganar. Abierta a cualquier modo de juego.',
      location: { lat: -23.5505, lon: -46.6333 }, // São Paulo
    },
     { id: 'f1', name: 'GamerX_Treme', avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png', rank: 'Platino II', countryCode: 'CA', stats: { wins: 30, kills: 600, kdRatio: 2.5 }, favoriteWeapons: ['SCAR-L', 'UMP45'], playSchedule: 'Noches', favoriteMap: 'sanhok', bio: 'Mejorando cada día. Busco gente para subir de rango juntos.', location: { lat: 45.4215, lon: -75.6972 } }, // Ottawa
     { id: 'f2', name: 'ProSlayer_99', avatarUrl: 'https://placehold.co/40x40/4682B4/FFFFFF.png', rank: 'Diamante V', countryCode: 'AR', stats: { wins: 55, kills: 1100, kdRatio: 2.9 }, favoriteWeapons: ['M762', 'Mini14'], playSchedule: 'Fines de semana', favoriteMap: 'miramar', bio: 'Conductor experto y buen support. ¡Vamos por esos Chicken Dinners!', location: { lat: -34.6037, lon: -58.3816 } }, // Buenos Aires
];


export const friendsForComparison: (PlayerProfileInput & { favoriteMap: string, bio: string, role: 'Jugador' | 'Creador' | 'Admin', location: { lat: number, lon: number } })[] = baseFriends.map((friend) => {
    let role: 'Jugador' | 'Creador' | 'Admin' = 'Jugador';
    if (friend.id === 'p1') role = 'Admin';
    if (['c2', 'c3'].includes(friend.id)) role = 'Creador';
    return { ...friend, role };
});

export const initialUsers: UserWithRole[] = friendsForComparison;


export let registeredTeams: Team[] = [
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

export let reserveTeams: Team[] = [
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
    author: friendsForComparison.find(f => f.id === 'c2')!,
    timestamp: 'Hace 15 minutos',
    content: '¡Qué locura la nueva actualización! El modo de juego es increíble. ¿Alguien para probarlo?',
    likes: 12,
    comments: 3,
    commentsList: [],
  },
  {
    id: 'post2',
    author: friendsForComparison.find(f => f.id === 'c4')!,
    timestamp: 'Hace 1 hora',
    content: 'Buscando un cuarto miembro para nuestro squad para el torneo de la "Copa Verano 2024". Requisito: Rango Diamante o superior. ¡MD si te interesa!',
    imageUrl: 'https://placehold.co/800x400.png',
    likes: 25,
    comments: 8,
    commentsList: [],
  },
  {
    id: 'post3',
    author: friendsForComparison.find(f => f.id === 'c3')!,
    timestamp: 'Hace 3 horas',
    content: 'Finalmente llegué a As Dominador esta temporada. ¡El esfuerzo valió la pena! Gracias a mi dúo por el apoyo. 💪',
    likes: 42,
    comments: 11,
    commentsList: [],
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
export let adminBankAccounts: BankAccount[] = [
    { id: 'ba1', bankName: 'Banco Regional', accountNumber: '...1234', holderName: 'SquadUp Corp', country: 'US' },
    { id: 'ba2', bankName: 'Metro Bank', accountNumber: '...5678', holderName: 'SquadUp Corp', country: 'US' },
    { id: 'ba3', bankName: 'Payoneer', accountNumber: 'admin@squadup.com', holderName: 'SquadUp Corp', country: 'US' },
];

export let creatorBankAccounts: BankAccount[] = [
    { id: 'cba1', bankName: 'Mi Banco Local', accountNumber: '...9876', holderName: playerProfile.name, country: 'MX' },
];


export const initialTransactions: Transaction[] = [
    { id: 'txn1', date: '2024-07-28', description: 'Suscripción Creador Pro - Ninja_Dude', amount: 4.99, type: 'Ingreso' },
    { id: 'txn2', date: '2024-07-27', description: 'Suscripción Creador Pro - ShadowStriker', amount: 4.99, type: 'Ingreso' },
    { id: 'txn3', date: '2024-07-25', description: 'Suscripción Creador Básico - Phoenix_Queen', amount: 2.99, type: 'Ingreso' },
];

