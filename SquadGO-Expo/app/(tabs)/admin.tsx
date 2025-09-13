import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAdmin';
import { UserRole, Permission, AdminData } from '../../lib/admin';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import ResponsiveList from '../../components/ResponsiveList';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';

interface User {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: Date;
  currentServer?: string;
}

export default function AdminScreen() {
  const { isTablet, screenSize, isLandscape } = useDeviceInfo();
  
  const {
    userRole,
    isAdmin,
    isSuperAdmin,
    loading: adminLoading,
    checkPermission,
    assignRole,
    revokeRole,
    getAdmins,
    refreshPermissions,
    giftSubscription,
    clearUsers
  } = useAdmin();

  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterByServer, setFilterByServer] = useState(false);
  const [selectedServer, setSelectedServer] = useState('Todos');
  const [giftUserId, setGiftUserId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Lista de servidores disponibles
  const availableServers = ['Todos', 'Asia', 'Europa', 'Sur América', 'Norte América', 'Medio Oriente', 'KRJP', 'No especificado'];

  // Función para regalar suscripción
  const handleGiftSubscription = async () => {
    if (!giftUserId.trim()) {
      Alert.alert('Error', 'Por favor ingresa un ID de usuario válido');
      return;
    }

    setIsProcessing(true);
    const result = await giftSubscription(giftUserId.trim());
    
    if (result.success) {
      Alert.alert('Éxito', 'Suscripción Creador regalada exitosamente');
      setGiftUserId('');
    } else {
      Alert.alert('Error', result.message);
    }
    setIsProcessing(false);
  };

  // Función para limpiar usuarios
  const handleClearUsers = async () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar TODOS los usuarios? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            const result = await clearUsers();
            
            if (result.success) {
              Alert.alert('Éxito', result.message);
              loadUsers(); // Recargar la lista
            } else {
              Alert.alert('Error', result.message);
            }
            setIsProcessing(false);
          }
        }
      ]
    );
  };

  // Verificar si el usuario tiene acceso a la administración
  if (adminLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size={isTablet ? "large" : "large"} color="#8B5CF6" />
          <Text style={{ 
            color: 'white', 
            marginTop: isTablet ? 20 : 16,
            fontSize: isTablet ? 18 : 16
          }}>
            Verificando permisos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: isTablet ? 40 : 20 
        }}>
          <Ionicons name="shield-outline" size={isTablet ? 80 : 64} color="#EF4444" />
          <Text style={{ 
            color: 'white', 
            fontSize: isTablet ? 28 : 24, 
            fontWeight: 'bold', 
            marginTop: isTablet ? 20 : 16, 
            textAlign: 'center' 
          }}>
            Acceso Denegado
          </Text>
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: isTablet ? 18 : 16, 
            marginTop: isTablet ? 12 : 8, 
            textAlign: 'center' 
          }}>
            No tienes permisos para acceder al panel de administración
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const usersList: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || data.username || 'Usuario',
          role: data.role || 'user',
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          currentServer: data.currentServer || 'No especificado'
        });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  // Cargar administradores
  const loadAdmins = async () => {
    try {
      const adminsList = await getAdmins();
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error cargando administradores:', error);
    }
  };

  // Cargar datos iniciales
  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadAdmins()]);
    setLoading(false);
  };

  // Refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshPermissions()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar usuarios por búsqueda y servidor
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesServer = !filterByServer || 
                         selectedServer === 'Todos' || 
                         user.currentServer === selectedServer;
    
    return matchesSearch && matchesServer;
  });

  // Asignar rol
  const handleAssignRole = async (role: UserRole) => {
    if (!selectedUser) return;

    try {
      const result = await assignRole(selectedUser.id, selectedUser.email, role);
      
      if (result.success) {
        Alert.alert('Éxito', result.message);
        await loadData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el rol');
    } finally {
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  // Revocar rol
  const handleRevokeRole = async (userId: string, userName: string) => {
    Alert.alert(
      'Confirmar',
      `¿Estás seguro de que quieres revocar los permisos de administrador de ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await revokeRole(userId);
              
              if (result.success) {
                Alert.alert('Éxito', result.message);
                await loadData();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo revocar el rol');
            }
          }
        }
      ]
    );
  };

  // Renderizar usuario
  const renderUser = ({ item }: { item: User }) => (
    <View style={{
      backgroundColor: '#1E1E3F',
      marginHorizontal: isTablet ? 24 : 16,
      marginVertical: isTablet ? 8 : 4,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 24 : 16,
      borderWidth: item.isAdmin ? 2 : 1,
      borderColor: item.isAdmin ? '#8B5CF6' : '#374151'
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            color: 'white', 
            fontSize: isTablet ? 20 : 16, 
            fontWeight: 'bold' 
          }}>
            {item.displayName}
          </Text>
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: isTablet ? 16 : 14, 
            marginTop: isTablet ? 4 : 2 
          }}>
            {item.email}
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: isTablet ? 8 : 4 
          }}>
            <View style={{
              backgroundColor: item.isAdmin ? '#8B5CF6' : '#374151',
              paddingHorizontal: isTablet ? 12 : 8,
              paddingVertical: isTablet ? 4 : 2,
              borderRadius: isTablet ? 8 : 6
            }}>
              <Text style={{ 
                color: 'white', 
                fontSize: isTablet ? 14 : 12, 
                fontWeight: 'bold' 
              }}>
                {item.role?.toUpperCase() || 'USER'}
              </Text>
            </View>
            {item.isAdmin && (
              <Ionicons 
                name="shield-checkmark" 
                size={isTablet ? 20 : 16} 
                color="#8B5CF6" 
                style={{ marginLeft: isTablet ? 12 : 8 }} 
              />
            )}
          </View>
          {item.currentServer && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: isTablet ? 8 : 4
            }}>
              <Ionicons 
                name="globe-outline" 
                size={isTablet ? 16 : 12} 
                color="#9CA3AF" 
              />
              <Text style={{
                color: '#9CA3AF',
                fontSize: isTablet ? 14 : 12,
                marginLeft: isTablet ? 6 : 4
              }}>
                {item.currentServer}
              </Text>
            </View>
          )}
        </View>
        
        <View style={{ 
          flexDirection: 'row', 
          gap: isTablet ? 12 : 8 
        }}>
          {!item.isAdmin && isSuperAdmin && (
            <TouchableOpacity
              onPress={() => {
                setSelectedUser(item);
                setShowRoleModal(true);
              }}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 10 : 6,
                borderRadius: isTablet ? 8 : 6
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: isTablet ? 14 : 12, 
                fontWeight: 'bold' 
              }}>
                Promover
              </Text>
            </TouchableOpacity>
          )}
          
          {item.isAdmin && item.role !== 'super_admin' && isSuperAdmin && (
            <TouchableOpacity
              onPress={() => handleRevokeRole(item.id, item.displayName)}
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 10 : 6,
                borderRadius: isTablet ? 8 : 6
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: isTablet ? 14 : 12, 
                fontWeight: 'bold' 
              }}>
                Revocar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Renderizar administrador
  const renderAdmin = ({ item }: { item: AdminData }) => (
    <View style={{
      backgroundColor: '#1E1E3F',
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: '#8B5CF6'
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {item.email}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>
            Asignado: {item.assignedAt.toLocaleDateString()}
          </Text>
          <View style={{
            backgroundColor: '#8B5CF6',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            alignSelf: 'flex-start',
            marginTop: 4
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Ionicons name="shield-checkmark" size={24} color="#8B5CF6" />
      </View>
    </View>
  );

  return (
    <ResponsiveLayout>
      <LinearGradient
        colors={['#0F0F23', '#1E1E3F']}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ 
          padding: isTablet ? 24 : 16, 
          borderBottomWidth: 1, 
          borderBottomColor: '#374151' 
        }}>
          <Text style={{ 
            color: 'white', 
            fontSize: isTablet ? 32 : 24, 
            fontWeight: 'bold' 
          }}>
            Panel de Administración
          </Text>
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: isTablet ? 16 : 14, 
            marginTop: isTablet ? 6 : 4 
          }}>
            Rol: {userRole.toUpperCase()}
          </Text>
        </View>

        {/* Estadísticas */}
        <View style={{ 
          flexDirection: isTablet && isLandscape ? 'row' : 'row', 
          padding: isTablet ? 24 : 16, 
          gap: isTablet ? 16 : 12 
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#1E1E3F',
            padding: isTablet ? 24 : 16,
            borderRadius: isTablet ? 16 : 12,
            alignItems: 'center'
          }}>
            <Text style={{ 
              color: '#8B5CF6', 
              fontSize: isTablet ? 32 : 24, 
              fontWeight: 'bold' 
            }}>
              {users.length}
            </Text>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: isTablet ? 14 : 12 
            }}>
              Usuarios Totales
            </Text>
          </View>
          
          <View style={{
            flex: 1,
            backgroundColor: '#1E1E3F',
            padding: isTablet ? 24 : 16,
            borderRadius: isTablet ? 16 : 12,
            alignItems: 'center'
          }}>
            <Text style={{ 
              color: '#10B981', 
              fontSize: isTablet ? 32 : 24, 
              fontWeight: 'bold' 
            }}>
              {admins.length}
            </Text>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: isTablet ? 14 : 12 
            }}>
              Administradores
            </Text>
          </View>
          
          {isTablet && (
            <View style={{
              flex: 1,
              backgroundColor: '#1E1E3F',
              padding: 24,
              borderRadius: 16,
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: '#F59E0B', 
                fontSize: 32, 
                fontWeight: 'bold' 
              }}>
                {filteredUsers.length}
              </Text>
              <Text style={{ 
                color: '#9CA3AF', 
                fontSize: 14 
              }}>
                Usuarios Filtrados
              </Text>
            </View>
          )}
        </View>

        {/* Búsqueda */}
        <View style={{ 
          paddingHorizontal: isTablet ? 24 : 16, 
          marginBottom: isTablet ? 20 : 16 
        }}>
          <View style={{
            backgroundColor: '#1E1E3F',
            borderRadius: isTablet ? 16 : 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: isTablet ? 20 : 16,
            paddingVertical: isTablet ? 16 : 12
          }}>
            <Ionicons name="search" size={isTablet ? 24 : 20} color="#9CA3AF" />
            <TextInput
              style={{
                flex: 1,
                color: 'white',
                marginLeft: isTablet ? 16 : 12,
                fontSize: isTablet ? 18 : 16
              }}
              placeholder="Buscar usuarios..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Sección para regalar suscripciones */}
        {isAdmin && (
          <View style={{
            paddingHorizontal: isTablet ? 24 : 16,
            marginBottom: isTablet ? 20 : 16
          }}>
            <View style={{
              backgroundColor: '#1E1E3F',
              borderRadius: isTablet ? 16 : 12,
              padding: isTablet ? 20 : 16
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: 'bold',
                marginBottom: isTablet ? 16 : 12
              }}>
                🎁 Regalar Suscripción Creador
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 16 : 14,
                  marginBottom: isTablet ? 16 : 12
                }}
                placeholder="ID del usuario"
                placeholderTextColor="#9CA3AF"
                value={giftUserId}
                onChangeText={setGiftUserId}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: isProcessing ? '#6B7280' : '#10B981',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
                onPress={handleGiftSubscription}
                disabled={isProcessing}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: 'bold'
                }}>
                  {isProcessing ? 'Procesando...' : 'Regalar Suscripción'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sección para limpiar usuarios (solo super admin) */}
        {isSuperAdmin && (
          <View style={{
            paddingHorizontal: isTablet ? 24 : 16,
            marginBottom: isTablet ? 20 : 16
          }}>
            <View style={{
              backgroundColor: '#7F1D1D',
              borderRadius: isTablet ? 16 : 12,
              padding: isTablet ? 20 : 16
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: 'bold',
                marginBottom: isTablet ? 8 : 6
              }}>
                ⚠️ Zona Peligrosa
              </Text>
              <Text style={{
                color: '#FCA5A5',
                fontSize: isTablet ? 14 : 12,
                marginBottom: isTablet ? 16 : 12
              }}>
                Esta acción eliminará TODOS los usuarios (excepto administradores)
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: isProcessing ? '#6B7280' : '#EF4444',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  alignItems: 'center'
                }}
                onPress={handleClearUsers}
                disabled={isProcessing}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: 'bold'
                }}>
                  {isProcessing ? 'Procesando...' : 'Eliminar Todos los Usuarios'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filtros por servidor */}
        <View style={{ 
          paddingHorizontal: isTablet ? 24 : 16, 
          marginBottom: isTablet ? 20 : 16 
        }}>
          <View style={{
            backgroundColor: '#1E1E3F',
            borderRadius: isTablet ? 16 : 12,
            padding: isTablet ? 20 : 16
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isTablet ? 16 : 12
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 18 : 16,
                fontWeight: '600'
              }}>
                Filtrar por servidor
              </Text>
              <TouchableOpacity
                onPress={() => setFilterByServer(!filterByServer)}
                style={{
                  backgroundColor: filterByServer ? '#8B5CF6' : '#6B7280',
                  borderRadius: isTablet ? 20 : 16,
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 8 : 6
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '600'
                }}>
                  {filterByServer ? 'Activado' : 'Desactivado'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {filterByServer && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: isTablet ? 12 : 8
              }}>
                {availableServers.map(server => (
                  <TouchableOpacity
                    key={server}
                    onPress={() => setSelectedServer(server)}
                    style={{
                      backgroundColor: selectedServer === server ? '#8B5CF6' : '#4B5563',
                      borderRadius: isTablet ? 12 : 8,
                      paddingHorizontal: isTablet ? 16 : 12,
                      paddingVertical: isTablet ? 12 : 8
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 14 : 12,
                      fontWeight: selectedServer === server ? '600' : '400'
                    }}>
                      {server}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size={isTablet ? "large" : "large"} color="#8B5CF6" />
            <Text style={{ 
              color: 'white', 
              marginTop: isTablet ? 20 : 16,
              fontSize: isTablet ? 18 : 16
            }}>Cargando usuarios...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
            contentContainerStyle={{ 
              paddingHorizontal: isTablet ? 24 : 16, 
              paddingBottom: 20 
            }}
            showsVerticalScrollIndicator={false}
          >
            {filteredUsers.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={{ color: '#9CA3AF', fontSize: 16, marginTop: 16 }}>
                  No se encontraron usuarios
                </Text>
              </View>
            ) : (
              <ResponsiveList
                data={filteredUsers}
                renderItem={(user) => renderUser({ item: user })}
                keyExtractor={(user) => user.id}
                spacing={isTablet ? 16 : 8}
                minItemWidth={isTablet ? 400 : 320}
                maxColumns={{ phone: 1, tablet: isLandscape ? 2 : 1 }}
                style={{ paddingHorizontal: 0 }}
              />
            )}
          </ScrollView>
        )}

        {/* Modal de asignación de rol */}
        <Modal
          visible={showRoleModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isTablet ? 40 : 20
          }}>
            <View style={{
              backgroundColor: '#1E1E3F',
              borderRadius: isTablet ? 24 : 16,
              padding: isTablet ? 32 : 24,
              width: '80%',
              maxWidth: isTablet ? 500 : 400,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}>
              <Text style={{ 
                color: 'white', 
                fontSize: isTablet ? 28 : 20, 
                fontWeight: 'bold', 
                marginBottom: isTablet ? 20 : 16,
                textAlign: 'center'
              }}>
                Asignar Rol
              </Text>
              
              <Text style={{ 
                color: '#9CA3AF', 
                fontSize: isTablet ? 18 : 16,
                marginBottom: isTablet ? 28 : 20,
                textAlign: 'center'
              }}>
                Selecciona el rol para {selectedUser?.displayName}
              </Text>

              <TouchableOpacity
                onPress={() => handleAssignRole(UserRole.MODERATOR)}
                style={{
                  backgroundColor: '#10B981',
                  padding: isTablet ? 20 : 16,
                  borderRadius: isTablet ? 16 : 12,
                  marginBottom: isTablet ? 16 : 12,
                  shadowColor: '#10B981',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: isTablet ? 18 : 16, 
                  fontWeight: 'bold', 
                  textAlign: 'center' 
                }}>
                  Moderador
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAssignRole(UserRole.ADMIN)}
                style={{
                  backgroundColor: '#8B5CF6',
                  padding: isTablet ? 20 : 16,
                  borderRadius: isTablet ? 16 : 12,
                  marginBottom: isTablet ? 28 : 20,
                  shadowColor: '#8B5CF6',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: isTablet ? 18 : 16, 
                  fontWeight: 'bold', 
                  textAlign: 'center' 
                }}>
                  Administrador
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                style={{
                  backgroundColor: '#374151',
                  padding: isTablet ? 20 : 16,
                  borderRadius: isTablet ? 16 : 12
                }}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: isTablet ? 18 : 16, 
                  fontWeight: 'bold', 
                  textAlign: 'center' 
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ResponsiveLayout>
  );
}