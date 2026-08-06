import React, { useState } from 'react';
import { NewsArticle, NewsCategory } from '../../types/news';
import { getCategories, getArticles, incrementArticleViews } from '../../services/newsService';
import { useI18n } from '../../contexts/I18nContext';
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
  PenTool
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

  if (!isOpen || !article) return null;

  const categories = getCategories();
  const category = categories.find(c => c.id === article.categoryId);
  const allArticles = getArticles();

  const relatedArticles = (article.relatedArticleIds || [])
    .map(id => allArticles.find(a => a.id === id))
    .filter((a): a is NewsArticle => !!a);

  const handleShare = () => {
    const url = `${window.location.origin}/notizie/${article.slug}`;
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

          {/* Testo Introduttivo (Abstract) */}
          <div className="bg-amber-50/60 border-l-4 border-brand-gold p-4 rounded-r-2xl text-slate-800 font-medium text-sm md:text-base leading-relaxed italic">
            "{article.intro}"
          </div>

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

          {/* Extended Text (Body) */}
          <div className="prose max-w-none text-slate-700 leading-relaxed text-sm md:text-base space-y-4 whitespace-pre-line font-sans">
            {article.content}
          </div>

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
