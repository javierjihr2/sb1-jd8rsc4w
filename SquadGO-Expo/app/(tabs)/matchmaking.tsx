import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContextSimple';
import UserActionMenu from '../../components/UserActionMenu';

const { width, height } = Dimensions.get('window');

interface PlayerProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  distance: number;
  isOnline: boolean;
  lastSeen?: string;
  compatibility: number;
  rank: string;
  gameMode: string;
  bio: string;
  stats: {
    kda: number;
    wins: number;
    matches: number;
  };
  badges: string[];
  currentServer: string; // Servidor de PUBG Mobile del jugador
  pubgId: string; // ID de PUBG Mobile
}

const mockPlayers: PlayerProfile[] = [
  {
    id: '1',
    name: 'Alex Gaming',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    distance: 2.5,
    isOnline: true,
    compatibility: 95,
    rank: 'Conquistador',
    gameMode: 'Escuadra',
    bio: 'Jugador competitivo, busco equipo serio para torneos. Me especializo en sniper y estrategia.',
    stats: { kda: 3.2, wins: 156, matches: 234 },
    badges: ['MVP', 'Sniper', 'Estratega'],
    currentServer: 'Sur América',
    pubgId: 'AlexGaming2024'
  },
  {
    id: '2',
    name: 'Luna Pro',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
    distance: 5.1,
    isOnline: false,
    lastSeen: 'Hace 15 min',
    compatibility: 88,
    rank: 'As',
    gameMode: 'Dúo',
    bio: 'Streamer y jugadora profesional. Busco compañeros para ranked y contenido.',
    stats: { kda: 2.8, wins: 203, matches: 298 },
    badges: ['Streamer', 'Pro', 'Leader'],
    currentServer: 'Sur América',
    pubgId: 'LunaPro_YT'
  },
  {
    id: '3',
    name: 'Shadow',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    distance: 8.3,
    isOnline: true,
    compatibility: 92,
    rank: 'Corona',
    gameMode: 'Solo',
    bio: 'Especialista en hot drops y combate cercano. Siempre listo para la acción.',
    stats: { kda: 4.1, wins: 89, matches: 167 },
    badges: ['Rusher', 'CQC', 'Clutch'],
    currentServer: 'Norte América',
    pubgId: 'ShadowStrike99'
  },
  {
    id: '4',
    name: 'Phoenix',
    age: 20,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    distance: 12.7,
    isOnline: false,
    lastSeen: 'Hace 2 horas',
    compatibility: 76,
    rank: 'Diamante',
    gameMode: 'Escuadra',
    bio: 'Jugador casual pero dedicado. Me gusta el teamwork y las estrategias coordinadas.',
    stats: { kda: 2.1, wins: 134, matches: 245 },
    badges: ['Teamwork', 'Support', 'Tactical'],
    currentServer: 'Sur América',
    pubgId: 'PhoenixRising'
  },
  {
    id: '5',
    name: 'Viper Queen',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    distance: 15.2,
    isOnline: true,
    compatibility: 84,
    rank: 'As',
    gameMode: 'Dúo',
    bio: 'Competitiva y ambiciosa. Busco partners para subir a Conquistador esta temporada.',
    stats: { kda: 3.5, wins: 178, matches: 267 },
    badges: ['Competitive', 'Ambitious', 'Skilled'],
    currentServer: 'Europa',
    pubgId: 'ViperQueen_EU'
  },
  {
    id: '6',
    name: 'Thunder',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    distance: 3.8,
    isOnline: true,
    compatibility: 89,
    rank: 'Corona',
    gameMode: 'Escuadra',
    bio: 'Líder de equipo experimentado. Busco jugadores comprometidos para competir.',
    stats: { kda: 2.9, wins: 145, matches: 198 },
    badges: ['Leader', 'Experienced', 'Committed'],
    currentServer: 'Sur América',
    pubgId: 'ThunderLeader'
  },
  {
    id: '7',
    name: 'Nova',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    distance: 7.2,
    isOnline: false,
    lastSeen: 'Hace 30 min',
    compatibility: 82,
    rank: 'Diamante',
    gameMode: 'Dúo',
    bio: 'Jugadora estratégica, me especializo en soporte y coordinación de equipo.',
    stats: { kda: 2.3, wins: 167, matches: 234 },
    badges: ['Support', 'Strategic', 'Coordinator'],
    currentServer: 'Asia',
    pubgId: 'NovaSupport_AS'
  },
  {
    id: '8',
    name: 'Blaze',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    distance: 11.5,
    isOnline: true,
    compatibility: 91,
    rank: 'As',
    gameMode: 'Solo',
    bio: 'Veterano del juego con años de experiencia. Siempre dispuesto a enseñar.',
    stats: { kda: 3.8, wins: 289, matches: 356 },
    badges: ['Veteran', 'Teacher', 'Expert'],
    currentServer: 'Norte América',
    pubgId: 'BlazeVeteran_NA'
  },
  {
    id: '9',
    name: 'Storm',
    age: 19,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    distance: 6.7,
    isOnline: true,
    compatibility: 77,
    rank: 'Platino',
    gameMode: 'Escuadra',
    bio: 'Joven talento en ascenso. Busco equipo para mejorar y competir.',
    stats: { kda: 2.1, wins: 98, matches: 156 },
    badges: ['Rising', 'Talent', 'Eager'],
    currentServer: 'Sur América',
    pubgId: 'StormRising'
  },
  {
    id: '10',
    name: 'Frost',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
    distance: 9.3,
    isOnline: false,
    lastSeen: 'Hace 1 hora',
    compatibility: 85,
    rank: 'Corona',
    gameMode: 'Dúo',
    bio: 'Especialista en francotirador. Precisión y paciencia son mis fortalezas.',
    stats: { kda: 4.2, wins: 134, matches: 189 },
    badges: ['Sniper', 'Precise', 'Patient'],
    currentServer: 'Medio Oriente',
    pubgId: 'FrostSniper_ME'
  },
  {
    id: '11',
    name: 'Raven',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    distance: 4.1,
    isOnline: true,
    compatibility: 93,
    rank: 'Conquistador',
    gameMode: 'Escuadra',
    bio: 'Jugador agresivo y decisivo. Me gusta liderar las cargas y tomar riesgos.',
    stats: { kda: 3.6, wins: 201, matches: 267 },
    badges: ['Aggressive', 'Leader', 'Risk-taker'],
    currentServer: 'Krjp',
    pubgId: 'RavenConqueror_KR'
  },
  {
    id: '12',
    name: 'Echo',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    distance: 13.8,
    isOnline: true,
    compatibility: 79,
    rank: 'Diamante',
    gameMode: 'Solo',
    bio: 'Jugadora analítica que estudia cada movimiento. Estrategia sobre todo.',
    stats: { kda: 2.7, wins: 156, matches: 223 },
    badges: ['Analytical', 'Strategic', 'Studious'],
    currentServer: 'Sur América',
    pubgId: 'EchoAnalyst_SA'
  },
  {
    id: '13',
    name: 'Apex',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    distance: 8.9,
    isOnline: false,
    lastSeen: 'Hace 45 min',
    compatibility: 88,
    rank: 'As',
    gameMode: 'Escuadra',
    bio: 'Competidor nato. Siempre busco la victoria y la mejora constante.',
    stats: { kda: 3.1, wins: 178, matches: 245 },
    badges: ['Competitive', 'Winner', 'Improver'],
    currentServer: 'Norte América',
    pubgId: 'ApexCompetitor_NA'
  },
  {
    id: '14',
    name: 'Zephyr',
    age: 20,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    distance: 5.6,
    isOnline: true,
    compatibility: 81,
    rank: 'Platino',
    gameMode: 'Dúo',
    bio: 'Jugador versátil que se adapta a cualquier situación y rol necesario.',
    stats: { kda: 2.5, wins: 123, matches: 187 },
    badges: ['Versatile', 'Adaptable', 'Flexible'],
    currentServer: 'Europa',
    pubgId: 'ZephyrVersatile_EU'
  },
  {
    id: '15',
    name: 'Cipher',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    distance: 10.2,
    isOnline: true,
    compatibility: 86,
    rank: 'Corona',
    gameMode: 'Escuadra',
    bio: 'Estratega maestro con conocimiento profundo del meta y las mecánicas.',
    stats: { kda: 2.8, wins: 234, matches: 298 },
    badges: ['Strategist', 'Meta-expert', 'Mechanics'],
    currentServer: 'Asia',
    pubgId: 'CipherStrategist_AS'
  },
  {
    id: '16',
    name: 'Pulse',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    distance: 7.8,
    isOnline: false,
    lastSeen: 'Hace 20 min',
    compatibility: 83,
    rank: 'Diamante',
    gameMode: 'Solo',
    bio: 'Jugadora rápida y precisa. Excelente en combates de corta distancia.',
    stats: { kda: 3.3, wins: 145, matches: 201 },
    badges: ['Fast', 'Precise', 'CQC'],
    currentServer: 'Medio Oriente',
    pubgId: 'PulseFast_ME'
  }
];

const getRankColor = (rank: string) => {
  const colors = {
    'Bronce': '#CD7F32',
    'Plata': '#C0C0C0',
    'Oro': '#FFD700',
    'Platino': '#E5E4E2',
    'Diamante': '#B9F2FF',
    'Corona': '#FF6B6B',
    'As': '#9B59B6',
    'Conquistador': '#E74C3C'
  };
  return colors[rank as keyof typeof colors] || '#64748b';
};

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    displayName: string;
    photoURL?: string;
    rank?: string;
    stats?: {
      kda: number;
      wins: number;
      matches: number;
    };
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const mockConnectionRequests: ConnectionRequest[] = [
  {
    id: '1',
    fromUserId: 'user1',
    toUserId: 'currentUser',
    fromUser: {
      displayName: 'Alex Gaming',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      rank: 'Conquistador',
      stats: { kda: 3.2, wins: 156, matches: 234 }
    },
    message: '¡Hola! Me gustaría formar equipo contigo para ranked.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
  },
  {
    id: '2',
    fromUserId: 'user2',
    toUserId: 'currentUser',
    fromUser: {
      displayName: 'Luna Pro',
      photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
      rank: 'As',
      stats: { kda: 2.8, wins: 203, matches: 298 }
    },
    message: 'Vi tu perfil y creo que podríamos hacer un buen equipo.',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 horas atrás
  },
  {
    id: '3',
    fromUserId: 'user3',
    toUserId: 'currentUser',
    fromUser: {
      displayName: 'Shadow',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rank: 'Corona',
      stats: { kda: 4.1, wins: 89, matches: 167 }
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
  }
];

export default function Matchmaking() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'connections'>('discover');
  const [players, setPlayers] = useState<PlayerProfile[]>(mockPlayers);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [filterDistance, setFilterDistance] = useState(50);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRank, setFilterRank] = useState('Todos');
  const [filterGameMode, setFilterGameMode] = useState('Todos');
  const [filterMinKD, setFilterMinKD] = useState('Cualquiera');
  const [filterServer, setFilterServer] = useState('Todos'); // Nuevo filtro por servidor
  const [activePlayerActions, setActivePlayerActions] = useState<string | null>(null);
  const [userActionMenuVisible, setUserActionMenuVisible] = useState(false);
  const [selectedPlayerForActions, setSelectedPlayerForActions] = useState<PlayerProfile | null>(null);

  const filteredPlayers = players.filter(player => {
    // Filtro principal: solo mostrar jugadores del mismo servidor que el usuario
    if (profile?.currentServer && player.currentServer !== profile.currentServer) {
      return false;
    }
    
    // Filtros adicionales
    if (filterOnlineOnly && !player.isOnline) return false;
    if (player.distance > filterDistance) return false;
    if (filterRank !== 'Todos' && player.rank !== filterRank) return false;
    if (filterGameMode !== 'Todos' && player.gameMode !== filterGameMode) return false;
    if (filterServer !== 'Todos' && player.currentServer !== filterServer) return false;
    if (filterMinKD !== 'Cualquiera') {
      const minKD = parseFloat(filterMinKD.replace('+', ''));
      if (player.stats.kda < minKD) return false;
    }
    return true;
  });

  const handleLike = (playerId: string) => {
    Alert.alert(
      '¡Match!',
      '¡Has conectado con este jugador! Ahora pueden chatear y jugar juntos.',
      [{ text: 'Genial!', style: 'default' }]
    );
  };

  const handlePass = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const handleAcceptConnection = (requestId: string) => {
    setConnectionRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'accepted' as const }
          : req
      )
    );
    Alert.alert(
      '¡Conexión Aceptada!',
      'Ahora pueden chatear y jugar juntos.',
      [{ text: 'Genial!', style: 'default' }]
    );
  };

  const handleDeclineConnection = (requestId: string) => {
    setConnectionRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'declined' as const }
          : req
      )
    );
  };

  const formatTimeAgo = (date: Date | any) => {
    const now = new Date();
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays}d`;
    }
  };

  const openProfile = (player: PlayerProfile) => {
    setSelectedPlayer(player);
    setShowProfile(true);
  };

  const renderConnectionCard = (request: ConnectionRequest) => (
    <View key={request.id} style={styles.connectionCard}>
      <View style={styles.connectionHeader}>
        <Image 
          source={{ uri: request.fromUser.photoURL || 'https://via.placeholder.com/50' }} 
          style={styles.connectionAvatar} 
        />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{request.fromUser.displayName}</Text>
          <View style={styles.connectionMeta}>
            {request.fromUser.rank && (
              <View style={[styles.connectionRankBadge, { backgroundColor: getRankColor(request.fromUser.rank) }]}>
                <Text style={styles.connectionRankText}>{request.fromUser.rank}</Text>
              </View>
            )}
            <Text style={styles.connectionTime}>{formatTimeAgo(request.createdAt)}</Text>
          </View>
          {request.fromUser.stats && (
            <Text style={styles.connectionStats}>
              K/D: {request.fromUser.stats.kda} • {Math.round((request.fromUser.stats.wins / request.fromUser.stats.matches) * 100)}% WR
            </Text>
          )}
        </View>
      </View>
      
      {request.message && (
        <Text style={styles.connectionMessage}>{request.message}</Text>
      )}
      
      {request.status === 'pending' && (
        <View style={styles.connectionActions}>
          <TouchableOpacity
            style={[styles.connectionButton, styles.declineButton]}
            onPress={() => handleDeclineConnection(request.id)}
          >
            <Ionicons name="close" size={18} color="white" />
            <Text style={styles.connectionButtonText}>Rechazar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.connectionButton, styles.acceptButton]}
            onPress={() => handleAcceptConnection(request.id)}
          >
            <Ionicons name="flash" size={18} color="white" />
            <Text style={styles.connectionButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {request.status === 'accepted' && (
        <View style={styles.connectionStatusContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.connectionStatusText}>Conexión aceptada</Text>
        </View>
      )}
      
      {request.status === 'declined' && (
        <View style={styles.connectionStatusContainer}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.connectionStatusText}>Conexión rechazada</Text>
        </View>
      )}
    </View>
  );

  const renderPlayerCard = (player: PlayerProfile) => (
    <TouchableOpacity
      key={player.id}
      style={styles.playerCard}
      onPress={() => {
        if (activePlayerActions === player.id) {
          setActivePlayerActions(null);
        } else {
          setActivePlayerActions(player.id);
        }
      }}
      onLongPress={() => openProfile(player)}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      >
        <Image source={{ uri: player.avatar }} style={styles.playerImage} />
        
        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: player.isOnline ? '#10B981' : '#6B7280' }]} />
        
        {/* Compatibility badge */}
        <View style={styles.compatibilityBadge}>
          <Ionicons name="heart" size={8} color="white" />
          <Text style={styles.compatibilityText}>{player.compatibility}%</Text>
        </View>
        
        {/* Player info - Compact version */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
          <Text style={styles.playerAge}>{player.age}</Text>
          
          <View style={styles.playerMeta}>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={10} color="white" />
              <Text style={styles.distanceText}>{player.distance}km</Text>
            </View>
            
            <View style={[styles.rankBadge, { backgroundColor: getRankColor(player.rank) }]}>
              <Text style={styles.rankText}>{player.rank}</Text>
            </View>
          </View>
          
          {/* Compact stats */}
          <View style={styles.compactStats}>
            <Text style={styles.compactStatText}>K/D: {player.stats.kda}</Text>
            <Text style={styles.compactStatText}>{Math.round((player.stats.wins / player.stats.matches) * 100)}% WR</Text>
          </View>
        </View>
        
        {/* Compact action buttons - solo se muestran cuando se toca la foto */}
        {activePlayerActions === player.id && (
          <View style={styles.compactActionButtons}>
            <TouchableOpacity
              style={[styles.compactActionButton, styles.passButton]}
              onPress={(e) => {
                e.stopPropagation();
                handlePass(player.id);
                setActivePlayerActions(null);
              }}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.compactActionButton, styles.likeButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleLike(player.id);
                setActivePlayerActions(null);
              }}
            >
              <Ionicons name="flash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderProfileModal = () => (
    <Modal
      visible={showProfile}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowProfile(false)}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Perfil del Jugador</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (selectedPlayer) {
                setSelectedPlayerForActions(selectedPlayer);
                setUserActionMenuVisible(true);
              }
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
        
        {selectedPlayer && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.profileHeader}>
              <Image source={{ uri: selectedPlayer.avatar }} style={styles.profileImage} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{selectedPlayer.name}, {selectedPlayer.age}</Text>
                <Text style={styles.profileDistance}>📍 {selectedPlayer.distance} km de distancia</Text>
                <Text style={styles.profileActivity}>
                  {selectedPlayer.isOnline ? '🟢 En línea ahora' : `⚫ ${selectedPlayer.lastSeen}`}
                </Text>
                <View style={styles.profileRankContainer}>
                  <View style={[styles.profileRankBadge, { backgroundColor: getRankColor(selectedPlayer.rank) }]}>
                    <Text style={styles.profileRankText}>{selectedPlayer.rank}</Text>
                  </View>
                  <Text style={styles.profileGameMode}>🎮 {selectedPlayer.gameMode}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.compatibilitySection}>
              <Text style={styles.sectionTitle}>Compatibilidad</Text>
              <View style={styles.compatibilityBar}>
                <View style={[styles.compatibilityFill, { width: `${selectedPlayer.compatibility}%` }]} />
                <Text style={styles.compatibilityPercentage}>{selectedPlayer.compatibility}%</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Biografía</Text>
              <Text style={styles.bioText}>{selectedPlayer.bio}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>{selectedPlayer.stats.kda}</Text>
                  <Text style={styles.statCardLabel}>K/D Ratio</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>{selectedPlayer.stats.wins}</Text>
                  <Text style={styles.statCardLabel}>Victorias</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>{selectedPlayer.stats.matches}</Text>
                  <Text style={styles.statCardLabel}>Partidas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>{Math.round((selectedPlayer.stats.wins / selectedPlayer.stats.matches) * 100)}%</Text>
                  <Text style={styles.statCardLabel}>Win Rate</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insignias</Text>
              <View style={styles.badgesContainer}>
                {selectedPlayer.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.passModalButton]}
                onPress={() => {
                  handlePass(selectedPlayer.id);
                  setShowProfile(false);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
                <Text style={styles.modalActionText}>Pasar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalActionButton, styles.matchModalButton]}
                onPress={() => {
                  handleLike(selectedPlayer.id);
                  setShowProfile(false);
                }}
              >
                <View style={styles.swordsIcon}>
                  <Text style={styles.swordsText}>⚔️</Text>
                </View>
                <Text style={styles.modalActionText}>Match</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const pendingConnections = connectionRequests.filter(req => req.status === 'pending');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Matchmaking</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'discover' ? 'Encuentra tu squad perfecto' : 'Gestiona tus conexiones'}
          </Text>
        </View>
        
        {activeTab === 'discover' && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={24} color="white" />
            {(filterRank !== 'Todos' || filterGameMode !== 'Todos' || filterServer !== 'Todos' || filterOnlineOnly || filterMinKD !== 'Cualquiera') && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Ionicons 
            name={activeTab === 'discover' ? 'search' : 'search-outline'} 
            size={20} 
            color={activeTab === 'discover' ? '#667eea' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Descubrir
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}
        >
          <Ionicons 
            name={activeTab === 'connections' ? 'people' : 'people-outline'} 
            size={20} 
            color={activeTab === 'connections' ? '#667eea' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
            Conexiones
          </Text>
          {pendingConnections.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingConnections.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      {activeTab === 'discover' ? (
        <View style={styles.playersContainer}>
          <Text style={styles.playersCount}>
            {filteredPlayers.length} jugadores cerca de ti
          </Text>
          
          <ScrollView
            style={styles.playersList}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.playersGrid}>
              {filteredPlayers.slice(0, 6).map(renderPlayerCard)}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.connectionsContainer}>
          <Text style={styles.connectionsCount}>
            {connectionRequests.length} solicitudes de conexión
          </Text>
          
          <ScrollView
            style={styles.connectionsList}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {connectionRequests.length > 0 ? (
              connectionRequests.map(renderConnectionCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No hay conexiones</Text>
                <Text style={styles.emptyStateText}>
                  Cuando otros jugadores quieran conectar contigo, aparecerán aquí.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {renderProfileModal()}
      
      {/* Modal de filtros */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Búsqueda</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeFilterButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              {/* Filtro de Rango */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Rango</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    {['Todos', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Corona', 'As', 'Conquistador'].map((rank) => (
                      <TouchableOpacity
                        key={rank}
                        style={[
                          styles.filterOption,
                          filterRank === rank && styles.filterOptionActive
                        ]}
                        onPress={() => setFilterRank(rank)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filterRank === rank && styles.filterOptionTextActive
                        ]}>
                          {rank}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Filtro de Modo de Juego */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Modo de Juego Preferido</Text>
                <View style={styles.filterOptions}>
                  {['Todos', 'Solo', 'Dúo', 'Escuadra'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.filterOption,
                        filterGameMode === mode && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterGameMode(mode)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterGameMode === mode && styles.filterOptionTextActive
                      ]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Filtro de Servidor */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Servidor PUBG Mobile</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    {['Todos', 'Asia', 'Europa', 'Norte América', 'Sur América', 'Medio Oriente', 'África', 'Krjp'].map((server) => (
                      <TouchableOpacity
                        key={server}
                        style={[
                          styles.filterOption,
                          filterServer === server && styles.filterOptionActive
                        ]}
                        onPress={() => setFilterServer(server)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filterServer === server && styles.filterOptionTextActive
                        ]}>
                          {server}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Filtro de Estado */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFilterOnlineOnly(!filterOnlineOnly)}
                >
                  <View style={[
                    styles.checkbox,
                    filterOnlineOnly && styles.checkboxActive
                  ]}>
                    {filterOnlineOnly && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Solo jugadores en línea</Text>
                </TouchableOpacity>
              </View>
              
              {/* Filtro de K/D Ratio */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>K/D Mínimo</Text>
                <View style={styles.filterOptions}>
                  {['Cualquiera', '1.0+', '1.5+', '2.0+', '3.0+'].map((kd) => (
                    <TouchableOpacity
                      key={kd}
                      style={[
                        styles.filterOption,
                        filterMinKD === kd && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterMinKD(kd)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterMinKD === kd && styles.filterOptionTextActive
                      ]}>
                        {kd}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={() => {
                  setFilterRank('Todos');
                  setFilterGameMode('Todos');
                  setFilterServer('Todos');
                  setFilterOnlineOnly(false);
                  setFilterMinKD('Cualquiera');
                }}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* UserActionMenu */}
      {selectedPlayerForActions && (
        <UserActionMenu
          visible={userActionMenuVisible}
          onClose={() => {
            setUserActionMenuVisible(false);
            setSelectedPlayerForActions(null);
          }}
          userId={selectedPlayerForActions.id}
          displayName={selectedPlayerForActions.name}
          username={selectedPlayerForActions.name}
          onUserBlocked={() => {
            // Remover de la lista de jugadores cuando se bloquea
            setPlayers(prev => prev.filter(p => p.id !== selectedPlayerForActions.id));
            setUserActionMenuVisible(false);
            setSelectedPlayerForActions(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 120, // Espacio para el menú inferior
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  playersCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  playersList: {
    flex: 1,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    maxHeight: 380, // Limitar altura para mostrar solo 2 filas
  },
  playerCard: {
    width: (width - 56) / 3 - 6, // 3 columnas para mejor visualización
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  playerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  compatibilityText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  playerInfo: {
    padding: 8,
    paddingBottom: 40,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  playerAge: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '500',
  },
  rankBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  activityText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: '#6B7280',
  },
  likeButton: {
    backgroundColor: '#EF4444',
  },
  compactStats: {
    flexDirection: 'column',
    gap: 2,
  },
  compactStatText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  compactActionButtons: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  compactActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  profileDistance: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileActivity: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  profileRankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  profileRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileGameMode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  compatibilitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  compatibilityBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  compatibilityFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  compatibilityPercentage: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginBottom: 24,
  },
  bioText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  passModalButton: {
    backgroundColor: '#6B7280',
  },
  likeModalButton: {
    backgroundColor: '#EF4444',
  },
  matchModalButton: {
    backgroundColor: '#667eea',
  },
  swordsIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swordsText: {
    fontSize: 18,
    color: 'white',
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'flex-end',
   },
   filterModal: {
     backgroundColor: 'white',
     borderTopLeftRadius: 20,
     borderTopRightRadius: 20,
     maxHeight: height * 0.8,
   },
  filterContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Connections styles
  connectionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  connectionsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  connectionsList: {
    flex: 1,
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  connectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  connectionRankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  connectionRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectionTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectionStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectionMessage: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  connectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  declineButton: {
    backgroundColor: '#6B7280',
  },
  acceptButton: {
    backgroundColor: '#667eea',
  },
  connectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  closeFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});