import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { analyticsManager } from './analytics';
import { monitoringManager } from './monitoring';

// Configuración global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const priority = data?.priority || 'normal';
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: priority === 'high',
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// Tipos de notificaciones
export enum NotificationType {
  MATCH_FOUND = 'match_found',
  TOURNAMENT_UPDATE = 'tournament_update',
  FRIEND_REQUEST = 'friend_request',
  MESSAGE = 'message',
  SQUAD_INVITE = 'squad_invite',
  GAME_INVITE = 'game_invite',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  ACHIEVEMENT = 'achievement',
  SYSTEM = 'system',
  MARKETING = 'marketing'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  sound?: string;
  badge?: number;
  imageUrl?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  [NotificationType.MATCH_FOUND]: boolean;
  [NotificationType.TOURNAMENT_UPDATE]: boolean;
  [NotificationType.FRIEND_REQUEST]: boolean;
  [NotificationType.MESSAGE]: boolean;
  [NotificationType.SQUAD_INVITE]: boolean;
  [NotificationType.GAME_INVITE]: boolean;
  [NotificationType.POST_LIKE]: boolean;
  [NotificationType.POST_COMMENT]: boolean;
  [NotificationType.ACHIEVEMENT]: boolean;
  [NotificationType.SYSTEM]: boolean;
  [NotificationType.MARKETING]: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private preferences: NotificationPreferences | null = null;
  private notificationQueue: NotificationPayload[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.setupNotificationListeners();
  }

  // Inicializar el servicio de notificaciones
  async initialize(userId: string): Promise<boolean> {
    try {
      this.userId = userId;
      
      // Verificar si es dispositivo físico
      if (!Device.isDevice) {
        console.log('📱 Notificaciones solo disponibles en dispositivos físicos');
        return false;
      }

      // Solicitar permisos
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        return false;
      }

      // Obtener tokens
      await this.obtainTokens();
      
      // Configurar canales de Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Cargar preferencias del usuario
      await this.loadUserPreferences();

      // Guardar tokens en Firestore
      await this.saveTokensToFirestore();

      this.isInitialized = true;
      
      // Procesar cola de notificaciones pendientes
      this.processNotificationQueue();

      console.log('📱 Servicio de notificaciones inicializado correctamente');
      
      analyticsManager.trackEvent('notification_service_initialized', {
        user_id: userId,
        has_expo_token: !!this.expoPushToken,
        has_fcm_token: !!this.fcmToken
      });

      return true;
    } catch (error) {
      console.error('📱 Error inicializando servicio de notificaciones:', error);
      monitoringManager.recordError(error as Error, {
        context: 'notification_service_init',
        user_id: userId
      });
      return false;
    }
  }

  // Configurar listeners de notificaciones
  private setupNotificationListeners() {
    // Notificación recibida en primer plano
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificación recibida:', notification);
      
      const data = notification.request.content.data;
      
      analyticsManager.trackEvent('notification_received', {
        notification_type: data?.type || 'unknown',
        app_state: 'foreground',
        user_id: this.userId
      });

      // Mostrar notificación in-app si es necesario
      this.handleForegroundNotification(notification);
    });

    // Notificación tocada
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notificación tocada:', response);
      
      const data = response.notification.request.content.data;
      
      analyticsManager.trackEvent('notification_tapped', {
        notification_type: data?.type || 'unknown',
        action_identifier: response.actionIdentifier,
        user_id: this.userId
      });

      // Manejar navegación
      this.handleNotificationTap(data);
    });
  }

  // Solicitar permisos de notificación
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      const granted = finalStatus === 'granted';
      
      analyticsManager.trackEvent('notification_permission_request', {
        status: finalStatus,
        granted,
        user_id: this.userId
      });

      if (!granted) {
        console.log('📱 Permisos de notificación denegados');
      }

      return granted;
    } catch (error) {
      console.error('📱 Error solicitando permisos:', error);
      return false;
    }
  }

  // Obtener tokens de notificación
  private async obtainTokens() {
    try {
      // Token de Expo
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id'
      });
      
      if (expoToken?.data) {
        this.expoPushToken = expoToken.data;
        console.log('📱 Token de Expo obtenido:', expoToken.data.substring(0, 20) + '...');
      }

      // TODO: Implementar FCM token si es necesario
      // this.fcmToken = await getFCMToken();
      
    } catch (error) {
      console.error('📱 Error obteniendo tokens:', error);
      throw error;
    }
  }

  // Configurar canales de Android
  private async setupAndroidChannels() {
    const channels = [
      {
        id: 'default',
        name: 'Notificaciones Generales',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default'
      },
      {
        id: 'matches',
        name: 'Partidas Encontradas',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00FF00'
      },
      {
        id: 'messages',
        name: 'Mensajes',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default'
      },
      {
        id: 'social',
        name: 'Actividad Social',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default'
      },
      {
        id: 'tournaments',
        name: 'Torneos',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default'
      },
      {
        id: 'system',
        name: 'Sistema',
        importance: Notifications.AndroidImportance.LOW,
        sound: 'default'
      }
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }
  }

  // Cargar preferencias del usuario
  private async loadUserPreferences() {
    if (!this.userId) return;

    try {
      const userDoc = await getDocs(
        query(
          collection(db, 'notificationPreferences'),
          where('userId', '==', this.userId)
        )
      );

      if (!userDoc.empty) {
        this.preferences = userDoc.docs[0].data() as NotificationPreferences;
      } else {
        // Crear preferencias por defecto
        this.preferences = this.getDefaultPreferences();
        await this.saveUserPreferences();
      }
    } catch (error) {
      console.error('📱 Error cargando preferencias:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  // Obtener preferencias por defecto
  private getDefaultPreferences(): NotificationPreferences {
    return {
      [NotificationType.MATCH_FOUND]: true,
      [NotificationType.TOURNAMENT_UPDATE]: true,
      [NotificationType.FRIEND_REQUEST]: true,
      [NotificationType.MESSAGE]: true,
      [NotificationType.SQUAD_INVITE]: true,
      [NotificationType.GAME_INVITE]: true,
      [NotificationType.POST_LIKE]: true,
      [NotificationType.POST_COMMENT]: true,
      [NotificationType.ACHIEVEMENT]: true,
      [NotificationType.SYSTEM]: true,
      [NotificationType.MARKETING]: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      soundEnabled: true,
      vibrationEnabled: true
    };
  }

  // Guardar tokens en Firestore
  private async saveTokensToFirestore() {
    if (!this.userId || !this.expoPushToken) return;

    try {
      await updateDoc(doc(db, 'profiles', this.userId), {
        expoPushToken: this.expoPushToken,
        fcmToken: this.fcmToken,
        lastTokenUpdate: serverTimestamp(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          isDevice: Device.isDevice
        }
      });

      console.log('📱 Tokens guardados en Firestore');
    } catch (error) {
      console.error('📱 Error guardando tokens:', error);
    }
  }

  // Enviar notificación local
  async sendLocalNotification(payload: NotificationPayload) {
    if (!this.isInitialized) {
      this.notificationQueue.push(payload);
      return;
    }

    try {
      // Verificar preferencias del usuario
      if (!this.shouldSendNotification(payload.type)) {
        console.log('📱 Notificación bloqueada por preferencias del usuario:', payload.type);
        return;
      }

      // Verificar horas silenciosas
      if (this.isInQuietHours()) {
        console.log('📱 Notificación bloqueada por horas silenciosas');
        return;
      }

      const channelId = this.getChannelForType(payload.type);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: {
            ...payload.data,
            type: payload.type,
            actionUrl: payload.actionUrl
          },
          sound: this.preferences?.soundEnabled ? (payload.sound || 'default') : undefined,
          badge: payload.badge
        },
        trigger: null
      });

      analyticsManager.trackEvent('local_notification_sent', {
        notification_type: payload.type,
        user_id: this.userId
      });

      console.log('📱 Notificación local enviada:', payload.title);
    } catch (error) {
      console.error('📱 Error enviando notificación local:', error);
      monitoringManager.recordError(error as Error, {
        context: 'send_local_notification',
        notification_type: payload.type
      });
    }
  }

  // Verificar si debe enviar notificación según preferencias
  private shouldSendNotification(type: NotificationType): boolean {
    return this.preferences?.[type] ?? true;
  }

  // Verificar si está en horas silenciosas
  private isInQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.preferences.quietHours;
    
    // Manejar caso donde las horas silenciosas cruzan medianoche
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  // Obtener canal apropiado para el tipo de notificación
  private getChannelForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.MATCH_FOUND:
      case NotificationType.GAME_INVITE:
        return 'matches';
      case NotificationType.MESSAGE:
        return 'messages';
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.POST_LIKE:
      case NotificationType.POST_COMMENT:
        return 'social';
      case NotificationType.TOURNAMENT_UPDATE:
        return 'tournaments';
      case NotificationType.SYSTEM:
        return 'system';
      default:
        return 'default';
    }
  }

  // Manejar notificación en primer plano
  private handleForegroundNotification(notification: Notifications.Notification) {
    // Implementar lógica para mostrar notificación in-app
    // Por ejemplo, mostrar un toast o banner
  }

  // Manejar tap en notificación
  private handleNotificationTap(data: any) {
    if (!data) return;

    // Implementar navegación basada en el tipo de notificación
    switch (data.type) {
      case NotificationType.MATCH_FOUND:
        // Navegar a la pantalla de match
        break;
      case NotificationType.MESSAGE:
        // Navegar al chat
        break;
      case NotificationType.FRIEND_REQUEST:
        // Navegar a solicitudes de amistad
        break;
      // Agregar más casos según sea necesario
    }

    // Si hay una URL de acción específica
    if (data.actionUrl) {
      // Manejar navegación a URL específica
    }
  }

  // Procesar cola de notificaciones
  private async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.sendLocalNotification(notification);
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Actualizar preferencias del usuario
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    if (!this.userId) return;

    try {
      this.preferences = { ...this.preferences!, ...preferences };
      await this.saveUserPreferences();
      
      analyticsManager.trackEvent('notification_preferences_updated', {
        user_id: this.userId,
        updated_fields: Object.keys(preferences)
      });
    } catch (error) {
      console.error('📱 Error actualizando preferencias:', error);
    }
  }

  // Guardar preferencias del usuario
  private async saveUserPreferences() {
    if (!this.userId || !this.preferences) return;

    try {
      await addDoc(collection(db, 'notificationPreferences'), {
        userId: this.userId,
        ...this.preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('📱 Error guardando preferencias:', error);
    }
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasExpoPushToken: !!this.expoPushToken,
      hasFCMToken: !!this.fcmToken,
      userId: this.userId,
      isDevice: Device.isDevice,
      queueLength: this.notificationQueue.length
    };
  }

  // Limpiar datos (logout)
  cleanup() {
    this.expoPushToken = null;
    this.fcmToken = null;
    this.isInitialized = false;
    this.userId = null;
    this.preferences = null;
    this.notificationQueue = [];
    console.log('📱 Servicio de notificaciones limpiado');
  }

  // Obtener token actual
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Obtener preferencias actuales
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }
}

// Instancia singleton
export const notificationService = new NotificationService();

// Funciones de conveniencia
export const initializeNotifications = (userId: string) => {
  return notificationService.initialize(userId);
};

export const sendLocalNotification = (payload: NotificationPayload) => {
  return notificationService.sendLocalNotification(payload);
};

export const updateNotificationPreferences = (preferences: Partial<NotificationPreferences>) => {
  return notificationService.updatePreferences(preferences);
};

export default notificationService;