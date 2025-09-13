import React, { useState, useRef } from 'react';
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
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  reward?: string;
}

interface SocialStats {
  followers: number;
  following: number;
  posts: number;
  likes: number;
  views: number;
  engagement: number;
}

interface ProfileTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImage?: string;
  isPremium: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  isVerified: boolean;
  isPremium: boolean;
  isInfluencer: boolean;
  level: number;
  experience: number;
  nextLevelExp: number;
  joinedAt: number;
  location?: string;
  website?: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    twitch?: string;
  };
  badges: Badge[];
  achievements: Achievement[];
  stats: SocialStats;
  theme: ProfileTheme;
  isOnline: boolean;
  lastSeen?: number;
  privacySettings: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: 'everyone' | 'followers' | 'none';
    showActivity: boolean;
  };
}

interface Post {
  id: string;
  type: 'image' | 'video' | 'text' | 'reel' | 'story';
  content: string;
  media: string[];
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  createdAt: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface AdvancedProfileProps {
  profile: UserProfile;
  posts: Post[];
  isOwnProfile: boolean;
  currentUserId: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onCall?: (userId: string, isVideo: boolean) => void;
  onBlock?: (userId: string) => void;
  onReport?: (userId: string) => void;
  onEditProfile?: () => void;
  onPostPress?: (post: Post) => void;
  onLikePost?: (postId: string) => void;
  onSharePost?: (postId: string) => void;
  onSavePost?: (postId: string) => void;
}

const PROFILE_THEMES: ProfileTheme[] = [
  { id: 'default', name: 'Clásico', primaryColor: '#FF6B35', secondaryColor: '#FF8A65', isPremium: false },
  { id: 'ocean', name: 'Océano', primaryColor: '#2196F3', secondaryColor: '#64B5F6', isPremium: false },
  { id: 'sunset', name: 'Atardecer', primaryColor: '#FF5722', secondaryColor: '#FF8A65', isPremium: true },
  { id: 'galaxy', name: 'Galaxia', primaryColor: '#9C27B0', secondaryColor: '#BA68C8', isPremium: true },
  { id: 'forest', name: 'Bosque', primaryColor: '#4CAF50', secondaryColor: '#81C784', isPremium: true },
  { id: 'gold', name: 'Oro', primaryColor: '#FFD700', secondaryColor: '#FFF176', isPremium: true },
];

const BADGE_RARITIES = {
  common: { color: '#9E9E9E', glow: '#BDBDBD' },
  rare: { color: '#2196F3', glow: '#64B5F6' },
  epic: { color: '#9C27B0', glow: '#BA68C8' },
  legendary: { color: '#FF9800', glow: '#FFB74D' }
};

export const AdvancedProfile: React.FC<AdvancedProfileProps> = ({
  profile,
  posts,
  isOwnProfile,
  currentUserId,
  onFollow,
  onUnfollow,
  onMessage,
  onCall,
  onBlock,
  onReport,
  onEditProfile,
  onPostPress,
  onLikePost,
  onSharePost,
  onSavePost
}) => {
  const [selectedTab, setSelectedTab] = useState('posts');
  const [showBadges, setShowBadges] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getExperienceProgress = () => {
    return (profile.experience / profile.nextLevelExp) * 100;
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
          <LinearGradient
            colors={[profile.theme.primaryColor + '40', profile.theme.secondaryColor + '40']}
            style={styles.coverOverlay}
          />
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerRightActions}>
              {!isOwnProfile && (
                <TouchableOpacity style={styles.headerButton}>
                  <Ionicons name="notifications-outline" size={24} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowOptions(true)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Online Status */}
          {profile.isOnline && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>En línea</Text>
            </View>
          )}
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <LinearGradient
              colors={[profile.theme.primaryColor, profile.theme.secondaryColor]}
              style={styles.avatarBorder}
            />
            
            {/* Level Badge */}
            <View style={[styles.levelBadge, { backgroundColor: profile.theme.primaryColor }]}>
              <Text style={styles.levelText}>{profile.level}</Text>
            </View>
            
            {/* Verification Badges */}
            <View style={styles.verificationBadges}>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" />
                </View>
              )}
              {profile.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={20} color="#FFD700" />
                </View>
              )}
              {profile.isInfluencer && (
                <View style={styles.influencerBadge}>
                  <Ionicons name="star" size={20} color="#FF6B35" />
                </View>
              )}
            </View>
          </View>
          
          {/* Name and Username */}
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            
            {/* Experience Bar */}
            <View style={styles.experienceContainer}>
              <View style={styles.experienceBar}>
                <LinearGradient
                  colors={[profile.theme.primaryColor, profile.theme.secondaryColor]}
                  style={[styles.experienceProgress, { width: `${getExperienceProgress()}%` }]}
                />
              </View>
              <Text style={styles.experienceText}>
                {profile.experience}/{profile.nextLevelExp} XP
              </Text>
            </View>
          </View>
          
          {/* Bio */}
          <TouchableOpacity
            style={styles.bioContainer}
            onPress={() => setShowFullBio(!showFullBio)}
          >
            <Text
              style={styles.bio}
              numberOfLines={showFullBio ? undefined : 3}
            >
              {profile.bio}
            </Text>
            {profile.bio.length > 100 && (
              <Text style={styles.bioToggle}>
                {showFullBio ? 'Ver menos' : 'Ver más'}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Location and Website */}
          <View style={styles.metaInfo}>
            {profile.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.metaText}>{profile.location}</Text>
              </View>
            )}
            {profile.website && (
              <TouchableOpacity style={styles.metaItem}>
                <Ionicons name="link" size={14} color="#666" />
                <Text style={[styles.metaText, styles.linkText]}>{profile.website}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color="#666" />
              <Text style={styles.metaText}>Se unió en {formatDate(profile.joinedAt)}</Text>
            </View>
          </View>
          
          {/* Social Links */}
          {Object.keys(profile.socialLinks).length > 0 && (
            <View style={styles.socialLinks}>
              {profile.socialLinks.instagram && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                </TouchableOpacity>
              )}
              {profile.socialLinks.twitter && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                </TouchableOpacity>
              )}
              {profile.socialLinks.youtube && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                </TouchableOpacity>
              )}
              {profile.socialLinks.tiktok && (
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.tiktokIcon}>🎵</Text>
                </TouchableOpacity>
              )}
              {profile.socialLinks.twitch && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-twitch" size={20} color="#9146FF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Stats */}
        <TouchableOpacity
          style={styles.statsContainer}
          onPress={() => setShowStats(true)}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(profile.stats.posts)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(profile.stats.followers)}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(profile.stats.following)}</Text>
            <Text style={styles.statLabel}>Siguiendo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(profile.stats.likes)}</Text>
            <Text style={styles.statLabel}>Me gusta</Text>
          </View>
        </TouchableOpacity>
        
        {/* Badges Preview */}
        <TouchableOpacity
          style={styles.badgesPreview}
          onPress={() => setShowBadges(true)}
        >
          <Text style={styles.badgesTitle}>Insignias ({profile.badges.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profile.badges.slice(0, 5).map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgePreview,
                  { borderColor: BADGE_RARITIES[badge.rarity].color }
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>
            ))}
            {profile.badges.length > 5 && (
              <View style={styles.moreBadges}>
                <Text style={styles.moreBadgesText}>+{profile.badges.length - 5}</Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={onEditProfile}
              >
                <Ionicons name="create" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setShowThemes(true)}
              >
                <Ionicons name="color-palette" size={20} color={profile.theme.primaryColor} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setShowAchievements(true)}
              >
                <Ionicons name="trophy" size={20} color={profile.theme.primaryColor} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  isFollowing && styles.followingButton
                ]}
                onPress={() => {
                  if (isFollowing) {
                    onUnfollow?.(profile.id);
                  } else {
                    onFollow?.(profile.id);
                  }
                  setIsFollowing(!isFollowing);
                }}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "person-add"}
                  size={20}
                  color={isFollowing ? profile.theme.primaryColor : "white"}
                />
                <Text style={[
                  styles.primaryButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => onMessage?.(profile.id)}
              >
                <Ionicons name="chatbubble" size={20} color={profile.theme.primaryColor} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => onCall?.(profile.id, false)}
              >
                <Ionicons name="call" size={20} color={profile.theme.primaryColor} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => onCall?.(profile.id, true)}
              >
                <Ionicons name="videocam" size={20} color={profile.theme.primaryColor} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'posts', name: 'Posts', icon: 'grid' },
      { id: 'reels', name: 'Reels', icon: 'play-circle' },
      { id: 'tagged', name: 'Etiquetado', icon: 'person' },
      { id: 'saved', name: 'Guardado', icon: 'bookmark', private: true },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          if (tab.private && !isOwnProfile) return null;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && {
                  borderBottomColor: profile.theme.primaryColor
                }
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={selectedTab === tab.id ? profile.theme.primaryColor : '#666'}
              />
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && {
                    color: profile.theme.primaryColor
                  }
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPosts = () => {
    const filteredPosts = posts.filter(post => {
      switch (selectedTab) {
        case 'reels':
          return post.type === 'reel';
        case 'tagged':
          return true; // Would filter tagged posts
        case 'saved':
          return post.isSaved;
        default:
          return post.type !== 'reel';
      }
    });

    return (
      <FlatList
        data={filteredPosts}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postItem}
            onPress={() => onPostPress?.(item)}
          >
            <Image source={{ uri: item.media[0] }} style={styles.postImage} />
            
            {item.type === 'video' && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play" size={16} color="white" />
              </View>
            )}
            
            {item.media.length > 1 && (
              <View style={styles.multipleIndicator}>
                <Ionicons name="copy" size={16} color="white" />
              </View>
            )}
            
            <View style={styles.postOverlay}>
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <Ionicons name="heart" size={14} color="white" />
                  <Text style={styles.postStatText}>{formatNumber(item.likes)}</Text>
                </View>
                <View style={styles.postStat}>
                  <Ionicons name="chatbubble" size={14} color="white" />
                  <Text style={styles.postStatText}>{formatNumber(item.comments)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.postsGrid}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{profile.displayName}</Text>
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <Ionicons name="ellipsis-vertical" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        {renderTabs()}
        {renderPosts()}
      </Animated.ScrollView>
      
      {/* Badges Modal */}
      <Modal
        visible={showBadges}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBadges(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBadges(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Insignias</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <FlatList
            data={profile.badges}
            renderItem={({ item }) => (
              <View style={styles.badgeItem}>
                <View style={[
                  styles.badgeIconContainer,
                  {
                    backgroundColor: BADGE_RARITIES[item.rarity].color,
                    shadowColor: BADGE_RARITIES[item.rarity].glow
                  }
                ]}>
                  <Text style={styles.badgeItemIcon}>{item.icon}</Text>
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={styles.badgeName}>{item.name}</Text>
                  <Text style={styles.badgeDescription}>{item.description}</Text>
                  {item.unlockedAt && (
                    <Text style={styles.badgeDate}>
                      Desbloqueado el {formatDate(item.unlockedAt)}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.rarityIndicator,
                  { backgroundColor: BADGE_RARITIES[item.rarity].color }
                ]}>
                  <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.badgesList}
          />
        </View>
      </Modal>
      
      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsMenu}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="settings" size={20} color="#333" />
                  <Text style={styles.optionText}>Configuración</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="analytics" size={20} color="#333" />
                  <Text style={styles.optionText}>Estadísticas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="share" size={20} color="#333" />
                  <Text style={styles.optionText}>Compartir perfil</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="share" size={20} color="#333" />
                  <Text style={styles.optionText}>Compartir perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="copy" size={20} color="#333" />
                  <Text style={styles.optionText}>Copiar enlace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptions(false);
                    onBlock?.(profile.id);
                  }}
                >
                  <Ionicons name="ban" size={20} color="#FF4444" />
                  <Text style={[styles.optionText, { color: '#FF4444' }]}>Bloquear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptions(false);
                    onReport?.(profile.id);
                  }}
                >
                  <Ionicons name="flag" size={20} color="#FF4444" />
                  <Text style={[styles.optionText, { color: '#FF4444' }]}>Reportar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBackButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'white',
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    padding: 20,
    paddingTop: 0,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -50,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 52,
    zIndex: -1,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  levelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  verificationBadges: {
    position: 'absolute',
    top: -5,
    right: -5,
    flexDirection: 'row',
    gap: 2,
  },
  verifiedBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  premiumBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  influencerBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  experienceContainer: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  experienceBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  experienceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  experienceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bioContainer: {
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
  bioToggle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  metaInfo: {
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#1DA1F2',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badgesPreview: {
    marginBottom: 20,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  badgePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'white',
  },
  badgeIcon: {
    fontSize: 20,
  },
  moreBadges: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBadgesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  secondaryButton: {
    width: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FF6B35',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  postsGrid: {
    padding: 2,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 10,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  badgesList: {
    padding: 20,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeItemIcon: {
    fontSize: 24,
    color: 'white',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badgeDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  rarityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AdvancedProfile;