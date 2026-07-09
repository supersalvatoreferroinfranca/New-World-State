import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, X, Check, Volume2, Info, Landmark, ShieldCheck } from 'lucide-react';
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
  const [showCenter, setShowCenter] = useState(false);
  const [notifHistory, setNotifHistory] = useState<NWSNotification[]>([]);
  const [dismissPwaCard, setDismissPwaCard] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nws_dismiss_pwa') === 'true';
    }
    return false;
  });

  useEffect(() => {
    setIsSubscribed(getSubscriptionStatus());
    setNotifPermission(getBrowserPermission());
    setNotifHistory(getLocalNotifications());

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
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
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

  return (
    <div className="w-full space-y-6" id="pwa-notif-control-panel">
      {/* 1. TOP PWA PROMPT BANNER (Show if not installed, prompt is cached and not dismissed) */}
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

      {/* 2. NOTIFICATION CONTROL INTERFACE (Always visible for configurations) */}
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
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </h3>
              <p className="text-[11px] text-slate-600">
                {language === 'en' 
                  ? 'Status updates, active referendum alerts, and personal certificates' 
                  : 'Avvisi sui referendum, esiti di voto e convalide della tua anagrafe'}
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
                : (language === 'en' ? 'Activate notifications' : 'Attiva Notifiche')}
            </button>
          </div>
        </div>

        {/* 3. EXTRA INFO PANEL / ALERTS LOG */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-100 rounded-xl leading-normal">
            <div className="flex items-center gap-1.5 font-bold text-[#0a1c3e] mb-1 text-[11px]">
              <Info className="w-4 h-4 text-brand-gold shrink-0" />
              <span>{language === 'en' ? 'HOW BROWSER NOTIFICATIONS WORK:' : 'COME FUNZIONANO LE NOTIFICHE:'}</span>
            </div>
            <p>
              {language === 'en'
                ? "• They function outside the portal! Even if you have closed your web browser, our Edge servers can generate direct push alerts for convalidated referendums."
                : "• Funzionano anche a portale chiuso! Anche se hai chiuso il browser, l'Edge State manda messaggi di voto istantanei."}
            </p>
            <p>
              {language === 'en'
                ? "• Personal updates (passport releases, status alterations) will be pushed securely only to your registered device."
                : "• Gli aggiornamenti personali (rilascio passaporto, convalidazione del profilo) vengono recapitati in modo cifrato solo sul tuo dispositivo."}
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
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                      <div className="space-y-0.5 w-full">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <strong className="text-[#0a1c3e] font-serif block">{item.title}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{item.body}</p>
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
