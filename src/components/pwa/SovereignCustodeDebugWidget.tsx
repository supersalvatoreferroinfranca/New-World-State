import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Globe, 
  Wifi, 
  WifiOff, 
  Lock, 
  RefreshCw, 
  Languages, 
  Settings, 
  Info, 
  UserCheck, 
  AlertTriangle,
  X,
  ChevronDown,
  Activity
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export default function SovereignCustodeDebugWidget() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  // Role & Citizen State
  const [citizen, setCitizen] = useState<any>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(() => {
    return localStorage.getItem('nws_force_custode_debug') === 'true';
  });

  // Simulated Parameters State
  const [activeJurisdiction, setActiveJurisdiction] = useState<string>(() => {
    return localStorage.getItem('nws_simulated_jurisdiction') || 'nws';
  });

  const [connectionState, setConnectionState] = useState<string>(() => {
    return localStorage.getItem('nws_simulated_connection_state') || 'online';
  });

  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Load Citizen Profile
  const loadCitizen = () => {
    try {
      const saved = localStorage.getItem('nws_democracy_citizen') || 
                    sessionStorage.getItem('nws_democracy_citizen') || 
                    localStorage.getItem('nws_citizen_profile') || 
                    localStorage.getItem('registered_citizen');
      if (saved) {
        setCitizen(JSON.parse(saved));
      } else {
        setCitizen(null);
      }
    } catch (e) {
      setCitizen(null);
    }
  };

  useEffect(() => {
    loadCitizen();
    // Listen to changes in local storage, login events, or profile updates
    window.addEventListener('storage', loadCitizen);
    window.addEventListener('nws_citizen_updated', loadCitizen);
    window.addEventListener('nws_login_success', loadCitizen);
    window.addEventListener('nws_logout', loadCitizen);
    return () => {
      window.removeEventListener('storage', loadCitizen);
      window.removeEventListener('nws_citizen_updated', loadCitizen);
      window.removeEventListener('nws_login_success', loadCitizen);
      window.removeEventListener('nws_logout', loadCitizen);
    };
  }, []);

  // Check if current user is logged in
  const isLoggedIn = !!citizen && (!!citizen.id || !!citizen.citizenCode || !!citizen.email || !!citizen.firstName);

  // Check if current logged-in user is Custode Digitale
  const checkIsCustode = () => {
    if (!isLoggedIn) return false;
    if (citizen?.isAdmin) return true; // Admins get access
    
    const roleField = citizen?.operationalRole || citizen?.role;
    if (!roleField) return false;
    
    const roleStr = typeof roleField === 'string' ? roleField : JSON.stringify(roleField);
    const trimmed = roleStr.trim();
    if (trimmed.startsWith('[')) {
      try {
        const assignedArray = JSON.parse(trimmed);
        return assignedArray.some((assigned: any) => 
          assigned.roleId === 7 || 
          assigned.legacyName?.toLowerCase().includes("custode") ||
          assigned.legacyName?.toLowerCase().includes("custodian")
        );
      } catch (e) {
        return trimmed.toLowerCase().includes("custode") || trimmed.toLowerCase().includes("custodian") || trimmed.includes("7");
      }
    }
    return trimmed.toLowerCase().includes("custode") || trimmed.toLowerCase().includes("custodian");
  };

  const isCustodeActive = checkIsCustode();

  // MUST be logged in AND have Custode Digitale role
  if (!isLoggedIn || !isCustodeActive) {
    return null;
  }

  // Save Simulate Mode
  const handleToggleSimulation = () => {
    const nextState = !isSimulated;
    setIsSimulated(nextState);
    localStorage.setItem('nws_force_custode_debug', String(nextState));
    triggerNotification(
      nextState 
        ? (language === 'en' ? 'Simulation enabled as Digital Custodian!' : 'Simulazione attivata come Custode Digitale!')
        : (language === 'en' ? 'Simulation disabled.' : 'Simulazione disattivata.')
    );
    // Dispatch custom event to notify components that identity has changed
    window.dispatchEvent(new Event('nws_citizen_updated'));
  };

  // Change Jurisdiction
  const handleJurisdictionChange = (jurisdiction: string) => {
    setActiveJurisdiction(jurisdiction);
    localStorage.setItem('nws_simulated_jurisdiction', jurisdiction);
    window.dispatchEvent(new CustomEvent('nws_privacy_jurisdiction_changed', { detail: jurisdiction }));
    
    const jurNames: Record<string, string> = {
      nws: language === 'en' ? 'New World State (Sovereign)' : 'New World State (Sovrana)',
      eu: 'Unione Europea (GDPR)',
      us_ca: 'California, USA (CCPA/CPRA)',
      ch: 'Svizzera (LPD/FADP)',
      uk: 'Regno Unito (UK-GDPR)',
      au: 'Australia (APPs)',
      br: 'Brasile (LGPD)'
    };

    triggerNotification(
      language === 'en'
        ? `Jurisdiction changed to: ${jurNames[jurisdiction] || jurisdiction}`
        : `Giurisdizione modificata in: ${jurNames[jurisdiction] || jurisdiction}`
    );
  };

  // Change Connection State
  const handleConnectionChange = (state: string) => {
    setConnectionState(state);
    localStorage.setItem('nws_simulated_connection_state', state);
    window.dispatchEvent(new CustomEvent('nws_simulated_connection_state_changed', { detail: state }));
    
    const connNames: Record<string, string> = {
      online: language === 'en' ? 'Standard Online' : 'Connessione Standard',
      vpn: language === 'en' ? 'Secure Sovereign VPN' : 'VPN Sovrana Cifrata',
      offline: language === 'en' ? 'Offline Simulation' : 'Simulazione Offline'
    };

    triggerNotification(
      language === 'en'
        ? `Connection status: ${connNames[state] || state}`
        : `Stato connessione impostato: ${connNames[state] || state}`
    );
  };

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 3000);
  };

  // Quick helper to show active state indicators in the top bar
  useEffect(() => {
    // We can also let the window object expose current simulated state for diagnostic integrations
    (window as any).nwsSimulatedState = {
      jurisdiction: activeJurisdiction,
      connection: connectionState,
      isCustode: isCustodeActive
    };
  }, [activeJurisdiction, connectionState, isCustodeActive]);

  const isIt = language !== 'en';

  const jurisdictionsList = [
    { id: 'nws', label: 'New World State', code: 'NWS Sovereign', flag: '🪐' },
    { id: 'eu', label: isIt ? 'Unione Europea' : 'European Union', code: 'GDPR Compliant', flag: '🇪🇺' },
    { id: 'us_ca', label: 'California, USA', code: 'CCPA / CPRA', flag: '🇺🇸' },
    { id: 'ch', label: isIt ? 'Svizzera' : 'Switzerland', code: 'LPD / FADP', flag: '🇨🇭' },
    { id: 'uk', label: isIt ? 'Regno Unito' : 'United Kingdom', code: 'UK-GDPR', flag: '🇬🇧' },
    { id: 'au', label: 'Australia', code: 'Privacy Act / APPs', flag: '🇦🇺' },
    { id: 'br', label: isIt ? 'Brasile' : 'Brazil', code: 'LGPD Compliant', flag: '🇧🇷' }
  ];

  return (
    <>
      {/* 1. SIMULATOR STATE NOTIFICATION BANNER */}
      {showNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0a1c3e] border border-[#c5a880] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-sans">
          <div className="h-2 w-2 rounded-full bg-brand-gold animate-ping" />
          <span className="font-medium tracking-wide">{showNotification}</span>
        </div>
      )}

      {/* 2. REAL-TIME PRIVACY JURISDICTION TOP-BAR STATUS FOR SOVEREIGN CUSTODIANS */}
      {isCustodeActive && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-6 bg-[#0a1c3e] border-b border-[#c5a880]/30 flex items-center justify-between px-4 font-mono text-[9px] text-[#f7f5f0] uppercase tracking-wider select-none">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-brand-gold animate-pulse" />
            <span>
              {isIt ? 'Simulatore Custode' : 'Custodian Simulator'}: 
              <strong className="text-brand-gold ml-1">
                {jurisdictionsList.find(j => j.id === activeJurisdiction)?.flag} {jurisdictionsList.find(j => j.id === activeJurisdiction)?.code}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${
                connectionState === 'online' ? 'bg-emerald-500' : connectionState === 'vpn' ? 'bg-indigo-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span>
                {connectionState === 'online' ? (isIt ? 'ONLINE' : 'ONLINE') : connectionState === 'vpn' ? (isIt ? 'VPN CRITTOGRAFATA' : 'ENCRYPTED VPN') : (isIt ? 'OFFLINE' : 'OFFLINE')}
              </span>
            </span>
            <span className="text-slate-400">|</span>
            <span>{isIt ? 'RUOLO CUSTODE ATTIVO' : 'CUSTODIAN PRIVILEGES'}</span>
          </div>
        </div>
      )}

      {/* 3. FLOATING PANEL CONTROLLER BUTTON */}
      <div className="fixed bottom-22 left-6 z-[999] font-sans accessibility-exclude flex items-center gap-2">
        <div className="flex items-center bg-[#0a1c3e] border border-[#c5a880]/30 rounded-full p-1 shadow-lg gap-1">
          {/* Main Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-10 w-10 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 accessibility-exclude ${
              isCustodeActive 
                ? 'bg-[#0a1c3e] text-brand-gold hover:bg-[#c5a880] hover:text-[#0a1c3e]' 
                : 'bg-slate-800 text-slate-400 opacity-60 hover:opacity-100 hover:text-[#f7f5f0]'
            }`}
            aria-label="Custode Digitale Simulation Console"
            title="Sovereign Privacy & Network Simulator"
          >
            {isCustodeActive ? (
              <Shield className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Key className="w-4 h-4 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Floating Indicator Label (Subtle badge) */}
        {isCustodeActive && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-gold text-[8px] font-bold text-[#0a1c3e] border border-white animate-bounce">
            ★
          </span>
        )}

        {/* 4. THE SIMULATOR POPUP PANEL */}
        {isOpen && (
          <div className="absolute bottom-16 left-0 w-80 bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-5 space-y-4 animate-fade-in accessibility-exclude">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0a1c3e]" />
                <div>
                  <h4 className="text-xs font-serif font-bold text-[#0a1c3e] uppercase tracking-wider">
                    {isIt ? 'Sovereign Sim Console' : 'Sovereign Sim Console'}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-sans tracking-tight">
                    {isIt ? 'Funzioni di Debug - Custode Digitale' : 'Debug Functions - Digital Custodian'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Simulate Identity Switch */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                  {isIt ? 'Ruolo Custode Digitale' : 'Custodian Simulation'}
                </span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  isCustodeActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isCustodeActive ? (isIt ? 'ATTIVO' : 'ACTIVE') : (isIt ? 'INATTIVO' : 'INACTIVE')}
                </span>
              </div>
              
              <p className="text-[10px] text-slate-500 leading-normal">
                {isIt 
                  ? 'Abilita questo bypass per simulare i privilegi di Custode Digitale senza effettuare l\'accesso.'
                  : 'Enable this bypass to simulate Digital Custodian permissions without authenticating.'}
              </p>

              <button
                onClick={handleToggleSimulation}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer border ${
                  isSimulated 
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700' 
                    : 'bg-[#0a1c3e] hover:bg-[#0a1c3e]/90 border-[#0a1c3e] text-white'
                }`}
              >
                {isSimulated ? (isIt ? 'Disattiva Bypass Ruolo' : 'Disable Role Bypass') : (isIt ? 'Attiva Bypass Ruolo' : 'Enable Role Bypass')}
              </button>
            </div>

            {/* If Not Active, Show Warning and Lock remaining options */}
            {!isCustodeActive ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-amber-800 uppercase block">
                    {isIt ? 'ACCESSO LIMITATO' : 'RESTRICTED ACCESS'}
                  </span>
                  <p className="text-[9px] text-amber-700 leading-normal">
                    {isIt 
                      ? 'Questo pannello di controllo della privacy è riservato esclusivamente ai Custodi Digitali.'
                      : 'This privacy simulation desk is reserved strictly for Digital Custodians.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Section 2: Language Changer (Real-time translation state) */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-[#c5a880]" />
                    {isIt ? 'Simula Cambio Lingua' : 'Simulate Language'}
                  </span>

                  <div className="relative bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 cursor-pointer">
                    <select
                      value={language}
                      onChange={(e) => {
                        const nextLang = e.target.value as any;
                        setLanguage(nextLang);
                        triggerNotification(isIt ? `Lingua impostata: ${nextLang.toUpperCase()}` : `Language set: ${nextLang.toUpperCase()}`);
                      }}
                      className="w-full bg-transparent text-xs font-bold text-[#0a1c3e] focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="it">IT - Italiano</option>
                      <option value="en">EN - English</option>
                      <option value="fr">FR - Français</option>
                      <option value="es">ES - Español</option>
                      <option value="pt">PT - Português</option>
                      <option value="ru">RU - Русский</option>
                      <option value="hi">HI - हिन्दी</option>
                      <option value="bn">BN - বাংলা</option>
                      <option value="zh">ZH - 中文</option>
                      <option value="ja">JA - 日本語</option>
                      <option value="ar">AR - العربية</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#0a1c3e]/60">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Connection State */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-[#c5a880]" />
                    {isIt ? 'Simula Stato Connessione' : 'Simulate Connection'}
                  </span>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Option 1: Standard Online */}
                    <button
                      onClick={() => handleConnectionChange('online')}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-center ${
                        connectionState === 'online'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Standard Network Routing"
                    >
                      <Wifi className="w-4 h-4 mb-1 text-emerald-500" />
                      <span className="text-[8px] font-bold uppercase">{isIt ? 'Standard' : 'Standard'}</span>
                    </button>

                    {/* Option 2: VPN Encrypted */}
                    <button
                      onClick={() => handleConnectionChange('vpn')}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-center ${
                        connectionState === 'vpn'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Sovereign Encrypted Routing"
                    >
                      <Lock className="w-4 h-4 mb-1 text-indigo-500" />
                      <span className="text-[8px] font-bold uppercase">{isIt ? 'Secure VPN' : 'Secure VPN'}</span>
                    </button>

                    {/* Option 3: Offline simulation */}
                    <button
                      onClick={() => handleConnectionChange('offline')}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-center ${
                        connectionState === 'offline'
                          ? 'bg-red-50 border-red-300 text-red-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Local Offline Mode Simulation"
                    >
                      <WifiOff className="w-4 h-4 mb-1 text-red-500" />
                      <span className="text-[8px] font-bold uppercase">{isIt ? 'Offline' : 'Offline'}</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Global Privacy Jurisdictions */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#c5a880]" />
                    {isIt ? 'Simula Giurisdizione Privacy' : 'Simulate Privacy Laws'}
                  </span>

                  <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 border border-slate-100 p-1.5 rounded-xl bg-slate-50">
                    {jurisdictionsList.map((jur) => (
                      <button
                        key={jur.id}
                        onClick={() => handleJurisdictionChange(jur.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                          activeJurisdiction === jur.id
                            ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{jur.flag}</span>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold leading-none">{jur.label}</span>
                            <span className={`text-[7px] font-mono leading-none mt-0.5 ${
                              activeJurisdiction === jur.id ? 'text-brand-gold' : 'text-slate-400'
                            }`}>
                              {jur.code}
                            </span>
                          </div>
                        </div>
                        {activeJurisdiction === jur.id && (
                          <span className="text-[8px] font-bold bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-mono uppercase">
                            LIVE
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legal compliance brief details based on simulated selection */}
                <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/50 text-[9px] text-slate-500 leading-normal">
                  <div className="flex items-center gap-1 font-bold text-[#0a1c3e] mb-1">
                    <Info className="w-3 h-3 text-[#c5a880]" />
                    <span>
                      {isIt ? 'Impatto Compliance Legale' : 'Legal Compliance Impact'}
                    </span>
                  </div>
                  {activeJurisdiction === 'nws' && (
                    <p>{isIt ? 'Il New World State applica la sovranità dei dati totale: nessun cookie terzo e crittografia decentralizzata perenne.' : 'NWS enforces absolute data sovereignty: zero tracking cookies and persistent decentralized server-side protection.'}</p>
                  )}
                  {activeJurisdiction === 'eu' && (
                    <p>{isIt ? 'Attiva log di consenso crittografati obbligatori (Art. 7 GDPR) e informativa dettagliata con dritto all\'oblio.' : 'Enforces strict encrypted consent logging (Art. 7 GDPR), complete access disclosures, and the Right to Be Forgotten (Art. 17).'}</p>
                  )}
                  {activeJurisdiction === 'us_ca' && (
                    <p>{isIt ? 'Sblocca il controllo opt-out del CCPA nel footer ("Do Not Sell My Personal Info") e sanzioni statutarie di sicurezza.' : 'Enables the CCPA opt-out toggle in the footer ("Do Not Sell My Personal Info") with rigorous security safeguards.'}</p>
                  )}
                  {activeJurisdiction === 'ch' && (
                    <p>{isIt ? 'Conforme alla nuova Legge Federale sulla Protezione dei Dati (LPD Svizzera), con stringenti controlli di trasparenza.' : 'Complies with Switzerland\'s FADP, requiring detailed transparency logs and high-precision processing disclosures.'}</p>
                  )}
                  {activeJurisdiction === 'uk' && (
                    <p>{isIt ? 'Assicura la conformità post-Brexit (UK-GDPR) con i severi standard dell\'Information Commissioner\'s Office.' : 'Maintains post-Brexit UK-GDPR alignment aligned with Information Commissioner\'s Office (ICO) guidelines.'}</p>
                  )}
                  {activeJurisdiction === 'au' && (
                    <p>{isIt ? 'Attiva l\'Australian Privacy Principle 8 (APP 8) per i trasferimenti sicuri transfrontalieri.' : 'Triggers strict cross-border disclosure protections under Australian Privacy Principle 8 (APP 8).'}</p>
                  )}
                  {activeJurisdiction === 'br' && (
                    <p>{isIt ? 'Conforme alla Lei Geral de Proteção de Dados (LGPD Brasile), che richiede tutele speciali per l\'anagrafe.' : 'Aligns processing with Brazil\'s LGPD regulations, requiring specific administrative safeguards for civil registries.'}</p>
                  )}
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
}
