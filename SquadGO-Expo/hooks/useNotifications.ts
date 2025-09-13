import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, NotificationPayload, NotificationType, NotificationPriority } from '../lib/notification-service';
import { notificationServer } from '../lib/notification-server';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';
import { monitoringManager } from '../lib/monitoring';

export interface NotificationState {
  isRegistered: boolean;
  permissionStatus: string;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lastNotification: NotificationPayload | null;
  unreadCount: number;
}

export interface NotificationActions {
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (payload: NotificationPayload) => Promise<void>;
  sendToUser: (userId: string, payload: NotificationPayload) => Promise<boolean>;
  sendToUsers: (userIds: string[], payload: NotificationPayload) => Promise<boolean>;
  markAsRead: (notificationId?: string) => void;
  clearAllNotifications: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updatePreference: (type: NotificationType, enabled: boolean) => Promise<void>;
  getNotificationHistory: () => Promise<NotificationPayload[]>;
}

export interface UseNotificationsReturn {
  state: NotificationState;
  actions: NotificationActions;
}

const NOTIFICATION_HISTORY_KEY = 'notification_history';
const MAX_HISTORY_SIZE = 50;

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  
  const [state, setState] = useState<NotificationState>({
    isRegistered: false,
    permissionStatus: 'unknown',
    token: null,
    isLoading: true,
    error: null,
    lastNotification: null,
    unreadCount: 0
  });

  // Inicializar el servicio de notificaciones
  const initializeNotifications = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Inicializar el servicio
      await notificationService.initialize();
      
      // Obtener estado actual
      const [permissionStatus, token, isRegistered] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationService.getToken(),
        notificationService.isRegisteredForNotifications()
      ]);
      
      setState(prev => ({
        ...prev,
        permissionStatus,
        token,
        isRegistered,
        isLoading: false
      }));
      
      // Configurar listeners
      setupNotificationListeners();
      
      // Registrar evento de analytics
      analyticsManager.trackEvent('notifications_initialized', {
        permission_status: permissionStatus,
        has_token: !!token,
        is_registered: isRegistered,
        user_id: user?.uid
      });
      
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      
      // Reportar error
      monitoringManager.recordError(error as Error, {
        context: 'useNotifications.initializeNotifications',
        user_id: user?.uid
      });
    }
  }, [user?.uid]);

  // Configurar listeners de notificaciones
  const setupNotificationListeners = useCallback(() => {
    // Listener para notificaciones recibidas
    const receivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        setState(prev => ({
          ...prev,
          lastNotification: notification,
          unreadCount: prev.unreadCount + 1
        }));
        
        // Guardar en historial
        saveNotificationToHistory(notification);
        
        // Registrar evento
        analyticsManager.trackEvent('notification_received', {
          type: notification.type,
          title: notification.title,
          user_id: user?.uid
        });
      }
    );

    // Listener para cuando se toca una notificación
    const responseSubscription = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        
        setState(prev => ({
          ...prev,
          lastNotification: notification,
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
        
        // Registrar evento
        analyticsManager.trackEvent('notification_tapped', {
          type: notification.type,
          action: response.actionIdentifier,
          user_id: user?.uid
        });
      }
    );

    return () => {
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [user?.uid]);

  // Guardar notificación en historial local
  const saveNotificationToHistory = async (notification: NotificationPayload) => {
    try {
      const history = await getNotificationHistory();
      const updatedHistory = [
        {
          ...notification,
          receivedAt: new Date().toISOString(),
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        ...history.slice(0, MAX_HISTORY_SIZE - 1)
      ];
      
      await notificationService.saveToStorage(NOTIFICATION_HISTORY_KEY, updatedHistory);
    } catch (error) {
      console.error('Error guardando notificación en historial:', error);
    }
  };

  // Manejar cambios en el estado de la app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App volvió al foreground, actualizar estado
        refreshToken();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Inicializar cuando el usuario cambie
  useEffect(() => {
    if (user) {
      initializeNotifications();
    } else {
      // Limpiar estado cuando no hay usuario
      setState({
        isRegistered: false,
        permissionStatus: 'unknown',
        token: null,
        isLoading: false,
        error: null,
        lastNotification: null,
        unreadCount: 0
      });
    }
  }, [user, initializeNotifications]);

  // Acciones
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        const [permissionStatus, token, isRegistered] = await Promise.all([
          notificationService.getPermissionStatus(),
          notificationService.getToken(),
          notificationService.isRegisteredForNotifications()
        ]);
        
        setState(prev => ({
          ...prev,
          permissionStatus,
          token,
          isRegistered,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Permisos de notificación denegados'
        }));
      }
      
      // Registrar evento
      analyticsManager.trackEvent('notification_permission_requested', {
        granted,
        user_id: user?.uid
      });
      
      return granted;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error solicitando permisos'
      }));
      return false;
    }
  }, [user?.uid]);

  const sendLocalNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    try {
      await notificationService.sendLocalNotification(payload);
      
      // Registrar evento
      analyticsManager.trackEvent('local_notification_sent', {
        type: payload.type,
        title: payload.title,
        user_id: user?.uid
      });
    } catch (error) {
      console.error('Error enviando notificación local:', error);
      throw error;
    }
  }, [user?.uid]);

  const sendToUser = useCallback(async (userId: string, payload: NotificationPayload): Promise<boolean> => {
    try {
      const result = await notificationServer.sendToUser(userId, payload);
      
      // Registrar evento
      analyticsManager.trackEvent('notification_sent_to_user', {
        target_user_id: userId,
        type: payload.type,
        success: result.success,
        total_sent: result.totalSent,
        total_failed: result.totalFailed,
        sender_user_id: user?.uid
      });
      
      return result.success;
    } catch (error) {
      console.error('Error enviando notificación a usuario:', error);
      return false;
    }
  }, [user?.uid]);

  const sendToUsers = useCallback(async (userIds: string[], payload: NotificationPayload): Promise<boolean> => {
    try {
      const result = await notificationServer.sendToUsers(userIds, payload);
      
      // Registrar evento
      analyticsManager.trackEvent('notification_sent_to_users', {
        target_count: userIds.length,
        type: payload.type,
        success: result.success,
        total_sent: result.totalSent,
        total_failed: result.totalFailed,
        sender_user_id: user?.uid
      });
      
      return result.success;
    } catch (error) {
      console.error('Error enviando notificaciones a usuarios:', error);
      return false;
    }
  }, [user?.uid]);

  const markAsRead = useCallback((notificationId?: string) => {
    setState(prev => ({
      ...prev,
      unreadCount: notificationId ? Math.max(0, prev.unreadCount - 1) : 0
    }));
    
    // Registrar evento
    analyticsManager.trackEvent('notification_marked_read', {
      notification_id: notificationId,
      user_id: user?.uid
    });
  }, [user?.uid]);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
      setState(prev => ({ ...prev, unreadCount: 0 }));
      
      // Registrar evento
      analyticsManager.trackEvent('all_notifications_cleared', {
        user_id: user?.uid
      });
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      throw error;
    }
  }, [user?.uid]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const [permissionStatus, token, isRegistered] = await Promise.all([
        notificationService.getPermissionStatus(),
        notificationService.getToken(),
        notificationService.isRegisteredForNotifications()
      ]);
      
      setState(prev => ({
        ...prev,
        permissionStatus,
        token,
        isRegistered
      }));
    } catch (error) {
      console.error('Error actualizando token:', error);
    }
  }, []);

  const updatePreference = useCallback(async (type: NotificationType, enabled: boolean): Promise<void> => {
    try {
      await notificationService.updateNotificationPreference(type, enabled);
      
      // Registrar evento
      analyticsManager.trackEvent('notification_preference_updated', {
        type,
        enabled,
        user_id: user?.uid
      });
    } catch (error) {
      console.error('Error actualizando preferencia:', error);
      throw error;
    }
  }, [user?.uid]);

  const getNotificationHistory = useCallback(async (): Promise<NotificationPayload[]> => {
    try {
      const history = await notificationService.getFromStorage(NOTIFICATION_HISTORY_KEY);
      return history || [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }, []);

  return {
    state,
    actions: {
      requestPermissions,
      sendLocalNotification,
      sendToUser,
      sendToUsers,
      markAsRead,
      clearAllNotifications,
      refreshToken,
      updatePreference,
      getNotificationHistory
    }
  };
};

export default useNotifications;