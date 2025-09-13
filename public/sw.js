// Enhanced Service Worker for Offline Support and Push Notifications
const CACHE_NAME = 'squadup-v2';
const STATIC_CACHE = 'squadup-static-v2';
const DYNAMIC_CACHE = 'squadup-dynamic-v2';
const API_CACHE = 'squadup-api-v2';

// URLs to cache on install
const STATIC_URLS = [
  '/',
  '/offline.html',
  '/icon-192x192.png',
  '/badge-72x72.png',
  '/logo.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth',
  '/api/profile',
  '/api/posts',
  '/api/matches'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_URLS)),
      caches.open(API_CACHE).then(cache => {
        // Pre-cache critical API endpoints
        return Promise.allSettled(
          API_ENDPOINTS.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response.clone());
              }
            }).catch(() => {})
          )
        );
      })
    ])
  );
  self.skipWaiting();
});

// Enhanced fetch event with multiple cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests: Network first, then cache
    event.respondWith(networkFirstStrategy(request));
  } else if (STATIC_URLS.includes(url.pathname) || url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Static resources: Cache first, then network
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // HTML pages: Stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline fallback for API requests
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'No hay conexión disponible',
      cached: false 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache first strategy for static resources
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static resource:', request.url);
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Stale while revalidate strategy for HTML pages
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // If network fails and we have no cache, return offline page
    if (!cachedResponse) {
      return caches.match('/offline.html');
    }
  });
  
  return cachedResponse || fetchPromise;
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'SquadUp',
    body: 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {}
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.type || notificationData.tag,
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.priority === 'high',
        silent: data.priority === 'low'
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  );
  
  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    
    switch (event.action) {
      case 'reply':
        // Handle reply action
        break;
      case 'view':
        // Handle view action
        break;
      default:
        break;
    }
  }
  
  // Navigate to the app
  const urlToOpen = event.notification.data?.actionUrl || '/';
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    
    // If no window/tab is already open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Perform background sync operations
    console.log('Performing background sync...');
    
    // You can add logic here to sync data when the user comes back online
    // For example, retry failed operations, sync messages, etc.
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    if (pendingActions.length === 0) {
      console.log('No pending actions to sync');
      return;
    }
    
    console.log(`Syncing ${pendingActions.length} offline actions...`);
    
    for (const action of pendingActions) {
      try {
        await executeOfflineAction(action);
        await removePendingAction(action.id);
        console.log('Synced action:', action.type);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep action for retry
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: pendingActions.length
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Execute a pending offline action
async function executeOfflineAction(action) {
  const { type, url, data, method = 'POST' } = action;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Get pending actions from storage
async function getPendingActions() {
  try {
    // Try to get from IndexedDB first, fallback to postMessage to main thread
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data.actions || []);
        };
        
        clients[0].postMessage({
          type: 'GET_PENDING_ACTIONS'
        }, [channel.port2]);
        
        // Timeout after 5 seconds
        setTimeout(() => resolve([]), 5000);
      });
    }
    return [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
}

// Remove a pending action from storage
async function removePendingAction(actionId) {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'REMOVE_PENDING_ACTION',
      actionId
    });
  }
}

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![
              CACHE_NAME, 
              STATIC_CACHE, 
              DYNAMIC_CACHE, 
              API_CACHE
            ].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Error event
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
  event.preventDefault();
});