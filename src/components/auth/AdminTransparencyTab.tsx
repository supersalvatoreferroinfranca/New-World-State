import React, { useState, useEffect, useRef } from 'react';
import { 
  getFinancialDocuments, 
  fetchFinancialDocumentsFromServer,
  addFinancialDocument, 
  updateFinancialDocument, 
  deleteFinancialDocument, 
  downloadFinancialDocument, 
  FinancialDocument, 
  getCategoryLabel 
} from '../../services/transparencyService';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  PieChart, 
  Receipt, 
  Plus, 
  Check, 
  Search, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  FileCheck,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminTransparencyTab() {
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<FinancialDocument | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<FinancialDocument['category']>('bank_statement');
  const [formPeriod, setFormPeriod] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    setLoading(true);
    const docs = getFinancialDocuments();
    setDocuments(docs);
    setLoading(false);
    fetchFinancialDocumentsFromServer().then(serverDocs => {
      if (Array.isArray(serverDocs) && serverDocs.length > 0) {
        setDocuments(serverDocs);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadDocs();
    const handleUpdate = () => loadDocs();
    window.addEventListener('nws_transparency_updated', handleUpdate);
    return () => window.removeEventListener('nws_transparency_updated', handleUpdate);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support PDF and standard document formats
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf') && !file.type.includes('document')) {
      setFeedbackMessage({ type: 'error', text: 'Seleziona preferibilmente un file in formato PDF.' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);

    // Auto-fill title if empty
    if (!formTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setFormTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
      if (!formTitle) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Inserisci un titolo per il documento.' });
      return;
    }

    const fileSizeStr = selectedFile ? formatFileSize(selectedFile.size) : 'PDF Ufficiale (350 KB)';
    const fileNameStr = selectedFile ? selectedFile.name : `${formTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    addFinancialDocument({
      title: formTitle.trim(),
      category: formCategory,
      period: formPeriod.trim() || `Esercizio ${formYear}`,
      year: Number(formYear) || new Date().getFullYear(),
      fileName: fileNameStr,
      fileSize: fileSizeStr,
      fileData: fileBase64,
      totalAmount: formTotalAmount.trim(),
      notes: formNotes.trim(),
      published: formPublished
    });

    setFeedbackMessage({ type: 'success', text: 'Documento di trasparenza caricato e registrato con successo!' });
    // Reset form
    setFormTitle('');
    setFormPeriod('');
    setFormTotalAmount('');
    setFormNotes('');
    setSelectedFile(null);
    setFileBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploadOpen(false);
    loadDocs();
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare "${title}" dall'archivio trasparenza?`)) {
      deleteFinancialDocument(id);
      loadDocs();
      setFeedbackMessage({ type: 'success', text: 'Documento rimosso correttamente.' });
    }
  };

  const handleTogglePublish = (doc: FinancialDocument) => {
    const nextState = !doc.published;
    const success = updateFinancialDocument(doc.id, { published: nextState });
    if (success) {
      loadDocs();
      setFeedbackMessage({ 
        type: 'success', 
        text: nextState 
          ? `✓ Documento "${doc.title}" reso PUBBLICO e visibile a tutti gli iscritti nella pagina Chi Siamo.` 
          : `✓ Documento "${doc.title}" impostato come BOZZA / NASCOSTO al pubblico.` 
      });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    updateFinancialDocument(editingDoc.id, {
      title: editingDoc.title,
      category: editingDoc.category,
      period: editingDoc.period,
      year: Number(editingDoc.year) || new Date().getFullYear(),
      totalAmount: editingDoc.totalAmount,
      notes: editingDoc.notes,
      published: editingDoc.published
    });

    setFeedbackMessage({ type: 'success', text: `Modifiche salvate per "${editingDoc.title}".` });
    setEditingDoc(null);
    loadDocs();
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesVis = visibilityFilter === 'all' || 
                       (visibilityFilter === 'published' && doc.published) || 
                       (visibilityFilter === 'draft' && !doc.published);
    return matchesSearch && matchesCat && matchesVis;
  });

  const getCategoryIcon = (category: FinancialDocument['category']) => {
    switch (category) {
      case 'bank_statement':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'expense_report':
        return <PieChart className="w-4 h-4 text-amber-600" />;
      case 'balance_sheet':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'receipt_invoice':
        return <Receipt className="w-4 h-4 text-purple-600" />;
    }
  };

  const totalCount = documents.length;
  const publishedCount = documents.filter(d => d.published).length;
  const draftCount = documents.filter(d => !d.published).length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800" id="admin-transparency-tab">
      
      {/* HEADER SECTION & QUICK STATS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-gold text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Trasparenza & Bilancio Civico
            </div>
            <h3 className="text-xl font-serif font-bold text-[#0a1c3e] mt-1">
              Gestione Estratti Conto & Rendiconti Spese
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Carica e gestisci i PDF degli estratti conto bancari (IBAN IT70F0326816900052535344000), bilanci e rendiconti analitici di spesa per garantire la massima trasparenza a tutti i cittadini e iscritti.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            id="btn-open-upload-transparency"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer shrink-0 border-b-2 border-brand-gold"
          >
            {isUploadOpen ? (
              <span>Chiudi Pannello</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Carica Nuovo PDF</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Quick Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div 
            onClick={() => setVisibilityFilter('all')}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              visibilityFilter === 'all' ? 'bg-[#0a1c3e]/5 border-[#0a1c3e]' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Documenti Totali</p>
              <p className="text-xl font-bold font-mono text-[#0a1c3e]">{totalCount}</p>
            </div>
            <FileText className="w-6 h-6 text-slate-400" />
          </div>

          <div 
            onClick={() => setVisibilityFilter('published')}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              visibilityFilter === 'published' ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200/80 hover:bg-emerald-50/50'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Pubblicati (Visibili agli iscritti)</p>
              <p className="text-xl font-bold font-mono text-emerald-600">{publishedCount}</p>
            </div>
            <Eye className="w-6 h-6 text-emerald-500" />
          </div>

          <div 
            onClick={() => setVisibilityFilter('draft')}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              visibilityFilter === 'draft' ? 'bg-amber-50 border-amber-500' : 'bg-slate-50 border-slate-200/80 hover:bg-amber-50/50'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Nascosti (Bozze interne)</p>
              <p className="text-xl font-bold font-mono text-amber-600">{draftCount}</p>
            </div>
            <EyeOff className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border shadow-xs animate-fade-in ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer text-base px-2">×</button>
        </div>
      )}

      {/* UPLOAD FORM PANEL */}
      {isUploadOpen && (
        <div className="bg-slate-50 border-2 border-dashed border-brand-gold/50 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-gold" />
              <h4 className="font-serif font-bold text-base text-[#0a1c3e]">
                Carica Nuovo Documento Finanziario di Trasparenza
              </h4>
            </div>
            <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Titolo */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Titolo Ufficiale Documento *
                </label>
                <input 
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Es. Estratto Conto Bancario - I Trimestre 2026 oppure Rendiconto Spese Server"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e] focus:ring-1 focus:ring-[#0a1c3e]"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Tipologia di Documento *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e] focus:ring-1 focus:ring-[#0a1c3e]"
                >
                  <option value="bank_statement">Estratto Conto Bancario (IBAN Ufficiale)</option>
                  <option value="expense_report">Rendiconto Spese & Uscite</option>
                  <option value="balance_sheet">Bilancio Consuntivo / Preventivo</option>
                  <option value="receipt_invoice">Giustificativo / Fatture & Ricevute</option>
                </select>
              </div>

              {/* Periodo di Riferimento */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Periodo di Riferimento (Trimestre / Mese / Anno)
                </label>
                <input 
                  type="text"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  placeholder="Es. I Trimestre 2026, Anno 2025, Gennaio 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              {/* Anno */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Anno Fiscale
                </label>
                <input 
                  type="number"
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  min={2014}
                  max={2030}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              {/* Saldo o Totale Spese */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Importo / Saldo Rendicontato (Opzionale)
                </label>
                <input 
                  type="text"
                  value={formTotalAmount}
                  onChange={(e) => setFormTotalAmount(e.target.value)}
                  placeholder="Es. Totale Spese: € 4.520,00 oppure Saldo: € 28.450,00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              {/* File PDF Uploader (Drag & Drop) */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  File PDF Allegato
                </label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-gold bg-white p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-gold transition" />
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-[#0a1c3e]">Clicca per sfogliare</span> oppure trascina qui il file PDF dell'estratto conto o giustificativo
                  </div>
                  <p className="text-[10px] text-slate-400">Supporta file PDF, max 25 MB</p>

                  {selectedFile && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                    </div>
                  )}

                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Note e descrizione come vengono spesi i soldi */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Relazione & Dettaglio di come sono stati impiegati i fondi *
                </label>
                <textarea 
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Descrivi in modo trasparente l'allocazione delle risorse: es. Mantenimento server Cloud Run, rinnovo domini di stato, supporto legale o missioni civiche..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              {/* Visibilità */}
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0a1c3e] focus:ring-0 cursor-pointer"
                  />
                  <span>Pubblica immediatamente nella sezione Download della pagina "Chi Siamo"</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition shadow-md cursor-pointer border-b-2 border-brand-gold"
              >
                Salva & Pubblica Documento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca estratti conto o spese..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#0a1c3e]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Categoria:</span>
          {[
            { id: 'all', label: 'Tutti' },
            { id: 'bank_statement', label: 'Estratti Conto' },
            { id: 'expense_report', label: 'Rendiconti' },
            { id: 'balance_sheet', label: 'Bilanci' },
            { id: 'receipt_invoice', label: 'Giustificativi' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                categoryFilter === f.id 
                  ? 'bg-[#0a1c3e] text-white font-bold' 
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENTS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-serif font-bold text-slate-700">Nessun documento finanziario trovato</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nessun documento corrisponde ai filtri selezionati. Clicca su "Carica Nuovo PDF" per pubblicare un nuovo estratto conto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Documento & Categoria</th>
                  <th className="py-3.5 px-4 font-bold">Periodo & Anno</th>
                  <th className="py-3.5 px-4 font-bold">Importo / Saldo</th>
                  <th className="py-3.5 px-4 font-bold">Stato Visibilità (Clicca per modificare)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 mt-0.5 shrink-0">
                          {getCategoryIcon(doc.category)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-[#0a1c3e]">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700">
                              {getCategoryLabel(doc.category, 'it')}
                            </span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadDate).toLocaleDateString('it-IT')}</span>
                          </div>
                          {doc.notes && (
                            <p className="text-xs text-slate-500 line-clamp-2 pt-0.5 max-w-xl italic">
                              "{doc.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <span className="font-semibold text-slate-800 block">{doc.period}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Anno {doc.year}</span>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-amber-50/80 border border-amber-200/60 px-2 py-1 rounded inline-block">
                        {doc.totalAmount || '—'}
                      </span>
                    </td>

                    {/* ENHANCED VISIBILITY TOGGLE BUTTON */}
                    <td className="py-4 px-4 align-top">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(doc)}
                        title={doc.published ? "Clicca per nascondere questo documento (rendere bozza)" : "Clicca per pubblicare questo documento su Chi Siamo"}
                        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer border ${
                          doc.published 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {doc.published ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Visibile agli iscritti</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>Nascosto (Bozza)</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 align-top text-right space-x-1.5 shrink-0">
                      {/* Edit button */}
                      <button
                        onClick={() => setEditingDoc({ ...doc })}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-[#0a1c3e] text-slate-700 hover:text-white transition cursor-pointer"
                        title="Modifica dettagli documento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Download PDF button */}
                      <button
                        onClick={() => downloadFinancialDocument(doc)}
                        className="inline-flex items-center gap-1 p-2 rounded-lg bg-slate-100 hover:bg-brand-gold text-slate-700 hover:text-[#0a1c3e] transition cursor-pointer"
                        title="Scarica / Visualizza PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition cursor-pointer"
                        title="Elimina Documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-gold" />
                <h4 className="font-serif font-bold text-lg text-[#0a1c3e]">
                  Modifica Documento Finanziario
                </h4>
              </div>
              <button 
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Titolo *
                </label>
                <input 
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Categoria
                  </label>
                  <select
                    value={editingDoc.category}
                    onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                  >
                    <option value="bank_statement">Estratto Conto Bancario</option>
                    <option value="expense_report">Rendiconto Spese</option>
                    <option value="balance_sheet">Bilancio Consuntivo</option>
                    <option value="receipt_invoice">Giustificativo / Ricevuta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Periodo di Riferimento
                  </label>
                  <input 
                    type="text"
                    value={editingDoc.period}
                    onChange={(e) => setEditingDoc({ ...editingDoc, period: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Anno
                  </label>
                  <input 
                    type="number"
                    value={editingDoc.year}
                    onChange={(e) => setEditingDoc({ ...editingDoc, year: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Importo / Saldo
                  </label>
                  <input 
                    type="text"
                    value={editingDoc.totalAmount || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, totalAmount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Relazione & Note
                </label>
                <textarea 
                  rows={3}
                  value={editingDoc.notes}
                  onChange={(e) => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0a1c3e]"
                />
              </div>

              {/* Visibility Switch */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0a1c3e]">Stato Visibilità Pubblica</p>
                  <p className="text-[11px] text-slate-500">Se abilitato, appare nella pagina Chi Siamo per tutti gli iscritti</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDoc({ ...editingDoc, published: !editingDoc.published })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    editingDoc.published 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {editingDoc.published ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Visibile</span>
                    </>
                  ) : (
                    <span>Nascosto (Bozza)</span>
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition shadow-md cursor-pointer border-b-2 border-brand-gold"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

