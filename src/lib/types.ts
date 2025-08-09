

import type { PlayerProfileInput as PlayerProfileInputSchema } from '@/ai/schemas';

export type PlayerProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  level: number;
  rank: string;
  stats: {
    wins: number;
    kills: number;
    kdRatio: number;
  };
  isAdmin?: boolean;
};

// Re-exporting this type for use in data.ts without circular dependency issues with AI schemas.
export type PlayerProfileInput = PlayerProfileInputSchema & { 
  favoriteMap: string;
  bio: string;
};


export type Tournament = {
  id: string;
  name: string;
  date: string;
  prize: string;
  mode: 'Solo' | 'Dúo' | 'Escuadra';
  status: 'Abierto' | 'Cerrado' | 'Próximamente';
  region: 'N.A.' | 'S.A.';
};

export type Message = {
    sender: 'me' | 'other';
    text: string;
    timestamp?: string;
};


export type Chat = {
  id: string;
  name: string;
  avatarUrl: string;
  unread: boolean;
  messages: Message[];
};

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  date: string;
  imageUrl: string;
  category: string;
};

export type Player = {
    id: string;
    name: string;
    avatarUrl: string;
};

export type Team = {
    id: string;
    name: string;
    players: Player[];
};

export type RegistrationRequest = {
    id: string;
    teamName: string;
    tournamentId: string;
    tournamentName: string;
    players: Player[];
    status: 'Pendiente' | 'Aprobado' | 'Rechazado';
};

export type FeedPost = {
    id: string;
    author: PlayerProfileInput;
    timestamp: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
}
