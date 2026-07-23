import React, { useState, useEffect, useRef } from 'react';
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
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  MousePointerClick,
  ChevronDown
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';
import { 
  getMatchingVoicesForLanguage, 
  getBestVoiceForLanguage, 
  getDefaultBcp47ForLanguage, 
  getLanguageNativeName 
} from '../../utils/ttsVoices';
import { globalFallbackTtsPlayer } from '../../utils/fallbackAudioTts';

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

  // Screen Reader State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clickToRead, setClickToRead] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('nws_access_speech_rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Voices State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('nws_access_voice_name') || '';
  });

  // Real-time tracking references
  const currentTextRef = useRef<string>('');
  const currentCharIndexRef = useRef<number>(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const langMapping: Record<string, string> = {
    en: 'en-US',
    it: 'it-IT',
    fr: 'fr-FR',
    es: 'es-ES',
    pt: 'pt-PT',
    ru: 'ru-RU',
    hi: 'hi-IN',
    bn: 'bn-IN',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ar: 'ar-AE'
  };

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setVoices(allVoices);
      }
      
      // Auto-select a default if none is set
      const saved = localStorage.getItem('nws_access_voice_name');
      if (!saved && allVoices.length > 0) {
        const targetLang = language;
        const defaultVoice = allVoices.find(v => v.lang.toLowerCase().startsWith(targetLang) && v.localService) || 
                             allVoices.find(v => v.lang.toLowerCase().startsWith(targetLang));
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          localStorage.setItem('nws_access_voice_name', defaultVoice.name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Android Chrome & Safari async voice load polling
    const pollInterval = setInterval(() => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        clearInterval(pollInterval);
      }
    }, 250);

    return () => {
      clearInterval(pollInterval);
    };
  }, [language]);

  // When language changes, auto-select a suitable voice strictly for that language
  useEffect(() => {
    if (voices.length === 0) return;
    
    // Check if currently selected voice belongs to the new language
    const matching = getMatchingVoicesForLanguage(voices, language as Language);
    const isValidForLang = matching.some(v => v.name === selectedVoiceName);
    
    if (!isValidForLang) {
      const bestVoice = getBestVoiceForLanguage(voices, language as Language);
      if (bestVoice) {
        setSelectedVoiceName(bestVoice.name);
        localStorage.setItem('nws_access_voice_name', bestVoice.name);
      } else {
        setSelectedVoiceName('default');
        localStorage.removeItem('nws_access_voice_name');
      }
    }
  }, [language, voices]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech engine
  const speakText = (text: string, rate: number = speechRate, isContinuing: boolean = false) => {
    if (typeof window === 'undefined') return;

    globalFallbackTtsPlayer.stop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Clean up text and emojis for cross-platform stability
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Keep track of full text being spoken
    if (!isContinuing) {
      currentTextRef.current = text;
      currentCharIndexRef.current = 0;
    }

    const playFallback = () => {
      setIsPlaying(true);
      setIsPaused(false);
      globalFallbackTtsPlayer.play(
        cleanText,
        language,
        rate,
        () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
        () => {
          setIsPlaying(false);
          setIsPaused(false);
        }
      );
    };

    const bestVoice = getBestVoiceForLanguage(voices, language as Language, selectedVoiceName);
    if (!bestVoice || !('speechSynthesis' in window)) {
      playFallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef.current = utterance; // Prevent Apple/Safari GC cleanup bug
    utterance.rate = rate;
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang;

    // Keep track of index on boundary change for real-time adjustments
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Accumulate character index offset if we were continuing
        currentCharIndexRef.current = (isContinuing ? currentCharIndexRef.current : 0) + event.charIndex;
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      activeUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn('[Accessibility TTS] Native error, trying streaming fallback:', e);
      activeUtteranceRef.current = null;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      playFallback();
    };

    // Micro delay after cancel to prevent iOS/Safari/Chrome race condition
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 60);
  };

  // Handle speed rate change in real-time
  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    localStorage.setItem('nws_access_speech_rate', newRate.toString());

    if (isPlaying && !isPaused) {
      // Cancel active speech
      window.speechSynthesis.cancel();
      
      // Resume from current char index onwards
      const remainingText = currentTextRef.current.substring(currentCharIndexRef.current);
      if (remainingText.trim().length > 0) {
        speakText(remainingText, newRate, true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  // Handle voice change in real-time
  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('nws_access_voice_name', voiceName);

    if (isPlaying && !isPaused) {
      // Cancel active speech
      window.speechSynthesis.cancel();
      
      // Resume from current char index onwards with the new voice
      const remainingText = currentTextRef.current.substring(currentCharIndexRef.current);
      if (remainingText.trim().length > 0) {
        // Briefly wait to let the cancellation register on some browsers
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(remainingText.trim());
          utterance.lang = langMapping[language] || language;
          utterance.rate = speechRate;
          
          const voice = voices.find(v => v.name === voiceName);
          if (voice) utterance.voice = voice;

          utterance.onboundary = (event) => {
            if (event.name === 'word') {
              currentCharIndexRef.current = currentCharIndexRef.current + event.charIndex;
            }
          };
          utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
          };
          utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
          };
          utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
          };
          window.speechSynthesis.speak(utterance);
        }, 50);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleReadFullPage = () => {
    // If welcome audio guide button is present, click it directly for full translated guide reading
    const welcomeAudioBtn = document.getElementById('welcome-audio-guide-btn');
    if (welcomeAudioBtn) {
      welcomeAudioBtn.click();
      return;
    }

    // Otherwise, select visible readable content from the document
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, [data-readable="true"]');
    const texts: string[] = [];
    
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.closest('.accessibility-exclude')) return;
      if (htmlEl.offsetParent === null && !htmlEl.classList.contains('fixed')) return;

      const text = htmlEl.textContent?.trim();
      if (text && text.length > 2) {
        const alreadyExists = texts.some(t => t === text || (t.length > text.length && t.includes(text)));
        if (!alreadyExists) {
          texts.push(text);
        }
      }
    });

    if (texts.length > 0) {
      speakText(texts.join('. '));
    } else {
      speakText(language === 'en' ? 'No readable content found on this page.' : 'Nessun contenuto leggibile trovato in questa pagina.');
    }
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    globalFallbackTtsPlayer.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleQuickPlayStopToggle = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handleReadFullPage();
    }
  };

  // Click & Hover to Read Engine
  useEffect(() => {
    if (!clickToRead) return;

    let activeEl: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest('.accessibility-exclude')) return;

      const tag = target.tagName.toLowerCase();
      const isReadable = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button', 'label'].includes(tag) || target.hasAttribute('data-readable');
      if (isReadable) {
        if (activeEl) {
          activeEl.style.outline = '';
          activeEl.style.outlineOffset = '';
        }
        activeEl = target;
        target.style.outline = '2px solid #c5a880';
        target.style.outlineOffset = '2px';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target === activeEl) {
        target.style.outline = '';
        target.style.outlineOffset = '';
        activeEl = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest('.accessibility-exclude')) return;

      const tag = target.tagName.toLowerCase();
      const isReadable = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button', 'label'].includes(tag) || target.hasAttribute('data-readable');
      if (isReadable) {
        e.preventDefault();
        e.stopPropagation();
        const text = target.textContent?.trim();
        if (text) {
          speakText(text);
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
      if (activeEl) {
        activeEl.style.outline = '';
        activeEl.style.outlineOffset = '';
      }
    };
  }, [clickToRead, speechRate, language, selectedVoiceName, voices]);

  // Handle Reset to Default
  const handleReset = () => {
    setFontSize(100);
    setContrastMode('normal');
    setSpeechRate(1.0);
    setClickToRead(false);
    
    const targetLang = language === 'en' ? 'en' : 'it';
    const defaultVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang) && v.localService) || 
                         voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
    if (defaultVoice) {
      setSelectedVoiceName(defaultVoice.name);
      localStorage.setItem('nws_access_voice_name', defaultVoice.name);
    }
    
    handleStop();
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

  // Filter voices matching selected language
  const languageFilteredVoices = getMatchingVoicesForLanguage(voices, language as Language);

  return (
    <div className="fixed bottom-6 left-6 z-[999] font-sans accessibility-exclude flex items-center gap-2">
      
      {/* 1. FLOATING CONTROL ACCESS BUTTONS FOR STARTING / STOPPING DIRECTLY */}
      <div className="flex items-center bg-[#0a1c3e] border border-[#c5a880]/30 rounded-full p-1 shadow-lg gap-1">
        
        {/* Main Panel Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 rounded-full bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 accessibility-exclude"
          id="accessibility-widget-toggle"
          aria-label={language === 'en' ? 'Accessibility Options' : 'Opzioni di Accessibilità'}
          title={language === 'en' ? 'Accessibility Options' : 'Opzioni di Accessibilità'}
        >
          {isOpen ? (
            <X className="w-4 h-4 stroke-[2.5] accessibility-exclude" />
          ) : (
            <Accessibility className="w-4 h-4 stroke-[2.5] accessibility-exclude" />
          )}
        </button>

        {/* Quick Read/Stop Shortcut Button */}
        <button
          onClick={handleQuickPlayStopToggle}
          className={`h-10 w-10 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 accessibility-exclude ${
            isPlaying 
              ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
          aria-label={
            isPlaying 
              ? (language === 'en' ? 'Stop Speech' : 'Ferma la Lettura') 
              : (language === 'en' ? 'Read Page Aloud' : 'Leggi Pagina ad Alta Voce')
          }
          title={
            isPlaying 
              ? (language === 'en' ? 'Stop Speech' : 'Ferma la Lettura') 
              : (language === 'en' ? 'Read Page Aloud' : 'Leggi Pagina ad Alta Voce')
          }
        >
          {isPlaying ? (
            <Square className="w-3.5 h-3.5 fill-white stroke-none accessibility-exclude animate-pulse" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white stroke-none ml-0.5 accessibility-exclude" />
          )}
        </button>

        {/* Quick Pause/Resume Shortcut Button (only visible when playing) */}
        {isPlaying && (
          <button
            onClick={isPaused ? handleResume : handlePause}
            className={`h-10 w-10 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 accessibility-exclude ${
              isPaused ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'
            }`}
            aria-label={
              isPaused 
                ? (language === 'en' ? 'Resume Speech' : 'Riprendi Lettura') 
                : (language === 'en' ? 'Pause Speech' : 'Pausa Lettura')
            }
            title={
              isPaused 
                ? (language === 'en' ? 'Resume Speech' : 'Riprendi Lettura') 
                : (language === 'en' ? 'Pause Speech' : 'Pausa Lettura')
            }
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-white stroke-none ml-0.5 accessibility-exclude" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-white stroke-none accessibility-exclude" />
            )}
          </button>
        )}
      </div>

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
              <Type className="w-3.5 h-3.5 text-[#c5a880] accessibility-exclude" />
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
              <Sun className="w-3.5 h-3.5 text-[#c5a880] accessibility-exclude" />
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
                {contrastMode === 'normal' && <Check className="w-3.5 h-3.5 text-[#c5a880] accessibility-exclude" />}
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
                {contrastMode === 'light' && <Check className="w-3.5 h-3.5 text-[#c5a880] accessibility-exclude" />}
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

          {/* Section 3: Screen Reader / Lettore Vocale */}
          <div className="space-y-2.5 accessibility-exclude">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block flex items-center gap-1.5 accessibility-exclude">
              <Volume2 className="w-3.5 h-3.5 text-[#c5a880] accessibility-exclude" />
              {language === 'en' ? 'Screen Reader (TTS)' : 'Lettore dello Schermo (Sintesi)'}
            </span>

            <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 accessibility-exclude">
              
              {/* Voice Changer Selector */}
              <div className="space-y-1 pb-1 accessibility-exclude">
                <label className="text-[9px] uppercase font-bold text-slate-400 block accessibility-exclude">
                  {language === 'en' ? 'Voice Model:' : 'Voce sintesi:'}
                </label>
                <div className="relative accessibility-exclude">
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-[10px] font-medium text-[#0a1c3e] cursor-pointer focus:outline-none appearance-none accessibility-exclude"
                  >
                    <option value="default">
                      {getLanguageNativeName(language as Language)} - Auto ({getDefaultBcp47ForLanguage(language as Language)})
                    </option>
                    {languageFilteredVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name.replace(/Google/i, '').replace(/Microsoft/i, '').trim()} ({voice.localService ? 'HD' : 'Cloud'})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#0a1c3e]/60 accessibility-exclude">
                    <ChevronDown className="w-3 h-3 accessibility-exclude" />
                  </div>
                </div>
              </div>

              {/* Full Page Reading Actions */}
              <div className="flex items-center gap-2 accessibility-exclude">
                {!isPlaying ? (
                  <button
                    onClick={handleReadFullPage}
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-[#0a1c3e] hover:bg-[#0a1c3e]/90 text-white rounded-xl text-[10px] font-bold transition cursor-pointer accessibility-exclude"
                    title={language === 'en' ? 'Read full page content aloud' : 'Leggi ad alta voce l\'intero contenuto della pagina'}
                  >
                    <Play className="w-3 h-3 fill-white accessibility-exclude" />
                    {language === 'en' ? 'Read Page' : 'Leggi Pagina'}
                  </button>
                ) : (
                  <div className="flex-1 flex gap-1.5 accessibility-exclude">
                    {isPaused ? (
                      <button
                        onClick={handleResume}
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer accessibility-exclude"
                        title={language === 'en' ? 'Resume reading' : 'Riprendi la lettura'}
                      >
                        <Play className="w-3 h-3 fill-white accessibility-exclude" />
                        {language === 'en' ? 'Resume' : 'Riprendi'}
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer accessibility-exclude"
                        title={language === 'en' ? 'Pause reading' : 'Metti in pausa la lettura'}
                      >
                        <Pause className="w-3 h-3 fill-white accessibility-exclude" />
                        {language === 'en' ? 'Pause' : 'Pausa'}
                      </button>
                    )}
                    <button
                      onClick={handleStop}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer accessibility-exclude"
                      title={language === 'en' ? 'Stop reading' : 'Interrompi la lettura'}
                    >
                      <Square className="w-3 h-3 fill-white accessibility-exclude" />
                      {language === 'en' ? 'Stop' : 'Interrompi'}
                    </button>
                  </div>
                )}
              </div>

              {/* Read on click toggle */}
              <button
                onClick={() => setClickToRead(!clickToRead)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold transition border cursor-pointer ${
                  clickToRead
                    ? 'bg-[#c5a880]/20 border-[#c5a880] text-[#0a1c3e]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                } accessibility-exclude`}
                title={language === 'en' ? 'Read any element you hover & click on' : 'Scegli quale elemento leggere passandoci sopra e cliccando'}
              >
                <span className="flex items-center gap-1.5 accessibility-exclude">
                  <MousePointerClick className="w-3.5 h-3.5 accessibility-exclude" />
                  {language === 'en' ? 'Hover & Click to Read' : 'Passa e Clicca per Leggere'}
                </span>
                {clickToRead && <span className="text-[9px] text-[#0a1c3e] font-extrabold uppercase bg-[#c5a880]/30 px-1.5 py-0.5 rounded accessibility-exclude">{language === 'en' ? 'ON' : 'ATTIVO'}</span>}
              </button>

              {/* Speech rate controller */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-200/50 pt-2 text-[9px] text-slate-500 font-medium accessibility-exclude">
                <span className="accessibility-exclude">{language === 'en' ? 'Reading Speed:' : 'Velocità Lettura:'}</span>
                <div className="flex gap-1 accessibility-exclude">
                  {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition cursor-pointer ${
                        speechRate === rate
                          ? 'bg-[#0a1c3e] text-white border-[#0a1c3e]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      } accessibility-exclude`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
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
