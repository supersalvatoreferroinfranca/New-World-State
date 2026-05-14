import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Globe, Menu, ShieldCheck } from 'lucide-react';

export default function Header() {
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-blue/98 backdrop-blur-md border-b border-brand-gold/30 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-brand-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <img 
              src="https://www.newworldstate.org/wp-content/uploads/2025/03/NEW-WORLD-STATE-768x512.jpg" 
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
            <a href="#" className="hover:text-brand-gold transition-colors">Constituzione</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Governance</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Digital ID</a>
          </div>

          <div className="h-4 w-px bg-white/10 hidden lg:block" />

          <div className="flex items-center gap-2 group cursor-pointer">
            <Globe className="w-4 h-4 text-brand-gold group-hover:rotate-12 transition-transform" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-tech font-bold uppercase tracking-widest focus:outline-none cursor-pointer hover:text-brand-gold transition-colors"
            >
              <option value="it" className="text-black">IT</option>
              <option value="en" className="text-black">EN</option>
            </select>
          </div>
          
          <button className="md:hidden">
            <Menu className="w-6 h-6 text-brand-gold" />
          </button>
        </div>
      </div>
    </header>
  );
}

