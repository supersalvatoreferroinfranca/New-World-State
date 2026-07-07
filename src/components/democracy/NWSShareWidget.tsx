import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Users, 
  Heart,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export function NWSShareWidget({ className = '', variant = 'standard' }: { className?: string; variant?: 'standard' | 'compact' | 'hero' }) {
  const { language } = useI18n();
  const [recipientName, setRecipientName] = useState('');
  const [messageStyle, setMessageStyle] = useState<'friendly' | 'inspiring' | 'informative'>('friendly');
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState('');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://newworldstate.cloud';

  // Preformatted messages
  const messages = {
    it: {
      friendly: {
        title: "Amichevole & Caldo",
        subject: "Unisciti a me nel New World State! 🌟",
        body: (name: string) => `Ciao${name ? ' ' + name : ''}! volevo farti conoscere un progetto pazzesco a cui ho appena aderito: il New World State. È uno Stato Digitale pacifico e globale, basato sul libero arbitrio e su una Costituzione bellissima. L'adesione è gratuita al 100% e ti rilasciano anche un passaporto digitale nominale in PDF! Dai un'occhiata qui, mi farebbe un sacco piacere se ne facessi parte anche tu: ${appUrl}`
      },
      inspiring: {
        title: "Ispiratore & Solenne",
        subject: "Una nuova era di libertà digitale: New World State 🌍",
        body: (name: string) => `Caro${name ? ' ' + name : ' amico'}, ti invito a leggere e aderire alla Costituzione del New World State. Una nazione interamente digitale, pacifica e globale che unisce cittadini di ogni continente per deliberare insieme con la democrazia diretta. Unisciti a questa rivoluzione di libertà e sovranità digitale, l'adesione è gratuita ed aperta a tutti: ${appUrl}`
      },
      informative: {
        title: "Informativo & Semplice",
        subject: "Come ottenere il passaporto del New World State 💳",
        body: (name: string) => `Ciao${name ? ' ' + name : ''}! Ti segnalo il New World State, una comunità digitale mondiale. Bastano 2 minuti per registrarsi gratuitamente, ottenere il passaporto digitale verificato in formato PDF e partecipare alle votazioni dei referendum globali. Trovi tutte le informazioni e la registrazione guidata qui: ${appUrl}`
      }
    },
    en: {
      friendly: {
        title: "Friendly & Casual",
        subject: "Join me in the New World State! 🌟",
        body: (name: string) => `Hi${name ? ' ' + name : ''}! I wanted to share an amazing project I just joined: the New World State. It's a peaceful global Digital State based on human free will and a beautiful Constitution. Joining is 100% free and they even issue a signed digital PDF passport! Take a look, I'd love for you to join me here: ${appUrl}`
      },
      inspiring: {
        title: "Inspiring & Solemn",
        subject: "A new era of digital freedom: New World State 🌍",
        body: (name: string) => `Dear${name ? ' ' + name : ' friend'}, I invite you to discover and join the New World State. An entirely digital, peaceful, global nation connecting citizens from all continents to deliberate together via direct democracy. Join this wave of freedom and digital sovereignty. It is free and open to everyone: ${appUrl}`
      },
      informative: {
        title: "Informative & Direct",
        subject: "Get your free New World State Digital Passport 💳",
        body: (name: string) => `Hello${name ? ' ' + name : ''}! Check out the New World State, a global digital community. It takes just 2 minutes to register for free, receive your verified PDF digital passport, and vote on global referendums. Read all details and sign up here: ${appUrl}`
      }
    }
  };

  const currentLang = language === 'en' ? 'en' : 'it';
  const activeMessageData = messages[currentLang][messageStyle];

  useEffect(() => {
    setShareText(activeMessageData.body(recipientName.trim()));
  }, [recipientName, messageStyle, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(activeMessageData.body(recipientName.trim()).replace(appUrl, ''))}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(activeMessageData.subject);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeMessageData.subject,
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm text-left ${className}`} id="nws-share-compact-widget">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-brand-gold" />
          <h4 className="font-serif font-bold text-slate-800 text-sm">
            {language === 'en' ? 'Invite friends and family' : 'Invita amici e parenti'}
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {language === 'en' 
            ? 'Spread the word about the New World State! Share a quick invite via your favorite platforms.' 
            : 'Fai conoscere il New World State alle persone care! Invia un invito rapido tramite le tue piattaforme preferite.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 min-w-[100px] bg-[#25D366] hover:bg-[#20ba59] text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            WhatsApp
          </button>
          <button 
            onClick={handleShareTelegram}
            className="flex-1 min-w-[100px] bg-[#0088cc] hover:bg-[#0077b3] text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          <button 
            onClick={handleCopy}
            className="flex-1 min-w-[100px] bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-gold animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (language === 'en' ? 'Copied!' : 'Copiato!') : (language === 'en' ? 'Copy Text' : 'Copia Testo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md text-left ${className}`} id="nws-share-full-widget">
      {/* Widget Header with Gold background header or nice brand banner */}
      <div className="bg-[#0a1c3e] text-white p-6 md:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-gold/20 mb-1">
              <Users className="w-3 h-3" />
              {language === 'en' ? 'Sovereign Outreach' : 'Diffusione Sovrana'}
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-white">
              {language === 'en' ? 'Spread the message' : 'Divulgazione: Fai conoscere lo Stato'}
            </h3>
            <p className="text-xs text-white/70 max-w-xl">
              {language === 'en' 
                ? 'Offer your loved ones the chance to join a peaceful digital society. Choose a preset, customize it, and share!'
                : 'Offri ai tuoi cari e ai tuoi amici l\'opportunità di far parte di una società digitale pacifica e libera. Scegli un messaggio, personalizzalo e condividilo gratuitamente.'}
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 text-brand-gold">
            <Heart className="w-8 h-8 fill-brand-gold/10 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CONFIGURATION COLUMN */}
          <div className="space-y-4">
            {/* Input name */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                {language === 'en' ? 'Recipient\'s name (Optional)' : 'Nome della persona cara (Opzionale)'}
              </label>
              <input 
                type="text"
                placeholder={language === 'en' ? 'e.g. Marie, John, Mum' : 'es. Maria, Francesco, Mamma'}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none transition text-brand-blue"
              />
            </div>

            {/* Message Style Tab Buttons */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                {language === 'en' ? 'Choose message tone' : 'Scegli il tono del messaggio'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['friendly', 'inspiring', 'informative'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setMessageStyle(style)}
                    className={`px-2.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition ${
                      messageStyle === style 
                        ? 'bg-brand-blue text-white shadow' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {messages[currentLang][style].title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons list */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                {language === 'en' ? 'Click to share instantly' : 'Clicca per inviare all\'istante'}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>{language === 'en' ? 'Share on WhatsApp' : 'Invia su WhatsApp'}</span>
                </button>
                
                <button 
                  onClick={handleShareTelegram}
                  className="bg-[#0088cc] hover:bg-[#0077b3] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'en' ? 'Share on Telegram' : 'Invia su Telegram'}</span>
                </button>

                <button 
                  onClick={handleShareEmail}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>{language === 'en' ? 'Send via Email' : 'Invia via Email'}</span>
                </button>

                <button 
                  onClick={handleCopy}
                  className="bg-brand-blue hover:bg-[#071530] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-brand-gold animate-bounce" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (language === 'en' ? 'Text copied!' : 'Testo copiato!') : (language === 'en' ? 'Copy message text' : 'Copia testo invito')}</span>
                </button>
              </div>

              {hasNativeShare && (
                <button 
                  onClick={handleNativeShare}
                  className="w-full bg-brand-gold/15 text-[#0a1c3e] hover:bg-brand-gold/25 border border-brand-gold/30 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Share using device tools' : 'Condividi tramite sistema operativo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* MESSAGE LIVE PREVIEW COLUMN */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">
                  {language === 'en' ? 'Live Message Preview' : 'Anteprima reale del messaggio'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-gold" /> {messages[currentLang][messageStyle].title}
                </span>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[160px] text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap select-all text-left shadow-inner">
                {shareText}
              </div>
            </div>

            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-3 flex items-start gap-3">
              <div className="p-1 rounded-full bg-brand-gold/15 text-brand-gold shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {language === 'en' 
                  ? 'Cost-free tools. Direct links utilize official secure deep links to trigger native apps on mobile/desktop without any tracking or intermediate servers.'
                  : 'Strumenti a costo zero. I collegamenti sfruttano i link ufficiali protetti per avviare direttamente WhatsApp, Telegram ed Email senza tracciamenti o server intermedi.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
