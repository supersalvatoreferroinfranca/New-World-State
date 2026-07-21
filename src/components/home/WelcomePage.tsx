import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Vote, 
  FileText, 
  Smile, 
  Award, 
  FileCheck,
  ChevronDown,
  Info,
  Volume2,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import PWANotifierBanner from '../pwa/PWANotifierBanner';
import { NWSShareWidget } from '../democracy/NWSShareWidget';

interface WelcomePageProps {
  onStartRegistration: () => void;
  onGoToDemocracy: () => void;
}

export default function WelcomePage({ onStartRegistration, onGoToDemocracy }: WelcomePageProps) {
  const { language, tText } = useI18n();
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  
  // TTS (Text-to-Speech) State
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsIndex, setTtsIndex] = useState(0);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Interactive banana quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const itFAQs = [
    {
      q: "Cos'è esattamente il New World State?",
      a: "È una comunità globale e inclusiva. Immagina uno Stato vero e proprio, dotato di Costituzione e passaporti d'adesione, ma interamente digitale: non occorre trasferirsi o lasciare la propria casa! Consente a persone reali di tutto il pianeta di confrontarsi e deliberare pacificamente insieme."
    },
    {
      q: "Ci sono costi d'iscrizione o tasse da pagare?",
      a: "Assolutamente NO! 💸 L'adesione è gratuita al 100% per tutti e lo sarà per sempre. Non ci sono costi nascosti, abbonamenti o annunci pubblicitari di terze parti. Chiediamo soltanto il tuo interesse e la tua partecipazione attiva."
    },
    {
      q: "Perché è necessario caricare la foto di un documento d'identità?",
      a: "Per garantire il massimo livello di trasparenza e sicurezza reciproca. Dobbiamo verificare che ogni iscritto sia effettivamente una persona reale e non un profilo automatizzato o un robot dedito all'invio di posta indesiderata 🤖. I tuoi documenti vengono custoditi d'accordo con severi protocolli di riservatezza e non verranno mai ceduti o condivisi."
    },
    {
      q: "Cosa posso fare una volta completata la registrazione?",
      a: "Potrai consultare e votare nei referendum della democrazia diretta federale, ottenere il tuo passaporto digitale nominale certificato in formato PDF, proporre nuove iniziative popolari e persino essere eletto o designato a incarichi di servizio della nostra comunità."
    }
  ];

  const enFAQs = [
    {
      q: "What exactly is the New World State?",
      a: "It is a global, inclusive digital community. Imagine a real state with its own Constitution and passports, but entirely digital: you don't need to move or leave your home! It allows real people from all over the world to discuss and vote on important things together."
    },
    {
      q: "Does it cost anything? Are there taxes?",
      a: "Absolutely NOT! 💸 Joining is 100% free and always will be. There are no fees, subscriptions, or third-party advertisements. We only ask for your interest and active participation."
    },
    {
      q: "Why do you require document verification photos?",
      a: "To ensure mutual safety and complete transparency. We must verify that every single member is a real human being and not a computerized bot or spam profile 🤖. Your document photos are secured under strict privacy standards and will never be shared or commercialized."
    },
    {
      q: "What can I do once I become a Citizen?",
      a: "You can view and vote on our direct democracy laws, obtain your officially signed digital Passport in PDF format, submit your own law proposals, and even be assigned to operational service roles in our digital community."
    }
  ];

  const faqs = language === 'en' ? enFAQs : itFAQs;

  // Get current text chunks for reading
  const getSpeakTexts = () => {
    const texts: string[] = [];

    // 1. Hero Content
    if (language === 'en') {
      texts.push("Hello! Welcome to the New World State!");
      texts.push("Have you ever dreamed of a unified digital space where every voice counts directly, without borders or complex bureaucracy? This is New World State: a peaceful and sovereign online community designed for all generations.");
    } else if (language === 'it') {
      texts.push("Benvenuto nel New World State!");
      texts.push("Hai mai desiderato una comunità globale senza barriere fisiche, priva di burocrazia complessa e dove la tua voce conta direttamente? Questo è il New World State: uno spazio condiviso, amichevole e sicuro, progettato per includere tutte le generazioni.");
    } else if (language === 'fr') {
      texts.push("Bonjour! Bienvenue dans l'État Citoyen Global!");
      texts.push("Avez-vous déjà rêvé d'un espace numérique unifié où chaque voix compte directement, sans frontières ni bureaucratie complexe? C'est le New World State: une communauté en ligne pacifique et souveraine conçue pour toutes les générations.");
    } else if (language === 'es') {
      texts.push("¡Hola! ¡Bienvenido al Estado Ciudadano Global!");
      texts.push("¿Alguna vez has soñado con un espacio digital unificado donde cada voz cuente directamente, sin fronteras ni burocracia compleja? Esto es New World State: una comunidad en línea pacífica y soberana diseñada para todas las generaciones.");
    } else if (language === 'pt') {
      texts.push("Olá! Bem-vindo ao Estado Cidadão Global!");
      texts.push("Você já sonhou com um espaço digital unificado onde cada voz conta diretamente, sem fronteiras ou burocracia complexa? Este é o New World State: uma comunidade online pacífica e soberana projetada para todas as gerações.");
    } else if (language === 'ru') {
      texts.push("Привет! Добро пожаловать во Всемирное Государство Граждан!");
      texts.push("Мечтали ли вы когда-нибудь о едином цифровом пространстве, где каждый голос учитывается напрямую, без границ и сложной бюрократии? Это New World State: мирное и суверенное онлайн-сообщество, созданное для всех поколений.");
    } else if (language === 'hi') {
      texts.push("नमस्ते! वैश्विक नागरिक राज्य में आपका स्वागत है!");
      texts.push("क्या आपने कभी एक ऐसे एकीकृत डिजिटल स्थान का सपना देखा है जहाँ हर आवाज बिना सीमाओं या जटिल नौकरशाही के सीधे मायने रखती है? यह न्यू वर्ल्ड स्टेट है: सभी पीढ़ियों के लिए डिज़ाइन किया गया एक शांतिपूर्ण और संप्रभु ऑनलाइन समुदाय।");
    } else if (language === 'bn') {
      texts.push("হ্যালো! বিশ্ব নাগরিক রাষ্ট্রে আপনাকে স্বাগতম!");
      texts.push("আপনি কি কখনো এমন একটি ঐক্যবদ্ধ ডিজিটাল স্পেসের স্বপ্ন দেখেছেন যেখানে প্রতিটি কণ্ঠস্বর সরাসরি গণনা করা হয়, সীমানা বা জটিল আমলাতন্ত্র ছাড়াই? এটি নিউ ওয়ার্ল্ড স্টেট: সমস্ত প্রজন্মের জন্য ডিজাইন করা একটি শান্তিপূর্ণ এবং সার্বভৌম অনলাইন সম্প্রদায়।");
    } else if (language === 'zh') {
      texts.push("你好！欢迎来到全球公民国家！");
      texts.push("您是否曾梦想过一个统一的数字空间，在这里，每个声音都直接计数，没有国界或复杂的官僚机构？这就是新世界国家：一个专为所有世代设计的和平且主权在线社区。");
    } else if (language === 'ja') {
      texts.push("こんにちは！世界市民国家へようこそ！");
      texts.push("国境や複雑な官僚主義なしに、すべての声が直接反映される、統一されたデジタル空間を夢見たことはありませんか？これが新世界国家（New World State）です。すべての世代のために設計された、平和で主権あるオンラインコミュニティです。");
    } else if (language === 'ar') {
      texts.push("مرحباً بك في دولة المواطن العالمي!");
      texts.push("هل حلمت يوماً بمساحة رقمية موحدة حيث يكون لكل صوت قيمة مباشرة، دون حدود أو بيروقراطية معقدة؟ هذه هي دولة العالم الجديد: مجتمع رقمي سلمي وسيادي مصمم لجميع الأجيال.");
    }

    // 2. Three Golden Rules
    if (language === 'en') {
      texts.push("How does the Digital State work?");
      texts.push("First rule: Register for Free. Fill out your basic details and upload your document. It only takes two minutes!");
      texts.push("Second rule: Receive Your Passport. Our officers verify your details and issue your membership. You will receive your official signed PDF passport via email.");
      texts.push("Third rule: Participate and Decide. Once active, you are a voting member. You can vote on proposals and key public reforms.");
    } else if (language === 'it') {
      texts.push("Come funziona lo Stato Digitale?");
      texts.push("Prima regola: Ti registri gratis. Inserisci i tuoi dati anagrafici di base e carichi una foto del documento ordinario per confermare la tua identità reale.");
      texts.push("Seconda regola: Ricevi il Passaporto. I funzionari del nostro archivio anagrafico verificano rapidamente i tuoi dati ed emettono il provvedimento d'iscrizione.");
      texts.push("Terza regola: Partecipi e decidi. Una volta ottenuto il passaporto, sarai a tutti gli effetti un membro deliberante! Potrai votare sulle decisioni chiave.");
    } else {
      texts.push(tText("How does the Digital State work?"));
      texts.push(tText("Register for Free. Fill out your basic details and upload your document."));
      texts.push(tText("Receive Your Passport. Our officers verify your details and issue your membership."));
      texts.push(tText("Participate and Decide. Once active, you are a voting member."));
    }

    // 3. FAQs Questions and Answers
    texts.push(language === 'en' ? "Frequently Asked Questions" : "Domande frequenti");
    faqs.forEach(faq => {
      texts.push(faq.q);
      texts.push(faq.a);
    });

    return texts;
  };

  const speakTextSegment = (index: number, rateValue: number, playActive: boolean) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    if (!playActive) return;

    const segments = getSpeakTexts();
    if (index < 0 || index >= segments.length) {
      setIsTtsPlaying(false);
      setTtsIndex(0);
      return;
    }

    const currentText = segments[index];
    const utterance = new SpeechSynthesisUtterance(currentText);
    
    // Find voice matching current language
    let selectedVoice = voices.find(v => v.name === selectedVoiceName);
    if (!selectedVoice || !selectedVoice.lang.toLowerCase().startsWith(language.toLowerCase())) {
      selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rateValue;
    utterance.lang = language;

    utterance.onend = () => {
      const nextIdx = index + 1;
      setTtsIndex(nextIdx);
      if (playActive) {
        speakTextSegment(nextIdx, rateValue, true);
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech Synthesis error:", e);
      if (e.error !== 'interrupted') {
        setIsTtsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Synchronously load available voices
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const updateVoiceList = () => {
      const systemVoices = window.speechSynthesis.getVoices();
      setVoices(systemVoices);
      
      // Select best voice matching the current language
      const bestMatch = systemVoices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
      if (bestMatch) {
        setSelectedVoiceName(bestMatch.name);
      }
    };

    updateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Clean stop on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartStopTts = () => {
    if (isTtsPlaying) {
      // Stop
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
    } else {
      // Start/Resume
      setIsTtsPlaying(true);
      // Start from current segment index
      speakTextSegment(ttsIndex, ttsRate, true);
    }
  };

  const handleResetTts = () => {
    window.speechSynthesis.cancel();
    setIsTtsPlaying(false);
    setTtsIndex(0);
  };

  const handleRateChange = (newRate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, Number(newRate.toFixed(1))));
    setTtsRate(clampedRate);
    if (isTtsPlaying) {
      // Instantly apply rate change by restarting current segment
      speakTextSegment(ttsIndex, clampedRate, true);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    const nextAnswers = [...quizAnswers, answer];
    setQuizAnswers(nextAnswers);
    
    if (quizStep < 2) {
      setQuizStep(quizStep + 1);
    } else {
      // Calculate funny result
      setQuizResult("approved");
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  return (
    <div className="space-y-16 animate-fade-in" id="welcome-page-component">
      
      {/* SEZIONE ACCOGLIENZA SUPER SEMPLICE E INTERGENERAZIONALE */}
      <div className="bg-[#0a1c3e] text-white rounded-3xl p-8 md:p-12 border-b-4 border-brand-gold shadow-2xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <div className="inline-flex items-center gap-1.5 bg-brand-gold/15 text-amber-200 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-brand-gold/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            {language === 'en' ? 'Sovereign Digital onboarding' : 'La tua Guida Semplificata'}
          </div>

          <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
            {language === 'en' ? (
              <>Hello! Welcome to the <br /><span className="text-brand-gold">New World State</span>!</>
            ) : (
              <>Benvenuto nel <br /><span className="text-brand-gold">New World State</span>!</>
            )}
          </h2>

          <p className="text-base md:text-lg text-white/80 font-light leading-relaxed">
            {language === 'en' ? (
              "Have you ever dreamed of a unified digital space where every voice counts directly, without borders or complex bureaucracy? This is New World State: a peaceful and sovereign online community designed for all generations."
            ) : (
              "Hai mai desiderato una comunità globale senza barriere fisiche, priva di burocrazia complessa e dove la tua voce conta direttamente? Questo è il New World State: uno spazio condiviso, amichevole e sicuro, progettato per includere tutte le generazioni."
            )}
          </p>

          {/* TTS SPEECH SYNTHESIS ACCESSIBILITY READER */}
          <div className="mx-auto max-w-xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3 shadow-inner text-left">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-brand-gold">
                <Volume2 className="w-5 h-5 text-brand-gold animate-pulse" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-amber-100">
                  {language === 'en' ? 'Audio Assistant Guide' : 'Guida Audio Assistita'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                {isTtsPlaying ? (
                  <span className="text-emerald-400 animate-pulse font-bold flex items-center gap-1">
                    ● Reading segment {ttsIndex + 1}/{getSpeakTexts().length}
                  </span>
                ) : (
                  <span className="text-slate-400">Audio ready • {getSpeakTexts().length} segments</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Voice Choice */}
              <div className="flex items-center gap-2 bg-[#06122a] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-tech font-bold shrink-0">Voice / Voce:</span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    setSelectedVoiceName(e.target.value);
                    if (isTtsPlaying) {
                      // Apply voice immediately in real time
                      setTimeout(() => {
                        speakTextSegment(ttsIndex, ttsRate, true);
                      }, 100);
                    }
                  }}
                  className="bg-transparent text-xs text-brand-gold w-full focus:outline-none cursor-pointer"
                >
                  {voices
                    .filter(v => v.lang.toLowerCase().startsWith(language.toLowerCase()))
                    .map((v, i) => (
                      <option key={i} value={v.name} className="text-brand-blue bg-[#0a1c3e] text-xs">
                        {v.name.replace(/Google/i, '').replace(/Microsoft/i, '').substring(0, 24)} ({v.lang})
                      </option>
                    ))}
                  {/* Fallback to list all voices if none match language */}
                  {voices.filter(v => v.lang.toLowerCase().startsWith(language.toLowerCase())).length === 0 && (
                    voices.slice(0, 15).map((v, i) => (
                      <option key={i} value={v.name} className="text-brand-blue bg-[#0a1c3e] text-xs">
                        {v.name.substring(0, 24)} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center justify-between bg-[#06122a] p-1.5 rounded-xl border border-white/5 gap-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-tech font-bold pl-1.5 font-mono">Speed / Vel:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRateChange(ttsRate - 0.2)}
                    disabled={ttsRate <= 0.6}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center font-bold text-slate-300 text-xs disabled:opacity-30 cursor-pointer"
                    title="Slower"
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
                    title="Faster"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Bar */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
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
                    {language === 'en' ? 'Stop Guide' : 'Ferma Guida'}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Listen Page 🎧' : 'Ascolta Pagina 🎧'}
                  </>
                )}
              </button>

              <button
                onClick={handleResetTts}
                disabled={ttsIndex === 0 && !isTtsPlaying}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-bold text-xs tracking-wider transition active:scale-95 disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {language === 'en' ? 'Reset' : 'Riavvia'}
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
              {language === 'en' ? 'Get My Free Passport Now 🚀' : 'Ottieni il Mio Passaporto Gratis 🚀'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={onGoToDemocracy}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition border border-white/20 active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'See What We Vote 🗳️' : 'Guarda Cosa Votiamo 🗳️'}
            </button>
          </div>
        </div>
      </div>

      {/* PWA AND BROWSER NOTIFICATIONS SYSTEM PANEL */}
      <PWANotifierBanner />

      {/* SPIEGATO FACILE: LE 3 REGOLE D'ORO */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest font-mono text-[#8a6c31] font-bold">
            {language === 'en' ? 'A Guided and Clear Roadmap' : 'Un percorso guidato e lineare'}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {language === 'en' ? 'How does the Digital State work?' : 'Come funziona lo Stato Digitale?'}
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            {language === 'en' 
              ? 'We have reduced the process to the essentials to make it accessible and pleasant for everyone.' 
              : 'Abbiamo ridotto all\'essenziale la procedura per renderla accessibile e confortevole a chiunque.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8a6c31] flex items-center justify-center font-bold text-xl border border-brand-gold/20">
              1
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {language === 'en' ? 'Register for Free' : 'Ti registri gratis'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en' 
                ? 'Fill out your basic details (name, date of birth, residential address) and upload a photo of your standard document to confirm your real identity. It only takes two minutes!' 
                : 'Inserisci i tuoi dati anagrafici di base (nome, data di nascita, indirizzo residenziale) e carichi una foto del documento ordinario per confermare la tua identità reale. Richiede solo un paio di minuti!'}
            </p>
          </div>

          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#0a1c3e] flex items-center justify-center font-bold text-xl border border-indigo-100">
              2
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {language === 'en' ? 'Receive Your Passport' : 'Ricevi il Passaporto'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en' 
                ? 'Our registry officers quickly verify your details and issue your membership. You will receive your official signed PDF passport via email protected by a 16-digit code.' 
                : 'I funzionari del nostro archivio anagrafico verificano rapidamente i tuoi dati ed emettono il provvedimento d\'iscrizione. Riceverai via e-mail il tuo passaporto ufficiale PDF protetto da un codice a 16 cifre.'}
            </p>
          </div>

          <div className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100">
              3
            </div>
            <h4 className="font-bold text-[#0a1c3e] text-base">
              {language === 'en' ? 'Participate and Decide' : 'Partecipi e decidi'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en' 
                ? 'Once your passport is active, you are a full voting member! You can vote YES or NO on proposals and key public reforms.' 
                : 'Una volta ottenuto il passaporto, sarai a tutti gli effetti un membro deliberante! Potrai votare SI o NO sulle proposte e riforme d\'interesse pubblico, esprimendoti su ogni decisione chiave.'}
            </p>
          </div>
        </div>
      </div>

      {/* QUIZ DIVERTENTE E GUIDATO - TEST DI CONOSCENZA */}
      <div className="bg-amber-500/5 border border-brand-gold/30 rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-3xl opacity-25 select-none pointer-events-none">
          {language === 'en' ? '✨ Self-Check' : '✨ Autocontrollo'}
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0a1c3e] font-mono">
              {language === 'en' ? 'Quick Alignment Test' : 'Test di Sincronia Veloce'}
            </span>
            <h3 className="font-serif text-[#0a1c3e] text-2xl font-bold">
              {language === 'en' ? 'Take the "Welcome Test" 🌟' : 'Fai il "Test di Benvenuto" 🌟'}
            </h3>
            <p className="text-xs text-slate-600">
              {language === 'en' 
                ? 'Three fast questions to help you verify if our digital democracy aligns with your values!' 
                : 'Tre risposte veloci per capire se la nostra democrazia fa al caso tuo!'}
            </p>
          </div>

          {quizResult ? (
            <div className="bg-white border border-brand-gold/30 rounded-2xl p-6 text-center space-y-4 shadow animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                <Smile className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="font-serif text-[#0a1c3e] text-xl font-bold">
                {language === 'en' ? 'RESULT: You are the ideal citizen! 🌟🎉' : 'RISULTATO: Sei il cittadino ideale! 🌟🎉'}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {language === 'en' 
                  ? 'You answered perfectly! Your choices indicate that you appreciate active participation, value freedom of thought, and look with confidence to new digital opportunities. You are ready to be part of the New World State!' 
                  : 'Hai risposto perfettamente! Le tue risposte indicano che ami la partecipazione attiva, apprezzi la libertà di pensiero e desideri guardare con fiducia alle nuove opportunità digitali. Sei pronto per far parte del New World State!'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button 
                  onClick={onStartRegistration}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition uppercase shadow"
                >
                  {language === 'en' ? 'Register now! 🚀' : 'Registrati subito! 🚀'}
                </button>
                <button 
                  onClick={resetQuiz}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  {language === 'en' ? 'Retake the test' : 'Rifai il test'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[160px] flex flex-col justify-between animate-fade-in">
              {quizStep === 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {language === 'en' ? 'Question 1 of 3' : 'Domanda 1 di 3'}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm">
                    {language === 'en' 
                      ? 'Do you like to express your opinion on decisions that impact the common interest? 🗳️' 
                      : 'Ti piace esprimere la tua opinione sulle decisioni di interesse comune? 🗳️'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700"
                    >
                      {language === 'en' ? '💡 Yes, I love participating and speaking up directly!' : '💡 Sì, mi piace partecipare e dire la mia in modo diretto!'}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500"
                    >
                      {language === 'en' ? '😴 I prefer letting other people make those choices for me.' : '😴 Preferisco lasciare che siano gli altri a scegliere per me.'}
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 1 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {language === 'en' ? 'Question 2 of 3' : 'Domanda 2 di 3'}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm">
                    {language === 'en' 
                      ? 'What do you usually do when you notice an inadequate rule or procedure in the real world? 🌍' 
                      : 'Cosa fai di solito quando noti una regola o una procedura inadeguata nel mondo reale? 🌍'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700"
                    >
                      {language === 'en' ? '🔥 I would love to propose concrete solutions and work for change!' : '🔥 Vorrei poter proporre soluzioni concrete e partecipare al cambiamento!'}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500"
                    >
                      {language === 'en' ? '🪴 I let it slide because I think nothing can ever honestly change.' : '🪴 Lascio correre perché penso che non si possa cambiare nulla.'}
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 2 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-[#8a6c31] uppercase font-bold">
                    {language === 'en' ? 'Question 3 of 3' : 'Domanda 3 di 3'}
                  </div>
                  <h4 className="font-bold text-[#0a1c3e] text-sm font-serif">
                    {language === 'en' 
                      ? 'Would you like to belong to a peaceful Digital State and obtain a free federal passport? 💳' 
                      : 'Ti piacerebbe far parte di uno Stato Digitale pacifico e ricevere un passaporto federale gratuito? 💳'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuizAnswer('A')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-gold hover:bg-brand-gold/5 transition text-xs font-semibold text-slate-700"
                    >
                      {language === 'en' ? '😎 Absolutely yes! It is an innovative and exciting concept.' : '😎 Assolutamente sì! È un\'idea innovativa ed emozionante.'}
                    </button>
                    <button 
                      onClick={() => handleQuizAnswer('B')}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#0a1c3e] hover:bg-[#0a1c3e]/5 transition text-xs font-semibold text-slate-500"
                    >
                      {language === 'en' ? '😢 No, I prefer old paths and standard paperwork.' : '😢 No, preferisco i vecchi canali e la burocrazia ordinaria.'}
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
            {language === 'en' ? 'Portal Roadmap' : 'La mappa del portale'}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {language === 'en' ? 'What can you find here?' : 'Cosa trovi su questo sito?'}
          </h3>
          <p className="text-sm text-slate-600">
            {language === 'en'
              ? 'A simple and friendly overview of the main areas of our digital environment!'
              : 'Un riassunto amichevole e immediato delle stanze principali del nostro Stato!'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-amber-50 text-[#8a6c31] rounded-xl">
              <Vote className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {language === 'en' ? 'Referendum & Voting (Democracy)' : 'Referendum e Votazioni (Democrazia)'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'The heart of our community! Here you can see proposals made by other citizens, view explanation details, vote \'In Favor\' or \'Against\', or submit your own ideas.'
                  : 'È il cuore pulsante! Qui vedi le riforme proposte dai cittadini. Puoi leggere i dettagli e votare "Favorevole" o "Contrario", oppure proporre una tua idea d\'interesse collettivo.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {language === 'en' ? 'Rules of the State (Constitution)' : 'Le Regole dello Stato (Costituzione)'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'No complicated legal jargon. Our fundamental principles are presented in a clean, straightforward, and readable Constitution and Charter of Rights.'
                  : 'Nessun linguaggio incomprensibile o polveroso. I nostri principi fondamentali sono scritti in modo chiaro, semplice e trasparente nella Costituzione e nella Carta dei Diritti.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {language === 'en' ? 'Data Protection & Privacy' : 'Tutela dei tuoi Dati (Privacy)'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'Your safety and privacy are our highest priority. We employ robust protocols to ensure your credentials are fully safeguarded from any misuse.'
                  : 'La tua sicurezza e la tua privacy sono per noi una priorità assoluta. Usiamo moderni protocolli di tutela per assicurarci che i dati inseriti siano protetti e al riparo da utilizzi impropri.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4 items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#0a1c3e] text-sm">
                {language === 'en' ? 'Administration Console' : 'Consolle di Amministrazione'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'An area reserved for verified officers to update the civil registry, approve digital PDF passport requests, and offer support to citizens.'
                  : 'L\'area riservata ai delegati d\'ufficio per l\'aggiornamento dell\'anagrafe, l\'attivazione dei passaporti digitali in formato PDF e il supporto diretto a tutti i cittadini.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RISPOSTE VELOCI A DUBBI ED ESIGENZE (FAQ) */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase tracking-widest font-mono text-[#8a6c31] font-bold">
            {language === 'en' ? 'Frequently Asked Questions' : 'Domande frequenti'}
          </span>
          <h3 className="text-2xl md:text-3xl font-serif text-[#0a1c3e] font-bold">
            {language === 'en' ? 'Clear Answers to Common Questions' : 'Risposte semplici a domande comuni'}
          </h3>
          <p className="text-sm text-slate-600">
            {language === 'en'
              ? 'Everything you need to know, explained in complete transparency.'
              : 'Tutto quello che c\'è da sapere, spiegato in totale trasparenza.'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-105 rounded-xl bg-white overflow-hidden shadow-sm">
              <button 
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full p-4 text-left font-bold text-xs md:text-sm text-[#0a1c3e] flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition"
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

      {/* BANNER FINALE: GUIDA ALLA REGISTRAZIONE ISTANTANEA */}
      <div className="bg-gradient-to-br from-[#0a1c3e] to-[#c5a880]/20 rounded-3xl p-8 border border-[#c5a880]/30 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="text-brand-gold text-4xl">🚀</div>
        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="font-serif text-white text-2xl md:text-3xl font-bold">
            {language === 'en' ? 'Join a New Digital Era' : 'Partecipa a una nuova era digitale'}
          </h3>
          <p className="text-xs md:text-sm text-white/80 leading-relaxed">
            {language === 'en'
              ? 'It only takes two minutes to secure your details and register into this peaceful and innovative global community.'
              : 'Bastano soli due minuti per registrare i propri dati in totale sicurezza ed entrare a far parte di questa innovativa rete pacifica e federale.'}
          </p>
        </div>

        <div className="pt-2">
          <button 
            onClick={onStartRegistration}
            className="bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e] px-10 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition shadow-lg hover:scale-105 active:scale-95 border-b-4 border-amber-600 cursor-pointer text-center"
          >
            {language === 'en' ? 'Start Free Registration Now! ✍️' : 'Inizia la Registrazione Gratuita Ora! ✍️'}
          </button>
        </div>

        <p className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em]">
          {language === 'en' 
            ? 'Secured and verified under the New World State Federal Protocol © 2026'
            : 'Controllato e garantito dal Protocollo Federale New World State © 2026'}
        </p>
      </div>

    </div>
  );
}
