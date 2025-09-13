import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PlayerStats {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  survival_time: number;
  placement: number;
  kd_ratio: number;
}

interface TeamStats {
  id: string;
  name: string;
  totalKills: number;
  totalDamage: number;
  averagePlacement: number;
  wins: number;
  matches_played: number;
  points: number;
}

interface LiveStatsProps {
  tournamentId: string;
  refreshInterval?: number;
  showPlayerStats?: boolean;
  showTeamStats?: boolean;
}

const LiveStats: React.FC<LiveStatsProps> = ({
  tournamentId,
  refreshInterval = 10000,
  showPlayerStats = true,
  showTeamStats = true
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  // Mock data para demostración
  const mockTeamStats: TeamStats[] = [
    {
      id: 't1',
      name: 'Team Alpha',
      totalKills: 45,
      totalDamage: 12500,
      averagePlacement: 2.3,
      wins: 3,
      matches_played: 5,
      points: 850
    },
    {
      id: 't2',
      name: 'Team Beta',
      totalKills: 38,
      totalDamage: 11200,
      averagePlacement: 3.1,
      wins: 2,
      matches_played: 5,
      points: 720
    },
    {
      id: 't3',
      name: 'Team Gamma',
      totalKills: 42,
      totalDamage: 13100,
      averagePlacement: 2.8,
      wins: 2,
      matches_played: 5,
      points: 780
    },
    {
      id: 't4',
      name: 'Team Delta',
      totalKills: 35,
      totalDamage: 10800,
      averagePlacement: 4.2,
      wins: 1,
      matches_played: 5,
      points: 650
    }
  ];

  const mockPlayerStats: PlayerStats[] = [
    {
      id: 'p1',
      name: 'ProPlayer1',
      teamId: 't1',
      teamName: 'Team Alpha',
      kills: 15,
      deaths: 3,
      assists: 8,
      damage: 3200,
      survival_time: 1800,
      placement: 1,
      kd_ratio: 5.0
    },
    {
      id: 'p2',
      name: 'SkillMaster',
      teamId: 't2',
      teamName: 'Team Beta',
      kills: 12,
      deaths: 4,
      assists: 6,
      damage: 2800,
      survival_time: 1650,
      placement: 2,
      kd_ratio: 3.0
    },
    {
      id: 'p3',
      name: 'FragHunter',
      teamId: 't3',
      teamName: 'Team Gamma',
      kills: 18,
      deaths: 5,
      assists: 4,
      damage: 3500,
      survival_time: 1720,
      placement: 3,
      kd_ratio: 3.6
    },
    {
      id: 'p4',
      name: 'TacticalGod',
      teamId: 't1',
      teamName: 'Team Alpha',
      kills: 11,
      deaths: 2,
      assists: 12,
      damage: 2900,
      survival_time: 1850,
      placement: 1,
      kd_ratio: 5.5
    }
  ];

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, refreshInterval);
    return () => clearInterval(interval);
  }, [tournamentId, refreshInterval]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTeamStats(mockTeamStats.sort((a, b) => b.points - a.points));
      setPlayerStats(mockPlayerStats.sort((a, b) => b.kills - a.kills));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTeamStats = () => (
    <View style={{ flex: 1 }}>
      {teamStats.map((team, index) => (
        <LinearGradient
          key={team.id}
          colors={index === 0 ? ['#fbbf24', '#f59e0b'] : ['#374151', '#1f2937']}
          style={{
            borderRadius: isTablet ? 12 : 8,
            padding: isTablet ? 20 : 16,
            marginBottom: isTablet ? 16 : 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {/* Ranking */}
          <View style={{
            width: isTablet ? 40 : 32,
            height: isTablet ? 40 : 32,
            borderRadius: isTablet ? 20 : 16,
            backgroundColor: index === 0 ? '#ffffff' : '#4b5563',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: isTablet ? 16 : 12
          }}>
            <Text style={{
              color: index === 0 ? '#f59e0b' : 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '700'
            }}>
              {index + 1}
            </Text>
          </View>
          
          {/* Team Info */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '700',
              marginBottom: 4
            }}>
              {team.name}
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: isTablet ? 16 : 12
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Puntos
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {team.points}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Kills
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {team.totalKills}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Victorias
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {team.wins}/{team.matches_played}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Avg. Pos.
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {team.averagePlacement.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Trophy for first place */}
          {index === 0 && (
            <Ionicons name="trophy" size={isTablet ? 28 : 24} color="#ffffff" />
          )}
        </LinearGradient>
      ))}
    </View>
  );

  const renderPlayerStats = () => (
    <View style={{ flex: 1 }}>
      {playerStats.map((player, index) => (
        <LinearGradient
          key={player.id}
          colors={index === 0 ? ['#ef4444', '#dc2626'] : ['#374151', '#1f2937']}
          style={{
            borderRadius: isTablet ? 12 : 8,
            padding: isTablet ? 20 : 16,
            marginBottom: isTablet ? 16 : 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {/* Ranking */}
          <View style={{
            width: isTablet ? 40 : 32,
            height: isTablet ? 40 : 32,
            borderRadius: isTablet ? 20 : 16,
            backgroundColor: index === 0 ? '#ffffff' : '#4b5563',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: isTablet ? 16 : 12
          }}>
            <Text style={{
              color: index === 0 ? '#ef4444' : 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '700'
            }}>
              {index + 1}
            </Text>
          </View>
          
          {/* Player Info */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '700',
              marginBottom: 2
            }}>
              {player.name}
            </Text>
            
            <Text style={{
              color: '#d1d5db',
              fontSize: isTablet ? 14 : 12,
              marginBottom: 8
            }}>
              {player.teamName}
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: isTablet ? 16 : 12
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Kills
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {player.kills}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  K/D
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {player.kd_ratio.toFixed(1)}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Daño
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {player.damage.toLocaleString()}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: '#d1d5db',
                  fontSize: isTablet ? 14 : 12
                }}>
                  Supervivencia
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  {formatTime(player.survival_time)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Crown for MVP */}
          {index === 0 && (
            <Ionicons name="trophy" size={isTablet ? 28 : 24} color="#ffffff" />
          )}
        </LinearGradient>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111827'
      }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 18 : 16,
          marginTop: 16
        }}>
          Cargando estadísticas...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        margin: isTablet ? 20 : 16,
        borderRadius: isTablet ? 12 : 8,
        padding: 4
      }}>
        {showTeamStats && (
          <TouchableOpacity
            onPress={() => setActiveTab('teams')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'teams' ? '#10b981' : 'transparent',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 8 : 6,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '600'
            }}>
              Equipos
            </Text>
          </TouchableOpacity>
        )}
        
        {showPlayerStats && (
          <TouchableOpacity
            onPress={() => setActiveTab('players')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'players' ? '#10b981' : 'transparent',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 8 : 6,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '600'
            }}>
              Jugadores
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Stats Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: isTablet ? 20 : 16,
          paddingTop: 0
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {activeTab === 'teams' ? renderTeamStats() : renderPlayerStats()}
        
        {/* Last updated */}
        <Text style={{
          color: '#6b7280',
          fontSize: isTablet ? 14 : 12,
          textAlign: 'center',
          marginTop: isTablet ? 24 : 20,
          marginBottom: isTablet ? 16 : 12
        }}>
          Última actualización: {new Date().toLocaleTimeString()}
        </Text>
      </ScrollView>
    </View>
  );
};

export default LiveStats;