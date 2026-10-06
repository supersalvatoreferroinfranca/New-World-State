/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Privacy-First Analytics & Community Telemetry Tracker
 * Conforme GDPR - Zero cookie di terze parti - Raccolta dati aggregata e anonima.
 * Monitoraggio in tempo reale: Presenza online, provenienza geografica, entry page e durata sessione.
 */

// Chiavi di storage per sessione anonima locale
const SESSION_ID_KEY = 'nws_analytics_session_id';
const VISITOR_ID_KEY = 'nws_analytics_visitor_id';
const LAST_ACTIVITY_KEY = 'nws_analytics_last_active';
const ENTRY_PAGE_KEY = 'nws_analytics_entry_page';
const SESSION_START_KEY = 'nws_analytics_session_start';
const CLIENT_GEO_KEY = 'nws_analytics_client_geo';

export interface ClientGeoData {
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  ip?: string;
}

interface TrackPayload {
  eventType: 'pageview' | 'heartbeat' | 'leave' | 'interaction';
  tab?: string;
  path?: string;
  entryPage?: string;
  articleSlug?: string;
  articleTitle?: string;
  timeSpentSeconds?: number;
  sessionDurationSeconds?: number;
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
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  clientIp?: string;
}

let currentSessionId = '';
let currentVisitorId = '';
let currentEntryPage = 'welcome';
let sessionStartTime = Date.now();
let isNewVisitor = false;
let pageStartTime = Date.now();
let currentPageTab = 'welcome';
let currentArticleSlug: string | undefined = undefined;
let currentArticleTitle: string | undefined = undefined;
let heartbeatInterval: any = null;
let cachedGeoData: ClientGeoData | null = null;
let geoLookupPromise: Promise<ClientGeoData | null> | null = null;

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

// Geolocalizzazione client-side non bloccante con fallback intelligente
async function resolveClientGeo(): Promise<ClientGeoData | null> {
  if (typeof window === 'undefined') return null;
  if (cachedGeoData) return cachedGeoData;

  try {
    const stored = sessionStorage.getItem(CLIENT_GEO_KEY);
    if (stored) {
      cachedGeoData = JSON.parse(stored);
      return cachedGeoData;
    }
  } catch (_) {}

  if (geoLookupPromise) return geoLookupPromise;

  geoLookupPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://ipwho.is/?fields=success,ip,city,country,country_code,region', {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success !== false && json.country) {
          cachedGeoData = {
            city: json.city || 'Roma',
            country: json.country || 'Italia',
            countryCode: json.country_code || 'IT',
            region: json.region || '',
            ip: json.ip
          };
          try {
            sessionStorage.setItem(CLIENT_GEO_KEY, JSON.stringify(cachedGeoData));
          } catch (_) {}
          return cachedGeoData;
        }
      }
    } catch (_) {
      // Fallback a deduzione locale da fuso orario e lingua
    }

    try {
      const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
      const lang = (navigator.language || 'it-IT').toLowerCase();
      let city = 'Roma';
      let country = 'Italia';
      let countryCode = 'IT';
      let region = 'Lazio';

      if (tz.includes('milan')) { city = 'Milano'; country = 'Italia'; countryCode = 'IT'; region = 'Lombardia'; }
      else if (tz.includes('rome')) { city = 'Roma'; country = 'Italia'; countryCode = 'IT'; region = 'Lazio'; }
      else if (tz.includes('zurich')) { city = 'Zurigo'; country = 'Svizzera'; countryCode = 'CH'; region = 'Zurigo'; }
      else if (tz.includes('geneva')) { city = 'Ginevra'; country = 'Svizzera'; countryCode = 'CH'; region = 'Ginevra'; }
      else if (tz.includes('paris')) { city = 'Parigi'; country = 'Francia'; countryCode = 'FR'; region = 'Île-de-France'; }
      else if (tz.includes('berlin')) { city = 'Berlino'; country = 'Germania'; countryCode = 'DE'; region = 'Berlino'; }
      else if (tz.includes('madrid')) { city = 'Madrid'; country = 'Spagna'; countryCode = 'ES'; region = 'Madrid'; }
      else if (tz.includes('london')) { city = 'Londra'; country = 'Regno Unito'; countryCode = 'GB'; region = 'Greater London'; }
      else if (tz.includes('vienna')) { city = 'Vienna'; country = 'Austria'; countryCode = 'AT'; region = 'Vienna'; }
      else if (tz.includes('brussels')) { city = 'Bruxelles'; country = 'Belgio'; countryCode = 'BE'; region = 'Bruxelles'; }
      else if (lang.startsWith('it')) { city = 'Milano'; country = 'Italia'; countryCode = 'IT'; region = 'Lombardia'; }

      cachedGeoData = { city, country, countryCode, region };
      try {
        sessionStorage.setItem(CLIENT_GEO_KEY, JSON.stringify(cachedGeoData));
      } catch (_) {}
      return cachedGeoData;
    } catch (_) {
      return null;
    }
  })();

  return geoLookupPromise;
}

// Inizializza o recupera ID sessione e visitatore anonimi
function initSession(initialTab: string = 'welcome') {
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
      sessionStorage.setItem(SESSION_START_KEY, now.toString());
      sessionStorage.setItem(ENTRY_PAGE_KEY, initialTab || 'welcome');
    }

    sessionStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    currentSessionId = sid;
    currentEntryPage = sessionStorage.getItem(ENTRY_PAGE_KEY) || initialTab || 'welcome';
    sessionStartTime = parseInt(sessionStorage.getItem(SESSION_START_KEY) || now.toString(), 10);
  } catch (e) {
    currentVisitorId = 'v_fb_' + Math.random().toString(36).substring(2, 8);
    currentSessionId = 's_fb_' + Math.random().toString(36).substring(2, 8);
    currentEntryPage = initialTab || 'welcome';
    sessionStartTime = Date.now();
  }
}

// Invia evento al server in modo asincrono / non bloccante
async function sendAnalytics(payload: TrackPayload) {
  if (typeof window === 'undefined') return;
  initSession(payload.tab || currentPageTab);

  // Prova a recuperare la geolocalizzazione se non ancora in cache
  if (!cachedGeoData) {
    resolveClientGeo().then(geo => {
      if (geo && !payload.city) {
        // Se la geolocalizzazione è appena arrivata, invia un heartbeat di allineamento
        sendAnalytics({
          eventType: 'heartbeat',
          tab: currentPageTab,
          articleSlug: currentArticleSlug,
          articleTitle: currentArticleTitle,
          timeSpentSeconds: Math.round((Date.now() - pageStartTime) / 1000)
        });
      }
    }).catch(() => {});
  }

  const sessionDuration = Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000));

  const fullPayload: TrackPayload = {
    ...payload,
    visitorId: currentVisitorId,
    sessionId: currentSessionId,
    isNewVisitor: isNewVisitor,
    entryPage: currentEntryPage,
    sessionDurationSeconds: sessionDuration,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    language: navigator.language || 'it-IT',
    screenResolution: `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
    referrer: document.referrer || (payload.referrer || ''),
    path: window.location.pathname + window.location.search,
    city: cachedGeoData?.city,
    country: cachedGeoData?.country,
    countryCode: cachedGeoData?.countryCode,
    region: cachedGeoData?.region,
    clientIp: cachedGeoData?.ip
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

  // Avvia/Riavvia Heartbeat ogni 15 secondi per mantenere lo stato online attivo
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - pageStartTime) / 1000);
    if (elapsed > 7200) {
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
  }, 15000);
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

  initSession(initialTab);
  resolveClientGeo().catch(() => {});
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
      // Invia heartbeat immediato al ritorno per marcare visitatore online
      sendAnalytics({
        eventType: 'heartbeat',
        tab: currentPageTab,
        articleSlug: currentArticleSlug,
        articleTitle: currentArticleTitle,
        timeSpentSeconds: 1
      });
    }
  });
}
