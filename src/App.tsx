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
import DbStatus from './components/debug/DbStatus';
import { I18nProvider } from './contexts/I18nContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'admin'>('register');

  return (
    <I18nProvider>
      <div className="min-h-screen bg-brand-parchment font-sans text-brand-blue selection:bg-brand-gold selection:text-brand-blue overflow-x-hidden">
        <Header />
        
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
                Join the <span className="text-brand-blue font-medium">sovereign digital state</span>. A borderless community dedicated to universal rights, justice, and the collective advancement of humanity.
              </p>
              
              {/* INTERACTIVE TAB SWITCHER (PORTAL VS ADMIN CONSOLE) */}
              <div className="flex justify-center pt-6">
                <div className="inline-flex bg-[#0a1c3e]/5 backdrop-blur-sm p-1.5 rounded-2xl border border-[#0a1c3e]/10">
                  <button 
                    onClick={() => setActiveTab('register')}
                    id="tab-register-btn"
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 ${activeTab === 'register' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                  >
                    Portale Registrazione
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin')}
                    id="tab-admin-btn"
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 ${activeTab === 'admin' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-[#0a1c3e]/60 hover:text-[#0a1c3e]'}`}
                  >
                    Consolle Amministratore
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Decorative side accent */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden xl:block">
                <p className="writing-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] font-tech text-muted opacity-30">Authenticity • Integrity • Sovereignty</p>
              </div>
              
              {activeTab === 'register' ? (
                <RegisterForm />
              ) : (
                <AdminDashboard />
              )}
            </div>
          </div>
        </main>

        <footer className="py-20 border-t border-brand-blue/10 bg-white/30 backdrop-blur-sm text-center text-sm text-muted">
          <div className="mb-8 flex justify-center">
            <DbStatus />
          </div>
          <div className="max-w-xl mx-auto space-y-6">
            <p className="font-tech text-xs uppercase tracking-[0.1em]">© 2025 New World State Authority. Established MMXIV.</p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 uppercase tracking-[0.3em] text-[9px] font-bold">
              <a href="#" className="hover:text-brand-gold transition-colors border-b border-transparent hover:border-brand-gold">Constitution</a>
              <a href="#" className="hover:text-brand-gold transition-colors border-b border-transparent hover:border-brand-gold">Charter of Rights</a>
              <a href="#" className="hover:text-brand-gold transition-colors border-b border-transparent hover:border-brand-gold">Privacy Protocol</a>
              <a href="#" className="hover:text-brand-gold transition-colors border-b border-transparent hover:border-brand-gold">Network Status</a>
            </div>
          </div>
        </footer>
      </div>
    </I18nProvider>
  );
}
