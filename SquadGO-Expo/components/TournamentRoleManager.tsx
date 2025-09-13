import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { TournamentRole, TournamentPermission } from '../lib/types';

interface TournamentRoleManagerProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  roles: TournamentRole[];
  onUpdateRoles: (roles: TournamentRole[]) => void;
  currentUserRole?: string;
}

const AVAILABLE_PERMISSIONS: { key: TournamentPermission; label: string; description: string }[] = [
  { key: 'VIEW_CHANNELS', label: 'Ver Canales', description: 'Permite ver los canales del torneo' },
  { key: 'SEND_MESSAGES', label: 'Enviar Mensajes', description: 'Permite enviar mensajes en los canales' },
  { key: 'READ_MESSAGE_HISTORY', label: 'Leer Historial', description: 'Permite leer el historial de mensajes' },
  { key: 'MANAGE_MESSAGES', label: 'Gestionar Mensajes', description: 'Permite eliminar y editar mensajes de otros' },
  { key: 'MANAGE_CHANNELS', label: 'Gestionar Canales', description: 'Permite crear, editar y eliminar canales' },
  { key: 'MANAGE_ROLES', label: 'Gestionar Roles', description: 'Permite crear, editar y asignar roles' },
  { key: 'KICK_MEMBERS', label: 'Expulsar Usuarios', description: 'Permite expulsar usuarios del torneo' },
  { key: 'BAN_MEMBERS', label: 'Banear Usuarios', description: 'Permite banear usuarios permanentemente' },
  { key: 'VIEW_AUDIT_LOG', label: 'Ver Registro de Auditoría', description: 'Permite ver el registro de acciones' },
  { key: 'MANAGE_TOURNAMENT', label: 'Gestionar Torneo', description: 'Permite modificar configuraciones del torneo' }
];

const ROLE_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Amarillo
  '#ef4444', // Rojo
  '#8b5cf6', // Púrpura
  '#06b6d4', // Cian
  '#f97316', // Naranja
  '#84cc16', // Lima
  '#ec4899', // Rosa
  '#6b7280'  // Gris
];

export default function TournamentRoleManager({
  visible,
  onClose,
  tournamentId,
  roles,
  onUpdateRoles,
  currentUserRole
}: TournamentRoleManagerProps) {
  const { isTablet } = useDeviceInfo();
  const [selectedRole, setSelectedRole] = useState<TournamentRole | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0]);
  const [newRolePermissions, setNewRolePermissions] = useState<TournamentPermission[]>([]);
  const [editingRole, setEditingRole] = useState<TournamentRole | null>(null);

  const canManageRoles = currentUserRole === 'organizer' || 
    roles.find(r => r.name === currentUserRole)?.permissions.includes('MANAGE_ROLES');

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      Alert.alert('Error', 'El nombre del rol es requerido');
      return;
    }

    if (roles.some(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
      Alert.alert('Error', 'Ya existe un rol con ese nombre');
      return;
    }

    const newRole: TournamentRole = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      color: newRoleColor,
      permissions: newRolePermissions,
      position: roles.length,
      mentionable: true,
      assignedUsers: []
    };

    const updatedRoles = [...roles, newRole];
    onUpdateRoles(updatedRoles);
    
    // Reset form
    setNewRoleName('');
    setNewRoleColor(ROLE_COLORS[0]);
    setNewRolePermissions([]);
    setShowCreateRole(false);
    
    Alert.alert('Éxito', 'Rol creado exitosamente');
  };

  const handleEditRole = (role: TournamentRole) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleColor(role.color);
    setNewRolePermissions([...role.permissions]);
    setShowCreateRole(true);
  };

  const handleUpdateRole = () => {
    if (!editingRole || !newRoleName.trim()) {
      Alert.alert('Error', 'El nombre del rol es requerido');
      return;
    }

    const updatedRoles = roles.map(r => 
      r.id === editingRole.id 
        ? { ...r, name: newRoleName, color: newRoleColor, permissions: newRolePermissions }
        : r
    );
    
    onUpdateRoles(updatedRoles);
    
    // Reset form
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleColor(ROLE_COLORS[0]);
    setNewRolePermissions([]);
    setShowCreateRole(false);
    
    Alert.alert('Éxito', 'Rol actualizado exitosamente');
  };

  const handleDeleteRole = (role: TournamentRole) => {
    if (['Organizador', 'Participante'].includes(role.name)) {
      Alert.alert('Error', 'No se pueden eliminar los roles predeterminados');
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar el rol "${role.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedRoles = roles.filter(r => r.id !== role.id);
            onUpdateRoles(updatedRoles);
            Alert.alert('Éxito', 'Rol eliminado exitosamente');
          }
        }
      ]
    );
  };

  const togglePermission = (permission: TournamentPermission) => {
    if (newRolePermissions.includes(permission)) {
      setNewRolePermissions(prev => prev.filter(p => p !== permission));
    } else {
      setNewRolePermissions(prev => [...prev, permission]);
    }
  };

  const renderRole = ({ item: role }: { item: TournamentRole }) => (
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
        marginBottom: isTablet ? 16 : 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: isTablet ? 20 : 16,
            height: isTablet ? 20 : 16,
            borderRadius: isTablet ? 10 : 8,
            backgroundColor: role.color,
            marginRight: isTablet ? 12 : 8
          }} />
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 18 : 16,
            fontWeight: '600',
            flex: 1
          }}>
            {role.name}
          </Text>
        </View>
        
        {canManageRoles && (
          <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
            <TouchableOpacity
              onPress={() => handleEditRole(role)}
              style={{
                padding: isTablet ? 8 : 6,
                backgroundColor: '#4b5563',
                borderRadius: isTablet ? 8 : 6
              }}
            >
              <Ionicons name="pencil" size={isTablet ? 18 : 16} color="white" />
            </TouchableOpacity>
            
            {!['Organizador', 'Participante'].includes(role.name) && (
              <TouchableOpacity
                onPress={() => handleDeleteRole(role)}
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
      
      <Text style={{
        color: '#9ca3af',
        fontSize: isTablet ? 14 : 12,
        marginBottom: isTablet ? 12 : 8
      }}>
        {role.assignedUsers.length} miembro(s)
      </Text>
      
      <Text style={{
        color: '#d1d5db',
        fontSize: isTablet ? 14 : 12,
        marginBottom: isTablet ? 8 : 6
      }}>
        Permisos: {role.permissions.length}
      </Text>
      
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isTablet ? 8 : 6
      }}>
        {role.permissions.slice(0, 3).map(permission => {
          const permissionInfo = AVAILABLE_PERMISSIONS.find(p => p.key === permission);
          return (
            <View key={permission} style={{
              backgroundColor: '#4b5563',
              paddingHorizontal: isTablet ? 12 : 8,
              paddingVertical: isTablet ? 6 : 4,
              borderRadius: isTablet ? 12 : 8
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 12 : 10
              }}>
                {permissionInfo?.label || permission}
              </Text>
            </View>
          );
        })}
        {role.permissions.length > 3 && (
          <View style={{
            backgroundColor: '#6b7280',
            paddingHorizontal: isTablet ? 12 : 8,
            paddingVertical: isTablet ? 6 : 4,
            borderRadius: isTablet ? 12 : 8
          }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 12 : 10
            }}>
              +{role.permissions.length - 3}
            </Text>
          </View>
        )}
      </View>
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
            Gestión de Roles
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
          {/* Create Role Button */}
          {canManageRoles && (
            <TouchableOpacity
              onPress={() => setShowCreateRole(true)}
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
                Crear Nuevo Rol
              </Text>
            </TouchableOpacity>
          )}

          {/* Roles List */}
          <FlatList
            data={roles}
            renderItem={renderRole}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Create/Edit Role Modal */}
        <Modal
          visible={showCreateRole}
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
                {editingRole ? 'Editar Rol' : 'Crear Rol'}
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  setShowCreateRole(false);
                  setEditingRole(null);
                  setNewRoleName('');
                  setNewRoleColor(ROLE_COLORS[0]);
                  setNewRolePermissions([]);
                }}
                style={{ padding: isTablet ? 12 : 8 }}
              >
                <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
              {/* Role Name */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Nombre del Rol
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    fontSize: isTablet ? 18 : 16
                  }}
                  placeholder="Ej: Moderador"
                  placeholderTextColor="#9ca3af"
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                />
              </View>

              {/* Role Color */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Color del Rol
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: isTablet ? 12 : 8
                }}>
                  {ROLE_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewRoleColor(color)}
                      style={{
                        width: isTablet ? 40 : 32,
                        height: isTablet ? 40 : 32,
                        borderRadius: isTablet ? 20 : 16,
                        backgroundColor: color,
                        borderWidth: newRoleColor === color ? 3 : 0,
                        borderColor: 'white'
                      }}
                    />
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
                  Permisos
                </Text>
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <TouchableOpacity
                    key={permission.key}
                    onPress={() => togglePermission(permission.key)}
                    style={{
                      backgroundColor: '#374151',
                      padding: isTablet ? 16 : 12,
                      borderRadius: isTablet ? 10 : 8,
                      marginBottom: isTablet ? 12 : 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: newRolePermissions.includes(permission.key) ? '#3b82f6' : '#4b5563'
                    }}
                  >
                    <View style={{
                      width: isTablet ? 24 : 20,
                      height: isTablet ? 24 : 20,
                      borderRadius: isTablet ? 12 : 10,
                      backgroundColor: newRolePermissions.includes(permission.key) ? '#3b82f6' : '#6b7280',
                      marginRight: isTablet ? 12 : 8,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {newRolePermissions.includes(permission.key) && (
                        <Ionicons name="checkmark" size={isTablet ? 16 : 14} color="white" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: 'white',
                        fontSize: isTablet ? 16 : 14,
                        fontWeight: '600'
                      }}>
                        {permission.label}
                      </Text>
                      <Text style={{
                        color: '#9ca3af',
                        fontSize: isTablet ? 14 : 12,
                        marginTop: 2
                      }}>
                        {permission.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
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
                    setShowCreateRole(false);
                    setEditingRole(null);
                    setNewRoleName('');
                    setNewRoleColor(ROLE_COLORS[0]);
                    setNewRolePermissions([]);
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
                  onPress={editingRole ? handleUpdateRole : handleCreateRole}
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
                    {editingRole ? 'Actualizar' : 'Crear'}
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