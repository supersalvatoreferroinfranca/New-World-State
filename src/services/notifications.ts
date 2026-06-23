// New World State Notification & PWA registration service

export interface NWSNotification {
  id: string;
  title: string;
  body: string;
  type: 'referendum' | 'personal' | 'news';
  timestamp: Date;
  read: boolean;
  url?: string;
}

// Global listen callbacks for components to react to new notifications
type NotificationCallback = (notif: NWSNotification) => void;
const listeners = new Set<NotificationCallback>();

export function subscribeToAppNotifications(callback: NotificationCallback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// In-app notifications stored dynamically for immediate rendering if system popups are blocked by iFrames
let localNotificationsBuffer: NWSNotification[] = [];

export function getLocalNotifications(): NWSNotification[] {
  try {
    const saved = localStorage.getItem('nws_local_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  } catch (e) {
    console.error('[NOTIF-LOAD-ERR]', e);
  }
  return localNotificationsBuffer;
}

export function saveLocalNotifications(notifs: NWSNotification[]) {
  localNotificationsBuffer = notifs;
  try {
    localStorage.setItem('nws_local_notifications', JSON.stringify(notifs));
  } catch (e) {
    console.error('[NOTIF-SAVE-ERR]', e);
  }
}

// Register PWA Service Worker
export async function registerPWAResources() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  // Safe-guard to prevent security exceptions in sandboxed iframes (e.g. AI Studio preview)
  try {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      console.log('[PWA-SW] Service Worker registration skipped inside preview iframe.');
      return;
    }
  } catch (e) {
    // In extremely sandboxed iframes, accessing window.top might throw a security error directly
    console.log('[PWA-SW] Context is sandboxed, skipping Service Worker registration.');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('[PWA-SW] Service Worker registrato con successo. Scopo:', registration.scope);
  } catch (err) {
    console.warn('[PWA-SW] Registrazione Service Worker non riuscita:', err);
  }
}

// Check if browser notifications are subscribed (stored in localStorage for persistence)
export function getSubscriptionStatus(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nws_notifications_enabled') === 'true';
}

// Check core permission state
export function getBrowserPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission
export async function requestBrowserPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('nws_notifications_enabled', 'true');
    } else {
      localStorage.setItem('nws_notifications_enabled', 'false');
    }
    return permission;
  } catch (err) {
    console.warn('[NOTIF-PERMISSION-ERR] Errore richiesta permesso:', err);
    // Sandboxed iframe permission restrictions fallback
    localStorage.setItem('nws_notifications_enabled', 'true'); // Simulate subscription inside sandboxed environments
    return 'granted';
  }
}

// Opt out of notifications
export function unsubscribeFromNotifications() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nws_notifications_enabled', 'false');
  }
}

// Trigger real browser Notification AND fallback in-app card
export async function triggerNotification(title: string, body: string, type: 'referendum' | 'personal' | 'news', url?: string) {
  const isEnabled = getSubscriptionStatus();
  if (!isEnabled) return;

  const newNotif: NWSNotification = {
    id: Math.random().toString(36).substring(2, 11),
    title,
    body,
    type,
    timestamp: new Date(),
    read: false,
    url
  };

  // Add to local storage notifications history
  const list = getLocalNotifications();
  // Prevent duplicate messages
  const duplicate = list.find(n => n.title === title && n.body === body);
  if (!duplicate) {
    list.unshift(newNotif);
    saveLocalNotifications(list.slice(0, 50)); // Keep last 50
    
    // Alert components
    listeners.forEach(cb => cb(newNotif));
  }

  // Standard web browser notification implementation
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Direct via service worker if possible
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body,
          icon: '/nws-logo.svg',
          badge: '/nws-logo.svg',
          vibrate: [150, 80, 150],
          data: { url }
        } as any);
      } else {
        // Fallback to absolute standard browser window popup
        new Notification(title, {
          body,
          icon: '/nws-logo.svg'
        });
      }
    } catch (apiErr) {
      console.log('[NOTIF-API-BLOCKED] Native popup blocked (expected in sandboxed iframe environment):', apiErr);
    }
  }
}

// Active syncing state tracker to monitor status updates
let syncIntervalId: any = null;
let lastKnownProposalsCount = -1;
let lastKnownStatus = '';

export function startBackgroundSync(citizenId: number | null, onStatusChange?: (newStatus: string) => void) {
  if (typeof window === 'undefined') return;
  if (syncIntervalId) clearInterval(syncIntervalId);

  // Initial checks
  performSyncChecks(citizenId, onStatusChange);

  // Poll every 30 seconds for live direct response updates
  syncIntervalId = setInterval(() => {
    performSyncChecks(citizenId, onStatusChange);
  }, 30000);
}

export function stopBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

async function performSyncChecks(citizenId: number | null, onStatusChange?: (newStatus: string) => void) {
  const isEnabled = getSubscriptionStatus();
  if (!isEnabled) return;

  // 1. Scan for new convalidated referendums in Albo/Proposals
  try {
    const res = await fetch('/api/democracy/proposals');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const activeCount = data.data.filter((p: any) => p.status === 'approved').length;
        
        if (lastKnownProposalsCount !== -1 && activeCount > lastKnownProposalsCount) {
          // Identify new proposal
          const approvedOnes = data.data.filter((p: any) => p.status === 'approved');
          const newest = approvedOnes[0];
          if (newest) {
            triggerNotification(
              `🏛️ Nuovo Referendum Convalidato!`,
              `Accedi per votare: "${newest.title}"`,
              'referendum',
              '/democracy'
            );
          }
        }
        lastKnownProposalsCount = activeCount;
      }
    }
  } catch (e) {
    console.debug('[SYNC-PROPOSALS-FAILED]', e);
  }

  // 2. Personal updates check: if user is logged in, sync status
  if (citizenId !== null) {
    try {
      const res = await fetch(`/api/admin/citizen-card?id=${citizenId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const currentStatus = data.data.status;
          
          if (lastKnownStatus && lastKnownStatus !== currentStatus) {
            let title = 'Aggiornamento Registro Cittadinanza';
            let msg = `Il tuo profilo del New World State è stato impostato su "${currentStatus}".`;
            
            if (currentStatus === 'approved') {
              title = '🇺🇳 Cittadinanza Convalidata!';
              msg = 'La tua richiesta è stata approvata dagli ufficiali! Il tuo Passaporto Federale è ora attivo e puoi accedere al Portale di Voto.';
            } else if (currentStatus === 'rejected') {
              title = '⚠️ Documentazione Incompleta';
              msg = `La tua richiesta richiede revisione. Motivazione: ${data.data.rejection_reason || 'Documento non leggibile'}`;
            }

            triggerNotification(title, msg, 'personal');
            if (onStatusChange) onStatusChange(currentStatus);
          }
          lastKnownStatus = currentStatus;
        }
      }
    } catch (e) {
      console.debug('[SYNC-CITIZEN-FAILED]', e);
    }
  }

  // 3. Scan for new broadcast messages
  try {
    const res = await fetch('/api/broadcasts/latest');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const lastSeenIdStr = localStorage.getItem('nws_last_seen_broadcast_id');
        const lastSeenId = lastSeenIdStr ? parseInt(lastSeenIdStr, 10) : 0;
        
        // Filter for broadcasts newer than lastSeenId
        const newBroadcasts = data.data.filter((b: any) => b.id > lastSeenId);
        if (newBroadcasts.length > 0) {
          // Sort ascending so they are triggered in order
          const sortedNew = [...newBroadcasts].sort((a: any, b: any) => a.id - b.id);
          for (const b of sortedNew) {
            triggerNotification(
              `📢 ${b.title}`,
              b.content.length > 100 ? b.content.substring(0, 97) + '...' : b.content,
              'news'
            );
          }
          // Save max ID
          const maxId = Math.max(...newBroadcasts.map((b: any) => b.id));
          localStorage.setItem('nws_last_seen_broadcast_id', String(maxId));
        }
      }
    }
  } catch (e) {
    console.debug('[SYNC-BROADCASTS-FAILED]', e);
  }
}
