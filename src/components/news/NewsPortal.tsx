import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory, ArticleStatus } from '../../types/news';
import { stripFormattingSymbols } from '../../utils/textFormatter';
import { 
  getPublishedArticles, 
  getArticles, 
  getCategories, 
  getArticlesPendingModeration,
  incrementArticleViews
} from '../../services/newsService';
import ArticleFormModal from './ArticleFormModal';
import CategoryManagerModal from './CategoryManagerModal';
import ArticleDetailModal from './ArticleDetailModal';
import ModerationPanelModal from './ModerationPanelModal';
import ReporterCandidacyModal from './ReporterCandidacyModal';
import { 
  Newspaper, 
  Plus, 
  FolderPlus, 
  ShieldCheck, 
  Search, 
  Tag, 
  Calendar, 
  User, 
  Eye, 
  Star, 
  Clock, 
  Video, 
  Image as ImageIcon, 
  Check, 
  Filter, 
  UserCheck, 
  Sparkles, 
  PenTool, 
  Layers,
  Volume2
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface NewsPortalProps {
  onGoToHome?: () => void;
}

export default function NewsPortal({ onGoToHome }: NewsPortalProps) {
  const { tText } = useI18n();

  // Citizen & Role State
  const [citizen, setCitizen] = useState<any>(null);
  
  // Simulated Roles for Testing & Flexibility
  const [isSimulatedCronista, setIsSimulatedCronista] = useState<boolean>(() => {
    return localStorage.getItem('nws_simulated_cronista') === 'true';
  });
  const [isSimulatedCustode, setIsSimulatedCustode] = useState<boolean>(() => {
    return localStorage.getItem('nws_simulated_custode_news') === 'true';
  });

  // Articles & Categories
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'published' | 'my_drafts' | 'pending_mod'>('published');

  // Modals
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<NewsArticle | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [selectedDetailArticle, setSelectedDetailArticle] = useState<NewsArticle | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCandidacyModalOpen, setIsCandidacyModalOpen] = useState(false);

  // Load User Citizen
  const loadCitizen = () => {
    try {
      const saved = localStorage.getItem('nws_democracy_citizen') || 
                    sessionStorage.getItem('nws_democracy_citizen') || 
                    localStorage.getItem('nws_citizen_profile') || 
                    localStorage.getItem('registered_citizen');
      if (saved) {
        setCitizen(JSON.parse(saved));
      } else {
        setCitizen(null);
      }
    } catch (e) {
      setCitizen(null);
    }
  };

  const loadData = () => {
    setCategories(getCategories());
    setPendingCount(getArticlesPendingModeration().length);

    const allArts = getArticles();
    setArticles(allArts);
  };

  useEffect(() => {
    loadCitizen();
    loadData();

    const handleNewsUpdate = () => loadData();
    window.addEventListener('nws_news_articles_updated', handleNewsUpdate);
    window.addEventListener('nws_news_categories_updated', handleNewsUpdate);
    window.addEventListener('storage', loadCitizen);

    return () => {
      window.removeEventListener('nws_news_articles_updated', handleNewsUpdate);
      window.removeEventListener('nws_news_categories_updated', handleNewsUpdate);
      window.removeEventListener('storage', loadCitizen);
    };
  }, []);

  // Auto-open article if URL parameter or route specifies a noticia/article slug
  useEffect(() => {
    if (articles.length > 0 && !selectedDetailArticle) {
      const searchParams = new URLSearchParams(window.location.search);
      const targetSlug = searchParams.get('notizia') || searchParams.get('article') || searchParams.get('slug');
      let foundArticle: NewsArticle | undefined;

      if (targetSlug) {
        foundArticle = articles.find(a => a.slug === targetSlug || a.id === targetSlug);
      } else if (window.location.pathname.startsWith('/notizie/') || window.location.pathname.startsWith('/news/')) {
        const pathParts = window.location.pathname.split('/');
        const pathSlug = pathParts[pathParts.length - 1];
        if (pathSlug && pathSlug !== 'notizie' && pathSlug !== 'news') {
          foundArticle = articles.find(a => a.slug === pathSlug || a.id === pathSlug);
        }
      }

      if (foundArticle) {
        setSelectedDetailArticle(foundArticle);
        setIsDetailModalOpen(true);
        incrementArticleViews(foundArticle.id);
      }
    }
  }, [articles]);

  // Role Checks
  const isLoggedIn = !!citizen && (!!citizen.id || !!citizen.citizenCode || !!citizen.email || !!citizen.firstName);

  const checkIsCronista = () => {
    if (!isLoggedIn) return false;
    if (isSimulatedCronista) return true;
    if (citizen?.isAdmin || citizen?.isCronista) return true;
    
    const roleStr = JSON.stringify(citizen?.operationalRole || citizen?.role || '').toLowerCase();
    return roleStr.includes('cronista') || roleStr.includes('journalist') || roleStr.includes('reporter') || roleStr.includes('stampa');
  };

  const checkIsCustode = () => {
    if (!isLoggedIn) return false;
    if (isSimulatedCustode) return true;
    if (citizen?.isAdmin) return true;
    
    const roleStr = JSON.stringify(citizen?.operationalRole || citizen?.role || '').toLowerCase();
    return roleStr.includes('custode') || roleStr.includes('custodian') || roleStr.includes('moderator');
  };

  const isCronista = checkIsCronista();
  const isCustode = checkIsCustode();

  const canEditArticle = (art: NewsArticle) => {
    if (!isLoggedIn) return false;
    if (isCustode || citizen?.isAdmin) return true;
    if (isCronista) {
      const currentAuthorId = citizen?.id;
      const currentAuthorName = `${citizen?.firstName || ''} ${citizen?.surname || ''}`.trim() || citizen?.username;
      return String(art.authorId) === String(currentAuthorId) || art.authorName === currentAuthorName || art.status === 'bozza';
    }
    return false;
  };

  const toggleSimulatedCronista = () => {
    const nextVal = !isSimulatedCronista;
    setIsSimulatedCronista(nextVal);
    localStorage.setItem('nws_simulated_cronista', String(nextVal));
  };

  const toggleSimulatedCustode = () => {
    const nextVal = !isSimulatedCustode;
    setIsSimulatedCustode(nextVal);
    localStorage.setItem('nws_simulated_custode_news', String(nextVal));
  };

  // Filter Logic
  const filteredArticles = articles.filter((art) => {
    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchIntro = art.intro.toLowerCase().includes(q);
      const matchAuthor = art.authorName.toLowerCase().includes(q);
      const matchTags = art.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchIntro && !matchAuthor && !matchTags) {
        return false;
      }
    }

    // Category filter
    if (selectedCategoryId !== 'all' && art.categoryId !== selectedCategoryId) {
      return false;
    }

    // Tab view filter
    if (viewTab === 'published') {
      return art.status === 'pubblicato';
    } else if (viewTab === 'my_drafts') {
      const currentAuthorId = citizen?.id || 'demo-user';
      return String(art.authorId) === String(currentAuthorId) || isCronista;
    } else if (viewTab === 'pending_mod') {
      return art.status === 'in_moderazione';
    }

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const featuredArticles = articles.filter(a => a.status === 'pubblicato' && a.isFeatured);

  const handleOpenDetail = (art: NewsArticle) => {
    incrementArticleViews(art.id);
    setSelectedDetailArticle(art);
    setIsDetailModalOpen(true);
  };

  const renderStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'bozza':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{tText('Draft', 'Bozza')}</span>;
      case 'in_moderazione':
        return <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{tText('In Moderation', 'In Moderazione')}</span>;
      case 'in_revisione':
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{tText('Revision Requested', 'Modifiche Richieste')}</span>;
      case 'rifiutato':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{tText('Rejected', 'Rifiutato')}</span>;
      case 'pubblicato':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{tText('Published', 'Pubblicato')}</span>;
      default:
        return null;
    }
  };

  const currentAuthorName = citizen
    ? `${citizen.firstName || ''} ${citizen.surname || ''}`.trim() || citizen.username || 'Cronista Ufficiale'
    : 'Cronista della Comunità';

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-[#0a1c3e] text-white p-8 md:p-12 overflow-hidden shadow-2xl border border-[#c5a880]/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] font-tech uppercase tracking-widest">
              <Newspaper className="w-3.5 h-3.5" />
              <span>{tText('Official State Information Media', "Organo d'Informazione Sovrana")}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-bold text-brand-gold tracking-tight leading-tight">
              {tText('Official State News & Chronicle', 'Giornale di Stato & Cronaca Sovrana')}
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">
              {tText('Verified news, legislative reforms, official reports and analysis by community Reporters moderated by Digital Custodians.', 'Notizie verificate, riforme legislative, reportage ufficiali e approfondimenti curati dai Cronisti della comunità con la moderazione garante dei Custodi Digitali.')}
            </p>
          </div>

          {/* Action Buttons for Cronisti, Custodi & Candidati */}
          {isLoggedIn && (
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 shrink-0">
              {/* Scrivi Notizia e Genera con IA (Reserved for Authorized Cronisti & Admins) */}
              {isCronista && (
                <>
                  <button
                    onClick={() => {
                      setArticleToEdit(null);
                      setIsArticleFormOpen(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-brand-gold text-[#0a1c3e] font-bold text-xs uppercase tracking-wider hover:bg-white transition cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-brand-gold"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{tText('+ Write Article', '+ Scrivi Notizia')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setArticleToEdit(null);
                      setIsArticleFormOpen(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-brand-gold to-amber-300 text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-amber-300 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4 text-[#0a1c3e]" />
                    <span>{tText('✨ Create with AI', '✨ Crea con IA')}</span>
                  </button>
                </>
              )}

              {/* Candidati come Cronista (Reserved for Normal Logged-In Citizens) */}
              {!isCronista && (
                <button
                  onClick={() => setIsCandidacyModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-brand-gold text-[#0a1c3e] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-amber-300"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{tText('Apply as Local Reporter', 'Candidati come Cronista Locale')}</span>
                </button>
              )}

              {/* Gestione Categorie (Reserved for Cronisti / Custodi) */}
              {(isCronista || isCustode) && (
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                >
                  <FolderPlus className="w-4 h-4 text-brand-gold" />
                  <span>{tText('Categories', 'Categorie')}</span>
                </button>
              )}

              {/* Moderazione Custodi (Reserved for Custodi) */}
              {isCustode && (
                <button
                  onClick={() => setIsModerationModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg relative"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{tText('Moderation', 'Moderazione')}</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-[#0a1c3e] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse ml-1">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ROLE PERMISSION BADGES BAR */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <UserCheck className="w-4 h-4 text-brand-gold" />
            <span>{tText('Current Role:', 'Ruolo Attuale:')}</span>
            <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
              {!isLoggedIn
                ? tText('Guest / Reader', 'Ospite / Lettore')
                : isCronista && isCustode
                ? tText('Reporter & Digital Custodian', 'Cronista & Custode Digitale')
                : isCronista
                ? tText('Official Reporter', 'Cronista Ufficiale')
                : isCustode
                ? tText('Digital Custodian', 'Custode Digitale')
                : tText('Citizen / Reader', 'Cittadino / Lettore')}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND CATEGORIES FILTER BAR */}
      <div className="bg-white border border-[#c5a880]/30 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tText('Search articles, keywords, tags or authors...', 'Cerca articoli, parole chiave, tag o autori...')}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none"
            />
          </div>

          {/* View Tab Switcher - Only shown for Logged-in Cronisti or Custodi */}
          {isLoggedIn && (isCronista || isCustode) && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewTab('published')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewTab === 'published'
                    ? 'bg-[#0a1c3e] text-white shadow'
                    : 'text-slate-600 hover:text-[#0a1c3e]'
                }`}
              >
                {tText('Published Articles', 'Articoli Pubblicati')}
              </button>

              {(isCronista || isCustode) && (
                <button
                  onClick={() => setViewTab('my_drafts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    viewTab === 'my_drafts'
                      ? 'bg-[#0a1c3e] text-white shadow'
                      : 'text-slate-600 hover:text-[#0a1c3e]'
                  }`}
                >
                  {tText('My News / Drafts', 'Le Mie Notizie / Bozze')}
                </button>
              )}

              {isCustode && (
                <button
                  onClick={() => setViewTab('pending_mod')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewTab === 'pending_mod'
                      ? 'bg-[#0a1c3e] text-white shadow'
                      : 'text-slate-600 hover:text-[#0a1c3e]'
                  }`}
                >
                  <span>{tText('Pending Moderation', 'In Moderazione')}</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Categories Chips Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-[#0a1c3e] text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tText('All Categories', 'Tutte le Categorie')} ({articles.filter(a => a.status === 'pubblicato').length})
          </button>

          {categories.map((cat) => {
            const count = articles.filter(a => a.categoryId === cat.id && a.status === 'pubblicato').length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#0a1c3e] text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color || '#0a1c3e' }}
                />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEATURED CAROUSEL / HIGHLIGHT (IF FEATURED ARTICLES EXIST) */}
      {featuredArticles.length > 0 && selectedCategoryId === 'all' && viewTab === 'published' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0a1c3e] uppercase tracking-wider font-tech">
            <Star className="w-4 h-4 text-brand-gold fill-current" />
            <span>{tText('Featured on Cover', 'In Evidenza in Copertina')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredArticles.slice(0, 2).map((art) => {
              const cat = categories.find(c => c.id === art.categoryId);
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpenDetail(art)}
                  className="group bg-[#0a1c3e] text-white rounded-3xl overflow-hidden border border-brand-gold/30 shadow-2xl cursor-pointer hover:border-brand-gold transition duration-300 flex flex-col justify-between"
                >
                  {art.images && art.images.length > 0 && (
                    <div className="aspect-video w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={art.images[0].url}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-brand-gold text-[#0a1c3e] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                        {tText('Sovereign Cover', 'Copertina Sovrana')}
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-tech text-brand-gold">
                        <span>{cat?.name || 'Notizia'}</span>
                        <span>•</span>
                        <span>{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : 'Data'}</span>
                      </div>

                      <h2 className="font-serif text-xl font-bold group-hover:text-brand-gold transition leading-snug">
                        {art.title}
                      </h2>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-light">
                        {art.intro}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-gold font-bold">
                      <span>{tText('By', 'Di')} {art.authorName}</span>
                      <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                        {tText('Read full article →', 'Leggi articolo completo →')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN ARTICLES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#0a1c3e] uppercase tracking-wider font-tech">
          <span>{filteredArticles.length} {tText('News Found', 'Notizie Trovate')}</span>
          <span className="text-slate-400 font-normal">
            {tText('Sorted by publication date', 'Ordinato per data di pubblicazione')}
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-8 shadow-sm">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif text-base font-bold text-[#0a1c3e]">
              {tText('No Articles Found', 'Nessun Articolo Trovato')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {tText('No articles available for the selected filters. Try changing your search or selecting another category.', 'Non sono presenti articoli per i filtri selezionati. Prova a modificare la ricerca o seleziona un\'altra categoria.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => {
              const cat = categories.find(c => c.id === art.categoryId);
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpenDetail(art)}
                  className="group bg-white border border-slate-200 hover:border-[#0a1c3e]/40 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col justify-between"
                >
                    {/* Media Banner */}
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
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                            <span
                              className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-white shadow-md border border-white/20"
                              style={{ backgroundColor: cat?.color || '#0a1c3e' }}
                            >
                              {cat?.name || 'Notizia'}
                            </span>
                            {renderStatusBadge(art.status)}
                          </div>
                          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                            <span className="text-[10px] bg-[#0a1c3e]/90 text-brand-gold px-2.5 py-1 rounded-full font-tech flex items-center gap-1 backdrop-blur-md border border-brand-gold/40 shadow-md">
                              <Volume2 className="w-3 h-3 text-brand-gold animate-pulse" />
                              <span>TTS</span>
                            </span>
                            {art.videos && art.videos.length > 0 && (
                              <span className="text-[10px] bg-red-600/90 text-white px-2 py-1 rounded-full font-tech flex items-center gap-1 backdrop-blur-md border border-red-400/40 shadow-md">
                                <Video className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Body Info */}
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString('it-IT') : tText('Draft', 'Bozza')}</span>
                        <span className="font-bold text-slate-600">{tText('By', 'Di')} {art.authorName}</span>
                      </div>

                      <h3 className="font-serif text-base font-bold text-[#0a1c3e] group-hover:text-brand-gold transition leading-snug line-clamp-2">
                        {stripFormattingSymbols(art.title)}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {stripFormattingSymbols(art.intro)}
                      </p>
                    </div>

                    {/* Tags */}
                    {art.tags && art.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {art.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer link & Edit action */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0a1c3e] gap-2">
                      <div className="flex items-center gap-2">
                        {canEditArticle(art) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setArticleToEdit(art);
                              setIsArticleFormOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-[#0a1c3e] hover:text-white text-[#0a1c3e] font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 border border-amber-300 shadow-sm"
                            title={tText('Edit Article', 'Modifica Articolo')}
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>{tText('Edit', 'Modifica')}</span>
                          </button>
                        )}

                        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                          {art.viewsCount || 0} {tText('reads', 'letture')}
                        </span>
                      </div>

                      <span className="text-brand-gold group-hover:translate-x-1 transition flex items-center gap-1 shrink-0">
                        {tText('Read article →', 'Leggi articolo →')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Article Form Modal for Cronista */}
      {isLoggedIn && (isCronista || isCustode) && (
        <ArticleFormModal
          isOpen={isArticleFormOpen}
          onClose={() => {
            setIsArticleFormOpen(false);
            setArticleToEdit(null);
          }}
          articleToEdit={articleToEdit}
          authorId={citizen?.id || 'demo-author'}
          authorName={currentAuthorName}
          onSaved={loadData}
        />
      )}

      {/* 2. Category Manager Modal */}
      {isLoggedIn && (isCronista || isCustode) && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoriesUpdated={loadData}
        />
      )}

      {/* 3. Moderation Panel Modal for Custodi Digitali */}
      {isLoggedIn && isCustode && (
        <ModerationPanelModal
          isOpen={isModerationModalOpen}
          onClose={() => setIsModerationModalOpen(false)}
          onArticlesUpdated={loadData}
          onEditArticle={(artToEdit) => {
            setIsModerationModalOpen(false);
            setArticleToEdit(artToEdit);
            setIsArticleFormOpen(true);
          }}
        />
      )}

      {/* 4. Article Detail Modal */}
      <ArticleDetailModal
        article={selectedDetailArticle}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailArticle(null);
        }}
        onSelectArticle={(rel) => {
          setSelectedDetailArticle(rel);
        }}
        onEditArticle={
          selectedDetailArticle && canEditArticle(selectedDetailArticle)
            ? (artToEdit) => {
                setIsDetailModalOpen(false);
                setSelectedDetailArticle(null);
                setArticleToEdit(artToEdit);
                setIsArticleFormOpen(true);
              }
            : undefined
        }
      />

      {/* 5. Reporter Candidacy Modal */}
      <ReporterCandidacyModal
        isOpen={isCandidacyModalOpen}
        onClose={() => setIsCandidacyModalOpen(false)}
        citizen={citizen}
        onApplicationSubmitted={loadCitizen}
      />
    </div>
  );
}
