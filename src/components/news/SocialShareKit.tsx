import React, { useState, useMemo } from 'react';
import { NewsArticle, NewsLanguage } from '../../types/news';
import { stripFormattingSymbols } from '../../utils/textFormatter';
import { getPublicArticleUrl } from '../../utils/urlUtils';
import { useI18n } from '../../contexts/I18nContext';
import { getLocalizedArticle } from '../../services/newsService';
import { Language } from '../../constants/translations';
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
  Globe, 
  TrendingUp,
  FileText,
  Mail
} from 'lucide-react';

interface SocialShareKitProps {
  article: NewsArticle;
  activeLang?: NewsLanguage;
}

export default function SocialShareKit({ article, activeLang = 'it' }: SocialShareKitProps) {
  const { tText } = useI18n();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<'viral' | 'short' | 'debate' | 'dm'>('viral');

  if (!article) return null;

  // Compute localized article content for the current active language
  const localized = useMemo(() => {
    return getLocalizedArticle(article, activeLang as Language);
  }, [article, activeLang]);

  const slug = article.slug || article.id;
  const rawBaseUrl = getPublicArticleUrl(slug);
  const articleUrl = useMemo(() => {
    if (activeLang && activeLang !== 'it') {
      return `${rawBaseUrl}?lang=${activeLang}`;
    }
    return rawBaseUrl;
  }, [rawBaseUrl, activeLang]);

  const cleanTitle = stripFormattingSymbols(localized.title || article.title || '') || 'Notizia Sovrana';
  const cleanIntro = stripFormattingSymbols(localized.intro || article.intro || '') || '';
  const author = stripFormattingSymbols(article.authorName || '') || 'New World State';

  // Smart thematic hashtag generator adapted to active language
  const generatedHashtags = useMemo(() => {
    const set = new Set<string>();
    
    // Core brand & movement hashtags
    set.add('#NewWorldState');
    if (activeLang === 'en') {
      set.add('#IndependentNews');
      set.add('#EthicalJournalism');
      set.add('#GlobalAffairs');
    } else if (activeLang === 'es') {
      set.add('#InformacionLibre');
      set.add('#PeriodismoEtico');
      set.add('#Actualidad');
    } else if (activeLang === 'fr') {
      set.add('#InformationLibre');
      set.add('#JournalismeEthique');
      set.add('#Actualites');
    } else {
      set.add('#InformazioneLibera');
      set.add('#GiornalismoEtico');
      set.add('#NotizieSovrane');
    }

    // Article tags
    if (localized.tags && Array.isArray(localized.tags)) {
      localized.tags.forEach(tag => {
        const clean = stripFormattingSymbols(tag).replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]/g, '');
        if (clean.length > 2) {
          set.add(`#${clean.charAt(0).toUpperCase() + clean.slice(1)}`);
        }
      });
    }

    // Keyword detection
    const fullText = (cleanTitle + ' ' + cleanIntro).toLowerCase();
    if (fullText.includes('iran') || fullText.includes('usa') || fullText.includes('israel') || fullText.includes('palestin') || fullText.includes('war') || fullText.includes('guerra') || fullText.includes('conflict')) {
      set.add(activeLang === 'en' ? '#Geopolitics' : '#Geopolitica');
      set.add(activeLang === 'en' ? '#Peace' : '#Pace');
      set.add(activeLang === 'en' ? '#MiddleEast' : '#MedioOriente');
    }
    if (fullText.includes('econom') || fullText.includes('financ') || fullText.includes('finanza') || fullText.includes('market') || fullText.includes('crisis')) {
      set.add(activeLang === 'en' ? '#Economy' : '#Economia');
      set.add(activeLang === 'en' ? '#GlobalFinance' : '#FinanzaEtica');
    }
    if (fullText.includes('child') || fullText.includes('minor') || fullText.includes('right') || fullText.includes('diritt') || fullText.includes('libert') || fullText.includes('sovereign')) {
      set.add(activeLang === 'en' ? '#HumanRights' : '#DirittiUmani');
      set.add(activeLang === 'en' ? '#ChildrenRights' : '#TutelaInfanzia');
      set.add(activeLang === 'en' ? '#Sovereignty' : '#Sovranità');
    }
    if (fullText.includes('technolog') || fullText.includes('tecnolog') || fullText.includes('ai') || fullText.includes('digit')) {
      set.add(activeLang === 'en' ? '#Technology' : '#Tecnologia');
      set.add(activeLang === 'en' ? '#Innovation' : '#Innovazione');
    }

    return Array.from(set);
  }, [cleanTitle, cleanIntro, localized.tags, activeLang]);

  const hashtagsString = generatedHashtags.join(' ');

  // Template 1: Viral / Comprehensive Post
  const viralPostText = useMemo(() => {
    const hook = cleanIntro 
      ? (cleanIntro.length > 200 ? cleanIntro.slice(0, 197) + '...' : cleanIntro)
      : (activeLang === 'en' ? 'A crucial in-depth report on the current global landscape and future developments.' : 'Un approfondimento fondamentale sul nostro presente per capire dove stiamo andando.');

    if (activeLang === 'en') {
      return `🌍 𝗕𝗥𝗘𝗔𝗞𝗜𝗡𝗚 𝗥𝗘𝗣𝗢𝗥𝗧 | ${cleanTitle}

📌 ${hook}

Independent, uncensored analysis from the New World State News Authority, breaking down the geopolitical forces shaping our world.

👇 𝗥𝗲𝗮𝗱 𝘁𝗵𝗲 𝗳𝘂𝗹𝗹 𝗶𝗻𝘃𝗲𝘀𝘁𝗶𝗴𝗮𝘁𝗶𝗼𝗻 & 𝗷𝗼𝗶𝗻 𝘁𝗵𝗲 𝗱𝗶𝘀𝗰𝘂𝘀𝘀𝗶𝗼𝗻:
🔗 ${articleUrl}

${hashtagsString}`;
    }

    if (activeLang === 'es') {
      return `🌍 𝗘𝗡 𝗣𝗢𝗥𝗧𝗔𝗗𝗔 | ${cleanTitle}

📌 ${hook}

Un análisis independiente, riguroso y sin censura para comprender las dinámicas globales en evolución.

👇 𝗟𝗲𝗲 𝗲𝗹 𝗮𝗿𝘁í𝗰𝘂𝗹𝗼 𝗰𝗼𝗺𝗽𝗹𝗲𝘁𝗼 𝘆 𝗽𝗮𝗿𝘁𝗶𝗰𝗶𝗽𝗮 𝗲𝗻 𝗲𝗹 𝗱𝗲𝗯𝗮𝘁𝗲:
🔗 ${articleUrl}

${hashtagsString}`;
    }

    if (activeLang === 'fr') {
      return `🌍 𝗔 𝗟𝗔 𝗨𝗡𝗘 | ${cleanTitle}

📌 ${hook}

Une enquête indépendante et sans censure pour décrypter les enjeux géopolitiques contemporains.

👇 𝗟𝗶𝘀𝗲𝘇 𝗹'𝗮𝗿𝘁𝗶𝗰𝗹𝗲 𝗰𝗼𝗺𝗽𝗹𝗲𝘁 𝗲𝘁 𝗿𝗲𝗷𝗼𝗶𝗴𝗻𝗲𝘇 𝗹𝗮 𝗱𝗶𝘀𝗰𝘂𝘀𝘀𝗶𝗼𝗻 :
🔗 ${articleUrl}

${hashtagsString}`;
    }

    return `🌍 𝗣𝗥𝗜𝗠𝗢 𝗣𝗜𝗔𝗡𝗢 | ${cleanTitle}

📌 ${hook}

Un'analisi chiara, indipendente e senza censure dal Giornale Sovrano New World State per comprendere i veri scenari in evoluzione.

👇 𝗟𝗲𝗴𝗴𝗶 𝗹'𝗮𝗿𝘁𝗶𝗰𝗼𝗹𝗼 𝗰𝗼𝗺𝗽𝗹𝗲𝘁𝗼 𝗲 𝘂𝗻𝗶𝘀𝗰𝗶𝘁𝗶 𝗮𝗹𝗹𝗮 𝗱𝗶𝘀𝗰𝘂𝘀𝘀𝗶𝗼𝗻𝗲:
🔗 ${articleUrl}

${hashtagsString}`;
  }, [cleanTitle, cleanIntro, articleUrl, hashtagsString, activeLang]);

  // Template 2: Short & Punchy (for X / Twitter / WhatsApp Status / Stories)
  const shortPostText = useMemo(() => {
    if (activeLang === 'en') {
      return `🚨 ${cleanTitle}

Read the full report on New World State:
👉 ${articleUrl}

${generatedHashtags.slice(0, 4).join(' ')}`;
    }
    if (activeLang === 'es') {
      return `🚨 ${cleanTitle}

Lee el informe completo en New World State:
👉 ${articleUrl}

${generatedHashtags.slice(0, 4).join(' ')}`;
    }
    if (activeLang === 'fr') {
      return `🚨 ${cleanTitle}

Découvrez l'enquête complète sur New World State :
👉 ${articleUrl}

${generatedHashtags.slice(0, 4).join(' ')}`;
    }
    return `🚨 ${cleanTitle}

Leggi l'approfondimento completo su New World State:
👉 ${articleUrl}

${generatedHashtags.slice(0, 4).join(' ')}`;
  }, [cleanTitle, articleUrl, generatedHashtags, activeLang]);

  // Template 3: Debate & Engagement (Prompts user opinions and comments)
  const debatePostText = useMemo(() => {
    if (activeLang === 'en') {
      return `🗣️ 𝗢𝗣𝗘𝗡 𝗗𝗘𝗕𝗔𝗧𝗘: ${cleanTitle}

What is your take on this issue, and what solutions should be prioritized?

📖 Read the official investigation:
👉 ${articleUrl}

Drop your perspective in the comments below! 👇
${hashtagsString}`;
    }
    if (activeLang === 'es') {
      return `🗣️ 𝗗𝗘𝗕𝗔𝗧𝗘 𝗔𝗕𝗜𝗘𝗥𝗧𝗢: ${cleanTitle}

¿Cuál es tu opinión sobre este tema y qué medidas deberían tomarse?

📖 Lee el reportaje oficial:
👉 ${articleUrl}

¡Comparte tu opinión en los comentarios! 👇
${hashtagsString}`;
    }
    if (activeLang === 'fr') {
      return `🗣️ 𝗗É𝗕𝗔𝗧 𝗢𝗨𝗩𝗘𝗥𝗧 : ${cleanTitle}

Quelle est votre vision sur ce sujet et quelles solutions préconisez-vous ?

📖 Consultez l'enquête officielle :
👉 ${articleUrl}

Partagez votre avis dans les commentaires ! 👇
${hashtagsString}`;
    }
    return `🗣️ 𝗗𝗜𝗕𝗔𝗧𝗧𝗜𝗧𝗢 𝗔𝗣𝗘𝗥𝗧𝗢: ${cleanTitle}

Cosa ne pensi di questa situazione e quali sono le soluzioni da attuare?

📖 Approfondisci con il reportage ufficiale:
👉 ${articleUrl}

Esprimi la tua opinione nei commenti! 👇
${hashtagsString}`;
  }, [cleanTitle, articleUrl, hashtagsString, activeLang]);

  // Template 4: Direct Message (WhatsApp / Telegram / Email / DM)
  const dmPostText = useMemo(() => {
    if (activeLang === 'en') {
      return `Hello! I wanted to share this important report with you from New World State:

"${cleanTitle}"

${cleanIntro ? cleanIntro.slice(0, 160) + '...\n\n' : ''}You can read the full article here:
${articleUrl}`;
    }
    if (activeLang === 'es') {
      return `¡Hola! Quería compartir este importante reportaje de New World State:

"${cleanTitle}"

${cleanIntro ? cleanIntro.slice(0, 160) + '...\n\n' : ''}Puedes leer el artículo completo aquí:
${articleUrl}`;
    }
    if (activeLang === 'fr') {
      return `Bonjour ! Je souhaitais vous partager cette enquête essentielle publiée par le New World State :

"${cleanTitle}"

${cleanIntro ? cleanIntro.slice(0, 160) + '...\n\n' : ''}Vous pouvez lire l'article complet ici :
${articleUrl}`;
    }
    return `Ciao! Volevo segnalarti questo importante reportage pubblicato su New World State:

"${cleanTitle}"

${cleanIntro ? cleanIntro.slice(0, 160) + '...\n\n' : ''}Puoi leggere l'articolo completo qui:
${articleUrl}`;
  }, [cleanTitle, cleanIntro, articleUrl, activeLang]);

  const currentPostText = useMemo(() => {
    if (activeTemplate === 'short') return shortPostText;
    if (activeTemplate === 'debate') return debatePostText;
    if (activeTemplate === 'dm') return dmPostText;
    return viralPostText;
  }, [activeTemplate, shortPostText, debatePostText, dmPostText, viralPostText]);

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
    const hashtags = generatedHashtags.slice(0, 3).map(h => h.replace('#', '')).join(',');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(articleUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const shareToWhatsApp = () => {
    const text = `${cleanTitle}\n\n${cleanIntro ? cleanIntro.slice(0, 140) + '...\n\n' : ''}👉 ${activeLang === 'en' ? 'Read at' : 'Leggi su'}: ${articleUrl}`;
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

  const shareToReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(cleanTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`${cleanTitle} | New World State`);
    const body = encodeURIComponent(dmPostText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
        // User cancelled
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-base md:text-lg text-[#0a1c3e]">
                {tText('Social Outreach & Sharing Kit', 'Kit di Condivisione e Divulgazione Social')}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-gold/20 text-[#0a1c3e] px-2 py-0.5 rounded-md border border-brand-gold/40">
                <Globe className="w-3 h-3 text-amber-700" />
                {activeLang.toUpperCase()}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {tText('Optimized for Viral Reach', 'Ottimizzato per Massima Diffusione')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {tText('Ready-to-post texts in', 'Testi pronti all\'uso in')} <span className="font-bold text-[#0a1c3e]">{activeLang.toUpperCase()}</span> {tText('with strategic hooks, hashtags, and localized direct link.', 'con hashtag strategici e link diretto localizzato.')}
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
          <span className="text-[11px] text-slate-500 font-mono">
            {currentPostText.length} {tText('characters', 'caratteri')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

          <button
            type="button"
            onClick={() => setActiveTemplate('dm')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTemplate === 'dm'
                ? 'bg-[#0a1c3e] text-white border-[#0a1c3e] shadow'
                : 'bg-white/80 text-slate-700 hover:bg-white border-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-purple-500" />
            <span className="truncate">{tText('Direct Message', 'Messaggio Diretto')}</span>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="WhatsApp"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={shareToTelegram}
            className="px-3 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1f8ec3] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Telegram"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={shareToFacebook}
            className="px-3 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Facebook"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={shareToTwitter}
            className="px-3 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="X (Twitter)"
          >
            <Twitter className="w-4 h-4" />
            <span>X (Twitter)</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={shareToLinkedIn}
            className="px-3 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#095196] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4 fill-current" />
            <span>LinkedIn</span>
          </button>

          {/* Reddit */}
          <button
            type="button"
            onClick={shareToReddit}
            className="px-3 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Reddit"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703z"/>
            </svg>
            <span>Reddit</span>
          </button>

          {/* Email */}
          <button
            type="button"
            onClick={shareByEmail}
            className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Email"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
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
