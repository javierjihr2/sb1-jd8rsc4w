import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Importaciones condicionales para evitar errores en web
let Notifications: any = null;
let Constants: any = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Constants = require('expo-constants');
    
    // Configurar el comportamiento de las notificaciones solo en móvil
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    console.log('Expo notifications not available:', error);
  }
}

// Verificar si estamos en Expo Go
const isExpoGo = Constants?.appOwnership === 'expo';

export async function registerForPushNotificationsAsync() {
  // Si estamos en web o no hay Notifications disponible, retornar null
  if (Platform.OS === 'web' || !Notifications) {
    console.log('⚠️ Notificaciones push no disponibles en este entorno');
    return null;
  }

  let token;

  // En Expo Go, las notificaciones push tienen limitaciones
  if (isExpoGo) {
    console.log('⚠️ Notificaciones push limitadas en Expo Go');
    // Aún intentamos obtener el token pero con manejo de errores mejorado
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ No se otorgaron permisos para notificaciones push');
      return null;
    }
    
    let tokenResponse;
    try {
      tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id'
      });
    } catch (tokenError) {
      console.error('❌ Error obteniendo token de Expo:', tokenError);
      return null;
    }
    
    // Validar que el token existe y tiene la propiedad data
    if (!tokenResponse || typeof tokenResponse !== 'object' || !tokenResponse.data || typeof tokenResponse.data !== 'string') {
      console.error('❌ Token de notificación no válido:', tokenResponse);
      return null;
    }
    
    token = tokenResponse.data;
    console.log('✅ Push token obtenido:', token);

    return token;
  } catch (error) {
    console.log('⚠️ Error al registrar notificaciones push:', error);
    return null;
  }
}

export async function savePushTokenToUser(userId: string, token: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      pushToken: token,
      updatedAt: new Date()
    });
    console.log('✅ Push token saved to user profile');
  } catch (error) {
    console.error('❌ Error saving push token:', error);
  }
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('✅ Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
}

// Tipos de notificaciones
export enum NotificationType {
  NEW_LIKE = 'new_like',
  NEW_COMMENT = 'new_comment',
  NEW_FOLLOWER = 'new_follower',
  MATCH_FOUND = 'match_found',
  TOURNAMENT_STARTED = 'tournament_started',
  CHAT_MESSAGE = 'chat_message'
}

// Función para enviar notificaciones específicas
export async function sendNotificationToUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Aquí podrías obtener el push token del usuario desde Firestore
    // y enviar la notificación usando sendPushNotification
    console.log(`📱 Sending ${type} notification to user ${userId}:`, { title, body, data });
    
    // Por ahora solo logueamos, pero en una implementación completa
    // obtendrías el token del usuario y enviarías la notificación real
  } catch (error) {
    console.error('❌ Error sending notification to user:', error);
  }
}

// Función para manejar notificaciones recibidas
export function setupNotificationListeners() {
  // Si estamos en web o no hay Notifications disponible, retornar listeners vacíos
  if (Platform.OS === 'web' || !Notifications) {
    console.log('⚠️ Notification listeners no disponibles en este entorno');
    return {
      notificationListener: null,
      responseListener: null
    };
  }

  // Listener para cuando se recibe una notificación
  const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
    console.log('📱 Notification received:', notification);
  });

  // Listener para cuando el usuario toca una notificación
  const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
    console.log('📱 Notification response:', response);
    
    const data = response.notification.request.content.data;
    
    // Aquí puedes manejar la navegación basada en el tipo de notificación
    switch (data?.type) {
      case NotificationType.NEW_LIKE:
      case NotificationType.NEW_COMMENT:
        // Navegar al post específico
        break;
      case NotificationType.MATCH_FOUND:
        // Navegar a matchmaking
        break;
      case NotificationType.CHAT_MESSAGE:
        // Navegar al chat
        break;
      default:
        break;
    }
  });

  return {
    notificationListener,
    responseListener
  };
}

// Función para limpiar listeners
export function cleanupNotificationListeners(
  notificationListener: any,
  responseListener: any
) {
  if (Platform.OS === 'web' || !Notifications || !notificationListener || !responseListener) {
    console.log('⚠️ No hay listeners para limpiar');
    return;
  }
  
  try {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  } catch (error) {
    console.log('⚠️ Error al limpiar listeners:', error);
  }
}