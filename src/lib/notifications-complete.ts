// Firebase messaging disabled to prevent connection errors
// import { initializeApp } from 'firebase/app';
// import { getMessaging, getToken } from 'firebase/messaging';
// import { firebaseConfig } from './firebase';

// Initialize Firebase - DISABLED
// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);
const messaging = null;

// VAPID key for FCM (replace with your actual VAPID key)
const VAPID_KEY = 'your-vapid-key-here';

// Request notification permission - DISABLED
export async function requestNotificationPermission(): Promise<string | null> {
  console.log('Notifications disabled to prevent connection errors');
  return null;
}

// onMessageListener removed to prevent automatic Firebase connections

// Show notification
export function showNotification(title: string, body: string, icon?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/icon-192x192.png'
    });
  }
}

// Initialize notifications - DISABLED
export async function initializeNotifications() {
  console.log('Notifications initialization disabled to prevent connection errors');
  // Service worker registration disabled
  // if ('serviceWorker' in navigator) {
  //   try {
  //     await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  //     console.log('Service Worker registered successfully');
  //   } catch (error) {
  //     console.error('Service Worker registration failed:', error);
  //   }
  // }
  
  return await requestNotificationPermission();
}

export { messaging };