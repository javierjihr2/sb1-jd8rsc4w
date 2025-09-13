export type PlayerProfile = {
  id: string;
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
  
  // Campos adicionales
  name?: string;
  email?: string;
  avatar?: string;
  coverPhotoUrl?: string;
  level?: number;
  rank?: string;
  countryCode?: string;
  role?: 'Jugador' | 'Creador' | 'Admin';
  location?: {
    lat: number;
    lon: number;
  };
  fcmToken?: string;
  nickname?: string;
  gameId?: string;
  currentServer?: string;
  gender?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir';
  age?: number;
  favoriteWeapons?: string[];
  playSchedule?: string;
  favoriteMap?: string;
  kills?: number;
  kdRatio?: number;
  
  // Propiedades específicas de Expo
  fullName?: string;
  pubgId?: string;
  kd?: number;
  wins?: number;
  matches?: number;
  description?: string;
  userId?: string;
  country?: string;
  profileImage?: string;
  coverImage?: string;
  matchPhotos?: string[];
  gamePreferences?: string[];
  isMatchEligible?: boolean;
  lastDataReview?: Date;
  
  // Propiedades de estado temporal y cache
  isTemporary?: boolean;
  lastCached?: string;
  isEmailVerified?: boolean;
  accountStatus?: string;
  
  // Configuraciones de privacidad
  privacySettings?: {
    [key: string]: boolean;
  };
  
  // Configuración biométrica
  biometricEnabled?: boolean;
  
  // Campos adicionales para configuraciones
  passwordUpdatedAt?: Date;
};

export type PollOption = {
  id: string;
  text: string;
  votes: string[]; // Array de userIds que votaron por esta opción
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  expiresAt?: Date;
};

export type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
};

export type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  poll?: Poll;
  linkPreview?: LinkPreview;
  likes: string[];
  comments: Comment[];
  saves: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: PlayerProfile;
};

export type Comment = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: PlayerProfile;
};

export type TournamentType = 'Individual' | 'Dúo' | 'Escuadra' | 'Solo' | 'Eliminación' | 'Liga' | 'Battle Royale' | 'Arena';
export type TournamentStatus = 'Abierto' | 'Cerrado' | 'Próximamente' | 'En Progreso' | 'Finalizado';
export type PubgServer = 
  | 'Asia'
  | 'Europa' 
  | 'Norte América'
  | 'Sur América'
  | 'Medio Oriente'
  | 'África'
  | 'Krjp'
  | 'India'
  | 'Vietnam'
  | 'Tailandia'
  | 'Singapur'
  | 'Malasia'
  | 'Indonesia'
  | 'Filipinas'
  | 'Hong Kong'
  | 'Taiwán'
  | 'Japón'
  | 'Corea del Sur'
  | 'Australia'
  | 'Nueva Zelanda'
  | 'Rusia'
  | 'Turquía'
  | 'Emiratos Árabes Unidos'
  | 'Arabia Saudí'
  | 'Egipto'
  | 'Sudáfrica'
  | 'Nigeria'
  | 'Kenia'
  | 'Marruecos'
  | 'Brasil'
  | 'Argentina'
  | 'Chile'
  | 'Colombia'
  | 'Perú'
  | 'México'
  | 'Venezuela'
  | 'Ecuador'
  | 'Uruguay'
  | 'Paraguay'
  | 'Bolivia'
  | 'Estados Unidos Este'
  | 'Estados Unidos Oeste'
  | 'Estados Unidos Central'
  | 'Canadá'
  | 'Reino Unido'
  | 'Alemania'
  | 'Francia'
  | 'España'
  | 'Italia'
  | 'Países Bajos'
  | 'Suecia'
  | 'Noruega'
  | 'Dinamarca'
  | 'Finlandia'
  | 'Polonia'
  | 'República Checa'
  | 'Hungría'
  | 'Rumania'
  | 'Bulgaria'
  | 'Grecia'
  | 'Portugal'
  | 'Suiza'
  | 'Austria'
  | 'Bélgica'
  | 'Irlanda'
  | 'Ucrania'
  | 'Bielorrusia'
  | 'Lituania'
  | 'Letonia'
  | 'Estonia';
export type EntryFeeType = 'Gratis' | 'Pago';
export type PrizeType = 'Sin Premios' | 'Dinero';

// Tipos para el sistema Discord-like
export type TournamentRole = {
  id: string;
  name: string;
  color: string;
  permissions: TournamentPermission[];
  position: number;
  mentionable: boolean;
  isDefault?: boolean;
  assignedUsers: string[];
};

export type TournamentPermission = 
  | 'VIEW_CHANNELS'
  | 'SEND_MESSAGES'
  | 'MANAGE_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'READ_MESSAGE_HISTORY'
  | 'MENTION_EVERYONE'
  | 'USE_EXTERNAL_EMOJIS'
  | 'MANAGE_CHANNELS'
  | 'KICK_MEMBERS'
  | 'BAN_MEMBERS'
  | 'MANAGE_ROLES'
  | 'MANAGE_TOURNAMENT'
  | 'VIEW_AUDIT_LOG'
  | 'PRIORITY_SPEAKER'
  | 'STREAM'
  | 'CONNECT'
  | 'SPEAK'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'administrator';

export type TournamentChannel = {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'rules' | 'general';
  description?: string;
  position: number;
  parentId?: string; // Para categorías
  permissions: ChannelPermissionOverwrite[];
  isDefault?: boolean;
  autoCreated: boolean;
};

export type ChannelPermissionOverwrite = {
  id: string; // roleId o userId
  type: 'role' | 'member';
  allow: TournamentPermission[];
  deny: TournamentPermission[];
};

export type TournamentTicket = {
  id: string;
  tournamentId: string;
  userId: string;
  category: 'general' | 'technical' | 'rules' | 'payment' | 'report';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // moderator userId
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
};

export type TicketMessage = {
  id: string;
  userId: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  isStaff: boolean;
};

export type TournamentInvite = {
  id: string;
  code: string;
  tournamentId: string;
  createdBy: string;
  maxUses?: number;
  currentUses: number;
  expiresAt?: Date;
  createdAt: Date;
};

export type Tournament = {
  id: string;
  name: string;
  description?: string;
  maxParticipants: number;
  entryFeeType: EntryFeeType;
  entryFeeAmount?: number;
  prizeType: PrizeType;
  prizeAmount?: number;
  tournamentType: TournamentType;
  server: PubgServer;
  date: string;
  time: string;
  status: TournamentStatus;
  participants: string[];
  teams: TournamentTeam[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Funcionalidades Discord-like
  roles: TournamentRole[];
  channels: TournamentChannel[];
  tickets: TournamentTicket[];
  invites: TournamentInvite[];
  rules: string[];
  announcements: TournamentAnnouncement[];
  moderators: string[]; // userIds
  bannedUsers: string[]; // userIds
  mutedUsers: { userId: string; until?: Date }[];
  settings: TournamentSettings;
  
  // Propiedades adicionales para compatibilidad
  prize?: string;
  mode?: 'Solo' | 'Dúo' | 'Escuadra';
  region?: 'N.A.' | 'S.A.';
  type?: 'Competitivo' | 'Por Puntos' | 'Evento WOW' | 'Amistoso' | 'Scrim';
  startTime?: string;
  timeZone?: string;
  maxTeams?: number;
  maps?: string[];
  creatorId?: string;
  creatorName?: string;
  entryFee?: string;
  prizePool?: string;
  registeredTeams?: number;
  isActive?: boolean;
  views?: number;
  infoSendTime?: string;
  streamLink?: string;
  maxWithdrawalTime?: string;
  maxReserves?: number;
  messageTemplate?: string;
  matchId?: string;
  matchPassword?: string;
  perspective?: string;
  adminNotes?: string;
  spectatorMode?: boolean;
};

export type TournamentAnnouncement = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  pinned: boolean;
  mentionEveryone: boolean;
};

export type TournamentSettings = {
  autoCreateChannels: boolean;
  autoAssignRoles: boolean;
  allowInvites: boolean;
  moderationLevel: 'low' | 'medium' | 'high';
  autoModeration: boolean;
  welcomeMessage?: string;
  rulesChannelId?: string;
  announcementsChannelId?: string;
  generalChannelId?: string;
};

export type TournamentTeam = {
  id: string;
  name: string;
  tag: string;
  flag?: string; // URL de la imagen de la bandera
  members: string[]; // IDs de los usuarios
  captain: string; // ID del capitán
  registeredAt: Date;
  status: 'pending' | 'approved' | 'rejected';
};

export type Match = {
  id: string;
  players: string[];
  mode: 'Solo' | 'Dúo' | 'Escuadra';
  region: string;
  status: 'Buscando' | 'Encontrado' | 'En Battle Royale' | 'Completado';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId?: string;
  roomId?: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  createdAt: Date;
  read: boolean;
  sender?: PlayerProfile;
  reactions?: { [userId: string]: string };
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
  mediaUrl?: string;
  mediaType?: string;
  duration?: number;
  fileSize?: number;
  fileName?: string;
  isEphemeral?: boolean;
  expiresAt?: Date;
  readBy?: { [userId: string]: Date };
  deliveredTo?: { [userId: string]: Date };
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'match' | 'tournament' | 'friend' | 'message' | 'general';
  data?: any;
  read: boolean;
  createdAt: Date;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  sender?: PlayerProfile;
  receiver?: PlayerProfile;
};

export type UserWithRole = PlayerProfile;

export type ChatRoom = {
  id: string;
  name?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  unreadCount?: { [userId: string]: number };
  isTyping?: boolean;
  typingUsers?: { userId: string; timestamp: Date }[];
  isOnline?: boolean;
  avatar?: string;
  description?: string;
  isGroup?: boolean;
  isGlobal?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  admins?: string[];
  settings?: {
    allowInvites?: boolean;
    allowMediaSharing?: boolean;
    muteNotifications?: boolean;
    ephemeralMessages?: boolean;
    messageRetention?: number;
  };
};

export type TypingUser = {
  userId: string;
  timestamp: Date;
};

export type MessageReaction = {
  emoji: string;
  users: string[];
  count: number;
};

export type MediaItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  aspectRatio?: number;
  duration?: number;
  thumbnail?: string;
};

export type PostMedia = MediaItem;

export type ReactionType = '👍' | '❤️' | '😂' | '😮' | '😢' | '😡';