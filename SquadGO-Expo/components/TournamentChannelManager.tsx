import * as React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { TournamentChannel, TournamentRole } from '../lib/types';

interface TournamentChannelManagerProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  channels: TournamentChannel[];
  roles: TournamentRole[];
  onUpdateChannels: (channels: TournamentChannel[]) => void;
  currentUserRole?: string;
}

const CHANNEL_TYPES = [
  { key: 'text', label: 'Texto', icon: 'chatbubble-outline' },
  { key: 'voice', label: 'Voz', icon: 'volume-high-outline' },
  { key: 'announcement', label: 'Anuncios', icon: 'megaphone-outline' }
];

export default function TournamentChannelManager({
  visible,
  onClose,
  tournamentId,
  channels,
  roles,
  onUpdateChannels,
  currentUserRole
}: TournamentChannelManagerProps) {
  const { isTablet } = useDeviceInfo();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'announcement' | 'rules' | 'general'>('text');
  const [editingChannel, setEditingChannel] = useState<TournamentChannel | null>(null);
  const [selectedChannelPermissions, setSelectedChannelPermissions] = useState<any>({});

  const canManageChannels = currentUserRole === 'organizer' || 
    roles.find(r => r.name === currentUserRole)?.permissions.includes('MANAGE_CHANNELS');

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) {
      Alert.alert('Error', 'El nombre del canal es requerido');
      return;
    }

    if (channels.some(c => c.name.toLowerCase() === newChannelName.toLowerCase())) {
      Alert.alert('Error', 'Ya existe un canal con ese nombre');
      return;
    }

    const newChannel: TournamentChannel = {
      id: `channel-${Date.now()}`,
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      type: newChannelType,
      description: newChannelDescription,
      position: channels.length,
      permissions: selectedChannelPermissions,
      autoCreated: false
    };

    const updatedChannels = [...channels, newChannel];
    onUpdateChannels(updatedChannels);
    
    // Reset form
    resetForm();
    setShowCreateChannel(false);
    
    Alert.alert('Éxito', 'Canal creado exitosamente');
  };

  const handleEditChannel = (channel: TournamentChannel) => {
    setEditingChannel(channel);
    setNewChannelName(channel.name);
    setNewChannelDescription(channel.description || '');
    setNewChannelType(channel.type);
    setSelectedChannelPermissions(channel.permissions || {});
    setShowCreateChannel(true);
  };

  const handleUpdateChannel = () => {
    if (!editingChannel || !newChannelName.trim()) {
      Alert.alert('Error', 'El nombre del canal es requerido');
      return;
    }

    const updatedChannels = channels.map(c => 
      c.id === editingChannel.id 
        ? { 
            ...c, 
            name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
            description: newChannelDescription,
            type: newChannelType,
            permissions: selectedChannelPermissions
          }
        : c
    );
    
    onUpdateChannels(updatedChannels);
    
    // Reset form
    resetForm();
    setEditingChannel(null);
    setShowCreateChannel(false);
    
    Alert.alert('Éxito', 'Canal actualizado exitosamente');
  };

  const handleDeleteChannel = (channel: TournamentChannel) => {
    if (['general', 'anuncios'].includes(channel.name)) {
      Alert.alert('Error', 'No se pueden eliminar los canales predeterminados');
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar el canal "#${channel.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedChannels = channels.filter(c => c.id !== channel.id);
            onUpdateChannels(updatedChannels);
            Alert.alert('Éxito', 'Canal eliminado exitosamente');
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewChannelName('');
    setNewChannelDescription('');
    setNewChannelType('text');
    setSelectedChannelPermissions({});
  };

  const updateRolePermission = (roleName: string, permission: string, value: boolean) => {
    setSelectedChannelPermissions(prev => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        [permission]: value
      }
    }));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return 'volume-high-outline';
      case 'announcement':
        return 'megaphone-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  const renderChannel = ({ item: channel }: { item: TournamentChannel }) => (
    <View style={{
      backgroundColor: '#374151',
      marginBottom: isTablet ? 16 : 12,
      borderRadius: isTablet ? 12 : 8,
      padding: isTablet ? 20 : 16
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isTablet ? 12 : 8
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons 
            name={getChannelIcon(channel.type)} 
            size={isTablet ? 24 : 20} 
            color="#9ca3af" 
            style={{ marginRight: isTablet ? 12 : 8 }}
          />
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 18 : 16,
            fontWeight: '600',
            flex: 1
          }}>
            #{channel.name}
          </Text>
          <View style={{
            backgroundColor: channel.type === 'voice' ? '#10b981' : channel.type === 'announcement' ? '#f59e0b' : '#3b82f6',
            paddingHorizontal: isTablet ? 8 : 6,
            paddingVertical: isTablet ? 4 : 2,
            borderRadius: isTablet ? 8 : 6,
            marginLeft: isTablet ? 8 : 6
          }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 12 : 10,
              fontWeight: '500'
            }}>
              {CHANNEL_TYPES.find(t => t.key === channel.type)?.label || channel.type}
            </Text>
          </View>
        </View>
        
        {canManageChannels && (
          <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8, marginLeft: isTablet ? 12 : 8 }}>
            <TouchableOpacity
              onPress={() => handleEditChannel(channel)}
              style={{
                padding: isTablet ? 8 : 6,
                backgroundColor: '#4b5563',
                borderRadius: isTablet ? 8 : 6
              }}
            >
              <Ionicons name="pencil" size={isTablet ? 18 : 16} color="white" />
            </TouchableOpacity>
            
            {!['general', 'anuncios'].includes(channel.name) && (
              <TouchableOpacity
                onPress={() => handleDeleteChannel(channel)}
                style={{
                  padding: isTablet ? 8 : 6,
                  backgroundColor: '#ef4444',
                  borderRadius: isTablet ? 8 : 6
                }}
              >
                <Ionicons name="trash" size={isTablet ? 18 : 16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {channel.description && (
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12,
          marginBottom: isTablet ? 8 : 6
        }}>
          {channel.description}
        </Text>
      )}
      
      <Text style={{
        color: '#d1d5db',
        fontSize: isTablet ? 12 : 10
      }}>
        Canal #{channel.position + 1}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{
        flex: 1,
        backgroundColor: '#111827',
        paddingTop: isTablet ? 60 : 50
      }}>
        {/* Header */}
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
            Gestión de Canales
          </Text>
          
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: isTablet ? 12 : 8 }}
          >
            <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
          {/* Create Channel Button */}
          {canManageChannels && (
            <TouchableOpacity
              onPress={() => setShowCreateChannel(true)}
              style={{
                backgroundColor: '#3b82f6',
                padding: isTablet ? 16 : 12,
                borderRadius: isTablet ? 12 : 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isTablet ? 24 : 20
              }}
            >
              <Ionicons name="add" size={isTablet ? 24 : 20} color="white" style={{ marginRight: isTablet ? 8 : 6 }} />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: '600'
              }}>
                Crear Nuevo Canal
              </Text>
            </TouchableOpacity>
          )}

          {/* Channels List */}
          <FlatList
            data={channels}
            renderItem={renderChannel}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Create/Edit Channel Modal */}
        <Modal
          visible={showCreateChannel}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={{
            flex: 1,
            backgroundColor: '#111827',
            paddingTop: isTablet ? 60 : 50
          }}>
            {/* Header */}
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
                {editingChannel ? 'Editar Canal' : 'Crear Canal'}
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  setShowCreateChannel(false);
                  setEditingChannel(null);
                  resetForm();
                }}
                style={{ padding: isTablet ? 12 : 8 }}
              >
                <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
              {/* Channel Name */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Nombre del Canal
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    fontSize: isTablet ? 18 : 16
                  }}
                  placeholder="Ej: estrategias"
                  placeholderTextColor="#9ca3af"
                  value={newChannelName}
                  onChangeText={setNewChannelName}
                />
              </View>

              {/* Channel Description */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Descripción (Opcional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    fontSize: isTablet ? 18 : 16,
                    height: isTablet ? 80 : 60,
                    textAlignVertical: 'top'
                  }}
                  placeholder="Describe el propósito del canal..."
                  placeholderTextColor="#9ca3af"
                  value={newChannelDescription}
                  onChangeText={setNewChannelDescription}
                  multiline
                />
              </View>

              {/* Channel Type */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Tipo de Canal
                </Text>
                <View style={{
                  flexDirection: 'row',
                  gap: isTablet ? 12 : 8
                }}>
                  {CHANNEL_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.key}
                      onPress={() => setNewChannelType(type.key as any)}
                      style={{
                        flex: 1,
                        backgroundColor: newChannelType === type.key ? '#3b82f6' : '#374151',
                        padding: isTablet ? 16 : 12,
                        borderRadius: isTablet ? 10 : 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: newChannelType === type.key ? '#3b82f6' : '#4b5563'
                      }}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={isTablet ? 24 : 20} 
                        color="white" 
                        style={{ marginBottom: isTablet ? 8 : 6 }}
                      />
                      <Text style={{
                        color: 'white',
                        fontSize: isTablet ? 14 : 12,
                        fontWeight: '600'
                      }}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Permissions */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Permisos por Rol
                </Text>
                {roles.map(role => (
                  <View key={role.id} style={{
                    backgroundColor: '#374151',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    marginBottom: isTablet ? 12 : 8
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 16 : 14,
                      fontWeight: '600',
                      marginBottom: isTablet ? 12 : 8
                    }}>
                      {role.name}
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: isTablet ? 12 : 8
                    }}>
                      {['view', 'send_messages', 'read_history', 'manage_messages'].map(permission => (
                        <TouchableOpacity
                          key={permission}
                          onPress={() => updateRolePermission(
                            role.name, 
                            permission, 
                            !selectedChannelPermissions[role.name]?.[permission]
                          )}
                          style={{
                            backgroundColor: selectedChannelPermissions[role.name]?.[permission] ? '#3b82f6' : '#4b5563',
                            paddingHorizontal: isTablet ? 12 : 8,
                            paddingVertical: isTablet ? 8 : 6,
                            borderRadius: isTablet ? 8 : 6
                          }}
                        >
                          <Text style={{
                            color: 'white',
                            fontSize: isTablet ? 12 : 10,
                            fontWeight: '500'
                          }}>
                            {permission.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {/* Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: isTablet ? 16 : 12,
                marginTop: isTablet ? 24 : 20,
                marginBottom: isTablet ? 48 : 40
              }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateChannel(false);
                    setEditingChannel(null);
                    resetForm();
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
                  onPress={editingChannel ? handleUpdateChannel : handleCreateChannel}
                  style={{
                    flex: 1,
                    backgroundColor: '#3b82f6',
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
                    {editingChannel ? 'Actualizar' : 'Crear'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}