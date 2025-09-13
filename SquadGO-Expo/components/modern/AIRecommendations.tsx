import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Animated,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface UserPreferences {
  interests: string[];
  contentTypes: string[];
  activityTimes: string[];
  socialLevel: 'introvert' | 'ambivert' | 'extrovert';
  contentConsumption: {
    videos: number;
    images: number;
    text: number;
    audio: number;
  };
  interactionPatterns: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

interface ContentRecommendation {
  id: string;
  type: 'video' | 'image' | 'text' | 'audio' | 'live';
  title: string;
  description: string;
  thumbnail: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  tags: string[];
  duration?: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  relevanceScore: number;
  reason: string;
  category: string;
  isSponsored: boolean;
  publishedAt: number;
}

interface PersonRecommendation {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isVerified: boolean;
  followers: number;
  following: number;
  mutualFriends: number;
  commonInterests: string[];
  relevanceScore: number;
  reason: string;
  location?: string;
  profession?: string;
  isOnline: boolean;
  lastActive: number;
}

interface ActivityRecommendation {
  id: string;
  type: 'event' | 'challenge' | 'group' | 'course' | 'game';
  title: string;
  description: string;
  image: string;
  organizer: {
    name: string;
    avatar: string;
  };
  participants: number;
  maxParticipants?: number;
  startDate: number;
  endDate?: number;
  location?: string;
  isVirtual: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relevanceScore: number;
  reason: string;
  isPremium: boolean;
}

interface TrendingTopic {
  id: string;
  name: string;
  hashtag: string;
  posts: number;
  growth: number;
  category: string;
  description: string;
  relatedTopics: string[];
}

interface AIInsight {
  id: string;
  type: 'behavior' | 'preference' | 'opportunity' | 'trend';
  title: string;
  description: string;
  icon: string;
  color: string;
  actionable: boolean;
  action?: {
    label: string;
    type: string;
    data: any;
  };
  confidence: number;
  timestamp: number;
}

interface AIRecommendationsProps {
  userPreferences: UserPreferences;
  contentRecommendations: ContentRecommendation[];
  personRecommendations: PersonRecommendation[];
  activityRecommendations: ActivityRecommendation[];
  trendingTopics: TrendingTopic[];
  aiInsights: AIInsight[];
  onContentInteraction?: (contentId: string, action: string) => void;
  onFollowUser?: (userId: string) => void;
  onJoinActivity?: (activityId: string) => void;
  onUpdatePreferences?: (preferences: Partial<UserPreferences>) => void;
  onRefresh?: () => void;
}

const RECOMMENDATION_CATEGORIES = [
  { id: 'all', name: 'Todo', icon: 'apps' },
  { id: 'content', name: 'Contenido', icon: 'play-circle' },
  { id: 'people', name: 'Personas', icon: 'people' },
  { id: 'activities', name: 'Actividades', icon: 'calendar' },
  { id: 'trends', name: 'Tendencias', icon: 'trending-up' },
  { id: 'insights', name: 'Insights', icon: 'bulb' },
];

const CONTENT_TYPES = [
  { id: 'video', name: 'Videos', icon: 'videocam', color: '#FF6B35' },
  { id: 'image', name: 'Fotos', icon: 'image', color: '#E91E63' },
  { id: 'text', name: 'Texto', icon: 'document-text', color: '#9C27B0' },
  { id: 'audio', name: 'Audio', icon: 'musical-notes', color: '#3F51B5' },
  { id: 'live', name: 'En Vivo', icon: 'radio', color: '#F44336' },
];

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  userPreferences,
  contentRecommendations,
  personRecommendations,
  activityRecommendations,
  trendingTopics,
  aiInsights,
  onContentInteraction,
  onFollowUser,
  onJoinActivity,
  onUpdatePreferences,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showInsightDetails, setShowInsightDetails] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Ahora';
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const renderAIInsights = () => {
    const topInsights = aiInsights.slice(0, 3);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🤖 Insights de IA</Text>
          <TouchableOpacity onPress={() => setShowPreferences(true)}>
            <Ionicons name="settings" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {topInsights.map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={styles.insightCard}
              onPress={() => {
                setSelectedInsight(insight);
                setShowInsightDetails(true);
              }}
            >
              <LinearGradient
                colors={[insight.color, insight.color + '80']}
                style={styles.insightGradient}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <View style={styles.confidenceIndicator}>
                    <Text style={styles.confidenceText}>
                      {Math.round(insight.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.insightTitle} numberOfLines={2}>
                  {insight.title}
                </Text>
                
                <Text style={styles.insightDescription} numberOfLines={3}>
                  {insight.description}
                </Text>
                
                {insight.actionable && (
                  <View style={styles.actionableIndicator}>
                    <Ionicons name="flash" size={12} color="white" />
                    <Text style={styles.actionableText}>Accionable</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContentRecommendations = () => {
    const filteredContent = contentTypeFilter === 'all'
      ? contentRecommendations
      : contentRecommendations.filter(content => content.type === contentTypeFilter);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📱 Contenido para ti</Text>
          <TouchableOpacity>
            <Ionicons name="refresh" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        {/* Content Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              contentTypeFilter === 'all' && styles.selectedFilter
            ]}
            onPress={() => setContentTypeFilter('all')}
          >
            <Text style={[
              styles.filterText,
              contentTypeFilter === 'all' && styles.selectedFilterText
            ]}>Todo</Text>
          </TouchableOpacity>
          
          {CONTENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterButton,
                contentTypeFilter === type.id && styles.selectedFilter
              ]}
              onPress={() => setContentTypeFilter(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={contentTypeFilter === type.id ? 'white' : type.color}
              />
              <Text style={[
                styles.filterText,
                contentTypeFilter === type.id && styles.selectedFilterText
              ]}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <FlatList
          data={filteredContent.slice(0, 10)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contentItem}
              onPress={() => onContentInteraction?.(item.id, 'view')}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.contentThumbnail} />
              
              <View style={styles.contentInfo}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.relevanceScore}>
                    <View style={[
                      styles.relevanceDot,
                      { backgroundColor: getRelevanceColor(item.relevanceScore) }
                    ]} />
                    <Text style={styles.relevanceText}>
                      {Math.round(item.relevanceScore * 100)}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.creatorInfo}>
                  <Image source={{ uri: item.creator.avatar }} style={styles.creatorAvatar} />
                  <Text style={styles.creatorName}>{item.creator.name}</Text>
                  {item.creator.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  )}
                </View>
                
                <Text style={styles.contentReason} numberOfLines={2}>
                  💡 {item.reason}
                </Text>
                
                <View style={styles.contentStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye" size={12} color="#666" />
                    <Text style={styles.statText}>{formatNumber(item.engagement.views)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={12} color="#666" />
                    <Text style={styles.statText}>{formatNumber(item.engagement.likes)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="chatbubble" size={12} color="#666" />
                    <Text style={styles.statText}>{formatNumber(item.engagement.comments)}</Text>
                  </View>
                  <Text style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</Text>
                </View>
              </View>
              
              <View style={styles.contentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onContentInteraction?.(item.id, 'like')}
                >
                  <Ionicons name="heart-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onContentInteraction?.(item.id, 'save')}
                >
                  <Ionicons name="bookmark-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderPersonRecommendations = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Personas que podrían interesarte</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {personRecommendations.slice(0, 8).map((person) => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personHeader}>
                <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
                {person.isOnline && <View style={styles.onlineIndicator} />}
                
                <View style={styles.relevanceScore}>
                  <View style={[
                    styles.relevanceDot,
                    { backgroundColor: getRelevanceColor(person.relevanceScore) }
                  ]} />
                  <Text style={styles.relevanceText}>
                    {Math.round(person.relevanceScore * 100)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.personInfo}>
                <View style={styles.personNameContainer}>
                  <Text style={styles.personName} numberOfLines={1}>
                    {person.displayName}
                  </Text>
                  {person.isVerified && (
                    <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                  )}
                </View>
                
                <Text style={styles.personUsername}>@{person.username}</Text>
                
                {person.profession && (
                  <Text style={styles.personProfession} numberOfLines={1}>
                    {person.profession}
                  </Text>
                )}
                
                <Text style={styles.personReason} numberOfLines={2}>
                  💡 {person.reason}
                </Text>
                
                {person.mutualFriends > 0 && (
                  <Text style={styles.mutualFriends}>
                    {person.mutualFriends} amigos en común
                  </Text>
                )}
                
                <View style={styles.personStats}>
                  <Text style={styles.personStat}>
                    {formatNumber(person.followers)} seguidores
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => onFollowUser?.(person.id)}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8A65']}
                  style={styles.followButtonGradient}
                >
                  <Text style={styles.followButtonText}>Seguir</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderActivityRecommendations = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Actividades recomendadas</Text>
        
        {activityRecommendations.slice(0, 5).map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityItem}
            onPress={() => onJoinActivity?.(activity.id)}
          >
            <Image source={{ uri: activity.image }} style={styles.activityImage} />
            
            <View style={styles.activityInfo}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
                {activity.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={10} color="#FFD700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
              
              <Text style={styles.activityReason} numberOfLines={1}>
                💡 {activity.reason}
              </Text>
              
              <View style={styles.activityDetails}>
                <View style={styles.activityDetail}>
                  <Ionicons name="people" size={12} color="#666" />
                  <Text style={styles.activityDetailText}>
                    {activity.participants} participantes
                  </Text>
                </View>
                
                <View style={styles.activityDetail}>
                  <Ionicons name="calendar" size={12} color="#666" />
                  <Text style={styles.activityDetailText}>
                    {new Date(activity.startDate).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.activityDetail}>
                  <Ionicons name="location" size={12} color="#666" />
                  <Text style={styles.activityDetailText}>
                    {activity.isVirtual ? 'Virtual' : activity.location}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.activityActions}>
              <View style={styles.relevanceScore}>
                <View style={[
                  styles.relevanceDot,
                  { backgroundColor: getRelevanceColor(activity.relevanceScore) }
                ]} />
                <Text style={styles.relevanceText}>
                  {Math.round(activity.relevanceScore * 100)}%
                </Text>
              </View>
              
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Unirse</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTrendingTopics = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Tendencias</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {trendingTopics.map((topic) => (
            <TouchableOpacity key={topic.id} style={styles.trendingItem}>
              <View style={styles.trendingHeader}>
                <Text style={styles.trendingName}>{topic.name}</Text>
                <View style={styles.trendingGrowth}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                  <Text style={styles.trendingGrowthText}>+{topic.growth}%</Text>
                </View>
              </View>
              
              <Text style={styles.trendingHashtag}>{topic.hashtag}</Text>
              <Text style={styles.trendingPosts}>
                {formatNumber(topic.posts)} publicaciones
              </Text>
              
              <Text style={styles.trendingDescription} numberOfLines={3}>
                {topic.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryTabs = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
      >
        {RECOMMENDATION_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.selectedCategoryTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? 'white' : '#666'}
            />
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === category.id && styles.selectedCategoryTabText
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case 'content':
        return renderContentRecommendations();
      case 'people':
        return renderPersonRecommendations();
      case 'activities':
        return renderActivityRecommendations();
      case 'trends':
        return renderTrendingTopics();
      case 'insights':
        return renderAIInsights();
      default:
        return (
          <>
            {renderAIInsights()}
            {renderContentRecommendations()}
            {renderPersonRecommendations()}
            {renderActivityRecommendations()}
            {renderTrendingTopics()}
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recomendaciones IA</Text>
          <TouchableOpacity onPress={() => setShowPreferences(true)}>
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Category Tabs */}
      {renderCategoryTabs()}
      
      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
        >
          {renderContent()}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  categoryTabs: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: '#1A1A2E',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: theme.spacing.sm,
    gap: theme.spacing[1],
  },
  selectedCategoryTab: {
    backgroundColor: '#FF6B35',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  insightCard: {
    width: 280,
    marginRight: 15,
  },
  insightGradient: {
    padding: 20,
    borderRadius: 15,
    minHeight: 160,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  confidenceIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    flex: 1,
  },
  actionableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  actionableText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
    gap: 4,
  },
  selectedFilter: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ccc',
  },
  selectedFilterText: {
    color: 'white',
  },
  contentItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  contentThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  contentInfo: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginRight: 8,
  },
  relevanceScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relevanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ccc',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  creatorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  creatorName: {
    fontSize: 12,
    color: '#ccc',
  },
  contentReason: {
    fontSize: 11,
    color: '#FF6B35',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  contentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 10,
    color: '#666',
  },
  timeAgo: {
    fontSize: 10,
    color: '#666',
    marginLeft: 'auto',
  },
  contentActions: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCard: {
    width: 180,
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 35,
    left: 35,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1E1E3F',
  },
  personInfo: {
    flex: 1,
  },
  personNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  personUsername: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  personProfession: {
    fontSize: 11,
    color: '#FF6B35',
    marginBottom: 6,
  },
  personReason: {
    fontSize: 10,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  mutualFriends: {
    fontSize: 10,
    color: '#4CAF50',
    marginBottom: 6,
  },
  personStats: {
    marginBottom: 12,
  },
  personStat: {
    fontSize: 10,
    color: '#666',
  },
  followButton: {
    marginTop: 'auto',
  },
  followButtonGradient: {
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  activityImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  premiumText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFD700',
  },
  activityDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  activityReason: {
    fontSize: 10,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  activityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  activityDetailText: {
    fontSize: 10,
    color: '#666',
  },
  activityActions: {
    alignItems: 'center',
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  trendingItem: {
    width: 160,
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  trendingGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendingGrowthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
  },
  trendingHashtag: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 4,
  },
  trendingPosts: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  trendingDescription: {
    fontSize: 10,
    color: '#ccc',
    lineHeight: 14,
  },
});

export default AIRecommendations;