import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types/news';
import { 
  getArticles, 
  getArticlesPendingModeration, 
  moderateArticle, 
  deleteArticle,
  normalizeArticleStatus,
  syncArticlesWithServer
} from '../../services/newsService';
import { safeFetch } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';
import { 
  ShieldCheck, 
  X, 
  Check, 
  AlertTriangle, 
  Star, 
  Eye, 
  MessageSquare, 
  Trash2, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Send,
  PenTool 
} from 'lucide-react';
import ArticleDetailModal from './ArticleDetailModal';

interface ModerationPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesUpdated?: () => void;
  onEditArticle?: (article: NewsArticle) => void;
}

export default function ModerationPanelModal({
  isOpen,
  onClose,
  onArticlesUpdated,
  onEditArticle
}: ModerationPanelModalProps) {
  const { tText } = useI18n();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [pendingFilter, setPendingFilter] = useState<'all_pending' | 'in_moderazione' | 'bozze' | 'revision'>('all_pending');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Note Modal State
  const [modifyingArticle, setModifyingArticle] = useState<NewsArticle | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'request_changes' | null>(null);
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = () => {
    if (tab === 'pending') {
      const allPending = getArticlesPendingModeration();
      if (pendingFilter === 'in_moderazione') {
        setArticles(allPending.filter(a => normalizeArticleStatus(a.status) === 'in_moderazione'));
      } else if (pendingFilter === 'bozze') {
        setArticles(allPending.filter(a => normalizeArticleStatus(a.status) === 'bozza'));
      } else if (pendingFilter === 'revision') {
        setArticles(allPending.filter(a => normalizeArticleStatus(a.status) === 'in_revisione'));
      } else {
        setArticles(allPending);
      }
    } else {
      setArticles(getArticles());
    }
    onArticlesUpdated?.();
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Asynchronously sync with PostgreSQL server so newly created articles are immediately present
      syncArticlesWithServer(true).then((synced) => {
        if (synced && synced.length > 0) {
          loadData();
        }
      }).catch(() => {});
    }
  }, [isOpen, tab, pendingFilter]);

  if (!isOpen) return null;

  const handleApprove = async (art: NewsArticle) => {
    setApprovingId(art.id);
    try {
      // 1. Optimistically update local UI state immediately
      setArticles(prev => prev.map(a => (String(a.id) === String(art.id) || a.slug === art.id) ? {
        ...a,
        status: 'pubblicato',
        publishedAt: new Date().toISOString()
      } : a));

      // 2. Perform local moderate action with fallback article
      moderateArticle(art.id, 'approve', undefined, art);

      // 3. Directly await the server moderate endpoint to guarantee PostgreSQL persistence
      try {
        await safeFetch('/api/news/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: art.id,
            articleId: art.id,
            action: 'approve',
            article: {
              ...art,
              status: 'pubblicato',
              publishedAt: new Date().toISOString()
            }
          })
        });
      } catch (srvErr) {
        console.warn('[MODERATE-SERVER-WARN]', srvErr);
      }

      setSuccessToast(`L'articolo "${art.title}" è stato approvato e pubblicato ufficialmente!`);
      loadData();
      onArticlesUpdated?.();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('[HANDLE-APPROVE-ERR]', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleToggleFeatured = (art: NewsArticle) => {
    moderateArticle(art.id, 'toggle_featured');
    loadData();
  };

  const handleOpenNotes = (art: NewsArticle, action: 'reject' | 'request_changes') => {
    setModifyingArticle(art);
    setActionType(action);
    setNotes('');
  };

  const handleSubmitNotes = () => {
    if (!modifyingArticle || !actionType) return;
    moderateArticle(modifyingArticle.id, actionType, notes.trim());
    setModifyingArticle(null);
    setActionType(null);
    setNotes('');
    loadData();
  };

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      deleteArticle(id);
      setDeletingId(null);
      loadData();
      onArticlesUpdated?.();
      setSuccessToast('Articolo eliminato con successo.');
      setTimeout(() => setSuccessToast(null), 3000);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 5000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        <div className="bg-white border border-[#c5a880]/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 animate-fade-in flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-[#0a1c3e] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a880]/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-gold leading-tight">
                  {tText('Journalistic Moderation Panel — Digital Custodians', 'Pannello Moderazione Giornalistica — Custodi Digitali')}
                </h2>
                <p className="text-[10px] text-slate-300 font-tech tracking-wider uppercase">
                  {tText('Review and approval of articles submitted by Reporters', 'Revisione e approvazione articoli inoltrati dai Cronisti')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader Navigation */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                  tab === 'pending'
                    ? 'bg-[#0a1c3e] text-white shadow'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 text-brand-gold" />
                <span>{tText('Pending Moderation', 'In Attesa di Moderazione')}</span>
              </button>

              <button
                onClick={() => setTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                  tab === 'all'
                    ? 'bg-[#0a1c3e] text-white shadow'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tText('All Articles', 'Tutti gli Articoli')}</span>
              </button>
            </div>

            {tab === 'pending' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPendingFilter('all_pending')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    pendingFilter === 'all_pending' ? 'bg-[#0a1c3e] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tText('All Pending', 'Tutti in Attesa')}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingFilter('in_moderazione')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    pendingFilter === 'in_moderazione' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tText('In Moderation', 'Inviati per Revisione')}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingFilter('bozze')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    pendingFilter === 'bozze' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tText('Reporters Drafts', 'Bozze dei Cronisti')}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingFilter('revision')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    pendingFilter === 'revision' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tText('Revision Requested', 'Modifiche Richieste')}
                </button>
              </div>
            )}

            <button
              onClick={loadData}
              className="p-2 rounded-lg text-slate-500 hover:text-[#0a1c3e] hover:bg-slate-200 transition cursor-pointer ml-auto"
              title={tText('Refresh List', 'Aggiorna lista')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {successToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessToast(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {articles.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-serif text-base font-bold text-[#0a1c3e]">
                  {tab === 'pending' ? tText('No Articles Pending', 'Nessun Articolo in Attesa') : tText('No Articles Found', 'Nessun Articolo Trovato')}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {tab === 'pending'
                    ? tText('All articles submitted by reporters have been moderated.', 'Tutti gli articoli inviati dai cronisti sono stati moderati. Nuovi invii appariranno automaticamente qui.')
                    : tText('No articles recorded in the system.', 'Non ci sono articoli registrati nel sistema.')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 transition ${
                      art.status === 'in_moderazione'
                        ? 'border-amber-300 bg-amber-50/20'
                        : art.status === 'pubblicato'
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full text-white ${
                              art.status === 'pubblicato'
                                ? 'bg-emerald-600'
                                : art.status === 'in_moderazione'
                                ? 'bg-amber-600'
                                : art.status === 'rifiutato'
                                ? 'bg-red-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            {art.status === 'in_moderazione'
                              ? tText('Pending Moderation', 'In Moderazione')
                              : art.status === 'pubblicato'
                              ? tText('Published', 'Pubblicato')
                              : art.status === 'rifiutato'
                              ? tText('Rejected', 'Rifiutato')
                              : tText('Draft / Revision', 'Bozza / Revisione')}
                          </span>

                          {art.isFeatured && (
                            <span className="text-[9px] bg-brand-gold text-[#0a1c3e] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {tText('Featured on Homepage', 'In Evidenza Homepage')}
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-slate-400">
                            {tText('Submitted', 'Invio')}: {new Date(art.createdAt).toLocaleString('it-IT')}
                          </span>
                        </div>

                        <h3 className="font-serif text-base font-bold text-[#0a1c3e]">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {art.intro}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedArticle(art);
                            setIsPreviewOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-[#0a1c3e] hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tText('Preview', 'Anteprima')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Author & Media Details */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div>
                        {tText('Written by', 'Redatto da')}: <span className="font-bold text-[#0a1c3e]">{art.authorName}</span> ({art.authorRole || tText('Official Reporter', 'Cronista')})
                      </div>

                      <div className="flex items-center gap-3">
                        <span>📷 {art.images?.length || 0} {tText('img', 'imm.')}</span>
                        <span>🎬 {art.videos?.length || 0} {tText('vid', 'vid.')}</span>
                        <span>🏷️ {art.tags?.length || 0} {tText('tags', 'tag')}</span>
                      </div>
                    </div>

                    {/* Moderation Notes if present */}
                    {art.moderatorNotes && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{tText('Custodian Note:', 'Nota del Custode:')}</span> {art.moderatorNotes}
                        </div>
                      </div>
                    )}

                    {/* Moderation Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFeatured(art)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                            art.isFeatured
                              ? 'bg-brand-gold text-[#0a1c3e] border-brand-gold'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${art.isFeatured ? 'fill-current' : ''}`} />
                          <span>{art.isFeatured ? tText('Featured', 'In Evidenza') : tText('Feature Article', 'Metti in Evidenza')}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onEditArticle && (
                          <button
                            onClick={() => {
                              onEditArticle(art);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition cursor-pointer flex items-center gap-1 border border-amber-300 shadow-sm"
                            title={tText('Edit Article as Custodian', 'Modifica Articolo come Custode')}
                          >
                            <PenTool className="w-3.5 h-3.5 text-amber-700" />
                            <span>{tText('Edit', 'Modifica')}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenNotes(art, 'request_changes')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-amber-100 hover:text-amber-800 transition cursor-pointer"
                        >
                          {tText('Request Changes', 'Richiedi Modifiche')}
                        </button>

                        <button
                          onClick={() => handleOpenNotes(art, 'reject')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{tText('Reject', 'Rifiuta')}</span>
                        </button>

                        {normalizeArticleStatus(art.status) === 'pubblicato' ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{tText('Published', 'Già Pubblicato')}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={approvingId === art.id}
                            onClick={() => handleApprove(art)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5 shadow disabled:opacity-50"
                          >
                            <CheckCircle className={`w-4 h-4 ${approvingId === art.id ? 'animate-spin' : ''}`} />
                            <span>{approvingId === art.id ? tText('Approving...', 'Approvazione...') : tText('Approve & Publish', 'Approva & Pubblica')}</span>
                          </button>
                        )}

                        {deletingId === art.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(art.id)}
                            className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition cursor-pointer shadow-xs animate-pulse"
                          >
                            {tText('Confirm Delete?', 'Confermi?')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(art.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title={tText('Delete', 'Elimina')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#0a1c3e] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
            >
              {tText('Close', 'Chiudi')}
            </button>
          </div>
        </div>
      </div>

      {/* Article Detail Modal for Preview */}
      <ArticleDetailModal
        article={selectedArticle}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedArticle(null);
        }}
        onEditArticle={onEditArticle ? (art) => {
          setIsPreviewOpen(false);
          setSelectedArticle(null);
          onClose();
          onEditArticle(art);
        } : undefined}
      />

      {/* Moderation Notes Dialog */}
      {modifyingArticle && actionType && (
        <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#c5a880] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in">
            <h3 className="font-serif text-base font-bold text-[#0a1c3e]">
              {actionType === 'reject' ? tText('Reject Article', 'Rifiuta Articolo') : tText('Request Changes from Reporter', 'Richiedi Modifiche al Cronista')}
            </h3>
            <p className="text-xs text-slate-600">
              {tText('Provide reason or revision instructions for author', 'Inserisci la motivazione o le indicazioni di revisione per l\'autore')} <span className="font-bold">{modifyingArticle.authorName}</span>.
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Esempio: Verificare la didascalia dell'immagine e chiarire il riferimento normativo..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#0a1c3e] outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModifyingArticle(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {tText('Cancel', 'Annulla')}
              </button>
              <button
                onClick={handleSubmitNotes}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{tText('Send Notes', 'Invia Note')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
