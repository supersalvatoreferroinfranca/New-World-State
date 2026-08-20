import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory } from '../../types/news';
import { getLatest3Articles, getCategories, incrementArticleViews } from '../../services/newsService';
import ArticleDetailModal from './ArticleDetailModal';
import { Newspaper, ArrowRight, Calendar, User, Eye, Video, Star, Sparkles } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { stripFormattingSymbols } from '../../utils/textFormatter';

interface HomepageNewsSectionProps {
  onGoToNews?: () => void;
}

export default function HomepageNewsSection({ onGoToNews }: HomepageNewsSectionProps) {
  const { tText } = useI18n();
  const [latestArticles, setLatestArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = () => {
    setLatestArticles(getLatest3Articles());
    setCategories(getCategories());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('nws_news_articles_updated', loadData);
    window.addEventListener('nws_news_categories_updated', loadData);
    return () => {
      window.removeEventListener('nws_news_articles_updated', loadData);
      window.removeEventListener('nws_news_categories_updated', loadData);
    };
  }, []);

  const handleOpenArticle = (art: NewsArticle) => {
    incrementArticleViews(art.id);
    setSelectedArticle(art);
    setIsDetailOpen(true);
    try {
      if (typeof window !== 'undefined' && window.history && window.history.pushState) {
        const url = new URL(window.location.href);
        const slug = art.slug || art.id;
        url.searchParams.set('tab', 'news');
        url.searchParams.set('notizia', slug);
        window.history.pushState({ articleId: art.id, slug }, '', url.toString());
      }
    } catch (e) {}
  };

  if (latestArticles.length === 0) return null;

  return (
    <section className="my-16 space-y-8 animate-fade-in relative">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#c5a880]/30 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] font-tech uppercase tracking-widest mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>{tText('Official State Press', 'Stampa Ufficiale dello Stato Sovrano')}</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a1c3e] tracking-tight">
            {tText('Latest State News & Chronicle', 'Ultime Notizie dello Stato & Cronaca')}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 font-light mt-1 max-w-2xl">
            {tText('Inform your judgment and participate in democratic debate. Latest articles by Reporters and approved by Digital Custodians.', 'Informa il tuo giudizio e partecipa al dibattito democratico. Ultimi articoli redatti dai Cronisti e approvati dai Custodi Digitali.')}
          </p>
        </div>

        {onGoToNews && (
          <button
            onClick={onGoToNews}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0a1c3e] hover:text-brand-gold transition cursor-pointer group bg-brand-gold/10 hover:bg-brand-gold/20 px-4 py-2.5 rounded-xl border border-brand-gold/30 shrink-0"
          >
            <span>{tText('All State News', 'Tutte le Notizie dello Stato')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        )}
      </div>

      {/* Latest 3 Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {latestArticles.map((art) => {
          const cat = categories.find(c => c.id === art.categoryId);
          return (
            <div
              key={art.id}
              onClick={() => handleOpenArticle(art)}
              className="group bg-white border border-slate-200 hover:border-[#0a1c3e] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Image / Banner */}
                {(() => {
                  const coverImageUrl = (art.images && art.images.length > 0 && art.images[0]?.url)
                    ? art.images[0].url
                    : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';

                  return (
                    <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
                      <img
                        src={coverImageUrl}
                        alt={stripFormattingSymbols(art.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <span
                        className="absolute top-3 left-3 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-white shadow-md border border-white/20 z-10"
                        style={{ backgroundColor: cat?.color || '#0a1c3e' }}
                      >
                        {cat?.name || 'Notizia'}
                      </span>
                      {art.isFeatured && (
                        <span className="absolute top-3 right-3 bg-brand-gold text-[#0a1c3e] text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
                          <Star className="w-3 h-3 fill-current" />
                          {tText('Featured', 'In Evidenza')}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString('it-IT') : ''}</span>
                    <span className="font-bold text-slate-600">{tText('By', 'Di')} {art.authorName}</span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#0a1c3e] group-hover:text-brand-gold transition leading-snug line-clamp-2">
                    {stripFormattingSymbols(art.title)}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {stripFormattingSymbols(art.intro)}
                  </p>

                  {/* Tags */}
                  {art.tags && art.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {art.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0a1c3e]">
                <span className="text-[10px] text-slate-400 font-normal">
                  {art.viewsCount || 0} {tText('reads', 'letture')}
                </span>
                <span className="text-brand-gold group-hover:translate-x-1 transition flex items-center gap-1">
                  {tText('Read article →', 'Leggi articolo →')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal Popup */}
      <ArticleDetailModal
        article={selectedArticle}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedArticle(null);
          try {
            if (typeof window !== 'undefined' && window.history && window.history.pushState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('notizia');
              url.searchParams.delete('article');
              url.searchParams.delete('slug');
              window.history.pushState({}, '', url.toString());
            }
          } catch (e) {}
        }}
        onSelectArticle={(rel) => {
          setSelectedArticle(rel);
          incrementArticleViews(rel.id);
          try {
            if (typeof window !== 'undefined' && window.history && window.history.pushState) {
              const url = new URL(window.location.href);
              const slug = rel.slug || rel.id;
              url.searchParams.set('tab', 'news');
              url.searchParams.set('notizia', slug);
              window.history.pushState({ articleId: rel.id, slug }, '', url.toString());
            }
          } catch (e) {}
        }}
      />
    </section>
  );
}
