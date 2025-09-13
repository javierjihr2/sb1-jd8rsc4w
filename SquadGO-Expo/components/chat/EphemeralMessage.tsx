import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface EphemeralMessageProps {
  messageId: string;
  chatRoomId: string;
  content: string;
  expiresAt: Date;
  isOwnMessage: boolean;
  onMessageExpired: () => void;
}

interface EphemeralTimerProps {
  expiresAt: Date;
  onExpired: () => void;
}

const EphemeralTimer: React.FC<EphemeralTimerProps> = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress] = useState(new Animated.Value(1));

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onExpired();
        return;
      }
      
      // Actualizar progreso visual
      const totalDuration = 24 * 60 * 60 * 1000; // 24 horas por defecto
      const progressValue = remaining / totalDuration;
      
      Animated.timing(progress, {
        toValue: progressValue,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const formatTimeLeft = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    }}>
      <Ionicons name="timer-outline" size={12} color="#9ca3af" />
      <Text style={{
        color: '#9ca3af',
        fontSize: 10,
        marginLeft: 4,
      }}>
        {formatTimeLeft(timeLeft)}
      </Text>
      <View style={{
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        marginLeft: 8,
        borderRadius: 1,
        overflow: 'hidden',
      }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: timeLeft < 60000 ? '#ef4444' : '#9ca3af', // Rojo si queda menos de 1 minuto
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
};

export const EphemeralMessage: React.FC<EphemeralMessageProps> = ({
  messageId,
  chatRoomId,
  content,
  expiresAt,
  isOwnMessage,
  onMessageExpired
}) => {
  const [isExpired, setIsExpired] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (expiresAt <= now) {
      handleExpiration();
    }
  }, []);

  const handleExpiration = async () => {
    if (isExpired) return;
    
    setIsExpired(true);
    
    // Animación de desvanecimiento
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(async () => {
      try {
        // Eliminar mensaje de la base de datos
        await deleteDoc(doc(db, 'chats', chatRoomId, 'messages', messageId));
        onMessageExpired();
      } catch (error) {
        console.error('Error eliminando mensaje efímero:', error);
      }
    });
  };

  const handleRevealMessage = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      // Opcional: marcar como visto en la base de datos
      updateMessageViewStatus();
    }
  };

  const updateMessageViewStatus = async () => {
    try {
      const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageId);
      await updateDoc(messageRef, {
        viewedAt: new Date(),
        isViewed: true
      });
    } catch (error) {
      console.error('Error actualizando estado de visualización:', error);
    }
  };

  const confirmDeleteMessage = () => {
    Alert.alert(
      'Eliminar mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje efímero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleExpiration }
      ]
    );
  };

  if (isExpired) {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          backgroundColor: '#374151',
          borderRadius: 16,
          padding: 12,
          marginVertical: 4,
          borderWidth: 1,
          borderColor: '#4b5563',
          borderStyle: 'dashed',
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            marginLeft: 8,
            fontStyle: 'italic',
          }}>
            Mensaje eliminado
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
        maxWidth: '75%',
      }}
    >
      <TouchableOpacity
        onPress={handleRevealMessage}
        onLongPress={isOwnMessage ? confirmDeleteMessage : undefined}
        style={{
          backgroundColor: isOwnMessage ? '#3b82f6' : '#374151',
          borderRadius: 16,
          padding: 12,
          borderBottomRightRadius: isOwnMessage ? 4 : 16,
          borderBottomLeftRadius: isOwnMessage ? 16 : 4,
          borderWidth: 2,
          borderColor: '#f59e0b', // Color dorado para indicar que es efímero
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <Ionicons name="flash" size={14} color="#f59e0b" />
          <Text style={{
            color: '#f59e0b',
            fontSize: 10,
            marginLeft: 4,
            fontWeight: '600',
          }}>
            EFÍMERO
          </Text>
        </View>
        
        {isRevealed ? (
          <Text style={{
            color: 'white',
            fontSize: 14,
          }}>
            {content}
          </Text>
        ) : (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="eye-off" size={16} color="#9ca3af" />
            <Text style={{
              color: '#9ca3af',
              fontSize: 12,
              marginLeft: 8,
              fontStyle: 'italic',
            }}>
              Toca para revelar mensaje
            </Text>
          </View>
        )}
        
        <EphemeralTimer
          expiresAt={expiresAt}
          onExpired={handleExpiration}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default EphemeralMessage;