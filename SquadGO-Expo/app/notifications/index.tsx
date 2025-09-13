import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NotificationPayload, NotificationType } from '../../lib/notification-service';
import NotificationList from '../../components/NotificationList';
import { analyticsManager } from '../../lib/analytics';

const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { state, actions } = useNotificationContext();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | NotificationType>('all');

  const handleNotificationPress = (notification: NotificationPayload) => {
    // Manejar navegación según el tipo de notificación
    switch (notification.type) {
      case NotificationType.MATCH_FOUND:
        // Navegar a la pantalla de match
        router.push('/matches');
        break;
      case NotificationType.GAME_INVITE:
        // Navegar a la pantalla de invitaciones
        router.push('/games');
        break;
      case NotificationType.MESSAGE:
        // Navegar al chat
        if (notification.data?.chatId) {
          router.push(`/chat/${notification.data.chatId}`);
        } else {
          router.push('/messages');
        }
        break;
      case NotificationType.FRIEND_REQUEST:
        // Navegar a solicitudes de amistad
        router.push('/friends/requests');
        break;
      case NotificationType.POST_LIKE:
      case NotificationType.POST_COMMENT:
        // Navegar al post
        if (notification.data?.postId) {
          router.push(`/posts/${notification.data.postId}`);
        } else {
          router.push('/social');
        }
        break;
      case NotificationType.TOURNAMENT_UPDATE:
        // Navegar al torneo
        if (notification.data?.tournamentId) {
          router.push(`/tournaments/${notification.data.tournamentId}`);
        } else {
          router.push('/tournaments');
        }
        break;
      default:
        // Usar actionUrl si está disponible
        if (notification.actionUrl) {
          console.log('Navegando a:', notification.actionUrl);
        }
        break;
    }

    // Registrar evento
    analyticsManager.trackEvent('notification_screen_item_pressed', {
      type: notification.type,
      has_action_url: !!notification.actionUrl,
      has_data: !!notification.data,
    });
  };

  const handleClearAll = () => {
    if (state.notifications.length === 0) return;

    Alert.alert(
      'Limpiar notificaciones',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar todo',
          style: 'destructive',
          onPress: () => {
            actions.clearNotifications();
            analyticsManager.trackEvent('notifications_cleared_from_screen', {
              cleared_count: state.notifications.length,
            });
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    if (state.unreadCount === 0) return;

    actions.markAsRead(); // Sin ID marca todas como leídas
    analyticsManager.trackEvent('all_notifications_marked_read', {
      marked_count: state.unreadCount,
    });
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case 'unread':
        return state.notifications.filter(n => !n.read);
      case 'all':
        return state.notifications;
      default:
        return state.notifications.filter(n => n.type === selectedFilter);
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const renderFilterButton = (filter: 'all' | 'unread' | NotificationType, label: string, icon: keyof typeof Ionicons.glyphMap) => {
    const isSelected = selectedFilter === filter;
    const count = filter === 'all' 
      ? state.notifications.length 
      : filter === 'unread'
      ? state.unreadCount
      : state.notifications.filter(n => n.type === filter).length;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonActive,
        ]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? 'white' : '#666'}
        />
        <Text style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextActive,
        ]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[
            styles.filterBadge,
            isSelected && styles.filterBadgeActive,
          ]}>
            <Text style={[
              styles.filterBadgeText,
              isSelected && styles.filterBadgeTextActive,
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notificaciones</Text>
        
        <View style={styles.headerActions}>
          {state.unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          
          {state.notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        {renderFilterButton('all', 'Todas', 'list')}
        {renderFilterButton('unread', 'No leídas', 'radio-button-off')}
        {renderFilterButton(NotificationType.GAME_INVITE, 'Juegos', 'game-controller')}
        {renderFilterButton(NotificationType.MESSAGE, 'Mensajes', 'chatbubble')}
        {renderFilterButton(NotificationType.FRIEND_REQUEST, 'Amigos', 'people')}
        {renderFilterButton(NotificationType.TOURNAMENT_UPDATE, 'Torneos', 'trophy')}
      </ScrollView>

      {/* Lista de notificaciones */}
      <View style={styles.listContainer}>
        <NotificationList
          onNotificationPress={handleNotificationPress}
          showActions={true}
          emptyMessage={
            selectedFilter === 'all'
              ? 'No tienes notificaciones'
              : selectedFilter === 'unread'
              ? 'No tienes notificaciones sin leer'
              : `No tienes notificaciones de ${selectedFilter}`
          }
        />
      </View>

      {/* Estadísticas */}
      {state.notifications.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {filteredNotifications.length} de {state.notifications.length} notificaciones
            {state.unreadCount > 0 && ` • ${state.unreadCount} sin leer`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  filtersScrollView: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  filterBadgeTextActive: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default NotificationsScreen;