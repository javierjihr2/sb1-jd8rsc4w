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
  Animated
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  media: {
    type: 'image' | 'video';
    url: string;
    duration?: number;
  }[];
  timestamp: number;
  isViewed?: boolean;
}

interface StoriesComponentProps {
  stories: Story[];
  currentUserId: string;
  onAddStory?: () => void;
}

export const StoriesComponent: React.FC<StoriesComponentProps> = ({
  stories,
  currentUserId,
  onAddStory
}) => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(new Animated.Value(0));
  const progressRef = useRef<Animated.Value[]>([]);

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setCurrentMediaIndex(0);
    startProgress();
  };

  const closeStory = () => {
    setSelectedStory(null);
    setCurrentMediaIndex(0);
    progress.setValue(0);
  };

  const startProgress = () => {
    const duration = selectedStory?.media[currentMediaIndex]?.duration || 5000;
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextMedia();
      }
    });
  };

  const nextMedia = () => {
    if (!selectedStory) return;
    
    if (currentMediaIndex < selectedStory.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
      progress.setValue(0);
      startProgress();
    } else {
      closeStory();
    }
  };

  const previousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
      progress.setValue(0);
      startProgress();
    }
  };

  const renderStoryItem = (story: Story, index: number) => {
    const isCurrentUser = story.user.id === currentUserId;
    const hasUnviewedStories = !story.isViewed;

    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyItem}
        onPress={() => openStory(story)}
      >
        <LinearGradient
          colors={hasUnviewedStories ? ['#FF6B35', '#FFD700', '#FF1493'] : ['#E0E0E0', '#E0E0E0']}
          style={styles.storyBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.storyImageContainer}>
            <Image source={{ uri: story.user.avatar }} style={styles.storyImage} />
            {story.user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
              </View>
            )}
            {isCurrentUser && (
              <View style={styles.addStoryBadge}>
                <Ionicons name="add" size={16} color="white" />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {isCurrentUser ? 'Tu historia' : story.user.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddStory = () => (
    <TouchableOpacity style={styles.storyItem} onPress={onAddStory}>
      <View style={styles.addStoryContainer}>
        <LinearGradient
          colors={['#FF6B35', '#FFD700']}
          style={styles.addStoryGradient}
        >
          <Ionicons name="add" size={24} color="white" />
        </LinearGradient>
      </View>
      <Text style={styles.storyUsername}>Agregar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        {renderAddStory()}
        {stories.map((story, index) => renderStoryItem(story, index))}
      </ScrollView>

      {/* Story Viewer Modal */}
      <Modal
        visible={!!selectedStory}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeStory}
      >
        {selectedStory && (
          <View style={styles.storyViewer}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            
            {/* Progress Bars */}
            <View style={styles.progressContainer}>
              {selectedStory.media.map((_, index) => (
                <View key={index} style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: index === currentMediaIndex
                          ? progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          : index < currentMediaIndex ? '100%' : '0%'
                      }
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Story Header */}
            <View style={styles.storyHeader}>
              <View style={styles.storyUserInfo}>
                <Image
                  source={{ uri: selectedStory.user.avatar }}
                  style={styles.storyHeaderAvatar}
                />
                <View>
                  <Text style={styles.storyHeaderName}>
                    {selectedStory.user.name}
                    {selectedStory.user.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
                    )}
                  </Text>
                  <Text style={styles.storyHeaderTime}>
                    {new Date(selectedStory.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeStory}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Story Content */}
            <View style={styles.storyContent}>
              <Image
                source={{ uri: selectedStory.media[currentMediaIndex]?.url }}
                style={styles.storyMedia}
                resizeMode="contain"
              />
              
              {/* Touch Areas for Navigation */}
              <TouchableOpacity
                style={[styles.touchArea, styles.leftTouchArea]}
                onPress={previousMedia}
              />
              <TouchableOpacity
                style={[styles.touchArea, styles.rightTouchArea]}
                onPress={nextMedia}
              />
            </View>

            {/* Story Actions */}
            <View style={styles.storyActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  storiesContainer: {
    paddingHorizontal: 15,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    marginBottom: 5,
  },
  storyImageContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  addStoryContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyViewer: {
    flex: 1,
    backgroundColor: 'black',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 50,
    gap: 2,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  storyHeaderName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  storyHeaderTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMedia: {
    width: width,
    height: height * 0.7,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width / 2,
  },
  leftTouchArea: {
    left: 0,
  },
  rightTouchArea: {
    right: 0,
  },
  storyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 40,
    gap: 30,
  },
  actionButton: {
    padding: 10,
  },
});

export default StoriesComponent;