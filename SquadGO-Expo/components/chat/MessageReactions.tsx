import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MessageReactionsProps {
  messageId: string;
  chatRoomId: string;
  currentUserId: string;
  reactions: { [emoji: string]: string[] };
  onReactionUpdate: (reactions: { [emoji: string]: string[] }) => void;
}

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  position: { x: number; y: number };
}

const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥',
  '💯', '🎉', '😍', '🤔', '👌', '💪', '🙌', '✨'
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelectEmoji,
  position
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: Math.max(16, Math.min(position.x - 140, screenWidth - 296)),
            top: Math.max(50, position.y - 60),
            backgroundColor: '#1f2937',
            borderRadius: 20,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            width: 280,
          }}
        >
          <FlatList
            data={COMMON_EMOJIS}
            numColumns={8}
            keyExtractor={(item) => item}
            renderItem={({ item: emoji }) => (
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: 2,
                  borderRadius: 16,
                }}
                onPress={() => handleEmojiSelect(emoji)}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  chatRoomId,
  currentUserId,
  reactions,
  onReactionUpdate
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [realtimeReactions, setRealtimeReactions] = useState(reactions);

  useEffect(() => {
    // Escuchar cambios en tiempo real de las reacciones
    const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageId);
    const unsubscribe = onSnapshot(messageRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const updatedReactions = data.reactions || {};
        setRealtimeReactions(updatedReactions);
        onReactionUpdate(updatedReactions);
      }
    });

    return () => unsubscribe();
  }, [messageId, chatRoomId, onReactionUpdate]);

  const addReaction = async (emoji: string) => {
    try {
      const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageId);
      const currentEmojiReactions = realtimeReactions[emoji] || [];
      
      const updatedReactions = currentEmojiReactions.includes(currentUserId)
        ? currentEmojiReactions.filter(id => id !== currentUserId)
        : [...currentEmojiReactions, currentUserId];
      
      const newReactions = {
        ...realtimeReactions,
        [emoji]: updatedReactions.length > 0 ? updatedReactions : undefined
      };
      
      // Limpiar reacciones vacías
      Object.keys(newReactions).forEach(key => {
        if (!newReactions[key] || newReactions[key].length === 0) {
          delete newReactions[key];
        }
      });
      
      await updateDoc(messageRef, {
        reactions: newReactions
      });
    } catch (error) {
      console.error('Error añadiendo reacción:', error);
    }
  };

  const handleReactionPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setPickerPosition({ x: pageX, y: pageY });
    setShowPicker(true);
  };

  const renderReactionSummary = () => {
    const reactionEntries = Object.entries(realtimeReactions).filter(
      ([_, userIds]) => userIds && userIds.length > 0
    );

    if (reactionEntries.length === 0) return null;

    return (
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        gap: 4
      }}>
        {reactionEntries.map(([emoji, userIds]) => {
          const hasUserReacted = userIds.includes(currentUserId);
          return (
            <TouchableOpacity
              key={emoji}
              onPress={() => addReaction(emoji)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: hasUserReacted ? '#3b82f6' : '#374151',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderWidth: hasUserReacted ? 1 : 0,
                borderColor: hasUserReacted ? '#60a5fa' : 'transparent'
              }}
            >
              <Text style={{ fontSize: 14 }}>{emoji}</Text>
              <Text style={{
                color: hasUserReacted ? 'white' : '#9ca3af',
                fontSize: 12,
                marginLeft: 4,
                fontWeight: hasUserReacted ? '600' : '400'
              }}>
                {userIds.length}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      {renderReactionSummary()}
      
      <TouchableOpacity
        onPress={handleReactionPress}
        style={{
          position: 'absolute',
          right: -8,
          top: -8,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#374151',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.8
        }}
      >
        <Ionicons name="add" size={16} color="#9ca3af" />
      </TouchableOpacity>

      <ReactionPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectEmoji={addReaction}
        position={pickerPosition}
      />
    </View>
  );
};

export default MessageReactions;