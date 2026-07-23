import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Globe, Menu, ShieldCheck, X, Home, Landmark, BookOpen, FileText, Shield, UserPlus, Lock, Wifi, Settings, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../../hooks/useBranding';

interface HeaderProps {
  activeTab?: 'welcome' | 'register' | 'admin' | 'constitution' | 'charter' | 'governance' | 'privacy' | 'network' | 'democracy' | 'chat';
  setActiveTab?: (tab: 'welcome' | 'register' | 'admin' | 'constitution' | 'charter' | 'governance' | 'privacy' | 'network' | 'democracy' | 'chat') => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { language, setLanguage, t, tText } = useI18n();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { branding } = useBranding();

  interface NavItem {
    id: 'welcome' | 'register' | 'admin' | 'constitution' | 'charter' | 'governance' | 'privacy' | 'network' | 'democracy' | 'chat';
    label: string;
    icon: React.ComponentType<any>;
    highlight?: boolean;
  }

  const navigationItems: NavItem[] = [
    { id: 'welcome', label: t('homeIntro'), icon: Home },
    { id: 'democracy', label: t('directDemocracy'), icon: Landmark, highlight: true },
    { id: 'constitution', label: t('constitution'), icon: BookOpen },
    { id: 'charter', label: t('charterOfRights'), icon: FileText },
    { id: 'governance', label: t('governance'), icon: Shield },
    { id: 'register', label: t('registration'), icon: UserPlus },
    { id: 'privacy', label: t('privacyProtocol'), icon: Lock },
    { id: 'network', label: t('networkStatus'), icon: Wifi },
    { id: 'admin', label: t('adminConsole'), icon: Settings },
  ];

  const handleNavClick = (tabId: NavItem['id']) => {
    setActiveTab?.(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-blue/98 backdrop-blur-md border-b border-brand-gold/30 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            onClick={() => { setActiveTab?.('welcome'); setIsMobileOpen(false); }} 
            className="flex items-center gap-5 cursor-pointer"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-brand-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <img 
                src={branding.logo || "/LOGO_NEW-WORLD-STATE.jpg"} 
                alt="New World State Logo" 
                className="h-14 w-auto object-contain relative"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="font-serif text-2xl tracking-tight text-brand-gold leading-none">{t('title')}</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-3 h-3 text-brand-gold/70" />
                <p className="text-[9px] uppercase tracking-[0.3em] font-tech text-brand-gold/70">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-tech text-gray-300">
              <button 
                onClick={() => setActiveTab?.('welcome')}
                className={`hover:text-brand-gold transition-all duration-150 cursor-pointer ${activeTab === 'welcome' ? 'text-brand-gold font-bold scale-105 border-b border-brand-gold' : ''}`}
              >
                📊 {t('homeIntro')}
              </button>
              <button 
                onClick={() => setActiveTab?.('democracy')}
                id="header-democracy-tab-btn"
                className={`hover:text-brand-gold transition-all duration-150 cursor-pointer ${activeTab === 'democracy' ? 'text-brand-gold font-bold scale-105 border-b border-brand-gold' : 'text-brand-gold font-extrabold flex items-center gap-1.5'}`}
              >
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping" />
                {t('directDemocracy')}
              </button>
              <button 
                onClick={() => setActiveTab?.('constitution')}
                className={`hover:text-brand-gold transition-all duration-150 cursor-pointer ${activeTab === 'constitution' ? 'text-brand-gold font-bold scale-105 border-b border-brand-gold' : ''}`}
              >
                {t('constitution')}
              </button>
              <button 
                onClick={() => setActiveTab?.('charter')}
                className={`hover:text-brand-gold transition-all duration-150 cursor-pointer ${activeTab === 'charter' ? 'text-brand-gold font-bold scale-105 border-b border-brand-gold' : ''}`}
              >
                {t('charterOfRights')}
              </button>
              <button 
                onClick={() => setActiveTab?.('governance')}
                className={`hover:text-brand-gold transition-all duration-150 cursor-pointer ${activeTab === 'governance' ? 'text-brand-gold font-bold scale-105 border-b border-brand-gold' : ''}`}
              >
                {t('governance')}
              </button>
            </div>

            <div className="h-4 w-px bg-white/10 hidden lg:block" />

            <div className="flex items-center gap-2 group cursor-pointer">
              <Globe className="w-4 h-4 text-brand-gold group-hover:rotate-12 transition-transform" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-tech font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:text-brand-gold transition-colors"
              >
                <option value="it" className="text-white bg-[#0a1c3e]">🇮🇹 IT</option>
                <option value="en" className="text-white bg-[#0a1c3e]">🇬🇧 EN</option>
                <option value="fr" className="text-white bg-[#0a1c3e]">🇫🇷 FR</option>
                <option value="es" className="text-white bg-[#0a1c3e]">🇪🇸 ES</option>
                <option value="pt" className="text-white bg-[#0a1c3e]">🇵🇹 PT</option>
                <option value="ru" className="text-white bg-[#0a1c3e]">🇷🇺 RU</option>
                <option value="hi" className="text-white bg-[#0a1c3e]">🇮🇳 HI</option>
                <option value="bn" className="text-white bg-[#0a1c3e]">🇧🇩 BN</option>
                <option value="zh" className="text-white bg-[#0a1c3e]">🇨🇳 ZH</option>
                <option value="ja" className="text-white bg-[#0a1c3e]">🇯🇵 JA</option>
                <option value="ar" className="text-white bg-[#0a1c3e]">🌍 AR</option>
              </select>
            </div>
            
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-brand-gold" />
            </button>
          </div>
        </div>
      </header>

      {/* OFF-CANVAS MOBILE DRAWER MENU */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[320px] bg-brand-blue z-[101] shadow-2xl flex flex-col border-l border-brand-gold/30 text-white lg:hidden"
            >
              {/* Drawer Header */}
              <div className="h-20 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img 
                    src={branding.logo || "/LOGO_NEW-WORLD-STATE.jpg"} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <h2 className="font-serif text-base tracking-tight text-brand-gold leading-none">NWS</h2>
                    <p className="text-[8px] uppercase tracking-widest text-brand-gold/60 mt-0.5 font-tech">Sovereign State</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5 text-brand-gold transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Items Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.25em] font-tech text-brand-gold/60 px-3 mb-4">
                  {tText('Sovereign Navigation', 'Navigazione Sovrana')}
                </p>

                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition duration-200 text-left group cursor-pointer ${
                        isActive 
                          ? 'bg-brand-gold/15 border border-brand-gold/30 text-brand-gold font-bold shadow-inner' 
                          : 'hover:bg-white/5 border border-transparent text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-gold' : 'text-slate-400 group-hover:text-brand-gold transition-colors'}`} />
                        <span className="text-xs uppercase tracking-wider font-tech font-medium">{item.label}</span>
                      </div>
                      
                      {item.highlight && !isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer with Language Settings and metadata */}
              <div className="p-6 border-t border-white/10 shrink-0 bg-black/10 text-center space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-gold" />
                    <span className="text-[10px] uppercase tracking-wider font-tech text-slate-400">Language</span>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="bg-brand-blue border border-white/10 text-xs font-tech font-bold uppercase tracking-wider focus:outline-none cursor-pointer text-brand-gold p-1 rounded-lg"
                  >
                    <option value="it">🇮🇹 IT</option>
                    <option value="en">🇬🇧 EN</option>
                    <option value="fr">🇫🇷 FR</option>
                    <option value="es">🇪🇸 ES</option>
                    <option value="pt">🇵🇹 PT</option>
                    <option value="ru">🇷🇺 RU</option>
                    <option value="hi">🇮🇳 HI</option>
                    <option value="bn">🇧🇩 BN</option>
                    <option value="zh">🇨🇳 ZH</option>
                    <option value="ja">🇯🇵 JA</option>
                    <option value="ar">🌍 AR</option>
                  </select>
                </div>

                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-tech">
                  New World State • v1.0.3
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

