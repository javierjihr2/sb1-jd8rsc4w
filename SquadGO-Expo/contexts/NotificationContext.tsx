import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { NotificationPayload, NotificationType } from '../lib/notification-service';
import { useNotifications, NotificationState, NotificationActions } from '../hooks/useNotifications';
import { analyticsManager } from '../lib/analytics';

// Tipos para el contexto
interface NotificationContextState extends NotificationState {
  notifications: NotificationPayload[];
  currentNotification: NotificationPayload | null;
  showBanner: boolean;
  preferences: { [key in NotificationType]?: boolean };
  history: NotificationPayload[];
}

interface NotificationContextActions extends NotificationActions {
  showNotificationBanner: (notification: NotificationPayload) => void;
  hideNotificationBanner: () => void;
  addNotification: (notification: NotificationPayload) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  loadHistory: () => Promise<void>;
  updatePreferences: (preferences: { [key in NotificationType]?: boolean }) => void;
}

interface NotificationContextValue {
  state: NotificationContextState;
  actions: NotificationContextActions;
}

// Acciones del reducer
type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationPayload[] }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationPayload }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SHOW_BANNER'; payload: NotificationPayload }
  | { type: 'HIDE_BANNER' }
  | { type: 'SET_CURRENT_NOTIFICATION'; payload: NotificationPayload | null }
  | { type: 'SET_HISTORY'; payload: NotificationPayload[] }
  | { type: 'UPDATE_PREFERENCES'; payload: { [key in NotificationType]?: boolean } }
  | { type: 'UPDATE_BASE_STATE'; payload: Partial<NotificationState> };

// Estado inicial
const initialState: NotificationContextState = {
  isRegistered: false,
  permissionStatus: 'unknown',
  token: null,
  isLoading: true,
  error: null,
  lastNotification: null,
  unreadCount: 0,
  notifications: [],
  currentNotification: null,
  showBanner: false,
  preferences: {},
  history: [],
};

// Reducer
const notificationReducer = (
  state: NotificationContextState,
  action: NotificationAction
): NotificationContextState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case 'SHOW_BANNER':
      return {
        ...state,
        currentNotification: action.payload,
        showBanner: true,
      };

    case 'HIDE_BANNER':
      return {
        ...state,
        showBanner: false,
        currentNotification: null,
      };

    case 'SET_CURRENT_NOTIFICATION':
      return {
        ...state,
        currentNotification: action.payload,
      };

    case 'SET_HISTORY':
      return {
        ...state,
        history: action.payload,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case 'UPDATE_BASE_STATE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

// Contexto
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { state: hookState, actions: hookActions } = useNotifications();

  // Sincronizar estado del hook con el contexto
  useEffect(() => {
    dispatch({
      type: 'UPDATE_BASE_STATE',
      payload: hookState,
    });
  }, [hookState]);

  // Cargar historial al inicializar
  useEffect(() => {
    loadHistory();
  }, []);

  // Escuchar nuevas notificaciones
  useEffect(() => {
    if (hookState.lastNotification) {
      addNotification(hookState.lastNotification);
      showNotificationBanner(hookState.lastNotification);
    }
  }, [hookState.lastNotification]);

  // Acciones del contexto
  const showNotificationBanner = (notification: NotificationPayload) => {
    dispatch({ type: 'SHOW_BANNER', payload: notification });
    
    // Registrar evento
    analyticsManager.trackEvent('notification_banner_requested', {
      type: notification.type,
      title: notification.title,
    });
  };

  const hideNotificationBanner = () => {
    dispatch({ type: 'HIDE_BANNER' });
  };

  const addNotification = (notification: NotificationPayload) => {
    // Generar ID si no existe
    const notificationWithId = {
      ...notification,
      id: notification.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: notification.receivedAt || new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notificationWithId });
    
    // Registrar evento
    analyticsManager.trackEvent('notification_added_to_list', {
      type: notification.type,
      title: notification.title,
      total_notifications: state.notifications.length + 1,
    });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    
    // Registrar evento
    analyticsManager.trackEvent('notification_removed_from_list', {
      notification_id: id,
      remaining_notifications: state.notifications.length - 1,
    });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    
    // Registrar evento
    analyticsManager.trackEvent('notifications_cleared', {
      cleared_count: state.notifications.length,
    });
  };

  const loadHistory = async () => {
    try {
      const history = await hookActions.getNotificationHistory();
      dispatch({ type: 'SET_HISTORY', payload: history });
    } catch (error) {
      console.error('Error cargando historial de notificaciones:', error);
    }
  };

  const updatePreferences = (preferences: { [key in NotificationType]?: boolean }) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    
    // Actualizar preferencias individuales
    Object.entries(preferences).forEach(([type, enabled]) => {
      if (enabled !== undefined) {
        hookActions.updatePreference(type as NotificationType, enabled);
      }
    });
    
    // Registrar evento
    analyticsManager.trackEvent('notification_preferences_updated', {
      updated_preferences: Object.keys(preferences),
      preferences_count: Object.keys(preferences).length,
    });
  };

  // Combinar acciones del hook con las del contexto
  const contextActions: NotificationContextActions = {
    ...hookActions,
    showNotificationBanner,
    hideNotificationBanner,
    addNotification,
    removeNotification,
    clearNotifications,
    loadHistory,
    updatePreferences,
  };

  const contextValue: NotificationContextValue = {
    state,
    actions: contextActions,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para usar el contexto
export const useNotificationContext = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
  }
  return context;
};

// Hook para acceso rápido al estado
export const useNotificationState = () => {
  const { state } = useNotificationContext();
  return state;
};

// Hook para acceso rápido a las acciones
export const useNotificationActions = () => {
  const { actions } = useNotificationContext();
  return actions;
};

// Selectores útiles
export const useUnreadNotifications = () => {
  const { state } = useNotificationContext();
  return state.notifications.filter(n => !n.read);
};

export const useNotificationsByType = (type: NotificationType) => {
  const { state } = useNotificationContext();
  return state.notifications.filter(n => n.type === type);
};

export const useRecentNotifications = (limit: number = 10) => {
  const { state } = useNotificationContext();
  return state.notifications
    .sort((a, b) => {
      const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
      const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
};

export default NotificationContext;