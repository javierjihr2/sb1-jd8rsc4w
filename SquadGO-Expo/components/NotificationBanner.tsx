import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationPayload, NotificationType } from '../lib/notification-service';
import { useNotifications } from '../hooks/useNotifications';
import { analyticsManager } from '../lib/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 80;
const ANIMATION_DURATION = 300;
const AUTO_HIDE_DELAY = 4000;

interface NotificationBannerProps {
  visible: boolean;
  notification: NotificationPayload | null;
  onPress?: () => void;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  showActions?: boolean;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  notification,
  onPress,
  onDismiss,
  position = 'top',
  showActions = true,
}) => {
  const insets = useSafeAreaInsets();
  const { actions } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  // Efecto para mostrar/ocultar el banner
  useEffect(() => {
    if (visible && notification) {
      showBanner();
    } else {
      hideBanner();
    }
  }, [visible, notification]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, []);

  const showBanner = () => {
    setIsVisible(true);
    
    // Limpiar timer anterior
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }

    // Animación de entrada
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide después del delay
    autoHideTimer.current = setTimeout(() => {
      hideBanner();
    }, AUTO_HIDE_DELAY);

    // Registrar evento de analytics
    if (notification) {
      analyticsManager.trackEvent('notification_banner_shown', {
        type: notification.type,
        title: notification.title,
        position
      });
    }
  };

  const hideBanner = () => {
    // Limpiar timer
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  const handlePress = () => {
    // Registrar evento
    if (notification) {
      analyticsManager.trackEvent('notification_banner_tapped', {
        type: notification.type,
        title: notification.title
      });
      
      // Marcar como leída
      actions.markAsRead();
    }
    
    onPress?.();
    hideBanner();
  };

  const handleDismiss = () => {
    // Registrar evento
    if (notification) {
      analyticsManager.trackEvent('notification_banner_dismissed', {
        type: notification.type,
        title: notification.title
      });
    }
    
    hideBanner();
  };

  const getIconForType = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case NotificationType.MATCH_FOUND:
        return 'search';
      case NotificationType.GAME_INVITE:
        return 'game-controller';
      case NotificationType.MESSAGE:
        return 'chatbubble';
      case NotificationType.FRIEND_REQUEST:
        return 'person-add';
      case NotificationType.POST_LIKE:
        return 'heart';
      case NotificationType.POST_COMMENT:
        return 'chatbubble-ellipses';
      case NotificationType.TOURNAMENT_UPDATE:
        return 'trophy';
      case NotificationType.SYSTEM:
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getColorForType = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.MATCH_FOUND:
      case NotificationType.GAME_INVITE:
        return '#4CAF50'; // Verde
      case NotificationType.MESSAGE:
        return '#2196F3'; // Azul
      case NotificationType.FRIEND_REQUEST:
        return '#FF9800'; // Naranja
      case NotificationType.POST_LIKE:
        return '#E91E63'; // Rosa
      case NotificationType.POST_COMMENT:
        return '#9C27B0'; // Púrpura
      case NotificationType.TOURNAMENT_UPDATE:
        return '#FFD700'; // Dorado
      case NotificationType.SYSTEM:
        return '#607D8B'; // Gris azulado
      default:
        return '#666666'; // Gris
    }
  };

  if (!isVisible || !notification) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-BANNER_HEIGHT, 0] : [BANNER_HEIGHT, 0],
  });

  const topOffset = position === 'top' ? insets.top + 10 : undefined;
  const bottomOffset = position === 'bottom' ? insets.bottom + 10 : undefined;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          bottom: bottomOffset,
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <BlurView intensity={80} style={styles.blurContainer}>
          <View style={styles.content}>
            {/* Icono */}
            <View style={[
              styles.iconContainer,
              { backgroundColor: getColorForType(notification.type) }
            ]}>
              <Ionicons
                name={getIconForType(notification.type)}
                size={24}
                color="white"
              />
            </View>

            {/* Contenido */}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            </View>

            {/* Acciones */}
            {showActions && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={handleDismiss}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Indicador de progreso */}
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getColorForType(notification.type),
                width: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: BANNER_HEIGHT,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    padding: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
});

export default NotificationBanner;