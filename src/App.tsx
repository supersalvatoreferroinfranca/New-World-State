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
import DbStatus from './components/debug/DbStatus';
import DemocracyPortal from './components/democracy/DemocracyPortal';
import WelcomePage from './components/home/WelcomePage';
import { I18nProvider, useI18n } from './contexts/I18nContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'register' | 'admin' | 'constitution' | 'charter' | 'governance' | 'privacy' | 'network' | 'democracy'>('welcome');
  const [isVerifyPath] = useState<boolean>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return window.location.pathname === '/verify' || 
           window.location.pathname.startsWith('/verify') || 
           searchParams.get('verify') === 'true';
  });
  const { language } = useI18n();

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

            <p className="text-lg md:text-xl text-muted/80 max-w-3xl mx-auto font-light leading-relaxed">
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
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'welcome' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                >
                  🌟 {language === 'en' ? 'Start Here/Home' : 'Inizia Qui/Home'}
                </button>
                <button 
                  onClick={() => setActiveTab('register')}
                  id="tab-register-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'register' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Registration' : 'Registrazione'}
                </button>
                <button 
                  onClick={() => setActiveTab('constitution')}
                  id="tab-constitution-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'constitution' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Constitution' : 'Costituzione'}
                </button>
                <button 
                  onClick={() => setActiveTab('governance')}
                  id="tab-governance-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'governance' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                >
                  {language === 'en' ? 'Governance' : 'Governance'}
                </button>
                <button 
                  onClick={() => setActiveTab('charter')}
                  id="tab-charter-btn"
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === 'charter' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
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
              <DemocracyPortal />
            ) : (
              <CharterPage />
            )}
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-brand-blue/10 bg-white/30 backdrop-blur-sm text-center text-sm text-muted">
        {activeTab === 'admin' && (
          <div className="mb-8 flex justify-center">
            <DbStatus />
          </div>
        )}
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
        </div>
      </footer>
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
