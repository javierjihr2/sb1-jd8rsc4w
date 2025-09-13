import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  followers: number;
  following: number;
  isVerified: boolean;
  isFollowing: boolean;
  specialties: string[];
  stats: {
    tournaments: number;
    wins: number;
    winRate: number;
    avgKD: number;
  };
  badges: string[];
  recentContent: {
    id: string;
    type: 'video' | 'stream' | 'guide' | 'tournament';
    title: string;
    thumbnail: string;
    views: number;
    duration?: string;
    createdAt: string;
  }[];
  socialLinks: {
    youtube?: string;
    twitch?: string;
    instagram?: string;
    twitter?: string;
  };
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Master';
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'ProGamer Elite',
    username: '@progamer_yt',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    bio: 'Jugador profesional del Battle Royale con más de 5 años de experiencia. Especialista en estrategias de equipo y coaching personalizado.',
    followers: 125000,
    following: 342,
    isVerified: true,
    isFollowing: false,
    specialties: ['Coaching', 'Estrategias', 'Análisis de Gameplay'],
    stats: {
      tournaments: 47,
      wins: 23,
      winRate: 89.2,
      avgKD: 4.7
    },
    badges: ['Champion', 'Top Creator', 'Verified Pro'],
    recentContent: [
      {
        id: 'c1',
        type: 'video',
        title: 'Cómo mejorar tu aim en el Battle Royale',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300',
        views: 45000,
        duration: '12:34',
        createdAt: '2024-01-15'
      },
      {
        id: 'c2',
        type: 'stream',
        title: 'Gameplay en vivo - Ranked Push',
        thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=300',
        views: 12000,
        createdAt: '2024-01-14'
      }
    ],
    socialLinks: {
      youtube: 'https://youtube.com/progamer',
      twitch: 'https://twitch.tv/progamer',
      instagram: 'https://instagram.com/progamer'
    },
    tier: 'Master'
  },
  {
    id: '2',
    name: 'StrategyMaster',
    username: '@strategy_pro',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    bio: 'Creador de contenido especializado en estrategias avanzadas y análisis de mapas. Ayudo a jugadores a mejorar su game sense.',
    followers: 87000,
    following: 156,
    isVerified: true,
    isFollowing: true,
    specialties: ['Estrategias de Mapas', 'Análisis Táctico', 'Coaching de Equipos'],
    stats: {
      tournaments: 32,
      wins: 18,
      winRate: 85.7,
      avgKD: 3.9
    },
    badges: ['Strategy Expert', 'Content Creator', 'Verified'],
    recentContent: [
      {
        id: 'c3',
        type: 'guide',
        title: 'Guía completa de Sanhok 2024',
        thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300',
        views: 28000,
        createdAt: '2024-01-13'
      }
    ],
    socialLinks: {
      youtube: 'https://youtube.com/strategy',
      twitch: 'https://twitch.tv/strategy'
    },
    tier: 'Diamond'
  },
  {
    id: '3',
    name: 'MobileGaming Queen',
    username: '@mobile_queen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    bio: 'Streamer y jugadora profesional. Me especializo en contenido educativo y entretenimiento para la comunidad del Battle Royale.',
    followers: 156000,
    following: 89,
    isVerified: true,
    isFollowing: false,
    specialties: ['Streaming', 'Entretenimiento', 'Tutoriales'],
    stats: {
      tournaments: 28,
      wins: 15,
      winRate: 82.1,
      avgKD: 4.2
    },
    badges: ['Top Streamer', 'Community Favorite', 'Verified'],
    recentContent: [
      {
        id: 'c4',
        type: 'stream',
        title: 'Jugando con suscriptores',
        thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=300',
        views: 67000,
        createdAt: '2024-01-16'
      }
    ],
    socialLinks: {
      youtube: 'https://youtube.com/mobilequeengaming',
      twitch: 'https://twitch.tv/mobilequeengaming',
      instagram: 'https://instagram.com/mobilequeengaming',
      twitter: 'https://twitter.com/mobilequeengaming'
    },
    tier: 'Master'
  },
  {
    id: '4',
    name: 'TechGamer',
    username: '@tech_gamer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Especialista en configuraciones técnicas, sensibilidades y optimización de dispositivos para el Battle Royale.',
    followers: 43000,
    following: 234,
    isVerified: false,
    isFollowing: false,
    specialties: ['Configuraciones', 'Sensibilidades', 'Optimización'],
    stats: {
      tournaments: 15,
      wins: 8,
      winRate: 76.3,
      avgKD: 3.4
    },
    badges: ['Tech Expert', 'Helper'],
    recentContent: [
      {
        id: 'c5',
        type: 'guide',
        title: 'Mejores sensibilidades 2024',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300',
        views: 19000,
        createdAt: '2024-01-12'
      }
    ],
    socialLinks: {
      youtube: 'https://youtube.com/techgamer'
    },
    tier: 'Gold'
  }
];

const tierColors = {
  'Bronze': '#CD7F32',
  'Silver': '#C0C0C0',
  'Gold': '#FFD700',
  'Diamond': '#B9F2FF',
  'Master': '#FF6B6B'
};

const contentTypeIcons = {
  'video': 'play-circle',
  'stream': 'radio',
  'guide': 'book',
  'tournament': 'trophy'
};

export default function CreatorsScreen() {
  const [creators, setCreators] = useState<Creator[]>(mockCreators);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Todos');

  const filters = ['Todos', 'Siguiendo', 'Verificados', 'Master', 'Diamond', 'Gold'];

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesFilter = true;
    switch (selectedFilter) {
      case 'Siguiendo':
        matchesFilter = creator.isFollowing;
        break;
      case 'Verificados':
        matchesFilter = creator.isVerified;
        break;
      case 'Master':
      case 'Diamond':
      case 'Gold':
        matchesFilter = creator.tier === selectedFilter;
        break;
    }
    
    return matchesSearch && matchesFilter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleFollowToggle = (creatorId: string) => {
    setCreators(prev => prev.map(creator => 
      creator.id === creatorId 
        ? { 
            ...creator, 
            isFollowing: !creator.isFollowing,
            followers: creator.isFollowing ? creator.followers - 1 : creator.followers + 1
          }
        : creator
    ));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const openCreatorProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    setModalVisible(true);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar creadores..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  const renderFilterTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            selectedFilter === filter && styles.filterButtonActive
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === filter && styles.filterTextActive
          ]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCreatorCard = (creator: Creator) => (
    <TouchableOpacity
      key={creator.id}
      style={styles.creatorCard}
      onPress={() => openCreatorProfile(creator)}
      activeOpacity={0.8}
    >
      {creator.coverImage && (
        <Image source={{ uri: creator.coverImage }} style={styles.coverImage} />
      )}
      
      <View style={styles.creatorContent}>
        <View style={styles.creatorHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: creator.avatar }} style={styles.avatar} />
            <View style={[
              styles.tierBadge,
              { backgroundColor: tierColors[creator.tier] }
            ]}>
              <Text style={styles.tierText}>{creator.tier}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.followButton,
              creator.isFollowing && styles.followingButton
            ]}
            onPress={() => handleFollowToggle(creator.id)}
            accessibilityRole="button"
            accessibilityLabel={creator.isFollowing ? 'Dejar de seguir' : 'Seguir'}
            accessibilityHint={creator.isFollowing ? `Deja de seguir a ${creator.name}` : `Sigue a ${creator.name}`}
            accessibilityState={{ selected: creator.isFollowing }}
          >
            <Text style={[
              styles.followButtonText,
              creator.isFollowing && styles.followingButtonText
            ]}>
              {creator.isFollowing ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.creatorInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.creatorName}>{creator.name}</Text>
            {creator.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            )}
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </View>

        <Text style={styles.bio} numberOfLines={2}>{creator.bio}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(creator.followers)}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.stats.wins}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.stats.winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.stats.avgKD}</Text>
            <Text style={styles.statLabel}>K/D Avg</Text>
          </View>
        </View>

        <View style={styles.specialtiesContainer}>
          {creator.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCreatorModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        {selectedCreator && (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                accessibilityHint="Cierra el perfil del creador"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              
              <Text style={styles.modalHeaderTitle}>Perfil del Creador</Text>
              
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  accessibilityRole="button"
                  accessibilityLabel="Compartir"
                  accessibilityHint="Comparte el perfil del creador"
                >
                  <Ionicons name="share-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedCreator.coverImage && (
                <Image 
                  source={{ uri: selectedCreator.coverImage }} 
                  style={styles.modalCoverImage} 
                />
              )}
              
              <View style={styles.modalCreatorContent}>
                <View style={styles.modalCreatorHeader}>
                  <View style={styles.modalAvatarContainer}>
                    <Image source={{ uri: selectedCreator.avatar }} style={styles.modalAvatar} />
                    <View style={[
                      styles.modalTierBadge,
                      { backgroundColor: tierColors[selectedCreator.tier] }
                    ]}>
                      <Text style={styles.modalTierText}>{selectedCreator.tier}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalFollowButton,
                      selectedCreator.isFollowing && styles.modalFollowingButton
                    ]}
                    onPress={() => handleFollowToggle(selectedCreator.id)}
                    accessibilityRole="button"
                    accessibilityLabel={selectedCreator.isFollowing ? 'Dejar de seguir' : 'Seguir'}
                    accessibilityHint={selectedCreator.isFollowing ? `Deja de seguir a ${selectedCreator.name}` : `Sigue a ${selectedCreator.name}`}
                    accessibilityState={{ selected: selectedCreator.isFollowing }}
                  >
                    <Text style={[
                      styles.modalFollowButtonText,
                      selectedCreator.isFollowing && styles.modalFollowingButtonText
                    ]}>
                      {selectedCreator.isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalCreatorInfo}>
                  <View style={styles.modalNameContainer}>
                    <Text style={styles.modalCreatorName}>{selectedCreator.name}</Text>
                    {selectedCreator.isVerified && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.modalUsername}>{selectedCreator.username}</Text>
                </View>

                <Text style={styles.modalBio}>{selectedCreator.bio}</Text>

                <View style={styles.modalStatsContainer}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{formatNumber(selectedCreator.followers)}</Text>
                    <Text style={styles.modalStatLabel}>Seguidores</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{formatNumber(selectedCreator.following)}</Text>
                    <Text style={styles.modalStatLabel}>Siguiendo</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedCreator.stats.tournaments}</Text>
                    <Text style={styles.modalStatLabel}>Torneos</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedCreator.stats.wins}</Text>
                    <Text style={styles.modalStatLabel}>Victorias</Text>
                  </View>
                </View>

                <View style={styles.badgesSection}>
                  <Text style={styles.sectionTitle}>Insignias</Text>
                  <View style={styles.badgesContainer}>
                    {selectedCreator.badges.map((badge, index) => (
                      <View key={index} style={styles.badge}>
                        <Ionicons name="medal" size={16} color="#F59E0B" />
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.specialtiesSection}>
                  <Text style={styles.sectionTitle}>Especialidades</Text>
                  <View style={styles.modalSpecialtiesContainer}>
                    {selectedCreator.specialties.map((specialty, index) => (
                      <View key={index} style={styles.modalSpecialtyTag}>
                        <Text style={styles.modalSpecialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.contentSection}>
                  <Text style={styles.sectionTitle}>Contenido Reciente</Text>
                  {selectedCreator.recentContent.map((content) => (
                    <TouchableOpacity 
                      key={content.id} 
                      style={styles.contentItem}
                      accessibilityRole="button"
                      accessibilityLabel={content.title}
                      accessibilityHint={`Ver contenido: ${content.title}`}
                    >
                      <Image source={{ uri: content.thumbnail }} style={styles.contentThumbnail} />
                      <View style={styles.contentInfo}>
                        <Text style={styles.contentTitle}>{content.title}</Text>
                        <View style={styles.contentMeta}>
                          <Ionicons 
                            name={contentTypeIcons[content.type] as any} 
                            size={14} 
                            color="#6B7280" 
                          />
                          <Text style={styles.contentViews}>{formatNumber(content.views)} vistas</Text>
                          {content.duration && (
                            <Text style={styles.contentDuration}>{content.duration}</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.socialSection}>
                  <Text style={styles.sectionTitle}>Redes Sociales</Text>
                  <View style={styles.socialLinks}>
                    {selectedCreator.socialLinks.youtube && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        accessibilityRole="button"
                        accessibilityLabel="YouTube"
                        accessibilityHint="Abre el canal de YouTube del creador"
                      >
                        <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                        <Text style={styles.socialLinkText}>YouTube</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCreator.socialLinks.twitch && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        accessibilityRole="button"
                        accessibilityLabel="Twitch"
                        accessibilityHint="Abre el canal de Twitch del creador"
                      >
                        <Ionicons name="logo-twitch" size={24} color="#9146FF" />
                        <Text style={styles.socialLinkText}>Twitch</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCreator.socialLinks.instagram && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        accessibilityRole="button"
                        accessibilityLabel="Instagram"
                        accessibilityHint="Abre el perfil de Instagram del creador"
                      >
                        <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                        <Text style={styles.socialLinkText}>Instagram</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCreator.socialLinks.twitter && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        accessibilityRole="button"
                        accessibilityLabel="Twitter"
                        accessibilityHint="Abre el perfil de Twitter del creador"
                      >
                        <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                        <Text style={styles.socialLinkText}>Twitter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Creadores</Text>
        <Text style={styles.headerSubtitle}>Descubre y sigue a los mejores</Text>
        
        {/* Búsqueda integrada en el header */}
        <View style={styles.headerSearchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" style={styles.headerSearchIcon} />
          <TextInput
            style={styles.headerSearchInput}
            placeholder="Buscar creadores..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="rgba(255,255,255,0.5)"
            accessibilityLabel="Buscar creadores"
            accessibilityHint="Escribe para buscar creadores por nombre o especialidad"
          />
        </View>
        
        {/* Filtros integrados en el header */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.headerFilterContainer}
          contentContainerStyle={styles.headerFilterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.headerFilterButton,
                selectedFilter === filter && styles.headerFilterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
              accessibilityRole="button"
              accessibilityLabel={filter}
              accessibilityHint={`Filtrar creadores por ${filter}`}
              accessibilityState={{ selected: selectedFilter === filter }}
            >
              <Text style={[
                styles.headerFilterText,
                selectedFilter === filter && styles.headerFilterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredCreators.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No se encontraron creadores</Text>
            <Text style={styles.emptyStateSubtext}>Intenta con otros filtros o términos de búsqueda</Text>
          </View>
        ) : (
          filteredCreators.map(renderCreatorCard)
        )}
      </ScrollView>

      {renderCreatorModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSearchIcon: {
    marginRight: 12,
  },
  headerSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
  },
  headerFilterContainer: {
    marginTop: 15,
  },
  headerFilterContent: {
    paddingRight: 20,
  },
  headerFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerFilterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerFilterTextActive: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  creatorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
  },
  creatorContent: {
    padding: 16,
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
  },
  tierBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  followButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  followingButtonText: {
    color: '#374151',
  },
  creatorInfo: {
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  username: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  specialtyText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    gap: 16,
  },
  shareButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalCoverImage: {
    width: '100%',
    height: 200,
  },
  modalCreatorContent: {
    padding: 20,
  },
  modalCreatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalAvatarContainer: {
    position: 'relative',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
  },
  modalTierBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  modalTierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  modalFollowButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalFollowingButton: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalFollowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalFollowingButtonText: {
    color: '#374151',
  },
  modalCreatorInfo: {
    marginBottom: 16,
  },
  modalNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalCreatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalUsername: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  modalBio: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  specialtiesSection: {
    marginBottom: 24,
  },
  modalSpecialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSpecialtyTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  modalSpecialtyText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  contentSection: {
    marginBottom: 24,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  contentThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentViews: {
    fontSize: 12,
    color: '#6b7280',
  },
  contentDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  socialSection: {
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  socialLinkText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});