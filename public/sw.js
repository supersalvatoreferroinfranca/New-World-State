// New World State PWA Service Worker - v2.1
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

// Helper to check if a specific tab path is active and visible
async function isTabActive(path) {
  try {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      const url = new URL(client.url);
      if (url.pathname === path && client.visibilityState === 'visible') {
        return true;
      }
    }
  } catch (e) {
    console.error('[SW-VISIBILITY-CHECK-ERR]', e);
  }
  return false;
}

// Helper to check if ANY tab of the app is active and visible
async function isAnyClientVisible() {
  try {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if (client.visibilityState === 'visible') {
        return true;
      }
    }
  } catch (e) {
    console.error('[SW-ANY-VISIBILITY-CHECK-ERR]', e);
  }
  return false;
}

// Background content checker to trigger native notifications even when app is closed
async function checkNewContent() {
  if (!self.Notification || self.Notification.permission !== 'granted') {
    return;
  }

  // Se l'app è attualmente aperta e visibile in primo piano su qualsiasi scheda,
  // lasciamo che sia l'app React stessa a gestire i controlli e le notifiche.
  // Questo evita notifiche doppie o spam insistenti durante l'uso attivo del portale.
  const appVisible = await isAnyClientVisible();
  if (appVisible) {
    return;
  }

  const origin = self.location ? self.location.origin : '';
  const iconUrl = origin ? `${origin}/android-chrome-192x192.png?v=3` : '/android-chrome-192x192.png?v=3';

  // 1. Check Broadcasts
  try {
    const democracyActive = await isTabActive('/democracy');
    if (!democracyActive) {
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
              
            if (newBroadcasts.length > 0) {
              // Only notify about the newest broadcast to avoid spamming the user
              const newest = newBroadcasts[newBroadcasts.length - 1];
              await self.registration.showNotification(`📢 ${newest.title}`, {
                body: newest.content.length > 100 ? newest.content.substring(0, 97) + '...' : newest.content,
                icon: iconUrl,
                badge: iconUrl,
                vibrate: [100, 50, 100],
                tag: `broadcast_${newest.id}`,
                data: { url: '/democracy' }
              });
            }
            await saveState('last_seen_broadcast_id', String(maxId));
          }
        }
      }
    }
  } catch (e) {
    console.debug('[SW] Errore verifica broadcast:', e);
  }

  // 2. Check convalidated proposals
  try {
    const democracyActive = await isTabActive('/democracy');
    if (!democracyActive) {
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
                  tag: `referendum_${newest.id}`,
                  data: { url: '/democracy' }
                });
              }
              await saveState('last_seen_approved_count', String(currentCount));
            }
          }
        }
      }
    }
  } catch (e) {
    console.debug('[SW] Errore verifica proposte convalidate:', e);
  }

  // 3. Check unread chat messages
  try {
    const chatActive = await isTabActive('/chat');
    if (!chatActive) {
      const senderName = await getState('sender_name', '');
      const citizenCode = await getState('citizen_code', '');
      if (senderName) {
        let lastSeenTimestamp = await getState('last_seen_chat_timestamp', '');
        if (!lastSeenTimestamp) {
          lastSeenTimestamp = new Date().toISOString();
          await saveState('last_seen_chat_timestamp', lastSeenTimestamp);
        } else {
          const res = await fetch(`/api/chat/unread?senderName=${encodeURIComponent(senderName)}&citizenCode=${encodeURIComponent(citizenCode)}&since=${encodeURIComponent(lastSeenTimestamp)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
              const notifiedIdsStr = await getState('notified_msg_ids', '[]');
              let notifiedIds = [];
              try {
                notifiedIds = JSON.parse(notifiedIdsStr);
              } catch (err) {}

              const newMessages = data.messages.filter(msg => !notifiedIds.includes(msg.id));

              if (newMessages.length === 1) {
                const msg = newMessages[0];
                await self.registration.showNotification(`💬 Messaggio da ${msg.senderName}`, {
                  body: msg.text || (msg.type === 'audio' ? '🎵 Messaggio vocale' : '📁 File allegato'),
                  icon: iconUrl,
                  badge: iconUrl,
                  vibrate: [150, 80, 150],
                  tag: `msg_${msg.id}`,
                  data: { url: '/democracy?tab=chat' }
                });
                notifiedIds.push(msg.id);
                await saveState('notified_msg_ids', JSON.stringify(notifiedIds.slice(-100)));
              } else if (newMessages.length > 1) {
                await self.registration.showNotification(`💬 ${newMessages.length} Nuovi Messaggi`, {
                  body: `Hai ricevuto nuovi messaggi in chat. Accedi per leggerli.`,
                  icon: iconUrl,
                  badge: iconUrl,
                  vibrate: [150, 80, 150],
                  tag: `msg_grouped_${Date.now()}`,
                  data: { url: '/democracy?tab=chat' }
                });
                newMessages.forEach(msg => notifiedIds.push(msg.id));
                await saveState('notified_msg_ids', JSON.stringify(notifiedIds.slice(-100)));
              }
              // Update last seen timestamp
              const timestamps = data.messages.map(m => new Date(m.timestamp).getTime());
              const maxTime = new Date(Math.max(...timestamps)).toISOString();
              await saveState('last_seen_chat_timestamp', maxTime);
            }
          }
        }
      }
    }
  } catch (e) {
    console.debug('[SW] Errore verifica chat non letti:', e);
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
    tag: data.tag || data.id || `push_${Date.now()}`,
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
      const origin = self.location ? self.location.origin : '';
      const absoluteTargetUrl = new URL(targetUrl, origin).href;

      for (const client of windowClients) {
        if (client.url === absoluteTargetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If there is an existing window of this app open (any page), navigate it to the targetUrl and focus it!
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(absoluteTargetUrl);
        if (clientUrl.origin === targetUrlObj.origin && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(absoluteTargetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteTargetUrl);
      }
    })
  );
});
