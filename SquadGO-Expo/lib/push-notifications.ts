import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { analyticsManager } from './analytics';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Tipos de notificaciones
export interface PushNotificationData {
  type: 'match_found' | 'tournament_update' | 'friend_request' | 'message' | 'general';
  title: string;
  body: string;
  data?: { [key: string]: any };
}

// Clase para manejar notificaciones push
class PushNotificationManager {
  private expoPushToken: string | null = null;
  private isRegistered: boolean = false;
  private userId: string | null = null;

  constructor() {
    this.setupNotificationListeners();
  }

  // Configurar listeners de notificaciones
  private setupNotificationListeners() {
    // Listener para notificaciones recibidas mientras la app está en primer plano
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificación recibida:', notification);
      
      // Rastrear evento de notificación recibida
      analyticsManager.trackEvent('notification_received', {
        notification_type: notification.request.content.data?.type || 'unknown',
        app_state: 'foreground'
      });
    });

    // Listener para cuando el usuario toca una notificación
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notificación tocada:', response);
      
      // Rastrear evento de notificación tocada
      analyticsManager.trackEvent('notification_tapped', {
        notification_type: response.notification.request.content.data?.type || 'unknown',
        action_identifier: response.actionIdentifier
      });
      
      // Manejar navegación basada en el tipo de notificación
      this.handleNotificationTap(response.notification.request.content.data);
    });
  }

  // Manejar tap en notificación
  private handleNotificationTap(data: any) {
    if (!data) return;
    
    switch (data.type) {
      case 'match_found':
        // Navegar a la pantalla de match
        console.log('Navegando a match encontrado');
        break;
      case 'tournament_update':
        // Navegar a la pantalla de torneos
        console.log('Navegando a actualización de torneo');
        break;
      case 'friend_request':
        // Navegar a la pantalla de amigos
        console.log('Navegando a solicitud de amistad');
        break;
      case 'message':
        // Navegar al chat
        console.log('Navegando a mensaje');
        break;
      default:
        console.log('Tipo de notificación no manejado:', data.type);
    }
  }

  // Registrar para notificaciones push
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.log('📱 Las notificaciones push solo funcionan en dispositivos físicos');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('📱 Permisos de notificación denegados');
        
        // Rastrear evento de permisos denegados
        analyticsManager.trackEvent('notification_permission', {
          status: 'denied'
        });
        
        return null;
      }

      // Rastrear evento de permisos concedidos
      analyticsManager.trackEvent('notification_permission', {
        status: 'granted'
      });

      // Obtener token de Expo con validación mejorada
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id'
        });
      } catch (tokenError) {
        console.error('📱 Error obteniendo token de Expo:', tokenError);
        return null;
      }
      
      // Validar que el token existe y tiene la propiedad data
      if (!token || typeof token !== 'object' || !token.data || typeof token.data !== 'string') {
        console.error('📱 Token de notificación no válido:', token);
        return null;
      }
      
      this.expoPushToken = token.data;
      this.isRegistered = true;
      
      console.log('📱 Token de notificación obtenido:', token.data);
      
      // Configurar canal de notificación para Android
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannel();
      }
      
      return token.data;
    } catch (error) {
      console.error('📱 Error registrando notificaciones:', error);
      analyticsManager.trackError(error as Error, 'push_notification_registration');
      return null;
    }
  }

  // Configurar canal de notificación para Android
  private async setupAndroidNotificationChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SquadGO Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true
    });

    // Canal para matches
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'Matches Encontrados',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#00FF00',
      sound: 'default'
    });

    // Canal para torneos
    await Notifications.setNotificationChannelAsync('tournaments', {
      name: 'Actualizaciones de Torneos',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default'
    });

    // Canal para mensajes
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Mensajes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default'
    });
  }

  // Guardar token en Firestore
  async saveTokenToFirestore(userId: string) {
    if (!this.expoPushToken) {
      console.log('📱 No hay token para guardar');
      return;
    }

    try {
      this.userId = userId;
      await updateDoc(doc(db, 'profiles', userId), {
        fcmToken: this.expoPushToken,
        lastTokenUpdate: new Date()
      });
      
      console.log('📱 Token guardado en Firestore para usuario:', userId);
      
      // Rastrear evento de token guardado
      analyticsManager.trackEvent('push_token_saved', {
        user_id: userId
      });
    } catch (error) {
      console.error('📱 Error guardando token en Firestore:', error);
      analyticsManager.trackError(error as Error, 'save_push_token');
    }
  }

  // Enviar notificación local
  async sendLocalNotification(notification: PushNotificationData) {
    try {
      const channelId = this.getChannelForType(notification.type);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default'
        },
        trigger: null, // Enviar inmediatamente
        identifier: `local_${Date.now()}`
      });
      
      console.log('📱 Notificación local enviada:', notification.title);
      
      // Rastrear evento de notificación local
      analyticsManager.trackEvent('local_notification_sent', {
        notification_type: notification.type
      });
    } catch (error) {
      console.error('📱 Error enviando notificación local:', error);
      analyticsManager.trackError(error as Error, 'send_local_notification');
    }
  }

  // Obtener canal apropiado para el tipo de notificación
  private getChannelForType(type: string): string {
    switch (type) {
      case 'match_found':
        return 'matches';
      case 'tournament_update':
        return 'tournaments';
      case 'message':
        return 'messages';
      default:
        return 'default';
    }
  }

  // Cancelar todas las notificaciones
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('📱 Todas las notificaciones canceladas');
    } catch (error) {
      console.error('📱 Error cancelando notificaciones:', error);
    }
  }

  // Obtener permisos actuales
  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Verificar si las notificaciones están habilitadas
  async areNotificationsEnabled(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'granted';
  }

  // Obtener token actual
  getToken(): string | null {
    return this.expoPushToken;
  }

  // Verificar si está registrado
  isRegisteredForNotifications(): boolean {
    return this.isRegistered;
  }

  // Limpiar token (logout)
  clearToken() {
    this.expoPushToken = null;
    this.isRegistered = false;
    this.userId = null;
    console.log('📱 Token de notificación limpiado');
  }

  // Obtener estado completo
  getStatus() {
    return {
      token: this.expoPushToken,
      isRegistered: this.isRegistered,
      userId: this.userId,
      isDevice: Device.isDevice
    };
  }
}

// Instancia singleton
export const pushNotificationManager = new PushNotificationManager();

// Funciones de conveniencia
export const registerForPushNotifications = () => {
  return pushNotificationManager.registerForPushNotifications();
};

export const saveTokenToFirestore = (userId: string) => {
  return pushNotificationManager.saveTokenToFirestore(userId);
};

export const sendLocalNotification = (notification: PushNotificationData) => {
  return pushNotificationManager.sendLocalNotification(notification);
};

export const areNotificationsEnabled = () => {
  return pushNotificationManager.areNotificationsEnabled();
};

export default pushNotificationManager;