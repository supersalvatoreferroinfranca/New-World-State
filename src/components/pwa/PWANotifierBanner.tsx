import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  X, 
  Check, 
  Volume2, 
  Info, 
  Landmark, 
  ShieldCheck,
  Activity,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  Settings,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  getSubscriptionStatus, 
  getBrowserPermission, 
  requestBrowserPermission, 
  unsubscribeFromNotifications, 
  triggerNotification, 
  getLocalNotifications, 
  subscribeToAppNotifications,
  NWSNotification
} from '../../services/notifications';

export default function PWANotifierBanner() {
  const { language } = useI18n();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifHistory, setNotifHistory] = useState<NWSNotification[]>([]);
  const [dismissPwaCard, setDismissPwaCard] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nws_dismiss_pwa') === 'true';
    }
    return false;
  });

  // Diagnostic states
  const [isIframe, setIsIframe] = useState(false);
  const [swStatus, setSwStatus] = useState<'active' | 'missing' | 'unsupported'>('missing');
  const [activeName, setActiveName] = useState('');
  const [activeCode, setActiveCode] = useState('');
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [showDoctor, setShowDoctor] = useState(false);
  const [checkingSW, setCheckingSW] = useState(false);

  const checkSWAndDetails = () => {
    setCheckingSW(true);
    // Detect iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch (_) {
      setIsIframe(true);
    }

    // Check service worker support & registration
    if (typeof window === 'undefined') return;
    
    if (!('serviceWorker' in navigator)) {
      setSwStatus('unsupported');
      setCheckingSW(false);
    } else {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwStatus('active');
        } else {
          setSwStatus('missing');
        }
        setCheckingSW(false);
      }).catch(() => {
        setSwStatus('missing');
        setCheckingSW(false);
      });
    }

    // Extract citizen details for sync visual indicator
    try {
      const cachedCitizen = localStorage.getItem('nws_democracy_citizen') || localStorage.getItem('nws_citizen_profile') || localStorage.getItem('registered_citizen');
      if (cachedCitizen) {
        const citizen = JSON.parse(cachedCitizen);
        setActiveName(`${citizen.firstName || ''} ${citizen.surname || ''}`.trim());
        setActiveCode(citizen.citizenCode || '');
      } else {
        const adminPass = localStorage.getItem('nws_admin_password');
        if (adminPass) {
          setActiveName('Console Centrale');
          setActiveCode('NWS-ADM-001');
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    setIsSubscribed(getSubscriptionStatus());
    setNotifPermission(getBrowserPermission());
    setNotifHistory(getLocalNotifications());
    checkSWAndDetails();

    // Register PWA installation triggers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Subscribe to new incoming reactive notifications
    const unsubscribe = subscribeToAppNotifications((newNotif) => {
      setNotifHistory(prev => [newNotif, ...prev]);
    });

    // Detect if already launched in standalone mode
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubscribe();
    };
  }, []);

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      unsubscribeFromNotifications();
      setIsSubscribed(false);
      setNotifPermission('default');
    } else {
      const permission = await requestBrowserPermission();
      setNotifPermission(permission);
      setIsSubscribed(true);
      
      // Welcome user immediately via dynamic system alert
      setTimeout(() => {
        triggerNotification(
          language === 'en' ? '🔔 Notifications Activated!' : '🔔 Notifiche Browser Attivate!',
          language === 'en' 
            ? 'You will now receive instant alerts for NWS voting and citizen responses.' 
            : 'Riceverai avvisi istantanei per votazioni NWS e aggiornamenti sul tuo profilo.',
          'news'
        );
      }, 500);
    }
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      // Guide iPhone/Safari manually
      alert(
        language === 'en'
          ? "✨ To add NWS to your Home Screen on iOS:\n1. Tap the Share button (bottom arrow icon)\n2. Select 'Add to Home Screen' (+ icon)\n3. Fast access is now configured in 1 click!"
          : "✨ Per aggiungere il portale alla Home su iOS/Safari:\n1. Tocca il tasto Condividi (icona quadrata con freccia in alto)\n2. Scorri e seleziona 'Aggiungi alla schermata Home' (tasto +)\n3. Potrai accedere alla consolle in un click!"
      );
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const clearNotificationCache = () => {
    localStorage.removeItem('nws_local_notifications');
    setNotifHistory([]);
  };

  const triggerTestAlert = () => {
    triggerNotification(
      language === 'en' ? '📢 Citizen General Update' : '📢 Comunicazione di Servizio',
      language === 'en' 
        ? 'Direct Democracy servers are operational. Direct feedback loop verified.' 
        : 'I server della democrazia diretta sono operativi sul Edge. Connessione cifrata verificata.',
      'news'
    );
  };

  const handleDismissPwaCard = () => {
    localStorage.setItem('nws_dismiss_pwa', 'true');
    setDismissPwaCard(true);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="w-full space-y-6" id="pwa-notif-control-panel">
      {/* 1. TOP PWA PROMPT BANNER */}
      {!isInstalled && !dismissPwaCard && (
        <div className="bg-gradient-to-r from-[#0a1c3e] to-[#152b54] text-[#f7f5f0] p-5 rounded-2xl border border-brand-gold/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative">
            <div className="p-3 bg-brand-gold/15 text-brand-gold rounded-xl border border-brand-gold/25 mt-0.5">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#f7f5f0] uppercase tracking-wide flex items-center gap-1.5">
                {language === 'en' ? '📱 Install Official WebApp' : '📱 Installa l\'App del Portale'}
                <span className="text-[9px] bg-brand-gold text-[#0a1c3e] font-bold font-mono px-1.5 py-0.5 rounded uppercase">PWA 1.0</span>
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
                {language === 'en'
                  ? 'Access your private citizen console in just one click directly from your smartphone home screen. Faster, secure, offline ready.'
                  : 'Accedi alla tua consolle privata in un click direttamente dalla homepage del tuo smartphone. Più veloce, protetta ed attiva anche offline.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0 relative">
            <button
              onClick={handleInstallPWA}
              className="bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e] rounded-xl px-4 py-2 text-xs font-bold transition hover:scale-105 active:scale-95 shadow cursor-pointer uppercase tracking-wider"
            >
              {language === 'en' ? 'Add to Home' : 'Aggiungi alla Home'}
            </button>
            <button
              onClick={handleDismissPwaCard}
              className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white cursor-pointer"
              title={language === 'en' ? 'Hide' : 'Nascondi'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION CONTROL INTERFACE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isSubscribed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {isSubscribed ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-tight flex items-center gap-1.5">
                {language === 'en' ? 'Web Push Notifications' : 'Notifiche Push nel Browser'}
                {isSubscribed && (
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                )}
              </h3>
              <p className="text-[11px] text-slate-600">
                {language === 'en' 
                  ? 'Real-time chat alerts, status updates, and active referendum announcements' 
                  : 'Avvisi chat in tempo reale, novità sui referendum e aggiornamenti sul passaporto'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSubscribed && (
              <button
                onClick={triggerTestAlert}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {language === 'en' ? 'Test Alert' : 'Invia Test'}
              </button>
            )}
            <button
              onClick={handleToggleSubscription}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition uppercase tracking-wider cursor-pointer shadow ${
                isSubscribed 
                  ? 'bg-[#ef4444]/10 hover:bg-[#ef4444]/25 text-[#ef4444]' 
                  : 'bg-[#0a1c3e] hover:bg-[#152b54] text-[#f7f5f0]'
              }`}
            >
              {isSubscribed 
                ? (language === 'en' ? 'Deactivate' : 'Disattiva') 
                : (language === 'en' ? 'Activate' : 'Attiva')}
            </button>
            <button
              onClick={() => {
                checkSWAndDetails();
                setShowDoctor(!showDoctor);
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${showDoctor ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-250 hover:bg-slate-200'}`}
              title={language === 'en' ? 'Run Diagnostics & Setup Assistant' : 'Assistente Attivazione e Diagnostica'}
            >
              <Settings className={`w-4 h-4 ${showDoctor ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. DIAGNOSTICS & DOCTOR PANEL (Expanded when showDoctor is true) */}
        {showDoctor && (
          <div className="p-5 border-b border-slate-100 bg-amber-50/20 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600 animate-pulse" />
                <h4 className="font-serif text-xs font-bold uppercase text-[#0a1c3e] tracking-wider">
                  {language === 'en' ? '🩺 Push Notification Diagnostic Doctor' : '🩺 Assistente Diagnostica Notifiche Push'}
                </h4>
              </div>
              <button 
                onClick={checkSWAndDetails} 
                disabled={checkingSW}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1 text-[10px] font-bold uppercase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingSW ? 'animate-spin' : ''}`} />
                {language === 'en' ? 'Refresh' : 'Ricarica'}
              </button>
            </div>

            {/* Grid of issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Diagnostics Checks */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                  {language === 'en' ? 'System Integrity Check' : 'Integrità del Sistema'}
                </h5>

                {/* Check 1: Sandboxed iframe */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{language === 'en' ? 'Sandbox Environment:' : 'Ambiente Sandbox (iFrame):'}</span>
                  {isIframe ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {language === 'en' ? 'Iframe (Blocked)' : 'Iframe (Limitato)'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'en' ? 'Full Window' : 'Finestra Libera'}
                    </span>
                  )}
                </div>

                {/* Check 2: Browser APIs */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{language === 'en' ? 'Browser Notification API:' : 'API Notifiche Browser:'}</span>
                  {typeof window !== 'undefined' && 'Notification' in window ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'en' ? 'Supported' : 'Supportato'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {language === 'en' ? 'Unsupported' : 'Non Supportato'}
                    </span>
                  )}
                </div>

                {/* Check 3: Notification permission status */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{language === 'en' ? 'Permission Status:' : 'Stato dei Permessi:'}</span>
                  {notifPermission === 'granted' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'en' ? 'Authorized' : 'Concesso (Attivo)'}
                    </span>
                  ) : notifPermission === 'denied' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      {language === 'en' ? 'Blocked' : 'Negato / Bloccato'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {language === 'en' ? 'Not Requested' : 'Chiedi al click'}
                    </span>
                  )}
                </div>

                {/* Check 4: Service worker registration */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{language === 'en' ? 'Background Service Worker:' : 'Service Worker in Background:'}</span>
                  {swStatus === 'active' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'en' ? 'Registered & Live' : 'Attivo & Connesso'}
                    </span>
                  ) : swStatus === 'unsupported' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {language === 'en' ? 'Incompatible Browser' : 'Incompatibile'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {language === 'en' ? 'Not Loaded yet' : 'In attesa'}
                    </span>
                  )}
                </div>

                {/* Check 5: Live Chat Sync Link */}
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-slate-600 font-medium">{language === 'en' ? 'Active Chat Synced:' : 'Identità Chat Sincronizzata:'}</span>
                  {activeName ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0a1c3e]/15 text-[#0a1c3e]">
                      🟢 {activeName.split(' ')[0]} ({activeCode || 'GUEST'})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                      ⚪ {language === 'en' ? 'Unidentified' : 'Nessuno'}
                    </span>
                  )}
                </div>

                {/* Critical Iframe warning message */}
                {isIframe && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-200 text-amber-950 text-[11px] rounded-lg leading-relaxed space-y-2">
                    <p>
                      {language === 'en'
                        ? "⚠️ You are running the app inside a sandboxed Iframe (AI Studio Preview). Browser policies strictly prevent notifications here."
                        : "⚠️ Stai visualizzando l'applicazione dentro l'anteprima protetta (Iframe). I browser bloccano la registrazione di Service Worker e l'invio di notifiche native all'interno di iframe sandboxed per sicurezza."}
                    </p>
                    <button 
                      onClick={handleOpenNewTab}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px] uppercase transition flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Open App in New Tab' : 'Apri il Portale in una Nuova Scheda'}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Setup Guides */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                    {language === 'en' ? 'Quick Device Guides' : 'Guide Rapide Dispositivi'}
                  </h5>
                  
                  {/* Selector tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveTab('android')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'android' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Android
                    </button>
                    <button 
                      onClick={() => setActiveTab('ios')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'ios' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Apple iOS
                    </button>
                    <button 
                      onClick={() => setActiveTab('desktop')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'desktop' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Desktop
                    </button>
                  </div>

                  {/* Guides Content */}
                  <div className="text-[11px] text-slate-600 leading-normal min-h-[100px] flex items-center">
                    {activeTab === 'android' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Google Chrome / Samsung Internet:</strong>
                        <p>1. Clicca sul tasto <strong>"Attiva"</strong> qui sopra. Se non appare il popup, clicca l'icona del <strong>lucchetto</strong> 🔒 a sinistra del link URL nella barra degli indirizzi.</p>
                        <p>2. Assicurati che l'opzione <strong>"Notifiche"</strong> sia impostata su <strong>"Consenti"</strong> (On).</p>
                        <p>3. Se l'app non è installata, usa il banner in alto <strong>"Aggiungi alla Home"</strong> per ricevere notifiche a telefono spento.</p>
                      </div>
                    )}
                    {activeTab === 'ios' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Apple Safari (iPhone / iPad):</strong>
                        <p className="text-amber-700 font-medium">⚠️ iOS richiede OBBLIGATORIAMENTE l'installazione in Home Screen per concedere le notifiche push.</p>
                        <p>1. Clicca il tasto di condivisione di Safari (quadrato con freccia in alto 📤).</p>
                        <p>2. Scorri e seleziona <strong>"Aggiungi alla schermata Home"</strong> (+) e apri l'app dalla Home Screen.</p>
                        <p>3. Una volta aperta dalla Home, clicca su <strong>"Attiva"</strong> sopra per confermare il permesso nativo di iOS.</p>
                      </div>
                    )}
                    {activeTab === 'desktop' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Mac / Windows (Chrome, Safari, Firefox):</strong>
                        <p>1. Clicca l'icona del <strong>lucchetto</strong> 🔒 o i controlli a sinistra dell'URL.</p>
                        <p>2. Cambia lo stato dei permessi per "Notifiche" impostandolo su <strong>"Consenti"</strong>.</p>
                        <p>3. <strong>Utenti macOS:</strong> Verifica in Impostazioni di Sistema → Notifiche → che il tuo Browser (Chrome/Safari) sia autorizzato a mostrare avvisi di sistema!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={async () => {
                      const perm = await requestBrowserPermission();
                      setNotifPermission(perm);
                      setIsSubscribed(perm === 'granted');
                    }}
                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg py-1.5 text-[10px] font-bold uppercase transition text-center cursor-pointer"
                  >
                    {language === 'en' ? 'Reset Permissions' : 'Sblocca Permessi'}
                  </button>
                  <button
                    onClick={triggerTestAlert}
                    className="w-full bg-[#0a1c3e] hover:bg-[#152b54] text-white rounded-lg py-1.5 text-[10px] font-bold uppercase transition text-center cursor-pointer"
                  >
                    {language === 'en' ? 'Force Test Alert' : 'Forza Notifica Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. EXTRA INFO PANEL / ALERTS LOG */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-100 rounded-xl leading-normal">
            <div className="flex items-center gap-1.5 font-bold text-[#0a1c3e] mb-1 text-[11px]">
              <Info className="w-4 h-4 text-brand-gold shrink-0" />
              <span>{language === 'en' ? 'HOW BROWSER NOTIFICATIONS WORK:' : 'COME FUNZIONANO LE NOTIFICHE:'}</span>
            </div>
            <p>
              {language === 'en'
                ? "• They function outside the portal! Even if you have closed your web browser, our Edge servers can generate direct push alerts for convalidated referendums and new private chat messages."
                : "• Funzionano anche a portale chiuso! Anche se hai chiuso il browser, l'Edge State e il Service Worker in background monitorano nuovi messaggi e notificano istantaneamente sia su desktop che su mobile."}
            </p>
            <p>
              {language === 'en'
                ? "• Personal updates (private chat messages, passport releases) will be pushed securely only to your registered device."
                : "• Gli aggiornamenti personali (messaggi di chat privata, rilascio passaporto, referendumi) vengono recapitati in modo sicuro e cifrato solo sul tuo dispositivo autorizzato."}
            </p>
            {notifPermission === 'denied' && (
              <p className="text-rose-600 font-semibold mt-1">
                {language === 'en'
                  ? "⚠️ Notice: Browser popups are currently blocked for this site. Click on the lock icon next to the address bar to reset permissions."
                  : "⚠️ Attenzione: Le autorizzazioni sono state disabilitate nel browser. Fai click sull'icona del lucchetto a sinistra dell'URL del sito per riattivare le notifiche."}
              </p>
            )}
          </div>

          {/* HISTORIC LOG OF ALERTS IN-APP VIEW */}
          {isSubscribed && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
                  {language === 'en' ? 'Latest alert feed' : 'Feed Notifiche Ricevute'}
                </h4>
                {notifHistory.length > 0 && (
                  <button 
                    onClick={clearNotificationCache}
                    className="text-[9px] text-[#ef4444] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {language === 'en' ? 'Clear Log' : 'Svuota Registro'}
                  </button>
                )}
              </div>

              {notifHistory.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-150 rounded-xl bg-slate-50/15">
                  <p className="text-xs text-slate-400">
                    {language === 'en' 
                      ? 'No alerts received yet. They will display dynamically here when pushed.' 
                      : 'Nessun messaggio ricevuto finora nel feed locale.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 animate-fade-in">
                  {notifHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-xl text-xs transition-colors flex items-start gap-2.5 ${
                        item.type === 'personal' 
                          ? 'bg-amber-500/5 border-amber-200/50' 
                          : item.type === 'referendum'
                            ? 'bg-emerald-500/5 border-emerald-200/50'
                            : 'bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'personal' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        ) : item.type === 'referendum' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 w-full" data-readable="true">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <strong className="text-[#0a1c3e] font-serif block" data-readable="true">{item.title}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed" data-readable="true">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
