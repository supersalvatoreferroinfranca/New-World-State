import React, { useState, useEffect } from 'react';
import { 
  Accessibility, 
  Type, 
  Sun, 
  Moon, 
  X, 
  Check, 
  RotateCcw,
  Plus,
  Minus,
  Sliders
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export default function AccessibilityWidget() {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  // Settings State
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('nws_access_font_size');
    return saved ? parseInt(saved, 10) : 100;
  });
  
  const [contrastMode, setContrastMode] = useState<'normal' | 'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nws_access_contrast');
    return (saved as 'normal' | 'light' | 'dark') || 'normal';
  });

  // Apply Font Size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('nws_access_font_size', fontSize.toString());
  }, [fontSize]);

  // Apply Contrast Mode changes
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('hc-light', 'hc-dark');
    
    if (contrastMode === 'light') {
      html.classList.add('hc-light');
    } else if (contrastMode === 'dark') {
      html.classList.add('hc-dark');
    }
    
    localStorage.setItem('nws_access_contrast', contrastMode);
  }, [contrastMode]);

  // Handle Reset to Default
  const handleReset = () => {
    setFontSize(100);
    setContrastMode('normal');
  };

  // Font adjustments
  const decreaseFont = () => {
    setFontSize(prev => Math.max(85, prev - 10));
  };

  const increaseFont = () => {
    setFontSize(prev => Math.min(160, prev + 10));
  };

  const getContrastLabel = (mode: typeof contrastMode) => {
    if (language === 'en') {
      switch (mode) {
        case 'normal': return 'Standard';
        case 'light': return 'High Contrast (Light)';
        case 'dark': return 'High Contrast (Dark)';
      }
    } else {
      switch (mode) {
        case 'normal': return 'Standard';
        case 'light': return 'Alto Contrasto (Chiaro)';
        case 'dark': return 'Alto Contrasto (Scuro)';
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[999] font-sans accessibility-exclude">
      
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#c5a880]/30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 accessibility-exclude"
        id="accessibility-widget-toggle"
        aria-label={language === 'en' ? 'Accessibility Options' : 'Opzioni di Accessibilità'}
        title={language === 'en' ? 'Accessibility Options' : 'Opzioni di Accessibilità'}
      >
        {isOpen ? (
          <X className="w-5 h-5 stroke-[2.5] accessibility-exclude" />
        ) : (
          <Accessibility className="w-5 h-5 stroke-[2.5] accessibility-exclude" />
        )}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div 
          className="absolute bottom-16 left-0 w-80 bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-5 space-y-5 animate-fade-in accessibility-exclude"
          id="accessibility-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 accessibility-exclude">
            <div className="flex items-center gap-2 accessibility-exclude">
              <Sliders className="w-4 h-4 text-[#0a1c3e] accessibility-exclude" />
              <h4 className="text-xs font-serif font-bold text-[#0a1c3e] uppercase tracking-wider accessibility-exclude">
                {language === 'en' ? 'Accessibility Desk' : 'Pannello Accessibilità'}
              </h4>
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] font-bold text-[#0a1c3e]/60 hover:text-[#0a1c3e] flex items-center gap-1 cursor-pointer transition hover:underline accessibility-exclude"
              title={language === 'en' ? 'Reset to Default' : 'Ripristina Predefiniti'}
            >
              <RotateCcw className="w-3.5 h-3.5 accessibility-exclude" />
              {language === 'en' ? 'Reset' : 'Ripristina'}
            </button>
          </div>

          {/* Section 1: Font Size Adjustment */}
          <div className="space-y-2.5 accessibility-exclude">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 accessibility-exclude">
              <Type className="w-3.5 h-3.5 text-brand-gold accessibility-exclude" />
              {language === 'en' ? 'Text Size' : 'Dimensione Testo'}
            </span>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 accessibility-exclude">
              <button
                onClick={decreaseFont}
                disabled={fontSize <= 85}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer flex items-center justify-center h-8 w-8 accessibility-exclude"
                title={language === 'en' ? 'Decrease Font Size' : 'Riduci dimensione carattere'}
              >
                <Minus className="w-4 h-4 accessibility-exclude" />
              </button>
              
              <div className="text-center accessibility-exclude">
                <span className="text-xs font-bold font-mono text-[#0a1c3e] accessibility-exclude">
                  {fontSize}%
                </span>
                <span className="text-[9px] text-slate-400 block font-light accessibility-exclude">
                  {fontSize === 100 
                    ? (language === 'en' ? 'Default' : 'Predefinito') 
                    : (fontSize > 100 ? (language === 'en' ? 'Larger' : 'Più Grande') : (language === 'en' ? 'Smaller' : 'Più Piccolo'))
                  }
                </span>
              </div>

              <button
                onClick={increaseFont}
                disabled={fontSize >= 160}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer flex items-center justify-center h-8 w-8 accessibility-exclude"
                title={language === 'en' ? 'Increase Font Size' : 'Aumenta dimensione carattere'}
              >
                <Plus className="w-4 h-4 accessibility-exclude" />
              </button>
            </div>
          </div>

          {/* Section 2: Contrast toggles */}
          <div className="space-y-2.5 accessibility-exclude">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 accessibility-exclude">
              <Sun className="w-3.5 h-3.5 text-brand-gold accessibility-exclude" />
              {language === 'en' ? 'Contrast Theme' : 'Tema Contrasto'}
            </span>

            <div className="grid grid-cols-1 gap-1.5 accessibility-exclude">
              {/* Option 1: Normal */}
              <button
                onClick={() => setContrastMode('normal')}
                className={`flex items-center justify-between p-2.5 rounded-xl text-[11px] font-bold transition border cursor-pointer text-left ${
                  contrastMode === 'normal'
                    ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                } accessibility-exclude`}
              >
                <span className="accessibility-exclude">{getContrastLabel('normal')}</span>
                {contrastMode === 'normal' && <Check className="w-3.5 h-3.5 text-brand-gold accessibility-exclude" />}
              </button>

              {/* Option 2: High Contrast Light */}
              <button
                onClick={() => setContrastMode('light')}
                className={`flex items-center justify-between p-2.5 rounded-xl text-[11px] font-bold transition border cursor-pointer text-left ${
                  contrastMode === 'light'
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                } accessibility-exclude`}
              >
                <div className="flex items-center gap-2 accessibility-exclude">
                  <div className="w-3.5 h-3.5 bg-white border border-black rounded-full accessibility-exclude" />
                  <span className="accessibility-exclude">{getContrastLabel('light')}</span>
                </div>
                {contrastMode === 'light' && <Check className="w-3.5 h-3.5 text-brand-gold accessibility-exclude" />}
              </button>

              {/* Option 3: High Contrast Dark */}
              <button
                onClick={() => setContrastMode('dark')}
                className={`flex items-center justify-between p-2.5 rounded-xl text-[11px] font-bold transition border cursor-pointer text-left ${
                  contrastMode === 'dark'
                    ? 'bg-slate-900 text-yellow-300 border-yellow-300 shadow-md'
                    : 'bg-slate-950 text-white border-slate-800 hover:bg-slate-900'
                } accessibility-exclude`}
              >
                <div className="flex items-center gap-2 accessibility-exclude">
                  <div className="w-3.5 h-3.5 bg-black border border-yellow-300 rounded-full accessibility-exclude" />
                  <span className="accessibility-exclude">{getContrastLabel('dark')}</span>
                </div>
                {contrastMode === 'dark' && <Check className="w-3.5 h-3.5 text-yellow-300 accessibility-exclude" />}
              </button>
            </div>
          </div>

          {/* Guidelines / Tips Footer */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[9px] text-slate-500 leading-normal font-light accessibility-exclude">
            {language === 'en' ? (
              <p>This accessibility panel complies with <strong>WCAG 2.1 AA</strong> guidelines. Text scaling adjusts overall application typography in real-time.</p>
            ) : (
              <p>Questo pannello è conforme alle linee guida <strong>WCAG 2.1 AA</strong>. La scalatura del testo adatta la tipografia dell'intera applicazione in tempo reale.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
