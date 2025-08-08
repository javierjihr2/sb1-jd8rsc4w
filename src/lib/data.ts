import type { PlayerProfile, Tournament, Chat, NewsArticle } from './types';

export const playerProfile: PlayerProfile = {
  id: 'u1',
  name: 'Player1_Pro',
  email: 'pro_player@email.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  level: 72,
  rank: 'Conquistador',
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
    message: '¿Listos para el torneo de mañana?',
    avatarUrl: 'https://placehold.co/40x40/1E90FF/FFFFFF.png',
    unread: true,
  },
  {
    id: 'c2',
    name: 'Ninja_Dude',
    message: '¡Buena partida!',
    avatarUrl: 'https://placehold.co/40x40/32CD32/FFFFFF.png',
    unread: true,
  },
  {
    id: 'c3',
    name: 'ShadowStriker',
    message: 'Te envié una solicitud de amistad.',
    avatarUrl: 'https://placehold.co/40x40/8A2BE2/FFFFFF.png',
    unread: false,
  },
  {
    id: 'c4',
    name: 'Phoenix_Queen',
    message: 'Necesitamos un cuarto para la práctica.',
    avatarUrl: 'https://placehold.co/40x40/FF4500/FFFFFF.png',
    unread: false,
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
];
