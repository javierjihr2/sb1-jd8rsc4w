import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { useRouter } from 'expo-router';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Post, PlayerProfile } from '../../lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LoadingState, GradientLoadingState, SkeletonLoader, useLoadingState } from '../../components/LoadingState';
import { useOfflineData } from '../../hooks/useOfflineData';
import ConnectionStatus from '../../components/ConnectionStatus';

// Importar los nuevos componentes modernos
import { StoriesComponent } from '../../components/modern/StoriesComponent';
import { ReelsComponent } from '../../components/modern/ReelsComponent';
import { LiveStreamComponent } from '../../components/modern/LiveStreamComponent';
import { ModernFeedComponent } from '../../components/modern/ModernFeedComponent';
import { AIRecommendations } from '../../components/modern/AIRecommendations';
import { theme } from '../../styles/theme';
import { ModernButton } from '../../components/ui/ModernButton';
import { ModernCard, FeedCard } from '../../components/ui/ModernCard';

const { width } = Dimensions.get('window');

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: 'Actualizaciones' | 'eSports' | 'Comunidad' | 'Eventos';
  author: string;
  publishedAt: string;
  imageUrl?: string;
  readTime: string;
  likes: number;
  views: number;
}





const featuredNews: NewsArticle[] = [
  {
    id: '1',
    title: 'PUBG Mobile 3.1: Nuevo Mapa Nusa y Modo Zombie',
    summary: 'La actualización 3.1 introduce el mapa tropical Nusa, nuevas armas como la ACE32 y el esperado regreso del modo Zombie con mejoras.',
    category: 'Actualizaciones',
    author: 'PUBG Mobile Team',
    publishedAt: '2024-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    readTime: '5 min',
    likes: 2850,
    views: 45420
  },
  {
    id: '2',
    title: 'PMGC 2024: $4M en Premios - Clasificatorias Abiertas',
    summary: 'El PUBG Mobile Global Championship 2024 abre sus clasificatorias regionales. Compite por el título mundial y $4 millones en premios.',
    category: 'eSports',
    author: 'PMGC Officials',
    publishedAt: '2024-01-12',
    imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
    readTime: '4 min',
    likes: 3240,
    views: 67800
  },
  {
    id: '3',
    title: 'Meta Actual: Las Mejores Armas Post-Actualización',
    summary: 'Análisis completo del meta actual: M416 vs SCAR-L, el dominio del AWM y las nuevas configuraciones de attachments más efectivas.',
    category: 'Comunidad',
    author: 'Pro Analysis Team',
    publishedAt: '2024-01-10',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    readTime: '8 min',
    likes: 1890,
    views: 28900
  },
  {
    id: '4',
    title: 'Nuevos Skins Mythic: Colaboración con McLaren',
    summary: 'PUBG Mobile se asocia con McLaren para traer skins exclusivos de vehículos, armas y outfits con efectos únicos y animaciones.',
    category: 'Eventos',
    author: 'Events Team',
    publishedAt: '2024-01-08',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    readTime: '3 min',
    likes: 4120,
    views: 89300
  }
];

const categoryColors = {
  'Actualizaciones': '#FF6B35', // Naranja vibrante PUBG
  'eSports': '#FFD700', // Dorado competitivo
  'Comunidad': '#00D4FF', // Azul cyan moderno
  'Eventos': '#FF1744'  // Rojo intenso para eventos especiales
};

const categoryGradients = {
  'Actualizaciones': ['#FF6B35', '#F7931E'] as const,
  'eSports': ['#FFD700', '#FFA000'] as const,
  'Comunidad': ['#00D4FF', '#0091EA'] as const,
  'Eventos': ['#FF1744', '#D50000'] as const
};

interface Tournament {
  id: string;
  name: string;
  game: string;
  startDate: string;
  endDate: string;
  prize: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'live' | 'registration';
  imageUrl: string;
  organizer: string;
}

const featuredTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Campeonato Mundial PUBG Mobile 2024',
    game: 'PUBG Mobile',
    startDate: '2024-02-15',
    endDate: '2024-02-18',
    prize: '$2,000,000',
    participants: 128,
    maxParticipants: 128,
    status: 'registration',
    imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
    organizer: 'SquadGO eSports'
  },
  {
    id: '2',
    name: 'Liga Profesional Latinoamérica',
    game: 'PUBG Mobile',
    startDate: '2024-01-28',
    endDate: '2024-01-30',
    prize: '$500,000',
    participants: 64,
    maxParticipants: 64,
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    organizer: 'Liga Pro LATAM'
  },
  {
    id: '3',
    name: 'Torneo Clasificatorio Regional',
    game: 'PUBG Mobile',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    prize: '$100,000',
    participants: 45,
    maxParticipants: 64,
    status: 'registration',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    organizer: 'Regional eSports'
  }
];

const getStatusColor = (status: Tournament['status']) => {
  switch (status) {
    case 'live': return '#ef4444';
    case 'registration': return '#10b981';
    case 'upcoming': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getStatusText = (status: Tournament['status']) => {
  switch (status) {
    case 'live': return 'EN VIVO';
    case 'registration': return 'INSCRIPCIONES ABIERTAS';
    case 'upcoming': return 'PRÓXIMAMENTE';
    default: return 'DESCONOCIDO';
  }
};

const getDaysUntil = (dateString: string) => {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function Feed() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [newPost, setNewPost] = useState('');
  const { loading: posting, startLoading: startPosting, stopLoading: stopPosting } = useLoadingState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const newsCarouselRef = useRef<FlatList>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Animaciones modernas
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para interacciones modernas
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Usar el nuevo hook de datos offline
  const {
    data: posts,
    loading,
    error,
    isOffline,
    pendingSync,
    refresh,
    addItem: addPost,
    updateItem: updatePost,
    deleteItem: deletePost
  } = useOfflineData<Post>({
    collectionName: 'posts',
    cacheKey: 'feed_posts',
    queryConstraints: [orderBy('createdAt', 'desc')],
    enableRealtime: true,
    maxCacheAge: 30 * 60 * 1000, // 30 minutos
    syncOnMount: true
  });

  // Animaciones de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Auto-scroll para el carrusel de noticias
  useEffect(() => {
    autoScrollInterval.current = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredNews.length;
        newsCarouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
        return nextIndex;
      });
    }, 5000); // Cambia cada 5 segundos

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, []);

  // Función de refresco usando el nuevo sistema con animaciones
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Animación de refresh
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    await refresh();
    setIsRefreshing(false);
  }, [refresh, scaleAnim]);
  
  // Función para animaciones de interacción con tarjetas
  const handleCardPress = useCallback((cardId: string) => {
    setActiveCard(cardId);
    
    // Animación de feedback táctil
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setActiveCard(null);
    });
  }, [scaleAnim]);

  const createPost = async () => {
    if (!newPost.trim() || !user || !profile) {
      Alert.alert('Error', 'Escribe algo para publicar');
      return;
    }

    try {
      startPosting();
      
      const postData = {
        userId: user.uid,
        content: newPost.trim(),
        likes: [],
        comments: [],
        saves: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: profile // Incluir datos del usuario para UI optimista
      };
      
      await addPost(postData);
      setNewPost('');
      console.log('✅ Post creado exitosamente');
    } catch (error) {
      console.error('❌ Error creando post:', error);
      Alert.alert('Error', isOffline ? 'Post guardado para sincronizar cuando haya conexión' : 'Error al crear la publicación');
    } finally {
      stopPosting();
    }
  };

  const toggleLike = async (postId: string, currentLikes: string[]) => {
    if (!user) return;
    
    try {
      const isLiked = currentLikes.includes(user.uid);
      const updatedLikes = isLiked 
        ? currentLikes.filter(id => id !== user.uid)
        : [...currentLikes, user.uid];
      
      await updatePost(postId, { likes: updatedLikes });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleSave = async (postId: string, currentSaves: string[]) => {
    if (!user) return;
    
    try {
      const isSaved = currentSaves.includes(user.uid);
      const updatedSaves = isSaved 
        ? currentSaves.filter(id => id !== user.uid)
        : [...currentSaves, user.uid];
      
      await updatePost(postId, { saves: updatedSaves });
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };



  const renderNewsItem = useCallback(({ item }: { item: NewsArticle }) => {
    return (
      <Animated.View
        style={{
          transform: [{ scale: activeCard === item.id ? 0.98 : 1 }],
          opacity: fadeAnim
        }}
      >
        <TouchableOpacity
          style={{
            width: width - 32,
            marginHorizontal: 16,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#1f2937',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12
          }}
          activeOpacity={0.95}
          onPress={() => {
            handleCardPress(item.id);
            router.push('/(tabs)/news');
          }}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: '100%',
              height: 220,
              resizeMode: 'cover'
            }}
          />
          
          {/* Overlay con gradiente moderno */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            style={{
              position: 'absolute' as const,
              bottom: 0,
              left: 0,
              right: 0,
              height: 140,
              justifyContent: 'flex-end' as const,
              padding: 20
            }}
          >
            {/* Badge de categoría con gradiente */}
            <LinearGradient
              colors={categoryGradients[item.category]}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: 'flex-start' as const,
                marginBottom: 10,
                shadowColor: categoryColors[item.category],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 11,
                fontWeight: '700' as const,
                textTransform: 'uppercase' as const,
                letterSpacing: 0.5
              }}>
                {item.category}
              </Text>
            </LinearGradient>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '800' as const,
              marginBottom: 6,
              lineHeight: 22,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3
            }} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={{
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              justifyContent: 'space-between' as const
            }}>
              <View style={{
                flexDirection: 'row' as const,
                alignItems: 'center' as const
              }}>
                <MaterialCommunityIcons name="account-circle" size={16} color="#9ca3af" />
                <Text style={{
                  color: '#d1d5db',
                  fontSize: 12,
                  marginLeft: 4,
                  fontWeight: '500' as const
                }}>
                  {item.author}
                </Text>
                <View style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: '#6b7280',
                  marginHorizontal: 8
                }} />
                <MaterialCommunityIcons name="clock-outline" size={14} color="#9ca3af" />
                <Text style={{
                  color: '#d1d5db',
                  fontSize: 12,
                  marginLeft: 2,
                  fontWeight: '500' as const
                }}>
                  {item.readTime}
                </Text>
              </View>
              
              <View style={{
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}>
                <Ionicons name="heart" size={14} color="#ef4444" />
                <Text style={{
                  color: '#ef4444',
                  fontSize: 12,
                  marginLeft: 4,
                  fontWeight: '600' as const
                }}>
                  {item.likes.toLocaleString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Indicador de views */}
          <View style={{
            position: 'absolute' as const,
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row' as const,
            alignItems: 'center' as const
          }}>
            <Ionicons name="eye" size={12} color="#d1d5db" />
            <Text style={{
              color: '#d1d5db',
              fontSize: 11,
              marginLeft: 4,
              fontWeight: '500' as const
            }}>
              {item.views.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [activeCard, fadeAnim, handleCardPress, router]);

  const renderNewsCarousel = useMemo(() => {
    return (
      <Animated.View 
        style={{ 
          marginBottom: 24,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View style={{
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
          paddingHorizontal: 16,
          marginBottom: 12
        }}>
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            Noticias Destacadas
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/news')}>
            <Text style={{
              color: '#3b82f6',
              fontSize: 14,
              fontWeight: '600'
            }}>
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={newsCarouselRef}
          data={featuredNews}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentNewsIndex(index);
          }}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={1}
          contentContainerStyle={{
            paddingHorizontal: 0
          }}
        />
        
        {/* Indicadores de página modernos */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
          paddingHorizontal: 20
        }}>
          {featuredNews.map((_, index) => {
            const isActive = currentNewsIndex === index;
            return (
              <Animated.View
                key={index}
                style={{
                  width: isActive ? 32 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  overflow: 'hidden'
                }}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#f59e0b', '#d97706', '#92400e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flex: 1,
                      borderRadius: 4,
                      shadowColor: '#f59e0b',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      elevation: 4
                    }}
                  >
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#374151',
                      borderRadius: 4,
                      opacity: 0.5
                    }}
                  />
                )}
              </Animated.View>
            );
          })}
        </View>
        
        {/* Contador de noticias */}
        <View style={{
          position: 'absolute',
          bottom: 60,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(245, 158, 11, 0.3)'
        }}>
          <Text style={{
            color: '#f59e0b',
            fontSize: 12,
            fontWeight: '600'
          }}>
            {currentNewsIndex + 1} / {featuredNews.length}
          </Text>
        </View>
      </Animated.View>
    );
   }, [currentNewsIndex, router, slideAnim]);

  const renderTournamentItem = useCallback(({ item }: { item: Tournament }) => {
    const daysUntil = getDaysUntil(item.startDate);
    const participationPercentage = (item.participants / item.maxParticipants) * 100;
    
    return (
      <TouchableOpacity
        style={{
          width: 300,
          marginRight: 16,
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12
        }}
        activeOpacity={0.95}
        onPress={() => router.push('/(tabs)/tournaments')}
      >
        {/* Imagen de fondo con overlay */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: '100%',
              height: 140,
              resizeMode: 'cover'
            }}
          />
          
          {/* Overlay con gradiente */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
          </LinearGradient>
          
          {/* Status Badge con gradiente */}
          <LinearGradient
            colors={item.status === 'live' ? ['#ef4444', '#dc2626'] : 
                   item.status === 'registration' ? ['#10b981', '#059669'] : 
                   ['#f59e0b', '#d97706']}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              shadowColor: getStatusColor(item.status),
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
              elevation: 4
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {getStatusText(item.status)}
            </Text>
          </LinearGradient>
          
          {/* Icono de juego */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <MaterialCommunityIcons name="gamepad-variant" size={14} color="#f59e0b" />
            <Text style={{
              color: '#f59e0b',
              fontSize: 10,
              marginLeft: 4,
              fontWeight: '600'
            }}>
              PUBG Mobile
            </Text>
          </View>
        </View>
        
        {/* Contenido principal */}
        <LinearGradient
          colors={['#1f2937', '#111827']}
          style={{ padding: 16 }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '800',
            marginBottom: 6,
            lineHeight: 20
          }} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <MaterialCommunityIcons name="trophy" size={14} color="#9ca3af" />
            <Text style={{
              color: '#9ca3af',
              fontSize: 12,
              marginLeft: 4,
              fontWeight: '500'
            }}>
              {item.organizer}
            </Text>
          </View>
          
          {/* Premio y participantes */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <View style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}>
              <Text style={{
                color: '#3b82f6',
                fontSize: 16,
                fontWeight: '700'
              }}>
                {item.prize}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 10,
                textAlign: 'center',
                marginTop: 2
              }}>
                Premio
              </Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '700'
              }}>
                {item.participants}/{item.maxParticipants}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 10
              }}>
                Equipos
              </Text>
              
              {/* Barra de progreso */}
              <View style={{
                width: 60,
                height: 4,
                backgroundColor: '#374151',
                borderRadius: 2,
                marginTop: 4,
                overflow: 'hidden'
              }}>
                <View style={{
                  width: `${participationPercentage}%`,
                  height: '100%',
                  backgroundColor: participationPercentage > 80 ? '#ef4444' : 
                                 participationPercentage > 50 ? '#f59e0b' : '#10b981'
                }} />
              </View>
            </View>
          </View>
          
          {/* Fecha y botón */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View>
              <Text style={{
                color: '#f59e0b',
                fontSize: 14,
                fontWeight: '700'
              }}>
                {daysUntil > 0 ? `En ${daysUntil} días` : daysUntil === 0 ? 'Hoy' : 'En curso'}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 11,
                marginTop: 2
              }}>
                {new Date(item.startDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </Text>
            </View>
            
            <LinearGradient
              colors={item.status === 'registration' ? ['#10b981', '#059669'] : ['#3b82f6', '#2563eb']}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                shadowColor: item.status === 'registration' ? '#10b981' : '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 4
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {item.status === 'registration' ? 'Inscribirse' : 'Ver más'}
              </Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [router]);

  const renderTournamentsSection = useMemo(() => {
    return (
      <Animated.View 
        style={{ 
          marginBottom: 24,
          transform: [{ scale: scaleAnim }]
        }}
      >
        {/* Header con gradiente */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={{
                width: 4,
                height: 24,
                borderRadius: 2,
                marginRight: 12
              }}
            >
            </LinearGradient>
            <View>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '800',
                letterSpacing: 0.5
              }}>
                Torneos Destacados
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 12,
                fontWeight: '500',
                marginTop: 2
              }}>
                Compite por premios increíbles
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/tournaments')}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.3)',
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: '#3b82f6',
              fontSize: 13,
              fontWeight: '700',
              marginRight: 4
            }}>
              Ver todos
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={featuredTournaments}
          renderItem={renderTournamentItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingBottom: 8
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={2}
          snapToInterval={316} // width + marginRight
          decelerationRate="fast"
        />
      </Animated.View>
    );
  }, [router, scaleAnim]);





  // Componente memoizado para posts individuales
  const PostItem = memo(({ post, onToggleLike, onToggleSave, currentUserId }: {
    post: Post;
    onToggleLike: (postId: string, currentLikes: string[]) => void;
    onToggleSave: (postId: string, currentSaves: string[]) => void;
    currentUserId: string | undefined;
  }) => {
    const isLiked = post.likes?.includes(currentUserId || '') || false;
    const isSaved = post.saves?.includes(currentUserId || '') || false;
    
    return (
      <View style={{
        backgroundColor: '#374151',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16
      }}>
        {/* Header del post */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            {post.user?.avatarUrl ? (
              <Image
                source={{ uri: post.user.avatarUrl }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {post.user?.displayName?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontWeight: '600',
              fontSize: 16
            }}>
              {post.user?.displayName || 'Usuario'}
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: 12
            }}>
              {post.createdAt instanceof Date ? post.createdAt.toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()} • {post.createdAt instanceof Date ? post.createdAt.toLocaleTimeString() : new Date(post.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Contenido del post */}
        <Text style={{
          color: 'white',
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 16
        }}>
          {post.content}
        </Text>

        {/* Acciones */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => onToggleLike(post.id, post.likes)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 20
              }}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#ef4444' : '#9ca3af'}
              />
              <Text style={{
                color: '#9ca3af',
                marginLeft: 4,
                fontSize: 14
              }}>
                {post.likes.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 20
            }}>
              <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
              <Text style={{
                color: '#9ca3af',
                marginLeft: 4,
                fontSize: 14
              }}>
                {post.comments.length}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => onToggleSave(post.id, post.saves)}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? '#3b82f6' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  const renderPost = useCallback((post: Post) => {
    return (
      <PostItem
        key={post.id}
        post={post}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        currentUserId={user?.uid}
      />
    );
  }, [toggleLike, toggleSave, user?.uid]);

  if (loading) {
    return (
      <GradientLoadingState 
        message="Cargando feed..."
      />
    );
  }

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1a1a1a', '#2d2d2d']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ConnectionStatus showWhenOnline={false} position="top" />
      
      <Animated.ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#f59e0b"
            colors={['#f59e0b', '#d97706']}
            progressBackgroundColor="#1f2937"
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header moderno con gradiente */}
        <LinearGradient
          colors={['rgba(15, 15, 15, 0.95)', 'rgba(31, 41, 55, 0.8)', 'transparent']}
          style={{
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 20
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={{
                  width: 6,
                  height: 32,
                  borderRadius: 3,
                  marginRight: 12
                }}
              >
              </LinearGradient>
              <View>
                <Text style={{
                  color: 'white',
                  fontSize: 26,
                  fontWeight: '900',
                  letterSpacing: 0.5
                }}>
                  SquadGO
                </Text>
                <Text style={{
                  color: '#f59e0b',
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  PUBG Mobile Hub
                </Text>
              </View>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              {/* Botón Pro con gradiente */}
              <TouchableOpacity
                onPress={() => router.push('/subscriptions')}
                style={{
                  overflow: 'hidden',
                  borderRadius: 20
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 4
                  }}
                >
                  <Ionicons name="star" size={16} color="white" />
                  <Text style={{
                    color: 'white',
                    marginLeft: 4,
                    fontWeight: '700',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    Pro
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Botón de notificaciones */}
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(55, 65, 81, 0.8)',
                  padding: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}
              >
                <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
                {/* Badge de notificación */}
                <View style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#ef4444'
                }} />
              </TouchableOpacity>
              
              {/* Botón de creador */}
              <TouchableOpacity
                onPress={() => router.push('/creator-features')}
                style={{
                  overflow: 'hidden',
                  borderRadius: 16
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <Ionicons name="videocam" size={16} color="white" />
                  <Text style={{
                    color: 'white',
                    marginLeft: 4,
                    fontWeight: '700',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    Stream
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Stats rápidas */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingTop: 16
          }}>
            <View style={{
              alignItems: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <Text style={{
                color: '#ef4444',
                fontSize: 16,
                fontWeight: '700'
              }}>
                Live
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 10,
                marginTop: 2
              }}>
                Torneos
              </Text>
            </View>
            
            <View style={{
              alignItems: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)'
            }}>
              <Text style={{
                color: '#10b981',
                fontSize: 16,
                fontWeight: '700'
              }}>
                24/7
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 10,
                marginTop: 2
              }}>
                Matchmaking
              </Text>
            </View>
            
            <View style={{
              alignItems: 'center',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.3)'
            }}>
              <Text style={{
                color: '#f59e0b',
                fontSize: 16,
                fontWeight: '700'
              }}>
                $2M+
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 10,
                marginTop: 2
              }}>
                Premios
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stories Component */}
        <View style={{ marginBottom: 20 }}>
          <StoriesComponent
            stories={[
              {
                id: '1',
                user: {
                  id: '1',
                  name: 'ProPlayer',
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                  isVerified: true
                },
                media: [
                  {
                    type: 'image',
                    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
                    duration: 5000
                  }
                ],
                timestamp: Date.now() - 3600000,
                isViewed: false
              },
              {
                id: '2',
                user: {
                  id: '2',
                  name: 'GamerGirl',
                  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
                  isVerified: false
                },
                media: [
                  {
                    type: 'video',
                    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                    duration: 15000
                  }
                ],
                timestamp: Date.now() - 7200000,
                isViewed: true
              }
            ]}
            currentUserId="current-user-id"
          />
        </View>
        
        {/* Live Streams Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '700',
            paddingHorizontal: 16,
            marginBottom: 12
          }}>
            🔴 Transmisiones en Vivo
          </Text>
          <LiveStreamComponent
            stream={{
              id: '1',
              title: 'Clasificatorias PMGC 2024 - Squad vs Squad',
              streamer: {
                id: '1',
                name: 'ProStreamer',
                username: 'pro_streamer',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                isVerified: true,
                followers: 125000
              },
              thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
              viewers: 15420,
              duration: 7200000,
              category: 'PUBG Mobile',
              isLive: true,
              likes: 2340
            }}
            currentUserId="user123"
            onShare={() => console.log('Shared stream')}
            onFollow={() => console.log('Followed streamer')}
          />
        </View>

        {/* Carrusel de Noticias */}
        <View style={{ paddingTop: 24 }}>
          {renderNewsCarousel}
        </View>

        {/* Torneos Destacados */}
        <View style={{ paddingTop: 16 }}>
          {renderTournamentsSection}
        </View>



        {/* Crear post */}
        <View style={{
          margin: 16,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          <LinearGradient
            colors={['#1f2937', '#374151']}
            style={{
              padding: 20
            }}
          >
            {/* Header de creación */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FF6B35',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="person" size={20} color="white" />
              </View>
              <View>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  Comparte tu experiencia
                </Text>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 12,
                  marginTop: 2
                }}>
                  ¿Cómo fue tu última partida?
                </Text>
              </View>
            </View>
            
            {/* Input de texto */}
            <View style={{
              backgroundColor: 'rgba(55, 65, 81, 0.8)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.3)',
              padding: 16,
              marginBottom: 16
            }}>
              <TextInput
                value={newPost}
                onChangeText={setNewPost}
                placeholder="¿Chicken Dinner? ¿Nueva estrategia? ¡Compártelo con la comunidad!"
                placeholderTextColor="#9ca3af"
                multiline
                style={{
                  color: 'white',
                  fontSize: 16,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  lineHeight: 22
                }}
              />
            </View>
            
            {/* Opciones y botones */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <TouchableOpacity style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  padding: 10,
                  borderRadius: 10,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)'
                }}>
                  <Ionicons name="image-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                
                <TouchableOpacity style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  padding: 10,
                  borderRadius: 10,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)'
                }}>
                  <Ionicons name="location-outline" size={20} color="#10b981" />
                </TouchableOpacity>
                
                <TouchableOpacity style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}>
                  <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                onPress={createPost}
                disabled={posting || !newPost.trim()}
                style={{
                  overflow: 'hidden',
                  borderRadius: 12,
                  opacity: posting || !newPost.trim() ? 0.5 : 1
                }}
              >
                <LinearGradient
                  colors={posting || !newPost.trim() ? ['#6b7280', '#4b5563'] : ['#FF6B35', '#F7931E']}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  {posting ? (
                    <LoadingState size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={{
                        color: 'white',
                        fontWeight: '700',
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Publicar
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Lista de posts */}
        {posts.length === 0 ? (
          <View style={{
            alignItems: 'center',
            marginTop: 40,
            marginBottom: 40,
            paddingHorizontal: 32
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              borderWidth: 2,
              borderColor: 'rgba(255, 107, 53, 0.3)'
            }}>
              <Ionicons name="chatbubbles-outline" size={48} color="#FF6B35" />
            </View>
            
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8
            }}>
              ¡La comunidad te espera!
            </Text>
            
            <Text style={{
              color: '#9ca3af',
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 24
            }}>
              Sé el primero en compartir tus estrategias, victorias y momentos épicos de PUBG Mobile
            </Text>
            
            <TouchableOpacity style={{
              overflow: 'hidden',
              borderRadius: 12
            }}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Crear Post
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{
            paddingTop: 16
          }}>
            {/* Header de posts */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 16
            }}>
              <View>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '700'
                }}>
                  Feed de la Comunidad
                </Text>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 12,
                  marginTop: 2
                }}>
                  {posts.length} publicaciones
                </Text>
              </View>
              
              <TouchableOpacity style={{
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 53, 0.3)'
              }}>
                <Ionicons name="options-outline" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={posts}
              renderItem={({ item }) => renderPost(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              windowSize={10}
              initialNumToRender={3}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: 12 }} />
              )}
              getItemLayout={(data, index) => ({
                length: 200,
                offset: 200 * index,
                index
              })}
            />
          </View>
        )}
        
        {/* Footer con gradiente */}
        <View style={{
          height: 120,
          marginTop: theme.spacing.xl
        }}>
          <LinearGradient
            colors={theme.gradients.gaming}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: '#9ca3af',
              fontSize: theme.typography.fontSize.xs,
              textAlign: 'center'
            }}>
              SquadGO • PUBG Mobile Hub
            </Text>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
}