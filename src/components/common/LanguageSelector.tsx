import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LanguageOption {
  code: Language;
  flagCode: string;
  label: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'it', flagCode: 'it', label: 'IT', nativeName: 'Italiano' },
  { code: 'en', flagCode: 'gb', label: 'EN', nativeName: 'English' },
  { code: 'fr', flagCode: 'fr', label: 'FR', nativeName: 'Français' },
  { code: 'es', flagCode: 'es', label: 'ES', nativeName: 'Español' },
  { code: 'pt', flagCode: 'pt', label: 'PT', nativeName: 'Português' },
  { code: 'ru', flagCode: 'ru', label: 'RU', nativeName: 'Русский' },
  { code: 'hi', flagCode: 'in', label: 'HI', nativeName: 'हिन्दी' },
  { code: 'bn', flagCode: 'bd', label: 'BN', nativeName: 'বাংলা' },
  { code: 'zh', flagCode: 'cn', label: 'ZH', nativeName: '中文' },
  { code: 'ja', flagCode: 'jp', label: 'JA', nativeName: '日本語' },
  { code: 'ar', flagCode: 'sa', label: 'AR', nativeName: 'العربية' },
];

interface LanguageSelectorProps {
  variant?: 'header' | 'drawer' | 'card';
  className?: string;
  onSelect?: () => void;
}

export function FlagIcon({ flagCode, className = "w-5 h-3.5" }: { flagCode: string; className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Elegant fallback SVG badge with ISO country code
    return (
      <span className={`inline-flex items-center justify-center bg-brand-gold/20 text-brand-gold border border-brand-gold/40 rounded-sm text-[9px] font-bold uppercase leading-none ${className}`}>
        {flagCode.substring(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${flagCode}.png`}
      srcSet={`https://flagcdn.com/w80/${flagCode}.png 2x`}
      alt={`${flagCode} flag`}
      onError={() => setImgError(true)}
      className={`object-cover rounded-[2px] shadow-sm shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

export default function LanguageSelector({ variant = 'header', className = '', onSelect }: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
    onSelect?.();
  };

  const isDrawer = variant === 'drawer';
  const isCard = variant === 'card';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 transition-all duration-200 cursor-pointer rounded-xl ${
          isCard
            ? 'w-full bg-white/5 border border-white/10 p-3 justify-between hover:bg-white/10 text-white'
            : isDrawer
            ? 'w-full bg-brand-blue/80 border border-white/15 p-2.5 justify-between hover:border-brand-gold/50 text-white'
            : 'px-2.5 py-1.5 hover:bg-white/10 text-white hover:text-brand-gold'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-brand-gold shrink-0" />
          <FlagIcon flagCode={currentLangObj.flagCode} className="w-5 h-3.5" />
          <span className="text-xs font-tech font-bold uppercase tracking-widest text-brand-gold truncate">
            {currentLangObj.label}
          </span>
          {isDrawer && (
            <span className="text-xs text-gray-300 font-sans truncate ml-1">
              • {currentLangObj.nativeName}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-brand-gold/80 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isDrawer ? -4 : 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isDrawer ? -4 : 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[120] w-56 rounded-2xl bg-[#0a1c3e] border border-brand-gold/30 shadow-2xl overflow-hidden backdrop-blur-xl ${
              isDrawer ? 'right-0 top-full mt-2 w-full' : isCard ? 'left-0 right-0 top-full mt-2 w-full' : 'right-0 top-full mt-2'
            }`}
          >
            <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] font-tech text-brand-gold/60 border-b border-white/10 mb-1">
                Select Language / Scegli Lingua
              </div>
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-gold/20 text-brand-gold font-bold border border-brand-gold/30'
                        : 'text-gray-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FlagIcon flagCode={lang.flagCode} className="w-5 h-3.5 shrink-0" />
                      <span className="font-tech font-bold uppercase tracking-wider text-brand-gold text-[11px]">
                        {lang.label}
                      </span>
                      <span className="truncate text-gray-300 text-xs">
                        {lang.nativeName}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
