

import type { PlayerProfileInput as PlayerProfileInputSchema } from '@/ai/schemas';

export type PlayerProfile = {
  id: string;
  // Campos del nuevo modelo de datos
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  region: string;
  language: string;
  mic: boolean;
  roles: string[];
  rankTier: string;
  stats: {
    kda: number;
    wins: number;
    matches: number;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Campos adicionales para compatibilidad
  name?: string; // Alias para displayName
  email?: string;
  avatar?: string; // Alias para avatarUrl
  coverPhotoUrl?: string; // Foto de portada opcional
  level?: number;
  rank?: string; // Alias para rankTier
  countryCode?: string; // Alias para region
  role?: 'Jugador' | 'Creador' | 'Admin';
  location?: {
      lat: number;
      lon: number;
  };
  fcmToken?: string;
  // Campos del registro completo
  nickname?: string; // Nickname del juego
  gameId?: string; // ID del juego
  currentServer?: string; // Servidor actual
  gender?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir';
  age?: number; // Edad
  favoriteWeapons?: string[]; // Armas favoritas
  playSchedule?: string; // Horario de juego
  favoriteMap?: string; // Mapa favorito
  // Campos adicionales de stats para compatibilidad
  kills?: number;
  kdRatio?: number;
  
  // Configuraciones de privacidad
  privacySettings?: {
    [key: string]: boolean;
  };
  
  // Configuración biométrica
  biometricEnabled?: boolean;
  
  // Campos adicionales para configuraciones
  passwordUpdatedAt?: Date;
};

// Re-exporting this type for use in data.ts without circular dependency issues with AI schemas.
export type PlayerProfileInput = PlayerProfileInputSchema & { 
  favoriteMap: string;
  bio: string;
  countryCode: string;
  location: {
      lat: number;
      lon: number;
  };
  email: string;
  level: number;
  role: 'Jugador' | 'Creador' | 'Admin';
  fcmToken?: string;
  nickname?: string;
  username?: string;
  gameId?: string;
  currentServer?: string;
  gender?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir';
  age?: number;
};

export type UserWithRole = PlayerProfileInput;


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
  maxWithdrawalTime?: string;
  maxReserves?: number;
  messageTemplate?: string;
  // Controles de administrador
  matchId?: string;
  matchPassword?: string;
  server?: string;
  perspective?: string;
  adminNotes?: string;
  spectatorMode?: boolean;
  // Nuevos campos de base de datos
  creatorId?: string;
  creatorName?: string;
  registeredTeams?: number;
  isActive?: boolean;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Message = {
    id?: string;
    sender: string;
    text: string;
    timestamp?: Date;
    content?: string;
    type?: 'text' | 'image' | 'audio' | 'location' | 'voice';
    avatar?: string;
    isAdmin?: boolean;
    isSystemMessage?: boolean;
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
  content?: string; // Contenido completo del artículo
  date: string;
  imageUrl: string;
  category: string;
  author?: string;
  authorId?: string;
  views?: number;
  likes?: number;
  likedBy?: string[];
  comments?: Comment[];
  tags?: string[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Player = {
    id: string;
    name: string;
    avatarUrl: string;
    avatar?: string; // Alias for avatarUrl
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
    status: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Reserva';
};

export type ApprovedRegistration = {
  userId: string;
  tournamentId: string;
  status: 'approved' | 'reserve';
}

export type Comment = {
  id: string;
  postId: string;
  author: PlayerProfile;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  parentId?: string; // Para respuestas anidadas
  replies?: Comment[]; // Comentarios de respuesta
  isEdited?: boolean;
  editedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PollOption = {
  id: string;
  text: string;
  votes: number;
  votedBy: string[];
}

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt?: string;
  allowMultiple?: boolean;
}

export type PostInteraction = {
  userId: string;
  type: 'like' | 'comment' | 'share' | 'poll_vote';
  timestamp: string;
  data?: any; // Para datos adicionales como el ID de la opción de encuesta
}

export type FeedPost = {
    id: string;
    author: PlayerProfile;
    timestamp: string;
    content: string;
    imageUrl?: string;
    images?: string[]; // Soporte para múltiples imágenes
    stickerUrl?: string;
    poll?: Poll;
    likes: number;
    comments: number;
    shares: number;
    commentsList: Comment[];
    likedBy: string[];
    sharedBy: string[];
    interactions: PostInteraction[];
    liked?: boolean;
    shared?: boolean;
    sentiment?: string; // Sentimiento seleccionado
    achievement?: string; // Logro seleccionado
    isEdited?: boolean;
    editedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
    createdAt?: string;
    updatedAt?: string;
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
  // Nuevos campos de base de datos
  category?: string;
  isActive?: boolean;
  views?: number;
  orders?: number;
  tags?: string[];
  images?: string[];
  deliveryTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceOrder = {
  id: string;
  serviceId: string;
  userId: string;
  sellerId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  description?: string;
  requirements?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type BankAccount = {
    id: string;
    type: 'bank' | 'paypal';
    bankName?: string; // Nombre del banco o 'PayPal'
    accountNumber?: string; // Número de cuenta bancaria
    email?: string; // Correo de PayPal
    holderName: string;
    country?: string;
}

export type Transaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'Ingreso' | 'Retiro';
}

// Tipos para el sistema de suscripciones
export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // en días
  features: string[];
  isActive: boolean;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  paymentMethod: 'stripe' | 'paypal';
  paymentId?: string;
  isFreeTrial?: boolean;
  grantedByAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod = {
  id: string;
  userId: string;
  type: 'card' | 'paypal';
  last4?: string; // Para tarjetas
  brand?: string; // Para tarjetas (visa, mastercard, etc.)
  email?: string; // Para PayPal
  isDefault: boolean;
  stripePaymentMethodId?: string;
  paypalPaymentMethodId?: string;
  createdAt: string;
};

export type AdminWithdrawal = {
  id: string;
  amount: number;
  bankAccountId: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  description?: string;
};

// Tipos para el sistema de match
export type ConnectionRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: PlayerProfile;
  toUser: PlayerProfile;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  message?: string;
};

export type Match = {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: PlayerProfile;
  user2: PlayerProfile;
  createdAt: Date;
  chatId?: string;
  isActive: boolean;
};

export type MatchStatus = 'sent' | 'matched' | 'pending' | 'none';

export type ConnectionStatusResult = {
  userId: string;
  targetUserId: string;
  hasRequested: boolean;
  hasMatch: boolean;
  matchId?: string;
};

export type TournamentRegistration = {
  id?: string;
  tournamentId: string;
  userId: string;
  username: string;
  teamName?: string;
  teamMembers?: string[];
  registrationDate: Date;
  status: 'registered' | 'waitlisted' | 'cancelled' | 'disqualified';
  paymentStatus?: 'pending' | 'paid' | 'failed';
};

export type MatchmakingTicket = {
  id: string;
  userId: string;
  username: string;
  gameMode: string;
  region: string;
  rank: string;
  language: string;
  microphone: boolean;
  status: 'searching' | 'matched' | 'cancelled';
  createdAt: Date;
  estimatedWaitTime?: number;
  matchId?: string;
};

