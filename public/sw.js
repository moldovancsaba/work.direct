// Service Worker for PlayMass PWA
// Provides offline functionality, caching strategies, and background sync
// Version: 4.11.0

const CACHE_VERSION = 'v4.11.0';
const CACHE_NAME = `playmass-${CACHE_VERSION}`;

// Define cache strategies for different resource types
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// API endpoints that should be cached with network-first strategy
const API_CACHE_PATTERNS = [
  '/api/maps',
  '/api/participants',
  '/api/game-types',
];

// Static assets that should be cached with cache-first strategy
const STATIC_CACHE_PATTERNS = [
  /\.(js|css|woff2|woff|ttf|eot)$/,
  /\/_next\/static\//,
  /\/images\//,
];

// Install event - precache essential resources
// WHY: Ensures core app shell is available immediately for offline use
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        // WHY: Ensures new SW takes control immediately without waiting for page reload
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
// WHY: Removes outdated cache versions to free up storage and prevent stale content
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('playmass-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        // WHY: Ensures SW starts controlling pages without requiring reload
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
// WHY: Provides offline functionality and improves performance through strategic caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  // WHY: We only cache same-origin resources to avoid CORS issues
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Chrome extension requests
  // WHY: Extensions should not be cached or intercepted
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network First strategy
  // WHY: Always try to get fresh data, fall back to cache if offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache First strategy
  // WHY: Static assets rarely change, prioritize cache for performance
  if (STATIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - Network First strategy
  // WHY: Always try to get fresh content, fall back to cache or offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, true));
    return;
  }

  // Default - Network First strategy
  event.respondWith(networkFirst(request));
});

// Network First Strategy
// WHY: Prioritizes fresh data but provides offline fallback
async function networkFirst(request, isNavigation = false) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    // WHY: Store successful responses for offline availability
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return offline page
    // WHY: Provides user-friendly offline experience instead of browser error
    if (isNavigation) {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Return a basic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

// Cache First Strategy
// WHY: Maximizes performance for static assets that rarely change
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the new resource
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache and network both failed:', request.url);
    return new Response('Resource not available', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

// Push notification event
// WHY: Handles incoming push notifications from the server
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };
  
  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    notificationData = {
      title: 'PlayMass Notification',
      body: 'You have a new notification',
    };
  }
  
  const title = notificationData.title || 'PlayMass';
  const body = notificationData.body || 'You have a new notification';
  const data = notificationData.data || {};
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      ...options,
      data,
    })
  );
});

// Notification click event
// WHY: Handles user interaction with push notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  // Determine target URL from notification data
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (future enhancement)
// WHY: Enables queuing of failed requests for retry when connection restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-game-results') {
    event.waitUntil(syncGameResults());
  }
});

// Sync game results that failed while offline
// WHY: Ensures game results are eventually submitted even if network was unavailable
async function syncGameResults() {
  // This is a placeholder for future implementation
  // In a full implementation, we would:
  // 1. Retrieve queued game results from IndexedDB
  // 2. Attempt to POST them to the server
  // 3. Remove successfully synced results from the queue
  console.log('[SW] Syncing game results...');
}

// Message event - handle messages from clients
// WHY: Allows bidirectional communication between SW and app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urlsToCache))
    );
  }
});
