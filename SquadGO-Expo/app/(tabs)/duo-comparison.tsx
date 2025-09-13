import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PlayerStats {
  wins: number;
  kills: number;
  kdRatio: number;
}

interface Player {
  id: string;
  name: string;
  rank: string;
  avatarUrl: string;
  stats: PlayerStats;
  favoriteWeapons: string[];
  playSchedule: string;
}

interface PlayerComparison {
  synergyAnalysis: string;
  combinedStrengths: string[];
  duoTips: string[];
  verdict: string;
}

// Datos simulados de jugadores
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'ProGamer_Alex',
    rank: 'Conquistador',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 245, kills: 3420, kdRatio: 2.8 },
    favoriteWeapons: ['AKM', 'AWM', 'M416'],
    playSchedule: 'Noches (8PM-12AM)'
  },
  {
    id: '2',
    name: 'SnipeQueen_Luna',
    rank: 'As',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 189, kills: 2890, kdRatio: 3.2 },
    favoriteWeapons: ['Kar98k', 'M24', 'SCAR-L'],
    playSchedule: 'Tardes (4PM-8PM)'
  },
  {
    id: '3',
    name: 'RushMaster_Carlos',
    rank: 'Corona',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 156, kills: 2156, kdRatio: 2.1 },
    favoriteWeapons: ['Vector', 'UMP45', 'M416'],
    playSchedule: 'Mañanas (9AM-1PM)'
  },
  {
    id: '4',
    name: 'TacticalMind_Sara',
    rank: 'As',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 203, kills: 2678, kdRatio: 2.5 },
    favoriteWeapons: ['M416', 'Mini14', 'UMP45'],
    playSchedule: 'Noches (7PM-11PM)'
  },
  {
    id: '5',
    name: 'SupportKing_Miguel',
    rank: 'Diamante',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 134, kills: 1890, kdRatio: 1.8 },
    favoriteWeapons: ['SCAR-L', 'VSS', 'S12K'],
    playSchedule: 'Fines de semana'
  },
  {
    id: '6',
    name: 'FragHunter_Ana',
    rank: 'Corona',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    stats: { wins: 178, kills: 2445, kdRatio: 2.7 },
    favoriteWeapons: ['AKM', 'Kar98k', 'Vector'],
    playSchedule: 'Tardes (3PM-7PM)'
  }
];

// Datos simulados de comparaciones
const mockComparisons: { [key: string]: PlayerComparison } = {
  '1-2': {
    synergyAnalysis: 'Excelente combinación de roles complementarios. Alex como IGL agresivo y Luna como sniper de apoyo crean una sinergia perfecta para control de área y eliminaciones a larga distancia.',
    combinedStrengths: [
      'Cobertura completa de rangos de combate (CQC + Long Range)',
      'Balance perfecto entre agresividad y táctica',
      'Experiencia combinada en rangos altos'
    ],
    duoTips: [
      'Alex debe liderar las rotaciones mientras Luna cubre desde posiciones elevadas',
      'Coordinar horarios de juego para maximizar la práctica conjunta'
    ],
    verdict: 'Dúo de élite con potencial para dominar partidas clasificatorias.'
  },
  '1-3': {
    synergyAnalysis: 'Ambos jugadores tienen un estilo agresivo similar, lo que puede ser tanto una fortaleza como un riesgo. Necesitarán definir roles claros para evitar conflictos tácticos.',
    combinedStrengths: [
      'Dominio absoluto en early game y hot drops',
      'Presión constante sobre equipos enemigos',
      'Excelente sincronización en rushes'
    ],
    duoTips: [
      'Uno debe asumir el rol de IGL para coordinar las agresiones',
      'Practicar estrategias de late game para mejorar supervivencia'
    ],
    verdict: 'Dúo explosivo ideal para partidas agresivas, pero requiere disciplina táctica.'
  },
  '2-4': {
    synergyAnalysis: 'Combinación táctica excepcional. Luna aporta precisión a larga distancia mientras Sara proporciona liderazgo estratégico y versatilidad en combate.',
    combinedStrengths: [
      'Planificación estratégica superior',
      'Ejecución precisa de tácticas complejas',
      'Adaptabilidad a diferentes situaciones de juego'
    ],
    duoTips: [
      'Sara debe coordinar las rotaciones mientras Luna controla las áreas clave',
      'Aprovechar la superposición de horarios para sesiones intensivas'
    ],
    verdict: 'Dúo cerebral con potencial para estrategias innovadoras y victorias consistentes.'
  }
};

export default function DuoComparison() {
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
  const [comparison, setComparison] = useState<PlayerComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [selectingFor, setSelectingFor] = useState<'player1' | 'player2' | null>(null);

  const handlePlayerSelect = (player: Player) => {
    if (selectingFor === 'player1') {
      setSelectedPlayer1(player);
    } else if (selectingFor === 'player2') {
      setSelectedPlayer2(player);
    }
    setShowPlayerModal(false);
    setSelectingFor(null);
  };

  const handleCompare = async () => {
    if (!selectedPlayer1 || !selectedPlayer2) {
      Alert.alert('Error', 'Por favor selecciona dos jugadores para comparar');
      return;
    }

    if (selectedPlayer1.id === selectedPlayer2.id) {
      Alert.alert('Error', 'Por favor selecciona dos jugadores diferentes');
      return;
    }

    setIsLoading(true);
    
    // Simular llamada a API
    setTimeout(() => {
      const key1 = `${selectedPlayer1.id}-${selectedPlayer2.id}`;
      const key2 = `${selectedPlayer2.id}-${selectedPlayer1.id}`;
      const result = mockComparisons[key1] || mockComparisons[key2] || {
        synergyAnalysis: 'Estos jugadores tienen estilos complementarios que pueden funcionar bien juntos con la práctica adecuada.',
        combinedStrengths: ['Experiencia diversa', 'Estilos complementarios'],
        duoTips: ['Practicar comunicación', 'Definir roles claros'],
        verdict: 'Dúo con potencial que requiere práctica para alcanzar su máximo nivel.'
      };
      setComparison(result);
      setIsLoading(false);
    }, 2000);
  };

  const handleShareComparison = async () => {
    if (!comparison || !selectedPlayer1 || !selectedPlayer2) return;
    
    try {
      await Share.share({
        message: `Análisis de Dúo PUBG Mobile\n\n${selectedPlayer1.name} + ${selectedPlayer2.name}\n\n${comparison.verdict}\n\nFortalezas:\n${comparison.combinedStrengths.join('\n')}`,
        title: 'Análisis de Dúo PUBG Mobile'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const resetComparison = () => {
    setSelectedPlayer1(null);
    setSelectedPlayer2(null);
    setComparison(null);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Conquistador': return '#ff6b35';
      case 'As': return '#8b5cf6';
      case 'Corona': return '#fbbf24';
      case 'Diamante': return '#06b6d4';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={28} color="#f97316" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Comparador de Dúos</Text>
              <Text style={styles.headerSubtitle}>Analiza la sinergia entre jugadores</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Player Selection */}
          <View style={styles.selectionContainer}>
            <Text style={styles.sectionTitle}>Selecciona Jugadores</Text>
            
            <View style={styles.playersRow}>
              {/* Player 1 */}
              <TouchableOpacity
                style={styles.playerSlot}
                onPress={() => {
                  setSelectingFor('player1');
                  setShowPlayerModal(true);
                }}
              >
                {selectedPlayer1 ? (
                  <View style={styles.selectedPlayer}>
                    <Image source={{ uri: selectedPlayer1.avatarUrl }} style={styles.playerAvatar} />
                    <Text style={styles.playerName}>{selectedPlayer1.name}</Text>
                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(selectedPlayer1.rank) }]}>
                      <Text style={styles.rankText}>{selectedPlayer1.rank}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name="person-add" size={32} color="#64748b" />
                    <Text style={styles.emptySlotText}>Jugador 1</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* VS */}
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Player 2 */}
              <TouchableOpacity
                style={styles.playerSlot}
                onPress={() => {
                  setSelectingFor('player2');
                  setShowPlayerModal(true);
                }}
              >
                {selectedPlayer2 ? (
                  <View style={styles.selectedPlayer}>
                    <Image source={{ uri: selectedPlayer2.avatarUrl }} style={styles.playerAvatar} />
                    <Text style={styles.playerName}>{selectedPlayer2.name}</Text>
                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(selectedPlayer2.rank) }]}>
                      <Text style={styles.rankText}>{selectedPlayer2.rank}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name="person-add" size={32} color="#64748b" />
                    <Text style={styles.emptySlotText}>Jugador 2</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Compare Button */}
            <TouchableOpacity
              style={[
                styles.compareButton,
                (!selectedPlayer1 || !selectedPlayer2) && styles.compareButtonDisabled
              ]}
              onPress={handleCompare}
              disabled={!selectedPlayer1 || !selectedPlayer2 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="analytics" size={20} color="white" />
              )}
              <Text style={styles.compareButtonText}>
                {isLoading ? 'Analizando...' : 'Analizar Sinergia'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {comparison && !isLoading && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Análisis de Sinergia</Text>
                <View style={styles.resultsActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleShareComparison}>
                    <Ionicons name="share" size={20} color="#f97316" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={resetComparison}>
                    <Ionicons name="refresh" size={20} color="#f97316" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Verdict */}
              <View style={styles.verdictContainer}>
                <View style={styles.verdictIcon}>
                  <Ionicons name="trophy" size={24} color="#f97316" />
                </View>
                <Text style={styles.verdictText}>{comparison.verdict}</Text>
              </View>

              {/* Synergy Analysis */}
              <View style={styles.analysisContainer}>
                <Text style={styles.sectionSubtitle}>Análisis de Sinergia</Text>
                <Text style={styles.analysisText}>{comparison.synergyAnalysis}</Text>
              </View>

              {/* Strengths & Tips */}
              <View style={styles.strengthsTipsContainer}>
                <View style={styles.strengthsContainer}>
                  <Text style={styles.strengthsTitle}>Fortalezas Combinadas</Text>
                  {comparison.combinedStrengths.map((strength, index) => (
                    <View key={index} style={styles.strengthItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.strengthText}>{strength}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Consejos para el Dúo</Text>
                  {comparison.duoTips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons name="bulb" size={16} color="#f59e0b" />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!comparison && !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="people-outline" size={64} color="#64748b" />
              </View>
              <Text style={styles.emptyStateTitle}>Descubre tu Dúo Perfecto</Text>
              <Text style={styles.emptyStateDescription}>
                Selecciona dos jugadores para obtener un análisis detallado de su sinergia y potencial como equipo
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Player Selection Modal */}
        <Modal
          visible={showPlayerModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlayerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Seleccionar {selectingFor === 'player1' ? 'Jugador 1' : 'Jugador 2'}
                </Text>
                <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
                  <Ionicons name="close" size={24} color="#f97316" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.playersList}>
                {mockPlayers
                  .filter(player => 
                    selectingFor === 'player1' 
                      ? player.id !== selectedPlayer2?.id 
                      : player.id !== selectedPlayer1?.id
                  )
                  .map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.playerItem}
                    onPress={() => handlePlayerSelect(player)}
                  >
                    <Image source={{ uri: player.avatarUrl }} style={styles.playerItemAvatar} />
                    <View style={styles.playerItemInfo}>
                      <Text style={styles.playerItemName}>{player.name}</Text>
                      <View style={styles.playerItemStats}>
                        <View style={[styles.playerItemRank, { backgroundColor: getRankColor(player.rank) }]}>
                          <Text style={styles.playerItemRankText}>{player.rank}</Text>
                        </View>
                        <Text style={styles.playerItemKD}>K/D: {player.stats.kdRatio}</Text>
                      </View>
                      <Text style={styles.playerItemSchedule}>{player.playSchedule}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  selectionContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 16,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  playerSlot: {
    flex: 1,
    height: 120,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlayer: {
    alignItems: 'center',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  emptySlot: {
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  vsContainer: {
    width: 40,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
  },
  compareButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compareButtonDisabled: {
    backgroundColor: '#64748b',
  },
  compareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verdictContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  verdictIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#451a03',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verdictText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    lineHeight: 22,
  },
  analysisContainer: {
    marginBottom: 20,
  },
  analysisText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  strengthsTipsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  strengthsContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  strengthsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  tipsContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  playersList: {
    padding: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  playerItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  playerItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerItemRank: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  playerItemRankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  playerItemKD: {
    fontSize: 12,
    color: '#94a3b8',
  },
  playerItemSchedule: {
    fontSize: 12,
    color: '#64748b',
  },
});