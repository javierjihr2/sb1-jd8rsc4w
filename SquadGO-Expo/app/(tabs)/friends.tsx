import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import UserActionMenu from '../../components/UserActionMenu';
import ResponsiveLayout from '../../components/ResponsiveLayout';
import ResponsiveList from '../../components/ResponsiveList';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';

// Interfaces para el sistema de amigos
interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  message?: string;
  fromUser?: {
    displayName: string;
    avatarUrl?: string;
    pubgId?: string;
  };
}

interface Friend {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  pubgId?: string;
  mutualFriends?: number;
  currentServer?: string; // Servidor de PUBG Mobile del usuario
}

// Datos simulados para demostración
const mockFriendRequests: FriendRequest[] = [
  {
    id: '1',
    fromUserId: 'user1',
    toUserId: 'current-user',
    fromUsername: 'AlexGamer',
    toUsername: 'current-user',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    message: '¡Hola! Vi que juegas PUBG Mobile. ¿Quieres ser amigos?',
    fromUser: {
      displayName: 'Alex Gaming',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      pubgId: 'AlexGamer#123'
    }
  },
  {
    id: '2',
    fromUserId: 'user2',
    toUserId: 'current-user',
    fromUsername: 'MariaPro',
    toUsername: 'current-user',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    fromUser: {
      displayName: 'Maria Pro',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      pubgId: 'MariaPro#456'
    }
  }
];

const mockFriends: Friend[] = [
  {
    userId: 'friend1',
    username: 'CarlosSniper',
    displayName: 'Carlos Sniper',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    status: 'online',
    lastSeen: new Date(),
    pubgId: 'CarlosSniper#789',
    mutualFriends: 3,
    currentServer: 'Sur América'
  },
  {
    userId: 'friend2',
    username: 'LunaGamer',
    displayName: 'Luna Gamer',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    status: 'away',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    pubgId: 'LunaGamer#321',
    mutualFriends: 1,
    currentServer: 'Sur América'
  },
  {
    userId: 'friend3',
    username: 'ProPlayer99',
    displayName: 'Pro Player',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    pubgId: 'ProPlayer99#555',
    mutualFriends: 5,
    currentServer: 'Asia'
  },
  {
    userId: 'friend4',
    username: 'EuropeSniper',
    displayName: 'Europe Sniper',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    status: 'online',
    lastSeen: new Date(),
    pubgId: 'EuropeSniper#444',
    mutualFriends: 2,
    currentServer: 'Europa'
  },
  {
    userId: 'friend5',
    username: 'NAPlayer',
    displayName: 'NA Player',
    status: 'busy',
    lastSeen: new Date(Date.now() - 60 * 60 * 1000),
    pubgId: 'NAPlayer#666',
    mutualFriends: 4,
    currentServer: 'Norte América'
  }
];

const mockSearchResults: Friend[] = [
  {
    userId: 'search1',
    username: 'NewPlayer',
    displayName: 'New Player',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    status: 'online',
    lastSeen: new Date(),
    pubgId: 'NewPlayer#999',
    currentServer: 'Asia'
  },
  {
    userId: 'search2',
    username: 'SkillMaster',
    displayName: 'Skill Master',
    status: 'offline',
    lastSeen: new Date(Date.now() - 60 * 60 * 1000),
    pubgId: 'SkillMaster#777',
    currentServer: 'Europa'
  },
  {
    userId: 'search3',
    username: 'ProGamer_SA',
    displayName: 'Pro Gamer SA',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    status: 'online',
    lastSeen: new Date(),
    pubgId: 'ProGamer_SA#555',
    currentServer: 'Sur América'
  },
  {
    userId: 'search4',
    username: 'NorthPlayer',
    displayName: 'North Player',
    status: 'away',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    pubgId: 'NorthPlayer#888',
    currentServer: 'Norte América'
  }
];

const getStatusColor = (status: Friend['status']) => {
  switch (status) {
    case 'online': return '#10b981';
    case 'away': return '#f59e0b';
    case 'busy': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: Friend['status']) => {
  switch (status) {
    case 'online': return 'En línea';
    case 'away': return 'Ausente';
    case 'busy': return 'Ocupado';
    default: return 'Desconectado';
  }
};

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
};

export default function Friends() {
  const { user, profile } = useAuth();
  const { isTablet, isLandscape, screenSize } = useDeviceInfo();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [userActionMenuVisible, setUserActionMenuVisible] = useState(false);
  const [selectedUserForActions, setSelectedUserForActions] = useState<Friend | null>(null);
  const [filterByServer, setFilterByServer] = useState(true); // Filtrar por servidor por defecto
  const [selectedServer, setSelectedServer] = useState('Todos'); // Servidor seleccionado para filtrado manual

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    // Simular búsqueda
    setTimeout(() => {
      let filtered = mockSearchResults.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.pubgId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Filtrar por servidor si está habilitado
      if (filterByServer && profile?.currentServer) {
        if (selectedServer === 'Todos') {
          // Mostrar solo usuarios del mismo servidor que el usuario actual
          filtered = filtered.filter(searchUser => searchUser.currentServer === profile.currentServer);
        } else {
          // Mostrar usuarios del servidor seleccionado manualmente
          filtered = filtered.filter(searchUser => searchUser.currentServer === selectedServer);
        }
      }
      
      setSearchResults(filtered);
      setLoading(false);
    }, 1000);
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    Alert.alert(
      'Aceptar solicitud',
      '¿Estás seguro de que quieres aceptar esta solicitud de amistad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: () => {
            const request = friendRequests.find(r => r.id === requestId);
            if (request) {
              // Agregar a la lista de amigos
              const newFriend: Friend = {
                userId: request.fromUserId,
                username: request.fromUsername,
                displayName: request.fromUser?.displayName || request.fromUsername,
                avatarUrl: request.fromUser?.avatarUrl,
                status: 'online',
                lastSeen: new Date(),
                pubgId: request.fromUser?.pubgId,
                currentServer: 'Sur América' // Servidor por defecto
              };
              setFriends(prev => [...prev, newFriend]);
              
              // Remover de solicitudes
              setFriendRequests(prev => prev.filter(r => r.id !== requestId));
              
              Alert.alert('¡Éxito!', 'Solicitud de amistad aceptada');
            }
          }
        }
      ]
    );
  };

  const handleRejectFriendRequest = (requestId: string) => {
    Alert.alert(
      'Rechazar solicitud',
      '¿Estás seguro de que quieres rechazar esta solicitud de amistad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            setFriendRequests(prev => prev.filter(r => r.id !== requestId));
            Alert.alert('Solicitud rechazada', 'La solicitud de amistad ha sido rechazada');
          }
        }
      ]
    );
  };

  const handleSendFriendRequest = () => {
    if (!selectedUser) return;

    Alert.alert(
      'Solicitud enviada',
      `Se ha enviado una solicitud de amistad a ${selectedUser.displayName}`,
      [{ text: 'OK' }]
    );
    
    setAddFriendModalVisible(false);
    setSelectedUser(null);
    setFriendRequestMessage('');
    setSearchResults(prev => prev.filter(u => u.userId !== selectedUser.userId));
  };

  const handleRemoveFriend = (friendId: string) => {
    const friend = friends.find(f => f.userId === friendId);
    if (!friend) return;

    Alert.alert(
      'Eliminar amigo',
      `¿Estás seguro de que quieres eliminar a ${friend.displayName} de tu lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setFriends(prev => prev.filter(f => f.userId !== friendId));
            Alert.alert('Amigo eliminado', `${friend.displayName} ha sido eliminado de tu lista de amigos`);
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simular actualización
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Filtrar amigos por servidor
  const filteredFriends = filterByServer && profile?.currentServer 
    ? friends.filter(friend => {
        if (selectedServer === 'Todos') {
          return friend.currentServer === profile.currentServer;
        } else {
          return friend.currentServer === selectedServer;
        }
      })
    : friends;

  // Lista de servidores disponibles
  const availableServers = ['Todos', 'Asia', 'Europa', 'Norte América', 'Sur América', 'Medio Oriente', 'África', 'Krjp'];

  const renderTabButton = (tab: 'friends' | 'requests' | 'search', icon: string, label: string, count?: number) => (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? 'white' : '#9ca3af'} 
      />
      <Text style={{
        color: activeTab === tab ? 'white' : '#9ca3af',
        marginLeft: 8,
        fontWeight: activeTab === tab ? '600' : 'normal'
      }}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={{
          backgroundColor: '#ef4444',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 8
        }}>
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold'
          }}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFriendCard = (friend: Friend, showActions = true) => (
    <View key={friend.userId} style={{
      backgroundColor: '#374151',
      borderRadius: 12,
      padding: isTablet ? 20 : 16,
      marginBottom: isTablet ? 16 : 12,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: isTablet ? 100 : 80
    }}>
      <View style={{ position: 'relative' }}>
        <View style={{
          width: isTablet ? 60 : 50,
          height: isTablet ? 60 : 50,
          borderRadius: isTablet ? 30 : 25,
          backgroundColor: '#3b82f6',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {friend.avatarUrl ? (
            <Image
              source={{ uri: friend.avatarUrl }}
              style={{ 
                width: isTablet ? 60 : 50, 
                height: isTablet ? 60 : 50, 
                borderRadius: isTablet ? 30 : 25 
              }}
            />
          ) : (
            <Text style={{ 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: isTablet ? 22 : 18 
            }}>
              {friend.displayName.charAt(0)}
            </Text>
          )}
        </View>
        <View style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: getStatusColor(friend.status),
          borderWidth: 2,
          borderColor: '#374151'
        }} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 18 : 16,
          fontWeight: '600'
        }}>
          {friend.displayName}
        </Text>
        {friend.pubgId && (
          <Text style={{
            color: '#9ca3af',
            fontSize: isTablet ? 16 : 14,
            marginTop: 2
          }}>
            {friend.pubgId}
          </Text>
        )}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4
        }}>
          <Text style={{
            color: getStatusColor(friend.status),
            fontSize: 12,
            fontWeight: '600'
          }}>
            {getStatusText(friend.status)}
          </Text>
          {friend.status !== 'online' && (
            <Text style={{
              color: '#6b7280',
              fontSize: 12,
              marginLeft: 8
            }}>
              • {getTimeAgo(friend.lastSeen)}
            </Text>
          )}
        </View>
        {friend.mutualFriends && friend.mutualFriends > 0 && (
          <Text style={{
            color: '#3b82f6',
            fontSize: 12,
            marginTop: 2
          }}>
            {friend.mutualFriends} amigos en común
          </Text>
        )}
        {friend.currentServer && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4
          }}>
            <Ionicons name="globe-outline" size={12} color="#9ca3af" />
            <Text style={{
              color: '#9ca3af',
              fontSize: 12,
              marginLeft: 4
            }}>
              {friend.currentServer}
            </Text>
          </View>
        )}
      </View>

      {showActions && (
        <TouchableOpacity
          onPress={() => {
            setSelectedUserForActions(friend);
            setUserActionMenuVisible(true);
          }}
          style={{
            backgroundColor: '#4b5563',
            borderRadius: 8,
            padding: 8,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFriendRequestCard = (request: FriendRequest) => (
    <View key={request.id} style={{
      backgroundColor: '#374151',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#3b82f6',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {request.fromUser?.avatarUrl ? (
            <Image
              source={{ uri: request.fromUser.avatarUrl }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
              {request.fromUser?.displayName?.charAt(0) || request.fromUsername.charAt(0)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600'
          }}>
            {request.fromUser?.displayName || request.fromUsername}
          </Text>
          {request.fromUser?.pubgId && (
            <Text style={{
              color: '#9ca3af',
              fontSize: 14,
              marginTop: 2
            }}>
              {request.fromUser.pubgId}
            </Text>
          )}
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            marginTop: 4
          }}>
            {getTimeAgo(request.createdAt)}
          </Text>
        </View>
      </View>

      {request.message && (
        <View style={{
          backgroundColor: '#1f2937',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12
        }}>
          <Text style={{
            color: '#d1d5db',
            fontSize: 14,
            lineHeight: 20
          }}>
            {request.message}
          </Text>
        </View>
      )}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
        <TouchableOpacity
          onPress={() => handleRejectFriendRequest(request.id)}
          style={{
            flex: 1,
            backgroundColor: '#6b7280',
            borderRadius: 8,
            paddingVertical: 12,
            marginRight: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600'
          }}>
            Rechazar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAcceptFriendRequest(request.id)}
          style={{
            flex: 1,
            backgroundColor: '#10b981',
            borderRadius: 8,
            paddingVertical: 12,
            marginLeft: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600'
          }}>
            Aceptar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d']}
      style={{ flex: 1 }}
    >
      <ResponsiveLayout maxWidth={isTablet ? 1200 : undefined}>
        {/* Header */}
        <View style={{
          paddingTop: 30,
          paddingHorizontal: isTablet ? 24 : 16,
          paddingBottom: isTablet ? 24 : 16,
          borderBottomWidth: 1,
          borderBottomColor: '#374151'
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 32 : 24,
            fontWeight: 'bold'
          }}>
            Amigos
          </Text>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: isTablet ? 24 : 16,
          paddingVertical: isTablet ? 20 : 16,
          gap: isTablet ? 12 : 8
        }}>
          {renderTabButton('friends', 'people', 'Amigos', friends.length)}
          {renderTabButton('requests', 'person-add', 'Solicitudes', friendRequests.length)}
          {renderTabButton('search', 'search', 'Buscar')}
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: isTablet ? 24 : 16, paddingBottom: isTablet ? 140 : 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'friends' && (
            <View>
              {/* Controles de filtrado por servidor */}
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: isTablet ? 20 : 16,
                marginBottom: isTablet ? 20 : 16
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
                    backgroundColor: filterByServer ? '#3b82f6' : '#6b7280',
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
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
                          backgroundColor: selectedServer === server ? '#3b82f6' : '#4b5563',
                          borderRadius: isTablet ? 10 : 8,
                          paddingHorizontal: isTablet ? 16 : 12,
                          paddingVertical: isTablet ? 10 : 8
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
              
              {filteredFriends.length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  marginTop: isTablet ? 80 : 60
                }}>
                  <Ionicons name="people-outline" size={isTablet ? 80 : 64} color="#6b7280" />
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 22 : 18,
                    marginTop: isTablet ? 20 : 16,
                    textAlign: 'center'
                  }}>
                    Aún no tienes amigos
                  </Text>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: isTablet ? 16 : 14,
                    marginTop: isTablet ? 12 : 8,
                    textAlign: 'center'
                  }}>
                    ¡Busca usuarios para agregar!
                  </Text>
                </View>
              ) : (
                <ResponsiveList
                  data={filteredFriends}
                  renderItem={(friend) => renderFriendCard(friend)}
                  keyExtractor={(friend) => friend.userId}
                  spacing={isTablet ? 16 : 12}
                  minItemWidth={isTablet ? 320 : 280}
                  maxColumns={{ phone: 1, tablet: 2 }}
                />
              )}
            </View>
          )}

          {activeTab === 'requests' && (
            <View>
              {friendRequests.length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  marginTop: isTablet ? 80 : 60
                }}>
                  <Ionicons name="person-add-outline" size={isTablet ? 80 : 64} color="#6b7280" />
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 22 : 18,
                    marginTop: isTablet ? 20 : 16,
                    textAlign: 'center'
                  }}>
                    No tienes solicitudes pendientes
                  </Text>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: isTablet ? 16 : 14,
                    marginTop: isTablet ? 12 : 8,
                    textAlign: 'center'
                  }}>
                    Las nuevas solicitudes aparecerán aquí
                  </Text>
                </View>
              ) : (
                <ResponsiveList
                  data={friendRequests}
                  renderItem={(request) => renderFriendRequestCard(request)}
                  keyExtractor={(request) => request.id}
                  spacing={isTablet ? 16 : 12}
                />
              )}
            </View>
          )}

          {activeTab === 'search' && (
            <View>
              {/* Barra de búsqueda */}
              <View style={{
                flexDirection: 'row',
                marginBottom: isTablet ? 24 : 20
              }}>
                <View style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  borderRadius: isTablet ? 16 : 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: isTablet ? 20 : 16,
                  marginRight: isTablet ? 16 : 12
                }}>
                  <Ionicons name="search" size={isTablet ? 24 : 20} color="#9ca3af" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar por nombre o ID de PUBG..."
                    placeholderTextColor="#9ca3af"
                    style={{
                      flex: 1,
                      color: 'white',
                      fontSize: isTablet ? 18 : 16,
                      marginLeft: isTablet ? 16 : 12,
                      paddingVertical: isTablet ? 20 : 16
                    }}
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSearch}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: isTablet ? 16 : 12,
                    paddingHorizontal: isTablet ? 24 : 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size={isTablet ? "large" : "small"} color="white" />
                  ) : (
                    <Ionicons name="search" size={isTablet ? 24 : 20} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Resultados de búsqueda */}
              {searchResults.length === 0 && searchQuery.trim() !== '' && !loading && (
                <View style={{
                  alignItems: 'center',
                  marginTop: isTablet ? 60 : 40
                }}>
                  <Ionicons name="search-outline" size={isTablet ? 80 : 64} color="#6b7280" />
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 22 : 18,
                    marginTop: isTablet ? 20 : 16,
                    textAlign: 'center'
                  }}>
                    No se encontraron usuarios
                  </Text>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: isTablet ? 16 : 14,
                    marginTop: isTablet ? 12 : 8,
                    textAlign: 'center'
                  }}>
                    Intenta con otro término de búsqueda
                  </Text>
                </View>
              )}

            {searchResults.map(user => (
              <View key={user.userId} style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#3b82f6',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {user.avatarUrl ? (
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                      {user.displayName.charAt(0)}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {user.displayName}
                  </Text>
                  {user.pubgId && (
                    <Text style={{
                      color: '#9ca3af',
                      fontSize: 14,
                      marginTop: 2
                    }}>
                      {user.pubgId}
                    </Text>
                  )}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4
                  }}>
                    <Text style={{
                      color: getStatusColor(user.status),
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {getStatusText(user.status)}
                    </Text>
                  </View>
                  {user.currentServer && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 4
                    }}>
                      <Ionicons name="globe-outline" size={12} color="#9ca3af" />
                      <Text style={{
                        color: '#9ca3af',
                        fontSize: 12,
                        marginLeft: 4
                      }}>
                        {user.currentServer}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedUser(user);
                    setAddFriendModalVisible(true);
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    Agregar
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

              {searchResults.length > 0 && (
                <ResponsiveList
                  data={searchResults}
                  renderItem={(user) => (
                    <View key={user.userId} style={{
                      backgroundColor: '#374151',
                      borderRadius: 12,
                      padding: isTablet ? 20 : 16,
                      marginBottom: isTablet ? 16 : 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: isTablet ? 100 : 80
                    }}>
                      <View style={{
                        width: isTablet ? 60 : 50,
                        height: isTablet ? 60 : 50,
                        borderRadius: isTablet ? 30 : 25,
                        backgroundColor: '#3b82f6',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {user.avatarUrl ? (
                          <Image
                            source={{ uri: user.avatarUrl }}
                            style={{ 
                              width: isTablet ? 60 : 50, 
                              height: isTablet ? 60 : 50, 
                              borderRadius: isTablet ? 30 : 25 
                            }}
                          />
                        ) : (
                          <Text style={{ 
                            color: 'white', 
                            fontWeight: 'bold', 
                            fontSize: isTablet ? 22 : 18 
                          }}>
                            {user.displayName.charAt(0)}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{
                          color: 'white',
                          fontSize: isTablet ? 18 : 16,
                          fontWeight: '600'
                        }}>
                          {user.displayName}
                        </Text>
                        {user.pubgId && (
                          <Text style={{
                            color: '#9ca3af',
                            fontSize: isTablet ? 16 : 14,
                            marginTop: 2
                          }}>
                            {user.pubgId}
                          </Text>
                        )}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 4
                        }}>
                          <Text style={{
                            color: getStatusColor(user.status),
                            fontSize: isTablet ? 14 : 12,
                            fontWeight: '600'
                          }}>
                            {getStatusText(user.status)}
                          </Text>
                        </View>
                        {user.currentServer && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4
                          }}>
                            <Ionicons name="globe-outline" size={isTablet ? 14 : 12} color="#9ca3af" />
                            <Text style={{
                              color: '#9ca3af',
                              fontSize: isTablet ? 14 : 12,
                              marginLeft: 4
                            }}>
                              {user.currentServer}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUser(user);
                          setAddFriendModalVisible(true);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          borderRadius: isTablet ? 10 : 8,
                          paddingHorizontal: isTablet ? 20 : 16,
                          paddingVertical: isTablet ? 12 : 8
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontWeight: '600',
                          fontSize: isTablet ? 16 : 14
                        }}>
                          Agregar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={(user) => user.userId}
                  spacing={isTablet ? 16 : 12}
                />
              )}

              {searchQuery.trim() === '' && (
                <View style={{
                  alignItems: 'center',
                  marginTop: isTablet ? 80 : 60
                }}>
                  <Ionicons name="search-outline" size={isTablet ? 80 : 64} color="#6b7280" />
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 22 : 18,
                    marginTop: isTablet ? 20 : 16,
                    textAlign: 'center'
                  }}>
                    Buscar nuevos amigos
                  </Text>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: isTablet ? 16 : 14,
                    marginTop: isTablet ? 12 : 8,
                    textAlign: 'center'
                  }}>
                    Escribe un nombre o ID de PUBG para buscar
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </ResponsiveLayout>

      {/* Modal para agregar amigo */}
      <Modal
        visible={addFriendModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFriendModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: isTablet ? 'center' : 'flex-end',
          alignItems: isTablet ? 'center' : 'stretch',
          padding: isTablet ? 40 : 0
        }}>
          <View style={{
            backgroundColor: '#1f2937',
            borderTopLeftRadius: isTablet ? 20 : 20,
            borderTopRightRadius: isTablet ? 20 : 20,
            borderBottomLeftRadius: isTablet ? 20 : 0,
            borderBottomRightRadius: isTablet ? 20 : 0,
            padding: isTablet ? 32 : 20,
            maxHeight: '80%',
            width: isTablet ? 500 : '100%',
            maxWidth: isTablet ? 500 : undefined
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isTablet ? 24 : 20
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 24 : 20,
                fontWeight: 'bold'
              }}>
                Enviar solicitud de amistad
              </Text>
              <TouchableOpacity
                onPress={() => setAddFriendModalVisible(false)}
              >
                <Ionicons name="close" size={isTablet ? 28 : 24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View>
                {renderFriendCard(selectedUser, false)}
                
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginTop: isTablet ? 24 : 20,
                  marginBottom: isTablet ? 16 : 12
                }}>
                  Mensaje (opcional)
                </Text>
                
                <TextInput
                  value={friendRequestMessage}
                  onChangeText={setFriendRequestMessage}
                  placeholder="Escribe un mensaje para acompañar tu solicitud..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={isTablet ? 5 : 4}
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: isTablet ? 16 : 12,
                    padding: isTablet ? 20 : 16,
                    color: 'white',
                    fontSize: isTablet ? 18 : 16,
                    textAlignVertical: 'top',
                    marginBottom: isTablet ? 24 : 20
                  }}
                />
                
                <TouchableOpacity
                  onPress={handleSendFriendRequest}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderRadius: isTablet ? 16 : 12,
                    paddingVertical: isTablet ? 20 : 16,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: '600'
                  }}>
                    Enviar solicitud
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* User Action Menu */}
      {selectedUserForActions && (
        <UserActionMenu
          visible={userActionMenuVisible}
          onClose={() => {
            setUserActionMenuVisible(false);
            setSelectedUserForActions(null);
          }}
          userId={selectedUserForActions.userId}
          displayName={selectedUserForActions.displayName}
          username={selectedUserForActions.username}
          onUserBlocked={() => {
            // Remover de la lista de amigos cuando se bloquea
            setFriends(prev => prev.filter(f => f.userId !== selectedUserForActions.userId));
            setUserActionMenuVisible(false);
            setSelectedUserForActions(null);
          }}
        />
      )}
    </LinearGradient>
  );
}