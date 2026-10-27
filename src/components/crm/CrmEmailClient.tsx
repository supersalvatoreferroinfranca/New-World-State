import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../services/api';
import { 
  Mail, 
  Send, 
  Inbox, 
  RotateCw, 
  Plus, 
  Search, 
  Building2, 
  User, 
  FileText, 
  Paperclip, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  X,
  Globe,
  Sparkles,
  Loader2,
  Users,
  CheckSquare,
  Square,
  Languages,
  Tag,
  Check,
  Copy,
  RefreshCw
} from 'lucide-react';

interface CrmEmail {
  id?: number;
  email: string;
  etichetta?: string;
  is_primary?: boolean;
}

interface CrmStatoItem {
  id: number;
  nome_stato: string;
  codice_stato?: string;
  rappresentante?: string;
  ruolo?: string;
  note?: string;
  emails: CrmEmail[];
  comunicazioni_count?: number;
  last_comunicazione?: string | null;
}

interface StoricoItem {
  id: number;
  contatto_id: number;
  email_destinatario_mittente: string;
  direzione: 'INVIATA' | 'RICEVUTA';
  oggetto: string;
  corpo_html: string;
  corpo_testo?: string;
  message_id: string;
  firma_nome?: string;
  allegati?: Array<{ filename: string; size?: number; contentType?: string }>;
  data: string;
  nome_stato?: string;
}

interface AttachmentFile {
  filename: string;
  content: string; // base64
  contentType: string;
  size: number;
}

export default function CrmEmailClient() {
  // Navigation: 'rubrica' | 'scheda' | 'composizione'
  const [currentView, setCurrentView] = useState<'rubrica' | 'scheda' | 'composizione'>('rubrica');
  
  // Data State
  const [stati, setStati] = useState<CrmStatoItem[]>([]);
  const [selectedStato, setSelectedStato] = useState<CrmStatoItem | null>(null);
  const [comunicazioni, setComunicazioni] = useState<StoricoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sincronizzazione IMAP
  const [isSyncingImap, setIsSyncingImap] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Composizione Email - Modalità Invio: 'single' (Singolo) | 'multi' (Multiplo a più destinatari)
  const [sendMode, setSendMode] = useState<'single' | 'multi'>('multi');
  const [composeStatoId, setComposeStatoId] = useState<number | ''>('');
  const [composeDestinatarioEmail, setComposeDestinatarioEmail] = useState<string>('');
  const [composeOggetto, setComposeOggetto] = useState<string>('');
  const [composeTesto, setComposeTesto] = useState<string>('');
  const [composeFirma, setComposeFirma] = useState<string>('Cav. Dott. Salvatore Ferro Infranca');
  const [composeAllegati, setComposeAllegati] = useState<AttachmentFile[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // Selezione Multipla Destinatari (Invii Multipli)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<number>>(new Set());
  const [customEmails, setCustomEmails] = useState<{ [statoId: number]: string }>({});
  const [multiSearch, setMultiSearch] = useState<string>('');

  // Campi di Personalizzazione Dinamica: focus target ('oggetto' | 'testo')
  const [placeholderTarget, setPlaceholderTarget] = useState<'oggetto' | 'testo'>('testo');

  // Traduzione Diplomatica & Bilinguismo
  const [translateBeforeSend, setTranslateBeforeSend] = useState<boolean>(true);
  const [languageMode, setLanguageMode] = useState<'inglese' | 'bilingue' | 'italiano'>('inglese');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedSubject, setTranslatedSubject] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showBilingualDrawer, setShowBilingualDrawer] = useState<boolean>(false);
  const [previewSampleId, setPreviewSampleId] = useState<number | ''>('');

  // Modale Avanzamento Invio Multiplo
  const [batchProgress, setBatchProgress] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    currentName: string;
    status: 'in_progress' | 'success' | 'error';
    sentCount: number;
    failedCount: number;
    logs: Array<{ name: string; email: string; success: boolean; error?: string }>;
  } | null>(null);

  // Anteprima Template Istituzionale
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Modale Aggiunta/Modifica Stato
  const [isStatoModalOpen, setIsStatoModalOpen] = useState<boolean>(false);
  const [editingStato, setEditingStato] = useState<Partial<CrmStatoItem> | null>(null);
  const [stateFormEmails, setStateFormEmails] = useState<Array<{ email: string; etichetta: string; is_primary: boolean }>>([
    { email: '', etichetta: 'Ufficiale', is_primary: true }
  ]);
  const [isSavingStato, setIsSavingStato] = useState<boolean>(false);

  // Timeline Filter
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'INVIATA' | 'RICEVUTA'>('all');
  const [expandedCommId, setExpandedCommId] = useState<number | null>(null);

  // Caricamento Iniziale
  useEffect(() => {
    loadStati();
  }, []);

  const loadStati = async () => {
    setLoading(true);
    try {
      const res = await safeFetch('/api/crm/stati');
      const data = await res.json();
      if (data.success) {
        const items = data.stati || [];
        setStati(items);
        setSelectedRecipientIds(prev => prev.size === 0 ? new Set(items.map((s: any) => s.id)) : prev);
        if (items.length > 0) {
          setPreviewSampleId(items[0].id);
        }
      }
    } catch (err: any) {
      console.error('[CRM] Errore caricamento stati:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComunicazioniForStato = async (statoId: number) => {
    try {
      const res = await safeFetch(`/api/crm/stati/${statoId}/comunicazioni`);
      const data = await res.json();
      if (data.success) {
        setComunicazioni(data.comunicazioni || []);
      }
    } catch (err: any) {
      console.error('[CRM] Errore caricamento storico comunicazioni:', err);
    }
  };

  const handleOpenScheda = (stato: CrmStatoItem) => {
    setSelectedStato(stato);
    loadComunicazioniForStato(stato.id);
    setCurrentView('scheda');
  };

  const handleOpenComposeForStato = (stato: CrmStatoItem) => {
    setSelectedStato(stato);
    setSendMode('single');
    setComposeStatoId(stato.id);
    const primary = stato.emails?.find(e => e.is_primary)?.email || stato.emails?.[0]?.email || '';
    setComposeDestinatarioEmail(primary);
    setPreviewSampleId(stato.id);
    setComposeOggetto('');
    setComposeTesto('');
    setComposeAllegati([]);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);
    setCurrentView('composizione');
  };

  const handleSyncImap = async () => {
    setIsSyncingImap(true);
    setSyncFeedback(null);
    try {
      const res = await safeFetch('/api/crm/sync-imap', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({
          message: `Sincronizzazione completata! ${data.newMessagesCount} nuove email ricevute registrate nello storico.`,
          type: 'success'
        });
        // Ricarica la rubrica e la timeline se aperta
        await loadStati();
        if (selectedStato) {
          await loadComunicazioniForStato(selectedStato.id);
        }
      } else {
        setSyncFeedback({
          message: data.message || 'Errore durante la sincronizzazione IMAP.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        message: err.message || 'Connessione al server IMAP non riuscita.',
        type: 'error'
      });
    } finally {
      setIsSyncingImap(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 6000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setComposeAllegati(prev => [
          ...prev,
          {
            filename: file.name,
            content: base64,
            contentType: file.type || 'application/octet-stream',
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setComposeAllegati(prev => prev.filter((_, i) => i !== index));
  };

  const insertPlaceholder = (tag: string, target?: 'oggetto' | 'testo') => {
    const chosen = target || placeholderTarget;
    if (chosen === 'oggetto') {
      setComposeOggetto(prev => (prev ? `${prev} ${tag}` : tag));
    } else {
      setComposeTesto(prev => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleTranslateNow = async () => {
    if (!composeOggetto && !composeTesto) {
      setSendErrorMessage('Compila l\'oggetto o il testo prima di avviare la traduzione diplomatica.');
      return;
    }
    setIsTranslating(true);
    setSendErrorMessage(null);
    try {
      const res = await safeFetch('/api/crm/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oggetto: composeOggetto,
          testo_messaggio: composeTesto
        })
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedSubject(data.translatedSubject || composeOggetto);
        setTranslatedText(data.translatedText || composeTesto);
        setShowBilingualDrawer(true);
      } else {
        setSendErrorMessage('Errore traduzione: ' + (data.message || 'Impossibile completare la traduzione'));
      }
    } catch (err: any) {
      setSendErrorMessage('Errore di connessione al servizio traduzione: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOpenPreview = async () => {
    // Determina lo Stato campione per l'anteprima
    let sampleStato = stati.find(s => s.id === Number(composeStatoId));
    if (!sampleStato && previewSampleId) {
      sampleStato = stati.find(s => s.id === Number(previewSampleId));
    }
    if (!sampleStato && stati.length > 0) {
      sampleStato = stati[0];
    }

    const sampleEmail = (sampleStato && customEmails[sampleStato.id]) 
      || (sampleStato && (sampleStato.emails?.find(e => e.is_primary)?.email || sampleStato.emails?.[0]?.email))
      || composeDestinatarioEmail 
      || 'ambasciata@stato-campione.org';

    setPreviewLoading(true);
    setIsPreviewOpen(true);

    let activeSubj = composeOggetto || 'Oggetto della Comunicazione Istituzionale';
    let activeBody = composeTesto || 'Inserisci qui il testo della comunicazione diplomatica...';

    // Se è attiva l'opzione di invio in inglese o bilingue e la traduzione è già disponibile
    if (languageMode === 'inglese' && translatedSubject && translatedText) {
      activeSubj = translatedSubject;
      activeBody = translatedText;
    } else if (languageMode === 'bilingue' && translatedSubject && translatedText) {
      activeSubj = `${translatedSubject} / ${composeOggetto}`;
      activeBody = `${translatedText}\n\n------------------------------------------------------------\n[VERSIONE ORIGINALE IN ITALIANO]\n------------------------------------------------------------\n\n${composeTesto}`;
    }

    try {
      const res = await safeFetch('/api/crm/anteprima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oggetto: activeSubj,
          testo_messaggio: activeBody,
          firma_nome: composeFirma,
          destinatario_stato: sampleStato?.nome_stato || 'Stato Sovrano Campione',
          destinatario_rappresentante: sampleStato?.rappresentante || 'Eccellenza',
          destinatario_ruolo: sampleStato?.ruolo || 'Rappresentante Diplomatico',
          email_destinatario: sampleEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewHtml(data.html);
      }
    } catch (err: any) {
      setPreviewHtml(`<p style="color:red;">Errore generazione anteprima: ${err.message}</p>`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // -------------------------------------------------------------
    // MODALITÀ 1: INVIO SINGOLO A 1 STATO
    // -------------------------------------------------------------
    if (sendMode === 'single') {
      if (!composeStatoId || !composeDestinatarioEmail || !composeOggetto || !composeTesto) {
        setSendErrorMessage('Compila tutti i campi obbligatori (Stato, Destinatario, Oggetto e Testo).');
        return;
      }

      setIsSendingEmail(true);
      setSendSuccessMessage(null);
      setSendErrorMessage(null);

      try {
        const res = await safeFetch('/api/crm/invia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contatto_id: Number(composeStatoId),
            email_destinatario: composeDestinatarioEmail,
            oggetto: composeOggetto,
            testo_messaggio: composeTesto,
            firma_nome: composeFirma,
            traduci_inglese: translateBeforeSend,
            modalita_lingua: languageMode,
            allegati: composeAllegati.map(a => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType
            }))
          })
        });

        const data = await res.json();
        if (data.success) {
          setSendSuccessMessage('✓ Comunicazione istituzionale inviata e archiviata nello storico con successo!');
          await loadStati();
          if (selectedStato) {
            await loadComunicazioniForStato(selectedStato.id);
          }
          setTimeout(() => {
            if (selectedStato) {
              setCurrentView('scheda');
            } else {
              setCurrentView('rubrica');
            }
          }, 1500);
        } else {
          setSendErrorMessage(data.message || 'Errore durante l\'invio dell\'email via SMTP.');
        }
      } catch (err: any) {
        setSendErrorMessage(err.message || 'Errore di connessione durante l\'invio.');
      } finally {
        setIsSendingEmail(false);
      }
      return;
    }

    // -------------------------------------------------------------
    // MODALITÀ 2: INVIO MULTIPLO (PIÙ DESTINATARI SELEZIONATI)
    // -------------------------------------------------------------
    if (selectedRecipientIds.size === 0) {
      setSendErrorMessage('Seleziona almeno uno Stato destinatario per l\'invio multiplo.');
      return;
    }
    if (!composeOggetto || !composeTesto) {
      setSendErrorMessage('Inserisci l\'oggetto e il corpo del messaggio prima di inviare.');
      return;
    }

    // Costruisce la lista dei destinatari selezionati
    const destinatariList = stati
      .filter(s => selectedRecipientIds.has(s.id))
      .map(s => {
        const chosenEmail = customEmails[s.id] || 
          s.emails?.find(e => e.is_primary)?.email || 
          s.emails?.[0]?.email || '';
        return {
          stato_id: s.id,
          nome_stato: s.nome_stato,
          email: chosenEmail,
          rappresentante: s.rappresentante || null,
          ruolo: s.ruolo || null
        };
      })
      .filter(d => d.email && d.email.includes('@'));

    if (destinatariList.length === 0) {
      setSendErrorMessage('Nessuno degli Stati selezionati possiede un indirizzo email valido configurato.');
      return;
    }

    setIsSendingEmail(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    setBatchProgress({
      isOpen: true,
      current: 0,
      total: destinatariList.length,
      currentName: destinatariList[0].nome_stato,
      status: 'in_progress',
      sentCount: 0,
      failedCount: 0,
      logs: []
    });

    try {
      const res = await safeFetch('/api/crm/invia-multiplo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatari: destinatariList,
          oggetto: composeOggetto,
          testo_messaggio: composeTesto,
          firma_nome: composeFirma,
          traduci_inglese: translateBeforeSend,
          modalita_lingua: languageMode,
          allegati: composeAllegati.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        setBatchProgress(prev => prev ? {
          ...prev,
          current: destinatariList.length,
          status: 'success',
          sentCount: data.sentCount || destinatariList.length,
          failedCount: data.failedCount || 0,
          logs: (data.results || []).map((r: any) => ({
            name: r.nome_stato,
            email: r.email,
            success: r.success,
            error: r.error
          }))
        } : null);

        setSendSuccessMessage(`✓ Invio multiplo completato con successo: ${data.sentCount || destinatariList.length} comunicazioni inviate e archiviate!`);
        await loadStati();
      } else {
        setBatchProgress(prev => prev ? {
          ...prev,
          status: 'error',
          failedCount: destinatariList.length
        } : null);
        setSendErrorMessage(data.message || 'Errore durante la spedizione multipla.');
      }
    } catch (err: any) {
      setBatchProgress(prev => prev ? {
        ...prev,
        status: 'error',
        failedCount: destinatariList.length
      } : null);
      setSendErrorMessage('Errore di connessione durante la spedizione multipla: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleOpenAddStato = () => {
    setEditingStato(null);
    setStateFormEmails([{ email: '', etichetta: 'Ufficiale / Ambasciata', is_primary: true }]);
    setIsStatoModalOpen(true);
  };

  const handleOpenEditStato = (stato: CrmStatoItem) => {
    setEditingStato(stato);
    if (stato.emails && stato.emails.length > 0) {
      setStateFormEmails(stato.emails.map(e => ({
        email: e.email,
        etichetta: e.etichetta || 'Ufficiale',
        is_primary: !!e.is_primary
      })));
    } else {
      setStateFormEmails([{ email: '', etichetta: 'Ufficiale', is_primary: true }]);
    }
    setIsStatoModalOpen(true);
  };

  const handleSaveStato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStato?.nome_stato) return;

    setIsSavingStato(true);
    try {
      const validEmails = stateFormEmails.filter(e => e.email && e.email.includes('@'));
      const res = await safeFetch('/api/crm/stati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStato.id,
          nome_stato: editingStato.nome_stato,
          codice_stato: editingStato.codice_stato,
          rappresentante: editingStato.rappresentante,
          ruolo: editingStato.ruolo,
          note: editingStato.note,
          emails: validEmails
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsStatoModalOpen(false);
        await loadStati();
        if (selectedStato && selectedStato.id === editingStato.id) {
          const updated = (await (await safeFetch('/api/crm/stati')).json()).stati.find((s: any) => s.id === editingStato.id);
          if (updated) setSelectedStato(updated);
        }
      }
    } catch (err: any) {
      alert('Errore salvataggio stato: ' + err.message);
    } finally {
      setIsSavingStato(false);
    }
  };

  const handleDeleteStato = async (id: number, nome: string) => {
    if (!confirm(`Sei sicuro di voler eliminare lo Stato "${nome}" e tutto il suo storico comunicazioni?`)) {
      return;
    }
    try {
      const res = await safeFetch(`/api/crm/stati/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadStati();
        if (selectedStato?.id === id) {
          setSelectedStato(null);
          setCurrentView('rubrica');
        }
      }
    } catch (err: any) {
      alert('Errore eliminazione: ' + err.message);
    }
  };

  const filteredStati = stati.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nome_stato.toLowerCase().includes(q) ||
      (s.codice_stato && s.codice_stato.toLowerCase().includes(q)) ||
      (s.rappresentante && s.rappresentante.toLowerCase().includes(q)) ||
      (s.ruolo && s.ruolo.toLowerCase().includes(q)) ||
      s.emails.some(e => e.email.toLowerCase().includes(q))
    );
  });

  const filteredComunicazioni = comunicazioni.filter(c => {
    if (timelineFilter === 'all') return true;
    return c.direzione === timelineFilter;
  });

  return (
    <div className="bg-[#050e20] text-slate-100 min-h-[750px] rounded-3xl border border-[#c5a880]/30 overflow-hidden shadow-2xl flex flex-col font-sans">
      
      {/* Header Top Bar Istituzionale */}
      <header className="bg-gradient-to-r from-[#071630] via-[#0a1c3e] to-[#0d234d] border-b border-[#c5a880]/30 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center text-brand-gold shadow-md">
            <Mail className="w-6 h-6 text-[#c5a880]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide font-display">Cancelleria Diplomatica & CRM</h1>
              <span className="text-[10px] bg-[#c5a880]/20 text-[#e4cbab] font-bold px-2 py-0.5 rounded-full border border-[#c5a880]/40 uppercase tracking-wider">
                Custode Digitale
              </span>
            </div>
            <p className="text-xs text-slate-400">Corrispondenza sovrana e relazioni con gli Stati del mondo</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncImap}
            disabled={isSyncingImap}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-[#c5a880]/50 transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Connettiti al server IMAP di newworldstate.cloud per scaricare nuove risposte"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#c5a880] ${isSyncingImap ? 'animate-spin' : ''}`} />
            <span>{isSyncingImap ? 'Sincronizzazione IMAP...' : 'Sincronizza Posta (IMAP)'}</span>
          </button>

          <button
            onClick={handleOpenAddStato}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-[#c5a880]/50 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Nuovo Stato</span>
          </button>

          <button
            onClick={() => {
              setComposeStatoId(stati[0]?.id || '');
              setComposeDestinatarioEmail(stati[0]?.emails?.[0]?.email || '');
              setComposeOggetto('');
              setComposeTesto('');
              setComposeAllegati([]);
              setSendSuccessMessage(null);
              setSendErrorMessage(null);
              setCurrentView('composizione');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#e4cbab] text-[#0a1c3e] text-xs font-bold hover:brightness-105 shadow-md shadow-amber-500/10 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Scrivi Nuova Email</span>
          </button>
        </div>
      </header>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
            : 'bg-red-950/40 text-red-300 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{syncFeedback.message}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#071328] border-b border-[#c5a880]/20 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('rubrica')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'rubrica'
                ? 'bg-[#c5a880]/20 text-[#e4cbab] border border-[#c5a880]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Rubrica Stati ({stati.length})</span>
          </button>

          {selectedStato && (
            <button
              onClick={() => setCurrentView('scheda')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'scheda'
                  ? 'bg-[#c5a880]/20 text-[#e4cbab] border border-[#c5a880]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Scheda: {selectedStato.nome_stato}</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView('composizione')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentView === 'composizione'
                ? 'bg-[#c5a880]/20 text-[#e4cbab] border border-[#c5a880]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Composizione Email</span>
          </button>
        </div>

        {currentView === 'rubrica' && (
          <div className="relative w-64 max-w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca Stato, email o referente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050e20] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c5a880]/60"
            />
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* ============================================================== */}
        {/* VISTA 1: RUBRICA STATI */}
        {/* ============================================================== */}
        {currentView === 'rubrica' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#c5a880]" />
                  <span>Rubrica Internazionale degli Stati & Istituzioni</span>
                </h2>
                <p className="text-xs text-slate-400">Relazione diplomatica 1-a-Molti con molteplici recapiti email per ogni Stato</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {filteredStati.length} Stati Registrati
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#c5a880]" />
                <span className="text-xs">Caricamento rubrica diplomatica da Neon DB...</span>
              </div>
            ) : filteredStati.length === 0 ? (
              <div className="bg-[#071630] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Nessuno Stato trovato per i criteri specificati.</p>
                <p className="text-xs text-slate-500">Aggiungi un nuovo Stato o controlla i filtri di ricerca.</p>
                <button
                  onClick={handleOpenAddStato}
                  className="px-4 py-2 rounded-xl bg-[#c5a880] text-[#0a1c3e] font-bold text-xs hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi il Primo Stato</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStati.map((stato) => {
                  return (
                    <div
                      key={stato.id}
                      className="bg-[#071630] border border-slate-800 hover:border-[#c5a880]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-[#c5a880]/5 space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {stato.codice_stato && (
                                <span className="text-[10px] font-mono font-bold bg-[#c5a880]/15 text-[#e4cbab] px-2 py-0.5 rounded border border-[#c5a880]/30">
                                  {stato.codice_stato}
                                </span>
                              )}
                              <h3 className="font-bold text-sm text-white">{stato.nome_stato}</h3>
                            </div>
                            {stato.rappresentante && (
                              <p className="text-xs text-slate-300 font-medium flex items-center gap-1 pt-1">
                                <User className="w-3 h-3 text-[#c5a880]" />
                                <span>{stato.rappresentante}</span>
                                {stato.ruolo && <span className="text-slate-500 text-[11px]">({stato.ruolo})</span>}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditStato(stato)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title="Modifica Stato e recapiti"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStato(stato.id, stato.nome_stato)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                              title="Elimina Stato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Note sintetiche se presenti */}
                        {stato.note && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-2 bg-[#050e20] p-2 rounded-lg border border-slate-800/80">
                            "{stato.note}"
                          </p>
                        )}

                        {/* Indirizzi Email Multipli (Relazione 1 a Molti) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Indirizzi Email Associati:</span>
                            <span className="text-[9px] text-[#c5a880] font-mono">{stato.emails?.length || 0} indirizzi</span>
                          </div>
                          
                          <div className="space-y-1">
                            {stato.emails && stato.emails.length > 0 ? (
                              stato.emails.map((em, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs bg-[#050e20] border border-slate-800 rounded-lg px-2.5 py-1.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="font-mono text-slate-200 truncate text-[11px] select-all">{em.email}</span>
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    em.is_primary 
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {em.etichetta || (em.is_primary ? 'Principale' : 'Ufficiale')}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-amber-400/80 italic">Nessun indirizzo email configurato.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer con Statistiche e Azioni Rapide */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-slate-400 font-mono">
                          <span>{stato.comunicazioni_count || 0} comunicazioni</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenScheda(stato)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Vedi cronologia messaggi inviati e ricevuti"
                          >
                            <Clock className="w-3 h-3 text-[#c5a880]" />
                            <span>Storico</span>
                          </button>

                          <button
                            onClick={() => handleOpenComposeForStato(stato)}
                            className="px-3 py-1.5 rounded-lg bg-[#c5a880] text-[#0a1c3e] hover:bg-[#e4cbab] text-xs font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                            title="Scrivi email a questo Stato"
                          >
                            <Send className="w-3 h-3" />
                            <span>Scrivi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 2: SCHEDA STATO & CRONOLOGIA COMUNICAZIONI (TIMELINE) */}
        {/* ============================================================== */}
        {currentView === 'scheda' && selectedStato && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Navigazione indietro & Header Scheda */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('rubrica')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Torna alla Rubrica"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    {selectedStato.codice_stato && (
                      <span className="text-xs font-mono font-bold bg-[#c5a880]/20 text-[#e4cbab] px-2.5 py-0.5 rounded border border-[#c5a880]/30">
                        {selectedStato.codice_stato}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-white font-display">{selectedStato.nome_stato}</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Rappresentante: <strong className="text-slate-200">{selectedStato.rappresentante || 'Non specificato'}</strong> {selectedStato.ruolo ? `• ${selectedStato.ruolo}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditStato(selectedStato)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Modifica Dati</span>
                </button>

                <button
                  onClick={() => handleOpenComposeForStato(selectedStato)}
                  className="px-4 py-2 rounded-xl bg-[#c5a880] text-[#0a1c3e] hover:bg-[#e4cbab] text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Nuova Email</span>
                </button>
              </div>
            </div>

            {/* Email multiple associate a questo Stato */}
            <div className="bg-[#071630] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recapiti Ufficiali:</span>
              {selectedStato.emails && selectedStato.emails.length > 0 ? (
                selectedStato.emails.map((e, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-[#050e20] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
                    <Mail className="w-3 h-3 text-[#c5a880]" />
                    <span className="font-mono text-slate-200 select-all">{e.email}</span>
                    <span className="text-[10px] text-slate-400 italic">({e.etichetta || 'Ufficiale'})</span>
                    {e.is_primary && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Email Principale" />
                    )}
                  </div>
                ))
              ) : (
                <span className="text-xs text-amber-400">Nessuna email configurata.</span>
              )}
            </div>

            {/* Timeline delle Comunicazioni */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c5a880]" />
                  <span>Cronologia delle Comunicazioni ({comunicazioni.length})</span>
                </h3>

                {/* Filtro Timeline */}
                <div className="flex items-center gap-1 bg-[#071630] p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setTimelineFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      timelineFilter === 'all' ? 'bg-[#c5a880] text-[#0a1c3e]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutte ({comunicazioni.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('INVIATA')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      timelineFilter === 'INVIATA' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Inviate (📤)
                  </button>
                  <button
                    onClick={() => setTimelineFilter('RICEVUTA')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      timelineFilter === 'RICEVUTA' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ricevute (📥)
                  </button>
                </div>
              </div>

              {filteredComunicazioni.length === 0 ? (
                <div className="bg-[#071630] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300">Nessuna comunicazione archiviata per questo filtro.</p>
                  <button
                    onClick={() => handleOpenComposeForStato(selectedStato)}
                    className="px-3.5 py-2 rounded-xl bg-[#c5a880] text-[#0a1c3e] font-bold text-xs hover:opacity-90 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Invia la Prima Comunicazione</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComunicazioni.map((comm) => {
                    const isInviata = comm.direzione === 'INVIATA';
                    const isExpanded = expandedCommId === comm.id;

                    return (
                      <div
                        key={comm.id}
                        className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                          isInviata 
                            ? 'bg-[#071630] border-blue-500/20 hover:border-blue-500/40' 
                            : 'bg-[#071d18] border-emerald-500/20 hover:border-emerald-500/40'
                        }`}
                      >
                        {/* Riga Intestazione Messaggio */}
                        <div
                          onClick={() => setExpandedCommId(isExpanded ? null : comm.id)}
                          className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                              isInviata 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {isInviata ? '📤 INVIATA' : '📥 RICEVUTA'}
                            </span>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{comm.oggetto}</h4>
                              <p className="text-xs text-slate-400 truncate">
                                {isInviata ? `A: ${comm.email_destinatario_mittente}` : `Da: ${comm.email_destinatario_mittente}`}
                                {comm.firma_nome && ` • Firma: ${comm.firma_nome}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {comm.allegati && comm.allegati.length > 0 && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700">
                                <Paperclip className="w-3 h-3 text-[#c5a880]" />
                                <span>{comm.allegati.length}</span>
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">
                              {new Date(comm.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Corpo Espanso del Messaggio */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 bg-black/20">
                            <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>Message-ID: <code className="text-[#c5a880] select-all">{comm.message_id}</code></span>
                              <span>Data esatta: {new Date(comm.data).toLocaleString('it-IT')}</span>
                            </div>

                            {/* Allegati */}
                            {comm.allegati && comm.allegati.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Allegati:</span>
                                <div className="flex flex-wrap gap-2">
                                  {comm.allegati.map((att, aIdx) => (
                                    <div key={aIdx} className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 font-mono">
                                      <Paperclip className="w-3 h-3 text-[#c5a880]" />
                                      <span>{att.filename}</span>
                                      {att.size && <span className="text-[10px] text-slate-500">({Math.round(att.size / 1024)} KB)</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Anteprima HTML / Testo del Corpo */}
                            <div className="bg-white text-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-200 max-h-96">
                              {comm.corpo_html ? (
                                <div dangerouslySetInnerHTML={{ __html: comm.corpo_html }} />
                              ) : (
                                <pre className="whitespace-pre-wrap font-sans text-sm">{comm.corpo_testo || 'Nessun testo memorizzato.'}</pre>
                              )}
                            </div>

                            {/* Azione di replica rapida */}
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  handleOpenComposeForStato(selectedStato);
                                  setComposeOggetto(comm.oggetto.startsWith('Re:') ? comm.oggetto : `Re: ${comm.oggetto}`);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-[#c5a880] text-[#0a1c3e] text-xs font-bold hover:bg-[#e4cbab] flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Rispondi a questa Comunicazione</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 3: COMPOSIZIONE EMAIL (SMTP CON ALLEGATI E TEMPLATE) */}
        {/* ============================================================== */}
        {currentView === 'composizione' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => selectedStato ? setCurrentView('scheda') : setCurrentView('rubrica')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#c5a880]" />
                    <span>Redazione & Invio Comunicazione Istituzionale</span>
                  </h2>
                  <p className="text-xs text-slate-400">Invii singoli o massivi a più Stati con personalizzazione dinamica e traduzione diplomatica automatica</p>
                </div>
              </div>

              {/* Bottoni Modalità Invio: Multiplo vs Singolo */}
              <div className="flex items-center gap-1.5 p-1 bg-[#050e20] border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSendMode('multi')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sendMode === 'multi'
                      ? 'bg-[#c5a880] text-[#0a1c3e] shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Invio Multiplo ({selectedRecipientIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('single')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sendMode === 'single'
                      ? 'bg-[#c5a880] text-[#0a1c3e] shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Destinatario Singolo</span>
                </button>
              </div>
            </div>

            {/* Banner Feedback Invio */}
            {sendSuccessMessage && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{sendSuccessMessage}</span>
              </div>
            )}

            {sendErrorMessage && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{sendErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="bg-[#071630] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              
              {/* ============================================================== */}
              {/* SELEZIONE DESTINATARI: MULTIPLO vs SINGOLO */}
              {/* ============================================================== */}
              {sendMode === 'multi' ? (
                <div className="bg-[#050e20] border border-slate-700/80 rounded-2xl p-4 md:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#c5a880]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Destinatari Multipli Selezionati: <span className="text-[#c5a880] text-sm">{selectedRecipientIds.size}</span> di {stati.length} Stati
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedRecipientIds(new Set(stati.map(s => s.id)))}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        Seleziona Tutti ({stati.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipientIds(new Set())}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        Deseleziona
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const withRep = stati.filter(s => s.rappresentante && s.rappresentante.trim().length > 0).map(s => s.id);
                          setSelectedRecipientIds(new Set(withRep));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] text-[11px] font-bold border border-[#c5a880]/30 transition cursor-pointer"
                      >
                        Solo con Rappresentante ({stati.filter(s => s.rappresentante && s.rappresentante.trim().length > 0).length})
                      </button>
                    </div>
                  </div>

                  {/* Ricerca Rapida Stati nella lista di selezione */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Filtra stati per nome, rappresentante o email..."
                      value={multiSearch}
                      onChange={(e) => setMultiSearch(e.target.value)}
                      className="w-full bg-[#071630] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  {/* Griglia Scrollabile di Selezione Destinatari */}
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                    {stati
                      .filter(s => {
                        const q = multiSearch.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          s.nome_stato.toLowerCase().includes(q) ||
                          (s.rappresentante && s.rappresentante.toLowerCase().includes(q)) ||
                          s.emails.some(e => e.email.toLowerCase().includes(q))
                        );
                      })
                      .map((s) => {
                        const isSelected = selectedRecipientIds.has(s.id);
                        const primaryEmail = s.emails?.find(e => e.is_primary)?.email || s.emails?.[0]?.email || '';
                        const currentChosenEmail = customEmails[s.id] || primaryEmail;

                        return (
                          <div
                            key={s.id}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition select-none ${
                              isSelected 
                                ? 'bg-[#0a1e42]/60 border border-blue-500/30' 
                                : 'bg-[#071630]/40 border border-transparent hover:bg-slate-800/30'
                            }`}
                          >
                            <div 
                              onClick={() => {
                                setSelectedRecipientIds(prev => {
                                  const copy = new Set(prev);
                                  if (copy.has(s.id)) copy.delete(s.id);
                                  else copy.add(s.id);
                                  return copy;
                                });
                              }}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#c5a880] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 shrink-0" />
                              )}

                              <div className="min-w-0">
                                <div className="font-bold text-white truncate flex items-center gap-1.5">
                                  <span>{s.nome_stato}</span>
                                  {s.codice_stato && (
                                    <span className="text-[10px] text-[#c5a880] font-mono font-normal">[{s.codice_stato}]</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                                  {s.rappresentante ? (
                                    <span className="text-amber-200/90 font-medium">👤 {s.rappresentante}</span>
                                  ) : (
                                    <span className="text-slate-500 italic">Nessun rappresentante nominale</span>
                                  )}
                                  {s.ruolo && <span className="text-slate-500 truncate">• {s.ruolo}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Selettore Email per lo Stato specifico se ne ha multiple */}
                            <div className="shrink-0 flex items-center gap-2">
                              {s.emails && s.emails.length > 1 ? (
                                <select
                                  value={currentChosenEmail}
                                  onChange={(e) => setCustomEmails(prev => ({ ...prev, [s.id]: e.target.value }))}
                                  className="bg-[#050e20] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-[#c5a880] font-mono focus:outline-none"
                                >
                                  {s.emails.map((em, idx) => (
                                    <option key={idx} value={em.email}>
                                      {em.email} ({em.etichetta || (em.is_primary ? 'Prim.' : 'Uff.')})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-mono text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 truncate max-w-[200px]">
                                  {primaryEmail || 'Nessuna email'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Selezione Singolo Stato */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>Stato Destinatario *</span>
                    </label>
                    <select
                      value={composeStatoId}
                      onChange={(e) => {
                        const idVal = Number(e.target.value);
                        setComposeStatoId(idVal);
                        setPreviewSampleId(idVal);
                        const st = stati.find(s => s.id === idVal);
                        if (st && st.emails && st.emails.length > 0) {
                          const prim = st.emails.find(em => em.is_primary)?.email || st.emails[0].email;
                          setComposeDestinatarioEmail(prim);
                        } else {
                          setComposeDestinatarioEmail('');
                        }
                      }}
                      required={sendMode === 'single'}
                      className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="">-- Seleziona uno Stato dalla Rubrica --</option>
                      {stati.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codice_stato ? `[${s.codice_stato}] ` : ''}{s.nome_stato} {s.rappresentante ? `(${s.rappresentante})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selezione Email Singolo Destinatario */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>Indirizzo Email Selezionato *</span>
                    </label>
                    {(() => {
                      const selected = stati.find(s => s.id === Number(composeStatoId));
                      if (selected && selected.emails && selected.emails.length > 0) {
                        return (
                          <select
                            value={composeDestinatarioEmail}
                            onChange={(e) => setComposeDestinatarioEmail(e.target.value)}
                            required={sendMode === 'single'}
                            className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880] font-mono"
                          >
                            {selected.emails.map((em, idx) => (
                              <option key={idx} value={em.email}>
                                {em.email} ({em.etichetta || (em.is_primary ? 'Principale' : 'Ufficiale')})
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <input
                          type="email"
                          placeholder="Inserisci indirizzo email (es. ambasciata@stato.org)"
                          value={composeDestinatarioEmail}
                          onChange={(e) => setComposeDestinatarioEmail(e.target.value)}
                          required={sendMode === 'single'}
                          className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880] font-mono"
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* BARRA SEGNAPOSTO DI PERSONALIZZAZIONE DINAMICA */}
              {/* ============================================================== */}
              <div className="bg-[#050e20] border border-[#c5a880]/30 rounded-2xl p-4 space-y-2.5 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#c5a880]">
                    <Tag className="w-4 h-4" />
                    <span>Campi di Personalizzazione (Clicca per inserire nel messaggio):</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Inserisci in:</span>
                    <button
                      type="button"
                      onClick={() => setPlaceholderTarget('testo')}
                      className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                        placeholderTarget === 'testo' ? 'bg-[#c5a880] text-[#0a1c3e]' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Testo Messaggio
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaceholderTarget('oggetto')}
                      className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                        placeholderTarget === 'oggetto' ? 'bg-[#c5a880] text-[#0a1c3e]' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Oggetto
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{{nome_rappresentante}}')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#c5a880]/20 border border-slate-700 hover:border-[#c5a880] text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    title="Viene sostituito con il nome del rappresentante nominale dello Stato destinatario"
                  >
                    <Plus className="w-3 h-3 text-[#c5a880]" />
                    <span>{"{{nome_rappresentante}}"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{{nome_stato}}')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#c5a880]/20 border border-slate-700 hover:border-[#c5a880] text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    title="Viene sostituito con il nome dello Stato destinatario"
                  >
                    <Plus className="w-3 h-3 text-[#c5a880]" />
                    <span>{"{{nome_stato}}"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{{email}}')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#c5a880]/20 border border-slate-700 hover:border-[#c5a880] text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    title="Viene sostituito con l'indirizzo email del destinatario selezionato"
                  >
                    <Plus className="w-3 h-3 text-[#c5a880]" />
                    <span>{"{{email}}"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{{ruolo}}')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#c5a880]/20 border border-slate-700 hover:border-[#c5a880] text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    title="Viene sostituito con il ruolo o l'ufficio di rappresentanza dello Stato"
                  >
                    <Plus className="w-3 h-3 text-[#c5a880]" />
                    <span>{"{{ruolo}}"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  I tag tra doppie parentesi graffe verranno valorizzati singolarmente per ogni Stato prima della spedizione, garantendo una comunicazione diplomatica personalizzata.
                </p>
              </div>

              {/* ============================================================== */}
              {/* TRADUZIONE DIPLOMATICA AUTOMATICA IN INGLESE & BILINGUE */}
              {/* ============================================================== */}
              <div className="bg-[#050e20] border border-blue-500/30 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Languages className="w-4 h-4 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Traduzione Diplomatica in Inglese</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono">
                          Istituzionale
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">I testi in Italiano vengono tradotti in elegante inglese diplomatico mantenendo integri i segnaposto</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTranslateNow}
                    disabled={isTranslating}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Traduzione in corso...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Traduci Ora in Inglese</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Selezione modalità lingua */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    languageMode === 'inglese' 
                      ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-sm' 
                      : 'bg-[#071630] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="langMode"
                      checked={languageMode === 'inglese'}
                      onChange={() => setLanguageMode('inglese')}
                      className="text-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-white">Solo Inglese</div>
                      <div className="text-[10px] text-slate-400">Tradotto automaticamente prima dell'invio</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    languageMode === 'bilingue' 
                      ? 'bg-amber-950/40 border-[#c5a880] text-amber-200 shadow-sm' 
                      : 'bg-[#071630] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="langMode"
                      checked={languageMode === 'bilingue'}
                      onChange={() => setLanguageMode('bilingue')}
                      className="text-[#c5a880] cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-white">Bilingue (EN + IT)</div>
                      <div className="text-[10px] text-slate-400">Inglese in primo piano + Italiano in calce</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    languageMode === 'italiano' 
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm' 
                      : 'bg-[#071630] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="langMode"
                      checked={languageMode === 'italiano'}
                      onChange={() => setLanguageMode('italiano')}
                      className="text-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-white">Solo Italiano</div>
                      <div className="text-[10px] text-slate-400">Invia il testo originale scritto</div>
                    </div>
                  </label>
                </div>

                {/* Cassetto Revisione Bozza Tradotta */}
                {showBilingualDrawer && translatedText && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 bg-[#030914] p-4 rounded-xl border border-blue-500/20 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Bozza Tradotta in Inglese (Puoi revisionarla o modificarla direttamente):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBilingualDrawer(false)}
                        className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                      >
                        Nascondi box
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oggetto Tradotto:</label>
                      <input
                        type="text"
                        value={translatedSubject}
                        onChange={(e) => setTranslatedSubject(e.target.value)}
                        className="w-full bg-[#050e20] border border-blue-500/40 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corpo del Messaggio Tradotto:</label>
                      <textarea
                        rows={6}
                        value={translatedText}
                        onChange={(e) => setTranslatedText(e.target.value)}
                        className="w-full bg-[#050e20] border border-blue-500/40 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-400 resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* OGGETTO E FIRMA */}
              {/* ============================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>Oggetto del Messaggio (Italiano) *</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => insertPlaceholder('{{nome_stato}}', 'oggetto')}
                      className="text-[10px] text-amber-300/80 hover:text-amber-300 font-mono cursor-pointer"
                    >
                      + {"{{nome_stato}}"}
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Invito Ufficiale al Tavolo di Dialogo Sovrano per {{nome_stato}}"
                    value={composeOggetto}
                    onChange={(e) => setComposeOggetto(e.target.value)}
                    required
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Nome di chi Firma *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome e cognome firmatario"
                    value={composeFirma}
                    onChange={(e) => setComposeFirma(e.target.value)}
                    required
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* ============================================================== */}
              {/* CORPO DEL MESSAGGIO */}
              {/* ============================================================== */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Testo della Comunicazione (Italiano) *</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Puoi inserire i tag come {"{{nome_rappresentante}}"} o {"{{nome_stato}}"}</span>
                </label>
                <textarea
                  rows={9}
                  placeholder="Egregio {{nome_rappresentante}}, con la presente comunichiamo a {{nome_stato}} che la Vostra casella istituzionale {{email}} è registrata..."
                  value={composeTesto}
                  onChange={(e) => setComposeTesto(e.target.value)}
                  required
                  className="w-full bg-[#050e20] border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-[#c5a880] leading-relaxed resize-y font-sans"
                />
              </div>

              {/* ============================================================== */}
              {/* ALLEGATI MULTIPLI */}
              {/* ============================================================== */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Allegati Multipli ({composeAllegati.length})</span>
                  </label>
                  <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-[#c5a880]/50 transition cursor-pointer flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Carica Documenti / File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {composeAllegati.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {composeAllegati.map((att, idx) => (
                      <div
                        key={idx}
                        className="bg-[#050e20] border border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-mono text-slate-200 truncate text-[11px]">{att.filename}</p>
                            <p className="text-[10px] text-slate-500">{Math.round(att.size / 1024)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Rimuovi allegato"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* SIMULATORE CAMPIONE ANTEPRIMA & BOTTONI INVIO */}
              {/* ============================================================== */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                
                {/* Selettore Stato Campione per l'anteprima */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Anteprima simulata su:</span>
                  <select
                    value={previewSampleId}
                    onChange={(e) => setPreviewSampleId(Number(e.target.value))}
                    className="bg-[#050e20] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    {stati.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome_stato} {s.rappresentante ? `(${s.rappresentante})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Anteprima Template</span>
                  </button>
                </div>

                {/* Bottone di Spedizione Effettiva */}
                <button
                  type="submit"
                  disabled={isSendingEmail || (sendMode === 'multi' && selectedRecipientIds.size === 0)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#e4cbab] text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:brightness-105 transition shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{sendMode === 'multi' ? 'Spedizione Massiva in corso...' : 'Invio in corso (SMTP)...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {sendMode === 'multi' 
                          ? `Invia a ${selectedRecipientIds.size} Stati Selezionati (SMTP)` 
                          : 'Invia Email Istituzionale & Archivia'}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODALE: ANTEPRIMA TEMPLATE ISTITUZIONALE */}
      {/* ============================================================== */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071630] border border-[#c5a880]/40 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#c5a880]" />
                <h3 className="font-bold text-sm text-white">Anteprima Template HTML Istituzionale NWS</h3>
              </div>

              {/* Selettore Stato Campione dentro la modale anteprima */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Simula per:</span>
                <select
                  value={previewSampleId}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    setPreviewSampleId(newId);
                    setComposeStatoId(newId);
                  }}
                  className="bg-[#050e20] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                >
                  {stati.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome_stato} ({s.rappresentante || 'Eccellenza'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#c5a880] cursor-pointer"
                  title="Aggiorna anteprima"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#c5a880]" />
                  <span className="text-xs">Generazione anteprima template in corso...</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-300">
                  <iframe
                    srcDoc={previewHtml}
                    title="Anteprima Email"
                    className="w-full h-[550px] border-0"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Chiudi Anteprima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALE: AVANZAMENTO INVIO MULTIPLO (BATCH PROGRESS) */}
      {/* ============================================================== */}
      {batchProgress && batchProgress.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071630] border border-[#c5a880]/40 rounded-3xl max-w-xl w-full flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {batchProgress.status === 'in_progress' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#c5a880]" />
                ) : batchProgress.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <h3 className="font-bold text-sm text-white">
                  {batchProgress.status === 'in_progress' 
                    ? 'Spedizione Massiva in Corso...' 
                    : batchProgress.status === 'success' 
                      ? 'Invio Multiplo Completato con Successo!' 
                      : 'Spedizione Multipla Terminata con Segnalazioni'}
                </h3>
              </div>
              {batchProgress.status !== 'in_progress' && (
                <button
                  onClick={() => setBatchProgress(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Barra di Avanzamento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {batchProgress.status === 'in_progress'
                      ? `Elaborazione: ${batchProgress.current} di ${batchProgress.total} Stati`
                      : `Riepilogo: ${batchProgress.sentCount} inviati con successo, ${batchProgress.failedCount} falliti su ${batchProgress.total} totali`}
                  </span>
                  <span className="font-mono font-bold text-[#c5a880]">
                    {batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%
                  </span>
                </div>

                <div className="w-full bg-[#050e20] rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      batchProgress.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-[#c5a880] to-emerald-400'
                    }`}
                    style={{
                      width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Log dettaglio invii per ogni Stato */}
              <div className="bg-[#050e20] border border-slate-800 rounded-xl p-3 max-h-60 overflow-y-auto space-y-1.5 text-xs font-mono">
                {batchProgress.logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-4 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#c5a880]" />
                    <span>Inizializzazione sessione di invio SMTP diplomatico...</span>
                  </div>
                ) : (
                  batchProgress.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg flex items-center justify-between gap-2 ${
                        log.success ? 'text-emerald-300 bg-emerald-950/20 border border-emerald-500/20' : 'text-red-300 bg-red-950/20 border border-red-500/20'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0">{log.success ? '✓' : '✗'}</span>
                        <span className="font-bold truncate text-white">{log.name}:</span>
                        <span className="text-slate-400 truncate text-[11px]">{log.email}</span>
                      </div>
                      <span className="text-[10px] shrink-0 font-sans font-bold">
                        {log.success ? 'Inviato' : (log.error || 'Errore')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setBatchProgress(null);
                  if (batchProgress.status === 'success') {
                    setCurrentView('rubrica');
                  }
                }}
                disabled={batchProgress.status === 'in_progress'}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {batchProgress.status === 'in_progress' ? 'Invio in corso...' : 'Chiudi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALE: AGGIUNGI / MODIFICA STATO CON EMAIL MULTIPLE */}
      {/* ============================================================== */}
      {isStatoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#071630] border border-[#c5a880]/40 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#c5a880]" />
                <h3 className="font-bold text-sm text-white">
                  {editingStato?.id ? 'Modifica Stato Diplomatico' : 'Aggiungi Nuovo Stato alla Rubrica'}
                </h3>
              </div>
              <button
                onClick={() => setIsStatoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStato} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nome dello Stato *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Repubblica Federale di Germania"
                    value={editingStato?.nome_stato || ''}
                    onChange={(e) => setEditingStato(prev => ({ ...prev, nome_stato: e.target.value }))}
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Codice ISO</label>
                  <input
                    type="text"
                    placeholder="DE"
                    maxLength={10}
                    value={editingStato?.codice_stato || ''}
                    onChange={(e) => setEditingStato(prev => ({ ...prev, codice_stato: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880] uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Rappresentante / Delegato</label>
                  <input
                    type="text"
                    placeholder="Es. Dott. Thomas Müller"
                    value={editingStato?.rappresentante || ''}
                    onChange={(e) => setEditingStato(prev => ({ ...prev, rappresentante: e.target.value }))}
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Ruolo Diplomatico</label>
                  <input
                    type="text"
                    placeholder="Es. Ambasciatore Straordinario"
                    value={editingStato?.ruolo || ''}
                    onChange={(e) => setEditingStato(prev => ({ ...prev, ruolo: e.target.value }))}
                    className="w-full bg-[#050e20] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Note Istituzionali</label>
                <textarea
                  rows={2}
                  placeholder="Informazioni o accordi preliminari con questo Stato..."
                  value={editingStato?.note || ''}
                  onChange={(e) => setEditingStato(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full bg-[#050e20] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* Indirizzi Email Multipli (Relazione 1 a Molti) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Indirizzi Email Associati (1 a Molti) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStateFormEmails(prev => [...prev, { email: '', etichetta: 'Consolato', is_primary: false }])}
                    className="text-[11px] text-[#c5a880] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Aggiungi Altra Email</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stateFormEmails.map((em, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#050e20] p-2 rounded-xl border border-slate-800">
                      <input
                        type="email"
                        placeholder="email@stato.org"
                        required
                        value={em.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateFormEmails(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                        }}
                        className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Etichetta (es. Ambasciata)"
                        value={em.etichetta}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateFormEmails(prev => prev.map((item, i) => i === idx ? { ...item, etichetta: val } : item));
                        }}
                        className="w-28 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                      />
                      <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="primary_email"
                          checked={em.is_primary}
                          onChange={() => {
                            setStateFormEmails(prev => prev.map((item, i) => ({ ...item, is_primary: i === idx })));
                          }}
                        />
                        <span>Primaria</span>
                      </label>
                      {stateFormEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setStateFormEmails(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStatoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingStato}
                  className="px-5 py-2 rounded-xl bg-[#c5a880] text-[#0a1c3e] text-xs font-bold hover:bg-[#e4cbab] transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingStato ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvataggio...</span>
                    </>
                  ) : (
                    <span>Salva Stato & Email</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
