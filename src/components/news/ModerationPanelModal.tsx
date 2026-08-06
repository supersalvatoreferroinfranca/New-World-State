import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types/news';
import { 
  getArticles, 
  getArticlesPendingModeration, 
  moderateArticle, 
  deleteArticle 
} from '../../services/newsService';
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
  Send 
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
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Note Modal State
  const [modifyingArticle, setModifyingArticle] = useState<NewsArticle | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'request_changes' | null>(null);
  const [notes, setNotes] = useState('');

  const loadData = () => {
    if (tab === 'pending') {
      setArticles(getArticlesPendingModeration());
    } else {
      setArticles(getArticles());
    }
    onArticlesUpdated?.();
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleApprove = (art: NewsArticle) => {
    if (confirm(`${tText('Confirm approval and publication of article', 'Confermi l\'approvazione e la pubblicazione dell\'articolo')} "${art.title}"?`)) {
      moderateArticle(art.id, 'approve');
      loadData();
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
    if (confirm(tText('Are you sure you want to permanently delete this article?', 'Sei sicuro di voler eliminare definitivamente questo articolo?'))) {
      deleteArticle(id);
      loadData();
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
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
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

            <button
              onClick={loadData}
              className="p-2 rounded-lg text-slate-500 hover:text-[#0a1c3e] hover:bg-slate-200 transition cursor-pointer"
              title={tText('Refresh List', 'Aggiorna lista')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
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

                        <button
                          onClick={() => handleApprove(art)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{tText('Approve & Publish', 'Approva & Pubblica')}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(art.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title={tText('Delete', 'Elimina')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
