import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isAdmin?: boolean;
  isSystemMessage?: boolean;
  userRole?: 'Participant' | 'Spectator' | 'Moderator' | 'VIP' | 'Organizer';
  replyTo?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isCommand?: boolean;
  isAnnouncement?: boolean;
  attachments?: { type: 'image' | 'file' | 'video' | 'audio'; url: string; name: string; size?: number }[];
  isEdited?: boolean;
  editedAt?: Date;
  isPinned?: boolean;
  isDeleted?: boolean;
  mentions?: string[];
  threadReplies?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  location?: { latitude: number; longitude: number; address?: string };
  poll?: {
    question: string;
    options: { id: string; text: string; votes: number; voters: string[] }[];
    allowMultiple: boolean;
    expiresAt?: Date;
  };
  threadId?: string;
  isThreadStarter?: boolean;
  voiceNote?: VoiceNote;
  embed?: MessageEmbed;
  channelId?: string;
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  size: number;
  thumbnail?: string;
}

interface VoiceNote {
  id: string;
  url: string;
  duration: number;
  waveform: number[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  expiresAt?: Date;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
  emoji?: string;
}

interface MessageEmbed {
  title?: string;
  description?: string;
  color?: string;
  thumbnail?: string;
  image?: string;
  url?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'rules';
  description?: string;
  isPrivate: boolean;
  allowedRoles: string[];
  slowMode?: number;
  isNSFW?: boolean;
  parentCategory?: string;
}

interface Thread {
  id: string;
  name: string;
  parentMessageId: string;
  channelId: string;
  createdBy: string;
  createdAt: Date;
  isArchived: boolean;
  messageCount: number;
  participants: string[];
}

interface UserStatus {
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching';
    name: string;
    details?: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  mode: string;
  prize: string;
  participants: number;
  status?: 'Abierto' | 'Cerrado' | 'Próximamente' | 'En Progreso' | 'Finalizado';
  organizer?: string;
  maxParticipants?: number;
  entryFee?: string;
  prizePool?: string;
  server?: string;
  time?: string;
  registeredTeams?: number;
  maxTeams?: number;
  chatSettings?: {
    enabled: boolean;
    moderationLevel: 'Low' | 'Medium' | 'High';
    allowedRoles: string[];
    bannedWords: string[];
    slowMode: number;
  };
  leaderboard?: {
    teamId: string;
    teamName: string;
    points: number;
    kills: number;
    placement: number;
    matchesPlayed: number;
    }[];
  schedule?: {
    phase: string;
    startTime: Date;
    endTime: Date;
    description: string;
  }[];
}

interface Participant {
  id: string;
  name: string;
  role: 'Participant' | 'Spectator' | 'Moderator' | 'VIP' | 'Organizer';
  isOnline?: boolean;
  teamName?: string;
  rank?: string;
  avatar?: string;
  joinedAt: Date;
  lastSeen?: Date;
  isMuted?: boolean;
  permissions?: string[];
  status: UserStatus;
  nickname?: string;
  badges: string[];
  level: number;
  xp: number;
  voiceChannelId?: string;
  isDeafened?: boolean;
  isSpeaking?: boolean;
  customRoleColor?: string;
  boostingSince?: Date;
}

// Datos simulados
const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'PUBG Championship 2024',
    date: '2024-02-15',
    mode: 'Squad',
    prize: '$10,000',
    participants: 64,
  },
  {
    id: '2',
    name: 'Winter Battle Royale',
    date: '2024-02-20',
    mode: 'Duo',
    prize: '$5,000',
    participants: 32,
  },
];

const mockParticipants: Participant[] = [
  { 
    id: '1', 
    name: 'ProGamer123', 
    role: 'Participant', 
    isOnline: true, 
    teamName: 'Alpha Squad', 
    rank: 'Conquistador',
    avatar: 'https://i.pravatar.cc/150?img=1',
    joinedAt: new Date('2024-01-15'),
    status: { status: 'online', activity: { type: 'playing', name: 'PUBG Mobile' } },
    badges: ['🏆', '🔥'],
    level: 25,
    xp: 12500,
    customRoleColor: '#ff6b35'
  },
  { 
    id: '2', 
    name: 'SnipeKing', 
    role: 'Participant', 
    isOnline: true, 
    teamName: 'Alpha Squad', 
    rank: 'As',
    avatar: 'https://i.pravatar.cc/150?img=2',
    joinedAt: new Date('2024-01-10'),
    status: { status: 'dnd', customStatus: 'En partida competitiva' },
    badges: ['🎯', '⚡'],
    level: 32,
    xp: 18900,
    customRoleColor: '#3b82f6'
  },
  { 
    id: '3', 
    name: 'BattleQueen', 
    role: 'Moderator', 
    isOnline: true, 
    teamName: 'Beta Team', 
    rank: 'Conquistador',
    avatar: 'https://i.pravatar.cc/150?img=3',
    joinedAt: new Date('2023-12-01'),
    status: { status: 'online', activity: { type: 'watching', name: 'Moderando chat' } },
    badges: ['🛡️', '👑', '🎖️'],
    level: 45,
    xp: 28750,
    customRoleColor: '#10b981'
  },
  { 
    id: '4', 
    name: 'TacticalAce', 
    role: 'Participant', 
    isOnline: false, 
    teamName: 'Beta Team', 
    rank: 'Diamante',
    avatar: 'https://i.pravatar.cc/150?img=4',
    joinedAt: new Date('2024-01-08'),
    lastSeen: new Date('2024-02-14'),
    status: { status: 'offline' },
    badges: ['💎', '🌟'],
    level: 28,
    xp: 15600,
    customRoleColor: '#8b5cf6'
  },
  { 
    id: '5', 
    name: 'HeadshotHero', 
    role: 'VIP', 
    isOnline: true, 
    teamName: 'Gamma Force', 
    rank: 'As',
    avatar: 'https://i.pravatar.cc/150?img=5',
    joinedAt: new Date('2024-01-05'),
    status: { status: 'idle', customStatus: 'Practicando aim' },
    badges: ['👑', '💎', '🌟'],
    level: 38,
    xp: 22100,
    customRoleColor: '#f59e0b',
    boostingSince: new Date('2024-01-20')
  },
  { 
    id: '6', 
    name: 'BattleRoyalePro', 
    role: 'Participant', 
    isOnline: true, 
    teamName: 'Gamma Force', 
    rank: 'Platino',
    avatar: 'https://i.pravatar.cc/150?img=6',
    joinedAt: new Date('2024-01-12'),
    status: { status: 'online', activity: { type: 'streaming', name: 'Entrenamiento' } },
    badges: ['🎮', '⭐'],
    level: 22,
    xp: 9800,
    customRoleColor: '#06b6d4'
  },
  { 
    id: '7', 
    name: 'EliteSquad', 
    role: 'Organizer', 
    isOnline: true, 
    teamName: 'Staff', 
    rank: 'Conquistador',
    avatar: 'https://i.pravatar.cc/150?img=7',
    joinedAt: new Date('2023-11-15'),
    status: { status: 'online', activity: { type: 'watching', name: 'Organizando torneo' } },
    badges: ['🏅', '⭐', '🎪'],
    level: 50,
    xp: 35000,
    customRoleColor: '#dc2626'
  },
  { 
    id: '8', 
    name: 'VictorySeeker', 
    role: 'Spectator', 
    isOnline: false, 
    rank: 'Oro',
    avatar: 'https://i.pravatar.cc/150?img=8',
    joinedAt: new Date('2024-02-01'),
    lastSeen: new Date('2024-02-13'),
    status: { status: 'offline' },
    badges: ['👀'],
    level: 15,
    xp: 4500,
    customRoleColor: '#64748b'
  },
  { 
    id: '9', 
    name: 'ChatModerator', 
    role: 'Moderator', 
    isOnline: true, 
    teamName: 'Staff', 
    rank: 'Diamante',
    avatar: 'https://i.pravatar.cc/150?img=9',
    joinedAt: new Date('2023-12-20'),
    status: { status: 'dnd', customStatus: 'Moderando activamente' },
    badges: ['🛡️', '⚖️'],
    level: 42,
    xp: 26800,
    customRoleColor: '#059669'
  },
  { 
    id: '10', 
    name: 'StreamViewer', 
    role: 'Spectator', 
    isOnline: true, 
    rank: 'Platino',
    avatar: 'https://i.pravatar.cc/150?img=10',
    joinedAt: new Date('2024-02-05'),
    status: { status: 'online', activity: { type: 'watching', name: 'Stream del torneo' } },
    badges: ['📺', '👀'],
    level: 18,
    xp: 6200,
    customRoleColor: '#7c3aed'
  },
];

// Datos simulados para canales
const mockChannels: Channel[] = [
  {
    id: 'general',
    name: 'general',
    type: 'text',
    description: 'Chat general del torneo',
    isPrivate: false,
    allowedRoles: ['Participant', 'Spectator', 'Moderator', 'VIP', 'Organizer']
  },
  {
    id: 'announcements',
    name: 'anuncios',
    type: 'announcement',
    description: 'Anuncios oficiales del torneo',
    isPrivate: false,
    allowedRoles: ['Moderator', 'Organizer'],
    slowMode: 300
  },
  {
    id: 'team-formation',
    name: 'formación-equipos',
    type: 'text',
    description: 'Canal para formar equipos',
    isPrivate: false,
    allowedRoles: ['Participant', 'Moderator', 'VIP', 'Organizer']
  },
  {
    id: 'strategies',
    name: 'estrategias',
    type: 'text',
    description: 'Comparte tus estrategias',
    isPrivate: false,
    allowedRoles: ['Participant', 'Moderator', 'VIP', 'Organizer']
  },
  {
    id: 'moderators-only',
    name: 'solo-moderadores',
    type: 'text',
    description: 'Canal privado para moderadores',
    isPrivate: true,
    allowedRoles: ['Moderator', 'Organizer']
  }
];

// Datos simulados para hilos
const mockThreads: Thread[] = [
  {
    id: 'thread-1',
    name: 'Discusión sobre mapas',
    parentMessageId: 'msg-123',
    channelId: 'strategies',
    createdBy: 'ProGamer123',
    createdAt: new Date('2024-02-14'),
    isArchived: false,
    messageCount: 15,
    participants: ['ProGamer123', 'SnipeKing', 'BattleQueen']
  },
  {
    id: 'thread-2',
    name: 'Horarios de práctica',
    parentMessageId: 'msg-456',
    channelId: 'team-formation',
    createdBy: 'HeadshotHero',
    createdAt: new Date('2024-02-13'),
    isArchived: false,
    messageCount: 8,
    participants: ['HeadshotHero', 'EliteSquad']
  }
];

const messageTemplates = [
  {
    id: 'welcome',
    title: 'Mensaje de Bienvenida',
    content: '🎉 ¡Bienvenidos al torneo! Por favor lean las reglas y manténganse atentos a las actualizaciones.'
  },
  {
    id: 'rules',
    title: 'Recordatorio de Reglas',
    content: '📋 Recordatorio: Revisen las reglas del torneo. Cualquier violación resultará en descalificación.'
  },
  {
    id: 'start',
    title: 'Inicio de Partida',
    content: '🚀 ¡La partida está comenzando! Todos los equipos deben estar listos en sus salas.'
  },
  {
    id: 'break',
    title: 'Descanso',
    content: '⏸️ Descanso de 15 minutos. La próxima ronda comenzará pronto.'
  },
  {
    id: 'results',
    title: 'Resultados',
    content: '🏆 Resultados de la ronda publicados. Revisen la tabla de posiciones.'
  },
  {
    id: 'technical',
    title: 'Problemas Técnicos',
    content: '⚠️ Si experimentan problemas técnicos, contacten a un moderador inmediatamente.'
  },
  {
    id: 'leaderboard',
    title: 'Tabla de Posiciones',
    content: '📊 Tabla de posiciones actualizada. ¡Revisen su posición actual!'
  },
  {
    id: 'schedule',
    title: 'Horarios',
    content: '⏰ Próxima fase del torneo programada. Revisen los horarios actualizados.'
  },
  {
    id: 'stream',
    title: 'Transmisión en Vivo',
    content: '📺 ¡La transmisión en vivo está activa! No se pierdan la acción.'
  },
  {
    id: 'warning',
    title: 'Advertencia',
    content: '⚠️ Advertencia oficial: Mantengan un comportamiento respetuoso en el chat.'
  },
  {
    id: 'final',
    title: 'Ronda Final',
    content: '🔥 ¡RONDA FINAL! ¡Que gane el mejor equipo! ¡Buena suerte a todos!'
  },
  {
    id: 'winner',
    title: 'Anuncio de Ganador',
    content: '🏆 ¡Felicitaciones al equipo ganador! Gracias a todos por participar.'
  }
];

const chatCommands = [
  { command: '/leaderboard', description: 'Mostrar tabla de posiciones actual' },
  { command: '/schedule', description: 'Mostrar horarios del torneo' },
  { command: '/rules', description: 'Mostrar reglas del torneo' },
  { command: '/teams', description: 'Listar equipos participantes' },
  { command: '/help', description: 'Mostrar comandos disponibles' },
  { command: '/mute @usuario', description: 'Silenciar usuario (solo moderadores)' },
  { command: '/unmute @usuario', description: 'Quitar silencio (solo moderadores)' },
  { command: '/clear', description: 'Limpiar chat (solo moderadores)' },
  { command: '/announce', description: 'Enviar anuncio oficial (solo organizadores)' },
  { command: '/pin', description: 'Fijar mensaje (solo moderadores)' },
  { command: '/unpin', description: 'Desfijar mensaje (solo moderadores)' },
  { command: '/poll "pregunta" "opción1" "opción2"', description: 'Crear encuesta' },
  { command: '/timeout @usuario 5m', description: 'Timeout temporal (solo moderadores)' },
  { command: '/warn @usuario', description: 'Advertir usuario (solo moderadores)' },
  { command: '/stats', description: 'Mostrar estadísticas del chat' },
  { command: '/backup', description: 'Crear respaldo del chat (solo organizadores)' }
];

const emojiCategories = {
  'Frecuentes': ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥'],
  'Gaming': ['🎮', '🏆', '🥇', '🥈', '🥉', '⚡', '💀', '🎯', '🚀', '💥'],
  'PUBG': ['🔫', '🎪', '🏃', '🚗', '✈️', '🎒', '⛑️', '🩹', '💊', '🔋'],
  'Emociones': ['😊', '😎', '🤩', '😤', '😱', '🤯', '😴', '🤗', '🙄', '😏'],
  'Gestos': ['👋', '👏', '🤝', '✌️', '🤞', '👌', '💪', '🙏', '👊', '✊']
};

export default function TournamentChat() {
  const params = useLocalSearchParams();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>(mockParticipants);
  const [currentUserRole, setCurrentUserRole] = useState<'Participant' | 'Spectator' | 'Moderator' | 'VIP' | 'Organizer'>('Participant');
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Frecuentes');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [chatStats, setChatStats] = useState({ totalMessages: 0, activeUsers: 0, moderatorActions: 0 });
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Nuevos estados para funcionalidades tipo Discord
  const [selectedChannel, setSelectedChannel] = useState<Channel>(mockChannels[0]);
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [threads, setThreads] = useState<Thread[]>(mockThreads);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState<Participant | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<{[channelId: string]: number}>({});
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'warning' | 'error'}[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState<{[messageId: string]: {emoji: string, users: string[]}[]}>({});
  const [slowModeTimer, setSlowModeTimer] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configurar torneo desde parámetros de navegación
  useEffect(() => {
    if (params.tournamentId) {
      const tournamentFromParams: Tournament = {
        id: params.tournamentId as string,
        name: params.tournamentName as string,
        date: params.tournamentDate as string,
        mode: params.tournamentMode as string,
        prize: params.tournamentPrize as string,
        participants: parseInt(params.tournamentParticipants as string) || 0,
        status: 'En Progreso' as const,
        organizer: 'SquadGO',
        maxParticipants: 100,
        entryFee: '0',
        prizePool: params.tournamentPrize as string,
        server: 'SA',
        time: '20:00',
        registeredTeams: 0,
        maxTeams: 16
      };
      setSelectedTournament(tournamentFromParams);
    }
  }, [params]);

  useEffect(() => {
    if (selectedTournament) {
      // Mensajes de bienvenida automáticos
      const welcomeMessages: Message[] = [
        {
          id: `welcome-${Date.now()}`,
          text: `🎯 ¡Bienvenido al chat del torneo ${selectedTournament.name}!`,
          sender: 'Sistema PUBG',
          timestamp: new Date(),
          isSystemMessage: true,
          isAdmin: false,
        },
        {
          id: `info-${Date.now() + 1}`,
          text: `📅 Fecha: ${selectedTournament.date} | 🎮 Modo: ${selectedTournament.mode} | 🏆 Premio: ${selectedTournament.prize}`,
          sender: 'Sistema PUBG',
          timestamp: new Date(),
          isSystemMessage: true,
          isAdmin: false,
        },
        {
          id: `rules-${Date.now() + 2}`,
          text: `⚡ Recuerda seguir las reglas del torneo. Mantén un comportamiento respetuoso y deportivo.`,
          sender: 'Sistema PUBG',
          timestamp: new Date(),
          isSystemMessage: true,
          isAdmin: false,
        },
      ];

      // Agregar mensajes con delay
      welcomeMessages.forEach((message, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, message]);
        }, (index + 1) * 1000);
      });

      // Recordatorios periódicos
      const reminderInterval = setInterval(() => {
        const reminderMessages = [
          `🔥 Recordatorio: El torneo ${selectedTournament.name} está en curso. ¡Mantente atento a las actualizaciones!`,
          `⏰ Verifica los horarios del torneo en la información de la sala.`,
          `🎯 Asegúrate de tener tu equipo listo y configurado para el torneo.`,
          `🏆 ¡Que gane el mejor! Recuerda jugar limpio y respetar a tus oponentes.`,
        ];

        const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
        
        const reminderMsg: Message = {
          id: `reminder-${Date.now()}`,
          text: randomMessage,
          sender: 'Sistema PUBG',
          timestamp: new Date(),
          isSystemMessage: true,
          isAdmin: false,
        };

        setMessages(prev => [...prev, reminderMsg]);
      }, 300000); // Cada 5 minutos

      return () => clearInterval(reminderInterval);
    }
  }, [selectedTournament]);

  const handleSendMessage = () => {
    if (newMessage.trim() && !isChatLocked) {
      // Verificar modo lento
      if (slowModeTimer > 0 && lastMessageTime) {
        const timeSinceLastMessage = Date.now() - lastMessageTime.getTime();
        if (timeSinceLastMessage < slowModeTimer * 1000) {
          const remainingTime = Math.ceil((slowModeTimer * 1000 - timeSinceLastMessage) / 1000);
          addNotification(`Debes esperar ${remainingTime} segundos antes de enviar otro mensaje`, 'warning');
          return;
        }
      }

      if (editingMessage) {
        // Editar mensaje existente
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, text: newMessage.trim(), isEdited: true, editedAt: new Date() }
            : msg
        ));
        setEditingMessage(null);
        addNotification('Mensaje editado', 'info');
      } else {
        // Verificar si es un comando
        if (newMessage.startsWith('/')) {
          handleCommand(newMessage);
          setNewMessage('');
          return;
        }

        // Crear nuevo mensaje
        const message: Message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          sender: 'Tú',
          timestamp: new Date(),
          isAdmin: currentUserRole === 'Moderator' || currentUserRole === 'Organizer',
          userRole: currentUserRole,
          replyTo: replyingTo?.id,
          mentions: extractMentions(newMessage),
          priority: determinePriority(newMessage),
          reactions: [],
          channelId: selectedChannel.id,
          threadId: selectedThread?.id
        };

        setMessages(prev => [...prev, message]);
        setChatStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));
        setLastMessageTime(new Date());
        
        // Limpiar indicador de escritura
        setTypingUsers(prev => prev.filter(user => user !== 'Tú'));
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      setNewMessage('');
      setReplyingTo(null);
      scrollToBottom();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const determinePriority = (text: string): 'low' | 'normal' | 'high' | 'urgent' => {
    if (text.includes('URGENTE') || text.includes('EMERGENCY')) return 'urgent';
    if (text.includes('IMPORTANTE') || text.includes('IMPORTANT')) return 'high';
    return 'normal';
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (existingReaction.users.includes('Tú')) {
            // Quitar reacción
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(u => u !== 'Tú');
            if (existingReaction.count === 0) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
            }
          } else {
            // Añadir reacción
            existingReaction.count++;
            existingReaction.users.push('Tú');
          }
        } else {
          // Nueva reacción
          reactions.push({ emoji, count: 1, users: ['Tú'] });
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const handlePinMessage = (messageId: string) => {
    if (currentUserRole === 'Moderator' || currentUserRole === 'Organizer') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        ));
        
        if (!message.isPinned) {
          setPinnedMessages(prev => [...prev, { ...message, isPinned: true }]);
        } else {
          setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
        }
      }
    }
  };

  // Nuevas funciones para Discord-like features
  const handleChannelSwitch = (channel: Channel) => {
    setSelectedChannel(channel);
    setMessages([]);
    setShowChannelList(false);
    // Simular carga de mensajes del canal
    setTimeout(() => {
      const channelMessages: Message[] = [
        {
          id: `${channel.id}-welcome`,
          text: `¡Bienvenido al canal ${channel.name}!`,
          sender: 'Sistema',
          timestamp: new Date(),
          isSystemMessage: true,
          channelId: channel.id
        }
      ];
      setMessages(channelMessages);
    }, 500);
  };

  const createThread = (messageId: string, threadName: string) => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      name: threadName,
      channelId: selectedChannel.id,
      parentMessageId: messageId,
      createdBy: 'current-user',
      createdAt: new Date(),
      isArchived: false,
      messageCount: 0,
      participants: ['current-user']
    };
    setThreads(prev => [...prev, newThread]);
    setSelectedThread(newThread);
  };

  const startVoiceRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        addNotification('Se necesitan permisos de micrófono para grabar audio', 'warning');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      await recording.startAsync();
      
      setVoiceRecording(recording);
      setIsRecordingVoice(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      addNotification('Error al iniciar grabación de voz', 'error');
    }
  };

  const stopVoiceRecording = async () => {
    if (!voiceRecording) return;

    try {
      await voiceRecording.stopAndUnloadAsync();
      const uri = voiceRecording.getURI();
      
      if (uri) {
        const voiceNote: VoiceNote = {
          id: Date.now().toString(),
          url: uri,
          duration: 0,
          waveform: []
        };

        const newMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: 'Tú',
          timestamp: new Date(),
          voiceNote,
          channelId: selectedChannel.id
        };

        setMessages(prev => [...prev, newMessage]);
        addNotification('Nota de voz enviada', 'info');
      }
      
      setVoiceRecording(null);
      setIsRecordingVoice(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error al detener grabación:', error);
      addNotification('Error al enviar nota de voz', 'error');
    }
  };

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) {
      addNotification('Debes agregar una pregunta y al menos 2 opciones', 'warning');
      return;
    }

    const poll: Poll = {
      id: Date.now().toString(),
      question: pollQuestion,
      options: pollOptions.filter(opt => opt.trim()).map((option, index) => ({
        id: index.toString(),
        text: option,
        votes: 0,
        voters: []
      })),
      allowMultiple: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    const newMessage: Message = {
      id: Date.now().toString(),
      text: '',
      sender: 'Tú',
      timestamp: new Date(),
      poll,
      channelId: selectedChannel.id
    };

    setMessages(prev => [...prev, newMessage]);
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    addNotification('Encuesta creada', 'info');
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!typingUsers.includes('Tú')) {
      setTypingUsers(prev => [...prev, 'Tú']);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(prev => prev.filter(user => user !== 'Tú'));
    }, 2000);
  };

  const addNotification = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type
    };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size || 0,
          type: 'file',
          url: file.uri
        };

        const messageObj: Message = {
          id: Date.now().toString(),
          text: newMessage.trim() || `Archivo compartido: ${file.name}`,
          sender: 'Tú',
          timestamp: new Date(),
          attachments: [attachment],
          channelId: selectedChannel.id
        };

        setMessages(prev => [...prev, messageObj]);
        setNewMessage('');
        addNotification('Archivo subido correctamente', 'info');
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      addNotification('Error al subir archivo', 'error');
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          name: 'imagen.jpg',
          size: 0,
          type: 'image',
          url: image.uri
        };

        const messageObj: Message = {
          id: Date.now().toString(),
          text: newMessage.trim() || 'Imagen compartida',
          sender: 'Tú',
          timestamp: new Date(),
          attachments: [attachment],
          channelId: selectedChannel.id
        };

        setMessages(prev => [...prev, messageObj]);
        setNewMessage('');
        addNotification('Imagen subida correctamente', 'info');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      addNotification('Error al subir imagen', 'error');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (currentUserRole === 'Moderator' || currentUserRole === 'Organizer') {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isDeleted: true, text: '[Mensaje eliminado]' } : msg
      ));
      setChatStats(prev => ({ ...prev, moderatorActions: prev.moderatorActions + 1 }));
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.text);
  };

  const handleCommand = (command: string) => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd.toLowerCase()) {
      case '/help':
        showCommandHelp();
        break;
      case '/leaderboard':
        showLeaderboardData();
        break;
      case '/schedule':
        showScheduleData();
        break;
      case '/rules':
        showTournamentRules();
        break;
      case '/teams':
        showTeamsList();
        break;
      case '/mute':
        if (currentUserRole === 'Moderator' || currentUserRole === 'Organizer') {
          handleMuteUser(args[0]);
        } else {
          showErrorMessage('No tienes permisos para usar este comando.');
        }
        break;
      case '/unmute':
        if (currentUserRole === 'Moderator' || currentUserRole === 'Organizer') {
          handleUnmuteUser(args[0]);
        } else {
          showErrorMessage('No tienes permisos para usar este comando.');
        }
        break;
      case '/clear':
        if (currentUserRole === 'Moderator' || currentUserRole === 'Organizer') {
          handleClearChat();
        } else {
          showErrorMessage('No tienes permisos para usar este comando.');
        }
        break;
      case '/announce':
        if (currentUserRole === 'Organizer') {
          handleAnnouncement(args.join(' '));
        } else {
          showErrorMessage('Solo los organizadores pueden hacer anuncios.');
        }
        break;
      default:
        showErrorMessage(`Comando desconocido: ${cmd}. Usa /help para ver comandos disponibles.`);
    }
  };

  const showCommandHelp = () => {
    const helpMessage: Message = {
      id: `help-${Date.now()}`,
      text: `📋 **Comandos disponibles:**\n${chatCommands.map(c => `${c.command} - ${c.description}`).join('\n')}`,
      sender: 'Sistema',
      timestamp: new Date(),
      isSystemMessage: true,
      isAdmin: false,
    };
    setMessages(prev => [...prev, helpMessage]);
  };

  const showLeaderboardData = () => {
    if (selectedTournament?.leaderboard) {
      const leaderboardText = selectedTournament.leaderboard
        .map((team, index) => `${index + 1}. ${team.teamName} - ${team.points} pts (${team.kills} kills)`)
        .join('\n');
      
      const leaderboardMessage: Message = {
        id: `leaderboard-${Date.now()}`,
        text: `🏆 **Tabla de Posiciones:**\n${leaderboardText}`,
        sender: 'Sistema',
        timestamp: new Date(),
        isSystemMessage: true,
        isAdmin: false,
      };
      setMessages(prev => [...prev, leaderboardMessage]);
    }
  };

  const showScheduleData = () => {
    if (selectedTournament?.schedule) {
      const scheduleText = selectedTournament.schedule
        .map(phase => `${phase.phase}: ${phase.startTime.toLocaleTimeString()} - ${phase.endTime.toLocaleTimeString()}\n${phase.description}`)
        .join('\n\n');
      
      const scheduleMessage: Message = {
        id: `schedule-${Date.now()}`,
        text: `⏰ **Horarios del Torneo:**\n${scheduleText}`,
        sender: 'Sistema',
        timestamp: new Date(),
        isSystemMessage: true,
        isAdmin: false,
      };
      setMessages(prev => [...prev, scheduleMessage]);
    }
  };

  const showTournamentRules = () => {
    const rulesMessage: Message = {
      id: `rules-${Date.now()}`,
      text: `📋 **Reglas del Torneo:**\n• Comportamiento respetuoso\n• No spam en el chat\n• Seguir las instrucciones de los moderadores\n• Reportar problemas técnicos inmediatamente`,
      sender: 'Sistema',
      timestamp: new Date(),
      isSystemMessage: true,
      isAdmin: false,
    };
    setMessages(prev => [...prev, rulesMessage]);
  };

  const showTeamsList = () => {
    const teams = mockParticipants
      .filter(p => p.teamName)
      .reduce((acc, p) => {
        if (!acc[p.teamName!]) acc[p.teamName!] = [];
        acc[p.teamName!].push(p.name);
        return acc;
      }, {} as Record<string, string[]>);
    
    const teamsText = Object.entries(teams)
      .map(([teamName, members]) => `**${teamName}:** ${members.join(', ')}`)
      .join('\n');
    
    const teamsMessage: Message = {
      id: `teams-${Date.now()}`,
      text: `👥 **Equipos Participantes:**\n${teamsText}`,
      sender: 'Sistema',
      timestamp: new Date(),
      isSystemMessage: true,
      isAdmin: false,
    };
    setMessages(prev => [...prev, teamsMessage]);
  };

  const handleMuteUser = (username: string) => {
    if (username && username.startsWith('@')) {
      const user = username.substring(1);
      setMutedUsers(prev => [...prev, user]);
      showSystemMessage(`🔇 Usuario ${user} ha sido silenciado.`);
    }
  };

  const handleUnmuteUser = (username: string) => {
    if (username && username.startsWith('@')) {
      const user = username.substring(1);
      setMutedUsers(prev => prev.filter(u => u !== user));
      showSystemMessage(`🔊 Usuario ${user} ya no está silenciado.`);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    showSystemMessage('🧹 Chat limpiado por un moderador.');
  };

  const handleAnnouncement = (text: string) => {
    if (text.trim()) {
      const announcementMessage: Message = {
        id: `announcement-${Date.now()}`,
        text: `📢 **ANUNCIO OFICIAL:** ${text}`,
        sender: 'Organizador',
        timestamp: new Date(),
        isAnnouncement: true,
        isAdmin: true,
        userRole: 'Organizer',
      };
      setMessages(prev => [...prev, announcementMessage]);
    }
  };

  const showSystemMessage = (text: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      text,
      sender: 'Sistema',
      timestamp: new Date(),
      isSystemMessage: true,
      isAdmin: false,
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const showErrorMessage = (text: string) => {
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      text: `❌ ${text}`,
      sender: 'Sistema',
      timestamp: new Date(),
      isSystemMessage: true,
      isAdmin: false,
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  const handleSendTemplate = () => {
    let messageText = '';
    
    if (isCustomMode && customMessage.trim()) {
      messageText = customMessage;
    } else if (selectedTemplate) {
      const template = messageTemplates.find(t => t.id === selectedTemplate);
      messageText = template?.content || '';
    }

    if (messageText) {
      const message: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'Sistema',
        timestamp: new Date(),
        isAdmin: true,
        isSystemMessage: true,
      };
      setMessages(prev => [...prev, message]);
      setShowTemplateModal(false);
      setSelectedTemplate('');
      setCustomMessage('');
      setIsCustomMode(false);
      Alert.alert('Éxito', 'Mensaje enviado correctamente');
    }
  };

  const handleMention = (participant: Participant) => {
    const beforeCursor = newMessage;
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newText = beforeCursor.substring(0, lastAtIndex) + `@${participant.name} `;
      setNewMessage(newText);
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleInputChange = (text: string) => {
    handleTyping(text);
    
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === text.length - 1) {
      setShowMentions(true);
      setMentionQuery('');
      setFilteredParticipants(mockParticipants);
    } else if (lastAtIndex !== -1) {
      const query = text.substring(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionQuery(query);
        const filtered = mockParticipants.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredParticipants(filtered);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'Organizer': return '👑';
      case 'Moderator': return '🛡️';
      case 'VIP': return '⭐';
      case 'Participant': return '🎮';
      case 'Spectator': return '👁️';
      default: return '';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'Organizer': return '#fbbf24';
      case 'Moderator': return '#3b82f6';
      case 'VIP': return '#a855f7';
      case 'Participant': return '#10b981';
      case 'Spectator': return '#6b7280';
      default: return '#64748b';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'Tú' ? styles.ownMessage : styles.otherMessage,
      item.isSystemMessage && styles.systemMessage,
      item.isAnnouncement && styles.announcementMessage
    ]}>
      {item.isSystemMessage ? (
        <View style={styles.systemMessageContent}>
          <Ionicons name="information-circle" size={16} color="#f97316" />
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      ) : (
        <>
          {item.replyTo && (
            <View style={styles.replyContainer}>
              <Text style={styles.replyText}>↳ Respondiendo a mensaje</Text>
            </View>
          )}
          <View style={styles.messageHeader}>
            <View style={styles.senderInfo}>
              <Text style={[
                styles.senderName,
                { color: getRoleColor(item.userRole) }
              ]}>
                {getRoleIcon(item.userRole)} {item.sender}
              </Text>
              {item.userRole && (
                <Text style={[styles.roleTag, { backgroundColor: getRoleColor(item.userRole) }]}>
                  {item.userRole}
                </Text>
              )}
            </View>
            <View style={styles.messageActions}>
              <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
              <TouchableOpacity 
                onPress={() => setReplyingTo(item)}
                style={styles.replyButton}
              >
                <Ionicons name="arrow-undo" size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[
            styles.messageText,
            item.isAnnouncement && styles.announcementText
          ]}>
            {item.text}
          </Text>
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, index) => (
                <TouchableOpacity key={index} style={styles.reactionButton}>
                  <Text style={styles.reactionText}>
                    {reaction.emoji} {reaction.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  if (!selectedTournament) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat de Torneos</Text>
        </View>
        
        <ScrollView style={styles.tournamentList}>
          <Text style={styles.sectionTitle}>Selecciona un torneo:</Text>
          {mockTournaments.map(tournament => (
            <TouchableOpacity
              key={tournament.id}
              style={styles.tournamentCard}
              onPress={() => setSelectedTournament(tournament)}
              accessibilityRole="button"
              accessibilityLabel={`Seleccionar torneo ${tournament.name}`}
              accessibilityHint={`Abre el chat del torneo ${tournament.name} con ${tournament.participants} participantes`}
            >
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentDetails}>
                  📅 {tournament.date} | 🎮 {tournament.mode} | 🏆 {tournament.prize}
                </Text>
                <Text style={styles.participantCount}>
                  👥 {tournament.participants} participantes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#f97316" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Notificaciones */}
        {notifications.map(notification => (
          <View key={notification.id} style={[
            styles.notification,
            notification.type === 'error' && styles.notificationError,
            notification.type === 'warning' && styles.notificationWarning,
            notification.type === 'info' && styles.notificationInfo
          ]}>
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        ))}

        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            onPress={() => setSelectedTournament(null)}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la lista de torneos"
          >
            <Ionicons name="arrow-back" size={24} color="#f97316" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowChannelList(!showChannelList)}
            style={styles.channelButton}
          >
            <Text style={styles.channelName}>#{selectedChannel.name}</Text>
            <Ionicons name={showChannelList ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.tournamentInfo}>
            <View style={styles.liveIndicator} />
            <View>
              <Text style={styles.tournamentTitle}>{selectedTournament.name}</Text>
              <Text style={styles.participantInfo}>
                👥 {selectedTournament.participants} participantes
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowUserList(!showUserList)}
            style={styles.userListButton}
          >
            <Ionicons name="people" size={20} color="#64748b" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setShowCommands(!showCommands)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Comandos de chat"
              accessibilityHint="Muestra los comandos disponibles"
            >
              <Ionicons name="terminal" size={20} color="#f97316" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowTemplateModal(true)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Mensajes de plantilla"
              accessibilityHint="Abre el modal para enviar mensajes predefinidos"
            >
              <Ionicons name="chatbubbles" size={20} color="#f97316" />
            </TouchableOpacity>
            
            {(currentUserRole === 'Moderator' || currentUserRole === 'Organizer') && (
              <TouchableOpacity 
                onPress={() => setIsChatLocked(!isChatLocked)}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={isChatLocked ? "Desbloquear chat" : "Bloquear chat"}
                accessibilityHint={isChatLocked ? "Permite que los usuarios escriban mensajes" : "Impide que los usuarios escriban mensajes"}
              >
                <Ionicons 
                  name={isChatLocked ? "lock-closed" : "lock-open"} 
                  size={20} 
                  color={isChatLocked ? "#ef4444" : "#f97316"} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Channel List */}
        {showChannelList && (
          <View style={styles.channelListContainer}>
            <Text style={styles.channelListTitle}>Canales</Text>
            {channels.map(channel => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelItem,
                  selectedChannel.id === channel.id && styles.selectedChannelItem
                ]}
                onPress={() => handleChannelSwitch(channel)}
              >
                <Text style={styles.channelItemIcon}>{channel.type === 'voice' ? '🔊' : '#'}</Text>
                <Text style={[
                  styles.channelItemName,
                  selectedChannel.id === channel.id && styles.selectedChannelName
                ]}>{channel.name}</Text>
                {unreadMessages[channel.id] > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{unreadMessages[channel.id]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* User List */}
        {showUserList && (
          <View style={styles.userListContainer}>
            <Text style={styles.userListTitle}>Usuarios en línea ({mockParticipants.filter(p => p.isOnline).length})</Text>
            {mockParticipants.filter(p => p.isOnline).map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItem}
                onPress={() => setShowUserProfile(user)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: user.status.status === 'online' ? '#22c55e' : user.status.status === 'idle' ? '#f59e0b' : '#6b7280' }
                  ]} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.nickname || user.name}</Text>
                  <Text style={styles.userRole}>{user.role}</Text>
                </View>
                {user.badges && user.badges.length > 0 && (
                  <View style={styles.userBadges}>
                    {user.badges.slice(0, 2).map((badge, index) => (
                      <Text key={index} style={styles.badge}>{badge}</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} está escribiendo...`
                : `${typingUsers.slice(0, -1).join(', ')} y ${typingUsers[typingUsers.length - 1]} están escribiendo...`
              }
            </Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          onContentSizeChange={scrollToBottom}
        />

        {/* Commands Panel */}
        {showCommands && (
          <View style={styles.commandsContainer}>
            <View style={styles.commandsHeader}>
              <Text style={styles.commandsTitle}>Comandos Disponibles</Text>
              <TouchableOpacity onPress={() => setShowCommands(false)}>
                <Ionicons name="close" size={20} color="#f97316" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commandsList}>
              {chatCommands.map((cmd, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.commandItem}
                  onPress={() => {
                    setNewMessage(cmd.command + ' ');
                    setShowCommands(false);
                  }}
                >
                  <Text style={styles.commandText}>{cmd.command}</Text>
                  <Text style={styles.commandDescription}>{cmd.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mentions Popup */}
        {showMentions && (
          <View style={styles.mentionsContainer}>
            <ScrollView style={styles.mentionsList}>
              {filteredParticipants.map(participant => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.mentionItem}
                  onPress={() => handleMention(participant)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mencionar a ${participant.name}`}
                  accessibilityHint={`Agrega @${participant.name} al mensaje`}
                >
                  <View style={styles.mentionInfo}>
                    <Text style={styles.mentionName}>@{participant.name}</Text>
                    <Text style={styles.mentionRole}>{getRoleIcon(participant.role)} {participant.role}</Text>
                    {participant.teamName && (
                      <Text style={styles.mentionTeam}>🏆 {participant.teamName}</Text>
                    )}
                  </View>
                  <View style={[styles.onlineIndicator, { backgroundColor: participant.isOnline ? '#10b981' : '#6b7280' }]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Role Selector */}
        <View style={styles.roleSelector}>
          <Text style={styles.roleSelectorLabel}>Tu rol:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleOptions}>
            {['Participant', 'Spectator', 'Moderator', 'VIP', 'Organizer'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  currentUserRole === role && styles.selectedRole
                ]}
                onPress={() => setCurrentUserRole(role as any)}
              >
                <Text style={[
                  styles.roleOptionText,
                  currentUserRole === role && styles.selectedRoleText
                ]}>
                  {getRoleIcon(role)} {role}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reply Indicator */}
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <View style={styles.replyInfo}>
              <Text style={styles.replyLabel}>Respondiendo a {replyingTo.sender}:</Text>
              <Text style={styles.replyPreview} numberOfLines={1}>{replyingTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Attachment Buttons */}
          <View style={styles.attachmentButtons}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleFileUpload}
              disabled={isChatLocked}
            >
              <Ionicons name="attach" size={20} color={isChatLocked ? "#64748b" : "#f97316"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleImageUpload}
              disabled={isChatLocked}
            >
              <Ionicons name="image" size={20} color={isChatLocked ? "#64748b" : "#f97316"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={() => setShowPollModal(true)}
              disabled={isChatLocked}
            >
              <Ionicons name="bar-chart" size={20} color={isChatLocked ? "#64748b" : "#f97316"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={() => setShowGifPicker(true)}
              disabled={isChatLocked}
            >
              <Text style={[styles.gifText, isChatLocked && styles.disabledText]}>GIF</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[
              styles.textInput,
              isChatLocked && styles.lockedInput
            ]}
            value={newMessage}
            onChangeText={handleInputChange}
            placeholder={isChatLocked ? "Chat bloqueado" : "Escribe un mensaje... (usa / para comandos)"}
            placeholderTextColor="#64748b"
            multiline
            editable={!isChatLocked}
            accessibilityLabel="Campo de mensaje"
            accessibilityHint={isChatLocked ? "El chat está bloqueado" : "Escribe tu mensaje aquí"}
          />
          
          {/* Voice Recording Button */}
          <TouchableOpacity 
            style={[
              styles.voiceButton,
              isRecordingVoice && styles.recordingButton
            ]}
            onPressIn={startVoiceRecording}
            onPressOut={stopVoiceRecording}
            disabled={isChatLocked}
          >
            <Ionicons 
              name={isRecordingVoice ? "stop" : "mic"} 
              size={20} 
              color={isRecordingVoice ? "#ef4444" : (isChatLocked ? "#64748b" : "#f97316")} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() || isChatLocked) && styles.disabledButton
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isChatLocked}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityHint={isChatLocked ? "Chat bloqueado" : "Envía el mensaje al chat"}
            accessibilityState={{ disabled: !newMessage.trim() || isChatLocked }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Template Modal */}
        <Modal
          visible={showTemplateModal}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enviar Mensaje de Información</Text>
                <TouchableOpacity 
                  onPress={() => setShowTemplateModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar modal"
                  accessibilityHint="Cierra el modal de mensajes de plantilla"
                >
                  <Ionicons name="close" size={24} color="#f97316" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Mensaje personalizado</Text>
                <Switch
                  value={isCustomMode}
                  onValueChange={setIsCustomMode}
                  trackColor={{ false: '#374151', true: '#f97316' }}
                  thumbColor={isCustomMode ? '#ffffff' : '#9ca3af'}
                  accessibilityLabel="Modo mensaje personalizado"
                  accessibilityHint={isCustomMode ? "Desactiva para usar plantillas predefinidas" : "Activa para escribir un mensaje personalizado"}
                />
              </View>
              
              {isCustomMode ? (
                <TextInput
                  style={styles.customMessageInput}
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder="Escribe tu mensaje aquí..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  accessibilityLabel="Mensaje personalizado"
                  accessibilityHint="Escribe tu mensaje personalizado para enviar al chat"
                />
              ) : (
                <ScrollView style={styles.templatesList}>
                  {messageTemplates.map(template => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateItem,
                        selectedTemplate === template.id && styles.selectedTemplate
                      ]}
                      onPress={() => setSelectedTemplate(template.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Plantilla ${template.title}`}
                      accessibilityHint={`Selecciona la plantilla: ${template.content}`}
                      accessibilityState={{ selected: selectedTemplate === template.id }}
                    >
                      <Text style={styles.templateTitle}>{template.title}</Text>
                      <Text style={styles.templateContent}>{template.content}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              
              <TouchableOpacity
                style={[
                  styles.sendTemplateButton,
                  (!selectedTemplate && !isCustomMode) || (isCustomMode && !customMessage.trim()) 
                    ? styles.disabledButton : {}
                ]}
                onPress={handleSendTemplate}
                disabled={(!selectedTemplate && !isCustomMode) || (isCustomMode && !customMessage.trim())}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje de plantilla"
                accessibilityHint={isCustomMode ? "Envía el mensaje personalizado" : "Envía la plantilla seleccionada"}
                accessibilityState={{ disabled: (!selectedTemplate && !isCustomMode) || (isCustomMode && !customMessage.trim()) }}
              >
                <Text style={styles.sendTemplateButtonText}>Enviar Mensaje</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Poll Modal */}
        <Modal
          visible={showPollModal}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Crear Encuesta</Text>
                <TouchableOpacity onPress={() => setShowPollModal(false)}>
                  <Ionicons name="close" size={24} color="#f97316" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.pollInput}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                placeholder="¿Cuál es tu pregunta?"
                placeholderTextColor="#64748b"
                multiline
              />
              
              {pollOptions.map((option, index) => (
                <TextInput
                  key={index}
                  style={styles.pollInput}
                  value={option}
                  onChangeText={(text) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = text;
                    setPollOptions(newOptions);
                  }}
                  placeholder={`Opción ${index + 1}`}
                  placeholderTextColor="#64748b"
                />
              ))}
              
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={() => setPollOptions([...pollOptions, ''])}
              >
                <Text style={styles.addOptionText}>+ Agregar opción</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.createPollButton}
                onPress={createPoll}
              >
                <Text style={styles.createPollText}>Crear Encuesta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f97316',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tournamentList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 15,
  },
  tournamentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  tournamentDetails: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 12,
    color: '#f97316',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1e293b',
  },
  backButton: {
    marginRight: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  participantInfo: {
    fontSize: 12,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  systemMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemMessageText: {
    color: '#f97316',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  adminName: {
    color: '#fbbf24',
  },
  timestamp: {
    fontSize: 10,
    color: '#64748b',
  },
  messageText: {
    fontSize: 14,
    color: 'white',
  },
  mentionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  mentionsList: {
    maxHeight: 150,
  },
  mentionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  mentionName: {
    color: '#f97316',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1e293b',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    maxHeight: 100,
    marginRight: 12,
  },
  lockedInput: {
    backgroundColor: '#4b5563',
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: '#f97316',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    color: '#f97316',
    fontSize: 16,
  },
  customMessageInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  templatesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  templateItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#f97316',
  },
  templateTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateContent: {
    color: '#94a3b8',
    fontSize: 14,
  },
  sendTemplateButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  sendTemplateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Nuevos estilos para características avanzadas
  announcementMessage: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: '#451a03',
  },
  announcementText: {
    fontWeight: '600',
    color: '#fbbf24',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleTag: {
    fontSize: 10,
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    overflow: 'hidden',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButton: {
    marginLeft: 8,
    padding: 4,
  },
  replyContainer: {
    backgroundColor: '#4b5563',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  replyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  reactionButton: {
    backgroundColor: '#4b5563',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  reactionText: {
    color: 'white',
    fontSize: 12,
  },
  commandsContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#f97316',
    zIndex: 1000,
  },
  commandsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  commandsTitle: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
  },
  commandsList: {
    maxHeight: 250,
  },
  commandItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  commandText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commandDescription: {
    color: '#94a3b8',
    fontSize: 12,
  },
  mentionInfo: {
    flex: 1,
  },
  mentionRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  mentionTeam: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleSelector: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  roleSelectorLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
  },
  roleOption: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedRole: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  roleOptionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedRoleText: {
    color: 'white',
    fontWeight: '600',
  },
  replyIndicator: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  replyInfo: {
    flex: 1,
  },
  replyLabel: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '600',
  },
  replyPreview: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  // Nuevos estilos para funcionalidades Discord
  notification: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  notificationError: {
    backgroundColor: '#ef4444',
  },
  notificationWarning: {
    backgroundColor: '#f59e0b',
  },
  notificationInfo: {
    backgroundColor: '#3b82f6',
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 6,
    marginHorizontal: 8,
  },
  channelName: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  userListButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  channelListContainer: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingVertical: 8,
  },
  channelListTitle: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedChannelItem: {
    backgroundColor: '#374151',
  },
  channelItemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  channelItemName: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
  },
  selectedChannelName: {
    color: '#f97316',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userListContainer: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingVertical: 8,
    maxHeight: 200,
  },
  userListTitle: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111827',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '500',
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 12,
  },
  userBadges: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#374151',
    color: '#f97316',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  typingContainer: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  typingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  attachmentButtons: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachmentButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  gifText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledText: {
    color: '#64748b',
  },
  voiceButton: {
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  pollInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#f3f4f6',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  addOptionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addOptionText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  createPollButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createPollText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});