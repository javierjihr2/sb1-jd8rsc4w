import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContextSimple';
import { Post } from '../lib/types';
import PollComponent from './PollComponent';
import { normalizeUrl, formatUrlForDisplay, getLinkIcon } from '../lib/linkPreview';

interface PostCardProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

const { width } = Dimensions.get('window');

export default function PostCard({ post, onPostUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes.includes(user?.uid || ''));
  const [saved, setSaved] = useState(post.saves.includes(user?.uid || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [saveCount, setSaveCount] = useState(post.saves.length);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (liked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert('Error', 'No se pudo actualizar el like');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (saved) {
        await updateDoc(postRef, {
          saves: arrayRemove(user.uid)
        });
        setSaved(false);
        setSaveCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, {
          saves: arrayUnion(user.uid)
        });
        setSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating save:', error);
      Alert.alert('Error', 'No se pudo guardar la publicación');
    }
  };

  const handleLinkPress = async (url: string) => {
    try {
      const normalizedUrl = normalizeUrl(url);
      const supported = await Linking.canOpenURL(normalizedUrl);
      if (supported) {
        await Linking.openURL(normalizedUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir este enlace');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'No se pudo abrir el enlace');
    }
  };

  const handlePollUpdate = (updatedPoll: any) => {
    const updatedPost = {
      ...post,
      poll: updatedPoll
    };
    onPostUpdate?.(updatedPost);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: post.user?.avatarUrl || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{post.user?.displayName || 'Usuario'}</Text>
            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Poll */}
      {post.poll && (
        <PollComponent
          poll={post.poll}
          postId={post.id}
          onPollUpdate={handlePollUpdate}
        />
      )}

      {/* Link Preview */}
      {post.linkPreview && (
        <TouchableOpacity
          style={styles.linkPreview}
          onPress={() => handleLinkPress(post.linkPreview!.url)}
          activeOpacity={0.8}
        >
          <View style={styles.linkContent}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle} numberOfLines={2}>
                {post.linkPreview.title}
              </Text>
              <Text style={styles.linkDescription} numberOfLines={2}>
                {post.linkPreview.description}
              </Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {formatUrlForDisplay(post.linkPreview.url)}
              </Text>
            </View>
            {post.linkPreview.imageUrl && (
              <Image
                source={{ uri: post.linkPreview.imageUrl }}
                style={styles.linkImage}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.linkIcon}>
            <Ionicons name={getLinkIcon(post.linkPreview.url) as any} size={16} color="#3b82f6" />
          </View>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#ef4444" : "#9ca3af"}
            />
            <Text style={[styles.actionText, liked && styles.likedText]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={22} color="#9ca3af" />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={saved ? "#3b82f6" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#374151',
  },
  linkPreview: {
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
    position: 'relative',
  },
  linkContent: {
    flexDirection: 'row',
    padding: 12,
  },
  linkInfo: {
    flex: 1,
    paddingRight: 12,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 11,
    color: '#3b82f6',
  },
  linkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  linkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  likedText: {
    color: '#ef4444',
  },
});