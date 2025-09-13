import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface GameStats {
  kills: number;
  deaths: number;
  wins: number;
  matches: number;
  kdr: number;
  winRate: number;
  avgDamage: number;
  headshots: number;
  survivalTime: number;
  rank: string;
  rankPoints: number;
  season: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  reward: string;
}

interface Weapon {
  id: string;
  name: string;
  type: 'assault' | 'sniper' | 'smg' | 'shotgun' | 'pistol' | 'lmg';
  image: string;
  kills: number;
  damage: number;
  accuracy: number;
  headshots: number;
  isFavorite: boolean;
}

interface ClanMember {
  id: string;
  username: string;
  avatar: string;
  rank: string;
  level: number;
  isOnline: boolean;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  joinedAt: number;
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  logo: string;
  level: number;
  members: ClanMember[];
  maxMembers: number;
  description: string;
  requirements: string;
  isPublic: boolean;
  totalTrophies: number;
  weeklyTrophies: number;
  region: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  image: string;
  startDate: number;
  endDate: number;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  entryFee: number;
  gameMode: string;
  status: 'upcoming' | 'live' | 'ended';
  isRegistered: boolean;
}

interface Match {
  id: string;
  gameMode: string;
  map: string;
  duration: number;
  placement: number;
  kills: number;
  damage: number;
  survival: number;
  teammates: string[];
  result: 'win' | 'loss';
  timestamp: number;
  rankChange: number;
}

interface GamingIntegrationProps {
  userStats: GameStats;
  achievements: Achievement[];
  weapons: Weapon[];
  clan?: Clan;
  tournaments: Tournament[];
  recentMatches: Match[];
  friends: any[];
  onJoinMatch?: (gameMode: string) => void;
  onJoinClan?: (clanId: string) => void;
  onCreateClan?: () => void;
  onJoinTournament?: (tournamentId: string) => void;
  onInviteFriend?: (friendId: string) => void;
  onViewMatch?: (matchId: string) => void;
}

const GAME_MODES = [
  { id: 'classic', name: 'Clásico', icon: '🏆', players: '100', duration: '30min' },
  { id: 'arcade', name: 'Arcade', icon: '⚡', players: '28', duration: '10min' },
  { id: 'arena', name: 'Arena', icon: '⚔️', players: '8', duration: '5min' },
  { id: 'payload', name: 'Payload', icon: '🚛', players: '28', duration: '15min' },
  { id: 'metro', name: 'Metro Royale', icon: '🚇', players: '40', duration: '20min' },
  { id: 'zombie', name: 'Zombie', icon: '🧟', players: '60', duration: '25min' },
];

const RANKS = [
  { name: 'Bronze', color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', color: '#E5E4E2', icon: '💎' },
  { name: 'Diamond', color: '#B9F2FF', icon: '💠' },
  { name: 'Crown', color: '#FF6B35', icon: '👑' },
  { name: 'Ace', color: '#9C27B0', icon: '🔥' },
  { name: 'Conqueror', color: '#FF1744', icon: '⭐' },
];

export const GamingIntegration: React.FC<GamingIntegrationProps> = ({
  userStats,
  achievements,
  weapons,
  clan,
  tournaments,
  recentMatches,
  friends,
  onJoinMatch,
  onJoinClan,
  onCreateClan,
  onJoinTournament,
  onInviteFriend,
  onViewMatch
}) => {
  const [selectedTab, setSelectedTab] = useState('home');
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState('classic');
  const [showClanDetails, setShowClanDetails] = useState(false);
  const [showTournaments, setShowTournaments] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [matchmakingTime, setMatchmakingTime] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSearchingMatch) {
      const timer = setInterval(() => {
        setMatchmakingTime(prev => prev + 1);
      }, 1000);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      return () => {
        clearInterval(timer);
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    }
  }, [isSearchingMatch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getRankInfo = (rank: string) => {
    return RANKS.find(r => r.name.toLowerCase() === rank.toLowerCase()) || RANKS[0];
  };

  const startMatchmaking = () => {
    setIsSearchingMatch(true);
    setMatchmakingTime(0);
    
    // Simulate finding a match after 10-30 seconds
    const matchTime = Math.random() * 20000 + 10000;
    setTimeout(() => {
      setIsSearchingMatch(false);
      setShowMatchmaking(false);
      Alert.alert('¡Partida encontrada!', 'Preparándose para entrar al juego...');
      onJoinMatch?.(selectedGameMode);
    }, matchTime);
  };

  const cancelMatchmaking = () => {
    setIsSearchingMatch(false);
    setMatchmakingTime(0);
  };

  const renderHomeTab = () => {
    const rankInfo = getRankInfo(userStats.rank);
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Player Stats Card */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.statsCard}
        >
          <View style={styles.statsHeader}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankIcon}>{rankInfo.icon}</Text>
              <View>
                <Text style={styles.rankName}>{userStats.rank}</Text>
                <Text style={styles.rankPoints}>{userStats.rankPoints} RP</Text>
              </View>
            </View>
            <View style={styles.seasonInfo}>
              <Text style={styles.seasonText}>Temporada {userStats.season}</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.kills}</Text>
              <Text style={styles.statLabel}>Kills</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.wins}</Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.kdr.toFixed(2)}</Text>
              <Text style={styles.statLabel}>K/D</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(userStats.winRate * 100).toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setShowMatchmaking(true)}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8A65']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.playButtonText}>JUGAR</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowTournaments(true)}
            >
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.actionButtonText}>Torneos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowClanDetails(true)}
            >
              <Ionicons name="people" size={20} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Clan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAchievements(true)}
            >
              <Ionicons name="medal" size={20} color="#9C27B0" />
              <Text style={styles.actionButtonText}>Logros</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partidas Recientes</Text>
          {recentMatches.slice(0, 3).map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchItem}
              onPress={() => onViewMatch?.(match.id)}
            >
              <View style={styles.matchInfo}>
                <Text style={styles.matchMode}>{match.gameMode}</Text>
                <Text style={styles.matchMap}>{match.map}</Text>
                <Text style={styles.matchTime}>{formatTime(match.duration)}</Text>
              </View>
              
              <View style={styles.matchStats}>
                <Text style={styles.matchPlacement}>#{match.placement}</Text>
                <Text style={styles.matchKills}>{match.kills} kills</Text>
                <Text style={[styles.matchResult, match.result === 'win' ? styles.winResult : styles.lossResult]}>
                  {match.result === 'win' ? '+' : ''}{match.rankChange} RP
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Friends Online */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amigos en línea ({friends.filter(f => f.isOnline).length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {friends.filter(f => f.isOnline).map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendItem}
                onPress={() => onInviteFriend?.(friend.id)}
              >
                <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                <View style={styles.friendOnlineIndicator} />
                <Text style={styles.friendName}>{friend.username}</Text>
                <Text style={styles.friendStatus}>{friend.status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  const renderMatchmakingModal = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Modal
        visible={showMatchmaking}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !isSearchingMatch && setShowMatchmaking(false)}
      >
        <View style={styles.matchmakingContainer}>
          <View style={styles.matchmakingHeader}>
            {!isSearchingMatch && (
              <TouchableOpacity onPress={() => setShowMatchmaking(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            )}
            <Text style={styles.matchmakingTitle}>Buscar Partida</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {!isSearchingMatch ? (
            <>
              {/* Game Mode Selection */}
              <Text style={styles.sectionTitle}>Seleccionar Modo de Juego</Text>
              <FlatList
                data={GAME_MODES}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.gameModeItem,
                      selectedGameMode === item.id && styles.selectedGameMode
                    ]}
                    onPress={() => setSelectedGameMode(item.id)}
                  >
                    <Text style={styles.gameModeIcon}>{item.icon}</Text>
                    <View style={styles.gameModeInfo}>
                      <Text style={styles.gameModeName}>{item.name}</Text>
                      <Text style={styles.gameModeDetails}>
                        {item.players} jugadores • {item.duration}
                      </Text>
                    </View>
                    {selectedGameMode === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.gameModesList}
              />
              
              <TouchableOpacity
                style={styles.startMatchmakingButton}
                onPress={startMatchmaking}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8A65']}
                  style={styles.startMatchmakingGradient}
                >
                  <Ionicons name="search" size={24} color="white" />
                  <Text style={styles.startMatchmakingText}>BUSCAR PARTIDA</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.searchingContainer}>
              <Animated.View
                style={[
                  styles.searchingIcon,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { rotate: spin }
                    ]
                  }
                ]}
              >
                <Ionicons name="search" size={60} color="#FF6B35" />
              </Animated.View>
              
              <Text style={styles.searchingText}>Buscando partida...</Text>
              <Text style={styles.searchingTime}>{formatTime(matchmakingTime)}</Text>
              
              <View style={styles.searchingInfo}>
                <Text style={styles.searchingMode}>
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.name}
                </Text>
                <Text style={styles.searchingPlayers}>
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.players} jugadores
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelMatchmaking}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  const renderClanModal = () => {
    return (
      <Modal
        visible={showClanDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClanDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClanDetails(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Clan</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {clan ? (
            <ScrollView style={styles.clanContent}>
              {/* Clan Header */}
              <View style={styles.clanHeader}>
                <Image source={{ uri: clan.logo }} style={styles.clanLogo} />
                <View style={styles.clanInfo}>
                  <Text style={styles.clanName}>{clan.name}</Text>
                  <Text style={styles.clanTag}>[{clan.tag}]</Text>
                  <Text style={styles.clanLevel}>Nivel {clan.level}</Text>
                </View>
                <View style={styles.clanStats}>
                  <Text style={styles.clanTrophies}>{formatNumber(clan.totalTrophies)}</Text>
                  <Text style={styles.clanTrophiesLabel}>Trofeos</Text>
                </View>
              </View>
              
              {/* Clan Description */}
              <View style={styles.clanSection}>
                <Text style={styles.clanSectionTitle}>Descripción</Text>
                <Text style={styles.clanDescription}>{clan.description}</Text>
              </View>
              
              {/* Clan Members */}
              <View style={styles.clanSection}>
                <Text style={styles.clanSectionTitle}>
                  Miembros ({clan.members.length}/{clan.maxMembers})
                </Text>
                {clan.members.map((member) => (
                  <View key={member.id} style={styles.clanMember}>
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    {member.isOnline && <View style={styles.memberOnlineIndicator} />}
                    
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    
                    <View style={styles.memberStats}>
                      <Text style={styles.memberLevel}>Nv. {member.level}</Text>
                      <Text style={styles.memberContribution}>{member.contribution} pts</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noClanContainer}>
              <Ionicons name="people-outline" size={80} color="#ccc" />
              <Text style={styles.noClanText}>No tienes clan</Text>
              <Text style={styles.noClanSubtext}>
                Únete a un clan para jugar con otros jugadores y obtener recompensas
              </Text>
              
              <TouchableOpacity
                style={styles.joinClanButton}
                onPress={onCreateClan}
              >
                <Text style={styles.joinClanButtonText}>CREAR CLAN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.findClanButton}
                onPress={() => {}}
              >
                <Text style={styles.findClanButtonText}>BUSCAR CLAN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'home', name: 'Inicio', icon: 'home' },
      { id: 'stats', name: 'Stats', icon: 'stats-chart' },
      { id: 'weapons', name: 'Armas', icon: 'rifle' },
      { id: 'inventory', name: 'Inventario', icon: 'bag' },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.id ? '#FF6B35' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.activeTabText
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gaming Hub</Text>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <View style={styles.content}>
        {selectedTab === 'home' && renderHomeTab()}
        {/* Other tabs would be implemented here */}
      </View>
      
      {/* Bottom Tabs */}
      {renderTabs()}
      
      {/* Modals */}
      {renderMatchmakingModal()}
      {renderClanModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  statsCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rankIcon: {
    fontSize: 30,
  },
  rankName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  rankPoints: {
    fontSize: 14,
    color: '#FFD700',
  },
  seasonInfo: {
    alignItems: 'flex-end',
  },
  seasonText: {
    fontSize: 12,
    color: '#ccc',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: theme.spacing['3xl'],
  },
  playButton: {
    marginBottom: theme.spacing.lg,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.md,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E1E3F',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.lg,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E3F',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  matchInfo: {
    flex: 1,
  },
  matchMode: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  matchMap: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  matchTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  matchStats: {
    alignItems: 'flex-end',
  },
  matchPlacement: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  matchKills: {
    fontSize: 14,
    color: '#FF6B35',
    marginTop: 2,
  },
  matchResult: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  winResult: {
    color: '#4CAF50',
  },
  lossResult: {
    color: '#F44336',
  },
  friendItem: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    width: 80,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  friendOnlineIndicator: {
    position: 'absolute',
    top: 35,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0F0F23',
  },
  friendName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  friendStatus: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing[1],
  },
  activeTab: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  tabText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6B35',
  },
  matchmakingContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  matchmakingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  matchmakingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  gameModesList: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  gameModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  selectedGameMode: {
    backgroundColor: '#FFF8F5',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  gameModeIcon: {
    fontSize: 24,
  },
  gameModeInfo: {
    flex: 1,
  },
  gameModeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gameModeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  startMatchmakingButton: {
    margin: theme.spacing.xl,
  },
  startMatchmakingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.md,
  },
  startMatchmakingText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  searchingIcon: {
    marginBottom: theme.spacing['3xl'],
  },
  searchingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  searchingTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: theme.spacing['3xl'],
  },
  searchingInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  searchingMode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchingPlayers: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clanContent: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  clanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  clanLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  clanInfo: {
    flex: 1,
  },
  clanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clanTag: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clanLevel: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 2,
  },
  clanStats: {
    alignItems: 'center',
  },
  clanTrophies: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  clanTrophiesLabel: {
    fontSize: 12,
    color: '#666',
  },
  clanSection: {
    marginBottom: theme.spacing.xl,
  },
  clanSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: theme.spacing.md,
  },
  clanDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  clanMember: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberOnlineIndicator: {
    position: 'absolute',
    top: 8,
    left: 32,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  memberContribution: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  noClanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  noClanText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  noClanSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing['3xl'],
  },
  joinClanButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
  },
  joinClanButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  findClanButton: {
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  findClanButtonText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default GamingIntegration;