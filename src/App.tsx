/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Verified and synced with Cloudflare Pages Native Forms system.
 */

import React, { useState } from 'react';
import Header from './components/layout/Header';
import RegisterForm from './components/auth/RegisterForm';
import AdminDashboard from './components/auth/AdminDashboard';
import ConstitutionPage from './components/constitution/ConstitutionPage';
import CharterPage from './components/constitution/CharterPage';
import GovernancePage from './components/constitution/GovernancePage';
import PrivacyProtocolPage from './components/constitution/PrivacyProtocolPage';
import NetworkStatusPage from './components/constitution/NetworkStatusPage';
import VerifyCitizenPage from './components/constitution/VerifyCitizenPage';
import DemocracyPortal from './components/democracy/DemocracyPortal';
import WelcomePage from './components/home/WelcomePage';
import FederalChat from './components/chat/FederalChat';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { ArrowUp, Cookie, MessageSquare, ArrowRight } from 'lucide-react';
import { startBackgroundSync } from './services/notifications';
import LegalComplianceModal from './components/pwa/LegalComplianceModal';
import AccessibilityWidget from './components/pwa/AccessibilityWidget';
import CookieConsentBanner from './components/pwa/CookieConsentBanner';
import SovereignCustodeDebugWidget from './components/pwa/SovereignCustodeDebugWidget';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'register' | 'admin' | 'constitution' | 'charter' | 'governance' | 'privacy' | 'network' | 'democracy' | 'chat'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'chat' || tabParam === 'democracy') {
        return 'democracy';
      }
      if (window.location.pathname === '/chat' || window.location.pathname === '/democracy') {
        return 'democracy';
      }
    }
    try {
      const saved = localStorage.getItem('nws_democracy_citizen') || sessionStorage.getItem('nws_democracy_citizen');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return 'democracy';
        }
      }
    } catch (e) {
      console.error('[AUTH-TAB-INIT-ERR]', e);
    }
    return 'welcome';
  });
  const [isVerifyPath] = useState<boolean>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return window.location.pathname === '/verify' || 
           window.location.pathname.startsWith('/verify') || 
           searchParams.get('verify') === 'true';
  });
  const { language } = useI18n();
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [complianceDocType, setComplianceDocType] = useState<'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa'>('privacy');

  const openCompliance = (type: 'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa') => {
    setComplianceDocType(type);
    setComplianceModalOpen(true);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  React.useEffect(() => {
    let citizenId: number | null = null;
    try {
      const saved = localStorage.getItem('nws_democracy_citizen') || sessionStorage.getItem('nws_democracy_citizen');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          citizenId = parsed.id;
        }
      }
    } catch (e) {
      console.error('[GLOBAL-SYNC-INIT-ERR]', e);
    }

    // Avvia la sincronizzazione globale per le notifiche
    startBackgroundSync(citizenId);

    // Forza check istantaneo quando la finestra riprende il focus
    const handleFocus = () => {
      startBackgroundSync(citizenId);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'en') {
      document.title = "New World State 1.0 | Global Citizenship Registry";
      
      const metaTitle = document.querySelector('meta[name="title"]');
      if (metaTitle) metaTitle.setAttribute('content', 'New World State 1.0 | Global Citizenship Registry');
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Join the global digital community. Official citizenship registration under the New World State.');
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', 'New World State 1.0 | Global Citizenship Registry');
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', 'Join the global digital community. Official citizenship registration.');
    } else {
      document.title = "New World State 1.0 | Registro Mondiale della Cittadinanza";
      
      const metaTitle = document.querySelector('meta[name="title"]');
      if (metaTitle) metaTitle.setAttribute('content', 'New World State 1.0 | Registro Mondiale della Cittadinanza');
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Unisciti alla comunità mondiale digitale. Registrazione ufficiale dei cittadini del New World State, basata su trasparenza, pace e progresso tecnologico.');
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', 'New World State 1.0 | Registro Mondiale della Cittadinanza');
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', 'Unisciti alla comunità mondiale digitale. Registrazione ufficiale dei cittadini del New World State.');
    }
  }, [language]);

  if (isVerifyPath) {
    return (
      <div className="min-h-screen bg-brand-parchment font-sans text-brand-blue selection:bg-brand-gold selection:text-brand-blue overflow-x-hidden pt-12">
        <header className="max-w-xl mx-auto px-6 mb-4 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0a1c3e] flex items-center justify-center font-serif font-bold text-white text-xs">NWS</div>
          <span className="font-serif font-bold tracking-wider text-[#0a1c3e] text-sm uppercase">New World State</span>
        </header>
        <main className="px-4 relative">
          <VerifyCitizenPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-parchment font-sans text-brand-blue selection:bg-brand-gold selection:text-brand-blue overflow-x-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pt-20 px-4 relative">
        {/* Background Decorative Element */}
        <div className="absolute top-40 -left-20 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-80 -right-20 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto py-10 relative">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-block px-4 py-1.5 border border-brand-gold/30 rounded-full bg-brand-gold/5 mb-2">
              <p className="text-[10px] uppercase tracking-[0.4em] font-tech text-brand-gold font-bold">New World State Official Registry</p>
            </div>
            
            <div className="relative">
              <h1 className="text-5xl md:text-8xl font-serif text-brand-blue tracking-tighter leading-[0.8] mb-4">
                Citizenship <br />
                <span className="italic text-brand-gold">World Sovereign</span>
              </h1>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-[0.03] text-[200px] font-serif font-bold select-none pointer-events-none hidden md:block">
                NWS
              </div>
            </div>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              {language === 'en' ? (
                <>Join the <span className="text-brand-blue font-medium">sovereign digital state</span>. A borderless community dedicated to universal rights, justice, and the collective advancement of humanity.</>
              ) : (
                <>Entra a far parte dello <span className="text-brand-blue font-medium">stato sovrano digitale</span>. Una comunità senza confini dedicata ai diritti universali, alla giustizia e al progresso collettivo dell'umanità.</>
              )}
            </p>
            
            {/* INTERACTIVE TAB SWITCHER (PORTAL VS ADMIN CONSOLE) */}
            <div className="flex justify-center pt-6">
              <div className="inline-flex bg-[#0a1c3e]/5 backdrop-blur-sm p-1.5 rounded-2xl border border-[#0a1c3e]/10 flex-wrap justify-center gap-1">
                <button 
                  onClick={() => setActiveTab('welcome')}
                  id="tab-welcome-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'welcome' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/75 hover:text-[#0a1c3e]'}`}
                >
                  🌟 {language === 'en' ? 'Start Here/Home' : 'Inizia Qui/Home'}
                </button>
                <button 
                  onClick={() => setActiveTab('register')}
                  id="tab-register-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'register' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/75 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Registration' : 'Registrazione'}
                </button>
                <button 
                  onClick={() => setActiveTab('constitution')}
                  id="tab-constitution-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'constitution' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/75 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Constitution' : 'Costituzione'}
                </button>
                <button 
                  onClick={() => setActiveTab('governance')}
                  id="tab-governance-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'governance' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/75 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Governance' : 'Governance'}
                </button>
                <button 
                  onClick={() => setActiveTab('charter')}
                  id="tab-charter-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'charter' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/75 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Charter of Rights' : 'Carta dei Diritti'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Decorative side accent */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden xl:block">
              <p className="writing-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] font-tech text-muted opacity-30">Authenticity • Integrity • Sovereignty</p>
            </div>
            
            {activeTab === 'welcome' ? (
              <WelcomePage onStartRegistration={() => setActiveTab('register')} onGoToDemocracy={() => setActiveTab('democracy')} />
            ) : activeTab === 'register' ? (
              <RegisterForm />
            ) : activeTab === 'admin' ? (
              <AdminDashboard />
            ) : activeTab === 'constitution' ? (
              <ConstitutionPage />
            ) : activeTab === 'governance' ? (
              <GovernancePage />
            ) : activeTab === 'privacy' ? (
              <PrivacyProtocolPage />
            ) : activeTab === 'network' ? (
              <NetworkStatusPage />
            ) : activeTab === 'democracy' ? (
              <DemocracyPortal onGoToAdmin={() => setActiveTab('admin')} />
            ) : activeTab === 'chat' ? (
              <div className="max-w-2xl mx-auto bg-white border border-[#c5a880]/30 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-fade-in my-10">
                <div className="w-16 h-16 rounded-full bg-[#0a1c3e]/5 text-[#0a1c3e] flex items-center justify-center mx-auto border border-[#0a1c3e]/10">
                  <MessageSquare className="w-8 h-8 text-brand-gold animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-xl text-[#0a1c3e] uppercase tracking-wide">
                    {language === 'en' ? 'Federal Chat Moved' : 'Chat Federale Spostata'}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {language === 'en' 
                      ? 'The Federal Chat service is now securely integrated inside the Citizen Area. Please login or register to access Hotlines, State Organs, and internal messaging with other citizens.' 
                      : 'Il servizio di Chat Federale è ora integrato in modo protetto all\'interno dell\'Area Cittadino (Democrazia Diretta). Accedi o registrati per comunicare con gli Organi di Stato e gli altri cittadini.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('democracy')}
                  className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl transition duration-150 shadow-lg inline-flex items-center gap-2 cursor-pointer border-b-4 border-brand-gold"
                >
                  <span>{language === 'en' ? 'Go to Democracy Portal' : 'Accedi all\'Area Utente'}</span>
                  <ArrowRight className="w-4 h-4 animate-bounce" />
                </button>
              </div>
            ) : (
              <CharterPage />
            )}
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-brand-blue/10 bg-white/30 backdrop-blur-sm text-center text-sm text-slate-600">
        <div className="max-w-xl mx-auto space-y-6">
          <p className="font-tech text-xs uppercase tracking-[0.1em]">© 2025 New World State Authority. Established MMXIV.</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 uppercase tracking-[0.3em] text-[9px] font-bold">
            <button 
              onClick={() => setActiveTab('constitution')} 
              className={`hover:text-brand-gold transition-colors border-b hover:border-brand-gold cursor-pointer ${activeTab === 'constitution' ? 'border-brand-gold text-brand-gold font-bold' : 'border-transparent'}`}
            >
              {language === 'en' ? 'Constitution' : 'Costituzione'}
            </button>
            <button 
              onClick={() => setActiveTab('charter')} 
              className={`hover:text-brand-gold transition-colors border-b hover:border-brand-gold cursor-pointer ${activeTab === 'charter' ? 'border-brand-gold text-brand-gold font-bold' : 'border-transparent'}`}
            >
              {language === 'en' ? 'Charter of Rights' : 'Carta dei Diritti'}
            </button>
            <button 
              onClick={() => setActiveTab('privacy')} 
              className={`hover:text-brand-gold transition-colors border-b hover:border-brand-gold cursor-pointer ${activeTab === 'privacy' ? 'border-brand-gold text-brand-gold font-bold' : 'border-transparent'}`}
            >
              {language === 'en' ? 'Privacy Protocol' : 'Protocollo Privacy'}
            </button>
            <button 
              onClick={() => setActiveTab('network')} 
              className={`hover:text-brand-gold transition-colors border-b hover:border-brand-gold cursor-pointer ${activeTab === 'network' ? 'border-brand-gold text-brand-gold font-bold' : 'border-transparent'}`}
            >
              {language === 'en' ? 'Network Status' : 'Stato Network'}
            </button>
            <button 
              onClick={() => setActiveTab('admin')} 
              id="footer-admin-btn"
              className={`hover:text-brand-gold transition-colors border-b hover:border-brand-gold cursor-pointer ${activeTab === 'admin' ? 'border-brand-gold text-brand-gold font-bold' : 'border-transparent'}`}
            >
              {language === 'en' ? 'Admin Console' : 'Consolle Amministratore'}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 uppercase tracking-[0.25em] text-[8px] font-semibold text-slate-600 mt-6 border-t border-[#0a1c3e]/5 pt-4">
            <button 
              onClick={() => openCompliance('privacy')} 
              className="hover:text-brand-gold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Privacy Policy' : 'Informativa Privacy'}
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => openCompliance('cookies')} 
              className="hover:text-brand-gold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cookie Policy' : 'Cookie Policy'}
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => openCompliance('terms')} 
              className="hover:text-brand-gold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Terms & Conditions' : 'Termini e Condizioni'}
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => openCompliance('accessibility')} 
              className="hover:text-brand-gold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Accessibility' : 'Accessibilità'}
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => openCompliance('ccpa')} 
              className="hover:text-brand-gold transition-colors cursor-pointer text-[#0a1c3e] font-bold"
              id="footer-ccpa-link"
            >
              {language === 'en' ? 'Do Not Sell or Share My Personal Information' : 'Non Vendere i Miei Dati (CCPA)'}
            </button>
          </div>
        </div>
      </footer>

      {/* COMPLIANCE LEGAL MODAL (GDPR / WCAG COMPLIANT) */}
      <LegalComplianceModal 
        isOpen={complianceModalOpen} 
        onClose={() => setComplianceModalOpen(false)} 
        initialDoc={complianceDocType} 
        language={language} 
      />

      {/* CUSTODE DIGITALE SIMULATION & DEBUG DESK (Appears above WCAG/Accessibility Widget) */}
      <SovereignCustodeDebugWidget />

      {/* ACCESSIBILITY FLOATING WIDGET (CONTRAST & TEXT SCALING) */}
      <AccessibilityWidget />

      {/* FLOATING PRIVACY & COOKIE CONSENT WIDGET */}
      <button
        onClick={() => window.dispatchEvent(new Event('nws_reopen_cookie_banner'))}
        className="fixed bottom-6 left-6 z-40 p-3 h-12 w-12 rounded-full bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#c5a880]/30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
        id="reopen-cookie-banner-btn"
        aria-label={language === 'en' ? 'Manage Cookie Preferences' : 'Gestisci preferenze cookie'}
        title={language === 'en' ? 'Manage Cookie Preferences' : 'Gestisci preferenze cookie'}
      >
        <Cookie className="w-5 h-5 stroke-[2] animate-pulse" />
      </button>

      {/* COOKIE CONSENT BANNER */}
      <CookieConsentBanner 
        onOpenPrivacy={() => openCompliance('privacy')} 
        onOpenCookies={() => openCompliance('cookies')} 
        onOpenCcpa={() => openCompliance('ccpa')}
      />

      {/* FLOAT SCROLL TO TOP BUTTON */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 h-12 w-12 rounded-full bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#c5a880]/30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        }`}
        id="scroll-to-top-btn"
        aria-label={language === 'en' ? 'Back to top' : 'Torna su'}
        title={language === 'en' ? 'Back to top' : 'Torna su'}
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
