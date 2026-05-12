import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Globe, Menu } from 'lucide-react';
import { motion } from 'motion/react';

export default function Header() {
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-blue/95 backdrop-blur-sm border-b border-brand-gold/30 text-white">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="https://www.newworldstate.org/wp-content/uploads/2025/03/NEW-WORLD-STATE-768x512.jpg" 
            alt="New World State Logo" 
            className="h-12 w-auto object-contain"
          />
          <div className="hidden md:block">
            <h1 className="font-serif text-xl tracking-tight text-brand-gold">{t('title')}</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-gold" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer hover:text-brand-gold transition-colors"
            >
              <option value="it" className="text-black">Italiano</option>
              <option value="en" className="text-black">English</option>
            </select>
          </div>
          
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
