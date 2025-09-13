import * as React from 'react';
import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
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
  Share,
  Animated,
  ImageStyle,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useOptimizedFlatList, FlatListConfigs } from '../../hooks/useOptimizedFlatList';
import { useInteractionManager, useOptimizedNetworkOperation, InteractionUtils } from '../../hooks/useInteractionManager';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface PostMedia {
  id: string;
  type: 'image' | 'video' | 'carousel';
  url: string;
  thumbnail?: string;
  aspectRatio?: number;
}

interface PostUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  location?: string;
}

interface PostReaction {
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  emoji: string;
  count: number;
}

interface Post {
  id: string;
  user: PostUser;
  content: string;
  media: PostMedia[];
  reactions: PostReaction[];
  totalReactions: number;
  comments: number;
  shares: number;
  timestamp: number;
  isLiked?: boolean;
  isSaved?: boolean;
  currentReaction?: string;
  hashtags?: string[];
  mentions?: string[];
  location?: string;
  isSponsored?: boolean;
}

interface ModernFeedComponentProps {
  posts: Post[];
  currentUserId: string;
  onLike?: (postId: string, reactionType?: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onUserPress?: (userId: string) => void;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', color: '#1877F2' },
  { type: 'love', emoji: '❤️', color: '#E91E63' },
  { type: 'haha', emoji: '😂', color: '#FFC107' },
  { type: 'wow', emoji: '😮', color: '#FF9800' },
  { type: 'sad', emoji: '😢', color: '#607D8B' },
  { type: 'angry', emoji: '😡', color: '#F44336' },
];

export const ModernFeedComponent: React.FC<ModernFeedComponentProps> = memo(({
  posts,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onUserPress
}) => {
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<PostMedia | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [optimizedPosts, setOptimizedPosts] = useState<Post[]>(posts);
  const reactionAnimation = useRef(new Animated.Value(0)).current;
  const likeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const { runAfterInteractions } = useInteractionManager();
  const networkOperation = useOptimizedNetworkOperation<Post[]>();

  // Optimizar posts usando InteractionManager
  useEffect(() => {
    runAfterInteractions(() => {
      setOptimizedPosts(posts);
    });
  }, [posts, runAfterInteractions]);

  // Usar FlatList optimizado
  const { flatListProps, flatListRef } = useOptimizedFlatList({
    data: optimizedPosts,
    renderItem: ({ item }) => renderPost(item),
    keyExtractor: (item) => item.id,
    ...FlatListConfigs.feed,
    onEndReached: () => {
      // Aquí se puede implementar paginación
      runAfterInteractions(() => {
        console.log('Reached end of feed');
      });
    },
  });

  const handleLongPress = useCallback((postId: string) => {
    runAfterInteractions(() => {
      setShowReactions(postId);
      Animated.spring(reactionAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  }, [runAfterInteractions, reactionAnimation]);

  const handleReaction = useCallback((postId: string, reactionType: string) => {
    runAfterInteractions(() => {
      setShowReactions(null);
      Animated.spring(reactionAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      onLike?.(postId, reactionType);
    });
  }, [runAfterInteractions, reactionAnimation, onLike]);

  const handleDoubleTap = useCallback((postId: string) => {
    runAfterInteractions(() => {
      if (!likeAnimations[postId]) {
        likeAnimations[postId] = new Animated.Value(0);
      }

      Animated.sequence([
        Animated.timing(likeAnimations[postId], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimations[postId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      onLike?.(postId, 'love');
    });
  }, [runAfterInteractions, likeAnimations, onLike]);

  const handleShare = useCallback(async (post: Post) => {
    try {
      await runAfterInteractions(async () => {
        await Share.share({
          message: `${post.content} - Compartido desde SquadGO`,
          url: post.media[0]?.url || '',
        });
        onShare?.(post.id);
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [runAfterInteractions, onShare]);

  const renderMediaCarousel = (media: PostMedia[], postId: string) => {
    if (media.length === 0) return null;

    return (
      <View style={styles.mediaContainer as ViewStyle}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentMediaIndex(index);
          }}
        >
          {media.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.mediaItem as ViewStyle}
              onPress={() => setSelectedMedia(item)}
              onLongPress={() => handleLongPress(postId)}
            >
              <Image
                source={{ uri: item.url }}
                style={[
                  styles.mediaImage,
                  { aspectRatio: item.aspectRatio || 1 }
                ] as ImageStyle}
                resizeMode="cover"
              />
              {item.type === 'video' && (
                <View style={styles.videoOverlay as ViewStyle}>
                  <Ionicons name="play-circle" size={50} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {media.length > 1 && (
          <View style={styles.mediaIndicators as ViewStyle}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator as ViewStyle,
                  index === currentMediaIndex && (styles.activeIndicator as ViewStyle)
                ]}
              />
            ))}
          </View>
        )}

        {/* Double Tap Heart Animation */}
        {likeAnimations[postId] && (
          <Animated.View
            style={[
                styles.likeAnimation,
                {
                  opacity: likeAnimations[postId],
                  transform: [{
                    scale: likeAnimations[postId].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                } as any
              ]}
          >
            <Ionicons name="heart" size={80} color="white" />
          </Animated.View>
        )}
      </View>
    );
  };

  const renderPost = (post: Post) => {
    const topReaction = post.reactions.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    );

    return (
      <View key={post.id} style={styles.postContainer as ViewStyle}>
        {/* Post Header */}
        <View style={styles.postHeader as ViewStyle}>
          <TouchableOpacity
            style={styles.userInfo as ViewStyle}
            onPress={() => onUserPress?.(post.user.id)}
          >
            <Image source={{ uri: post.user.avatar }} style={styles.userAvatar as ImageStyle} />
            <View style={styles.userDetails as ViewStyle}>
              <View style={styles.userNameRow as ViewStyle}>
                <Text style={styles.userName as TextStyle}>
                  {post.user.name}
                  {post.user.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                  )}
                </Text>
                {post.isSponsored && (
                  <View style={styles.sponsoredBadge as ViewStyle}>
                    <Text style={styles.sponsoredText as TextStyle}>Patrocinado</Text>
                  </View>
                )}
              </View>
              <View style={styles.postMeta as ViewStyle}>
                <Text style={styles.username as TextStyle}>@{post.user.username}</Text>
                <Text style={styles.timestamp as TextStyle}>
                  • {new Date(post.timestamp).toLocaleDateString()}
                </Text>
                {post.location && (
                  <Text style={styles.location as TextStyle}>• {post.location}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions as ViewStyle}>
            {!post.user.isFollowing && post.user.id !== currentUserId && (
              <TouchableOpacity
                style={styles.followButton as ViewStyle}
                onPress={() => onFollow?.(post.user.id)}
              >
                <Text style={styles.followButtonText as TextStyle}>Seguir</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.moreButton as ViewStyle}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Content */}
        {post.content && (
          <View style={styles.contentContainer as ViewStyle}>
            <Text style={styles.postContent as TextStyle}>
              {post.content}
              {post.hashtags?.map((hashtag, index) => (
                <Text key={index} style={styles.hashtag as TextStyle}> #{hashtag}</Text>
              ))}
            </Text>
          </View>
        )}

        {/* Media */}
        {renderMediaCarousel(post.media, post.id)}

        {/* Reactions Summary */}
        {post.totalReactions > 0 && (
          <View style={styles.reactionsSummary as ViewStyle}>
            <View style={styles.reactionsLeft as ViewStyle}>
              {post.reactions.slice(0, 3).map((reaction) => (
                <Text key={reaction.type} style={styles.reactionEmoji as TextStyle}>
                  {reaction.emoji}
                </Text>
              ))}
              <Text style={styles.reactionsCount as TextStyle}>
                {post.totalReactions.toLocaleString()}
              </Text>
            </View>
            <View style={styles.reactionsRight as ViewStyle}>
              <Text style={styles.commentsCount as TextStyle}>
                {post.comments} comentarios
              </Text>
              <Text style={styles.sharesCount as TextStyle}>
                {post.shares} compartidos
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons as ViewStyle}>
            <TouchableOpacity
              style={styles.actionButton as ViewStyle}
            onPress={() => onLike?.(post.id)}
            onLongPress={() => handleLongPress(post.id)}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={post.isLiked ? "#E91E63" : "#666"}
            />
            <Text style={[styles.actionText as TextStyle, post.isLiked && styles.likedText as TextStyle]}>
              Me gusta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton as ViewStyle}
            onPress={() => onComment?.(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.actionText as TextStyle}>Comentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton as ViewStyle}
            onPress={() => handleShare(post)}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#666" />
            <Text style={styles.actionText as TextStyle}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton as ViewStyle}
            onPress={() => onSave?.(post.id)}
          >
            <Ionicons
              name={post.isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={post.isSaved ? "#FF6B35" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Reactions Picker */}
        {showReactions === post.id && (
          <Animated.View
            style={[
              styles.reactionsContainer as any,
              {
                opacity: reactionAnimation,
                transform: [{
                  scale: reactionAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <BlurView intensity={20} style={styles.reactionsBlur as ViewStyle}>
              <View style={styles.reactionsList as ViewStyle}>
                {REACTIONS.map((reaction) => (
                  <TouchableOpacity
                    key={reaction.type}
                    style={styles.reactionItem as ViewStyle}
                    onPress={() => handleReaction(post.id, reaction.type)}
                  >
                    <Text style={styles.reactionItemEmoji as TextStyle}>{reaction.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container as ViewStyle}>
      <FlatList
        {...flatListProps}
        ref={flatListRef}
        style={styles.container as ViewStyle}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          if (showReactions) {
            setShowReactions(null);
            Animated.spring(reactionAnimation, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }}
      />

      {/* Media Viewer Modal */}
      <Modal
        visible={!!selectedMedia}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedMedia(null)}
      >
        {selectedMedia && (
          <View style={styles.mediaViewer as ViewStyle}>
            <TouchableOpacity
              style={styles.closeButton as ViewStyle}
              onPress={() => setSelectedMedia(null)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedMedia.url }}
              style={styles.fullscreenMedia as ImageStyle}
            />
          </View>
        )}
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1E21',
  },
  sponsoredBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sponsoredText: {
    fontSize: 10,
    color: '#1877F2',
    fontWeight: '600',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  username: {
    fontSize: 14,
    color: '#65676B',
  },
  timestamp: {
    fontSize: 14,
    color: '#65676B',
  },
  location: {
    fontSize: 14,
    color: '#1877F2',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1C1E21',
  },
  hashtag: {
    color: '#1877F2',
    fontWeight: '600',
  },
  mediaContainer: {
    position: 'relative',
  },
  mediaItem: {
    width,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  mediaIndicators: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  likeAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  reactionsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EA',
  },
  reactionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionsCount: {
    fontSize: 14,
    color: '#65676B',
    marginLeft: 4,
  },
  reactionsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  commentsCount: {
    fontSize: 14,
    color: '#65676B',
  },
  sharesCount: {
    fontSize: 14,
    color: '#65676B',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#65676B',
    fontWeight: '600',
  },
  likedText: {
    color: '#E91E63',
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  reactionsBlur: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  reactionsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  reactionItem: {
    padding: 8,
  },
  reactionItemEmoji: {
    fontSize: 30,
  },
  mediaViewer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  } as ViewStyle,
  fullscreenMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  } as ImageStyle,
});

export default ModernFeedComponent;