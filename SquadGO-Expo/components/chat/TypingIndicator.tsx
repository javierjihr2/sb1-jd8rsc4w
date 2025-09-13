import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Easing
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: any;
}

interface TypingIndicatorProps {
  chatRoomId: string;
  currentUserId: string;
  isVisible?: boolean;
}

const TypingDots: React.FC = () => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 200);
    const animation3 = createAnimation(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  const getDotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    }}>
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#9ca3af',
            marginHorizontal: 2,
          },
          getDotStyle(dot1),
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#9ca3af',
            marginHorizontal: 2,
          },
          getDotStyle(dot2),
        ]}
      />
      <Animated.View
        style={[
          {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#9ca3af',
            marginHorizontal: 2,
          },
          getDotStyle(dot3),
        ]}
      />
    </View>
  );
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  chatRoomId,
  currentUserId,
  isVisible = true
}) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!chatRoomId || !isVisible) return;

    // Escuchar cambios en tiempo real de usuarios escribiendo
    const roomRef = doc(db, 'chatRooms', chatRoomId);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Validar que data existe y es un objeto
        if (!data || typeof data !== 'object') {
          console.warn('⚠️ Invalid data structure in typing indicator');
          return;
        }
        
        const currentTypingUsers = Array.isArray(data.typingUsers) ? data.typingUsers : [];
        
        // Filtrar usuarios que no sean el usuario actual y que estén escribiendo recientemente
        const now = new Date();
        const activeTypingUsers = currentTypingUsers.filter((user: TypingUser) => {
          // Validar estructura del usuario
          if (!user || typeof user !== 'object' || !user.userId || !user.userName) {
            console.warn('⚠️ Invalid user structure in typing users');
            return false;
          }
          
          if (user.userId === currentUserId) return false;
          
          // Verificar si el timestamp es reciente (últimos 5 segundos)
          try {
            const userTimestamp = user.timestamp?.toDate ? user.timestamp.toDate() : new Date(user.timestamp);
            const timeDiff = now.getTime() - userTimestamp.getTime();
            return timeDiff < 5000; // 5 segundos
          } catch (error) {
            console.warn('⚠️ Invalid timestamp in typing user:', error);
            return false;
          }
        });
        
        setTypingUsers(activeTypingUsers);
      }
    });

    return () => unsubscribe();
  }, [chatRoomId, currentUserId, isVisible]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [typingUsers.length]);

  if (!isVisible || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const userName = typingUsers[0]?.userName || 'Usuario';
      return `${userName} está escribiendo`;
    } else if (typingUsers.length === 2) {
      const userName1 = typingUsers[0]?.userName || 'Usuario';
      const userName2 = typingUsers[1]?.userName || 'Usuario';
      return `${userName1} y ${userName2} están escribiendo`;
    } else {
      const userName = typingUsers[0]?.userName || 'Usuario';
      return `${userName} y ${typingUsers.length - 1} más están escribiendo`;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#374151',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        maxWidth: '75%',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 14,
            marginRight: 8,
            flex: 1,
          }}>
            {getTypingText()}
          </Text>
          <TypingDots />
        </View>
      </View>
    </Animated.View>
  );
};

export default TypingIndicator;