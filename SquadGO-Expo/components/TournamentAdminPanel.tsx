import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tournament, TournamentRole } from '../lib/types';

interface AdminPanelProps {
  tournamentId: string;
  userId: string;
  isOrganizer: boolean;
  tournament: Tournament;
  onTournamentUpdate?: (tournament: Tournament) => void;
}

interface Participant {
  id: string;
  userId: string;
  username: string;
  email: string;
  joinedAt: Date;
  status: 'active' | 'banned' | 'warned' | 'muted';
  warnings: number;
  lastActivity: Date;
  role: string;
}

interface ModerationAction {
  id: string;
  type: 'ban' | 'unban' | 'warn' | 'mute' | 'unmute' | 'kick' | 'role_change';
  targetUserId: string;
  targetUsername: string;
  moderatorId: string;
  moderatorUsername: string;
  reason: string;
  timestamp: Date;
  duration?: number; // en minutos para mute/ban temporal
  details?: any;
}

interface TournamentSettings {
  maxParticipants: number;
  registrationOpen: boolean;
  allowSpectators: boolean;
  requireApproval: boolean;
  autoAssignRoles: boolean;
  enableChat: boolean;
  enableVoiceChat: boolean;
  moderationLevel: 'low' | 'medium' | 'high';
  autoModeration: boolean;
  bannedWords: string[];
  slowModeDelay: number; // segundos
}

const MODERATION_ACTIONS = {
  ban: { name: 'Banear', color: '#ef4444', icon: 'ban-outline' },
  unban: { name: 'Desbanear', color: '#10b981', icon: 'checkmark-circle-outline' },
  warn: { name: 'Advertir', color: '#f59e0b', icon: 'warning-outline' },
  mute: { name: 'Silenciar', color: '#6b7280', icon: 'volume-mute-outline' },
  unmute: { name: 'Desilenciar', color: '#3b82f6', icon: 'volume-high-outline' },
  kick: { name: 'Expulsar', color: '#f97316', icon: 'exit-outline' },
  role_change: { name: 'Cambiar Rol', color: '#8b5cf6', icon: 'people-outline' }
};

export default function TournamentAdminPanel({
  tournamentId,
  userId,
  isOrganizer,
  tournament,
  onTournamentUpdate
}: AdminPanelProps) {
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings>({
    maxParticipants: tournament.maxParticipants || 32,
    registrationOpen: tournament.status === 'Abierto',
    allowSpectators: true,
    requireApproval: false,
    autoAssignRoles: true,
    enableChat: true,
    enableVoiceChat: false,
    moderationLevel: 'medium',
    autoModeration: false,
    bannedWords: [],
    slowModeDelay: 0
  });
  
  const [activeTab, setActiveTab] = useState<'participants' | 'moderation' | 'settings' | 'analytics'>('participants');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationAction, setModerationAction] = useState<{
    type: keyof typeof MODERATION_ACTIONS;
    reason: string;
    duration?: number;
  }>({ type: 'warn', reason: '', duration: undefined });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar participantes
  useEffect(() => {
    const q = query(
      collection(db, 'tournaments', tournamentId, 'participants'),
      orderBy('joinedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate() || new Date()
      })) as Participant[];
      
      setParticipants(participantsData);
    });

    return unsubscribe;
  }, [tournamentId]);

  // Cargar historial de moderación
  useEffect(() => {
    const q = query(
      collection(db, 'tournaments', tournamentId, 'moderation_history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ModerationAction[];
      
      setModerationHistory(historyData);
    });

    return unsubscribe;
  }, [tournamentId]);

  // Función para ejecutar acción de moderación
  const executeModerationAction = useCallback(async () => {
    if (!selectedParticipant || !moderationAction.reason.trim()) {
      Alert.alert('Error', 'Selecciona un participante y proporciona una razón');
      return;
    }

    try {
      // Registrar acción en el historial
      await addDoc(collection(db, 'tournaments', tournamentId, 'moderation_history'), {
        type: moderationAction.type,
        targetUserId: selectedParticipant.userId,
        targetUsername: selectedParticipant.username,
        moderatorId: userId,
        moderatorUsername: 'Moderador', // Se puede obtener del contexto de usuario
        reason: moderationAction.reason,
        timestamp: new Date(),
        duration: moderationAction.duration,
        details: {
          previousStatus: selectedParticipant.status,
          previousRole: selectedParticipant.role
        }
      });

      // Actualizar estado del participante
      const participantRef = doc(db, 'tournaments', tournamentId, 'participants', selectedParticipant.id);
      let updateData: any = {};

      switch (moderationAction.type) {
        case 'ban':
          updateData = { status: 'banned' };
          break;
        case 'unban':
          updateData = { status: 'active' };
          break;
        case 'warn':
          updateData = { 
            warnings: (selectedParticipant.warnings || 0) + 1,
            status: selectedParticipant.warnings >= 2 ? 'warned' : selectedParticipant.status
          };
          break;
        case 'mute':
          updateData = { status: 'muted' };
          break;
        case 'unmute':
          updateData = { status: 'active' };
          break;
        case 'kick':
          // Eliminar del torneo
          await deleteDoc(participantRef);
          break;
      }

      if (moderationAction.type !== 'kick') {
        await updateDoc(participantRef, updateData);
      }

      setShowModerationModal(false);
      setSelectedParticipant(null);
      setModerationAction({ type: 'warn', reason: '', duration: undefined });
      
      Alert.alert('Éxito', 'Acción de moderación ejecutada correctamente');
      
    } catch (error) {
      console.error('Error executing moderation action:', error);
      Alert.alert('Error', 'No se pudo ejecutar la acción de moderación');
    }
  }, [selectedParticipant, moderationAction, tournamentId, userId]);

  // Función para actualizar configuración del torneo
  const updateTournamentSettings = useCallback(async (newSettings: Partial<TournamentSettings>) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        ...newSettings,
        updatedAt: new Date()
      });
      
      setTournamentSettings(prev => ({ ...prev, ...newSettings }));
      Alert.alert('Éxito', 'Configuración actualizada correctamente');
      
    } catch (error) {
      console.error('Error updating tournament settings:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  }, [tournamentId]);

  // Función para refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente con onSnapshot
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Filtrar participantes por búsqueda
  const filteredParticipants = participants.filter(participant =>
    participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderizar participante
  const renderParticipant = ({ item }: { item: Participant }) => {
    const statusColors = {
      active: '#10b981',
      banned: '#ef4444',
      warned: '#f59e0b',
      muted: '#6b7280'
    };

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedParticipant(item);
          setShowModerationModal(true);
        }}
        style={{
          backgroundColor: '#1f2937',
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: statusColors[item.status]
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600'
            }}>
              {item.username}
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: 14
            }}>
              {item.email}
            </Text>
          </View>
          
          <View style={{
            backgroundColor: statusColors[item.status] + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4
          }}>
            <Text style={{
              color: statusColors[item.status],
              fontSize: 12,
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 12
          }}>
            Rol: {item.role}
          </Text>
          
          {item.warnings > 0 && (
            <View style={{
              backgroundColor: '#f59e0b20',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4
            }}>
              <Text style={{
                color: '#f59e0b',
                fontSize: 10,
                fontWeight: '500'
              }}>
                ⚠️ {item.warnings} advertencias
              </Text>
            </View>
          )}
        </View>
        
        <Text style={{
          color: '#6b7280',
          fontSize: 10,
          marginTop: 4
        }}>
          Unido: {item.joinedAt.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Renderizar acción de moderación
  const renderModerationAction = ({ item }: { item: ModerationAction }) => {
    const actionInfo = MODERATION_ACTIONS[item.type];
    
    return (
      <View style={{
        backgroundColor: '#1f2937',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: actionInfo.color
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Ionicons name={actionInfo.icon as any} size={20} color={actionInfo.color} />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8
          }}>
            {actionInfo.name}
          </Text>
        </View>
        
        <Text style={{
          color: '#d1d5db',
          fontSize: 14,
          marginBottom: 4
        }}>
          Usuario: {item.targetUsername}
        </Text>
        
        <Text style={{
          color: '#d1d5db',
          fontSize: 14,
          marginBottom: 4
        }}>
          Moderador: {item.moderatorUsername}
        </Text>
        
        <Text style={{
          color: '#9ca3af',
          fontSize: 14,
          marginBottom: 8
        }}>
          Razón: {item.reason}
        </Text>
        
        {item.duration && (
          <Text style={{
            color: '#f59e0b',
            fontSize: 12,
            marginBottom: 4
          }}>
            Duración: {item.duration} minutos
          </Text>
        )}
        
        <Text style={{
          color: '#6b7280',
          fontSize: 12
        }}>
          {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        margin: 16,
        borderRadius: 8,
        padding: 4
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('participants')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'participants' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            👥 Participantes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('moderation')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'moderation' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            🛡️ Moderación
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'settings' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ⚙️ Configuración
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'analytics' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📊 Analíticas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {activeTab === 'participants' && (
          <View style={{ flex: 1 }}>
            {/* Barra de búsqueda */}
            <View style={{
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar participantes..."
                placeholderTextColor="#9ca3af"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: 'white',
                  fontSize: 16
                }}
              />
            </View>
            
            <FlatList
              data={filteredParticipants}
              renderItem={renderParticipant}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3b82f6"
                />
              }
              ListEmptyComponent={
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 40
                }}>
                  <Ionicons name="people-outline" size={48} color="#6b7280" />
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 16,
                    marginTop: 16,
                    textAlign: 'center'
                  }}>
                    No hay participantes aún
                  </Text>
                </View>
              }
            />
          </View>
        )}
        
        {activeTab === 'moderation' && (
          <FlatList
            data={moderationHistory}
            renderItem={renderModerationAction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3b82f6"
              />
            }
            ListEmptyComponent={
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40
              }}>
                <Ionicons name="shield-outline" size={48} color="#6b7280" />
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 16,
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  No hay acciones de moderación registradas
                </Text>
              </View>
            }
          />
        )}
        
        {activeTab === 'settings' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Configuración general */}
            <View style={{
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 16
              }}>
                ⚙️ Configuración General
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>Registro Abierto</Text>
                <Switch
                  value={tournamentSettings.registrationOpen}
                  onValueChange={(value) => updateTournamentSettings({ registrationOpen: value })}
                  trackColor={{ false: '#374151', true: '#3b82f6' }}
                  thumbColor={tournamentSettings.registrationOpen ? 'white' : '#9ca3af'}
                />
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>Permitir Espectadores</Text>
                <Switch
                  value={tournamentSettings.allowSpectators}
                  onValueChange={(value) => updateTournamentSettings({ allowSpectators: value })}
                  trackColor={{ false: '#374151', true: '#3b82f6' }}
                  thumbColor={tournamentSettings.allowSpectators ? 'white' : '#9ca3af'}
                />
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>Requerir Aprobación</Text>
                <Switch
                  value={tournamentSettings.requireApproval}
                  onValueChange={(value) => updateTournamentSettings({ requireApproval: value })}
                  trackColor={{ false: '#374151', true: '#3b82f6' }}
                  thumbColor={tournamentSettings.requireApproval ? 'white' : '#9ca3af'}
                />
              </View>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>Auto-asignar Roles</Text>
                <Switch
                  value={tournamentSettings.autoAssignRoles}
                  onValueChange={(value) => updateTournamentSettings({ autoAssignRoles: value })}
                  trackColor={{ false: '#374151', true: '#3b82f6' }}
                  thumbColor={tournamentSettings.autoAssignRoles ? 'white' : '#9ca3af'}
                />
              </View>
            </View>
            
            {/* Configuración de moderación */}
            <View style={{
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 16
              }}>
                🛡️ Configuración de Moderación
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Text style={{ color: 'white', fontSize: 14 }}>Auto-moderación</Text>
                <Switch
                  value={tournamentSettings.autoModeration}
                  onValueChange={(value) => updateTournamentSettings({ autoModeration: value })}
                  trackColor={{ false: '#374151', true: '#ef4444' }}
                  thumbColor={tournamentSettings.autoModeration ? 'white' : '#9ca3af'}
                />
              </View>
              
              <Text style={{
                color: 'white',
                fontSize: 14,
                marginBottom: 8
              }}>
                Nivel de Moderación
              </Text>
              
              <View style={{
                flexDirection: 'row',
                marginBottom: 16
              }}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => updateTournamentSettings({ moderationLevel: level as any })}
                    style={{
                      backgroundColor: tournamentSettings.moderationLevel === level ? '#ef4444' : '#374151',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginRight: 8
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {level === 'low' ? 'Bajo' : level === 'medium' ? 'Medio' : 'Alto'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
        
        {activeTab === 'analytics' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Estadísticas básicas */}
            <View style={{
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 16
              }}>
                📊 Estadísticas del Torneo
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    color: '#3b82f6',
                    fontSize: 24,
                    fontWeight: '700'
                  }}>
                    {participants.length}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12
                  }}>
                    Participantes
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    color: '#ef4444',
                    fontSize: 24,
                    fontWeight: '700'
                  }}>
                    {participants.filter(p => p.status === 'banned').length}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12
                  }}>
                    Baneados
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    color: '#f59e0b',
                    fontSize: 24,
                    fontWeight: '700'
                  }}>
                    {participants.reduce((sum, p) => sum + (p.warnings || 0), 0)}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12
                  }}>
                    Advertencias
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    color: '#10b981',
                    fontSize: 24,
                    fontWeight: '700'
                  }}>
                    {moderationHistory.length}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12
                  }}>
                    Acciones
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal de moderación */}
      <Modal
        visible={showModerationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModerationModal(false)}
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
              onPress={() => setShowModerationModal(false)}
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
              Moderar: {selectedParticipant?.username}
            </Text>
            
            <TouchableOpacity
              onPress={executeModerationAction}
              style={{
                backgroundColor: '#ef4444',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Ejecutar
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Tipo de acción */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Tipo de Acción
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}>
                {Object.entries(MODERATION_ACTIONS).map(([type, info]) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setModerationAction(prev => ({ ...prev, type: type as any }))}
                    style={{
                      backgroundColor: moderationAction.type === type ? info.color : '#374151',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginRight: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name={info.icon as any} size={16} color="white" />
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '500',
                      marginLeft: 4
                    }}>
                      {info.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Razón */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Razón
              </Text>
              <TextInput
                value={moderationAction.reason}
                onChangeText={(text) => setModerationAction(prev => ({ ...prev, reason: text }))}
                placeholder="Describe la razón de la acción..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  fontSize: 16,
                  textAlignVertical: 'top'
                }}
              />
            </View>
            
            {/* Duración (para mute/ban temporal) */}
            {(moderationAction.type === 'mute' || moderationAction.type === 'ban') && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8
                }}>
                  Duración (minutos, opcional)
                </Text>
                <TextInput
                  value={moderationAction.duration?.toString() || ''}
                  onChangeText={(text) => setModerationAction(prev => ({
                    ...prev,
                    duration: text ? parseInt(text) : undefined
                  }))}
                  placeholder="Dejar vacío para permanente"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  style={{
                    backgroundColor: '#1f2937',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    fontSize: 16
                  }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}