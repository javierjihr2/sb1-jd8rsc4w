import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useOptimizedFlatList } from '../../hooks/useOptimizedFlatList';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useInteractionManager, useOptimizedNetworkOperation, InteractionUtils } from '../../hooks/useInteractionManager';

const { width, height } = Dimensions.get('window');

interface Reel {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
    isFollowing?: boolean;
  };
  video: {
    url: string;
    thumbnail: string;
    duration: number;
  };
  audio: {
    name: string;
    artist: string;
    cover?: string;
  };
  description: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  timestamp: number;
}

interface ReelsComponentProps {
  reels: Reel[];
  currentUserId: string;
  onLike?: (reelId: string) => void;
  onComment?: (reelId: string) => void;
  onShare?: (reelId: string) => void;
  onFollow?: (userId: string) => void;
  onBookmark?: (reelId: string) => void;
}

export const ReelsComponent: React.FC<ReelsComponentProps> = memo(({
  reels,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onFollow,
  onBookmark
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<{ [key: string]: Video }>({});
  const { runAfterInteractions } = useInteractionManager();
  const networkOperation = useOptimizedNetworkOperation<Reel[]>();
  
  // Configuración optimizada para Reels (video vertical)
  const { flatListProps, flatListRef } = useOptimizedFlatList({
    data: reels,
    renderItem: ({ item, index }) => renderReelItem({ item, index }),
    keyExtractor: (item) => item.id,
    itemHeight: height,
    windowSize: 3, // Solo 3 videos en memoria para mejor rendimiento
    maxToRenderPerBatch: 1, // Solo renderizar 1 video a la vez
    initialNumToRender: 1,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 200,
    getItemLayout: (data, index) => ({
      length: height,
      offset: height * index,
      index,
    }),
  });
  const likeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pause all videos except current
    Object.keys(videoRefs.current).forEach((key, index) => {
      if (index === currentIndex) {
        videoRefs.current[key]?.playAsync();
      } else {
        videoRefs.current[key]?.pauseAsync();
      }
    });
  }, [currentIndex]);

  const handleLike = useCallback((reel: Reel) => {
    runAfterInteractions(() => {
      // Animate heart
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      onLike?.(reel.id);
    });
  }, [onLike, runAfterInteractions, likeAnimation]);

  const handleDoubleTap = (reel: Reel) => {
    if (!reel.isLiked) {
      handleLike(reel);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    runAfterInteractions(() => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        
        // Pausar todos los videos excepto el actual usando InteractionUtils
        InteractionUtils.processInChunks(
          Object.keys(videoRefs.current),
          async (key) => {
            const video = videoRefs.current[key];
            if (key !== reels[newIndex]?.id) {
              await video?.pauseAsync();
            } else {
              await video?.playAsync();
            }
          },
          3, // procesar 3 videos a la vez
          10 // delay de 10ms entre chunks
        );
      }
    });
  }).current;

  const renderReelItem = ({ item: reel, index }: { item: Reel; index: number }) => {
    return (
      <View style={styles.reelContainer}>
        {/* Video Player */}
        <TouchableOpacity
          style={styles.videoContainer}
          activeOpacity={1}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Video
            ref={(ref) => {
              if (ref) videoRefs.current[reel.id] = ref;
            }}
            source={{ uri: reel.video.url }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={index === currentIndex && isPlaying}
            isLooping
            isMuted={false}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <Ionicons name="play" size={60} color="white" />
            </View>
          )}

          {/* Like Animation */}
          <Animated.View
            style={[
              styles.likeAnimationContainer,
              {
                opacity: likeAnimation,
                transform: [{
                  scale: likeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  })
                }]
              }
            ]}
          >
            <Ionicons name="heart" size={80} color="#FF1493" />
          </Animated.View>
        </TouchableOpacity>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          {/* User Avatar */}
          <TouchableOpacity style={styles.avatarContainer}>
            <Image source={{ uri: reel.user.avatar }} style={styles.avatar} />
            {!reel.user.isFollowing && reel.user.id !== currentUserId && (
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => onFollow?.(reel.user.id)}
              >
                <Ionicons name="add" size={16} color="white" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(reel)}
          >
            <Ionicons
              name={reel.isLiked ? "heart" : "heart-outline"}
              size={28}
              color={reel.isLiked ? "#FF1493" : "white"}
            />
            <Text style={styles.actionText}>{reel.likes}</Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment?.(reel.id)}
          >
            <Ionicons name="chatbubble-outline" size={28} color="white" />
            <Text style={styles.actionText}>{reel.comments}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare?.(reel.id)}
          >
            <Ionicons name="paper-plane-outline" size={28} color="white" />
            <Text style={styles.actionText}>{reel.shares}</Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onBookmark?.(reel.id)}
          >
            <Ionicons
              name={reel.isBookmarked ? "bookmark" : "bookmark-outline"}
              size={28}
              color={reel.isBookmarked ? "#FFD700" : "white"}
            />
          </TouchableOpacity>

          {/* Audio/Music */}
          <TouchableOpacity style={styles.musicButton}>
            <View style={styles.musicIcon}>
              {reel.audio.cover ? (
                <Image source={{ uri: reel.audio.cover }} style={styles.musicCover} />
              ) : (
                <Ionicons name="musical-notes" size={20} color="white" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Content */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomContent}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.username}>
                @{reel.user.username}
                {reel.user.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                )}
              </Text>
              <Text style={styles.description}>{reel.description}</Text>
              
              {/* Hashtags */}
              <View style={styles.hashtagsContainer}>
                {reel.hashtags.map((hashtag, index) => (
                  <TouchableOpacity key={index} style={styles.hashtag}>
                    <Text style={styles.hashtagText}>#{hashtag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Audio Info */}
            <View style={styles.audioInfo}>
              <Ionicons name="musical-notes" size={16} color="white" />
              <Text style={styles.audioText} numberOfLines={1}>
                {reel.audio.name} • {reel.audio.artist}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <FlatList
        {...flatListProps}
        ref={flatListRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  reelContainer: {
    width,
    height,
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width,
    height,
  },
  playOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    width: 100,
    height: 100,
  },
  likeAnimationContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  followButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  musicButton: {
    marginTop: 10,
  },
  musicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  musicCover: {
    width: '100%',
    height: '100%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
  },
  bottomContent: {
    padding: 15,
    paddingBottom: 30,
  },
  userInfo: {
    marginBottom: 10,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hashtagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  audioText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});

export default ReelsComponent;