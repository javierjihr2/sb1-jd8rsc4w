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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TournamentRole, TournamentChannel, TournamentPermission } from '../lib/types';

interface PermissionManagerProps {
  tournamentId: string;
  roles: TournamentRole[];
  channels: TournamentChannel[];
  isOrganizer: boolean;
  onPermissionsUpdate: (roles: TournamentRole[], channels: TournamentChannel[]) => void;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'messages' | 'voice' | 'management';
  dangerous?: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Permisos generales
  { id: 'view_channels', name: 'Ver Canales', description: 'Permite ver canales del torneo', category: 'general' },
  { id: 'read_history', name: 'Leer Historial', description: 'Permite leer mensajes anteriores', category: 'general' },
  { id: 'use_external_emojis', name: 'Emojis Externos', description: 'Permite usar emojis de otros servidores', category: 'general' },
  
  // Permisos de mensajes
  { id: 'send_messages', name: 'Enviar Mensajes', description: 'Permite enviar mensajes en canales de texto', category: 'messages' },
  { id: 'embed_links', name: 'Insertar Enlaces', description: 'Permite que los enlaces se muestren como embeds', category: 'messages' },
  { id: 'attach_files', name: 'Adjuntar Archivos', description: 'Permite subir archivos y imágenes', category: 'messages' },
  { id: 'mention_everyone', name: 'Mencionar @everyone', description: 'Permite usar @everyone y @here', category: 'messages', dangerous: true },
  { id: 'use_slash_commands', name: 'Comandos de Barra', description: 'Permite usar comandos de aplicación', category: 'messages' },
  
  // Permisos de voz
  { id: 'connect_voice', name: 'Conectar a Voz', description: 'Permite unirse a canales de voz', category: 'voice' },
  { id: 'speak', name: 'Hablar', description: 'Permite hablar en canales de voz', category: 'voice' },
  { id: 'mute_members', name: 'Silenciar Miembros', description: 'Permite silenciar otros usuarios', category: 'voice', dangerous: true },
  { id: 'deafen_members', name: 'Ensordecer Miembros', description: 'Permite ensordecer otros usuarios', category: 'voice', dangerous: true },
  { id: 'move_members', name: 'Mover Miembros', description: 'Permite mover usuarios entre canales', category: 'voice', dangerous: true },
  
  // Permisos de gestión
  { id: 'manage_messages', name: 'Gestionar Mensajes', description: 'Permite eliminar y editar mensajes de otros', category: 'management', dangerous: true },
  { id: 'manage_channels', name: 'Gestionar Canales', description: 'Permite crear, editar y eliminar canales', category: 'management', dangerous: true },
  { id: 'manage_roles', name: 'Gestionar Roles', description: 'Permite crear y editar roles', category: 'management', dangerous: true },
  { id: 'kick_users', name: 'Expulsar Usuarios', description: 'Permite expulsar usuarios del torneo', category: 'management', dangerous: true },
  { id: 'ban_users', name: 'Banear Usuarios', description: 'Permite banear usuarios permanentemente', category: 'management', dangerous: true },
  { id: 'administrator', name: 'Administrador', description: 'Otorga todos los permisos', category: 'management', dangerous: true }
];

const PERMISSION_CATEGORIES = {
  general: { name: 'General', color: '#3b82f6', icon: 'eye-outline' },
  messages: { name: 'Mensajes', color: '#10b981', icon: 'chatbubble-outline' },
  voice: { name: 'Voz', color: '#f59e0b', icon: 'mic-outline' },
  management: { name: 'Gestión', color: '#ef4444', icon: 'settings-outline' }
};

export default function TournamentPermissionManager({
  tournamentId,
  roles,
  channels,
  isOrganizer,
  onPermissionsUpdate
}: PermissionManagerProps) {
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  
  const [localRoles, setLocalRoles] = useState<TournamentRole[]>(roles);
  const [localChannels, setLocalChannels] = useState<TournamentChannel[]>(channels);
  const [selectedRole, setSelectedRole] = useState<TournamentRole | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<TournamentChannel | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'channels'>('roles');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Función para actualizar permisos de rol
  const updateRolePermissions = useCallback((roleId: string, permissions: TournamentPermission[]) => {
    const updatedRoles = localRoles.map(role => 
      role.id === roleId ? { ...role, permissions } : role
    );
    setLocalRoles(updatedRoles);
    onPermissionsUpdate(updatedRoles, localChannels);
  }, [localRoles, localChannels, onPermissionsUpdate]);

  // Función para actualizar permisos de canal
  const updateChannelPermissions = useCallback((channelId: string, permissions: any) => {
    const updatedChannels = localChannels.map(channel => 
      channel.id === channelId ? { ...channel, permissions } : channel
    );
    setLocalChannels(updatedChannels);
    onPermissionsUpdate(localRoles, updatedChannels);
  }, [localRoles, localChannels, onPermissionsUpdate]);

  // Función para verificar si un rol tiene un permiso
  const hasPermission = useCallback((role: TournamentRole, permission: TournamentPermission): boolean => {
    return role.permissions.includes(permission) || role.permissions.includes('administrator');
  }, []);

  // Función para alternar permiso de rol
  const togglePermission = useCallback((role: TournamentRole, permission: TournamentPermission) => {
    if (!isOrganizer) return;
    
    let newPermissions = [...role.permissions];
    
    if (permission === 'administrator') {
      // Si se activa administrador, dar todos los permisos
      if (!hasPermission(role, permission)) {
        newPermissions = AVAILABLE_PERMISSIONS.map(p => p.id as TournamentPermission);
      } else {
        // Si se desactiva administrador, quitar todos los permisos peligrosos
        newPermissions = newPermissions.filter(p => 
          !AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.dangerous
        );
      }
    } else {
      // Para otros permisos
      if (hasPermission(role, permission)) {
        newPermissions = newPermissions.filter(p => p !== permission);
        // Si se quita un permiso, también quitar administrador
        newPermissions = newPermissions.filter(p => p !== 'administrator');
      } else {
        newPermissions.push(permission as TournamentPermission);
      }
    }
    
    updateRolePermissions(role.id, newPermissions);
  }, [isOrganizer, hasPermission, updateRolePermissions]);

  // Renderizar permisos por categoría
  const renderPermissionCategory = (category: keyof typeof PERMISSION_CATEGORIES, role: TournamentRole) => {
    const categoryInfo = PERMISSION_CATEGORIES[category];
    const categoryPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === category);
    const isExpanded = expandedCategory === `${role.id}-${category}`;

    return (
      <View key={category} style={{
        marginBottom: 12,
        backgroundColor: '#1f2937',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        <TouchableOpacity
          onPress={() => setExpandedCategory(isExpanded ? null : `${role.id}-${category}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: categoryInfo.color + '20'
          }}
        >
          <Ionicons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            flex: 1
          }}>
            {categoryInfo.name}
          </Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#9ca3af" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={{ padding: 12, paddingTop: 0 }}>
            {categoryPermissions.map(permission => (
              <View key={permission.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: permission.dangerous ? '#fbbf24' : 'white',
                    fontSize: 14,
                    fontWeight: '500'
                  }}>
                    {permission.name}
                    {permission.dangerous && ' ⚠️'}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12,
                    marginTop: 2
                  }}>
                    {permission.description}
                  </Text>
                </View>
                
                <Switch
                  value={hasPermission(role, permission.id as TournamentPermission)}
                  onValueChange={() => togglePermission(role, permission.id as TournamentPermission)}
                  disabled={!isOrganizer}
                  trackColor={{ false: '#374151', true: categoryInfo.color }}
                  thumbColor={hasPermission(role, permission.id as TournamentPermission) ? 'white' : '#9ca3af'}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Renderizar modal de permisos de rol
  const renderRolePermissionsModal = () => (
    <Modal
      visible={showRoleModal && selectedRole !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRoleModal(false)}
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
            onPress={() => setShowRoleModal(false)}
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
            Permisos - {selectedRole?.name}
          </Text>
          
          <View style={{ width: 36 }} />
        </View>
        
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {selectedRole && Object.keys(PERMISSION_CATEGORIES).map(category => 
            renderPermissionCategory(category as keyof typeof PERMISSION_CATEGORIES, selectedRole)
          )}
        </ScrollView>
      </View>
    </Modal>
  );

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
          onPress={() => setActiveTab('roles')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'roles' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            👥 Roles
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('channels')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'channels' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📺 Canales
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'roles' ? (
          <View>
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
              marginBottom: 16
            }}>
              Gestión de Permisos por Rol
            </Text>
            
            {localRoles.map(role => (
              <TouchableOpacity
                key={role.id}
                onPress={() => {
                  setSelectedRole(role);
                  setShowRoleModal(true);
                }}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: role.color
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '600'
                    }}>
                      {role.name}
                    </Text>
                    <Text style={{
                      color: '#9ca3af',
                      fontSize: 14,
                      marginTop: 4
                    }}>
                      {role.permissions.length} permisos asignados
                    </Text>
                    <Text style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      marginTop: 2
                    }}>
                      {role.assignedUsers.length} usuarios asignados
                    </Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
              marginBottom: 16
            }}>
              Gestión de Permisos por Canal
            </Text>
            
            {localChannels.map(channel => (
              <View
                key={channel.id}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <Ionicons 
                    name={channel.type === 'voice' ? 'volume-high' : 'chatbubble'} 
                    size={20} 
                    color="#3b82f6" 
                  />
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 8
                  }}>
                    #{channel.name}
                  </Text>
                </View>
                
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  marginBottom: 12
                }}>
                  {channel.description}
                </Text>
                
                {/* Permisos por rol en este canal */}
                {Object.entries(channel.permissions || {}).map(([roleName, permissions]) => (
                  <View key={roleName} style={{
                    backgroundColor: '#374151',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 8
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '500',
                      marginBottom: 4
                    }}>
                      @{roleName}
                    </Text>
                    <Text style={{
                      color: '#9ca3af',
                      fontSize: 12
                    }}>
                      {Array.isArray(permissions) ? permissions.join(', ') : 'Sin permisos específicos'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {renderRolePermissionsModal()}
    </View>
  );
}