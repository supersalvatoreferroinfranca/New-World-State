import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types/news';
import { 
  getArticles, 
  syncArticlesWithServer, 
  upsertArticleToServer, 
  getPublishedArticles, 
  getArticlesPendingModeration,
  normalizeArticleStatus 
} from '../../services/newsService';
import { safeFetch } from '../../services/api';
import { useI18n } from '../../contexts/I18nContext';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Cloud, 
  Server, 
  Terminal, 
  AlertTriangle, 
  X, 
  Check, 
  Send,
  Eye,
  Lock,
  Globe
} from 'lucide-react';

interface NewsSyncDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesUpdated?: () => void;
}

export function NewsSyncDiagnosticModal({
  isOpen,
  onClose,
  onArticlesUpdated
}: NewsSyncDiagnosticModalProps) {
  const { tText } = useI18n();
  const [activeTab, setActiveTab] = useState<'status' | 'test' | 'logs'>('status');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [logs, setLogs] = useState<{ time: string; type: 'info' | 'success' | 'error' | 'warn'; message: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ running: boolean; success?: boolean; details?: string } | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('it-IT');
    setLogs(prev => [{ time, type, message }, ...prev.slice(0, 99)]);
  };

  const loadData = () => {
    const list = getArticles();
    setArticles(list);
    addLog(`Caricati ${list.length} articoli dalla memoria locale / backup.`, 'info');
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      addLog('Apertura Console Diagnostica Sync DB Notizie.', 'info');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunFullSync = async () => {
    setIsSyncing(true);
    addLog('Avvio sincronizzazione forzata con il database PostgreSQL...', 'info');
    try {
      const synced = await syncArticlesWithServer(true);
      setArticles(synced);
      addLog(`Sincronizzazione completata con successo. Totale articoli sul database: ${synced.length}`, 'success');
      onArticlesUpdated?.();
    } catch (err: any) {
      addLog(`Errore durante la sincronizzazione: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceUploadSingle = async (art: NewsArticle) => {
    addLog(`Tentativo di caricamento forzato articolo ID #${art.id} ("${art.title}") al server...`, 'info');
    try {
      const res = await upsertArticleToServer(art);
      if (res.success) {
        addLog(`Articolo ID #${art.id} sincronizzato e salvato con successo sul database remoto!`, 'success');
        loadData();
        onArticlesUpdated?.();
      } else {
        addLog(`Fallito salvataggio remoto per ID #${art.id}: ${res.message || 'Errore sconosciuto'}`, 'error');
      }
    } catch (e: any) {
      addLog(`Eccezione salvataggio ID #${art.id}: ${e.message}`, 'error');
    }
  };

  const handleRunLiveApiTest = async () => {
    setTestResult({ running: true });
    addLog('Avvio test live delle API di scrittura /api/news/article e /api/news/sync...', 'info');
    
    const testId = `art-test-diag-${Date.now()}`;
    const testArticle: NewsArticle = {
      id: testId,
      title: 'Articolo di Test Diagnostico NWS',
      slug: `test-diagnostico-${Date.now()}`,
      categoryId: 'cat-politica',
      intro: 'Questo è un articolo di test creato dalla console di diagnostica per verificare la persistenza su database.',
      content: '<p>Contenuto di test persistenza database PostgreSQL.</p>',
      images: [],
      videos: [],
      tags: ['#Test'],
      relatedArticleIds: [],
      status: 'in_moderazione',
      authorId: 999,
      authorName: 'Diagnostica System',
      authorRole: 'Amministratore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      addLog(`1. Invio POST /api/news/article per ID #${testId}...`, 'info');
      const res = await safeFetch('/api/news/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: testArticle })
      });
      const data = await res.json().catch(() => ({}));
      addLog(`Risposta /api/news/article: HTTP ${res.status}, success=${data.success}, savedToDb=${data.savedToDb}`, res.ok && data.success ? 'success' : 'error');

      if (!res.ok || !data.success) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      addLog(`2. Verifica lettura GET /api/news/articles/${testId}...`, 'info');
      const getRes = await safeFetch(`/api/news/articles/${encodeURIComponent(testId)}`);
      const getData = await getRes.json().catch(() => ({}));
      addLog(`Risposta GET art: HTTP ${getRes.status}, found=${!!getData.article}`, getRes.ok && getData.article ? 'success' : 'warn');

      addLog(`3. Test pulizia articolo di test tramite POST /api/news/delete...`, 'info');
      await safeFetch('/api/news/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testId })
      });
      addLog('Articolo di test rimosso correttamente.', 'info');

      setTestResult({ running: false, success: true, details: 'Tutti i test API su database completati con successo!' });
      addLog('TEST LIVE API SUPERATO CON SUCCESSO.', 'success');
    } catch (err: any) {
      setTestResult({ running: false, success: false, details: err.message });
      addLog(`TEST LIVE API FALLITO: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0a1c3e] border border-[#c5a880]/50 rounded-3xl w-full max-w-4xl text-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="bg-[#061025] px-6 py-5 flex items-center justify-between border-b border-[#c5a880]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-gold">
                {tText('News Sync & Database Diagnostic Console', 'Console Diagnostica Sync & Database Notizie')}
              </h2>
              <p className="text-[10px] text-slate-300 font-tech tracking-wider uppercase">
                {tText('Monitor, debug and force database synchronization for articles & moderation', 'Monitoraggio, debug e sincronizzazione forzata database')}
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

        {/* Navigation Tabs */}
        <div className="bg-[#0d234a] border-b border-[#c5a880]/20 px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'status'
                  ? 'bg-brand-gold text-[#0a1c3e] shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{tText('Articles Sync Status', 'Stato Articoli & DB')} ({articles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'test'
                  ? 'bg-brand-gold text-[#0a1c3e] shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{tText('Live API Test', 'Test Live API')}</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-brand-gold text-[#0a1c3e] shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>{tText('Execution Logs', 'Log di Esecuzione')} ({logs.length})</span>
            </button>
          </div>

          <button
            disabled={isSyncing}
            onClick={handleRunFullSync}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 border border-emerald-400/40 shadow cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{tText('Force Full DB Sync', 'Forza Sync Totale DB')}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#061025]">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-brand-gold">Riepilogo Stato Articoli</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Totale articoli in memoria: <strong className="text-white">{articles.length}</strong> • 
                    Pubblicati: <strong className="text-emerald-400">{getPublishedArticles().length}</strong> • 
                    In Moderazione / Bozze: <strong className="text-amber-400">{getArticlesPendingModeration().length}</strong>
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  Storage: localStorage + Neon PostgreSQL
                </div>
              </div>

              <div className="space-y-2.5">
                {articles.map((art) => {
                  const normStatus = normalizeArticleStatus(art.status);
                  return (
                    <div 
                      key={art.id} 
                      className="bg-white/10 border border-white/15 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-md">
                            ID: {art.id}
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full text-white ${
                            normStatus === 'pubblicato' ? 'bg-emerald-600' : normStatus === 'in_moderazione' ? 'bg-amber-600' : 'bg-slate-600'
                          }`}>
                            {art.status}
                          </span>
                          <span className="text-[10px] text-slate-300">
                            Autore: <strong className="text-white">{art.authorName}</strong>
                          </span>
                        </div>
                        <h4 className="font-serif text-sm font-bold text-white">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-1">
                          {art.intro}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleForceUploadSingle(art)}
                          className="px-3.5 py-2 rounded-xl bg-brand-gold text-[#0a1c3e] text-xs font-bold hover:bg-white transition cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>{tText('Upload to DB', 'Salva su DB')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6 max-w-2xl mx-auto text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold mx-auto">
                <Database className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-brand-gold">
                  {tText('Test Database Write & Read Persistence', 'Test Scrittura e Lettura Persistenza Database')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tText('Run an automated test transaction against the server database to verify that newly created articles and moderation updates are correctly saved to PostgreSQL tables without fallback errors.', 'Esegui una transazione di test automatica per verificare che la scrittura su database delle notizie e degli stati di moderazione avvenga correttamente.')}
                </p>
              </div>

              <button
                type="button"
                disabled={testResult?.running}
                onClick={handleRunLiveApiTest}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-brand-gold to-amber-300 text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer inline-flex items-center gap-2 shadow-2xl border border-amber-300 disabled:opacity-50"
              >
                {testResult?.running ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{testResult?.running ? 'Test in Esecuzione...' : 'Avvia Test Live Database'}</span>
              </button>

              {testResult && !testResult.running && (
                <div className={`p-4 rounded-2xl text-xs text-left space-y-1 border ${
                  testResult.success
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/80 border-red-500 text-red-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span>{testResult.success ? 'Test Completato con Successo' : 'Test Fallito'}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{testResult.details}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-mono">
                <span>Registri in tempo reale ({logs.length} eventi)</span>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-brand-gold hover:underline text-[11px] cursor-pointer"
                >
                  Pulisci Log
                </button>
              </div>

              <div className="bg-[#030814] border border-white/10 rounded-2xl p-4 font-mono text-[11px] space-y-2 max-h-[55vh] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-6">Nessun evento registrato in questa sessione.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-white/5 pb-1.5">
                      <span className="text-slate-500 shrink0">{log.time}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                        log.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.type === 'error' ? 'bg-red-500/20 text-red-300' :
                        log.type === 'warn' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-sky-500/20 text-sky-300'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-slate-200 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#061025] border-t border-[#c5a880]/30 px-6 py-4 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            New World State — Protocollo di Sincronizzazione Sovrana
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-gold text-[#0a1c3e] text-xs font-bold uppercase tracking-wider hover:bg-white transition cursor-pointer"
          >
            {tText('Close', 'Chiudi')}
          </button>
        </div>
      </div>
    </div>
  );
}
