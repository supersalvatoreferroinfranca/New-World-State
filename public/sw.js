// New World State PWA Service Worker - v2
const CACHE_NAME = 'nws-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Helper to read state from cache (since Service Workers don't have localStorage)
async function getState(key, defaultValue) {
  try {
    const cache = await caches.open('nws-notif-state');
    const response = await cache.match('/' + key);
    if (response) {
      const text = await response.text();
      return text;
    }
  } catch (e) {
    console.error('[SW-STATE-READ-ERR]', e);
  }
  return defaultValue;
}

// Helper to save state to cache
async function saveState(key, value) {
  try {
    const cache = await caches.open('nws-notif-state');
    await cache.put('/' + key, new Response(String(value)));
  } catch (e) {
    console.error('[SW-STATE-WRITE-ERR]', e);
  }
}

// Background content checker to trigger native notifications even when app is closed
async function checkNewContent() {
  if (!self.Notification || self.Notification.permission !== 'granted') {
    return;
  }

  const origin = self.location ? self.location.origin : '';
  const iconUrl = origin ? `${origin}/android-chrome-192x192.png?v=3` : '/android-chrome-192x192.png?v=3';

  // 1. Check Broadcasts
  try {
    const res = await fetch('/api/broadcasts/latest');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const lastSeenIdStr = await getState('last_seen_broadcast_id', '0');
        const lastSeenId = parseInt(lastSeenIdStr, 10);
        
        // Find max ID in response
        const maxId = Math.max(...data.data.map(b => b.id));
        
        if (lastSeenId === 0) {
          // Initialize without sending notifications for historical records
          await saveState('last_seen_broadcast_id', String(maxId));
        } else if (maxId > lastSeenId) {
          // Filter and sort newer broadcasts
          const newBroadcasts = data.data
            .filter(b => b.id > lastSeenId)
            .sort((a, b) => a.id - b.id);
            
          for (const b of newBroadcasts) {
            await self.registration.showNotification(`📢 ${b.title}`, {
              body: b.content.length > 100 ? b.content.substring(0, 97) + '...' : b.content,
              icon: iconUrl,
              badge: iconUrl,
              vibrate: [100, 50, 100],
              data: { url: '/democracy' }
            });
          }
          await saveState('last_seen_broadcast_id', String(maxId));
        }
      }
    }
  } catch (e) {
    console.debug('[SW] Errore verifica broadcast:', e);
  }

  // 2. Check convalidated proposals
  try {
    const res = await fetch('/api/democracy/proposals');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const approvedProposals = data.data.filter(p => p.status === 'approved');
        if (approvedProposals.length > 0) {
          const lastSeenCountStr = await getState('last_seen_approved_count', '-1');
          const lastSeenCount = parseInt(lastSeenCountStr, 10);
          const currentCount = approvedProposals.length;
          
          if (lastSeenCount === -1) {
            await saveState('last_seen_approved_count', String(currentCount));
          } else if (currentCount > lastSeenCount) {
            // Find newest approved proposal
            const newest = approvedProposals.sort((a, b) => b.id - a.id)[0];
            if (newest) {
              await self.registration.showNotification(`🏛️ Nuovo Referendum Convalidato!`, {
                body: `È aperta la votazione per: "${newest.title}"`,
                icon: iconUrl,
                badge: iconUrl,
                vibrate: [150, 80, 150],
                data: { url: '/democracy' }
              });
            }
            await saveState('last_seen_approved_count', String(currentCount));
          }
        }
      }
    }
  } catch (e) {
    console.debug('[SW] Errore verifica proposte convalidate:', e);
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

// Self-healing interval polling when active
let pollInterval = null;
function startIntervalPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    checkNewContent();
  }, 45000); // Check every 45 seconds when SW is awake
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkNewContent().then(() => startIntervalPolling())
    ])
  );
});

// Periodic Background Sync Event
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'nws-sync') {
    event.waitUntil(checkNewContent());
  }
});

// One-off Background Sync Event
self.addEventListener('sync', (event) => {
  if (event.tag === 'nws-sync') {
    event.waitUntil(checkNewContent());
  }
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy with cached fallback for maximum interactive reliability
  if (event.request.method !== 'GET') return;
  
  // When user navigates or opens the site, trigger a background check immediately
  if (event.request.mode === 'navigate') {
    event.waitUntil(checkNewContent());
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Real-time Push and Notification Handler
self.addEventListener('push', (event) => {
  let data = { title: 'New World State Test Notification', body: 'Nuovo aggiornamento federale.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const origin = self.location ? self.location.origin : '';
  const iconUrl = origin ? `${origin}/android-chrome-192x192.png?v=3` : '/android-chrome-192x192.png?v=3';
  const options = {
    body: data.body,
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
