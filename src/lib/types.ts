
import type { PlayerProfileInput as PlayerProfileInputSchema } from '@/ai/schemas';

export type PlayerProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  level: number;
  rank: string;
  countryCode: string;
  stats: {
    wins: number;
    kills: number;
    kdRatio: number;
  };
  role: 'Jugador' | 'Creador' | 'Admin';
};

// Re-exporting this type for use in data.ts without circular dependency issues with AI schemas.
export type PlayerProfileInput = PlayerProfileInputSchema & { 
  favoriteMap: string;
  bio: string;
  countryCode: string;
};

export type UserWithRole = PlayerProfileInput & {
    favoriteMap: string;
    bio: string;
    role: 'Jugador' | 'Creador' | 'Admin';
};


export type Tournament = {
  id: string;
  name: string;
  date: string;
  prize: string;
  mode: 'Solo' | 'Dúo' | 'Escuadra';
  status: 'Abierto' | 'Cerrado' | 'Próximamente';
  region: 'N.A.' | 'S.A.';
  type: 'Competitivo' | 'Por Puntos' | 'Evento WOW' | 'Amistoso' | 'Scrim';
  description?: string;
  startTime?: string;
  timeZone?: string;
  infoSendTime?: string;
  maxTeams?: number;
  maps?: string[];
  streamLink?: string;
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
  lastMessageTimestamp?: string;
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
    teamTag: string;
    countryCode: string;
    tournamentId: string;
    tournamentName: string;
    players: Player[];
    status: 'Pendiente' | 'Aprobado' | 'Rechazado';
};

export type ApprovedRegistration = {
  userId: string;
  tournamentId: string;
  status: 'approved';
}

export type Comment = {
  author: string;
  text: string;
}

export type FeedPost = {
    id: string;
    author: PlayerProfileInput;
    timestamp: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
    commentsList: Comment[];
    liked?: boolean;
}

export type RechargeProvider = {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
};

export type Developer = {
    id: string;
    name: string;
    status: 'Activo' | 'Inactivo';
    apiKey: string;
};

export type Service = {
  id: string;
  creatorId: string;
  creatorName: string;
  avatarUrl?: string;
  uid: string;
  serviceTitle: string;
  description: string;
  price: number;
  voluntaryOptions: string[];
  rating: number;
  reviews: number;
  isVerified: boolean;
  isFeatured: boolean;
};

export type BankAccount = {
    id: string;
    bankName: string;
    accountNumber: string;
}

export type Transaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'Ingreso' | 'Retiro';
}
