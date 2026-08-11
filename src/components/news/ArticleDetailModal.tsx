import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory } from '../../types/news';
import { getCategories, getArticles, incrementArticleViews } from '../../services/newsService';
import { useI18n } from '../../contexts/I18nContext';
import { formatArticleContentToHtml, stripFormattingSymbols } from '../../utils/textFormatter';
import { 
  X, 
  Calendar, 
  User, 
  Tag, 
  Eye, 
  Share2, 
  Clock, 
  Video, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Check, 
  Globe, 
  ShieldCheck,
  PenTool,
  Volume2,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface ArticleDetailModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle?: (article: NewsArticle) => void;
  onEditArticle?: (article: NewsArticle) => void;
}

export default function ArticleDetailModal({
  article,
  isOpen,
  onClose,
  onSelectArticle,
  onEditArticle
}: ArticleDetailModalProps) {
  const { tText } = useI18n();
  const [copied, setCopied] = useState(false);

  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        const itIndex = available.findIndex(v => v.lang.startsWith('it'));
        if (itIndex >= 0) {
          setSelectedVoiceIndex(itIndex);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Stop synthesis when modal closes or article changes & update document head meta tags + Schema.org NewsArticle JSON-LD for Google News & AI
  useEffect(() => {
    if (isOpen && article) {
      const prevTitle = document.title;
      const cleanTitle = stripFormattingSymbols(article.title);
      document.title = `${cleanTitle} | New World State News`;

      const cleanIntro = stripFormattingSymbols(article.intro || article.content);
      const cleanContent = stripFormattingSymbols(article.content || article.intro);
      let metaDesc = document.querySelector('meta[name="description"]');
      let createdDesc = false;
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
        createdDesc = true;
      }
      const prevDesc = metaDesc.getAttribute('content') || '';
      metaDesc.setAttribute('content', cleanIntro.slice(0, 200));

      // Inject or update Schema.org NewsArticle JSON-LD
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://newworldstate.cloud';
      const slug = article.slug || article.id;
      const articleUrl = `${origin}/?tab=news&notizia=${encodeURIComponent(slug)}`;
      
      let mainImg = `${origin}/LOGO_NEW-WORLD-STATE.jpg`;
      if (article.images && article.images.length > 0 && article.images[0]?.url) {
        const u = article.images[0].url.trim();
        if (u.startsWith('http://') || u.startsWith('https://')) mainImg = u;
        else if (u.startsWith('/')) mainImg = `${origin}${u}`;
      }

      let jsonLdScript = document.getElementById('news-article-jsonld') as HTMLScriptElement | null;
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'news-article-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }

      const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": articleUrl
        },
        "headline": cleanTitle,
        "description": cleanIntro.slice(0, 220),
        "articleBody": cleanContent,
        "image": [mainImg],
        "datePublished": article.publishedAt || article.createdAt || new Date().toISOString(),
        "dateModified": article.updatedAt || article.publishedAt || new Date().toISOString(),
        "inLanguage": "it-IT",
        "isAccessibleForFree": "True",
        "author": {
          "@type": "Person",
          "name": stripFormattingSymbols(article.authorName) || 'Cronista Ufficiale NWS',
          "jobTitle": stripFormattingSymbols(article.authorRole) || 'Giornalista Sovrano'
        },
        "publisher": {
          "@type": "Organization",
          "name": "New World State News Authority",
          "url": origin,
          "logo": {
            "@type": "ImageObject",
            "url": `${origin}/LOGO_NEW-WORLD-STATE.jpg`
          }
        },
        "keywords": (article.tags || []).map(stripFormattingSymbols).join(', ')
      };

      jsonLdScript.textContent = JSON.stringify(jsonLdData, null, 2);

      return () => {
        document.title = prevTitle;
        if (metaDesc) {
          if (createdDesc) {
            metaDesc.remove();
          } else {
            metaDesc.setAttribute('content', prevDesc);
          }
        }
        const existingScript = document.getElementById('news-article-jsonld');
        if (existingScript) {
          existingScript.remove();
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
      };
    }
  }, [article?.id, isOpen]);

  const handlePlayTTS = () => {
    if (!article) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(tText('Speech synthesis is not supported in this browser.', 'La sintesi vocale non è supportata da questo browser.'));
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanTitle = stripFormattingSymbols(article.title);
    const cleanIntro = stripFormattingSymbols(article.intro);
    const cleanContent = stripFormattingSymbols(article.content);
    const textToRead = `${cleanTitle}. ${cleanIntro}. ${cleanContent}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = playbackRate;

    if (voices.length > 0 && voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    } else {
      utterance.lang = 'it-IT';
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStopTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleChangeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying && article) {
      window.speechSynthesis.cancel();
      const textToRead = `${article.title}. ${article.intro || ''}. ${article.content || ''}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = rate;
      if (voices.length > 0 && voices[selectedVoiceIndex]) {
        utterance.voice = voices[selectedVoiceIndex];
      } else {
        utterance.lang = 'it-IT';
      }
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen || !article) return null;

  const categories = getCategories();
  const category = categories.find(c => c.id === article.categoryId);
  const allArticles = getArticles();

  const relatedArticles = (article.relatedArticleIds || [])
    .map(id => allArticles.find(a => a.id === id))
    .filter((a): a is NewsArticle => !!a);

  const handleShare = () => {
    const url = `${window.location.origin}/?tab=news&notizia=${article.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // YouTube embed converter helper
  const getEmbedVideoUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-[#c5a880]/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Top Header Navigation */}
        <div className="bg-[#0a1c3e] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a880]/30 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-white shadow-sm"
              style={{ backgroundColor: category?.color || '#c5a880' }}
            >
              {category?.name || tText('Sovereign News', 'Notizia Sovrana')}
            </span>
            <span className="text-xs text-slate-300 font-tech">
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : tText('Draft', 'Bozza')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEditArticle && (
              <button
                onClick={() => {
                  onEditArticle(article);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-brand-gold text-[#0a1c3e] font-extrabold hover:bg-white transition cursor-pointer flex items-center gap-1.5 text-xs shadow-md border border-brand-gold"
                title={tText('Edit Article', 'Modifica Articolo')}
              >
                <PenTool className="w-4 h-4 text-[#0a1c3e]" />
                <span className="hidden sm:inline">{tText('Edit', 'Modifica')}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 text-brand-gold hover:bg-white/20 transition cursor-pointer flex items-center gap-1 text-xs"
              title={tText('Share News', 'Condividi Notizia')}
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? tText('Copied!', 'Copiato!') : tText('Share', 'Condividi')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Article Title */}
          <div className="space-y-3">
            <h1 className="font-serif text-2xl md:text-4xl font-bold text-[#0a1c3e] leading-tight">
              {article.title}
            </h1>

            {/* Author Meta Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 font-medium">
                <div className="w-7 h-7 rounded-full bg-[#0a1c3e] text-brand-gold flex items-center justify-center font-bold text-xs">
                  {article.authorName.charAt(0)}
                </div>
                <div>
                  <span className="text-[#0a1c3e] font-bold">{article.authorName}</span>
                  <span className="text-[10px] text-slate-400 block font-tech">{article.authorRole || tText('Official Reporter', 'Cronista')}</span>
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">{tText('Verified by Digital Custodians', 'Verificato dai Custodi Digitali')}</span>
              </div>

              {article.viewsCount !== undefined && (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>{article.viewsCount} {tText('reads', 'letture')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Audio Reader TTS Player Widget */}
          <div className="bg-gradient-to-r from-[#0a1c3e] via-[#122b5c] to-[#0a1c3e] rounded-2xl p-4 text-white shadow-lg border border-brand-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-brand-gold/20 text-brand-gold ${isPlaying ? 'animate-pulse' : ''}`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-brand-gold tracking-wide">
                    {tText('TTS Audio Reader', 'Lettore Vocale TTS')}
                  </h4>
                  {isPlaying && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-tech">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {tText('Reading...', 'In riproduzione...')}
                    </span>
                  )}
                  {isPaused && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-tech">
                      {tText('Paused', 'In Pausa')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  {tText('Listen to the article read aloud by synthesized voice', 'Ascolta l\'articolo letto a voce alta dalla sintesi vocale')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={handlePauseTTS}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-900 font-bold text-xs hover:bg-amber-400 transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{tText('Pause', 'Pausa')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlayTTS}
                  className="px-4 py-2 rounded-xl bg-brand-gold text-[#0a1c3e] font-extrabold text-xs hover:bg-white transition cursor-pointer flex items-center gap-1.5 shadow-md border border-brand-gold"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isPaused ? tText('Resume', 'Riprendi') : tText('Listen', 'Ascolta')}</span>
                </button>
              )}

              {(isPlaying || isPaused) && (
                <button
                  type="button"
                  onClick={handleStopTTS}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition cursor-pointer"
                  title={tText('Stop', 'Interrompi')}
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              )}

              {/* Speed selector */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 ml-1">
                {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChangeRate(rate)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-brand-gold text-[#0a1c3e]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Testo Introduttivo (Abstract / Meta Description) */}
          {article.intro && (
            <div className="bg-amber-50/70 border-l-4 border-brand-gold p-4 md:p-5 rounded-r-2xl text-slate-800 font-medium text-sm md:text-base leading-relaxed italic shadow-sm">
              "{stripFormattingSymbols(article.intro)}"
            </div>
          )}

          {/* Featured Images */}
          {article.images && article.images.length > 0 && (
            <div className="space-y-3 my-4">
              {article.images.map((img, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  <img
                    src={img.url}
                    alt={img.caption || article.title}
                    className="w-full max-h-[450px] object-cover"
                  />
                  {img.caption && (
                    <p className="bg-slate-900 text-slate-300 text-xs p-3 font-sans italic text-center">
                      📷 {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Extended Text (Body) - Formatted Clean HTML */}
          <div 
            className="article-body-content prose max-w-none text-slate-800 leading-relaxed text-sm md:text-base space-y-4 font-sans border-t border-slate-100 pt-4"
            dangerouslySetInnerHTML={{ __html: formatArticleContentToHtml(article.content) }}
          />

          {/* Featured Videos */}
          {article.videos && article.videos.length > 0 && (
            <div className="space-y-4 my-6">
              <h3 className="font-serif text-base font-bold text-[#0a1c3e] flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-gold" />
                <span>{tText('Attached Videos', 'Video Allegati')}</span>
              </h3>
              {article.videos.map((vid, idx) => {
                const embedUrl = getEmbedVideoUrl(vid.url);
                const isEmbed = embedUrl.includes('embed') || embedUrl.includes('player.vimeo');
                return (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-black">
                    {isEmbed ? (
                      <div className="aspect-video w-full">
                        <iframe
                          src={embedUrl}
                          title={vid.caption || 'Video'}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        src={vid.url}
                        controls
                        className="w-full max-h-[400px]"
                      >
                        Il tuo browser non supporta la riproduzione di questo video.
                      </video>
                    )}
                    {vid.caption && (
                      <p className="bg-black text-slate-300 text-xs p-3 text-center italic">
                        🎬 {vid.caption}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags:</span>
              </span>
              {article.tags.map(t => (
                <span
                  key={t}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono px-3 py-1 rounded-full border border-slate-200 transition"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h3 className="font-serif text-base font-bold text-[#0a1c3e] flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-brand-gold" />
                <span>{tText('Related Articles', 'Articoli Correlati')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle?.(rel)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0a1c3e]/30 shadow-sm transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-[#0a1c3e] line-clamp-2 mb-1">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {rel.intro}
                      </p>
                    </div>
                    <span className="text-[10px] text-brand-gold font-bold mt-2 hover:underline inline-block">
                      {tText('Read article →', 'Leggi articolo →')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 gap-3">
          <div>
            {onEditArticle && (
              <button
                onClick={() => {
                  onEditArticle(article);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-gold text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:bg-[#0a1c3e] hover:text-white transition cursor-pointer flex items-center gap-2 shadow-md border border-brand-gold"
              >
                <PenTool className="w-4 h-4" />
                <span>{tText('Edit Article', 'Modifica Articolo')}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0a1c3e] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
          >
            {tText('Close Article', 'Chiudi Articolo')}
          </button>
        </div>
      </div>
    </div>
  );
}
