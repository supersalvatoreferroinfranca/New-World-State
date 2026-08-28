import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NewsArticle, NewsCategory } from '../../types/news';
import { getCategories, getArticles, incrementArticleViews } from '../../services/newsService';
import { useI18n } from '../../contexts/I18nContext';
import { formatArticleContentToHtml, stripFormattingSymbols } from '../../utils/textFormatter';
import { getPublicCanonicalOrigin, getPublicArticleUrl } from '../../utils/urlUtils';
import { splitTextIntoSentenceChunks } from '../../utils/ttsChunker';
import { globalFallbackTtsPlayer } from '../../utils/fallbackAudioTts';
import SocialShareKit from './SocialShareKit';
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
  Trash2,
  Volume2,
  Play,
  Pause,
  Square,
  Mic,
  RotateCcw
} from 'lucide-react';

interface ArticleDetailModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle?: (article: NewsArticle) => void;
  onEditArticle?: (article: NewsArticle) => void;
  onDeleteArticle?: (article: NewsArticle) => void;
}

export default function ArticleDetailModal({
  article,
  isOpen,
  onClose,
  onSelectArticle,
  onEditArticle,
  onDeleteArticle
}: ArticleDetailModalProps) {
  const { tText } = useI18n();
  const [copied, setCopied] = useState(false);

  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('default');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  const isPlayingRef = useRef(false);
  const currentChunkIndexRef = useRef(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Split article into sentence chunks for smooth reading without browser lockups
  const articleChunks = useMemo(() => {
    if (!article) return [];
    const cleanTitle = stripFormattingSymbols(article.title);
    const cleanIntro = stripFormattingSymbols(article.intro || '');
    const cleanContent = stripFormattingSymbols(article.content || '');
    const fullText = `${cleanTitle}. ${cleanIntro ? cleanIntro + '.' : ''} ${cleanContent}`;
    return splitTextIntoSentenceChunks(fullText, 140);
  }, [article?.id, article?.title, article?.intro, article?.content]);

  // Load available voices & auto-select best Italian voice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const available = window.speechSynthesis.getVoices() || [];
          if (available.length > 0) {
            setVoices(available);
            setSelectedVoiceName(prev => {
              if (prev && prev !== 'default' && available.some(v => v.name === prev)) {
                return prev;
              }
              const itVoice = available.find(v => v.lang && v.lang.toLowerCase().startsWith('it'));
              return itVoice ? itVoice.name : (available[0]?.name || 'default');
            });
          }
        } catch (e) {
          // Ignore browser speech engine warnings
        }
      };
      
      try {
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      } catch (e) {}

      return () => {
        try {
          if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
          }
        } catch (e) {}
      };
    }
  }, []);

  // Sorted list of voices: Italian voices at the top, then other languages
  const sortedVoices = useMemo(() => {
    if (voices.length === 0) return [];
    const itVoices: SpeechSynthesisVoice[] = [];
    const otherVoices: SpeechSynthesisVoice[] = [];
    
    voices.forEach(v => {
      if (v.lang && v.lang.toLowerCase().startsWith('it')) {
        itVoices.push(v);
      } else {
        otherVoices.push(v);
      }
    });

    return [...itVoices, ...otherVoices];
  }, [voices]);

  // Completely terminates all audio and speech synthesis playback
  const handleStopTTS = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    currentChunkIndexRef.current = 0;
    setCurrentChunkIndex(0);
    activeUtteranceRef.current = null;

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Additional cancel call ensures Chromium/Safari flush internal audio queue
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      }
    } catch (e) {}

    try {
      globalFallbackTtsPlayer.stop();
    } catch (e) {}

    try {
      const allAudios = document.querySelectorAll('audio');
      allAudios.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      });
    } catch (e) {}

    try {
      window.dispatchEvent(new CustomEvent('nws-tts-state-change', { detail: { isPlaying: false, isPaused: false } }));
    } catch (e) {}
  };

  // Speak a specific sentence chunk with active voice and speed
  const speakChunk = (chunkIdx: number, rate: number, voiceName: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isPlayingRef.current) return;

    if (chunkIdx >= articleChunks.length) {
      handleStopTTS();
      return;
    }

    currentChunkIndexRef.current = chunkIdx;
    setCurrentChunkIndex(chunkIdx);

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const textToSpeak = articleChunks[chunkIdx];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtteranceRef.current = utterance;
    utterance.rate = rate;

    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const targetVoice = availableVoices.find(v => v.name === voiceName) || 
                        availableVoices.find(v => v.lang && v.lang.toLowerCase().startsWith('it')) || 
                        null;

    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    } else {
      utterance.lang = 'it-IT';
    }

    utterance.onend = () => {
      activeUtteranceRef.current = null;
      if (!isPlayingRef.current) return;
      const nextIdx = chunkIdx + 1;
      if (nextIdx < articleChunks.length && isPlayingRef.current) {
        speakChunk(nextIdx, rate, voiceName);
      } else {
        handleStopTTS();
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[Article TTS] Utterance error on chunk', chunkIdx, e);
      activeUtteranceRef.current = null;
      if (!isPlayingRef.current) return;
      const nextIdx = chunkIdx + 1;
      if (nextIdx < articleChunks.length && isPlayingRef.current) {
        speakChunk(nextIdx, rate, voiceName);
      } else {
        handleStopTTS();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Play / Resume
  const handlePlayTTS = () => {
    if (!article || articleChunks.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(tText('Speech synthesis is not supported in this browser.', 'La sintesi vocale non è supportata da questo browser.'));
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    try {
      window.dispatchEvent(new CustomEvent('nws-tts-state-change', { detail: { isPlaying: true, isPaused: false } }));
    } catch (e) {}

    const startIdx = isPaused ? currentChunkIndexRef.current : (currentChunkIndexRef.current >= articleChunks.length ? 0 : currentChunkIndexRef.current);
    speakChunk(startIdx, playbackRate, selectedVoiceName);
  };

  // Pause
  const handlePauseTTS = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      globalFallbackTtsPlayer.pause();
      window.dispatchEvent(new CustomEvent('nws-tts-state-change', { detail: { isPlaying: false, isPaused: true } }));
    } catch (e) {}
  };

  // Change Voice in real time during article reading
  const handleVoiceChange = (newVoiceName: string) => {
    setSelectedVoiceName(newVoiceName);
    if (isPlayingRef.current) {
      speakChunk(currentChunkIndexRef.current, playbackRate, newVoiceName);
    }
  };

  // Change Playback Speed in real time
  const handleChangeRate = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlayingRef.current) {
      speakChunk(currentChunkIndexRef.current, newRate, selectedVoiceName);
    }
  };

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
      const origin = getPublicCanonicalOrigin();
      const slug = article.slug || article.id;
      const articleUrl = getPublicArticleUrl(slug);
      
      let mainImg = 'https://www.newworldstate.org/documents/branding_logo/fronte.jpg';
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
        "@graph": [
          {
            "@type": "NewsArticle",
            "@id": `${articleUrl}#article`,
            "isPartOf": {
              "@type": "WebPage",
              "@id": articleUrl
            },
            "headline": cleanTitle,
            "name": cleanTitle,
            "description": cleanIntro.slice(0, 220),
            "articleBody": cleanContent,
            "image": {
              "@type": "ImageObject",
              "url": mainImg,
              "width": 1200,
              "height": 630,
              "caption": cleanTitle
            },
            "datePublished": article.publishedAt || article.createdAt || new Date().toISOString(),
            "dateModified": article.updatedAt || article.publishedAt || new Date().toISOString(),
            "inLanguage": "it-IT",
            "isAccessibleForFree": "True",
            "articleSection": "News & Geopolitica",
            "keywords": (article.tags || []).map(stripFormattingSymbols).join(', '),
            "author": {
              "@type": "Person",
              "name": stripFormattingSymbols(article.authorName) || 'Cronista Ufficiale NWS',
              "jobTitle": stripFormattingSymbols(article.authorRole) || 'Giornalista Sovrano',
              "url": `${origin}/?tab=news`
            },
            "publisher": {
              "@type": "Organization",
              "name": "New World State News Authority",
              "url": origin,
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.newworldstate.org/documents/branding_logo/fronte.jpg",
                "width": 512,
                "height": 512
              },
              "sameAs": [
                "https://newworldstate.cloud",
                "https://t.me/newworldstate"
              ]
            },
            "speakable": {
              "@type": "SpeakableSpecification",
              "cssSelector": ["#article-title", "#article-intro", "#article-body"]
            }
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${articleUrl}#breadcrumb`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": origin
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Notizie",
                "item": `${origin}/?tab=news`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": cleanTitle,
                "item": articleUrl
              }
            ]
          }
        ]
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
        handleStopTTS();
      };
    }
  }, [article?.id, isOpen]);

  if (!isOpen || !article) return null;

  const categories = getCategories();
  const category = categories.find(c => c.id === article.categoryId);
  const allArticles = getArticles();

  const relatedArticles = (article.relatedArticleIds || [])
    .map(id => allArticles.find(a => a.id === id))
    .filter((a): a is NewsArticle => !!a);

  const handleShare = () => {
    const slug = article.slug || article.id;
    const url = getPublicArticleUrl(slug);
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

            {onDeleteArticle && (
              <button
                onClick={() => {
                  onDeleteArticle(article);
                }}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition cursor-pointer flex items-center gap-1.5 text-xs shadow-md border border-red-500"
                title={tText('Delete Article', 'Elimina Articolo')}
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">{tText('Delete', 'Elimina')}</span>
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
          <div className="bg-gradient-to-br from-[#0a1c3e] via-[#122b5c] to-[#0a1c3e] rounded-2xl p-4 text-white shadow-xl border border-brand-gold/30 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold ${isPlaying ? 'animate-pulse' : ''} shrink-0`}>
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {tText('Listen to the article read aloud with live voice selection and speed control', 'Ascolta l\'articolo letto a voce alta con cambio voce in tempo reale')}
                  </p>
                </div>
              </div>

              {/* Progress counter */}
              {articleChunks.length > 0 && (
                <div className="text-[11px] font-mono text-slate-300 self-start sm:self-auto bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
                  {isPlaying || isPaused ? (
                    <span className="text-brand-gold font-bold">
                      {tText('Sentence', 'Frase')} {currentChunkIndex + 1}/{articleChunks.length}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {articleChunks.length} {tText('sentences', 'frasi')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Controls Bar: Voice Selector, Speed, Play/Pause/Stop */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2.5 border-t border-white/10">
              {/* Voice Selector */}
              <div className="flex items-center gap-2 bg-[#06122a] px-3 py-2 rounded-xl border border-white/10 flex-1 min-w-0">
                <Mic className="w-4 h-4 text-brand-gold shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 tracking-wider">
                  {tText('Voice:', 'Voce:')}
                </span>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="bg-transparent text-xs text-amber-100 font-medium w-full focus:outline-none cursor-pointer truncate"
                  title={tText('Select or switch reading voice in real time', 'Seleziona o cambia voce di lettura in tempo reale')}
                >
                  <option value="default" className="text-slate-900 bg-white">
                    {tText('Default Voice (Italian Auto)', 'Voce Predefinita (Italiano Auto)')}
                  </option>
                  {sortedVoices.map((v) => {
                    const isIt = v.lang && v.lang.toLowerCase().startsWith('it');
                    const cleanName = v.name
                      .replace(/Google/i, '')
                      .replace(/Microsoft/i, '')
                      .replace(/Desktop/i, '')
                      .trim();
                    const flag = isIt ? '🇮🇹 ' : (v.lang.startsWith('en') ? '🇬🇧 ' : (v.lang.startsWith('fr') ? '🇫🇷 ' : (v.lang.startsWith('es') ? '🇪🇸 ' : (v.lang.startsWith('de') ? '🇩🇪 ' : '🌐 '))));
                    return (
                      <option key={v.name} value={v.name} className="text-slate-900 bg-white">
                        {flag}{cleanName} ({v.lang}) {v.localService ? '• HD' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-[#06122a] p-1 rounded-xl border border-white/10">
                  {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleChangeRate(rate)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-brand-gold text-[#0a1c3e] shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Play / Pause Button */}
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
                    className="px-4 py-2 rounded-xl bg-brand-gold text-[#0a1c3e] font-extrabold text-xs hover:bg-amber-300 transition cursor-pointer flex items-center gap-1.5 shadow-md border border-brand-gold"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isPaused ? tText('Resume', 'Riprendi') : tText('Listen', 'Ascolta')}</span>
                  </button>
                )}

                {/* Stop Button (Terminates audio completely) */}
                <button
                  type="button"
                  onClick={handleStopTTS}
                  disabled={!isPlaying && !isPaused && currentChunkIndex === 0}
                  className={`px-3 py-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    isPlaying || isPaused || currentChunkIndex > 0
                      ? 'bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500 hover:text-white'
                      : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                  title={tText('Stop and completely terminate audio playback', 'Interrompi e termina del tutto la riproduzione audio')}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{tText('Stop', 'Stop')}</span>
                </button>
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

          {/* Social Outreach & Sharing Kit Section */}
          <SocialShareKit article={article} />

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
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
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

            {onDeleteArticle && (
              <button
                onClick={() => {
                  onDeleteArticle(article);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-600 hover:text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 border border-red-200 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>{tText('Delete Article', 'Elimina Articolo')}</span>
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
