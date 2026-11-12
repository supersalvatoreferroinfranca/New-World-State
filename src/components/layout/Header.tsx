import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  Home, 
  Coins, 
  Landmark, 
  Droplets, 
  Newspaper, 
  ChevronDown, 
  BookOpen, 
  FileText, 
  Shield, 
  Info, 
  Lock, 
  Wifi, 
  UserPlus, 
  Menu, 
  X, 
  ShieldCheck, 
  Settings,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../../hooks/useBranding';
import LanguageSelector from '../common/LanguageSelector';

export type TabId = 
  | 'welcome' 
  | 'register' 
  | 'admin' 
  | 'constitution' 
  | 'charter' 
  | 'governance' 
  | 'privacy' 
  | 'network' 
  | 'democracy' 
  | 'chat' 
  | 'news' 
  | 'about' 
  | 'projects' 
  | 'crm' 
  | 'mondial';

interface HeaderProps {
  activeTab?: TabId;
  setActiveTab?: (tab: TabId) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { language, t, tText } = useI18n();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInstitutionsOpen, setIsInstitutionsOpen] = useState(false);
  const institutionsRef = useRef<HTMLDivElement | null>(null);
  const { branding } = useBranding();

  // Citizen Session for top badge
  const [citizen, setCitizen] = useState<any>(null);

  useEffect(() => {
    const loadCitizen = () => {
      try {
        const saved = localStorage.getItem('nws_democracy_citizen') || sessionStorage.getItem('nws_democracy_citizen');
        if (saved) {
          setCitizen(JSON.parse(saved));
        } else {
          setCitizen(null);
        }
      } catch (e) {
        setCitizen(null);
      }
    };
    loadCitizen();
    window.addEventListener('storage', loadCitizen);
    window.addEventListener('nws_citizen_updated', loadCitizen);
    return () => {
      window.removeEventListener('storage', loadCitizen);
      window.removeEventListener('nws_citizen_updated', loadCitizen);
    };
  }, []);

  // Close institutions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (institutionsRef.current && !institutionsRef.current.contains(event.target as Node)) {
        setIsInstitutionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Institutional submenu items
  const institutionItems: Array<{
    id: TabId;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
  }> = [
    {
      id: 'constitution',
      label: t('constitution') || 'Costituzione',
      description: tText('Fundamental principles and sovereign charter', 'Principi e ordinamento sovrano'),
      icon: BookOpen
    },
    {
      id: 'charter',
      label: t('charterOfRights') || 'Carta dei Diritti',
      description: tText('Civil liberties and inviolable guarantees', 'Libertà e tutele fondamentali'),
      icon: FileText
    },
    {
      id: 'governance',
      label: t('governance') || 'Governance',
      description: tText('Institutions, ministries and state organs', 'Organi e architettura istituzionale'),
      icon: Shield
    },
    {
      id: 'about',
      label: t('aboutUs') || 'Chi Siamo',
      description: tText('Manifesto, history and sovereign mission', 'Manifesto, visione e sovranità'),
      icon: Info
    },
    {
      id: 'privacy',
      label: t('privacyProtocol') || 'Privacy & Crittografia',
      description: tText('Zero-knowledge and sovereign data rights', 'Autodeterminazione e privacy'),
      icon: Lock
    },
    {
      id: 'network',
      label: t('networkStatus') || 'Stato della Rete',
      description: tText('Decentralized infrastructure & nodes', 'Infrastruttura decentralizzata'),
      icon: Wifi
    }
  ];

  // Mobile menu items grouped
  const mobileServiceItems: Array<{
    id: TabId;
    label: string;
    icon: React.ComponentType<any>;
    badge?: string;
  }> = [
    { id: 'welcome', label: t('homeIntro') || 'Home', icon: Home },
    { id: 'mondial', label: 'Mondial (Ɱ) Baratto Solidale', icon: Coins, badge: '5.000 Ɱ' },
    { id: 'democracy', label: t('directDemocracy') || 'Democrazia Diretta', icon: Landmark, badge: 'Vota' },
    { id: 'projects', label: tText('Works & Projects', 'Opere Comunitarie'), icon: Droplets },
    { id: 'news', label: t('news') || 'Notizie & Cronache', icon: Newspaper },
    { id: 'register', label: t('registration') || 'Registrazione Anagrafe', icon: UserPlus },
  ];

  const isInstitutionActive = [
    'constitution', 
    'charter', 
    'governance', 
    'about', 
    'privacy', 
    'network'
  ].includes(activeTab || '');

  const handleNavClick = (tabId: TabId) => {
    setActiveTab?.(tabId);
    setIsMobileOpen(false);
    setIsInstitutionsOpen(false);
  };

  return (
    <>
      {/* SOLID ROYAL NAVY HEADER (ABSOLUTE 100% CONTRAST & VISIBILITY) */}
      <header 
        className="fixed left-0 right-0 z-50 border-b-2 border-amber-400/60 shadow-2xl transition-[top] duration-200 select-none"
        style={{ 
          backgroundColor: '#071530', 
          top: 'var(--custode-bar-height, 0px)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* 1. BRAND EMBLEM & VIVID GOLD TITLE (NEVER DARK / NEVER BLURRY) */}
          <div 
            onClick={() => { setActiveTab?.('welcome'); setIsMobileOpen(false); }} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 group"
            title="New World State"
          >
            <div className="relative">
              <img 
                src={branding.logo || "https://www.newworldstate.org/documents/branding_logo/fronte.jpg"} 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('LOGO_NEW-WORLD-STATE.jpg') && !target.src.endsWith('/logo.svg')) {
                    target.src = '/LOGO_NEW-WORLD-STATE.jpg';
                  } else if (!target.src.endsWith('/logo.svg')) {
                    target.src = '/logo.svg';
                  }
                }}
                alt="Emblema New World State" 
                className="h-10 sm:h-11 w-auto object-contain rounded-md bg-white p-0.5 border border-amber-400 shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-center">
              <h1 
                className="font-serif text-lg sm:text-xl font-black tracking-tight leading-none text-amber-300 drop-shadow-sm group-hover:text-amber-200 transition-colors"
                style={{ color: '#facc15' }}
              >
                New World State
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p 
                  className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-100 whitespace-nowrap"
                  style={{ color: '#f1f5f9' }}
                >
                  Anagrafe Sovrana
                </p>
              </div>
            </div>
          </div>

          {/* 2. MAIN DESKTOP NAVIGATION: ULTRA HIGH CONTRAST, COMPACT & NO OVERFLOW */}
          <nav aria-label="Navigazione Principale" className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
            
            {/* HOME */}
            <button 
              onClick={() => handleNavClick('welcome')}
              className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'welcome' 
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md' 
                  : 'text-white hover:text-amber-300 hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t('homeIntro') || 'Home'}</span>
            </button>

            {/* MONDIAL (Ɱ) - SOLID GOLD CONTRAST BUTTON */}
            <button 
              onClick={() => handleNavClick('mondial')}
              id="header-mondial-tab-btn"
              className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-black tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-md ${
                activeTab === 'mondial' 
                  ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 font-black' 
                  : 'bg-amber-400/20 text-amber-300 border-2 border-amber-400 hover:bg-amber-400/30'
              }`}
              style={
                activeTab === 'mondial' 
                  ? { backgroundColor: '#facc15', color: '#020617' } 
                  : { color: '#fde047', borderColor: '#facc15' }
              }
            >
              <Coins className={`w-4 h-4 ${activeTab === 'mondial' ? 'text-slate-950' : 'text-amber-300'}`} />
              <span>Mondial (Ɱ)</span>
              <span 
                className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-black uppercase ${
                  activeTab === 'mondial' 
                    ? 'bg-slate-950 text-amber-300' 
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                Baratto
              </span>
            </button>

            {/* DIRECT DEMOCRACY */}
            <button 
              onClick={() => handleNavClick('democracy')}
              id="header-democracy-tab-btn"
              className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'democracy' 
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md' 
                  : 'text-white hover:text-amber-300 hover:bg-white/10'
              }`}
              style={activeTab === 'democracy' ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
              </span>
              <span>{t('directDemocracy') || 'Democrazia'}</span>
            </button>

            {/* WORKS & FUNDRAISERS (VIBRANT EMERALD) */}
            <button 
              onClick={() => handleNavClick('projects')}
              id="header-projects-tab-btn"
              className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                activeTab === 'projects' 
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-md border-emerald-400' 
                  : 'text-emerald-300 hover:text-emerald-100 bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40'
              }`}
              style={activeTab === 'projects' ? { backgroundColor: '#34d399', color: '#020617' } : undefined}
            >
              <Droplets className="w-4 h-4 text-emerald-400" />
              <span>{tText('Works', 'Opere')}</span>
            </button>

            {/* NEWS */}
            <button 
              onClick={() => handleNavClick('news')}
              id="header-news-tab-btn"
              className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'news' 
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md' 
                  : 'text-white hover:text-amber-300 hover:bg-white/10'
              }`}
              style={activeTab === 'news' ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
            >
              <Newspaper className="w-4 h-4" />
              <span>{t('news') || 'Notizie'}</span>
            </button>

            {/* INSTITUTION DROPDOWN: SHARP & CRISP */}
            <div className="relative" ref={institutionsRef}>
              <button 
                onClick={() => setIsInstitutionsOpen(!isInstitutionsOpen)}
                className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                  isInstitutionActive || isInstitutionsOpen
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md border-amber-400' 
                    : 'text-white hover:text-amber-300 hover:bg-white/10 border-white/20'
                }`}
                style={isInstitutionActive ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
                aria-expanded={isInstitutionsOpen}
                aria-haspopup="true"
              >
                <Landmark className="w-4 h-4" />
                <span>{tText('Institutions', 'Istituzioni')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isInstitutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isInstitutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl border-2 border-amber-400 shadow-2xl p-2.5 z-50 text-white"
                    style={{ backgroundColor: '#050f24' }}
                  >
                    <div className="px-3 py-2 text-[11px] uppercase font-mono font-black tracking-widest text-amber-300 border-b border-white/15 mb-1.5 flex items-center justify-between">
                      <span>{tText('Sovereign Architecture', 'Ordinamento Sovrano')}</span>
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                    </div>

                    <div className="space-y-1">
                      {institutionItems.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                              isCurrent 
                                ? 'bg-amber-400 text-slate-950 font-black' 
                                : 'hover:bg-white/10 text-white hover:text-amber-300'
                            }`}
                            style={isCurrent ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
                          >
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isCurrent ? 'bg-slate-950 text-amber-300' : 'bg-amber-400/20 text-amber-300'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold leading-tight ${isCurrent ? 'text-slate-950 font-black' : 'text-white'}`}>
                                {item.label}
                              </p>
                              <p className={`text-xs leading-tight mt-0.5 truncate ${isCurrent ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </nav>

          {/* 3. RIGHT UTILITIES (CITIZEN ACCESS CTA + LANGUAGE SELECTOR + HAMBURGER) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* CITIZEN PROFILE QUICK ACTION BUTTON */}
            {citizen ? (
              <button
                onClick={() => handleNavClick('democracy')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 border-2 border-amber-400 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                title="Accedi al tuo Profilo Cittadino"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px]">
                  {citizen.firstName ? citizen.firstName.charAt(0).toUpperCase() : 'C'}
                </div>
                <span className="font-mono text-amber-300 font-bold text-xs truncate max-w-[110px]">
                  {citizen.citizenCode || citizen.username || 'Cittadino'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('register')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs xl:text-sm font-black shadow-md transition-all cursor-pointer border border-amber-300 whitespace-nowrap"
                style={{ backgroundColor: '#facc15', color: '#020617' }}
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>{tText('Join', 'Iscriviti')}</span>
              </button>
            )}

            <div className="h-6 w-px bg-white/20 hidden lg:block" />

            {/* LANGUAGE SELECTOR WITH CONTRAST CONTAINER */}
            <div className="bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 p-0.5 transition-colors">
              <LanguageSelector variant="header" />
            </div>
            
            {/* MOBILE HAMBURGER TOGGLE */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/50 transition-colors cursor-pointer"
              aria-label="Apri menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* 4. OFF-CANVAS MOBILE DRAWER MENU */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[320px] z-[101] shadow-2xl flex flex-col border-l-2 border-amber-400 text-white lg:hidden"
              style={{ backgroundColor: '#071530' }}
            >
              {/* Drawer Header */}
              <div className="h-20 px-6 border-b border-white/15 flex items-center justify-between shrink-0 bg-[#050f24]">
                <div className="flex items-center gap-3">
                  <img 
                    src={branding.logo || "https://www.newworldstate.org/documents/branding_logo/fronte.jpg"} 
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('LOGO_NEW-WORLD-STATE.jpg') && !target.src.endsWith('/logo.svg')) {
                        target.src = '/LOGO_NEW-WORLD-STATE.jpg';
                      } else if (!target.src.endsWith('/logo.svg')) {
                        target.src = '/logo.svg';
                      }
                    }}
                    alt="Logo" 
                    className="h-10 w-auto object-contain rounded-md bg-white p-0.5 border border-amber-400 shadow-sm"
                  />
                  <div>
                    <h2 className="font-serif text-lg font-bold tracking-tight text-amber-300 leading-none">NWS</h2>
                    <p className="text-[10px] uppercase tracking-wider text-slate-200 mt-0.5 font-mono font-bold">Stato Sovrano</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-colors cursor-pointer"
                  aria-label="Chiudi menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                
                {/* SECTION 1: SERVIZI SOVRANI */}
                <div>
                  <p className="text-xs uppercase tracking-widest font-mono text-amber-300 px-3 mb-2.5 font-black flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{tText('Sovereign Services', 'Servizi Sovrani')}</span>
                  </p>
                  <div className="space-y-1.5">
                    {mobileServiceItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl transition duration-150 text-left cursor-pointer ${
                            isActive 
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md' 
                              : 'bg-white/5 hover:bg-white/10 text-white font-bold'
                          }`}
                          style={isActive ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-black rounded-md ${
                              isActive ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: ISTITUZIONI & CARTE */}
                <div>
                  <p className="text-xs uppercase tracking-widest font-mono text-amber-300 px-3 mb-2.5 font-black flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>{tText('Institutions & Charters', 'Istituzioni & Carte Sovrane')}</span>
                  </p>
                  <div className="space-y-1.5">
                    {institutionItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl transition duration-150 text-left cursor-pointer ${
                            isActive 
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md' 
                              : 'bg-white/5 hover:bg-white/10 text-white font-semibold'
                          }`}
                          style={isActive ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                        </button>
                      );
                    })}

                    {/* ADMIN CONSOLE LINK */}
                    <button
                      onClick={() => handleNavClick('admin')}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition duration-150 text-left cursor-pointer ${
                        activeTab === 'admin' 
                          ? 'bg-amber-400 text-slate-950 font-black' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                      }`}
                      style={activeTab === 'admin' ? { backgroundColor: '#facc15', color: '#020617' } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4.5 h-4.5 text-slate-400" />
                        <span className="text-sm font-semibold">{t('adminConsole') || 'Consolle Amministrazione'}</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Drawer Footer with Language Settings */}
              <div className="p-5 border-t border-white/15 shrink-0 bg-[#050f24] text-center space-y-3">
                <LanguageSelector variant="drawer" onSelect={() => setIsMobileOpen(false)} />
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                  New World State • Anagrafe Sovrana
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
