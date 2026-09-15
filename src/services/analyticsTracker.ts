/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Privacy-First Analytics & Community Telemetry Tracker
 * Conforme GDPR - Zero cookie di terze parti - Raccolta dati aggregata e anonima.
 */

// Chiavi di storage per sessione anonima locale
const SESSION_ID_KEY = 'nws_analytics_session_id';
const VISITOR_ID_KEY = 'nws_analytics_visitor_id';
const LAST_ACTIVITY_KEY = 'nws_analytics_last_active';

interface TrackPayload {
  eventType: 'pageview' | 'heartbeat' | 'leave' | 'interaction';
  tab?: string;
  path?: string;
  articleSlug?: string;
  articleTitle?: string;
  timeSpentSeconds?: number;
  eventName?: string;
  eventData?: Record<string, any>;
  referrer?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  visitorId?: string;
  sessionId?: string;
  isNewVisitor?: boolean;
}

let currentSessionId = '';
let currentVisitorId = '';
let isNewVisitor = false;
let pageStartTime = Date.now();
let currentPageTab = 'welcome';
let currentArticleSlug: string | undefined = undefined;
let currentArticleTitle: string | undefined = undefined;
let heartbeatInterval: any = null;

// Rileva dispositivo in modo affidabile
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return 'tablet';
  }
  if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds)/.test(ua)) {
    return 'mobile';
  }
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

// Rileva Browser
function getBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge') || ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser Moderno';
}

// Rileva Sistema Operativo
function getOS(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  return 'Altro';
}

// Inizializza o recupera ID sessione e visitatore anonimi
function initSession() {
  if (typeof window === 'undefined') return;

  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
      isNewVisitor = true;
    } else {
      isNewVisitor = false;
    }
    currentVisitorId = vid;

    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    const lastActive = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
    const now = Date.now();

    // Nuova sessione se inattivo da più di 30 minuti o non presente
    if (!sid || (now - lastActive > 30 * 60 * 1000)) {
      sid = 's_' + Math.random().toString(36).substring(2, 11) + now.toString(36);
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    sessionStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    currentSessionId = sid;
  } catch (e) {
    currentVisitorId = 'v_fallback_' + Math.random().toString(36).substring(2, 8);
    currentSessionId = 's_fallback_' + Math.random().toString(36).substring(2, 8);
  }
}

// Invia evento al server in modo asincrono / non bloccante
async function sendAnalytics(payload: TrackPayload) {
  if (typeof window === 'undefined') return;
  initSession();

  const fullPayload: TrackPayload = {
    ...payload,
    visitorId: currentVisitorId,
    sessionId: currentSessionId,
    isNewVisitor: isNewVisitor,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    language: navigator.language || 'it-IT',
    screenResolution: `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
    referrer: document.referrer || (payload.referrer || ''),
    path: window.location.pathname + window.location.search
  };

  const bodyStr = JSON.stringify(fullPayload);

  // Usa Beacon API se disponibile durante l'uscita pagina, altrimenti fetch
  if (payload.eventType === 'leave' && navigator.sendBeacon) {
    try {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
      return;
    } catch (_) {}
  }

  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      keepalive: true
    }).catch(() => {});
  } catch (_) {}
}

/**
 * Traccia una nuova visualizzazione pagina o cambio tab
 */
export function trackPageView(tab: string, articleSlug?: string, articleTitle?: string) {
  if (typeof window === 'undefined') return;
  
  // Calcola e invia il tempo speso sulla pagina precedente prima di passare alla nuova
  const now = Date.now();
  const timeSpentOnPrevPage = Math.round((now - pageStartTime) / 1000);
  
  if (timeSpentOnPrevPage > 1) {
    sendAnalytics({
      eventType: 'leave',
      tab: currentPageTab,
      articleSlug: currentArticleSlug,
      articleTitle: currentArticleTitle,
      timeSpentSeconds: Math.min(timeSpentOnPrevPage, 3600) // cap a 1 ora
    });
  }

  // Aggiorna stato corrente
  currentPageTab = tab;
  currentArticleSlug = articleSlug;
  currentArticleTitle = articleTitle;
  pageStartTime = Date.now();

  // Invia evento pageview
  sendAnalytics({
    eventType: 'pageview',
    tab: tab,
    articleSlug: articleSlug,
    articleTitle: articleTitle
  });

  // Avvia/Riavvia Heartbeat ogni 20 secondi per misurare il tempo di permanenza attivo
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - pageStartTime) / 1000);
    if (elapsed > 3600) {
      clearInterval(heartbeatInterval);
      return;
    }
    sendAnalytics({
      eventType: 'heartbeat',
      tab: currentPageTab,
      articleSlug: currentArticleSlug,
      articleTitle: currentArticleTitle,
      timeSpentSeconds: elapsed
    });
  }, 20000);
}

/**
 * Traccia un evento interattivo della comunità (es. voto espresso, apertura modale, ricerca)
 */
export function trackCommunityEvent(eventName: string, eventData: Record<string, any> = {}) {
  sendAnalytics({
    eventType: 'interaction',
    tab: currentPageTab,
    articleSlug: currentArticleSlug,
    eventName,
    eventData
  });
}

/**
 * Inizializza i listener globali di sessione (visibilitychange, beforeunload)
 */
export function initAnalyticsTracking(initialTab: string = 'welcome') {
  if (typeof window === 'undefined') return;

  initSession();
  trackPageView(initialTab);

  // Gestione chiusura pagina o cambio scheda del browser
  const handleUnloadOrHide = () => {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    if (timeSpent >= 1) {
      sendAnalytics({
        eventType: 'leave',
        tab: currentPageTab,
        articleSlug: currentArticleSlug,
        articleTitle: currentArticleTitle,
        timeSpentSeconds: Math.min(timeSpent, 3600)
      });
    }
  };

  window.addEventListener('beforeunload', handleUnloadOrHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleUnloadOrHide();
    } else {
      pageStartTime = Date.now();
    }
  });
}
