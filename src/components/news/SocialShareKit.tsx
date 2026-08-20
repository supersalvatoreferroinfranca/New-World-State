import React, { useState, useMemo } from 'react';
import { NewsArticle } from '../../types/news';
import { stripFormattingSymbols } from '../../utils/textFormatter';
import { useI18n } from '../../contexts/I18nContext';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Twitter, 
  Linkedin, 
  Smartphone, 
  Hash, 
  Flame, 
  HelpCircle, 
  TrendingUp,
  FileText
} from 'lucide-react';

interface SocialShareKitProps {
  article: NewsArticle;
}

export default function SocialShareKit({ article }: SocialShareKitProps) {
  const { tText } = useI18n();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<'viral' | 'short' | 'debate'>('viral');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://newworldstate.cloud';
  const slug = article.slug || article.id;
  const articleUrl = `${origin}/notizie/${encodeURIComponent(slug)}`;

  const cleanTitle = stripFormattingSymbols(article.title) || 'Notizia';
  const cleanIntro = stripFormattingSymbols(article.intro) || '';
  const author = stripFormattingSymbols(article.authorName) || 'New World State';

  // Smart thematic hashtag generator
  const generatedHashtags = useMemo(() => {
    const set = new Set<string>();
    
    // Core brand & movement hashtags
    set.add('#NewWorldState');
    set.add('#InformazioneLibera');
    set.add('#GiornalismoEtico');

    // Article tags
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        const clean = stripFormattingSymbols(tag).replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]/g, '');
        if (clean.length > 2) {
          set.add(`#${clean.charAt(0).toUpperCase() + clean.slice(1)}`);
        }
      });
    }

    // Keyword detection
    const fullText = (cleanTitle + ' ' + cleanIntro).toLowerCase();
    if (fullText.includes('iran') || fullText.includes('usa') || fullText.includes('israele') || fullText.includes('palestina') || fullText.includes('guerra') || fullText.includes('conflitt')) {
      set.add('#Geopolitica');
      set.add('#MedioOriente');
      set.add('#Pace');
      set.add('#Esteri');
    }
    if (fullText.includes('economia') || fullText.includes('finanza') || fullText.includes('mercati') || fullText.includes('crisi')) {
      set.add('#Economia');
      set.add('#Attualità');
    }
    if (fullText.includes('diritt') || fullText.includes('libertà') || fullText.includes('sovranit')) {
      set.add('#DirittiUmani');
      set.add('#Sovranità');
    }
    if (fullText.includes('tecnolog') || fullText.includes('ia ') || fullText.includes('digitale') || fullText.includes('ai')) {
      set.add('#Tecnologia');
      set.add('#Innovazione');
    }
    if (fullText.includes('ambiente') || fullText.includes('clima') || fullText.includes('sostenibil')) {
      set.add('#Ambiente');
      set.add('#Sostenibilità');
    }

    set.add('#Attualità');
    set.add('#Notizie');

    return Array.from(set);
  }, [cleanTitle, cleanIntro, article.tags]);

  const hashtagsString = generatedHashtags.join(' ');

  // Template 1: Viral / Comprehensive Post
  const viralPostText = useMemo(() => {
    const hook = cleanIntro 
      ? (cleanIntro.length > 180 ? cleanIntro.slice(0, 177) + '...' : cleanIntro)
      : 'Un approfondimento fondamentale sul nostro presente per capire dove stiamo andando.';

    return `🌍 𝗣𝗥𝗜𝗠𝗢 𝗣𝗜𝗔𝗡𝗢 | ${cleanTitle}

📌 ${hook}

Un'analisi chiara, indipendente e senza censure per comprendere i veri scenari in evoluzione.

👇 𝗟𝗲𝗴𝗴𝗶 𝗹'𝗮𝗿𝘁𝗶𝗰𝗼𝗹𝗼 𝗰𝗼𝗺𝗽𝗹𝗲𝘁𝗼 𝗲 𝘂𝗻𝗶𝘀𝗰𝗶𝘁𝗶 𝗮𝗹𝗹𝗮 𝗱𝗶𝘀𝗰𝘂𝘀𝘀𝗶𝗼𝗻𝗲:
🔗 ${articleUrl}

${hashtagsString}`;
  }, [cleanTitle, cleanIntro, articleUrl, hashtagsString]);

  // Template 2: Short & Punchy (for X / Twitter / WhatsApp Status / Stories)
  const shortPostText = useMemo(() => {
    return `🚨 ${cleanTitle}

Leggi l'approfondimento completo su New World State:
👉 ${articleUrl}

${generatedHashtags.slice(0, 4).join(' ')}`;
  }, [cleanTitle, articleUrl, generatedHashtags]);

  // Template 3: Debate & Engagement (Prompts user opinions and comments)
  const debatePostText = useMemo(() => {
    return `🗣️ 𝗗𝗜𝗕𝗔𝗧𝗧𝗜𝗧𝗢 𝗔𝗣𝗘𝗥𝗧𝗢: ${cleanTitle}

Cosa ne pensi di questa situazione e quali saranno le conseguenze?

📖 Approfondisci con il reportage ufficiale:
👉 ${articleUrl}

Esprimi la tua opinione nei commenti! 👇
${hashtagsString}`;
  }, [cleanTitle, articleUrl, hashtagsString]);

  const currentPostText = useMemo(() => {
    if (activeTemplate === 'short') return shortPostText;
    if (activeTemplate === 'debate') return debatePostText;
    return viralPostText;
  }, [activeTemplate, shortPostText, debatePostText, viralPostText]);

  const handleCopy = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // Direct Social Share URLs
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const shareToTwitter = () => {
    const tweetText = `${cleanTitle}\n`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(articleUrl)}&hashtags=${encodeURIComponent(generatedHashtags.slice(0, 3).map(h => h.replace('#', '')).join(','))}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const shareToWhatsApp = () => {
    const text = `${cleanTitle}\n\n${cleanIntro ? cleanIntro.slice(0, 140) + '...\n\n' : ''}👉 Leggi su: ${articleUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTelegram = () => {
    const text = `${cleanTitle}\n\n${cleanIntro ? cleanIntro.slice(0, 160) + '...\n\n' : ''}${hashtagsString}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: cleanTitle,
          text: cleanIntro || cleanTitle,
          url: articleUrl,
        });
      } catch (e) {
        // User cancelled or share not allowed
      }
    } else {
      handleCopy(articleUrl, 'link');
    }
  };

  return (
    <div className="my-6 rounded-2xl border-2 border-brand-gold/40 bg-gradient-to-br from-[#0a1c3e]/5 via-[#c5a880]/10 to-amber-500/5 p-5 md:p-6 shadow-md">
      {/* Header with Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-gold/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0a1c3e] text-brand-gold shadow">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base md:text-lg text-[#0a1c3e] flex items-center gap-2">
              <span>{tText('Social Outreach & Sharing Kit', 'Kit di Condivisione e Divulgazione Social')}</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider bg-brand-gold/20 text-[#0a1c3e] px-2 py-0.5 rounded-md border border-brand-gold/40">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {tText('Maximum Reach', 'Massima Diffusione')}
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              {tText('Copy optimized posts with hashtags or share instantly with 1-click.', 'Copia testi pronti per i tuoi post con hashtag strategici o condividi subito.')}
            </p>
          </div>
        </div>

        {/* 1-Click Native Share on Mobile */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer border border-[#0a1c3e]"
          >
            <Smartphone className="w-4 h-4" />
            <span>{tText('Share on Mobile', 'Condividi dal Telefono')}</span>
          </button>
        )}
      </div>

      {/* Template Selector Tabs */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-brand-gold" />
            <span>{tText('Select Post Style:', 'Scegli Formato Post:')}</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {currentPostText.length} {tText('characters', 'caratteri')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTemplate('viral')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTemplate === 'viral'
                ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow'
                : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">{tText('Full / Viral', 'Completo / Virale')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTemplate('short')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTemplate === 'short'
                ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow'
                : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200'
            }`}
          >
            <Twitter className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">{tText('Short (X/Stories)', 'Sintetico (X / Storie)')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTemplate('debate')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTemplate === 'debate'
                ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow'
                : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate">{tText('Debate / CTA', 'Dibattito / CTA')}</span>
          </button>
        </div>
      </div>

      {/* Copyable Post Preview Box */}
      <div className="mt-3 relative">
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs md:text-sm font-sans leading-relaxed whitespace-pre-line shadow-inner max-h-56 overflow-y-auto font-medium selection:bg-brand-gold selection:text-[#0a1c3e]">
          {currentPostText}
        </div>

        {/* Floating Copy Button */}
        <div className="absolute top-2.5 right-2.5">
          <button
            type="button"
            onClick={() => handleCopy(currentPostText, 'post')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer ${
              copiedType === 'post'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e]'
            }`}
            title={tText('Copy complete text with link and hashtags', 'Copia testo completo con link e hashtag')}
          >
            {copiedType === 'post' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{tText('Copied!', 'Copiato!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{tText('Copy Post Text', 'Copia Testo Post')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Hashtags Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mr-1">
          <Hash className="w-3 h-3 text-brand-gold" />
          <span>Hashtags:</span>
        </span>
        {generatedHashtags.map((ht) => (
          <button
            key={ht}
            type="button"
            onClick={() => handleCopy(ht, ht)}
            className="text-[11px] font-mono bg-white/90 hover:bg-brand-gold/20 text-slate-700 hover:text-[#0a1c3e] px-2 py-0.5 rounded-md border border-slate-200 transition cursor-pointer flex items-center gap-1"
            title={tText('Click to copy hashtag', 'Clicca per copiare hashtag')}
          >
            <span>{ht}</span>
            {copiedType === ht ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : null}
          </button>
        ))}
      </div>

      {/* Direct 1-Click Platform Buttons */}
      <div className="mt-4 pt-3 border-t border-brand-gold/30">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>{tText('Publish / Share Instantly on:', 'Pubblica / Condividi all\'istante su:')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Facebook */}
          <button
            type="button"
            onClick={shareToFacebook}
            className="px-3 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={shareToTelegram}
            className="px-3 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1f8ec3] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </button>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={shareToTwitter}
            className="px-3 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Twitter className="w-4 h-4" />
            <span>X (Twitter)</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={shareToLinkedIn}
            className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#095196] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Linkedin className="w-4 h-4 fill-current" />
            <span>LinkedIn</span>
          </button>
        </div>
      </div>

      {/* Copy Direct Link Bar */}
      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate font-mono bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200 flex-1">
          <span className="text-slate-400">URL:</span>
          <span className="truncate">{articleUrl}</span>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(articleUrl, 'link')}
          className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
        >
          {copiedType === 'link' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{tText('Copied!', 'Copiato!')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{tText('Copy Link', 'Copia Link')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
