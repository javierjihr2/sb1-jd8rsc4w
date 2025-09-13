import * as React from 'react';
import { useState, useEffect, Fragment, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContextSimple';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Tournament } from '../../lib/types';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import ResponsiveList from '../../components/ResponsiveList';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import InteractiveBracket from '../../components/InteractiveBracket';
import LiveStats from '../../components/LiveStats';
import StreamingIntegration from '../../components/StreamingIntegration';
import AdvancedTournamentCreator from '../../components/AdvancedTournamentCreator';
import TournamentTicketSystem from '../../components/TournamentTicketSystem';
import TournamentPermissionManager from '../../components/TournamentPermissionManager';
import TournamentNotificationSystem from '../../components/TournamentNotificationSystem';
import TournamentAdminPanel from '../../components/TournamentAdminPanel';
import TournamentInvitationSystem from '../../components/TournamentInvitationSystem';


interface ExtendedTournament extends Omit<Tournament, 'tournamentType'> {
  registrationDeadline?: Date;
  mapType?: 'Erangel' | 'Miramar' | 'Sanhok' | 'Vikendi' | 'Livik' | 'Karakin';
  tournamentType?: 'Eliminación' | 'Liga' | 'Battle Royale' | 'Arena' | 'Escuadra' | 'Dúo' | 'Solo' | 'Individual';
  imageUrl?: string;
  prizes?: {
    position: string;
    prize: string;
    percentage: number;
  }[];
  organizer?: {
    name: string;
    verified: boolean;
    logo?: string;
  };
  // Nuevas características avanzadas
  format?: 'Swiss' | 'Round Robin' | 'Single Elimination' | 'Double Elimination' | 'Group Stage';
  rounds?: number;
  currentRound?: number;
  streamUrl?: string;
  discordServer?: string;
  sponsors?: {
    name: string;
    logo: string;
    tier: 'Title' | 'Main' | 'Supporting';
  }[];
  schedule?: {
    phase: string;
    startTime: Date;
    endTime: Date;
    description: string;
  }[];
  brackets?: {
    round: number;
    matches: Match[];
  }[];
  leaderboard?: {
    teamId: string;
    teamName: string;
    points: number;
    kills: number;
    placement: number;
    matchesPlayed: number;
  }[];
  chatSettings?: {
    enabled: boolean;
    moderationLevel: 'Low' | 'Medium' | 'High';
    allowedRoles: string[];
    bannedWords: string[];
    slowMode: number;
  };
  statistics?: {
    totalKills: number;
    averageKills: number;
    longestKill: number;
    mostKillsInMatch: number;
    topFragger: string;
  };
  discordSettings?: {
    autoCreateChannels: boolean;
    autoCreateRoles: boolean;
    welcomeMessage: string;
    rulesChannel: string;
    announcementsChannel: string;
    resultsChannel: string;
  };
}

interface Team {
  id: string;
  name: string;
  captain: string;
  members: string[];
  rank: string;
  averageKD: number;
  logo?: string;
}

interface Match {
  id: string;
  tournamentId: string;
  round: number;
  team1: Team;
  team2: Team;
  winner?: Team;
  score?: string;
  scheduledTime: Date;
  status: 'scheduled' | 'live' | 'completed';
}

const mockTournaments: ExtendedTournament[] = [
  {
    id: '1',
    name: 'PMGC 2024 - Clasificatorias',
    description: 'Clasificatorias oficiales para el Campeonato Mundial de PUBG Mobile 2024',
    date: '2024-02-15',
    time: '18:00',
    prize: '$50,000',
    mode: 'Escuadra',
    status: 'Abierto',
    region: 'S.A.',
    type: 'Competitivo',
    participants: [],
    teams: [],
    createdBy: 'system',
    createdAt: new Date(),
    creatorId: 'system',
    entryFee: 'Gratis',
    entryFeeType: 'Gratis',
     prizePool: '$50,000',
     prizeType: 'Dinero',
     server: 'Sur América',
     maxParticipants: 64,
     registrationDeadline: new Date('2024-02-10'),
     mapType: 'Erangel',
     tournamentType: 'Liga',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    rules: [
      'Equipos de 4 jugadores',
      'Mínimo rango Corona',
      'Sin uso de hacks o cheats',
      'Comunicación en Discord obligatoria',
      'Streaming permitido con delay de 3 minutos'
    ],
    prizes: [
      { position: '1er Lugar', prize: '$20,000', percentage: 40 },
      { position: '2do Lugar', prize: '$15,000', percentage: 30 },
      { position: '3er Lugar', prize: '$10,000', percentage: 20 },
      { position: '4to-8vo Lugar', prize: '$1,250 c/u', percentage: 10 }
    ],
    organizer: {
      name: 'PUBG Mobile Esports',
      verified: true,
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100'
    },
    // Nuevas características avanzadas
    format: 'Group Stage',
    rounds: 6,
    currentRound: 2,
    streamUrl: 'https://twitch.tv/pubgmobile_esports',
    discordServer: 'https://discord.gg/pmgc2024',
    sponsors: [
      { name: 'Red Bull', logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=50', tier: 'Title' },
      { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=50', tier: 'Main' },
      { name: 'HyperX', logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=50', tier: 'Supporting' }
    ],
    schedule: [
      { phase: 'Registro', startTime: new Date('2024-02-01T00:00:00'), endTime: new Date('2024-02-10T23:59:59'), description: 'Período de registro de equipos' },
      { phase: 'Fase de Grupos', startTime: new Date('2024-02-15T18:00:00'), endTime: new Date('2024-02-17T22:00:00'), description: 'Partidas de clasificación' },
      { phase: 'Playoffs', startTime: new Date('2024-02-20T19:00:00'), endTime: new Date('2024-02-22T23:00:00'), description: 'Eliminatorias finales' }
    ],
    leaderboard: [
      { teamId: 'team1', teamName: 'Alpha Wolves', points: 156, kills: 89, placement: 1, matchesPlayed: 6 },
      { teamId: 'team2', teamName: 'Phoenix Squad', points: 142, kills: 76, placement: 2, matchesPlayed: 6 },
      { teamId: 'team3', teamName: 'Thunder Bolts', points: 138, kills: 82, placement: 3, matchesPlayed: 6 }
    ],
    settings: {
      autoCreateChannels: true,
      autoAssignRoles: true,
      allowInvites: true,
      moderationLevel: 'high',
      autoModeration: true,
      welcomeMessage: 'Bienvenido al torneo PMGC 2024',
      rulesChannelId: '',
      announcementsChannelId: '',
      generalChannelId: ''
    },
    chatSettings: {
      enabled: true,
      moderationLevel: 'High',
      allowedRoles: ['Participant', 'Moderator', 'Admin'],
      bannedWords: ['hack', 'cheat', 'noob'],
      slowMode: 5
    },
    statistics: {
      totalKills: 1247,
      averageKills: 12.4,
      longestKill: 487,
      mostKillsInMatch: 28,
      topFragger: 'ProSniper_SA'
    },
    channels: [],
    roles: [],
    tickets: [],
    invites: [],
    announcements: [],
    discordSettings: {
      autoCreateChannels: true,
      autoCreateRoles: true,
      welcomeMessage: 'Bienvenido al torneo PMGC 2024',
      rulesChannel: '',
      announcementsChannel: '',
      resultsChannel: ''
    },
    moderators: [],
    bannedUsers: [],
    mutedUsers: []
  },
  {
    id: '2',
    name: 'Arena Masters Cup',
    description: 'Torneo de Arena con eliminación directa - Solo los mejores sobreviven',
    date: '2024-02-12',
    time: '20:00',
    prize: '$5,000',
    mode: 'Escuadra',
    status: 'En Progreso',
    region: 'S.A.',
    type: 'Competitivo',
    participants: [],
    teams: [],
    createdBy: 'system',
    createdAt: new Date(),
    creatorId: 'system',
    entryFee: '$15',
    entryFeeType: 'Pago',
     prizePool: '$5,000',
     prizeType: 'Dinero',
     server: 'Sur América',
     maxParticipants: 32,
     registrationDeadline: new Date('2024-02-11'),
     mapType: 'Livik',
     tournamentType: 'Arena',
    imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
    rules: [
      'Modo Arena únicamente',
      'Partidas de 10 minutos',
      'Eliminación directa',
      'Armas predefinidas',
      'Sin revivir compañeros'
    ],
    prizes: [
      { position: '1er Lugar', prize: '$2,500', percentage: 50 },
      { position: '2do Lugar', prize: '$1,500', percentage: 30 },
      { position: '3er Lugar', prize: '$1,000', percentage: 20 }
    ],
    organizer: {
      name: 'Arena Pro League',
      verified: true
    },
    // Características avanzadas para Arena
    format: 'Single Elimination',
    rounds: 5,
    currentRound: 3,
    streamUrl: 'https://youtube.com/arenaleague',
    discordServer: 'https://discord.gg/arenacup',
    sponsors: [
      { name: 'Razer', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=50', tier: 'Title' },
      { name: 'ASUS ROG', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=50', tier: 'Main' }
    ],
    schedule: [
      { phase: 'Cuartos de Final', startTime: new Date('2024-02-12T20:00:00'), endTime: new Date('2024-02-12T21:30:00'), description: 'Eliminación de 8 equipos' },
      { phase: 'Semifinales', startTime: new Date('2024-02-12T21:45:00'), endTime: new Date('2024-02-12T22:30:00'), description: 'Últimos 4 equipos' },
      { phase: 'Final', startTime: new Date('2024-02-12T22:45:00'), endTime: new Date('2024-02-12T23:30:00'), description: 'Gran Final' }
    ],
    leaderboard: [
      { teamId: 'arena1', teamName: 'Lightning Strike', points: 89, kills: 45, placement: 1, matchesPlayed: 3 },
      { teamId: 'arena2', teamName: 'Rapid Fire', points: 76, kills: 38, placement: 2, matchesPlayed: 3 },
      { teamId: 'arena3', teamName: 'Storm Breakers', points: 71, kills: 42, placement: 3, matchesPlayed: 3 }
    ],
    settings: {
      autoCreateChannels: false,
      autoAssignRoles: false,
      allowInvites: true,
      moderationLevel: 'medium',
      autoModeration: false,
      welcomeMessage: 'Bienvenido al Arena Masters Cup',
      rulesChannelId: '',
      announcementsChannelId: '',
      generalChannelId: ''
    },
    chatSettings: {
      enabled: true,
      moderationLevel: 'Medium',
      allowedRoles: ['Participant', 'Spectator', 'Moderator'],
      bannedWords: ['lag', 'cheater'],
      slowMode: 3
    },
    statistics: {
      totalKills: 234,
      averageKills: 8.2,
      longestKill: 156,
      mostKillsInMatch: 15,
      topFragger: 'ArenaKing_BR'
    },
    channels: [],
    roles: [],
    tickets: [],
    invites: [],
    announcements: [],
    discordSettings: {
      autoCreateChannels: false,
      autoCreateRoles: false,
      welcomeMessage: 'Bienvenido al Arena Masters Cup',
      rulesChannel: '',
      announcementsChannel: '',
      resultsChannel: ''
    },
    moderators: [],
    bannedUsers: [],
    mutedUsers: []
  },
  {
    id: '3',
    name: 'Sanhok Speed Run',
    description: 'Competencia de velocidad en el mapa más rápido de PUBG Mobile',
    date: '2024-02-20',
    time: '19:00',
    prize: '$8,000',
    mode: 'Dúo',
    status: 'Abierto',
    region: 'S.A.',
    type: 'Competitivo',
    participants: [],
    teams: [],
    createdBy: 'system',
    createdAt: new Date(),
    creatorId: 'system',
    entryFee: '$20',
    entryFeeType: 'Pago',
     prizePool: '$8,000',
     prizeType: 'Dinero',
     server: 'Sur América',
     maxParticipants: 48,
     registrationDeadline: new Date('2024-02-18'),
     mapType: 'Sanhok',
     tournamentType: 'Battle Royale',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    rules: [
      'Solo mapa Sanhok',
      'Partidas de 20 minutos máximo',
      'Modo Duo únicamente',
      'Puntuación por kills y posición',
      'Mínimo 3 partidas por equipo'
    ],
    prizes: [
      { position: '1er Lugar', prize: '$4,000', percentage: 50 },
      { position: '2do Lugar', prize: '$2,400', percentage: 30 },
      { position: '3er Lugar', prize: '$1,600', percentage: 20 }
    ],
    organizer: {
      name: 'Speed Gaming',
      verified: false
    },
    // Características avanzadas para Speed Run
    format: 'Swiss',
    rounds: 4,
    currentRound: 1,
    streamUrl: 'https://twitch.tv/speedgaming',
    discordServer: 'https://discord.gg/sanhokspeed',
    sponsors: [
      { name: 'Monster Energy', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=50', tier: 'Title' },
      { name: 'SteelSeries', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=50', tier: 'Supporting' }
    ],
    schedule: [
      { phase: 'Calentamiento', startTime: new Date('2024-02-20T18:30:00'), endTime: new Date('2024-02-20T19:00:00'), description: 'Partidas de práctica' },
      { phase: 'Ronda 1-2', startTime: new Date('2024-02-20T19:00:00'), endTime: new Date('2024-02-20T20:30:00'), description: 'Primeras dos rondas' },
      { phase: 'Ronda 3-4', startTime: new Date('2024-02-20T21:00:00'), endTime: new Date('2024-02-20T22:30:00'), description: 'Rondas finales' }
    ],
    leaderboard: [
      { teamId: 'speed1', teamName: 'Velocity Duo', points: 0, kills: 0, placement: 1, matchesPlayed: 0 },
      { teamId: 'speed2', teamName: 'Rush Masters', points: 0, kills: 0, placement: 2, matchesPlayed: 0 },
      { teamId: 'speed3', teamName: 'Quick Strike', points: 0, kills: 0, placement: 3, matchesPlayed: 0 }
    ],
    settings: {
      autoCreateChannels: true,
      autoAssignRoles: true,
      allowInvites: false,
      moderationLevel: 'low',
      autoModeration: true,
      welcomeMessage: 'Bienvenido al Sanhok Speed Run',
      rulesChannelId: '',
      announcementsChannelId: '',
      generalChannelId: ''
    },
    chatSettings: {
      enabled: true,
      moderationLevel: 'Low',
      allowedRoles: ['Participant', 'Spectator', 'Moderator', 'VIP'],
      bannedWords: ['noob', 'trash'],
      slowMode: 2
    },
    statistics: {
      totalKills: 0,
      averageKills: 0,
      longestKill: 0,
      mostKillsInMatch: 0,
      topFragger: 'TBD'
    },
    channels: [],
    roles: [],
    tickets: [],
    invites: [],
    announcements: [],
    discordSettings: {
      autoCreateChannels: true,
      autoCreateRoles: true,
      welcomeMessage: 'Bienvenido al Sanhok Speed Run',
      rulesChannel: '',
      announcementsChannel: '',
      resultsChannel: ''
    },
    moderators: [],
    bannedUsers: [],
    mutedUsers: []
  }
];

export default function Tournaments() {
  const { user, profile } = useAuth();
  const { isTablet, isLandscape } = useDeviceInfo();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<ExtendedTournament[]>(mockTournaments);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamRegistrationModal, setShowTeamRegistrationModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<ExtendedTournament | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'ongoing' | 'completed'>('all');
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 16,
    entryFee: 0,
    prizePool: 0
  });
  
  // Estados para funcionalidades avanzadas
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [selectedTournamentForFeatures, setSelectedTournamentForFeatures] = useState<ExtendedTournament | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'stats' | 'stream'>('overview');
  
  // Estados para el sistema de tickets
  const [showTicketSystem, setShowTicketSystem] = useState(false);
  const [selectedTournamentForTickets, setSelectedTournamentForTickets] = useState<ExtendedTournament | null>(null);
  const [tournamentTickets, setTournamentTickets] = useState<{[tournamentId: string]: any[]}>({});
  
  // Estados para el sistema de permisos
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [selectedTournamentForPermissions, setSelectedTournamentForPermissions] = useState<ExtendedTournament | null>(null);
  
  // Estados del sistema de notificaciones
  const [showNotificationSystem, setShowNotificationSystem] = useState(false);
  const [selectedTournamentForNotifications, setSelectedTournamentForNotifications] = useState<ExtendedTournament | null>(null);

  // Estados del panel de administración
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedTournamentForAdmin, setSelectedTournamentForAdmin] = useState<ExtendedTournament | null>(null);

  // Estados del sistema de invitaciones
  const [showInvitationSystem, setShowInvitationSystem] = useState(false);
  const [selectedTournamentForInvitations, setSelectedTournamentForInvitations] = useState<ExtendedTournament | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          date: data.date || '',
          prize: data.prize || data.prizePool || '0',
          mode: data.mode || 'Escuadra',
          status: data.status || 'Abierto',
          region: data.region || 'S.A.',
          type: data.type || 'Competitivo',
          description: data.description || '',
          participants: data.participants || [],
          createdBy: data.createdBy || data.creatorId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          creatorId: data.creatorId || '',
          entryFee: data.entryFee || '0',
          prizePool: data.prizePool || '0',
          maxParticipants: data.maxParticipants || 16
        };
      }) as ExtendedTournament[];
      
      setTournaments(tournamentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const createTournament = useCallback(async (tournamentData: any) => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para crear un torneo');
      return;
    }

    try {
      await addDoc(collection(db, 'tournaments'), {
        name: tournamentData.name,
        description: tournamentData.description,
        maxParticipants: tournamentData.maxParticipants,
        entryFeeType: tournamentData.entryFeeType,
        entryFeeAmount: tournamentData.entryFeeAmount,
        prizeType: tournamentData.prizeType,
        prizeAmount: tournamentData.prizeAmount,
        tournamentType: tournamentData.tournamentType,
        server: tournamentData.server,
        date: tournamentData.date,
        time: tournamentData.time,
        participants: [],
        teams: [],
        createdBy: user.uid,
        creatorId: user.uid,
        createdAt: new Date(),
        // Campos de compatibilidad con la estructura anterior
        entryFee: tournamentData.entryFeeType === 'Pago' ? tournamentData.entryFeeAmount.toString() : '0',
        prizePool: tournamentData.prizeType === 'Dinero' ? tournamentData.prizeAmount.toString() : '0',
        prize: tournamentData.prizeType === 'Dinero' ? tournamentData.prizeAmount.toString() : '0',
        mode: tournamentData.tournamentType,
        status: 'Abierto',
        region: 'S.A.',
        type: 'Competitivo'
      });

      Alert.alert('Éxito', 'Torneo creado exitosamente');
    } catch (error) {
      console.error('Error creando torneo:', error);
      Alert.alert('Error', 'No se pudo crear el torneo');
    }
  }, [user]);

  const joinTournament = useCallback(async (tournament: ExtendedTournament) => {
    if (!user) return;
    
    const tournamentType = tournament.tournamentType || tournament.mode || 'Escuadra';
    
    // Para torneos individuales, registrar directamente sin modal de equipo
    if (tournamentType === 'Solo') {
      try {
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        await updateDoc(tournamentRef, {
          participants: arrayUnion(user.uid)
        });
        
        // Update local state
        setTournaments(prev => prev.map(t => 
          t.id === tournament.id 
            ? { ...t, participants: [...t.participants, user.uid] }
            : t
        ));
        
        Alert.alert('¡Éxito!', 'Te has registrado exitosamente en el torneo individual');
      } catch (error) {
        console.error('Error joining individual tournament:', error);
        Alert.alert('Error', 'No se pudo unir al torneo');
      }
    } else {
      // Para torneos de equipo, abrir modal de registro
      setSelectedTournament(tournament);
      setShowTeamRegistrationModal(true);
    }
  }, [user, setTournaments, setSelectedTournament, setShowTeamRegistrationModal]);

  const registerTeam = useCallback(async (teamData: any) => {
    if (!user || !selectedTournament) return;
    
    try {
      const tournamentRef = doc(db, 'tournaments', selectedTournament.id);
      const teamWithId = {
        ...teamData,
        id: `${selectedTournament.id}_${user.uid}_${Date.now()}`,
        registeredAt: new Date(),
        status: 'registered'
      };
      
      await updateDoc(tournamentRef, {
        teams: arrayUnion(teamWithId),
        participants: arrayUnion(user.uid)
      });
      
      // Update local state
      setTournaments(prev => prev.map(tournament => 
        tournament.id === selectedTournament.id 
          ? { 
              ...tournament, 
              teams: [...(tournament.teams || []), teamWithId],
              participants: [...tournament.participants, user.uid] 
            }
          : tournament
      ));
      
      Alert.alert('Éxito', 'Equipo registrado exitosamente en el torneo');
    } catch (error) {
      console.error('Error registering team:', error);
      Alert.alert('Error', 'No se pudo registrar el equipo');
    }
  }, [user, selectedTournament, setTournaments]);

  const leaveTournament = useCallback(async (tournamentId: string, tournamentType?: string | undefined) => {
    if (!user) return;

    const type = tournamentType || 'Escuadra';
    const isIndividual = type === 'Solo';

    Alert.alert(
      'Confirmar salida',
      `¿Estás seguro de que quieres salir de este torneo ${isIndividual ? 'individual' : 'de equipos'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              const tournamentRef = doc(db, 'tournaments', tournamentId);
              
              if (isIndividual) {
                // Para torneos individuales, solo remover de participantes
                await updateDoc(tournamentRef, {
                  participants: arrayRemove(user.uid)
                });
              } else {
                // Para torneos de equipo, remover del equipo y de participantes
                const tournament = tournaments.find(t => t.id === tournamentId);
                if (tournament?.teams) {
                  const userTeam = tournament.teams.find((team: any) => 
                    team.members?.some((member: any) => member.id === user.uid)
                  );
                  
                  if (userTeam) {
                    await updateDoc(tournamentRef, {
                      teams: arrayRemove(userTeam),
                      participants: arrayRemove(user.uid)
                    });
                  }
                } else {
                  await updateDoc(tournamentRef, {
                    participants: arrayRemove(user.uid)
                  });
                }
              }
              
              Alert.alert('Éxito', 'Has salido del torneo exitosamente');
            } catch (error) {
              console.error('Error saliendo del torneo:', error);
              Alert.alert('Error', 'No se pudo salir del torneo');
            }
          }
        }
      ]
    );
  }, [user, tournaments]);

  const handleCreateAdvancedTournament = useCallback(async (tournamentData: any) => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para crear un torneo');
      return;
    }

    try {
      // Crear canales automáticos si están habilitados
      const channels = [];
      if (tournamentData.autoChannels.general) {
        channels.push({
          id: `general-${Date.now()}`,
          name: 'general',
          type: 'text',
          description: 'Canal general del torneo',
          permissions: {
            everyone: ['view', 'send_messages', 'read_history'],
            moderators: ['view', 'send_messages', 'read_history', 'manage_messages'],
            organizers: ['view', 'send_messages', 'read_history', 'manage_messages', 'manage_channel']
          },
          createdAt: new Date()
        });
      }
      
      if (tournamentData.autoChannels.announcements) {
        channels.push({
          id: `announcements-${Date.now()}`,
          name: 'anuncios',
          type: 'text',
          description: 'Canal de anuncios oficiales',
          permissions: {
            everyone: ['view', 'read_history'],
            moderators: ['view', 'send_messages', 'read_history'],
            organizers: ['view', 'send_messages', 'read_history', 'manage_messages', 'manage_channel']
          },
          createdAt: new Date()
        });
      }
      
      if (tournamentData.autoChannels.results) {
        channels.push({
          id: `results-${Date.now()}`,
          name: 'resultados',
          type: 'text',
          description: 'Canal de resultados y estadísticas',
          permissions: {
            everyone: ['view', 'read_history'],
            moderators: ['view', 'send_messages', 'read_history'],
            organizers: ['view', 'send_messages', 'read_history', 'manage_messages', 'manage_channel']
          },
          createdAt: new Date()
        });
      }
      
      // Crear roles automáticos si están habilitados
      const roles = [];
      if (tournamentData.autoRoles.participant) {
        roles.push({
          id: `participant-${Date.now()}`,
          name: 'Participante',
          color: '#3b82f6',
          permissions: ['view_channels', 'send_messages', 'read_history'],
          assignedUsers: [],
          createdAt: new Date()
        });
      }
      
      if (tournamentData.autoRoles.moderator) {
        roles.push({
          id: `moderator-${Date.now()}`,
          name: 'Moderador',
          color: '#10b981',
          permissions: ['view_channels', 'send_messages', 'read_history', 'manage_messages', 'kick_users'],
          assignedUsers: [],
          createdAt: new Date()
        });
      }
      
      if (tournamentData.autoRoles.organizer) {
        roles.push({
          id: `organizer-${Date.now()}`,
          name: 'Organizador',
          color: '#f59e0b',
          permissions: ['view_channels', 'send_messages', 'read_history', 'manage_messages', 'manage_channels', 'manage_roles', 'kick_users', 'ban_users'],
          assignedUsers: [user.uid],
          createdAt: new Date()
        });
      }
      
      const fullTournamentData = {
        name: tournamentData.name,
        description: tournamentData.description,
        maxParticipants: tournamentData.maxTeams * (tournamentData.mode === 'Solo' ? 1 : tournamentData.mode === 'Dúo' ? 2 : 4),
        entryFeeType: tournamentData.entryFee > 0 ? 'Pago' : 'Gratis',
        entryFeeAmount: tournamentData.entryFee || 0,
        prizeType: tournamentData.prizePool ? 'Dinero' : 'Otro',
        prizeAmount: tournamentData.prizePool || '',
        tournamentType: tournamentData.mode,
        server: tournamentData.region || 'S.A.',
        date: tournamentData.date,
        time: tournamentData.date,
        participants: [],
        teams: [],
        createdBy: user.uid,
        creatorId: user.uid,
        createdAt: new Date(),
        // Campos de compatibilidad
        entryFee: tournamentData.entryFee?.toString() || '0',
        prizePool: tournamentData.prizePool || '0',
        prize: tournamentData.prizePool || '0',
        mode: tournamentData.mode,
        status: 'Abierto',
        region: tournamentData.region || 'S.A.',
        type: 'Competitivo',
        // Nuevas propiedades tipo Discord
        channels: channels,
        roles: roles,
        tickets: [],
        invites: [],
        announcements: [],
        discordSettings: {
          autoCreateChannels: tournamentData.autoChannels,
          autoCreateRoles: tournamentData.autoRoles,
          welcomeMessage: tournamentData.welcomeMessage || '',
          rulesChannel: channels.find(c => c.name === 'general')?.id || '',
          announcementsChannel: channels.find(c => c.name === 'anuncios')?.id || '',
          resultsChannel: channels.find(c => c.name === 'resultados')?.id || ''
        },
        rules: tournamentData.rules || [],
        registrationDeadline: tournamentData.registrationDeadline,
        settings: {
          allowSpectators: tournamentData.allowSpectators || true,
          autoStart: tournamentData.autoStart || false,
          requireApproval: tournamentData.requireApproval || false,
          enableTicketSystem: tournamentData.enableTicketSystem || false,
          enableInviteSystem: tournamentData.enableInviteSystem || false
        }
      };

      await addDoc(collection(db, 'tournaments'), fullTournamentData);
      
      Alert.alert('Éxito', 'Torneo creado exitosamente con funcionalidades tipo Discord');
      
    } catch (error) {
      console.error('Error creating advanced tournament:', error);
      Alert.alert('Error', 'No se pudo crear el torneo');
    }
  }, [user]);

  // Funciones para el sistema de tickets
  const handleOpenTicketSystem = useCallback((tournament: ExtendedTournament) => {
    setSelectedTournamentForTickets(tournament);
    setShowTicketSystem(true);
  }, []);

  const handleCloseTicketSystem = useCallback(() => {
    setShowTicketSystem(false);
    setSelectedTournamentForTickets(null);
  }, []);

  const handleTicketUpdate = useCallback((tournamentId: string, tickets: any[]) => {
    setTournamentTickets(prev => ({
      ...prev,
      [tournamentId]: tickets
    }));
  }, []);

  // Funciones para el sistema de permisos
  const handleOpenPermissionManager = useCallback((tournament: ExtendedTournament) => {
    setSelectedTournamentForPermissions(tournament);
    setShowPermissionManager(true);
  }, []);

  const handleClosePermissionManager = useCallback(() => {
    setShowPermissionManager(false);
    setSelectedTournamentForPermissions(null);
  }, []);

  const handlePermissionsUpdate = useCallback(async (permissions: any) => {
    if (!selectedTournamentForPermissions) return;
    
    try {
      const tournamentRef = doc(db, 'tournaments', selectedTournamentForPermissions.id);
      await updateDoc(tournamentRef, {
        permissions,
        updatedAt: new Date()
      });
      
      Alert.alert('Éxito', 'Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error updating permissions:', error);
      Alert.alert('Error', 'No se pudieron actualizar los permisos');
    }
  }, [selectedTournamentForPermissions]);

  // Funciones del sistema de notificaciones
  const handleOpenNotificationSystem = useCallback((tournament: ExtendedTournament) => {
    setSelectedTournamentForNotifications(tournament);
    setShowNotificationSystem(true);
  }, []);

  const handleCloseNotificationSystem = useCallback(() => {
    setShowNotificationSystem(false);
    setSelectedTournamentForNotifications(null);
  }, []);

  const handleNotificationSent = useCallback((notification: any) => {
    // Aquí se puede agregar lógica adicional cuando se envía una notificación
    console.log('Notification sent:', notification);
  }, []);

  // Funciones del panel de administración
  const handleOpenAdminPanel = useCallback((tournament: ExtendedTournament) => {
    setSelectedTournamentForAdmin(tournament);
    setShowAdminPanel(true);
  }, []);

  const handleCloseAdminPanel = useCallback(() => {
    setShowAdminPanel(false);
    setSelectedTournamentForAdmin(null);
  }, []);

  const handleAdminAction = useCallback((action: string, data: any) => {
    // Aquí se puede agregar lógica para manejar acciones de administración
    console.log('Admin action:', action, data);
  }, []);

  // Funciones del sistema de invitaciones
  const handleOpenInvitationSystem = useCallback((tournament: ExtendedTournament) => {
    setSelectedTournamentForInvitations(tournament);
    setShowInvitationSystem(true);
  }, []);

  const handleCloseInvitationSystem = useCallback(() => {
    setShowInvitationSystem(false);
    setSelectedTournamentForInvitations(null);
  }, []);

  const handleInvitationSent = useCallback((invitation: any) => {
    // Aquí se puede agregar lógica adicional cuando se envía una invitación
    console.log('Invitation sent:', invitation);
  }, []);

  const handleJoinTournament = (tournament: ExtendedTournament) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un torneo');
      return;
    }

    setSelectedTournament(tournament);
    setShowTeamRegistrationModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Abierto':
      case 'registration':
        return '#10b981';
      case 'En Progreso':
      case 'ongoing':
        return '#f59e0b';
      case 'Completado':
      case 'completed':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Abierto':
      case 'registration':
        return 'time-outline';
      case 'En Progreso':
      case 'ongoing':
        return 'play-circle';
      case 'Completado':
      case 'completed':
        return 'checkmark-circle';
      default:
        return 'calendar-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      switch (activeFilter) {
        case 'open':
          return tournament.status === 'Abierto';
        case 'ongoing':
          return tournament.status === 'En Progreso';
        case 'completed':
          return tournament.status === 'Finalizado';
        default:
          return true;
      }
    });
  }, [tournaments, activeFilter]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{
          color: 'white',
          marginTop: 16,
          fontSize: 16
        }}>
          Cargando torneos...
        </Text>
      </LinearGradient>
    );
  }

  const getTournamentTypeIcon = (type: string) => {
    switch (type) {
      case 'Solo': return 'person-outline';
      case 'Dúo': return 'people-outline';
      case 'Escuadra': return 'people-circle-outline';
      default: return 'people-outline';
    }
  };

  const getTournamentTypeColor = (type: string) => {
    switch (type) {
      case 'Solo': return '#ef4444';
      case 'Dúo': return '#f59e0b';
      case 'Escuadra': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getTournamentTypeDescription = (type: string) => {
    switch (type) {
      case 'Solo': return 'Cada jugador compite solo';
      case 'Dúo': return 'Equipos de 2 jugadores';
      case 'Escuadra': return 'Equipos de hasta 4 jugadores';
      default: return 'Modo de Battle Royale estándar';
    }
  };

  const getMaxTeamSize = (type: string) => {
    switch (type) {
      case 'Solo': return 1;
      case 'Dúo': return 2;
      case 'Escuadra': return 4;
      default: return 4;
    }
  };

  const renderTournamentCard = useCallback((tournament: ExtendedTournament) => {
    const isParticipant = tournament.participants?.includes(user?.uid || '') || false;
    const isFull = (tournament.participants?.length || 0) >= tournament.maxParticipants;
    const isCreator = tournament.creatorId === user?.uid;
    const progressPercentage = ((tournament.participants?.length || 0) / tournament.maxParticipants) * 100;

    return (
      <TouchableOpacity
        key={tournament.id}
        onPress={() => {
          setSelectedTournament(tournament);
          // Ver detalles del torneo
        }}
        style={{
          backgroundColor: '#1f2937',
          borderRadius: isTablet ? 24 : 20,
          marginBottom: isTablet ? 24 : 20,
          overflow: 'hidden',
          elevation: isTablet ? 8 : 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: isTablet ? 4 : 3 },
          shadowOpacity: isTablet ? 0.4 : 0.3,
          shadowRadius: isTablet ? 8 : 6,
          borderWidth: 1,
          borderColor: isParticipant ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Tournament Image Header */}
        {tournament.imageUrl && (
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: tournament.imageUrl }}
              style={{
                width: '100%',
                height: isTablet ? 200 : 160,
                resizeMode: 'cover'
              }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: isTablet ? 100 : 80,
                justifyContent: 'flex-end',
                padding: isTablet ? 20 : 16
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 22 : 18,
                    fontWeight: 'bold',
                    marginBottom: isTablet ? 6 : 4
                  }}>
                    {tournament.name}
                  </Text>
                  {tournament.organizer && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        color: '#e5e7eb',
                        fontSize: isTablet ? 14 : 12
                      }}>
                        por {tournament.organizer.name}
                      </Text>
                      {tournament.organizer.verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={isTablet ? 16 : 14}
                          color="#3b82f6"
                          style={{ marginLeft: isTablet ? 6 : 4 }}
                        />
                      )}
                    </View>
                  )}
                </View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: getStatusColor(tournament.status),
                  paddingHorizontal: isTablet ? 12 : 8,
                  paddingVertical: isTablet ? 6 : 4,
                  borderRadius: isTablet ? 8 : 6
                }}>
                  <Ionicons
                    name={getStatusIcon(tournament.status)}
                    size={isTablet ? 14 : 12}
                    color="white"
                  />
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 14 : 12,
                    fontWeight: '600',
                    marginLeft: isTablet ? 6 : 4
                  }}>
                    {tournament.status}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={{ padding: isTablet ? 20 : 16 }}>
        {/* Header del torneo */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: isTablet ? 16 : 12
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: isTablet ? 12 : 8
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 22 : 18,
                fontWeight: '600'
              }}>
                {tournament.name}
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: getTournamentTypeColor(tournament.tournamentType || tournament.mode || 'Escuadra'),
                paddingHorizontal: isTablet ? 12 : 8,
                paddingVertical: isTablet ? 6 : 4,
                borderRadius: isTablet ? 8 : 6,
                marginLeft: isTablet ? 16 : 12
              }}>
                <Ionicons
                  name={getTournamentTypeIcon(tournament.tournamentType || tournament.mode || 'Escuadra')}
                  size={isTablet ? 14 : 12}
                  color="white"
                />
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  marginLeft: isTablet ? 6 : 4
                }}>
                  {tournament.tournamentType || tournament.mode || 'Escuadra'}
                </Text>
              </View>
            </View>
            
            <Text style={{
              color: getTournamentTypeColor(tournament.tournamentType || tournament.mode || 'Escuadra'),
              fontSize: isTablet ? 15 : 13,
              fontWeight: '500',
              marginBottom: isTablet ? 6 : 4
            }}>
              {getTournamentTypeDescription(tournament.tournamentType || tournament.mode || 'Escuadra')}
            </Text>
            
            {tournament.description && (
              <Text style={{
                color: '#9ca3af',
                fontSize: isTablet ? 16 : 14,
                lineHeight: isTablet ? 24 : 20
              }}>
                {tournament.description}
              </Text>
            )}
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: getStatusColor(tournament.status),
            paddingHorizontal: isTablet ? 12 : 8,
            paddingVertical: isTablet ? 6 : 4,
            borderRadius: isTablet ? 8 : 6
          }}>
            <Ionicons
              name={getStatusIcon(tournament.status)}
              size={isTablet ? 14 : 12}
              color="white"
            />
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 14 : 12,
              fontWeight: '600',
              marginLeft: isTablet ? 6 : 4
            }}>
              {tournament.status}
            </Text>
          </View>
        </View>

        {/* Información del torneo */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: isTablet ? 20 : 16
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: isTablet ? 12 : 8
            }}>
              <Ionicons 
                name={getTournamentTypeIcon(tournament.tournamentType || tournament.mode || 'Escuadra')} 
                size={isTablet ? 20 : 16} 
                color={getTournamentTypeColor(tournament.tournamentType || tournament.mode || 'Escuadra')} 
              />
              <Text style={{
                color: '#9ca3af',
                fontSize: isTablet ? 16 : 14,
                marginLeft: isTablet ? 8 : 6
              }}>
                {tournament.participants?.length || 0}/{tournament.maxParticipants} {(tournament.mode === 'Solo') ? 'jugadores' : 'equipos'}
              </Text>
              {(tournament.mode !== 'Solo') && (
                <Text style={{
                  color: getTournamentTypeColor(tournament.tournamentType || tournament.mode || 'Escuadra'),
                  fontSize: isTablet ? 14 : 12,
                  marginLeft: isTablet ? 12 : 8,
                  fontWeight: '600'
                }}>
                  • Max {getMaxTeamSize(tournament.tournamentType || tournament.mode || 'Escuadra')} por equipo
                </Text>
              )}
            </View>
            
            {(tournament.entryFee && Number(tournament.entryFee) > 0) && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: isTablet ? 12 : 8
              }}>
                <Ionicons name="card-outline" size={isTablet ? 20 : 16} color="#f59e0b" />
                <Text style={{
                  color: '#9ca3af',
                  fontSize: isTablet ? 16 : 14,
                  marginLeft: isTablet ? 8 : 6
                }}>
                  Entrada: ${tournament.entryFee}
                </Text>
              </View>
            )}
            
            {(tournament.prizePool && Number(tournament.prizePool) > 0) && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons name="trophy-outline" size={isTablet ? 20 : 16} color="#fbbf24" />
                <Text style={{
                  color: '#9ca3af',
                  fontSize: isTablet ? 16 : 14,
                  marginLeft: isTablet ? 8 : 6
                }}>
                  Premio: ${tournament.prizePool}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Barra de progreso */}
        <View style={{
          flexDirection: 'row',
          height: isTablet ? 8 : 6,
          backgroundColor: '#1f2937',
          borderRadius: isTablet ? 4 : 3,
          marginBottom: isTablet ? 20 : 16
        }}>
          <View style={{
            width: `${((tournament.participants?.length || 0) / (tournament.maxParticipants || 16)) * 100}%`,
            backgroundColor: '#3b82f6',
            borderRadius: isTablet ? 4 : 3
          }} />
        </View>

        {/* Funcionalidades Avanzadas */}
        {(tournament.status === 'En Progreso' || tournament.status === 'Finalizado') && (
          <View style={{
            flexDirection: 'row',
            gap: isTablet ? 12 : 8,
            marginBottom: isTablet ? 16 : 12
          }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedTournamentForFeatures(tournament);
                setShowBracketModal(true);
              }}
              style={{
                flex: 1,
                backgroundColor: '#8b5cf6',
                paddingHorizontal: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 10 : 8,
                borderRadius: isTablet ? 8 : 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="git-network" size={isTablet ? 16 : 14} color="white" />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 14 : 12,
                fontWeight: '600',
                marginLeft: isTablet ? 6 : 4
              }}>
                Bracket
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setSelectedTournamentForFeatures(tournament);
                setShowStatsModal(true);
              }}
              style={{
                flex: 1,
                backgroundColor: '#10b981',
                paddingHorizontal: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 10 : 8,
                borderRadius: isTablet ? 8 : 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="stats-chart" size={isTablet ? 16 : 14} color="white" />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 14 : 12,
                fontWeight: '600',
                marginLeft: isTablet ? 6 : 4
              }}>
                Stats
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setSelectedTournamentForFeatures(tournament);
                setShowStreamModal(true);
              }}
              style={{
                flex: 1,
                backgroundColor: '#ef4444',
                paddingHorizontal: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 10 : 8,
                borderRadius: isTablet ? 8 : 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="videocam" size={isTablet ? 16 : 14} color="white" />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 14 : 12,
                fontWeight: '600',
                marginLeft: isTablet ? 6 : 4
              }}>
                Stream
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acciones */}
        <View style={{
          flexDirection: 'column',
          gap: isTablet ? 12 : 8
        }}>
          {/* Botón de Chat del Torneo */}
          <TouchableOpacity
            onPress={() => {
              // Navegar al chat específico del torneo
              router.push({
                pathname: '/(tabs)/tournament-chat',
                params: {
                  tournamentId: tournament.id,
                  tournamentName: tournament.name,
                  tournamentMode: tournament.tournamentType || tournament.mode,
                  tournamentPrize: tournament.prizePool || '0',
                  tournamentDate: tournament.date,
                  tournamentParticipants: tournament.participants?.length || 0
                }
              });
            }}
            style={{
              backgroundColor: '#8b5cf6',
              paddingHorizontal: isTablet ? 16 : 12,
              paddingVertical: isTablet ? 10 : 8,
              borderRadius: isTablet ? 10 : 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 2,
              shadowColor: '#8b5cf6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4
            }}
          >
            <Ionicons name="chatbubbles" size={isTablet ? 18 : 16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '600',
              marginLeft: isTablet ? 8 : 6
            }}>
              💬 Chat del Torneo
            </Text>
          </TouchableOpacity>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {isCreator && (
              <Text style={{
                color: '#3b82f6',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                alignSelf: 'center'
              }}>
                👑 Tu torneo
              </Text>
            )}
            
            {!isCreator && tournament.status === 'Abierto' && (
              <TouchableOpacity
                onPress={() => isParticipant 
                  ? leaveTournament(tournament.id, tournament.tournamentType || tournament.mode) 
                  : joinTournament(tournament)
                }
                disabled={!isParticipant && isFull}
                style={{
                  backgroundColor: isParticipant ? '#ef4444' : isFull ? '#6b7280' : getTournamentTypeColor(tournament.tournamentType || tournament.mode || 'Escuadra'),
                  paddingHorizontal: isTablet ? 20 : 16,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  opacity: (!isParticipant && isFull) ? 0.5 : 1,
                  flex: isCreator ? 0 : 1
                }}
                 >
                   <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {isParticipant 
                    ? 'Salir' 
                    : isFull 
                      ? 'Lleno' 
                      : (tournament.tournamentType || tournament.mode) === 'Solo' 
                        ? 'Registrarse' 
                        : 'Unir Equipo'
                  }
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botón del sistema de tickets */}
            {(isCreator || isParticipant) && (
              <TouchableOpacity
                onPress={() => handleOpenTicketSystem(tournament)}
                style={{
                  backgroundColor: '#8b5cf6',
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  marginLeft: 8,
                  minWidth: isTablet ? 120 : 100
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  🎫 Tickets
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botón del sistema de permisos */}
            {isCreator && (
              <TouchableOpacity
                onPress={() => handleOpenPermissionManager(tournament)}
                style={{
                  backgroundColor: '#f59e0b',
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  marginLeft: 8,
                  minWidth: isTablet ? 120 : 100
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  🔐 Permisos
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botón del sistema de notificaciones */}
            {(isCreator || isParticipant) && (
              <TouchableOpacity
                onPress={() => handleOpenNotificationSystem(tournament)}
                style={{
                  backgroundColor: '#8b5cf6',
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  marginLeft: 8,
                  minWidth: isTablet ? 120 : 100
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  📢 Notificaciones
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botón Panel de Administración - Solo para creadores */}
            {isCreator && (
              <TouchableOpacity
                onPress={() => handleOpenAdminPanel(tournament)}
                style={{
                  backgroundColor: '#7c3aed',
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  marginLeft: 8,
                  minWidth: isTablet ? 120 : 100
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  ⚙️ Admin
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botón Sistema de Invitaciones - Solo para creadores */}
            {isCreator && (
              <TouchableOpacity
                onPress={() => handleOpenInvitationSystem(tournament)}
                style={{
                  backgroundColor: '#f59e0b',
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  marginLeft: 8,
                  minWidth: isTablet ? 120 : 100
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  🎫 Invitar
                </Text>
              </TouchableOpacity>
            )}
            
            {tournament.status !== 'Abierto' && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#374151',
                  paddingHorizontal: isTablet ? 20 : 16,
                  paddingVertical: isTablet ? 12 : 8,
                  borderRadius: isTablet ? 10 : 8,
                  borderWidth: 1,
                  borderColor: '#4b5563',
                  flex: 1
                }}
              >
                <Text style={{
                  color: '#9ca3af',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Ver Detalles
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      </TouchableOpacity>
    );
  }, [user?.uid, leaveTournament, joinTournament]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={{ flex: 1 }}
      >
      {/* Header */}
      <LinearGradient
        colors={['#1f2937', '#111827', '#0f172a']}
        style={{
          paddingTop: isTablet ? 60 : 50,
          paddingBottom: isTablet ? 30 : 20,
          paddingHorizontal: isTablet ? 24 : 16
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isTablet ? 24 : 16
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 36 : 28,
              fontWeight: 'bold',
              marginBottom: isTablet ? 8 : 4
            }}>
              🏆 Torneos
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '400'
            }}>
              Compite en torneos épicos y gana premios increíbles
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              backgroundColor: '#3b82f6',
              paddingHorizontal: isTablet ? 24 : 16,
              paddingVertical: isTablet ? 12 : 8,
              borderRadius: isTablet ? 24 : 20,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 4,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4
            }}
          >
            <Ionicons name="add" size={isTablet ? 24 : 20} color="white" />
            <Text style={{
              color: 'white',
              marginLeft: isTablet ? 6 : 4,
              fontWeight: '600',
              fontSize: isTablet ? 16 : 14
            }}>
              Crear
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Estadísticas rápidas */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: isTablet ? 20 : 16,
          marginTop: isTablet ? 16 : 12
        }}>
          {[
            { label: 'Activos', value: tournaments.filter(t => t.status === 'Abierto' || t.status === 'En Progreso').length, icon: 'flash', color: '#10b981' },
            { label: 'Participantes', value: tournaments.reduce((acc, t) => acc + (t.participants?.length || 0), 0), icon: 'people', color: '#3b82f6' },
            { label: 'Premios', value: '$' + tournaments.reduce((acc, t) => acc + (parseInt(t.prizePool || '0') || 0), 0).toLocaleString(), icon: 'trophy', color: '#f59e0b' }
          ].map((stat, index) => (
            <View key={index} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              paddingHorizontal: isTablet ? 16 : 12,
              paddingVertical: isTablet ? 12 : 8,
              borderRadius: isTablet ? 16 : 12,
              alignItems: 'center',
              flex: 1,
              marginHorizontal: isTablet ? 4 : 2,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <View style={{
                backgroundColor: stat.color,
                padding: isTablet ? 8 : 6,
                borderRadius: isTablet ? 12 : 8,
                marginBottom: isTablet ? 8 : 6
              }}>
                <Ionicons name={stat.icon as any} size={isTablet ? 20 : 16} color="white" />
              </View>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 14,
                fontWeight: 'bold',
                marginBottom: isTablet ? 4 : 2
              }}>
                {stat.value}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: isTablet ? 14 : 12,
                textAlign: 'center'
              }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: isTablet ? 16 : 12 }}
          contentContainerStyle={{
            paddingRight: isTablet ? 24 : 16
          }}
        >
          {[
            { key: 'all', label: 'Todos', icon: 'grid-outline', color: '#6366f1' },
            { key: 'open', label: 'Abiertos', icon: 'time-outline', color: '#10b981' },
            { key: 'ongoing', label: 'En Curso', icon: 'play-circle-outline', color: '#f59e0b' },
            { key: 'completed', label: 'Finalizados', icon: 'checkmark-circle-outline', color: '#8b5cf6' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key as any)}
              style={{
                backgroundColor: activeFilter === filter.key ? filter.color : 'rgba(55, 65, 81, 0.8)',
                paddingHorizontal: isTablet ? 20 : 16,
                paddingVertical: isTablet ? 12 : 8,
                borderRadius: isTablet ? 24 : 20,
                marginRight: isTablet ? 12 : 8,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: activeFilter === filter.key ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                elevation: activeFilter === filter.key ? 4 : 0,
                shadowColor: activeFilter === filter.key ? filter.color : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4
              }}
            >
              <Ionicons
                name={filter.icon as any}
                size={isTablet ? 20 : 16}
                color="white"
                style={{ marginRight: isTablet ? 8 : 6 }}
              />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: activeFilter === filter.key ? '600' : '400'
              }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Lista de torneos */}
      <ScrollView
        style={{ 
          flex: 1, 
          paddingHorizontal: isTablet ? 24 : 16 
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: isTablet ? 80 : 50
          }}>
            <ActivityIndicator size={isTablet ? 60 : "large"} color="#3b82f6" />
            <Text style={{
              color: '#9ca3af',
              marginTop: isTablet ? 24 : 16,
              fontSize: isTablet ? 20 : 16,
              fontWeight: isTablet ? '600' : 'normal'
            }}>
              Cargando torneos...
            </Text>
          </View>
        ) : filteredTournaments.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: isTablet ? 80 : 50
          }}>
            <Ionicons name="trophy-outline" size={isTablet ? 96 : 64} color="#6b7280" />
            <Text style={{
              color: '#9ca3af',
              marginTop: isTablet ? 24 : 16,
              fontSize: isTablet ? 24 : 18,
              fontWeight: '600'
            }}>
              No hay torneos disponibles
            </Text>
            <Text style={{
              color: '#6b7280',
              marginTop: isTablet ? 12 : 8,
              fontSize: isTablet ? 18 : 14,
              textAlign: 'center',
              paddingHorizontal: isTablet ? 40 : 0
            }}>
              Cambia los filtros o crea un nuevo torneo
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ 
              paddingTop: isTablet ? 24 : 16, 
              paddingBottom: isTablet ? 140 : 120,
              paddingHorizontal: isTablet ? 20 : 16
            }}
            showsVerticalScrollIndicator={false}
          >
            <ResponsiveList
              data={filteredTournaments}
              renderItem={(tournament) => renderTournamentCard(tournament)}
              keyExtractor={(tournament) => tournament.id}
              spacing={isTablet ? 20 : 16}
              minItemWidth={isTablet ? 400 : 320}
              maxColumns={{ phone: 1, tablet: isLandscape ? 2 : 1 }}
              style={{ paddingHorizontal: 0 }}
            />
          </ScrollView>
        )}
      </ScrollView>

      {/* Modal avanzado para crear torneo */}
      <AdvancedTournamentCreator
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTournament={handleCreateAdvancedTournament}
      />

        {/* Modal para registro de equipo */}
        <Modal
          visible={showTeamRegistrationModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={{
            flex: 1,
            backgroundColor: '#111827',
            paddingTop: isTablet ? 60 : 50
          }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: isTablet ? 24 : 16,
            paddingBottom: isTablet ? 20 : 16,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 24 : 20,
              fontWeight: 'bold'
            }}>
              Registrar Equipo
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                setShowTeamRegistrationModal(false);
                setSelectedTournament(null);
              }}
              style={{
                padding: isTablet ? 12 : 8
              }}
            >
              <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
            {selectedTournament && (
              <View style={{
                backgroundColor: '#1f2937',
                padding: isTablet ? 20 : 16,
                borderRadius: isTablet ? 16 : 12,
                marginBottom: isTablet ? 24 : 20
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 20 : 18,
                  fontWeight: '600',
                  marginBottom: isTablet ? 10 : 8
                }}>
                  {selectedTournament.name}
                </Text>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: isTablet ? 16 : 14
                }}>
                  Modo: {selectedTournament.tournamentType || selectedTournament.mode}
                </Text>
              </View>
            )}
            
            {/* Nombre del equipo */}
            <View style={{ marginBottom: isTablet ? 24 : 20 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: '600',
                marginBottom: isTablet ? 10 : 8
              }}>
                Nombre del Equipo
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 18 : 16
                }}
                placeholder="Ej: Los Conquistadores"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Miembros del equipo */}
            <View style={{ marginBottom: isTablet ? 24 : 20 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: '600',
                marginBottom: isTablet ? 10 : 8
              }}>
                Miembros del Equipo
              </Text>
              
              {[1, 2, 3, 4].map((index) => (
                <View key={index} style={{ marginBottom: isTablet ? 16 : 12 }}>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 16 : 14,
                    marginBottom: isTablet ? 6 : 4
                  }}>
                    Jugador {index} {index === 1 ? '(Capitán)' : ''}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: isTablet ? 16 : 12,
                      borderRadius: isTablet ? 12 : 8,
                      fontSize: isTablet ? 18 : 16
                    }}
                    placeholder={`ID de jugador ${index}`}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ))}
            </View>
            
            {/* Botones */}
            <View style={{
              flexDirection: 'row',
              gap: isTablet ? 16 : 12,
              marginTop: isTablet ? 24 : 20,
              marginBottom: isTablet ? 48 : 40
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowTeamRegistrationModal(false);
                  setSelectedTournament(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  padding: isTablet ? 20 : 16,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600'
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Éxito', 'Equipo registrado correctamente');
                  setShowTeamRegistrationModal(false);
                  setSelectedTournament(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  padding: isTablet ? 20 : 16,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600'
                }}>
                  Registrar Equipo
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Bracket Interactivo */}
      <Modal
        visible={showBracketModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowBracketModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={() => setShowBracketModal(false)}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              Bracket - {selectedTournamentForFeatures?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForFeatures && (
            <InteractiveBracket
              tournamentId={selectedTournamentForFeatures.id}
              matches={[]}
              onMatchUpdate={() => {}}
              isOrganizer={selectedTournamentForFeatures.creatorId === user?.uid}
            />
          )}
        </View>
      </Modal>

      {/* Modal de Estadísticas en Tiempo Real */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={() => setShowStatsModal(false)}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              Estadísticas - {selectedTournamentForFeatures?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForFeatures && (
            <LiveStats
              tournamentId={selectedTournamentForFeatures.id}
              refreshInterval={5000}
              showPlayerStats={true}
              showTeamStats={true}
            />
          )}
        </View>
      </Modal>

      {/* Modal de Streaming */}
      <Modal
        visible={showStreamModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowStreamModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={() => setShowStreamModal(false)}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              Streams - {selectedTournamentForFeatures?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForFeatures && (
            <StreamingIntegration
              tournamentId={selectedTournamentForFeatures.id}
              isOrganizer={selectedTournamentForFeatures.creatorId === user?.uid}
              allowMultipleStreams={true}
              defaultQuality="auto"
            />
          )}
        </View>
      </Modal>

      {/* Modal del Sistema de Tickets */}
      <Modal
        visible={showTicketSystem}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseTicketSystem}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={handleCloseTicketSystem}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              🎫 Sistema de Tickets - {selectedTournamentForTickets?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForTickets && (
            <TournamentTicketSystem
              visible={true}
              onClose={() => setSelectedTournamentForTickets(null)}
              tournamentId={selectedTournamentForTickets.id}
              tickets={[]}
              onUpdateTickets={(tickets) => handleTicketUpdate(selectedTournamentForTickets.id, tickets)}
              currentUserId={user?.uid || ''}
              currentUserRole={selectedTournamentForTickets.creatorId === user?.uid ? 'admin' : 'participant'}
            />
          )}
        </View>
      </Modal>

      {/* Modal del Sistema de Permisos */}
      <Modal
        visible={showPermissionManager}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClosePermissionManager}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={handleClosePermissionManager}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              🔐 Gestión de Permisos - {selectedTournamentForPermissions?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForPermissions && (
            <TournamentPermissionManager
              tournamentId={selectedTournamentForPermissions.id}
              roles={selectedTournamentForPermissions.roles || []}
              channels={selectedTournamentForPermissions.channels || []}
              isOrganizer={selectedTournamentForPermissions.creatorId === user?.uid}
              onPermissionsUpdate={handlePermissionsUpdate}
            />
          )}
        </View>
      </Modal>

      {/* Modal del sistema de notificaciones */}
      <Modal
        visible={showNotificationSystem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseNotificationSystem}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={handleCloseNotificationSystem}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              📢 Sistema de Notificaciones - {selectedTournamentForNotifications?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForNotifications && (
            <TournamentNotificationSystem
              tournamentId={selectedTournamentForNotifications.id}
              userId={user?.uid || ''}
              isStaff={selectedTournamentForNotifications.creatorId === user?.uid}
              roles={selectedTournamentForNotifications.roles || []}
              onNotificationSent={handleNotificationSent}
            />
          )}
        </View>
      </Modal>
      
      {/* Modal Panel de Administración */}
      <Modal
        visible={showAdminPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseAdminPanel}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#1f2937'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={handleCloseAdminPanel}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#374151'
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              ⚙️ Panel de Administración - {selectedTournamentForAdmin?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForAdmin && (
            <TournamentAdminPanel
              tournamentId={selectedTournamentForAdmin.id}
              userId={user?.uid || ''}
              isOrganizer={selectedTournamentForAdmin.creatorId === user?.uid}
              tournament={selectedTournamentForAdmin as Tournament}
              onTournamentUpdate={(updatedTournament: Tournament) => {
                // Handle tournament update
                setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? {...t, ...updatedTournament} : t));
              }}
            />
          )}
        </View>
      </Modal>
      
      {/* Modal Sistema de Invitaciones */}
      <Modal
        visible={showInvitationSystem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseInvitationSystem}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#111827'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={handleCloseInvitationSystem}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#374151'
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              🎫 Sistema de Invitaciones - {selectedTournamentForInvitations?.name}
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedTournamentForInvitations && (
            <TournamentInvitationSystem
              tournamentId={selectedTournamentForInvitations.id}
              userId={user?.uid || ''}
              isCreator={selectedTournamentForInvitations.creatorId === user?.uid}
              tournamentName={selectedTournamentForInvitations.name}
              onInvitationSent={handleInvitationSent}
            />
          )}
        </View>
      </Modal>
      
      </LinearGradient>
    </View>
  );
}