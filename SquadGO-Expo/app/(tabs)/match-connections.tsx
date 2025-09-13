import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  fromUser?: {
    displayName: string;
    photoURL?: string;
    rank?: string;
  };
}

interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
  status: 'active' | 'inactive';
  user1?: {
    displayName: string;
    photoURL?: string;
    rank?: string;
  };
  user2?: {
    displayName: string;
    photoURL?: string;
    rank?: string;
  };
}

const mockConnectionRequests: ConnectionRequest[] = [
  {
    id: '1',
    fromUserId: 'user1',
    toUserId: 'currentUser',
    message: '¡Hola! Vi tu perfil y me gustaría jugar contigo. Soy main de assault rifle.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    fromUser: {
      displayName: 'ProGamer_2024',
      photoURL: 'https://via.placeholder.com/60',
      rank: 'Diamante III'
    }
  },
  {
    id: '2',
    fromUserId: 'user2',
    toUserId: 'currentUser',
    message: 'Busco compañero para ranked, tengo buen K/D y comunicación.',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    fromUser: {
      displayName: 'SnipeKing',
      photoURL: 'https://via.placeholder.com/60',
      rank: 'Corona V'
    }
  }
];

const mockMatches: Match[] = [
  {
    id: '1',
    user1Id: 'currentUser',
    user2Id: 'user3',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'active',
    user2: {
      displayName: 'TacticalMaster',
      photoURL: 'https://via.placeholder.com/60',
      rank: 'As'
    }
  },
  {
    id: '2',
    user1Id: 'currentUser',
    user2Id: 'user4',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'active',
    user2: {
      displayName: 'RushExpert',
      photoURL: 'https://via.placeholder.com/60',
      rank: 'Conquistador'
    }
  }
];

export default function MatchConnections() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'matches'>('requests');
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setConnectionRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted' as const }
            : req
        )
      );
      
      // Simular creación de match
      const request = connectionRequests.find(r => r.id === requestId);
      if (request) {
        const newMatch: Match = {
          id: Date.now().toString(),
          user1Id: 'currentUser',
          user2Id: request.fromUserId,
          createdAt: new Date(),
          status: 'active',
          user2: request.fromUser
        };
        setMatches(prev => [newMatch, ...prev]);
      }
      
      Alert.alert('¡Éxito!', '¡Solicitud aceptada! Ahora pueden jugar juntos.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setConnectionRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      Alert.alert('Solicitud rechazada', 'La solicitud ha sido rechazada.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  const handleChatWithMatch = (match: Match) => {
    setSelectedMatch(match);
    setShowChatModal(true);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    Alert.alert('Mensaje enviado', `Mensaje enviado a ${selectedMatch?.user2?.displayName}`);
    setChatMessage('');
    setShowChatModal(false);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const renderConnectionRequest = (request: ConnectionRequest) => (
    <View key={request.id} style={{
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#333'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={{ uri: request.fromUser?.photoURL || 'https://via.placeholder.com/50' }}
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {request.fromUser?.displayName}
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              {formatTimeAgo(request.createdAt)}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="trophy" size={14} color="#FFD700" />
            <Text style={{ color: '#FFD700', fontSize: 12, marginLeft: 4 }}>
              {request.fromUser?.rank}
            </Text>
          </View>
          
          <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 12, lineHeight: 20 }}>
            {request.message}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleAcceptRequest(request.id)}
              style={{
                backgroundColor: '#4CAF50',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flex: 1
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                Aceptar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleDeclineRequest(request.id)}
              style={{
                backgroundColor: '#f44336',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flex: 1
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                Rechazar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMatch = (match: Match) => (
    <View key={match.id} style={{
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#333'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image
            source={{ uri: match.user2?.photoURL || 'https://via.placeholder.com/50' }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
              {match.user2?.displayName}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={{ color: '#FFD700', fontSize: 12, marginLeft: 4 }}>
                {match.user2?.rank}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: match.status === 'active' ? '#4CAF50' : '#666',
                marginRight: 6
              }} />
              <Text style={{ color: '#ccc', fontSize: 12 }}>
                Match desde {formatTimeAgo(match.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleChatWithMatch(match)}
          style={{
            backgroundColor: '#2196F3',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Ionicons name="chatbubble" size={16} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 4, fontWeight: 'bold' }}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      justifyContent: 'space-around'
    }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          backgroundColor: '#FFF3CD',
          padding: 8,
          borderRadius: 8,
          marginBottom: 8
        }}>
          <Ionicons name="time" size={20} color="#856404" />
        </View>
        <Text style={{ color: '#ccc', fontSize: 12 }}>Pendientes</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {connectionRequests.filter(r => r.status === 'pending').length}
        </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
        <View style={{
          backgroundColor: '#D4EDDA',
          padding: 8,
          borderRadius: 8,
          marginBottom: 8
        }}>
          <Ionicons name="trophy" size={20} color="#155724" />
        </View>
        <Text style={{ color: '#ccc', fontSize: 12 }}>Matches</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {matches.length}
        </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
        <View style={{
          backgroundColor: '#CCE5FF',
          padding: 8,
          borderRadius: 8,
          marginBottom: 8
        }}>
          <Ionicons name="people" size={20} color="#004085" />
        </View>
        <Text style={{ color: '#ccc', fontSize: 12 }}>Conexiones</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {matches.filter(m => m.status === 'active').length}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 8
          }}>
            Mis Conexiones
          </Text>
          <Text style={{ color: '#ccc', textAlign: 'center' }}>
            Gestiona tus solicitudes de conexión y matches realizados
          </Text>
        </View>

        {/* Estadísticas */}
        {renderStats()}

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          padding: 4,
          marginBottom: 20
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            accessibilityRole="tab"
            accessibilityLabel="Solicitudes"
            accessibilityHint="Ver solicitudes de conexión pendientes"
            accessibilityState={{ selected: activeTab === 'requests' }}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === 'requests' ? '#2196F3' : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={activeTab === 'requests' ? '#fff' : '#666'} 
            />
            <Text style={{
              color: activeTab === 'requests' ? '#fff' : '#666',
              marginLeft: 8,
              fontWeight: activeTab === 'requests' ? 'bold' : 'normal'
            }}>
              Solicitudes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('matches')}
            accessibilityRole="tab"
            accessibilityLabel="Mis Matches"
            accessibilityHint="Ver tus conexiones y matches activos"
            accessibilityState={{ selected: activeTab === 'matches' }}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === 'matches' ? '#2196F3' : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons 
              name="trophy" 
              size={16} 
              color={activeTab === 'matches' ? '#fff' : '#666'} 
            />
            <Text style={{
              color: activeTab === 'matches' ? '#fff' : '#666',
              marginLeft: 8,
              fontWeight: activeTab === 'matches' ? 'bold' : 'normal'
            }}>
              Mis Matches
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'requests' ? (
          <View>
            {connectionRequests.filter(r => r.status === 'pending').length === 0 ? (
              <View style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 32,
                alignItems: 'center'
              }}>
                <Ionicons name="mail-outline" size={48} color="#666" />
                <Text style={{ color: '#ccc', marginTop: 12, textAlign: 'center' }}>
                  No tienes solicitudes pendientes
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  Las solicitudes de conexión aparecerán aquí
                </Text>
              </View>
            ) : (
              connectionRequests
                .filter(r => r.status === 'pending')
                .map(renderConnectionRequest)
            )}
          </View>
        ) : (
          <View>
            {matches.length === 0 ? (
              <View style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 32,
                alignItems: 'center'
              }}>
                <Ionicons name="trophy-outline" size={48} color="#666" />
                <Text style={{ color: '#ccc', marginTop: 12, textAlign: 'center' }}>
                  No tienes matches aún
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  ¡Ve al matchmaking para encontrar jugadores!
                </Text>
              </View>
            ) : (
              matches.map(renderMatch)
            )}
          </View>
        )}

        {/* Información adicional */}
        <View style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          padding: 16,
          marginTop: 20,
          borderWidth: 1,
          borderColor: '#2196F3'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="heart" size={20} color="#2196F3" />
            <Text style={{ color: '#2196F3', fontWeight: 'bold', marginLeft: 8 }}>
              ¿Cómo funciona el sistema de Match?
            </Text>
          </View>
          
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>
              • <Text style={{ fontWeight: 'bold' }}>Envía solicitudes:</Text> Dale al botón de conectar en el matchmaking
            </Text>
            <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>
              • <Text style={{ fontWeight: 'bold' }}>Recibe solicitudes:</Text> Otros jugadores pueden enviarte solicitudes
            </Text>
            <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>
              • <Text style={{ fontWeight: 'bold' }}>¡Haz Match!</Text> Cuando ambos se envían solicitudes, se crea un match automáticamente
            </Text>
            <Text style={{ color: '#ccc', fontSize: 14 }}>
              • <Text style={{ fontWeight: 'bold' }}>Chatea:</Text> Una vez que hagan match, pueden chatear y jugar juntos
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Chat */}
      <Modal visible={showChatModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Image
                source={{ uri: selectedMatch?.user2?.photoURL || 'https://via.placeholder.com/40' }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
              />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 }}>
                Chat con {selectedMatch?.user2?.displayName}
              </Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={{
                backgroundColor: '#333',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                marginBottom: 16,
                minHeight: 80
              }}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#666"
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setShowChatModal(false)}
                style={{ backgroundColor: '#666', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendChatMessage}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje"
                accessibilityHint="Envía el mensaje escrito en el chat"
                style={{ backgroundColor: '#2196F3', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}