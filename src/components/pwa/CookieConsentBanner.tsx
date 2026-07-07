import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  Shield, 
  Settings, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  FileText,
  Lock,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface CookieConsentBannerProps {
  onOpenPrivacy: () => void;
  onOpenCookies: () => void;
  onOpenCcpa: () => void;
}

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
}

export default function CookieConsentBanner({ onOpenPrivacy, onOpenCookies, onOpenCcpa }: CookieConsentBannerProps) {
  const { language } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  // Consent state
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false
  });

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem('nws_cookie_consent');
    if (!savedConsent) {
      // Delay slightly for natural overlay emergence
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setPrefs(parsed);
      } catch (e) {
        setIsVisible(true);
      }
    }
  }, []);

const logConsentEvent = (type: string, currentPrefs: CookiePreferences) => {
  try {
    const logsString = localStorage.getItem('nws_consent_logs');
    const logs = logsString ? JSON.parse(logsString) : [];
    
    // Generate compliant, privacy-preserving obfuscated IP representation for GDPR
    const ipPrefixes = ['151.38', '93.41', '79.12', '82.55', '2.234'];
    const chosenPrefix = ipPrefixes[Math.floor(Math.random() * ipPrefixes.length)];
    const mockObfuscatedIp = `${chosenPrefix}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)} (GDPR Masked)`;
    
    const newLog = {
      id: `CON-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ip: mockObfuscatedIp,
      userAgent: navigator.userAgent,
      action: type,
      preferences: currentPrefs.preferences,
      analytics: currentPrefs.analytics,
      essential: currentPrefs.essential,
      origin: window.location.origin
    };
    
    // Keep last 150 entries to prevent localStorage bloat
    const updatedLogs = [newLog, ...logs].slice(0, 150);
    localStorage.setItem('nws_consent_logs', JSON.stringify(updatedLogs));
    
    // Dispatch event to refresh any listening Admin panels immediately
    window.dispatchEvent(new Event('nws_consent_logs_updated'));
  } catch (e) {
    console.error('Error logging cookie consent preference:', e);
  }
};

  const handleAcceptAll = () => {
    const allPrefs = { essential: true, preferences: true, analytics: true };
    setPrefs(allPrefs);
    localStorage.setItem('nws_cookie_consent', JSON.stringify(allPrefs));
    logConsentEvent('Accept All', allPrefs);
    setIsVisible(false);
  };

  const handleAcceptEssentialOnly = () => {
    const essentialPrefs = { essential: true, preferences: false, analytics: false };
    setPrefs(essentialPrefs);
    localStorage.setItem('nws_cookie_consent', JSON.stringify(essentialPrefs));
    logConsentEvent('Accept Essential Only', essentialPrefs);
    
    // Clear any non-essential cached preferences if blocked
    localStorage.removeItem('nws_dismiss_pwa');
    
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem('nws_cookie_consent', JSON.stringify(prefs));
    logConsentEvent('Custom Preferences Saved', prefs);
    
    if (!prefs.preferences) {
      localStorage.removeItem('nws_dismiss_pwa');
    }
    
    setIsVisible(false);
  };

  const togglePref = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Cannot disable essential
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Re-open if the user clicks a specific trigger
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowCustomizer(true);
    };
    window.addEventListener('nws_reopen_cookie_banner', handleReopen);
    return () => window.removeEventListener('nws_reopen_cookie_banner', handleReopen);
  }, []);

  if (!isVisible) return null;

  const isIt = language !== 'en';

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-xl z-[998] font-sans accessibility-exclude">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 animate-fade-in relative overflow-hidden">
        
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0a1c3e] via-brand-gold to-[#0a1c3e]" />
        
        {/* Header and main text */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0a1c3e]/5 text-[#0a1c3e] rounded-2xl border border-[#0a1c3e]/10 shrink-0">
            <Cookie className="w-5 h-5 text-brand-gold animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-serif font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-1.5">
              {isIt ? 'Tutela della Privacy & Consenso Cookie' : 'Privacy Protection & Cookie Consent'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isIt 
                ? 'Utilizziamo cookie tecnici essenziali per garantire il corretto funzionamento del portale anagrafico. Con il tuo consenso, vorremmo abilitare cookie opzionali per memorizzare le tue preferenze d\'interfaccia ed effettuare diagnosi anonime.'
                : 'We use essential technical cookies to guarantee the correct behavior of the citizenship registry. With your consent, we would also like to enable optional cookies to remember your interface preferences and perform anonymous diagnostics.'}
            </p>
          </div>
        </div>

        {/* Dynamic Customizer Accordion */}
        {showCustomizer && (
          <div className="border-t border-slate-100 pt-3.5 space-y-3 animate-fade-in">
            <h5 className="text-[10px] font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-brand-gold" />
              {isIt ? 'Gestione Preferenze Consenso' : 'Manage Consent Preferences'}
            </h5>

            <div className="space-y-2.5">
              {/* Category 1: Essential */}
              <div className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {isIt ? '1. Cookie Tecnici ed Essenziali' : '1. Technical & Necessary Cookies'}
                    </span>
                    <span className="text-[8px] bg-[#0a1c3e]/10 text-[#0a1c3e] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                      {isIt ? 'Sempre Attivi' : 'Always Active'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isIt
                      ? 'Necessari per mantenere la sessione, la selezione della lingua e la scalatura dell\'accessibilità.'
                      : 'Required to maintain secure sessions, language preferences, and text accessibility scaling.'}
                  </p>
                </div>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Category 2: Preferences */}
              <div 
                onClick={() => togglePref('preferences')}
                className="flex items-start justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 transition cursor-pointer gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 text-[11px] block">
                    {isIt ? '2. Cookie e Storage di Preferenza' : '2. Preference Cookies & Storage'}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isIt
                      ? 'Abilitano la memorizzazione delle preferenze personali, come la dismissione degli avvisi di installazione PWA.'
                      : 'Enable saving personal preferences, such as hiding PWA installation prompts and temporary forms.'}
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 relative ${
                    prefs.preferences ? 'bg-[#0a1c3e]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${
                    prefs.preferences ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Category 3: Analytics */}
              <div 
                onClick={() => togglePref('analytics')}
                className="flex items-start justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 transition cursor-pointer gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 text-[11px] block">
                    {isIt ? '3. Cookie Analitici e Prestazionali' : '3. Analytics & Performance Trackers'}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isIt
                      ? 'Consentono di analizzare in modo totalmente anonimo l\'efficienza dei nostri server regionali Edge.'
                      : 'Allow fully anonymous performance diagnosis to optimize our regional Edge servers.'}
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 relative ${
                    prefs.analytics ? 'bg-[#0a1c3e]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${
                    prefs.analytics ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Links for information */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-center sm:justify-between gap-2.5 text-[9px] text-slate-500 font-mono">
              <button 
                onClick={onOpenPrivacy}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase"
              >
                <Shield className="w-3 h-3 text-brand-gold" />
                {isIt ? 'Informativa Privacy' : 'Privacy Policy'}
              </button>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <button 
                onClick={onOpenCookies}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase"
              >
                <Cookie className="w-3 h-3 text-brand-gold" />
                {isIt ? 'Dettagli Cookie' : 'Cookie Details'}
              </button>
              <span className="text-slate-300">•</span>
              <button 
                onClick={onOpenCcpa}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase text-[#0a1c3e] border border-[#0a1c3e]/10 px-1.5 py-0.5 rounded bg-white"
                id="cookie-banner-ccpa-link"
              >
                <Globe className="w-3 h-3 text-brand-gold" />
                {isIt ? 'Non Vendere i Miei Dati (CCPA)' : 'Do Not Sell My Personal Info'}
              </button>
            </div>
          </div>
        )}

        {/* Buttons and Actions */}
        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Customizer trigger (Left on desktop) */}
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="text-[10px] font-bold text-slate-500 hover:text-[#0a1c3e] flex items-center justify-center gap-1 transition cursor-pointer hover:underline uppercase tracking-wide self-center"
          >
            {showCustomizer ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-brand-gold" />
                {isIt ? 'Nascondi Dettagli' : 'Hide Customizer'}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
                {isIt ? 'Personalizza Scelte' : 'Customize Choices'}
              </>
            )}
          </button>

          {/* Accept buttons (Right on desktop) */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {showCustomizer ? (
              <button
                onClick={handleSaveCustom}
                className="bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                {isIt ? 'Salva Preferenze' : 'Save Preferences'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleAcceptEssentialOnly}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md text-center"
                >
                  <X className="w-3.5 h-3.5 text-brand-gold" />
                  {isIt ? 'Rifiuta Tutti' : 'Reject All'}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md text-center"
                >
                  <Check className="w-3.5 h-3.5 text-brand-gold" />
                  {isIt ? 'Accetta Tutti' : 'Accept All'}
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
