import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Match {
  id: string;
  round: number;
  position: number;
  team1?: {
    id: string;
    name: string;
    score?: number;
  };
  team2?: {
    id: string;
    name: string;
    score?: number;
  };
  winner?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledTime?: Date;
}

interface InteractiveBracketProps {
  tournamentId: string;
  matches: Match[];
  onMatchUpdate: (matchId: string, team1Score: number, team2Score: number, winnerId: string) => void;
  isOrganizer: boolean;
}

const InteractiveBracket: React.FC<InteractiveBracketProps> = ({
  tournamentId,
  matches,
  onMatchUpdate,
  isOrganizer
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [bracketData, setBracketData] = useState<Match[]>(matches);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  useEffect(() => {
    setBracketData(matches);
  }, [matches]);

  // Generar bracket mock si no hay datos
  useEffect(() => {
    if (bracketData.length === 0) {
      const mockMatches: Match[] = [
        // Cuartos de final
        {
          id: '1',
          round: 1,
          position: 1,
          team1: { id: 't1', name: 'Team Alpha', score: 0 },
          team2: { id: 't2', name: 'Team Beta', score: 0 },
          status: 'pending'
        },
        {
          id: '2',
          round: 1,
          position: 2,
          team1: { id: 't3', name: 'Team Gamma', score: 0 },
          team2: { id: 't4', name: 'Team Delta', score: 0 },
          status: 'pending'
        },
        {
          id: '3',
          round: 1,
          position: 3,
          team1: { id: 't5', name: 'Team Epsilon', score: 0 },
          team2: { id: 't6', name: 'Team Zeta', score: 0 },
          status: 'pending'
        },
        {
          id: '4',
          round: 1,
          position: 4,
          team1: { id: 't7', name: 'Team Eta', score: 0 },
          team2: { id: 't8', name: 'Team Theta', score: 0 },
          status: 'pending'
        },
        // Semifinales
        {
          id: '5',
          round: 2,
          position: 1,
          status: 'pending'
        },
        {
          id: '6',
          round: 2,
          position: 2,
          status: 'pending'
        },
        // Final
        {
          id: '7',
          round: 3,
          position: 1,
          status: 'pending'
        }
      ];
      setBracketData(mockMatches);
    }
  }, [bracketData.length]);

  const handleMatchPress = (match: Match) => {
    if (!isOrganizer || match.status === 'completed') return;
    
    setSelectedMatch(match);
    setTeam1Score(match.team1?.score?.toString() || '');
    setTeam2Score(match.team2?.score?.toString() || '');
    setShowScoreModal(true);
  };

  const handleScoreUpdate = () => {
    if (!selectedMatch || !selectedMatch.team1 || !selectedMatch.team2) return;
    
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;
    
    if (score1 === score2) {
      Alert.alert('Error', 'No puede haber empates en el torneo');
      return;
    }
    
    const winnerId = score1 > score2 ? selectedMatch.team1.id : selectedMatch.team2.id;
    
    // Actualizar el match local
    const updatedMatches = bracketData.map(match => {
      if (match.id === selectedMatch.id) {
        return {
          ...match,
          team1: { ...match.team1!, score: score1 },
          team2: { ...match.team2!, score: score2 },
          winner: winnerId,
          status: 'completed' as const
        };
      }
      return match;
    });
    
    setBracketData(updatedMatches);
    onMatchUpdate(selectedMatch.id, score1, score2, winnerId);
    setShowScoreModal(false);
    setSelectedMatch(null);
  };

  const getMatchesByRound = (round: number) => {
    return bracketData.filter(match => match.round === round);
  };

  const renderMatch = (match: Match) => {
    const canEdit = isOrganizer && match.status !== 'completed';
    
    return (
      <TouchableOpacity
        key={match.id}
        onPress={() => handleMatchPress(match)}
        disabled={!canEdit}
        style={{
          backgroundColor: match.status === 'completed' ? '#10b981' : '#374151',
          borderRadius: isTablet ? 12 : 8,
          padding: isTablet ? 16 : 12,
          marginVertical: isTablet ? 8 : 6,
          minWidth: isTablet ? 200 : 160,
          opacity: canEdit ? 1 : 0.8
        }}
      >
        {/* Team 1 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: match.winner === match.team1?.id ? '700' : '500',
            flex: 1
          }}>
            {match.team1?.name || 'TBD'}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 18 : 16,
            fontWeight: '600',
            marginLeft: 8
          }}>
            {match.team1?.score ?? '-'}
          </Text>
        </View>
        
        {/* Divider */}
        <View style={{
          height: 1,
          backgroundColor: '#6b7280',
          marginVertical: 4
        }} />
        
        {/* Team 2 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: match.winner === match.team2?.id ? '700' : '500',
            flex: 1
          }}>
            {match.team2?.name || 'TBD'}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 18 : 16,
            fontWeight: '600',
            marginLeft: 8
          }}>
            {match.team2?.score ?? '-'}
          </Text>
        </View>
        
        {/* Status indicator */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: match.status === 'completed' ? '#10b981' : 
                           match.status === 'in_progress' ? '#f59e0b' : '#6b7280',
            marginRight: 6
          }} />
          <Text style={{
            color: '#9ca3af',
            fontSize: isTablet ? 14 : 12
          }}>
            {match.status === 'completed' ? 'Completado' :
             match.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const maxRounds = Math.max(...bracketData.map(m => m.round), 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          padding: isTablet ? 24 : 16,
          minWidth: '100%'
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: isTablet ? 32 : 24
        }}>
          {Array.from({ length: maxRounds }, (_, roundIndex) => {
            const round = roundIndex + 1;
            const roundMatches = getMatchesByRound(round);
            
            return (
              <View key={round} style={{ alignItems: 'center' }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 20 : 18,
                  fontWeight: '700',
                  marginBottom: isTablet ? 20 : 16,
                  textAlign: 'center'
                }}>
                  {round === maxRounds ? 'Final' :
                   round === maxRounds - 1 ? 'Semifinal' :
                   round === 1 ? 'Cuartos' : `Ronda ${round}`}
                </Text>
                
                <View style={{
                  gap: isTablet ? 24 : 16
                }}>
                  {roundMatches.map(renderMatch)}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Modal para actualizar puntajes */}
      <Modal
        visible={showScoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScoreModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <LinearGradient
            colors={['#1f2937', '#111827']}
            style={{
              borderRadius: isTablet ? 16 : 12,
              padding: isTablet ? 24 : 20,
              width: '100%',
              maxWidth: isTablet ? 400 : 320
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 20 : 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: isTablet ? 24 : 20
            }}>
              Actualizar Puntajes
            </Text>
            
            {/* Team 1 Score */}
            <View style={{ marginBottom: isTablet ? 20 : 16 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                {selectedMatch?.team1?.name}
              </Text>
              <TextInput
                value={team1Score}
                onChangeText={setTeam1Score}
                keyboardType="numeric"
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 18 : 16,
                  textAlign: 'center'
                }}
                placeholder="0"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Team 2 Score */}
            <View style={{ marginBottom: isTablet ? 24 : 20 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                {selectedMatch?.team2?.name}
              </Text>
              <TextInput
                value={team2Score}
                onChangeText={setTeam2Score}
                keyboardType="numeric"
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 18 : 16,
                  textAlign: 'center'
                }}
                placeholder="0"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: isTablet ? 16 : 12
            }}>
              <TouchableOpacity
                onPress={() => setShowScoreModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleScoreUpdate}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  Actualizar
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

export default InteractiveBracket;