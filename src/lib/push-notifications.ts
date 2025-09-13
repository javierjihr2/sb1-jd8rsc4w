import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { addRetryOperation } from './retry-system';
import { validateNotification } from './validation';

// Notification types
export type NotificationType = 
  | 'message' 
  | 'friend_request' 
  | 'friend_accepted' 
  | 'match_found' 
  | 'tournament_invite' 
  | 'tournament_reminder' 
  | 'feed_like' 
  | 'feed_comment';

// Notification interface
export interface PushNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high';
  actionUrl?: string;
}

// Notification subscription interface
export interface NotificationSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
  active: boolean;
}

// Store notification subscription
export async function subscribeToNotifications(
  userId: string, 
  subscription: PushSubscription
): Promise<{ success: boolean; error?: string; subscriptionId?: string; retryId?: string }> {
  try {
    const validationResult = validateNotification({
      userId,
      subscription: subscription.toJSON()
    });

    if (!validationResult.isValid) {
      return { success: false, error: validationResult.errors.join(', ') };
    }

    const subscriptionData: NotificationSubscription = {
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || ''
      },
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      active: true
    };

    const docRef = await addDoc(collection(db, 'notificationSubscriptions'), subscriptionData);
    
    return { success: true, subscriptionId: docRef.id };
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.messageSend(userId, {
      operation: 'subscribeToNotifications',
      subscription: subscription.toJSON()
    }, 'medium');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      retryId 
    };
  }
}

// Send push notification
export async function sendPushNotification(
  notification: Omit<PushNotification, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string; notificationId?: string; retryId?: string }> {
  try {
    const validationResult = validateNotification(notification);

    if (!validationResult.isValid) {
      return { success: false, error: validationResult.errors.join(', ') };
    }

    const notificationData: PushNotification = {
      ...notification,
      createdAt: new Date(),
      expiresAt: notification.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    };

    // Store notification in database
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    
    // Get user's notification subscriptions
    const subscriptionsQuery = query(
      collection(db, 'notificationSubscriptions'),
      where('userId', '==', notification.userId),
      where('active', '==', true)
    );
    
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    // Send push notification to all user's devices
    const pushPromises = subscriptionsSnapshot.docs.map(async (subscriptionDoc) => {
      const subscription = subscriptionDoc.data() as NotificationSubscription;
      
      try {
        // In a real implementation, you would use a service like Firebase Cloud Messaging
        // or implement your own push notification service
        await sendToDevice(subscription, notificationData);
      } catch (error) {
        console.error('Error sending to device:', error);
        // Mark subscription as inactive if it fails
        await updateDoc(doc(db, 'notificationSubscriptions', subscriptionDoc.id), {
          active: false
        });
      }
    });
    
    await Promise.allSettled(pushPromises);
    
    return { success: true, notificationId: docRef.id };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.messageSend(notification.userId, {
      operation: 'sendPushNotification',
      notification
    }, notification.priority === 'high' ? 'high' : 'medium');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      retryId 
    };
  }
}

// Mock function for sending to device (replace with actual implementation)
async function sendToDevice(
  subscription: NotificationSubscription, 
  notification: PushNotification
): Promise<void> {
  // This would typically use web-push library or Firebase Cloud Messaging
  console.log('Sending notification to device:', {
    endpoint: subscription.endpoint,
    notification: {
      title: notification.title,
      body: notification.body,
      data: notification.data
    }
  });
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Get user notifications
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20,
  unreadOnly: boolean = false
): Promise<{ success: boolean; notifications?: PushNotification[]; error?: string }> {
  try {
    let notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (unreadOnly) {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(notificationsQuery);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PushNotification[];
    
    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    // Add to retry queue
    const retryId = addRetryOperation.messageSend('system', {
      operation: 'markNotificationAsRead',
      notificationId
    }, 'low');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      retryId 
    };
  }
}

// Subscribe to real-time notifications
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: PushNotification[]) => void
): () => void {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PushNotification[];
    
    callback(notifications);
  });
  
  return unsubscribe;
}

// Get unread notification count
export async function getUnreadNotificationCount(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send notification for different events
export async function sendMessageNotification(
  recipientId: string,
  senderName: string,
  messagePreview: string,
  chatId: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  return sendPushNotification({
    userId: recipientId,
    type: 'message',
    title: `Nuevo mensaje de ${senderName}`,
    body: messagePreview,
    data: { chatId, type: 'message' },
    read: false,
    priority: 'high',
    actionUrl: `/chats/${chatId}`
  });
}

export async function sendFriendRequestNotification(
  recipientId: string,
  senderName: string,
  senderId: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  return sendPushNotification({
    userId: recipientId,
    type: 'friend_request',
    title: 'Nueva solicitud de amistad',
    body: `${senderName} te ha enviado una solicitud de amistad`,
    data: { senderId, type: 'friend_request' },
    read: false,
    priority: 'normal',
    actionUrl: '/friends'
  });
}

// Send tournament notification
export async function sendTournamentNotification(
  userId: string,
  tournamentTitle: string,
  notificationType: 'registered' | 'waitlisted' | 'moved-from-waitlist' | 'tournament-starting' | 'tournament-cancelled',
  tournamentId: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  try {
    let title: string;
    let body: string;
    let priority: 'low' | 'normal' | 'high' = 'normal';

    switch (notificationType) {
      case 'registered':
        title = 'Registro confirmado';
        body = `Te has registrado exitosamente en ${tournamentTitle}`;
        break;
      case 'waitlisted':
        title = 'En lista de espera';
        body = `Has sido agregado a la lista de espera de ${tournamentTitle}`;
        break;
      case 'moved-from-waitlist':
        title = '¡Registro confirmado!';
        body = `Has sido movido de la lista de espera a participante activo en ${tournamentTitle}`;
        priority = 'high';
        break;
      case 'tournament-starting':
        title = 'Torneo iniciando';
        body = `${tournamentTitle} está a punto de comenzar`;
        priority = 'high';
        break;
      case 'tournament-cancelled':
        title = 'Torneo cancelado';
        body = `${tournamentTitle} ha sido cancelado`;
        priority = 'high';
        break;
      default:
        title = 'Actualización de torneo';
        body = `Hay una actualización sobre ${tournamentTitle}`;
    }

    return await sendPushNotification({
      userId,
      type: 'tournament_invite',
      title,
      body,
      priority,
      read: false,
      actionUrl: `/tournaments/${tournamentId}`,
      data: {
        tournamentId,
        tournamentTitle,
        notificationType,
        type: 'tournament'
      }
    });
  } catch (error) {
    console.error('Error sending tournament notification:', error);
    return { success: false, error: 'Failed to send tournament notification' };
  }
}

export async function sendMatchFoundNotification(
  userId: string,
  matchedUserName: string,
  game: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  return sendPushNotification({
    userId,
    type: 'match_found',
    title: '¡Match encontrado!',
    body: `Encontramos un compañero para ${game}: ${matchedUserName}`,
    data: { game, type: 'match_found' },
    read: false,
    priority: 'high',
    actionUrl: '/matching'
  });
}

export async function sendTournamentInviteNotification(
  userId: string,
  tournamentName: string,
  tournamentId: string
): Promise<{ success: boolean; error?: string; retryId?: string }> {
  return sendPushNotification({
    userId,
    type: 'tournament_invite',
    title: 'Invitación a torneo',
    body: `Has sido invitado al torneo: ${tournamentName}`,
    data: { tournamentId, type: 'tournament_invite' },
    read: false,
    priority: 'normal',
    actionUrl: `/tournaments/${tournamentId}`
  });
}

// Request notification permission
export async function requestNotificationPermission(): Promise<{
  success: boolean;
  permission?: NotificationPermission;
  error?: string;
}> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Este navegador no soporta notificaciones' };
    }
    
    if (Notification.permission === 'granted') {
      return { success: true, permission: 'granted' };
    }
    
    const permission = await Notification.requestPermission();
    
    return { 
      success: permission === 'granted', 
      permission,
      error: permission === 'denied' ? 'Permisos de notificación denegados' : undefined
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Initialize service worker for push notifications
export async function initializePushNotifications(): Promise<{
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}> {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { success: false, error: 'Service Workers no están soportados' };
    }
    
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    return { success: true, registration };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Clean up expired notifications
export async function cleanupExpiredNotifications(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const expiredQuery = query(
      collection(db, 'notifications'),
      where('expiresAt', '<=', new Date())
    );
    
    const snapshot = await getDocs(expiredQuery);
    const deletePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { active: false })
    );
    
    await Promise.all(deletePromises);
    
    return { success: true, deletedCount: snapshot.size };
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}