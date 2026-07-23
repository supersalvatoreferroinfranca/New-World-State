import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Vote, 
  FileText, 
  Smile, 
  Award, 
  ChevronDown,
  Volume2,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';
import PWANotifierBanner from '../pwa/PWANotifierBanner';
import { NWSShareWidget } from '../democracy/NWSShareWidget';
import { 
  HERO_DATA, 
  TTS_UI_DATA, 
  ROADMAP_DATA, 
  QUIZ_DATA, 
  PORTAL_CARDS_DATA, 
  FAQS_DATA, 
  FAQ_HEADER_DATA,
  FINAL_BANNER_DATA 
} from '../../data/welcomeTranslations';
import { 
  getMatchingVoicesForLanguage, 
  getBestVoiceForLanguage, 
  getDefaultBcp47ForLanguage, 
  getLanguageNativeName 
} from '../../utils/ttsVoices';

interface WelcomePageProps {
  onStartRegistration: () => void;
  onGoToDemocracy: () => void;
}

const BCP47_TAGS: Record<Language, string> = {
  it: 'it-IT',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  ru: 'ru-RU',
  hi: 'hi-IN',
  bn: 'bn-IN',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ar: 'ar-SA'
};

export default function WelcomePage({ onStartRegistration, onGoToDemocracy }: WelcomePageProps) {
  const { language } = useI18n();
  const currentLang: Language = language in FAQS_DATA ? language : 'en';

  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  
  // TTS (Text-to-Speech) State
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [ttsIndex, setTtsIndex] = useState(0);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Garbage collection protection for Safari / Apple WebKit & keepalive for Chrome/Edge/Firefox
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepaliveIntervalRef = useRef<any>(null);

  const stopKeepalive = () => {
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
      keepaliveIntervalRef.current = null;
    }
  };

  const startKeepalive = () => {
    stopKeepalive();
    // Chromium (Chrome/Edge/Brave/Opera) 15-second SpeechSynthesis freeze workaround
    keepaliveIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        stopKeepalive();
      }
    }, 10000);
  };

  const stopTts = () => {
    isPlayingRef.current = false;
    setIsTtsPlaying(false);
    stopKeepalive();
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Interactive quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const faqs = FAQS_DATA[currentLang] || FAQS_DATA.it;

  // Get current text chunks for reading aloud in active language
  const getSpeakTexts = (): string[] => {
    const lang = currentLang;
    const texts: string[] = [];

    // 1. Hero Content
    texts.push(`${HERO_DATA.titlePart1[lang]} ${HERO_DATA.titlePart2[lang]}`);
    texts.push(HERO_DATA.description[lang]);

    // 2. Three Golden Rules
    texts.push(ROADMAP_DATA.title[lang]);
    texts.push(`${ROADMAP_DATA.step1Title[lang]}: ${ROADMAP_DATA.step1Desc[lang]}`);
    texts.push(`${ROADMAP_DATA.step2Title[lang]}: ${ROADMAP_DATA.step2Desc[lang]}`);
    texts.push(`${ROADMAP_DATA.step3Title[lang]}: ${ROADMAP_DATA.step3Desc[lang]}`);

    // 3. Portal Roadmap
    texts.push(PORTAL_CARDS_DATA.title[lang]);
    texts.push(`${PORTAL_CARDS_DATA.card1Title[lang]}: ${PORTAL_CARDS_DATA.card1Desc[lang]}`);
    texts.push(`${PORTAL_CARDS_DATA.card2Title[lang]}: ${PORTAL_CARDS_DATA.card2Desc[lang]}`);
    texts.push(`${PORTAL_CARDS_DATA.card3Title[lang]}: ${PORTAL_CARDS_DATA.card3Desc[lang]}`);
    texts.push(`${PORTAL_CARDS_DATA.card4Title[lang]}: ${PORTAL_CARDS_DATA.card4Desc[lang]}`);

    // 4. FAQs
    texts.push(TTS_UI_DATA.title[lang]);
    const activeFaqs = FAQS_DATA[lang] || FAQS_DATA.it;
    activeFaqs.forEach(faq => {
      texts.push(faq.q);
      texts.push(faq.a);
    });

    // 5. Final Banner
    texts.push(FINAL_BANNER_DATA.title[lang]);
    texts.push(FINAL_BANNER_DATA.desc[lang]);

    return texts;
  };

  const speakTextSegment = (index: number, rateValue: number, playActive: boolean, voiceNameOverride?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    window.speechSynthesis.cancel();

    if (!playActive || !isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsTtsPlaying(false);
      return;
    }

    const segments = getSpeakTexts();
    if (index < 0 || index >= segments.length) {
      isPlayingRef.current = false;
      setIsTtsPlaying(false);
      setTtsIndex(0);
      return;
    }

    const rawText = segments[index];
    // Strip emojis for cross-platform engine stability (Android, Windows, iOS)
    const cleanText = rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      const nextIdx = index + 1;
      setTtsIndex(nextIdx);
      if (nextIdx < segments.length && isPlayingRef.current) {
        speakTextSegment(nextIdx, rateValue, true, voiceNameOverride);
      } else {
        isPlayingRef.current = false;
        setIsTtsPlaying(false);
        setTtsIndex(0);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef.current = utterance;
    utterance.rate = rateValue;

    const targetVoiceName = voiceNameOverride || selectedVoiceName;
    const bestVoice = getBestVoiceForLanguage(voices, currentLang, targetVoiceName);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.voice = null;
      utterance.lang = getDefaultBcp47ForLanguage(currentLang);
    }

    utterance.onend = () => {
      stopKeepalive();
      activeUtteranceRef.current = null;
      if (!isPlayingRef.current) return;

      const nextIdx = index + 1;
      setTtsIndex(nextIdx);
      if (nextIdx < segments.length && isPlayingRef.current) {
        speakTextSegment(nextIdx, rateValue, true, voiceNameOverride);
      } else {
        isPlayingRef.current = false;
        setIsTtsPlaying(false);
        setTtsIndex(0);
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech Synthesis error:", e);
      stopKeepalive();
      activeUtteranceRef.current = null;
      if (!isPlayingRef.current) return;

      if (e.error !== 'interrupted') {
        isPlayingRef.current = false;
        setIsTtsPlaying(false);
      }
    };

    setTimeout(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis && isPlayingRef.current) {
        startKeepalive();
        window.speechSynthesis.speak(utterance);
      }
    }, 60);
  };

  // Synchronously and asynchronously load voices for Android, Windows, Apple
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoiceList = () => {
      const systemVoices = window.speechSynthesis.getVoices();
      if (systemVoices.length > 0) {
        setVoices(prev => {
          if (prev.length === systemVoices.length && prev[0]?.name === systemVoices[0]?.name) {
            return prev;
          }
          return systemVoices;
        });
      }
    };

    updateVoiceList();

    const pollInterval = setInterval(updateVoiceList, 1000);

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }

    return () => {
      clearInterval(pollInterval);
      stopTts();
    };
  }, []);

  // When language changes or voices load, select matching voice without overwriting valid choices
  useEffect(() => {
    if (voices.length === 0) return;

    if (isPlayingRef.current) {
      stopTts();
      setTtsIndex(0);
    }

    const matching = getMatchingVoicesForLanguage(voices, currentLang);
    const isValidForLang = matching.some(v => v.name === selectedVoiceName);

    if (!isValidForLang) {
      const bestVoice = getBestVoiceForLanguage(voices, currentLang);
      if (bestVoice) {
        setSelectedVoiceName(bestVoice.name);
      } else {
        setSelectedVoiceName('default');
      }
    }
  }, [currentLang, voices]);

  // Clean stop on component unmount
  useEffect(() => {
    return () => {
      stopTts();
    };
  }, []);

  const handleStartStopTts = () => {
    if (isTtsPlaying) {
      stopTts();
    } else {
      isPlayingRef.current = true;
      setIsTtsPlaying(true);
      speakTextSegment(ttsIndex, ttsRate, true);
    }
  };

  const handleResetTts = () => {
    stopTts();
    setTtsIndex(0);
  };

  const handleRateChange = (newRate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, Number(newRate.toFixed(1))));
    setTtsRate(clampedRate);
    if (isTtsPlaying) {
      speakTextSegment(ttsIndex, clampedRate, true);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    const nextAnswers = [...quizAnswers, answer];
    setQuizAnswers(nextAnswers);
    
    if (quizStep < 2) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizResult("approved");
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const matchingVoices = getMatchingVoicesForLanguage(voices, currentLang);

  return (
    <div className="space-y-16 animate-fade-in" id="welcome-page-component">
      
      {/* HERO SECTION */}
      <div className="bg-[#0a1c3e] text-white rounded-3xl p-8 md:p-12 border-b-4 border-brand-gold shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <div className="inline-flex items-center gap-1.5 bg-brand-gold/15 text-amber-200 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-brand-gold/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            {HERO_DATA.badge[currentLang]}
          </div>

          <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
            {HERO_DATA.titlePart1[currentLang]} <br />
            <span className="text-brand-gold">{HERO_DATA.titlePart2[currentLang]}</span>
          </h2>

          <p className="text-base md:text-lg text-white/80 font-light leading-relaxed">
            {HERO_DATA.description[currentLang]}
          </p>

          {/* TTS SPEECH SYNTHESIS ACCESSIBILITY READER */}
          <div className="mx-auto max-w-xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3 shadow-inner text-left">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-brand-gold">
                <Volume2 className="w-5 h-5 text-brand-gold animate-pulse" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-amber-100">
                  {TTS_UI_DATA.title[currentLang]}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                {isTtsPlaying ? (
                  <span className="text-emerald-400 animate-pulse font-bold flex items-center gap-1">
                    ● {TTS_UI_DATA.readingSegment[currentLang]} {ttsIndex + 1}/{getSpeakTexts().length}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {TTS_UI_DATA.audioReady[currentLang].replace('{count}', getSpeakTexts().length.toString())}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Voice Choice */}
              <div className="flex items-center gap-2 bg-[#06122a] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-tech font-bold shrink-0">
                  {TTS_UI_DATA.voiceLabel[currentLang]}:
                </span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    const newVoice = e.target.value;
                    setSelectedVoiceName(newVoice);
                    if (isPlayingRef.current) {
                      speakTextSegment(ttsIndex, ttsRate, true, newVoice);
                    }
                  }}
                  className="bg-transparent text-xs text-brand-gold w-full focus:outline-none cursor-pointer"
                >
                  <option value="default" className="text-brand-blue bg-[#0a1c3e] text-xs">
                    {getLanguageNativeName(currentLang)} - Auto ({getDefaultBcp47ForLanguage(currentLang)})
                  </option>
                  {matchingVoices.map((v) => (
                    <option key={v.name} value={v.name} className="text-brand-blue bg-[#0a1c3e] text-xs">
                      {v.name.replace(/Google/i, '').replace(/Microsoft/i, '').trim().substring(0, 28)} ({v.localService ? 'HD' : 'Cloud'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center justify-between bg-[#06122a] p-1.5 rounded-xl border border-white/5 gap-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-tech font-bold pl-1.5 font-mono">
                  {TTS_UI_DATA.speedLabel[currentLang]}:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRateChange(ttsRate - 0.2)}
                    disabled={ttsRate <= 0.6}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center font-bold text-slate-300 text-xs disabled:opacity-30 cursor-pointer"
                    title={TTS_UI_DATA.slower[currentLang]}
                  >
                    -
                  </button>
                  <span className="text-xs font-tech font-bold text-brand-gold w-10 text-center">
                    {ttsRate.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => handleRateChange(ttsRate + 0.2)}
                    disabled={ttsRate >= 2.0}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center font-bold text-slate-300 text-xs disabled:opacity-30 cursor-pointer"
                    title={TTS_UI_DATA.faster[currentLang]}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Bar */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                id="welcome-audio-guide-btn"
                onClick={handleStartStopTts}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow cursor-pointer ${
                  isTtsPlaying 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e]'
                }`}
              >
                {isTtsPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    {TTS_UI_DATA.stopBtn[currentLang]}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    {TTS_UI_DATA.listenBtn[currentLang]}
                  </>
                )}
              </button>

              <button
                onClick={handleResetTts}
                disabled={ttsIndex === 0 && !isTtsPlaying}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-bold text-xs tracking-wider transition active:scale-95 disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {TTS_UI_DATA.resetBtn[currentLang]}
              </button>
            </div>

            {/* Subtitle Telemetry Display */}
            {isTtsPlaying && (
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-center text-slate-300 text-xs font-light italic leading-relaxed animate-fade-in max-h-16 overflow-y-auto">
                "{getSpeakTexts()[ttsIndex]}"
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button 
              onClick={onStartRegistration}
              className="bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e] px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition shadow-lg active:scale-95 border-b-4 border-amber-600 flex items-center gap-2 cursor-pointer"
            >
              {HERO_DATA.btnPassport[currentLang]}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={onGoToDemocracy}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition border border-white/20 active:scale-95 cursor-pointer"
            >
              {HERO_DATA.btnDemocracy[currentLang]}
            </button>
          </div>
        </div>
      </div>

      {/* PWA AND BROWSER NOTIFICATIONS SYSTEM PANEL */}
      <PWANotifierBanner />

      {/* LE 3 REGOLE D'ORO */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest font-mono text-[#8a6c31] font-bold">
            {ROADMAP_DATA.badge[currentLang]}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {ROADMAP_DATA.title[currentLang]}
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            {ROADMAP_DATA.subtitle[currentLang]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8a6c31] flex items-center justify-center font-bold text-xl border border-brand-gold/20">
              1
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {ROADMAP_DATA.step1Title[currentLang]}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ROADMAP_DATA.step1Desc[currentLang]}
            </p>
          </div>

          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#0a1c3e] flex items-center justify-center font-bold text-xl border border-indigo-100">
              2
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {ROADMAP_DATA.step2Title[currentLang]}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ROADMAP_DATA.step2Desc[currentLang]}
            </p>
          </div>

          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100">
              3
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {ROADMAP_DATA.step3Title[currentLang]}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ROADMAP_DATA.step3Desc[currentLang]}
            </p>
          </div>
        </div>
      </div>

      {/* QUIZ INTERATTIVO */}
      <div className="bg-amber-500/5 border border-brand-gold/30 rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-3xl opacity-25 select-none pointer-events-none">
          {QUIZ_DATA.badge[currentLang]}
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0a1c3e] font-mono">
              {QUIZ_DATA.subBadge[currentLang]}
            </span>
            <h3 className="font-serif text-[#0a1c3e] text-2xl font-bold">
              {QUIZ_DATA.title[currentLang]}
            </h3>
            <p className="text-xs text-slate-600">
              {QUIZ_DATA.subtitle[currentLang]}
            </p>
          </div>

          {quizResult ? (
            <div className="bg-white border border-brand-gold/30 rounded-2xl p-6 text-center space-y-4 shadow animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                <Smile className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="font-serif text-[#0a1c3e] text-xl font-bold">
                {QUIZ_DATA.resultTitle[currentLang]}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {QUIZ_DATA.resultDesc[currentLang]}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button 
                  onClick={onStartRegistration}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition uppercase shadow cursor-pointer"
                >
                  {QUIZ_DATA.resultCta[currentLang]}
                </button>
                <button 
                  onClick={resetQuiz}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {QUIZ_DATA.resultReset[currentLang]}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[160px] flex flex-col justify-between animate-fade-in">
              {quizStep === 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {QUIZ_DATA.q1Label[currentLang]}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm">
                    {QUIZ_DATA.q1Question[currentLang]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {QUIZ_DATA.q1OptionA[currentLang]}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500 cursor-pointer"
                    >
                      {QUIZ_DATA.q1OptionB[currentLang]}
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 1 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {QUIZ_DATA.q2Label[currentLang]}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm">
                    {QUIZ_DATA.q2Question[currentLang]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {QUIZ_DATA.q2OptionA[currentLang]}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500 cursor-pointer"
                    >
                      {QUIZ_DATA.q2OptionB[currentLang]}
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 2 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {QUIZ_DATA.q3Label[currentLang]}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm font-serif">
                    {QUIZ_DATA.q3Question[currentLang]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {QUIZ_DATA.q3OptionA[currentLang]}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500 cursor-pointer"
                    >
                      {QUIZ_DATA.q3OptionB[currentLang]}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STRUMENTI DI DIVULGAZIONE COSTO ZERO */}
      <NWSShareWidget />

      {/* COSA PUOI TROVARE SUL SITO: GUIDA CON INTERFACCIA COMPLETA */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase tracking-widest font-mono text-[#0a1c3e] font-bold">
            {PORTAL_CARDS_DATA.badge[currentLang]}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {PORTAL_CARDS_DATA.title[currentLang]}
          </h3>
          <p className="text-sm text-slate-600">
            {PORTAL_CARDS_DATA.subtitle[currentLang]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition">
            <div className="p-3 bg-amber-50 text-[#8a6c31] rounded-xl shrink-0">
              <Vote className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {PORTAL_CARDS_DATA.card1Title[currentLang]}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {PORTAL_CARDS_DATA.card1Desc[currentLang]}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition">
            <div className="p-3 bg-blue-50 text-brand-blue rounded-xl shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {PORTAL_CARDS_DATA.card2Title[currentLang]}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {PORTAL_CARDS_DATA.card2Desc[currentLang]}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {PORTAL_CARDS_DATA.card3Title[currentLang]}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {PORTAL_CARDS_DATA.card3Desc[currentLang]}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {PORTAL_CARDS_DATA.card4Title[currentLang]}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {PORTAL_CARDS_DATA.card4Desc[currentLang]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RISPOSTE VELOCI A DUBBI ED ESIGENZE (FAQ) */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase tracking-widest font-mono text-[#8a6c31] font-bold">
            FAQ
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {FAQ_HEADER_DATA.title[currentLang]}
          </h3>
          <p className="text-sm text-slate-600">
            {FAQ_HEADER_DATA.subtitle[currentLang]}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
              <button 
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full p-4 text-left font-bold text-xs md:text-sm text-[#0a1c3e] flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer"
              >
                <span data-readable="true" className="faq-question-text">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFAQ === index ? 'rotate-180 text-brand-gold' : ''}`} />
              </button>
              {activeFAQ === index && (
                <div data-readable="true" className="p-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white animate-fade-in faq-answer-text">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BANNER FINALE */}
      <div className="bg-gradient-to-br from-[#0a1c3e] to-[#c5a880]/20 rounded-3xl p-8 border border-[#c5a880]/30 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="text-brand-gold text-4xl">🚀</div>
        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="font-serif text-white text-2xl md:text-3xl font-bold">
            {FINAL_BANNER_DATA.title[currentLang]}
          </h3>
          <p className="text-xs md:text-sm text-white/80 leading-relaxed">
            {FINAL_BANNER_DATA.desc[currentLang]}
          </p>
        </div>

        <div className="pt-2">
          <button 
            onClick={onStartRegistration}
            className="bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e] px-10 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition shadow-lg hover:scale-105 active:scale-95 border-b-4 border-amber-600 cursor-pointer text-center"
          >
            {FINAL_BANNER_DATA.cta[currentLang]}
          </button>
        </div>

        <p className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em]">
          {FINAL_BANNER_DATA.copyright[currentLang]}
        </p>
      </div>

    </div>
  );
}
