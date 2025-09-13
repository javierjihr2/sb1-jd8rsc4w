import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  Unsubscribe,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Chat, Message } from './types';
import { validateChatMessage } from './validation';
import { addRetryOperation } from './retry-system';
import { sendMessageNotification } from './push-notifications';

// Real-time chat listeners management
const activeListeners = new Map<string, Unsubscribe>();
const chatCallbacks = new Map<string, (messages: Message[]) => void>();
const userChatsCallbacks = new Map<string, (chats: Chat[]) => void>();

// Real-time message listener for a specific chat
export const subscribeToMessages = (
  chatId: string, 
  callback: (messages: Message[]) => void
): Unsubscribe => {
  // Clean up existing listener if any
  const existingListener = activeListeners.get(`messages_${chatId}`);
  if (existingListener) {
    existingListener();
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      callback(messages);
    },
    (error) => {
      console.error('Error listening to messages:', error);
      // Fallback to empty array on error
      callback([]);
    }
  );

  activeListeners.set(`messages_${chatId}`, unsubscribe);
  chatCallbacks.set(chatId, callback);
  
  return unsubscribe;
};

// Real-time user chats listener
export const subscribeToUserChats = (
  userId: string, 
  callback: (chats: Chat[]) => void
): Unsubscribe => {
  // Clean up existing listener if any
  const existingListener = activeListeners.get(`chats_${userId}`);
  if (existingListener) {
    existingListener();
  }

  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef, 
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q,
    (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      callback(chats);
    },
    (error) => {
      console.error('Error listening to user chats:', error);
      // Fallback to empty array on error
      callback([]);
    }
  );

  activeListeners.set(`chats_${userId}`, unsubscribe);
  userChatsCallbacks.set(userId, callback);
  
  return unsubscribe;
};

// Send message with real-time updates
export const sendMessageRealtime = async (
  chatId: string, 
  senderId: string, 
  message: Omit<Message, 'timestamp'>
) => {
  try {
    // Validate message before sending
    const validationResult = validateChatMessage({
      ...message,
      sender: senderId,
      timestamp: new Date()
    });
    
    if (!validationResult.isValid) {
      console.error('Message validation failed:', validationResult.errors);
      throw new Error(`Invalid message: ${validationResult.errors.join(', ')}`);
    }

    const sanitizedData = validationResult.sanitizedData!;
    
    // Add message to chat subcollection
    const messageData = {
      ...sanitizedData,
      senderId,
      timestamp: serverTimestamp()
    };
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update chat with last message info
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: sanitizedData.content,
      lastMessageSender: senderId,
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Send push notification to other participants
    try {
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const otherParticipants = chatData.participants?.filter((p: string) => p !== senderId) || [];
        
        // Get sender's name (you might want to pass this as a parameter)
        const senderName = 'Usuario'; // Replace with actual sender name
        const messageContent = sanitizedData.content || sanitizedData.text || '';
        const messagePreview = messageContent.length > 50 
          ? messageContent.substring(0, 50) + '...' 
          : messageContent;
        
        // Send notification to each participant
        for (const participantId of otherParticipants) {
          await sendMessageNotification(participantId, senderName, messagePreview, chatId);
        }
      }
    } catch (notificationError) {
      console.error('Error sending push notification:', notificationError);
      // Don't fail the message send if notification fails
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Add to retry queue for automatic retry
    const retryId = addRetryOperation.messageSend(senderId, {
      chatId,
      message
    }, 'high');
    
    return { success: false, error, retryId };
  }
};

// Create chat with real-time setup
export const createChatRealtime = async (
  participants: string[], 
  chatName?: string
) => {
  try {
    const chatData = {
      participants,
      chatName: chatName || `Chat ${participants.join(', ')}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      lastMessageSender: '',
      lastMessageTimestamp: serverTimestamp(),
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return { success: true, id: docRef.id, chat: { id: docRef.id, ...chatData } };
  } catch (error) {
    console.error('Error creating chat:', error);
    
    // Add to retry queue for automatic retry
    const retryId = addRetryOperation.messageSend(participants[0] || 'unknown', {
      operation: 'createChat',
      participants,
      chatName
    }, 'medium');
    
    return { success: false, error, retryId };
  }
};

// Typing indicator system
const typingIndicators = new Map<string, Set<string>>();
const typingTimeouts = new Map<string, number>();

export const setTypingIndicator = async (
  chatId: string, 
  userId: string, 
  isTyping: boolean
) => {
  try {
    if (!typingIndicators.has(chatId)) {
      typingIndicators.set(chatId, new Set());
    }
    
    const chatTypers = typingIndicators.get(chatId)!;
    
    if (isTyping) {
      chatTypers.add(userId);
      
      // Clear existing timeout
      const existingTimeout = typingTimeouts.get(`${chatId}_${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set auto-clear timeout (5 seconds)
      const timeout = setTimeout(() => {
        chatTypers.delete(userId);
        typingTimeouts.delete(`${chatId}_${userId}`);
        notifyTypingChange(chatId);
      }, 5000) as unknown as number;
      
      typingTimeouts.set(`${chatId}_${userId}`, timeout);
    } else {
      chatTypers.delete(userId);
      const timeout = typingTimeouts.get(`${chatId}_${userId}`);
      if (timeout) {
        clearTimeout(timeout);
        typingTimeouts.delete(`${chatId}_${userId}`);
      }
    }
    
    notifyTypingChange(chatId);
    return { success: true };
  } catch (error) {
    console.error('Error setting typing indicator:', error);
    return { success: false, error };
  }
};

// Typing indicator callbacks
const typingCallbacks = new Map<string, (typingUsers: string[]) => void>();

export const subscribeToTypingIndicators = (
  chatId: string,
  callback: (typingUsers: string[]) => void
): () => void => {
  typingCallbacks.set(chatId, callback);
  
  // Return unsubscribe function
  return () => {
    typingCallbacks.delete(chatId);
  };
};

const notifyTypingChange = (chatId: string) => {
  const callback = typingCallbacks.get(chatId);
  if (callback) {
    const typingUsers = Array.from(typingIndicators.get(chatId) || []);
    callback(typingUsers);
  }
};

// Cleanup function to remove all listeners
export const cleanupChatListeners = () => {
  // Unsubscribe from all active listeners
  activeListeners.forEach((unsubscribe) => {
    unsubscribe();
  });
  
  // Clear all maps
  activeListeners.clear();
  chatCallbacks.clear();
  userChatsCallbacks.clear();
  typingCallbacks.clear();
  
  // Clear typing timeouts
  typingTimeouts.forEach((timeout) => {
    clearTimeout(timeout);
  });
  typingTimeouts.clear();
  typingIndicators.clear();
};

// Get typing users for a chat
export const getTypingUsers = (chatId: string): string[] => {
  return Array.from(typingIndicators.get(chatId) || []);
};

// Connection status monitoring
let isOnline = navigator.onLine;
const connectionCallbacks = new Set<(isOnline: boolean) => void>();

window.addEventListener('online', () => {
  isOnline = true;
  connectionCallbacks.forEach(callback => callback(true));
});

window.addEventListener('offline', () => {
  isOnline = false;
  connectionCallbacks.forEach(callback => callback(false));
});

export const subscribeToConnectionStatus = (
  callback: (isOnline: boolean) => void
): () => void => {
  connectionCallbacks.add(callback);
  
  // Immediately call with current status
  callback(isOnline);
  
  // Return unsubscribe function
  return () => {
    connectionCallbacks.delete(callback);
  };
};

export const getConnectionStatus = (): boolean => {
  return isOnline;
};