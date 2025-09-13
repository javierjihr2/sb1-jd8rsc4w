import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
  Dimensions,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StreamData {
  id: string;
  title: string;
  streamer: string;
  platform: 'twitch' | 'youtube' | 'facebook';
  url: string;
  viewers: number;
  isLive: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p';
  language: string;
  thumbnail?: string;
}

interface StreamingIntegrationProps {
  tournamentId: string;
  isOrganizer: boolean;
  allowMultipleStreams?: boolean;
  defaultQuality?: 'auto' | '1080p' | '720p' | '480p';
}

const StreamingIntegration: React.FC<StreamingIntegrationProps> = ({
  tournamentId,
  isOrganizer,
  allowMultipleStreams = true,
  defaultQuality = 'auto'
}) => {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [newStream, setNewStream] = useState<{
    title: string;
    streamer: string;
    platform: 'twitch' | 'youtube' | 'facebook';
    url: string;
    language: string;
  }>({
    title: '',
    streamer: '',
    platform: 'twitch',
    url: '',
    language: 'es'
  });
  const [featuredStreamId, setFeaturedStreamId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  // Mock data para demostración
  const mockStreams: StreamData[] = [
    {
      id: 's1',
      title: 'PUBG Mobile Tournament - Final Match',
      streamer: 'ProStreamer1',
      platform: 'twitch',
      url: 'https://twitch.tv/prostreamer1',
      viewers: 1250,
      isLive: true,
      quality: '1080p',
      language: 'es'
    },
    {
      id: 's2',
      title: 'Squad Battles - Live Commentary',
      streamer: 'GameMaster',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example',
      viewers: 890,
      isLive: true,
      quality: '720p',
      language: 'es'
    },
    {
      id: 's3',
      title: 'Tournament Highlights',
      streamer: 'HighlightKing',
      platform: 'facebook',
      url: 'https://facebook.com/highlightking/live',
      viewers: 456,
      isLive: false,
      quality: '480p',
      language: 'en'
    }
  ];

  useEffect(() => {
    loadStreams();
    if (autoRefresh) {
      const interval = setInterval(loadStreams, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [tournamentId, autoRefresh]);

  const loadStreams = async () => {
    try {
      // Simular carga de streams
      setStreams(mockStreams);
      if (!featuredStreamId && mockStreams.length > 0) {
        setFeaturedStreamId(mockStreams[0].id);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    }
  };

  const handleAddStream = () => {
    if (!newStream.title || !newStream.streamer || !newStream.url) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const stream: StreamData = {
      id: Date.now().toString(),
      title: newStream.title,
      streamer: newStream.streamer,
      platform: newStream.platform,
      url: newStream.url,
      viewers: 0,
      isLive: false,
      quality: defaultQuality,
      language: newStream.language
    };

    setStreams(prev => [...prev, stream]);
    setNewStream({
      title: '',
      streamer: '',
      platform: 'twitch',
      url: '',
      language: 'es'
    });
    setShowAddStreamModal(false);
    Alert.alert('Éxito', 'Stream agregado correctamente');
  };

  const handleRemoveStream = (streamId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar este stream?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setStreams(prev => prev.filter(s => s.id !== streamId));
            if (featuredStreamId === streamId) {
              setFeaturedStreamId(null);
            }
          }
        }
      ]
    );
  };

  const handleOpenStream = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir este enlace');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al abrir el stream');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return 'logo-twitch';
      case 'youtube':
        return 'logo-youtube';
      case 'facebook':
        return 'logo-facebook';
      default:
        return 'videocam';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch':
        return '#9146ff';
      case 'youtube':
        return '#ff0000';
      case 'facebook':
        return '#1877f2';
      default:
        return '#6b7280';
    }
  };

  const renderStreamCard = (stream: StreamData, isFeatured = false) => (
    <LinearGradient
      key={stream.id}
      colors={isFeatured ? ['#ef4444', '#dc2626'] : ['#374151', '#1f2937']}
      style={{
        borderRadius: isTablet ? 12 : 8,
        padding: isTablet ? 20 : 16,
        marginBottom: isTablet ? 16 : 12,
        borderWidth: isFeatured ? 2 : 0,
        borderColor: isFeatured ? '#fbbf24' : 'transparent'
      }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
      }}>
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4
          }}>
            <Ionicons
              name={getPlatformIcon(stream.platform)}
              size={isTablet ? 20 : 18}
              color={getPlatformColor(stream.platform)}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '700',
              flex: 1
            }}>
              {stream.title}
            </Text>
            {isFeatured && (
              <View style={{
                backgroundColor: '#fbbf24',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                marginLeft: 8
              }}>
                <Text style={{
                  color: '#111827',
                  fontSize: isTablet ? 12 : 10,
                  fontWeight: '600'
                }}>
                  DESTACADO
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{
            color: '#d1d5db',
            fontSize: isTablet ? 16 : 14,
            marginBottom: 8
          }}>
            por {stream.streamer}
          </Text>
        </View>
        
        {isOrganizer && (
          <TouchableOpacity
            onPress={() => handleRemoveStream(stream.id)}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <Ionicons name="trash" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Status and Stats */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: stream.isLive ? '#10b981' : '#6b7280',
            marginRight: 8
          }} />
          <Text style={{
            color: stream.isLive ? '#10b981' : '#9ca3af',
            fontSize: isTablet ? 14 : 12,
            fontWeight: '600'
          }}>
            {stream.isLive ? 'EN VIVO' : 'OFFLINE'}
          </Text>
        </View>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="eye" size={16} color="#9ca3af" style={{ marginRight: 4 }} />
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12
            }}>
              {stream.viewers.toLocaleString()}
            </Text>
          </View>
          
          <Text style={{
            color: '#9ca3af',
            fontSize: isTablet ? 14 : 12,
            backgroundColor: '#4b5563',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4
          }}>
            {stream.quality}
          </Text>
        </View>
      </View>
      
      {/* Actions */}
      <View style={{
        flexDirection: 'row',
        gap: 12
      }}>
        <TouchableOpacity
          onPress={() => handleOpenStream(stream.url)}
          style={{
            flex: 1,
            backgroundColor: getPlatformColor(stream.platform),
            padding: isTablet ? 16 : 12,
            borderRadius: isTablet ? 8 : 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="play" size={16} color="white" style={{ marginRight: 8 }} />
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: '600'
          }}>
            Ver Stream
          </Text>
        </TouchableOpacity>
        
        {isOrganizer && !isFeatured && (
          <TouchableOpacity
            onPress={() => setFeaturedStreamId(stream.id)}
            style={{
              backgroundColor: '#fbbf24',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 8 : 6,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="star" size={16} color="#111827" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isTablet ? 20 : 16,
        backgroundColor: '#1f2937'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 20 : 18,
            fontWeight: '700',
            marginRight: 16
          }}>
            Streams del Torneo
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginRight: 8
            }}>
              Auto-refresh
            </Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor={autoRefresh ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </View>
        
        {isOrganizer && (
          <TouchableOpacity
            onPress={() => setShowAddStreamModal(true)}
            style={{
              backgroundColor: '#10b981',
              padding: isTablet ? 12 : 10,
              borderRadius: isTablet ? 8 : 6,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 14 : 12,
              fontWeight: '600'
            }}>
              Agregar
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Streams List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: isTablet ? 20 : 16,
          paddingTop: 0
        }}
      >
        {streams.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60
          }}>
            <Ionicons name="videocam-off" size={64} color="#6b7280" />
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 18 : 16,
              textAlign: 'center',
              marginTop: 16
            }}>
              No hay streams disponibles
            </Text>
            {isOrganizer && (
              <TouchableOpacity
                onPress={() => setShowAddStreamModal(true)}
                style={{
                  backgroundColor: '#10b981',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 8 : 6,
                  marginTop: 16
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: '600'
                }}>
                  Agregar primer stream
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Featured Stream */}
            {featuredStreamId && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '700',
                  marginBottom: 12
                }}>
                  🌟 Stream Destacado
                </Text>
                {streams
                  .filter(s => s.id === featuredStreamId)
                  .map(stream => renderStreamCard(stream, true))}
              </View>
            )}
            
            {/* Other Streams */}
            {streams.filter(s => s.id !== featuredStreamId).length > 0 && (
              <View>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '700',
                  marginBottom: 12
                }}>
                  Otros Streams
                </Text>
                {streams
                  .filter(s => s.id !== featuredStreamId)
                  .map(stream => renderStreamCard(stream))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Add Stream Modal */}
      <Modal
        visible={showAddStreamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStreamModal(false)}
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
              maxWidth: isTablet ? 500 : 400
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 20 : 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: isTablet ? 24 : 20
            }}>
              Agregar Nuevo Stream
            </Text>
            
            {/* Title */}
            <View style={{ marginBottom: isTablet ? 20 : 16 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                Título del Stream
              </Text>
              <TextInput
                value={newStream.title}
                onChangeText={(text) => setNewStream(prev => ({ ...prev, title: text }))}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 16 : 14
                }}
                placeholder="Ej: PUBG Mobile Tournament Final"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Streamer */}
            <View style={{ marginBottom: isTablet ? 20 : 16 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                Nombre del Streamer
              </Text>
              <TextInput
                value={newStream.streamer}
                onChangeText={(text) => setNewStream(prev => ({ ...prev, streamer: text }))}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 16 : 14
                }}
                placeholder="Ej: ProStreamer1"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            {/* Platform */}
            <View style={{ marginBottom: isTablet ? 20 : 16 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                Plataforma
              </Text>
              <View style={{
                flexDirection: 'row',
                gap: 8
              }}>
                {(['twitch', 'youtube', 'facebook'] as const).map(platform => (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => setNewStream(prev => ({ ...prev, platform }))}
                    style={{
                      flex: 1,
                      backgroundColor: newStream.platform === platform ? getPlatformColor(platform) : '#374151',
                      padding: isTablet ? 12 : 10,
                      borderRadius: isTablet ? 8 : 6,
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons
                      name={getPlatformIcon(platform)}
                      size={20}
                      color="white"
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 14 : 12,
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {platform}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* URL */}
            <View style={{ marginBottom: isTablet ? 24 : 20 }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600',
                marginBottom: isTablet ? 8 : 6
              }}>
                URL del Stream
              </Text>
              <TextInput
                value={newStream.url}
                onChangeText={(text) => setNewStream(prev => ({ ...prev, url: text }))}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 8,
                  fontSize: isTablet ? 16 : 14
                }}
                placeholder="https://..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {/* Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: isTablet ? 16 : 12
            }}>
              <TouchableOpacity
                onPress={() => setShowAddStreamModal(false)}
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
                onPress={handleAddStream}
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
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

export default StreamingIntegration;