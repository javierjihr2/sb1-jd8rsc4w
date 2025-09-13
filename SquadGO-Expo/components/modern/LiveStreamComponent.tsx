import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface LiveComment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  message: string;
  timestamp: number;
  type: 'comment' | 'join' | 'gift' | 'like';
  giftValue?: number;
}

interface LiveGift {
  id: string;
  name: string;
  icon: string;
  value: number;
  animation?: string;
}

interface LiveStream {
  id: string;
  streamer: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
    followers: number;
  };
  title: string;
  category: string;
  viewers: number;
  likes: number;
  duration: number;
  isLive: boolean;
  thumbnail?: string;
}

interface LiveStreamComponentProps {
  stream: LiveStream;
  currentUserId: string;
  isStreaming?: boolean;
  onSendComment?: (message: string) => void;
  onSendGift?: (giftId: string) => void;
  onLike?: () => void;
  onFollow?: () => void;
  onShare?: () => void;
  onEndStream?: () => void;
}

const LIVE_GIFTS: LiveGift[] = [
  { id: '1', name: 'Corazón', icon: '❤️', value: 1 },
  { id: '2', name: 'Rosa', icon: '🌹', value: 5 },
  { id: '3', name: 'Corona', icon: '👑', value: 10 },
  { id: '4', name: 'Diamante', icon: '💎', value: 50 },
  { id: '5', name: 'Cohete', icon: '🚀', value: 100 },
  { id: '6', name: 'León', icon: '🦁', value: 500 },
];

export const LiveStreamComponent: React.FC<LiveStreamComponentProps> = ({
  stream,
  currentUserId,
  isStreaming = false,
  onSendComment,
  onSendGift,
  onLike,
  onFollow,
  onShare,
  onEndStream
}) => {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [likeAnimation] = useState(new Animated.Value(0));
  const [heartAnimations] = useState(Array.from({ length: 10 }, () => new Animated.Value(0)));
  const commentsRef = useRef<FlatList>(null);
  const heartIndex = useRef(0);

  useEffect(() => {
    // Simulate live comments
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addMockComment();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addMockComment = () => {
    const mockComments = [
      'Increíble gameplay! 🔥',
      'Eres el mejor!',
      'Qué estrategia tan buena',
      'Sigue así! 💪',
      'Epic moment!',
    ];
    
    const newComment: LiveComment = {
      id: Date.now().toString(),
      user: {
        id: 'mock_user',
        name: `Usuario${Math.floor(Math.random() * 1000)}`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      },
      message: mockComments[Math.floor(Math.random() * mockComments.length)],
      timestamp: Date.now(),
      type: 'comment',
    };

    setComments(prev => [...prev, newComment].slice(-50)); // Keep only last 50 comments
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      const newComment: LiveComment = {
        id: Date.now().toString(),
        user: {
          id: currentUserId,
          name: 'Tú',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        message: commentText,
        timestamp: Date.now(),
        type: 'comment',
      };

      setComments(prev => [...prev, newComment]);
      setCommentText('');
      onSendComment?.(commentText);
    }
  };

  const handleLike = () => {
    // Animate main like
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

    // Animate floating hearts
    const currentHeart = heartIndex.current % heartAnimations.length;
    heartAnimations[currentHeart].setValue(0);
    
    Animated.timing(heartAnimations[currentHeart], {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      heartAnimations[currentHeart].setValue(0);
    });
    
    heartIndex.current++;
    onLike?.();
  };

  const handleSendGift = (gift: LiveGift) => {
    const giftComment: LiveComment = {
      id: Date.now().toString(),
      user: {
        id: currentUserId,
        name: 'Tú',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
      message: `Envió ${gift.name} ${gift.icon}`,
      timestamp: Date.now(),
      type: 'gift',
      giftValue: gift.value,
    };

    setComments(prev => [...prev, giftComment]);
    setShowGifts(false);
    onSendGift?.(gift.id);
  };

  const renderComment = ({ item }: { item: LiveComment }) => {
    const isGift = item.type === 'gift';
    const isJoin = item.type === 'join';

    return (
      <View style={[styles.commentItem, isGift && styles.giftComment]}>
        <Image source={{ uri: item.user.avatar }} style={styles.commentAvatar} />
        <View style={styles.commentContent}>
          <Text style={styles.commentUser}>
            {item.user.name}
            {item.user.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color="#1DA1F2" />
            )}
          </Text>
          <Text style={[styles.commentText, isGift && styles.giftText]}>
            {item.message}
          </Text>
        </View>
        {isGift && (
          <View style={styles.giftValue}>
            <Text style={styles.giftValueText}>{item.giftValue}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderGift = ({ item }: { item: LiveGift }) => (
    <TouchableOpacity
      style={styles.giftItem}
      onPress={() => handleSendGift(item)}
    >
      <Text style={styles.giftIcon}>{item.icon}</Text>
      <Text style={styles.giftName}>{item.name}</Text>
      <Text style={styles.giftPrice}>{item.value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Video Stream Area */}
      <View style={styles.streamContainer}>
        {stream.thumbnail && (
          <Image source={{ uri: stream.thumbnail }} style={styles.streamVideo} />
        )}
        
        {/* Floating Hearts Animation */}
        {heartAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.floatingHeart,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -200],
                    })
                  },
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (Math.random() - 0.5) * 100],
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="heart" size={30} color="#FF1493" />
          </Animated.View>
        ))}
      </View>

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
          <Text style={styles.viewerCount}>{stream.viewers.toLocaleString()}</Text>
        </View>
        
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topButton} onPress={onShare}>
            <Ionicons name="paper-plane-outline" size={20} color="white" />
          </TouchableOpacity>
          {isStreaming ? (
            <TouchableOpacity style={styles.endStreamButton} onPress={onEndStream}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.topButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Streamer Info */}
      <View style={styles.streamerInfo}>
        <Image source={{ uri: stream.streamer.avatar }} style={styles.streamerAvatar} />
        <View style={styles.streamerDetails}>
          <Text style={styles.streamerName}>
            {stream.streamer.name}
            {stream.streamer.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
            )}
          </Text>
          <Text style={styles.streamTitle}>{stream.title}</Text>
        </View>
        {!isStreaming && (
          <TouchableOpacity style={styles.followButton} onPress={onFollow}>
            <Text style={styles.followButtonText}>Seguir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <FlatList
          ref={commentsRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => commentsRef.current?.scrollToEnd()}
        />
      </View>

      {/* Bottom Actions */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSection}
      >
        <View style={styles.bottomActions}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Agregar comentario..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleSendComment}
              returnKeyType="send"
            />
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowGifts(true)}>
            <Ionicons name="gift-outline" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Animated.View
              style={{
                transform: [{
                  scale: likeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3],
                  })
                }]
              }}
            >
              <Ionicons name="heart" size={24} color="#FF1493" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gifts Modal */}
      {showGifts && (
        <View style={styles.giftsModal}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.giftsContainer}>
            <View style={styles.giftsHeader}>
              <Text style={styles.giftsTitle}>Enviar Regalo</Text>
              <TouchableOpacity onPress={() => setShowGifts(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LIVE_GIFTS}
              renderItem={renderGift}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.giftsList}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  streamContainer: {
    flex: 1,
    position: 'relative',
  },
  streamVideo: {
    width: '100%',
    height: '100%',
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 100,
    right: 50,
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  topButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  endStreamButton: {
    backgroundColor: '#FF0000',
    padding: 8,
    borderRadius: 20,
  },
  streamerInfo: {
    position: 'absolute',
    top: 100,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streamerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  streamTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  followButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  commentsSection: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 80,
    height: 200,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  giftComment: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    color: 'white',
    fontSize: 12,
  },
  giftText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  giftValue: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  giftValueText: {
    color: 'black',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  commentInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  commentInput: {
    color: 'white',
    fontSize: 14,
    paddingVertical: 10,
  },
  actionButton: {
    padding: 8,
  },
  giftsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  giftsContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '100%',
  },
  giftsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  giftsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  giftsList: {
    gap: 15,
  },
  giftItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  giftIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  giftName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  giftPrice: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default LiveStreamComponent;