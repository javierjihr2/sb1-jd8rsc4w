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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: number;
  isVerified?: boolean;
  isPremium?: boolean;
}

interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  url: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  name?: string;
  mimeType?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'reply';
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyTo?: Message;
  isEdited?: boolean;
  isDeleted?: boolean;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read';
  isForwarded?: boolean;
  forwardedFrom?: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: number;
}

interface AdvancedMessagingProps {
  currentUser: User;
  chats: Chat[];
  selectedChatId?: string;
  messages: Message[];
  onSendMessage?: (chatId: string, content: string, type: string, attachments?: MessageAttachment[]) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onForwardMessage?: (messageId: string, chatIds: string[]) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onStartCall?: (chatId: string, isVideo: boolean) => void;
  onOpenProfile?: (userId: string) => void;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯', '🎉'];

export const AdvancedMessaging: React.FC<AdvancedMessagingProps> = ({
  currentUser,
  chats,
  selectedChatId,
  messages,
  onSendMessage,
  onReactToMessage,
  onReplyToMessage,
  onForwardMessage,
  onDeleteMessage,
  onEditMessage,
  onStartCall,
  onOpenProfile
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChatId) return;

    if (editingMessage) {
      onEditMessage?.(editingMessage.id, messageText);
      setEditingMessage(null);
    } else {
      onSendMessage?.(selectedChatId, messageText, 'text');
      if (replyingTo) {
        setReplyingTo(null);
      }
    }
    setMessageText('');
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onReactToMessage?.(messageId, emoji);
    setShowEmojiPicker(false);
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === currentUser.id;
    const sender = selectedChat?.participants.find(p => p.id === message.senderId);

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwn && styles.ownMessageContainer
        ]}
      >
        {!isOwn && (
          <Image
            source={{ uri: sender?.avatar || 'https://via.placeholder.com/30' }}
            style={styles.messageAvatar}
          />
        )}
        {isOwn && <View style={styles.avatarSpacer} />}
        
        <TouchableOpacity
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
            selectedMessage?.id === message.id && styles.selectedMessage
          ]}
          onLongPress={() => setSelectedMessage(message)}
        >
          {message.replyTo && (
            <View style={styles.replyContainer}>
              <View style={styles.replyLine} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor}>
                  {selectedChat?.participants.find(p => p.id === message.replyTo?.senderId)?.name || 'Usuario'}
                </Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {message.replyTo.content}
                </Text>
              </View>
            </View>
          )}

          {message.isForwarded && (
            <View style={styles.forwardedContainer}>
              <Ionicons name="arrow-forward" size={12} color="#666" />
              <Text style={styles.forwardedText}>Reenviado</Text>
            </View>
          )}

          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwn ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isOwn && (
              <View style={styles.deliveryStatus}>
                <Ionicons
                  name={message.deliveryStatus === 'read' ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={message.deliveryStatus === 'read' ? '#4CAF50' : 'rgba(255,255,255,0.8)'}
                />
              </View>
            )}
          </View>

          {message.reactions && message.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {message.reactions.map((reaction, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reactionBubble}
                  onPress={() => handleReaction(message.id, reaction.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!selectedChatId) {
    return (
      <View style={styles.emptyChatContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#DDD" />
        <Text style={styles.emptyChatText}>Selecciona un chat para comenzar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.chatInfo}
          onPress={() => selectedChat && onOpenProfile?.(selectedChat.participants[0]?.id)}
        >
          <View>
            <Image
              source={{ uri: selectedChat?.avatar || 'https://via.placeholder.com/40' }}
              style={styles.chatAvatar}
            />
            {selectedChat?.participants[0]?.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          
          <View style={styles.chatDetails}>
            <Text style={styles.chatName}>
              {selectedChat?.name || selectedChat?.participants[0]?.name || 'Chat'}
            </Text>
            <Text style={styles.chatStatus}>
              {selectedChat?.participants[0]?.isOnline ? 'En línea' : 'Desconectado'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.chatActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => selectedChatId && onStartCall?.(selectedChatId, false)}
          >
            <Ionicons name="call" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => selectedChatId && onStartCall?.(selectedChatId, true)}
          >
            <Ionicons name="videocam" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar mensajes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewLine} />
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewAuthor}>
                Respondiendo a {selectedChat?.participants.find(p => p.id === replyingTo.senderId)?.name || 'Usuario'}
              </Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {editingMessage && (
          <View style={styles.editPreview}>
            <Ionicons name="create" size={16} color="#FF6B35" />
            <Text style={styles.editPreviewText}>Editando mensaje</Text>
            <TouchableOpacity onPress={() => setEditingMessage(null)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Escribe un mensaje..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => setShowEmojiPicker(true)}
            >
              <Ionicons name="happy" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.emojiPicker}>
            <Text style={styles.emojiPickerTitle}>Selecciona una reacción</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_REACTIONS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (selectedMessage) {
                      handleReaction(selectedMessage.id, emoji);
                    }
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyChatText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
    right: -2,
    bottom: 0,
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chatActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 38,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  ownMessageBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  selectedMessage: {
    backgroundColor: '#E3F2FD',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyLine: {
    width: 3,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
  },
  forwardedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTime: {
    color: '#999',
  },
  deliveryStatus: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  replyPreviewLine: {
    width: 3,
    height: 30,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF8F5',
  },
  editPreviewText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 80,
  },
  emojiButton: {
    marginLeft: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  emojiPicker: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
    margin: 8,
  },
});

export default AdvancedMessaging;