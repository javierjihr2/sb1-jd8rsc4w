

import type { PlayerProfile, Tournament, Chat, NewsArticle, Team, RegistrationRequest, FeedPost, RechargeProvider } from './types';
import type { PlayerProfileInput } from '@/ai/schemas';

export const playerProfile: PlayerProfile = {
  id: 'u1',
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
  isAdmin: true,
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
  },
  {
    id: 't2',
    name: 'Duelo de Titanes',
    date: '2024-08-20',
    prize: '$2,500',
    mode: 'Dúo',
    status: 'Abierto',
    region: 'S.A.',
  },
  {
    id: 't3',
    name: 'PUBG Mobile Global Championship',
    date: '2024-09-01',
    prize: '$1,000,000',
    mode: 'Escuadra',
    status: 'Próximamente',
    region: 'N.A.',
  },
    {
    id: 't4',
    name: 'Desafío de la Comunidad',
    date: '2024-07-30',
    prize: '$500',
    mode: 'Solo',
    status: 'Cerrado',
    region: 'S.A.',
  },
];

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


export const newsArticles: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Actualización de Versión 3.3',
    summary: 'La nueva actualización trae consigo un nuevo modo de juego, mejoras en el mapa Erangel y nuevas skins de armas. ¡Descubre todo lo nuevo!',
    date: '2024-07-28',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Actualizaciones',
  },
  {
    id: 'n2',
    title: 'Colaboración con Súper-Deportivo',
    summary: '¡Velocidad y adrenalina! Descubre los nuevos vehículos y skins de la colaboración exclusiva que llega a los campos de batalla.',
    date: '2024-07-25',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Eventos',
  },
  {
    id: 'n3',
    title: 'Guía del PMGC 2024',
    summary: 'No te pierdas ni un detalle del torneo más grande del año. Conoce los equipos, horarios y cómo ver las partidas en vivo.',
    date: '2024-07-22',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'eSports',
  },
   {
    id: 'n4',
    title: 'Nuevo Pase Royale A5',
    summary: 'El nuevo Pase Royale trae recompensas exclusivas, trajes míticos y un nuevo personaje. ¡Completa las misiones y súbelo al máximo!',
    date: '2024-07-20',
    imageUrl: 'https://placehold.co/600x400.png',
    category: 'Actualizaciones',
  },
];

export const friendsForComparison: (PlayerProfileInput & { favoriteMap: string, bio: string })[] = [
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
      bio: 'Busco dúo para llegar a Conquistador. Activo principalmente por las noches.'
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
      bio: 'Jugador agresivo, amante de Sanhok. Busco gente para rushear sin miedo.'
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
      bio: 'Francotirador paciente. Me gusta controlar zonas y jugar táctico en Miramar.'
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
      bio: 'Juego por diversión pero me gusta ganar. Abierta a cualquier modo de juego.'
    },
     { id: 'f1', name: 'GamerX_Treme', avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png', rank: 'Platino II', countryCode: 'CA', stats: { wins: 30, kills: 600, kdRatio: 2.5 }, favoriteWeapons: ['SCAR-L', 'UMP45'], playSchedule: 'Noches', favoriteMap: 'sanhok', bio: 'Mejorando cada día. Busco gente para subir de rango juntos.'},
     { id: 'f2', name: 'ProSlayer_99', avatarUrl: 'https://placehold.co/40x40/4682B4/FFFFFF.png', rank: 'Diamante V', countryCode: 'AR', stats: { wins: 55, kills: 1100, kdRatio: 2.9 }, favoriteWeapons: ['M762', 'Mini14'], playSchedule: 'Fines de semana', favoriteMap: 'miramar', bio: 'Conductor experto y buen support. ¡Vamos por esos Chicken Dinners!'},
];

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

export const teamMates = friendsForComparison.filter(f => f.id !== 'p1');

export const initialRegistrationRequests: RegistrationRequest[] = [
  {
    id: 'req1',
    teamName: 'Dream Team',
    tournamentId: 't2',
    tournamentName: 'Duelo de Titanes',
    status: 'Pendiente',
    players: [
        { id: 'p1', name: 'Player1_Pro', avatarUrl: 'https://placehold.co/100x100.png'},
        { id: 'c2', name: 'Ninja_Dude', avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png'},
    ]
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
export const getRegistrationStatus = (tournamentId: string) => {
  if (typeof window === 'undefined') return 'not_registered';
  const status = window.localStorage.getItem(`tourney_reg_${tournamentId}`);
  return (status || 'not_registered') as 'not_registered' | 'pending' | 'approved' | 'rejected';
}

export const updateRegistrationStatus = (tournamentId: string, status: 'not_registered' | 'pending' | 'approved' | 'rejected') => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`tourney_reg_${tournamentId}`, status);
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
