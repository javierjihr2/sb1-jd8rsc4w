import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface RankTier {
  id: string;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  divisions?: number;
}

interface PlayerRank {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  tier: string;
  division: number;
  points: number;
  kd: number;
  avgDamage: number;
  winRate: number;
  topTenRate: number;
  matches: number;
  wins: number;
  kills: number;
  mode: 'Solo' | 'Duo' | 'Squad';
  season: string;
  region: string;
}

interface RankingSystemProps {
  visible: boolean;
  onClose: () => void;
}

const rankTiers: RankTier[] = [
  {
    id: 'bronze',
    name: 'Bronce',
    icon: '🥉',
    minPoints: 0,
    maxPoints: 1399,
    color: '#cd7f32',
    divisions: 5
  },
  {
    id: 'silver',
    name: 'Plata',
    icon: '🥈',
    minPoints: 1400,
    maxPoints: 1899,
    color: '#c0c0c0',
    divisions: 5
  },
  {
    id: 'gold',
    name: 'Oro',
    icon: '🥇',
    minPoints: 1900,
    maxPoints: 2399,
    color: '#ffd700',
    divisions: 5
  },
  {
    id: 'platinum',
    name: 'Platino',
    icon: '💎',
    minPoints: 2400,
    maxPoints: 2899,
    color: '#e5e4e2',
    divisions: 5
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: '💠',
    minPoints: 2900,
    maxPoints: 3399,
    color: '#b9f2ff',
    divisions: 5
  },
  {
    id: 'crown',
    name: 'Corona',
    icon: '👑',
    minPoints: 3400,
    maxPoints: 3899,
    color: '#ff6b6b',
    divisions: 5
  },
  {
    id: 'ace',
    name: 'As',
    icon: '⭐',
    minPoints: 3900,
    maxPoints: 4199,
    color: '#ff9500',
    divisions: 3
  },
  {
    id: 'conqueror',
    name: 'Conquistador',
    icon: '🏆',
    minPoints: 4200,
    maxPoints: 9999,
    color: '#ff0080',
    divisions: 1
  }
];

const mockRankings: PlayerRank[] = [
  {
    id: '1',
    playerId: 'player1',
    playerName: 'ProGamer2024',
    avatar: 'https://via.placeholder.com/50x50/3b82f6/ffffff?text=PG',
    tier: 'conqueror',
    division: 1,
    points: 4850,
    kd: 3.2,
    avgDamage: 650,
    winRate: 25.5,
    topTenRate: 78.2,
    matches: 120,
    wins: 31,
    kills: 384,
    mode: 'Squad',
    season: 'C6S1',
    region: 'América'
  },
  {
    id: '2',
    playerId: 'player2',
    playerName: 'SquadLeader',
    avatar: 'https://via.placeholder.com/50x50/10b981/ffffff?text=SL',
    tier: 'ace',
    division: 2,
    points: 4150,
    kd: 2.8,
    avgDamage: 580,
    winRate: 22.1,
    topTenRate: 72.5,
    matches: 95,
    wins: 21,
    kills: 266,
    mode: 'Squad',
    season: 'C6S1',
    region: 'América'
  },
  {
    id: '3',
    playerId: 'player3',
    playerName: 'SniperElite',
    avatar: 'https://via.placeholder.com/50x50/8b5cf6/ffffff?text=SE',
    tier: 'ace',
    division: 1,
    points: 4050,
    kd: 4.1,
    avgDamage: 720,
    winRate: 18.9,
    topTenRate: 65.3,
    matches: 85,
    wins: 16,
    kills: 348,
    mode: 'Solo',
    season: 'C6S1',
    region: 'América'
  },
  {
    id: '4',
    playerId: 'player4',
    playerName: 'RushMaster',
    avatar: 'https://via.placeholder.com/50x50/ef4444/ffffff?text=RM',
    tier: 'crown',
    division: 5,
    points: 3850,
    kd: 2.5,
    avgDamage: 520,
    winRate: 20.3,
    topTenRate: 68.7,
    matches: 110,
    wins: 22,
    kills: 275,
    mode: 'Squad',
    season: 'C6S1',
    region: 'América'
  },
  {
    id: '5',
    playerId: 'player5',
    playerName: 'TacticalGod',
    avatar: 'https://via.placeholder.com/50x50/f59e0b/ffffff?text=TG',
    tier: 'crown',
    division: 3,
    points: 3650,
    kd: 3.0,
    avgDamage: 610,
    winRate: 24.8,
    topTenRate: 75.1,
    matches: 88,
    wins: 22,
    kills: 264,
    mode: 'Duo',
    season: 'C6S1',
    region: 'América'
  }
];

const getRankTier = (tierId: string) => {
  return rankTiers.find(tier => tier.id === tierId) || rankTiers[0];
};

const getKDColor = (kd: number) => {
  if (kd >= 3.0) return '#10b981';
  if (kd >= 2.0) return '#f59e0b';
  if (kd >= 1.0) return '#6b7280';
  return '#ef4444';
};

const getWinRateColor = (winRate: number) => {
  if (winRate >= 20) return '#10b981';
  if (winRate >= 15) return '#f59e0b';
  if (winRate >= 10) return '#6b7280';
  return '#ef4444';
};

export default function RankingSystem({ visible, onClose }: RankingSystemProps) {
  const [selectedMode, setSelectedMode] = useState<'Solo' | 'Duo' | 'Squad'>('Squad');
  const [selectedSeason, setSelectedSeason] = useState('C6S1');
  const [selectedRegion, setSelectedRegion] = useState('América');
  const [showRankInfo, setShowRankInfo] = useState(false);

  const modes = useMemo(() => ['Solo', 'Duo', 'Squad'], []);
  const seasons = useMemo(() => ['C6S1', 'C5S4', 'C5S3', 'C5S2'], []);
  const regions = useMemo(() => ['América', 'Europa', 'Asia', 'Oriente Medio'], []);

  const filteredRankings = useMemo(() => {
    return mockRankings.filter(player => 
      player.mode === selectedMode && 
      player.season === selectedSeason && 
      player.region === selectedRegion
    ).sort((a, b) => b.points - a.points);
  }, [selectedMode, selectedSeason, selectedRegion]);

  const renderRankTierCard = (tier: RankTier) => (
    <View key={tier.id} style={[styles.rankTierCard, { borderColor: tier.color }]}>
      <Text style={styles.rankIcon}>{tier.icon}</Text>
      <View style={styles.rankTierInfo}>
        <Text style={[styles.rankTierName, { color: tier.color }]}>{tier.name}</Text>
        <Text style={styles.rankTierPoints}>
          {tier.minPoints} - {tier.maxPoints === 9999 ? '∞' : tier.maxPoints} pts
        </Text>
        {tier.divisions && tier.divisions > 1 && (
          <Text style={styles.rankTierDivisions}>{tier.divisions} divisiones</Text>
        )}
      </View>
    </View>
  );

  const renderPlayerRank = ({ item, index }: { item: PlayerRank; index: number }) => {
    const tier = getRankTier(item.tier);
    const position = index + 1;
    
    return (
      <View style={styles.playerRankCard}>
        <LinearGradient
          colors={['#1f2937', '#374151']}
          style={styles.playerRankGradient}
        >
          {/* Position */}
          <View style={styles.positionContainer}>
            <Text style={[
              styles.positionText,
              position <= 3 && styles.topPositionText
            ]}>
              #{position}
            </Text>
            {position === 1 && <Text style={styles.crownEmoji}>👑</Text>}
            {position === 2 && <Text style={styles.medalEmoji}>🥈</Text>}
            {position === 3 && <Text style={styles.medalEmoji}>🥉</Text>}
          </View>

          {/* Player Info */}
          <View style={styles.playerInfo}>
            <Image source={{ uri: item.avatar }} style={styles.playerAvatar} />
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{item.playerName}</Text>
              <View style={styles.rankInfo}>
                <Text style={styles.rankIcon}>{tier.icon}</Text>
                <Text style={[styles.rankText, { color: tier.color }]}>
                  {tier.name} {item.division > 1 ? `${item.division}` : ''}
                </Text>
              </View>
              <Text style={styles.pointsText}>{item.points} pts</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>K/D</Text>
              <Text style={[styles.statValue, { color: getKDColor(item.kd) }]}>
                {item.kd.toFixed(1)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Win%</Text>
              <Text style={[styles.statValue, { color: getWinRateColor(item.winRate) }]}>
                {item.winRate.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DMG</Text>
              <Text style={styles.statValue}>{item.avgDamage}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Top10</Text>
              <Text style={styles.statValue}>{item.topTenRate.toFixed(1)}%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rankings</Text>
          <TouchableOpacity 
            onPress={() => setShowRankInfo(true)} 
            style={styles.infoButton}
          >
            <Ionicons name="information-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Mode Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Modo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {modes.map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.filterButton,
                    selectedMode === mode && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedMode(mode as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedMode === mode && styles.filterButtonTextActive
                  ]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Season Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Temporada</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {seasons.map(season => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.filterButton,
                    selectedSeason === season && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedSeason(season)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedSeason === season && styles.filterButtonTextActive
                  ]}>
                    {season}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Region Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Región</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {regions.map(region => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.filterButton,
                    selectedRegion === region && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedRegion(region)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedRegion === region && styles.filterButtonTextActive
                  ]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Rankings List */}
        <FlatList
          data={filteredRankings}
          renderItem={renderPlayerRank}
          keyExtractor={item => item.id}
          style={styles.rankingsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.rankingsContent}
        />

        {/* Rank Info Modal */}
        <Modal 
          visible={showRankInfo} 
          animationType="slide" 
          presentationStyle="pageSheet"
        >
          <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => setShowRankInfo(false)} 
                style={styles.closeButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sistema de Rangos</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.rankInfoContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.rankInfoTitle}>Rangos de PUBG Mobile</Text>
              <Text style={styles.rankInfoDescription}>
                El sistema de rangos se basa en puntos obtenidos por rendimiento en partidas. 
                Cada rango tiene divisiones (excepto Conquistador) y requiere ciertos puntos para avanzar.
              </Text>

              <View style={styles.rankTiersList}>
                {rankTiers.map(renderRankTierCard)}
              </View>

              <View style={styles.rankInfoSection}>
                <Text style={styles.rankInfoSectionTitle}>Cómo ganar puntos:</Text>
                <View style={styles.rankInfoItem}>
                  <Ionicons name="trophy" size={16} color="#10b981" />
                  <Text style={styles.rankInfoItemText}>Posición final en la partida</Text>
                </View>
                <View style={styles.rankInfoItem}>
                  <Ionicons name="skull" size={16} color="#ef4444" />
                  <Text style={styles.rankInfoItemText}>Número de eliminaciones</Text>
                </View>
                <View style={styles.rankInfoItem}>
                  <Ionicons name="heart" size={16} color="#f59e0b" />
                  <Text style={styles.rankInfoItemText}>Tiempo de supervivencia</Text>
                </View>
                <View style={styles.rankInfoItem}>
                  <Ionicons name="shield" size={16} color="#3b82f6" />
                  <Text style={styles.rankInfoItemText}>Daño infligido</Text>
                </View>
              </View>

              <View style={styles.rankInfoSection}>
                <Text style={styles.rankInfoSectionTitle}>Recompensas por temporada:</Text>
                <Text style={styles.rankInfoText}>
                  Al final de cada temporada, recibes recompensas basadas en tu rango más alto alcanzado, 
                  incluyendo outfits exclusivos, marcos de avatar y títulos especiales.
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Modal>
      </LinearGradient>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  rankingsList: {
    flex: 1,
  },
  rankingsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerRankCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  playerRankGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  positionContainer: {
    alignItems: 'center' as const,
    marginRight: 16,
    minWidth: 40,
  },
  positionText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  topPositionText: {
    color: '#ffd700',
  },
  crownEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  medalEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  playerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 16,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  rankInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 2,
  },
  rankIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pointsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  playerStats: {
    flexDirection: 'row' as const,
  },
  statItem: {
    alignItems: 'center' as const,
    marginLeft: 12,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  rankInfoContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rankInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  rankInfoDescription: {
    color: '#9ca3af',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  rankTiersList: {
    marginBottom: 32,
  },
  rankTierCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  rankTierInfo: {
    marginLeft: 16,
  },
  rankTierName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  rankTierPoints: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 2,
  },
  rankTierDivisions: {
    color: '#6b7280',
    fontSize: 12,
  },
  rankInfoSection: {
    marginBottom: 24,
  },
  rankInfoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 12,
  },
  rankInfoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  rankInfoItemText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
  },
  rankInfoText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
};