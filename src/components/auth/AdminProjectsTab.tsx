import React, { useState, useEffect, useRef } from 'react';
import { 
  getProjects, 
  fetchProjectsFromServer, 
  addProject, 
  updateProject, 
  deleteProject, 
  addStatementToProject, 
  deleteStatementFromProject, 
  addDonationRecord, 
  downloadProjectStatement, 
  CommunityProject, 
  StatementReport, 
  ProjectDonor, 
  ProjectCategory, 
  ProjectStatus, 
  getCategoryLabel, 
  getStatusLabel 
} from '../../services/projectsService';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Receipt, 
  Heart, 
  Droplets, 
  Search, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Check, 
  X, 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Eye, 
  EyeOff, 
  MapPin, 
  Copy, 
  RotateCw,
  Landmark
} from 'lucide-react';

export default function AdminProjectsTab() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CommunityProject | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [activeProjectForStatements, setActiveProjectForStatements] = useState<CommunityProject | null>(null);

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [activeProjectForDonations, setActiveProjectForDonations] = useState<CommunityProject | null>(null);

  // Form Project State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('water_wells');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [detailedPlan, setDetailedPlan] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('10000');
  const [raisedAmount, setRaisedAmount] = useState<string>('0');
  const [beneficiariesCount, setBeneficiariesCount] = useState<string>('1000');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [coverImage, setCoverImage] = useState('');
  const [accountHolder, setAccountHolder] = useState('New World State Organization');
  const [iban, setIban] = useState('IT70F0326816900052535344000');
  const [bic, setBic] = useState('BCITITMM');
  const [bankName, setBankName] = useState('Banca Etica / Credito Cooperativo');
  const [transferReason, setTransferReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [published, setPublished] = useState(true);

  // Statement Form State
  const [statementTitle, setStatementTitle] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementAmount, setStatementAmount] = useState('');
  const [statementType, setStatementType] = useState<StatementReport['type']>('statement_in');
  const [statementNotes, setStatementNotes] = useState('');
  const [statementFileName, setStatementFileName] = useState('');
  const [statementFileData, setStatementFileData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Donation Form State
  const [donorName, setDonorName] = useState('');
  const [donorAmount, setDonorAmount] = useState('');
  const [donorDate, setDonorDate] = useState(new Date().toISOString().split('T')[0]);
  const [donorRef, setDonorRef] = useState('');
  const [donorNote, setDonorNote] = useState('');
  const [donorVerified, setDonorVerified] = useState(true);

  const loadData = () => {
    setLoading(true);
    const local = getProjects();
    setProjects(local);
    setLoading(false);

    fetchProjectsFromServer().then(serverProjects => {
      if (Array.isArray(serverProjects) && serverProjects.length > 0) {
        setProjects(serverProjects);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nws_projects_updated', handleUpdate);
    return () => window.removeEventListener('nws_projects_updated', handleUpdate);
  }, []);

  const openNewProjectModal = () => {
    setEditingProject(null);
    setTitle('');
    setSubtitle('');
    setCategory('water_wells');
    setLocation('');
    setDescription('');
    setDetailedPlan('');
    setImpactSummary('');
    setTargetAmount('12000');
    setRaisedAmount('0');
    setBeneficiariesCount('1500');
    setStatus('active');
    setCoverImage('https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80');
    setAccountHolder('New World State Organization');
    setIban('IT70F0326816900052535344000');
    setBic('BCITITMM');
    setBankName('Banca Etica / Credito Cooperativo');
    setTransferReason('DONAZIONE-NWS-POZZI-AFRICA');
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpectedCompletionDate('');
    setPublished(true);
    setIsEditModalOpen(true);
  };

  const openEditProjectModal = (p: CommunityProject) => {
    setEditingProject(p);
    setTitle(p.title);
    setSubtitle(p.subtitle || '');
    setCategory(p.category);
    setLocation(p.location);
    setDescription(p.description);
    setDetailedPlan(p.detailedPlan || '');
    setImpactSummary(p.impactSummary || '');
    setTargetAmount(String(p.targetAmount));
    setRaisedAmount(String(p.raisedAmount));
    setBeneficiariesCount(String(p.beneficiariesCount || 0));
    setStatus(p.status);
    setCoverImage(p.coverImage || '');
    setAccountHolder(p.bankDetails?.accountHolder || 'New World State Organization');
    setIban(p.bankDetails?.iban || 'IT70F0326816900052535344000');
    setBic(p.bankDetails?.bic || 'BCITITMM');
    setBankName(p.bankDetails?.bankName || 'Banca Etica / Credito Cooperativo');
    setTransferReason(p.bankDetails?.transferReason || `DONAZIONE-NWS-${p.id.toUpperCase()}`);
    setStartDate(p.startDate || new Date().toISOString().split('T')[0]);
    setExpectedCompletionDate(p.expectedCompletionDate || '');
    setPublished(p.published);
    setIsEditModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Titolo e Ubicazione sono campi obbligatori.' });
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      detailedPlan: detailedPlan.trim(),
      impactSummary: impactSummary.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      raisedAmount: parseFloat(raisedAmount) || 0,
      beneficiariesCount: parseInt(beneficiariesCount, 10) || 0,
      status,
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80',
      bankDetails: {
        accountHolder: accountHolder.trim() || 'New World State Organization',
        iban: iban.trim() || 'IT70F0326816900052535344000',
        bic: bic.trim() || 'BCITITMM',
        bankName: bankName.trim() || 'Banca Etica / Credito Cooperativo',
        transferReason: transferReason.trim() || `DONAZIONE-NWS-OPERA`
      },
      startDate,
      expectedCompletionDate: expectedCompletionDate || undefined,
      published
    };

    if (editingProject) {
      await updateProject(editingProject.id, payload);
      setFeedbackMessage({ type: 'success', text: 'Progetto aggiornato con successo!' });
    } else {
      await addProject(payload);
      setFeedbackMessage({ type: 'success', text: 'Nuovo progetto comunitario creato con successo!' });
    }

    setIsEditModalOpen(false);
    loadData();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare irrevocabilmente il progetto "${name}" e tutti i suoi documenti contabili?`)) {
      return;
    }
    await deleteProject(id);
    setFeedbackMessage({ type: 'success', text: 'Progetto eliminato dal registro.' });
    loadData();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleTogglePublish = async (p: CommunityProject) => {
    await updateProject(p.id, { published: !p.published });
    loadData();
  };

  // Statement Upload & Management
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatementFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setStatementFileData(result);
    };
    reader.readAsDataURL(file);

    if (!statementTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setStatementTitle(`Estratto Conto: ${cleanName}`);
    }
  };

  const handleSaveStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForStatements) return;

    if (!statementTitle.trim() || !statementAmount.trim()) {
      alert('Titolo e Importo sono obbligatori.');
      return;
    }

    await addStatementToProject(activeProjectForStatements.id, {
      title: statementTitle.trim(),
      date: statementDate,
      amount: statementAmount.trim(),
      type: statementType,
      fileName: statementFileName || `${statementTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: statementFileData ? `${Math.round(statementFileData.length * 0.75 / 1024)} KB` : 'PDF Ufficiale',
      fileData: statementFileData || undefined,
      notes: statementNotes.trim()
    });

    // Reset statement form
    setStatementTitle('');
    setStatementAmount('');
    setStatementNotes('');
    setStatementFileName('');
    setStatementFileData('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Reload active project
    const updated = getProjects().find(p => p.id === activeProjectForStatements.id);
    if (updated) setActiveProjectForStatements(updated);
    loadData();
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (!activeProjectForStatements) return;
    if (!window.confirm('Eliminare questo documento contabile dal progetto?')) return;

    await deleteStatementFromProject(activeProjectForStatements.id, statementId);
    const updated = getProjects().find(p => p.id === activeProjectForStatements.id);
    if (updated) setActiveProjectForStatements(updated);
    loadData();
  };

  // Add Verified Donor Record
  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForDonations) return;

    const parsed = parseFloat(donorAmount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Inserisci un importo valido.');
      return;
    }

    await addDonationRecord(activeProjectForDonations.id, {
      donorName: donorName.trim() || 'Anonimo Sostenitore',
      amount: parsed,
      date: donorDate,
      transferReference: donorRef.trim() || undefined,
      publicNote: donorNote.trim() || undefined,
      verifiedOnStatement: donorVerified
    });

    setDonorName('');
    setDonorAmount('');
    setDonorRef('');
    setDonorNote('');

    const updated = getProjects().find(p => p.id === activeProjectForDonations.id);
    if (updated) setActiveProjectForDonations(updated);
    loadData();
  };

  // Filtering
  const filteredProjects = projects.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bankDetails?.transferReason || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalRaisedAll = projects.reduce((acc, p) => acc + (p.raisedAmount || 0), 0);
  const totalStatementsAll = projects.reduce((acc, p) => acc + (p.statementReports?.length || 0), 0);
  const totalDonorsAll = projects.reduce((acc, p) => acc + (p.donorLedger?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" id="admin-projects-tab">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0a1c3e] to-[#0e2754] text-white p-6 md:p-8 rounded-2xl border border-brand-gold/30 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-gold text-xs font-mono font-bold uppercase tracking-wider">
              <Droplets className="w-4 h-4" /> Gestione Opere Comunitarie & Raccolte Fondi
            </div>
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
              Progetti Umanitari & Rendicontazione Bancaria
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Crea progetti per il bene della comunità (es. pozzi d'acqua in Africa, cliniche e scuole), gestisci le coordinate bancarie per le donazioni e pubblica gli estratti conto per una rendicontazione trasparente al 100%.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Ricarica elenco"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openNewProjectModal}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-[#d8bd94] text-[#0a1c3e] font-mono font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Progetto Umanitario</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedbackMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* METRICHE CHIAVE BACKEND */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Opere nel Registro</span>
          <div className="text-xl font-bold font-serif text-[#0a1c3e]">{projects.length}</div>
          <span className="text-[10px] text-slate-400">{projects.filter(p => p.published).length} visibili online</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Fondi Totali Raccolti</span>
          <div className="text-xl font-bold font-serif text-emerald-700">€ {totalRaisedAll.toLocaleString('it-IT')}</div>
          <span className="text-[10px] text-slate-400">Tracciati su c/c associazione</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Estratti Conto Pubblicati</span>
          <div className="text-xl font-bold font-serif text-blue-700">{totalStatementsAll}</div>
          <span className="text-[10px] text-slate-400">PDF e pezze giustificative</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Donatori & Bonifici Registrati</span>
          <div className="text-xl font-bold font-serif text-amber-700">{totalDonorsAll}</div>
          <span className="text-[10px] text-slate-400">Registrati a libro contabile</span>
        </div>
      </div>

      {/* FILTRI & RICERCA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca progetto o causale..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Tutte le Categorie</option>
            <option value="water_wells">Pozzi d'Acqua</option>
            <option value="health_clinics">Salute & Cliniche</option>
            <option value="education">Istruzione & Scuole</option>
            <option value="ecology">Riforestazione</option>
            <option value="humanitarian">Soccorso Civico</option>
            <option value="civic_infrastructure">Infrastrutture</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Tutti gli Stati</option>
            <option value="active">Attivo</option>
            <option value="funded">Finanziato</option>
            <option value="in_progress">In Esecuzione</option>
            <option value="completed">Completato</option>
          </select>
        </div>
      </div>

      {/* LISTA PROGETTI */}
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filteredProjects.map((p) => {
          const catInfo = getCategoryLabel(p.category);
          const statusInfo = getStatusLabel(p.status);
          const percent = Math.min(100, Math.round((p.raisedAmount / p.targetAmount) * 100));

          return (
            <div key={p.id} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:bg-slate-50/60 transition">
              
              {/* Left Column: Image & Details */}
              <div className="flex items-start gap-4">
                <img 
                  src={p.coverImage} 
                  alt={p.title} 
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    {!p.published && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-100 text-rose-800 font-bold">
                        Bozza (Nascosto)
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#0a1c3e]">
                    {p.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.location}
                    </span>
                    <span className="font-bold text-[#0a1c3e]">
                      Causale: <code className="bg-slate-100 px-1 py-0.5 rounded">{p.bankDetails?.transferReason}</code>
                    </span>
                  </div>

                  {/* Fund progress summary */}
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-bold text-emerald-700">€ {p.raisedAmount.toLocaleString('it-IT')}</span>
                    <span className="text-slate-400">/ € {p.targetAmount.toLocaleString('it-IT')}</span>
                    <span className="text-brand-gold font-mono font-bold">({percent}%)</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{p.statementReports?.length || 0} estratti conto</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{p.donorLedger?.length || 0} donazioni</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                
                {/* Manage Statements */}
                <button
                  onClick={() => {
                    setActiveProjectForStatements(p);
                    setIsStatementModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-mono font-medium transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                  title="Gestisci estratti conto pubblicati"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estratti Conto ({p.statementReports?.length || 0})</span>
                </button>

                {/* Manage Donors */}
                <button
                  onClick={() => {
                    setActiveProjectForDonations(p);
                    setIsDonationModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-mono font-medium transition flex items-center gap-1 border border-blue-200 cursor-pointer"
                  title="Gestisci donazioni verificate"
                >
                  <Heart className="w-3.5 h-3.5 text-blue-600" />
                  <span>Donazioni ({p.donorLedger?.length || 0})</span>
                </button>

                {/* Visibility Toggle */}
                <button
                  onClick={() => handleTogglePublish(p)}
                  className={`p-2 rounded-lg transition border cursor-pointer ${p.published ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'}`}
                  title={p.published ? 'Nascondi dal pubblico' : 'Pubblica online'}
                >
                  {p.published ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditProjectModal(p)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 cursor-pointer"
                  title="Modifica progetto"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteProject(p.id, p.title)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200 cursor-pointer"
                  title="Elimina progetto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p>Nessun progetto trovato per i filtri selezionati.</p>
            <button
              onClick={openNewProjectModal}
              className="px-4 py-2 rounded-xl bg-[#0a1c3e] text-white font-mono text-xs font-bold cursor-pointer"
            >
              Crea il primo progetto comunitario
            </button>
          </div>
        )}
      </div>

      {/* MODAL CREAZIONE / MODIFICA PROGETTO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            
            <div className="p-6 bg-[#0a1c3e] text-white flex justify-between items-center rounded-t-3xl">
              <div>
                <h3 className="font-serif font-bold text-lg">
                  {editingProject ? 'Modifica Progetto Umanitario' : 'Nuovo Progetto Umanitario'}
                </h3>
                <p className="text-xs text-slate-300">
                  Definisci le specifiche dell'opera, l'obiettivo di raccolta e le coordinate di versamento.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                  Titolo Opera / Progetto*
                </label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Costruzione Pozzi d'Acqua Potabile Solari in Africa"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                />
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                  Sottotitolo / Breve Sintesi
                </label>
                <input 
                  type="text" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="es. Realizzazione pozzo artesiano a energia solare per 2.500 abitanti"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Categoria
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] cursor-pointer"
                  >
                    <option value="water_wells">Pozzi d'Acqua (Africa)</option>
                    <option value="health_clinics">Salute & Presidi Medici</option>
                    <option value="education">Istruzione & Scuole</option>
                    <option value="ecology">Riforestazione & Ambiente</option>
                    <option value="humanitarian">Soccorso Civico & Emergenze</option>
                    <option value="civic_infrastructure">Infrastrutture Comunitarie</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Ubicazione Geografica / Luogo*
                  </label>
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="es. Contea di Turkana, Kenya (Africa Orientale)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Obiettivo Fondi (€)*
                  </label>
                  <input 
                    type="number" 
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="es. 15000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Fondi Già Raccolti (€)
                  </label>
                  <input 
                    type="number" 
                    value={raisedAmount}
                    onChange={(e) => setRaisedAmount(e.target.value)}
                    placeholder="es. 5000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Beneficiari Stimati (persone)
                  </label>
                  <input 
                    type="number" 
                    value={beneficiariesCount}
                    onChange={(e) => setBeneficiariesCount(e.target.value)}
                    placeholder="es. 2500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                  Descrizione Approfondita dell'Opera
                </label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Spiega l'importanza dell'opera, chi ne beneficerà e perché è vitale..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                />
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                  Piano Tecnico / Fasi di Realizzazione
                </label>
                <textarea 
                  rows={2}
                  value={detailedPlan}
                  onChange={(e) => setDetailedPlan(e.target.value)}
                  placeholder="es. 1) Geologia; 2) Perforazione a 100m; 3) Impianto fotovoltaico e pompa..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                />
              </div>

              {/* Coordinate Bancarie & Causale */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <strong className="text-[#0a1c3e] font-mono uppercase tracking-wider block">
                  Coordinate Bancarie per il Versamento
                </strong>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Intestatario</label>
                    <input 
                      type="text" 
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Banca</label>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">IBAN</label>
                    <input 
                      type="text" 
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold text-amber-900">Causale Bonifico Obbligatoria*</label>
                    <input 
                      type="text" 
                      required
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="es. DONAZIONE-NWS-POZZO-AFRICA-01"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-amber-300 font-mono font-bold text-amber-900 bg-amber-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Immagine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Stato Avanzamento
                  </label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Raccolta Fondi Attiva</option>
                    <option value="funded">Obiettivo Raggiunto (Finanziato)</option>
                    <option value="in_progress">Opere in Esecuzione</option>
                    <option value="completed">Completato & Rendicontato</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono uppercase font-bold text-slate-700 block mb-1">
                    Immagine di Copertina (URL)
                  </label>
                  <input 
                    type="url" 
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="publishedCheck"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded text-[#0a1c3e] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="publishedCheck" className="font-mono font-medium text-slate-700 cursor-pointer">
                  Pubblica immediatamente online nella sezione pubblica Opere Comunitarie
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-mono text-xs cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#071530] text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow cursor-pointer border-b-2 border-brand-gold"
                >
                  {editingProject ? 'Salva Modifiche' : 'Crea Progetto'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIONE ESTRATTI CONTO PROGETTO */}
      {isStatementModalOpen && activeProjectForStatements && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            
            <div className="p-6 bg-[#0a1c3e] text-white flex justify-between items-center rounded-t-3xl">
              <div>
                <div className="text-[10px] font-mono text-brand-gold uppercase tracking-wider">
                  Rendicontazione Bancaria Ufficiale
                </div>
                <h3 className="font-serif font-bold text-lg">
                  Estratti Conto per: {activeProjectForStatements.title}
                </h3>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Form Nuovo Estratto Conto */}
              <form onSubmit={handleSaveStatement} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="font-mono font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-[#0a1c3e]" />
                  <span>Carica Nuovo Estratto Conto / Pezza Giustificativa</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Titolo Documento*</label>
                    <input 
                      type="text" 
                      required
                      value={statementTitle}
                      onChange={(e) => setStatementTitle(e.target.value)}
                      placeholder="es. Estratto Conto Donazioni Febbraio 2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Importo Movimentato / Saldo*</label>
                    <input 
                      type="text" 
                      required
                      value={statementAmount}
                      onChange={(e) => setStatementAmount(e.target.value)}
                      placeholder="es. + € 4.500,00 oppure - € 2.300,00"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Tipo Documento</label>
                    <select 
                      value={statementType}
                      onChange={(e) => setStatementType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white cursor-pointer"
                    >
                      <option value="statement_in">Entrata Bonifici Donazioni</option>
                      <option value="expense_out">Uscita / Fattura Lavori Opera</option>
                      <option value="audit_report">Relazione di Chiusura / Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Data Documento</label>
                    <input 
                      type="date" 
                      value={statementDate}
                      onChange={(e) => setStatementDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">File PDF Allegato</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:bg-[#0a1c3e] file:text-white cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Note Contabili Esplicative</label>
                  <textarea 
                    rows={2}
                    value={statementNotes}
                    onChange={(e) => setStatementNotes(e.target.value)}
                    placeholder="Dettaglio sui bonifici ricevuti o sulle fatture dei fornitori allegate..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow cursor-pointer"
                  >
                    Pubblica Documento Contabile
                  </button>
                </div>
              </form>

              {/* Elenco Estratti Conto Attuali */}
              <div className="space-y-3">
                <div className="font-mono font-bold uppercase text-slate-700 flex items-center justify-between">
                  <span>Documenti Contabili Pubblicati ({activeProjectForStatements.statementReports?.length || 0})</span>
                  <span className="text-[10px] text-slate-400">Tutti scaricabili dai cittadini</span>
                </div>

                {activeProjectForStatements.statementReports && activeProjectForStatements.statementReports.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    {activeProjectForStatements.statementReports.map((r) => (
                      <div key={r.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{r.title}</div>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                            <span>{new Date(r.date).toLocaleDateString('it-IT')}</span>
                            <span className="font-bold text-[#0a1c3e]">{r.amount}</span>
                            <span>• {r.fileName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadProjectStatement(activeProjectForStatements, r)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Scarica anteprima"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStatement(r.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                            title="Elimina documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nessun estratto conto ancora allegato a questo progetto.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIONE DONAZIONI E ALBO DONATORI */}
      {isDonationModalOpen && activeProjectForDonations && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            
            <div className="p-6 bg-[#0a1c3e] text-white flex justify-between items-center rounded-t-3xl">
              <div>
                <div className="text-[10px] font-mono text-brand-gold uppercase tracking-wider">
                  Libro Donazioni & Riscontri Bonifici
                </div>
                <h3 className="font-serif font-bold text-lg">
                  Donazioni per: {activeProjectForDonations.title}
                </h3>
              </div>
              <button
                onClick={() => setIsDonationModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Form Nuova Donazione Verificata */}
              <form onSubmit={handleSaveDonation} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="font-mono font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#0a1c3e]" />
                  <span>Registra Donazione Verificata da Estratto Conto</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Nome Donatore*</label>
                    <input 
                      type="text" 
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="es. Mario Rossi o Cittadino #4029"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Importo Versato (€)*</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={donorAmount}
                      onChange={(e) => setDonorAmount(e.target.value)}
                      placeholder="es. 250.00"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Data Accredito</label>
                    <input 
                      type="date" 
                      value={donorDate}
                      onChange={(e) => setDonorDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Riferimento Contabile TRN / CRO</label>
                    <input 
                      type="text" 
                      value={donorRef}
                      onChange={(e) => setDonorRef(e.target.value)}
                      placeholder="es. TRN-20260210-9941"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Dedica o Nota Pubblica</label>
                    <input 
                      type="text" 
                      value={donorNote}
                      onChange={(e) => setDonorNote(e.target.value)}
                      placeholder="es. Per i bambini e il pozzo d'acqua"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={donorVerified}
                      onChange={(e) => setDonorVerified(e.target.checked)}
                      className="rounded text-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono text-slate-700">Contrassegna come riscontrato su estratto conto bancario (aggiorna totale raccolto)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0a1c3e] hover:bg-[#071530] text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow cursor-pointer"
                  >
                    Aggiungi Donazione
                  </button>
                </div>
              </form>

              {/* Elenco Donazioni Registrate */}
              <div className="space-y-3">
                <div className="font-mono font-bold uppercase text-slate-700">
                  Donazioni Registrate ({activeProjectForDonations.donorLedger?.length || 0})
                </div>

                {activeProjectForDonations.donorLedger && activeProjectForDonations.donorLedger.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    {activeProjectForDonations.donorLedger.map((d) => (
                      <div key={d.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{d.donorName}</div>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                            <span>{new Date(d.date).toLocaleDateString('it-IT')}</span>
                            <span className="font-bold text-emerald-700">€ {d.amount.toLocaleString('it-IT')}</span>
                            {d.transferReference && <span>• Ref: {d.transferReference}</span>}
                          </div>
                          {d.publicNote && <p className="text-[11px] text-slate-400 italic">"{d.publicNote}"</p>}
                        </div>

                        <div>
                          {d.verifiedOnStatement ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verificato c/c
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Da verificare
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nessuna donazione ancora registrata nel libro contabile.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
