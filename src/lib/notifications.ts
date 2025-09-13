// Firebase messaging imports disabled to prevent automatic connections
import { getToken, onMessage } from 'firebase/messaging';
// import { messaging } from './firebase';
import { updateUserProfile } from './database';

// Messaging disabled - all functions return early
const messaging = null;

// VAPID key for FCM - Loaded from environment variables
// To get your VAPID key: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

// Request permission and get FCM token
export const requestNotificationPermission = async (userId?: string) => {
  try {
    if (!messaging) {
      console.log('Messaging not supported in this environment');
      return { success: false, error: 'Messaging not supported' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      try {
        // Get FCM token with VAPID key
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY
        });
        
        if (token) {
          console.log('FCM token obtained:', token);
          
          // Save token to user profile if userId provided
          if (userId) {
            await updateUserProfile(userId, { fcmToken: token });
            console.log('FCM token saved to user profile');
          }
          
          return { success: true, token };
        } else {
          console.log('No registration token available.');
          return { success: false, error: 'No registration token available' };
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
        return { success: false, error: 'Failed to get FCM token' };
      }
    } else {
      console.log('Notification permission denied.');
      return { success: false, error: 'Notification permission denied' };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error: 'Failed to request permission' };
  }
};

// Setup foreground message handling
export const setupForegroundNotifications = () => {
  if (!messaging) {
    console.log('Messaging not supported in this environment');
    return;
  }

  onMessage(messaging, (payload: any) => {
    console.log('Message received in foreground:', payload);
    
    // Display notification if the app is in foreground
    if (payload.notification) {
      const { title, body, icon } = payload.notification;
      
      // Create and show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title || 'New Message', {
          body: body || '',
          icon: icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'squadgo-battle-notification'
        });
      }
    }
  });
};

// Send notification to specific user (server-side function)
export const sendNotificationToUser = async (userId: string, notification: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  try {
    // This would typically be called from your backend
    // Here's the structure for reference
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};