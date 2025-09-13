import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationPayload, NotificationType } from '../lib/notification-service';
import { useNotificationContext } from '../contexts/NotificationContext';
import { analyticsManager } from '../lib/analytics';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationListProps {
  onNotificationPress?: (notification: NotificationPayload) => void;
  showActions?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  showTimestamp?: boolean;
  notifications?: NotificationPayload[];
}

interface NotificationItemProps {
  notification: NotificationPayload;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDelete,
  showActions = true,
}) => {
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
        return '#4CAF50';
      case NotificationType.MESSAGE:
        return '#2196F3';
      case NotificationType.FRIEND_REQUEST:
        return '#FF9800';
      case NotificationType.POST_LIKE:
        return '#E91E63';
      case NotificationType.POST_COMMENT:
        return '#9C27B0';
      case NotificationType.TOURNAMENT_UPDATE:
        return '#FFD700';
      case NotificationType.SYSTEM:
        return '#607D8B';
      default:
        return '#666666';
    }
  };

  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    try {
      const notificationDate = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(notificationDate, { 
        addSuffix: true, 
        locale: es 
      });
    } catch (error) {
      return '';
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar notificación',
      '¿Estás seguro de que quieres eliminar esta notificación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadItem,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        {/* Icono */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: getColorForType(notification.type) }
        ]}>
          <Ionicons
            name={getIconForType(notification.type)}
            size={20}
            color="white"
          />
        </View>

        {/* Contenido */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.time}>
              {formatTime(notification.receivedAt)}
            </Text>
          </View>
          
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
          
          {/* Indicador de no leída */}
          {!notification.read && (
            <View style={styles.unreadIndicator} />
          )}
        </View>

        {/* Acciones */}
        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationPress,
  showActions = true,
  maxItems,
  emptyMessage = 'No tienes notificaciones',
  showTimestamp = true,
  notifications: propNotifications,
}) => {
  const { state, actions } = useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filtrar y limitar notificaciones
  const sourceNotifications = propNotifications || state.notifications;
  const displayNotifications = maxItems 
    ? sourceNotifications.slice(0, maxItems)
    : sourceNotifications;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (!propNotifications) {
        await actions.loadHistory();
      }
      
      // Registrar evento
      analyticsManager.trackEvent('notification_list_loaded', {
        total_notifications: sourceNotifications.length,
        unread_count: state.unreadCount,
      });
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (propNotifications) return; // No refresh if using external notifications
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: NotificationPayload) => {
    // Marcar como leída
    if (!notification.read && notification.id) {
      actions.markAsRead(notification.id);
    }
    
    // Registrar evento
    analyticsManager.trackEvent('notification_list_item_pressed', {
      type: notification.type,
      title: notification.title,
      was_read: notification.read,
    });
    
    // Callback personalizado
    onNotificationPress?.(notification);
  };

  const handleDeleteNotification = (notification: NotificationPayload) => {
    if (notification.id) {
      actions.removeNotification(notification.id);
      
      // Registrar evento
      analyticsManager.trackEvent('notification_deleted', {
        type: notification.type,
        title: notification.title,
      });
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationPayload }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item)}
      showActions={showActions}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      <Text style={styles.emptySubtext}>
        Las notificaciones aparecerán aquí cuando las recibas
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (displayNotifications.length === 0) return null;
    
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          Notificaciones ({displayNotifications.length})
        </Text>
        {state.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {state.unreadCount} nuevas
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={displayNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id || `${item.title}_${item.receivedAt}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          displayNotifications.length === 0 && styles.emptyListContainer,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#666',
    flexShrink: 0,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationList;