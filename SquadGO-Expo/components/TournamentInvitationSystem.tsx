import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Share,
  Clipboard,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

interface TournamentInvitationSystemProps {
  tournamentId: string;
  userId: string;
  isCreator: boolean;
  tournamentName: string;
  onInvitationSent?: (invitation: any) => void;
}

interface Invitation {
  id: string;
  code: string;
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  type: 'single' | 'multiple' | 'unlimited';
  targetRole?: string;
  description?: string;
}

interface InvitationUsage {
  id: string;
  invitationId: string;
  userId: string;
  userName: string;
  usedAt: any;
  ipAddress?: string;
}

const TournamentInvitationSystem: React.FC<TournamentInvitationSystemProps> = ({
  tournamentId,
  userId,
  isCreator,
  tournamentName,
  onInvitationSent
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'usage'>('create');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationUsages, setInvitationUsages] = useState<InvitationUsage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para crear invitación
  const [invitationType, setInvitationType] = useState<'single' | 'multiple' | 'unlimited'>('multiple');
  const [maxUses, setMaxUses] = useState('10');
  const [expirationHours, setExpirationHours] = useState('24');
  const [targetRole, setTargetRole] = useState('Participante');
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Estados para modal de detalles
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Cargar invitaciones
  useEffect(() => {
    if (!isCreator) return;
    
    const q = query(
      collection(db, 'tournament_invitations'),
      where('tournamentId', '==', tournamentId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
      
      setInvitations(invitationsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    
    return () => unsubscribe();
  }, [tournamentId, isCreator]);
  
  // Cargar usos de invitaciones
  useEffect(() => {
    if (!isCreator) return;
    
    const q = query(
      collection(db, 'invitation_usages'),
      where('tournamentId', '==', tournamentId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InvitationUsage[];
      
      setInvitationUsages(usagesData.sort((a, b) => b.usedAt?.seconds - a.usedAt?.seconds));
    });
    
    return () => unsubscribe();
  }, [tournamentId, isCreator]);

  // Generar código único
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Crear invitación
  const handleCreateInvitation = async () => {
    if (!isCreator) {
      Alert.alert('Error', 'Solo el creador puede generar invitaciones');
      return;
    }
    
    setLoading(true);
    
    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expirationHours));
      
      const invitationData = {
        tournamentId,
        code,
        createdBy: userId,
        createdAt: serverTimestamp(),
        expiresAt,
        maxUses: invitationType === 'unlimited' ? -1 : parseInt(maxUses),
        currentUses: 0,
        isActive: true,
        type: invitationType,
        targetRole,
        description: description.trim() || `Invitación para ${tournamentName}`,
        tournamentName
      };
      
      await addDoc(collection(db, 'tournament_invitations'), invitationData);
      
      // Resetear formulario
      setDescription('');
      setMaxUses('10');
      setExpirationHours('24');
      
      Alert.alert('Éxito', 'Invitación creada correctamente');
      
      if (onInvitationSent) {
        onInvitationSent({ code, type: invitationType });
      }
      
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', 'No se pudo crear la invitación');
    } finally {
      setLoading(false);
    }
  };

  // Compartir invitación
  const handleShareInvitation = async (invitation: Invitation) => {
    const inviteUrl = `squadgo://join/${invitation.code}`;
    const message = `¡Te invito a unirte al torneo "${tournamentName}"!\n\nCódigo de invitación: ${invitation.code}\nEnlace: ${inviteUrl}\n\n¡Nos vemos en la competencia!`;
    
    try {
      await Share.share({
        message,
        title: `Invitación a ${tournamentName}`
      });
    } catch (error) {
      console.error('Error sharing invitation:', error);
    }
  };

  // Copiar código
  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  };

  // Desactivar invitación
  const handleDeactivateInvitation = async (invitationId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres desactivar esta invitación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'tournament_invitations', invitationId), {
                isActive: false
              });
              Alert.alert('Éxito', 'Invitación desactivada');
            } catch (error) {
              console.error('Error deactivating invitation:', error);
              Alert.alert('Error', 'No se pudo desactivar la invitación');
            }
          }
        }
      ]
    );
  };

  // Eliminar invitación
  const handleDeleteInvitation = async (invitationId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar esta invitación? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'tournament_invitations', invitationId));
              Alert.alert('Éxito', 'Invitación eliminada');
            } catch (error) {
              console.error('Error deleting invitation:', error);
              Alert.alert('Error', 'No se pudo eliminar la invitación');
            }
          }
        }
      ]
    );
  };

  // Renderizar invitación
  const renderInvitation = ({ item }: { item: Invitation }) => {
    const isExpired = item.expiresAt && new Date(item.expiresAt.seconds * 1000) < new Date();
    const isMaxUsesReached = item.maxUses !== -1 && item.currentUses >= item.maxUses;
    const isInactive = !item.isActive || isExpired || isMaxUsesReached;
    
    return (
      <View style={{
        backgroundColor: isInactive ? '#374151' : '#1f2937',
        padding: 16,
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isInactive ? '#4b5563' : '#10b981'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{
            color: isInactive ? '#9ca3af' : 'white',
            fontSize: 18,
            fontWeight: '600'
          }}>
            {item.code}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleCopyCode(item.code)}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>📋 Copiar</Text>
            </TouchableOpacity>
            
            {!isInactive && (
              <TouchableOpacity
                onPress={() => handleShareInvitation(item)}
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>📤 Compartir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Text style={{
          color: '#9ca3af',
          fontSize: 14,
          marginBottom: 8
        }}>
          {item.description}
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Tipo: {item.type === 'unlimited' ? 'Ilimitado' : item.type === 'single' ? 'Un uso' : 'Múltiple'}
          </Text>
          
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Usos: {item.currentUses}/{item.maxUses === -1 ? '∞' : item.maxUses}
          </Text>
        </View>
        
        {isExpired && (
          <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>⏰ Expirado</Text>
        )}
        
        {isMaxUsesReached && (
          <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>🚫 Límite alcanzado</Text>
        )}
        
        {!item.isActive && (
          <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600' }}>❌ Desactivado</Text>
        )}
        
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setSelectedInvitation(item);
              setShowDetailsModal(true);
            }}
            style={{
              backgroundColor: '#6366f1',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>👁️ Detalles</Text>
          </TouchableOpacity>
          
          {item.isActive && (
            <TouchableOpacity
              onPress={() => handleDeactivateInvitation(item.id)}
              style={{
                backgroundColor: '#f59e0b',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>⏸️ Desactivar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => handleDeleteInvitation(item.id)}
            style={{
              backgroundColor: '#ef4444',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar uso de invitación
  const renderInvitationUsage = ({ item }: { item: InvitationUsage }) => {
    const invitation = invitations.find(inv => inv.id === item.invitationId);
    
    return (
      <View style={{
        backgroundColor: '#1f2937',
        padding: 16,
        marginVertical: 4,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {item.userName}
          </Text>
          
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            {item.usedAt && new Date(item.usedAt.seconds * 1000).toLocaleString()}
          </Text>
        </View>
        
        <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
          Código usado: {invitation?.code || 'N/A'}
        </Text>
        
        {item.ipAddress && (
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
            IP: {item.ipAddress}
          </Text>
        )}
      </View>
    );
  };

  if (!isCreator) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center' }}>
          Solo el creador del torneo puede gestionar las invitaciones.
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
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 4
      }}>
        {[
          { key: 'create', label: '➕ Crear', icon: '➕' },
          { key: 'manage', label: '📋 Gestionar', icon: '📋' },
          { key: 'usage', label: '📊 Estadísticas', icon: '📊' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent'
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? 'white' : '#9ca3af',
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'create' && (
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 20 }}>
              ➕ Crear Nueva Invitación
            </Text>
            
            {/* Tipo de invitación */}
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              Tipo de Invitación
            </Text>
            
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8 }}>
              {[
                { key: 'single', label: 'Un uso', desc: 'Solo una persona' },
                { key: 'multiple', label: 'Múltiple', desc: 'Varios usos' },
                { key: 'unlimited', label: 'Ilimitado', desc: 'Sin límite' }
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => setInvitationType(type.key as any)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: invitationType === type.key ? '#3b82f6' : '#374151',
                    backgroundColor: invitationType === type.key ? '#1e40af' : '#1f2937'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: 4
                  }}>
                    {type.label}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12,
                    textAlign: 'center'
                  }}>
                    {type.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Configuración básica */}
            {invitationType !== 'unlimited' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Número máximo de usos
                </Text>
                <TextInput
                  value={maxUses}
                  onChangeText={setMaxUses}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: '#1f2937',
                    color: 'white',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#374151',
                    fontSize: 16
                  }}
                  placeholder="10"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Expiración (horas)
              </Text>
              <TextInput
                value={expirationHours}
                onChangeText={setExpirationHours}
                keyboardType="numeric"
                style={{
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#374151',
                  fontSize: 16
                }}
                placeholder="24"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Descripción (opcional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#374151',
                  fontSize: 16,
                  textAlignVertical: 'top'
                }}
                placeholder={`Invitación para ${tournamentName}`}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Configuración avanzada */}
            <TouchableOpacity
              onPress={() => setShowAdvanced(!showAdvanced)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16
              }}
            >
              <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '600' }}>
                {showAdvanced ? '▼' : '▶'} Configuración Avanzada
              </Text>
            </TouchableOpacity>
            
            {showAdvanced && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Rol objetivo
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Participante', 'Espectador', 'Moderador'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setTargetRole(role)}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: targetRole === role ? '#3b82f6' : '#374151',
                        backgroundColor: targetRole === role ? '#1e40af' : '#1f2937'
                      }}
                    >
                      <Text style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleCreateInvitation}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#374151' : '#10b981',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600'
              }}>
                {loading ? '⏳ Creando...' : '🎫 Crear Invitación'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'manage' && (
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 20 }}>
              📋 Gestionar Invitaciones ({invitations.length})
            </Text>
            
            {invitations.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center' }}>
                  No hay invitaciones creadas.\nCrea tu primera invitación en la pestaña "Crear".
                </Text>
              </View>
            ) : (
              <FlatList
                data={invitations}
                renderItem={renderInvitation}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
        
        {activeTab === 'usage' && (
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginBottom: 20 }}>
              📊 Estadísticas de Uso ({invitationUsages.length})
            </Text>
            
            {invitationUsages.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center' }}>
                  No hay registros de uso de invitaciones.
                </Text>
              </View>
            ) : (
              <FlatList
                data={invitationUsages}
                renderItem={renderInvitationUsage}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Modal de detalles */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
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
              Detalles de Invitación
            </Text>
            
            <View style={{ width: 36 }} />
          </View>
          
          {selectedInvitation && (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={{
                backgroundColor: '#1f2937',
                padding: 20,
                borderRadius: 12,
                marginBottom: 20
              }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
                  {selectedInvitation.code}
                </Text>
                
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Tipo:</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {selectedInvitation.type === 'unlimited' ? 'Ilimitado' : 
                       selectedInvitation.type === 'single' ? 'Un uso' : 'Múltiple'}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Usos:</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {selectedInvitation.currentUses}/{selectedInvitation.maxUses === -1 ? '∞' : selectedInvitation.maxUses}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Rol objetivo:</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {selectedInvitation.targetRole}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Estado:</Text>
                    <Text style={{ 
                      color: selectedInvitation.isActive ? '#10b981' : '#ef4444', 
                      fontSize: 14, 
                      fontWeight: '600' 
                    }}>
                      {selectedInvitation.isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Creado:</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {selectedInvitation.createdAt && 
                        new Date(selectedInvitation.createdAt.seconds * 1000).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Expira:</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {selectedInvitation.expiresAt && 
                        new Date(selectedInvitation.expiresAt.seconds * 1000).toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                {selectedInvitation.description && (
                  <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#374151' }}>
                    <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>Descripción:</Text>
                    <Text style={{ color: 'white', fontSize: 14 }}>
                      {selectedInvitation.description}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => handleCopyCode(selectedInvitation.code)}
                  style={{
                    backgroundColor: '#3b82f6',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    📋 Copiar Código
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleShareInvitation(selectedInvitation)}
                  style={{
                    backgroundColor: '#10b981',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    📤 Compartir Invitación
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default TournamentInvitationSystem;