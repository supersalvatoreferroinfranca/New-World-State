import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  getProjects, 
  fetchProjectsFromServer, 
  CommunityProject, 
  ProjectCategory, 
  StatementReport,
  downloadProjectStatement, 
  getCategoryLabel, 
  getStatusLabel,
  submitPublicDonationPledge
} from '../../services/projectsService';
import { 
  Droplets, 
  Heart, 
  ShieldCheck, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  ArrowRight, 
  Search, 
  Building2, 
  Users, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Receipt, 
  AlertCircle, 
  Sparkles, 
  X, 
  HelpCircle,
  Clock,
  Landmark,
  Share2,
  TrendingUp,
  Award
} from 'lucide-react';

interface CommunityProjectsPageProps {
  onGoToAbout?: () => void;
  onGoToDemocracy?: () => void;
}

export default function CommunityProjectsPage({ onGoToAbout, onGoToDemocracy }: CommunityProjectsPageProps) {
  const { language, tText } = useI18n();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);

  // Copy feedback states
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedReason, setCopiedReason] = useState(false);

  // Pledge modal state
  const [showPledgeForm, setShowPledgeForm] = useState(false);
  const [pledgeDonorName, setPledgeDonorName] = useState('');
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledgeEmail, setPledgeEmail] = useState('');
  const [pledgeTransferDate, setPledgeTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [pledgeReference, setPledgeReference] = useState('');
  const [pledgeNote, setPledgeNote] = useState('');
  const [pledgeSubmitting, setPledgeSubmitting] = useState(false);
  const [pledgeFeedback, setPledgeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    const local = getProjects().filter(p => p.published);
    setProjects(local);
    setLoading(false);

    fetchProjectsFromServer().then(serverProjects => {
      if (Array.isArray(serverProjects) && serverProjects.length > 0) {
        setProjects(serverProjects.filter(p => p.published));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nws_projects_updated', handleUpdate);
    return () => window.removeEventListener('nws_projects_updated', handleUpdate);
  }, []);

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Global metrics
  const totalRaised = projects.reduce((acc, p) => acc + (p.raisedAmount || 0), 0);
  const totalTarget = projects.reduce((acc, p) => acc + (p.targetAmount || 0), 0);
  const totalBeneficiaries = projects.reduce((acc, p) => acc + (p.beneficiariesCount || 0), 0);
  const totalStatementsCount = projects.reduce((acc, p) => acc + (p.statementReports?.length || 0), 0);

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  const handleCopyReason = (reason: string) => {
    navigator.clipboard.writeText(reason);
    setCopiedReason(true);
    setTimeout(() => setCopiedReason(false), 2500);
  };

  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const parsedAmount = parseFloat(pledgeAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPledgeFeedback({ type: 'error', text: 'Inserisci un importo valido in Euro (€).' });
      return;
    }

    setPledgeSubmitting(true);
    setPledgeFeedback(null);

    const res = await submitPublicDonationPledge(selectedProject.id, {
      donorName: pledgeDonorName.trim() || 'Anonimo Sostenitore',
      amount: parsedAmount,
      email: pledgeEmail.trim() || undefined,
      transferDate: pledgeTransferDate,
      transferReference: pledgeReference.trim() || undefined,
      publicNote: pledgeNote.trim() || undefined
    });

    setPledgeSubmitting(false);
    if (res.success) {
      setPledgeFeedback({ type: 'success', text: res.message });
      // Reset form
      setPledgeAmount('');
      setPledgeDonorName('');
      setPledgeEmail('');
      setPledgeReference('');
      setPledgeNote('');
      setTimeout(() => {
        setShowPledgeForm(false);
        setPledgeFeedback(null);
      }, 3500);
    } else {
      setPledgeFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in" id="community-projects-page">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1c3e] via-[#0e2754] to-[#0a1c3e] text-white p-8 md:p-14 border border-brand-gold/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-mono uppercase tracking-widest">
            <Heart className="w-3.5 h-3.5 fill-brand-gold" />
            <span>{tText('New World State • Civic Humanitarian Works', 'New World State • Opere Umanitarie Civiche')}</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            {tText('Opere Comunitarie & Raccolte Fondi', 'Community Works & Transparent Fundraisers')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e7d3b0] via-[#c5a880] to-[#f4e4c3]">
              {tText('con Rendicontazione Totale Bancaria', 'Fully Audited with Public Bank Statements')}
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed max-w-3xl mx-auto">
            {tText(
              "Costruiamo insieme il bene comune tangibile: pozzi d'acqua potabile a energia solare nei villaggi dell'Africa sub-sahariana, presidi medici rurali per madri e bambini, scuole connesse e riforestazione. Tutte le donazioni avvengono con versamento diretto sul conto corrente dell'associazione e sono rendicontate al centesimo con la pubblicazione periodica degli estratti conto bancari ufficiali.",
              "Building tangible global common good together: solar water wells in rural African villages, solar clinic cold chains for vaccines, connected schools and reforestation. All donations are collected directly via the association's verified bank account and fully accounted for with published official bank statements."
            )}
          </p>

          {/* GUARANTEE PILLARS */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
              <Landmark className="w-4 h-4 text-brand-gold" />
              <span>{tText('Conto Corrente Bancario Dedicato', 'Official Bank Account Dedicated')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>{tText('Estratti Conto PDF Scaricabili', 'Downloadable PDF Statements')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>{tText('Controllo Civico & Trasparenza 100%', 'Civic Control & 100% Transparency')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL METRICS BENTO */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tText('Fondi Raccolti', 'Funds Raised')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#0a1c3e]">
            € {totalRaised.toLocaleString('it-IT')}
          </div>
          <div className="text-[11px] text-slate-500">
            {tText(`su € ${totalTarget.toLocaleString('it-IT')} obiettivo complessivo`, `of € ${totalTarget.toLocaleString('it-IT')} overall goal`)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tText('Beneficiari Diretti', 'Direct Beneficiaries')}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#0a1c3e]">
            {totalBeneficiaries.toLocaleString('it-IT')}
          </div>
          <div className="text-[11px] text-slate-500">
            {tText('Persone e famiglie con accesso ad acqua e servizi', 'People with verified access to water and care')}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tText('Estratti Conto Pubblicati', 'Audited Statements')}</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#0a1c3e]">
            {totalStatementsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            {tText('Documenti contabili e fatture consultabili', 'Verified bank statements & bills public')}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">{tText('Garanzia Istituzionale', 'Civic Guarantee')}</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#0a1c3e]">
            100%
          </div>
          <div className="text-[11px] text-slate-500">
            {tText('Fondi destinati integralmente alle opere', '100% of donations allocated to projects')}
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={tText('Cerca opera per nome, parola chiave o nazione...', 'Search projects by name, country or keyword...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] bg-slate-50/50"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono self-start md:self-auto">
            {filteredProjects.length} {tText('opere e raccolte disponibili', 'projects and fundraisers active')}
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${selectedCategory === 'all' ? 'bg-[#0a1c3e] text-white shadow-sm font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {tText('Tutte le Opere', 'All Projects')}
          </button>
          <button
            onClick={() => setSelectedCategory('water_wells')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${selectedCategory === 'water_wells' ? 'bg-cyan-700 text-white shadow-sm font-bold' : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100'}`}
          >
            <Droplets className="w-3.5 h-3.5" />
            {tText('Pozzi d\'Acqua (Africa)', 'Water Wells (Africa)')}
          </button>
          <button
            onClick={() => setSelectedCategory('health_clinics')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${selectedCategory === 'health_clinics' ? 'bg-rose-700 text-white shadow-sm font-bold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}`}
          >
            <Heart className="w-3.5 h-3.5" />
            {tText('Sanità & Cliniche Rurali', 'Rural Health & Clinics')}
          </button>
          <button
            onClick={() => setSelectedCategory('education')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${selectedCategory === 'education' ? 'bg-amber-700 text-white shadow-sm font-bold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            <Building2 className="w-3.5 h-3.5" />
            {tText('Scuole & Connettività', 'Schools & Education')}
          </button>
          <button
            onClick={() => setSelectedCategory('ecology')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${selectedCategory === 'ecology' ? 'bg-emerald-700 text-white shadow-sm font-bold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {tText('Riforestazione & Agro-Ecologia', 'Reforestation')}
          </button>
        </div>
      </section>

      {/* PROJECTS GRID */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => {
            const catInfo = getCategoryLabel(project.category, language);
            const statusInfo = getStatusLabel(project.status, language);
            const percent = Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100));

            return (
              <div 
                key={project.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Image Cover */}
                <div className="relative h-56 overflow-hidden bg-slate-900">
                  <img 
                    src={project.coverImage} 
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Badges on image */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border backdrop-blur-md ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                  </div>

                  {/* Location bottom overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-1.5 text-white/90 text-xs font-mono">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="font-serif font-bold text-xl text-[#0a1c3e] group-hover:text-brand-gold transition-colors leading-tight">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-light">
                      {project.subtitle}
                    </p>
                  </div>

                  {/* PROGRESS BAR & STATS */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] uppercase block">{tText('Raccolti', 'Raised')}</span>
                        <span className="font-bold text-[#0a1c3e] text-base">€ {project.raisedAmount.toLocaleString('it-IT')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-mono text-[10px] uppercase block">{tText('Obiettivo', 'Target')}</span>
                        <span className="font-medium text-slate-600 text-sm">€ {project.targetAmount.toLocaleString('it-IT')}</span>
                      </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-indigo-600' : 'bg-gradient-to-r from-[#0a1c3e] to-brand-gold'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                      <span className="font-bold text-brand-gold">{percent}% {tText('completato', 'funded')}</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3 h-3 text-slate-400" />
                        {project.beneficiariesCount.toLocaleString('it-IT')} {tText('beneficiari', 'beneficiaries')}
                      </span>
                    </div>
                  </div>

                  {/* STATEMENTS PROOF PILL */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-medium font-mono">
                        {project.statementReports?.length || 0} {tText('Estratti conto pubblicati', 'Bank statements verified')}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>

                  {/* ACTION BUTTON */}
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowPledgeForm(false);
                      setPledgeFeedback(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#0a1c3e] hover:bg-[#071530] text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition duration-200 shadow-md hover:shadow-lg border-b-2 border-brand-gold cursor-pointer"
                  >
                    <span>{tText('Dettagli, Coordinate & Rendicontazione', 'Details, Bank Info & Audit')}</span>
                    <ArrowRight className="w-4 h-4 text-brand-gold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <Droplets className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-serif font-bold text-lg text-slate-700">
              {tText('Nessuna opera trovata per i criteri selezionati', 'No projects found for current filters')}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {tText('Prova a selezionare un\'altra categoria o a pulire la barra di ricerca.', 'Try selecting another category or clearing your search query.')}
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 cursor-pointer"
            >
              {tText('Mostra tutte le opere', 'Show all projects')}
            </button>
          </div>
        )}
      </section>

      {/* DETAILED PROJECT MODAL / DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto">
            
            {/* MODAL HEADER */}
            <div className="bg-[#0a1c3e] text-white p-6 md:p-8 relative shrink-0">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                aria-label="Chiudi finestra"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className={`px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold ${getStatusLabel(selectedProject.status, language).badge}`}>
                    {getStatusLabel(selectedProject.status, language).label}
                  </span>
                  <span className="text-brand-gold/80 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                    {selectedProject.location}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
                  {selectedProject.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-300 font-light leading-relaxed">
                  {selectedProject.subtitle}
                </p>
              </div>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 text-slate-700 text-sm">
              
              {/* IMAGE & SUMMARY IMPACT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7 rounded-2xl overflow-hidden shadow-md border border-slate-200">
                  <img 
                    src={selectedProject.coverImage} 
                    alt={selectedProject.title} 
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="md:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-4">
                  <div className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                    {tText('Stato Avanzamento Raccolta', 'Fundraising Progress')}
                  </div>

                  <div>
                    <div className="text-2xl font-serif font-bold text-[#0a1c3e]">
                      € {selectedProject.raisedAmount.toLocaleString('it-IT')},00
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {tText(`su € ${selectedProject.targetAmount.toLocaleString('it-IT')},00 target finale`, `of € ${selectedProject.targetAmount.toLocaleString('it-IT')} final goal`)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-gold h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round((selectedProject.raisedAmount / selectedProject.targetAmount) * 100))}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{tText('Popolazione Servita:', 'Population Served:')}</span>
                      <strong className="text-[#0a1c3e]">{selectedProject.beneficiariesCount.toLocaleString('it-IT')} persone</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{tText('Data inizio opera:', 'Project start date:')}</span>
                      <strong>{new Date(selectedProject.startDate).toLocaleDateString('it-IT')}</strong>
                    </div>
                    {selectedProject.expectedCompletionDate && (
                      <div className="flex justify-between text-slate-600">
                        <span>{tText('Completamento previsto:', 'Target delivery date:')}</span>
                        <strong>{new Date(selectedProject.expectedCompletionDate).toLocaleDateString('it-IT')}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DETAILED PROJECT DESCRIPTION & PLAN */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#0a1c3e] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-gold" />
                  {tText('Descrizione dell\'Opera & Impatto Comunitario', 'Project Description & Community Impact')}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {selectedProject.description}
                </p>
                {selectedProject.detailedPlan && (
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                    <strong className="text-[#0a1c3e] block font-mono uppercase tracking-wider">{tText('Fasi di Realizzazione Tecnica:', 'Execution Steps:')}</strong>
                    <p className="leading-relaxed">{selectedProject.detailedPlan}</p>
                  </div>
                )}
              </div>

              {/* OFFICIAL BANK DETAILS BOX FOR DONATION */}
              <div className="bg-gradient-to-br from-[#0a1c3e]/5 via-[#c5a880]/10 to-[#0a1c3e]/5 rounded-3xl p-6 md:p-8 border-2 border-brand-gold/40 shadow-md space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-gold/20 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#0a1c3e]">
                      <Landmark className="w-4 h-4 text-brand-gold" />
                      {tText('Come Sostenere Questa Opera con Versamento Bancario', 'How to Support this Project via Bank Transfer')}
                    </div>
                    <h4 className="font-serif font-bold text-xl text-[#0a1c3e]">
                      {tText('Coordinate Bancarie Ufficiali dell\'Associazione', 'Official Association Bank Account')}
                    </h4>
                  </div>

                  <button
                    onClick={() => setShowPledgeForm(!showPledgeForm)}
                    className="px-4 py-2 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold hover:text-[#0a1c3e] text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{showPledgeForm ? tText('Chiudi Segnalazione', 'Close Notice') : tText('Hai già fatto il bonifico? Segnalalo', 'Already Donated? Report it')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account Information */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-mono text-[10px] uppercase block">{tText('Intestatario del Conto:', 'Beneficiary Name:')}</span>
                      <strong className="text-slate-800 text-sm font-serif">{selectedProject.bankDetails.accountHolder}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-mono text-[10px] uppercase block">{tText('Banca di Appoggio:', 'Bank Name:')}</span>
                      <span className="text-slate-700 font-medium">{selectedProject.bankDetails.bankName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-mono text-[10px] uppercase block">{tText('Codice BIC / SWIFT:', 'BIC / SWIFT Code:')}</span>
                      <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{selectedProject.bankDetails.bic}</span>
                    </div>

                    {/* IBAN WITH COPY BUTTON */}
                    <div className="pt-2">
                      <span className="text-slate-400 font-mono text-[10px] uppercase block mb-1">{tText('Codice IBAN:', 'IBAN Code:')}</span>
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-brand-gold/50 shadow-sm">
                        <span className="font-mono text-xs md:text-sm font-bold text-[#0a1c3e] select-all flex-1">
                          {selectedProject.bankDetails.iban}
                        </span>
                        <button
                          onClick={() => handleCopyIban(selectedProject.bankDetails.iban)}
                          className={`p-2 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-mono font-bold ${copiedIban ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                          title="Copia IBAN negli appunti"
                        >
                          {copiedIban ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIban ? tText('Copiato!', 'Copied!') : tText('Copia', 'Copy')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Reason & SEPA QR Code */}
                  <div className="space-y-3 text-xs flex flex-col justify-between">
                    <div>
                      <span className="text-slate-400 font-mono text-[10px] uppercase block mb-1">
                        {tText('Causale Obbligatoria per Questo Progetto:', 'Dedicated Transfer Reason (Required):')}
                      </span>
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-brand-gold/50 shadow-sm">
                        <span className="font-mono text-xs font-bold text-amber-900 select-all flex-1 truncate">
                          {selectedProject.bankDetails.transferReason}
                        </span>
                        <button
                          onClick={() => handleCopyReason(selectedProject.bankDetails.transferReason)}
                          className={`p-2 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-mono font-bold ${copiedReason ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                          title="Copia causale negli appunti"
                        >
                          {copiedReason ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedReason ? tText('Copiata!', 'Copied!') : tText('Copia', 'Copy')}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {tText('Inserisci questa causale esatta nel tuo bonifico per vincolare i tuoi fondi alla realizzazione di quest\'opera.', 'Paste this exact reason in your transfer to bind your donation directly to this project.')}
                      </p>
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl border border-slate-200/90 flex items-center gap-3">
                      <QrCode className="w-10 h-10 text-[#0a1c3e] shrink-0" />
                      <div className="text-[11px] text-slate-600 leading-tight">
                        <strong>{tText('Bonifico SEPA / Ordinario:', 'SEPA Bank Transfer:')}</strong>
                        <p className="text-slate-500 mt-0.5">
                          {tText('Puoi effettuare il bonifico direttamente dalla tua app bancaria abituale, home banking o sportello.', 'Use your banking app, web banking or physical branch to send your donation safely.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTIONAL DONOR REPORT PLEDGE FORM */}
                {showPledgeForm && (
                  <form onSubmit={handlePledgeSubmit} className="mt-6 pt-6 border-t border-brand-gold/20 bg-white p-6 rounded-2xl border border-slate-200 shadow-inner space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="font-serif font-bold text-[#0a1c3e] text-base">
                        {tText('Segnalazione Bonifico Effettuato', 'Report Your Bank Donation')}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {tText('Controllo contabile & Albo donatori', 'Audit check & public ledger')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {tText(
                        'Hai effettuato il bonifico bancario? Inserisci qui i dati della tua donazione per permettere al nostro ufficio contabile di riscontrarla sull\'estratto conto e rilasciare la ricevuta.',
                        'Did you send the bank transfer? Fill this brief form so our audit department can cross-check it against the upcoming bank statement.'
                      )}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                          {tText('Nome Donatore (o "Anonimo")', 'Donor Name (or "Anonymous")')}
                        </label>
                        <input 
                          type="text" 
                          value={pledgeDonorName}
                          onChange={(e) => setPledgeDonorName(e.target.value)}
                          placeholder="es. Mario Rossi o Anonimo"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                          {tText('Importo Versato (€)*', 'Donated Amount (€)*')}
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={pledgeAmount}
                          onChange={(e) => setPledgeAmount(e.target.value)}
                          placeholder="es. 100.00"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                          {tText('Data Bonifico', 'Transfer Date')}
                        </label>
                        <input 
                          type="date" 
                          value={pledgeTransferDate}
                          onChange={(e) => setPledgeTransferDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                          {tText('Email per Ricevuta (facoltativa)', 'Email for Receipt (optional)')}
                        </label>
                        <input 
                          type="email" 
                          value={pledgeEmail}
                          onChange={(e) => setPledgeEmail(e.target.value)}
                          placeholder="tuaemail@esempio.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                          {tText('Codice CRO / TRN (facoltativo)', 'CRO / TRN Code (optional)')}
                        </label>
                        <input 
                          type="text" 
                          value={pledgeReference}
                          onChange={(e) => setPledgeReference(e.target.value)}
                          placeholder="Identificativo contabile del bonifico"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-600 block mb-1">
                        {tText('Messaggio o Dedica Pubblica (facoltativo)', 'Public Note or Dedication (optional)')}
                      </label>
                      <input 
                        type="text" 
                        value={pledgeNote}
                        onChange={(e) => setPledgeNote(e.target.value)}
                        placeholder="Lascia un messaggio che apparirà nell'albo dei donatori"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                      />
                    </div>

                    {pledgeFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-medium ${pledgeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {pledgeFeedback.text}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPledgeForm(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-mono cursor-pointer"
                      >
                        {tText('Annulla', 'Cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={pledgeSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold hover:text-[#0a1c3e] text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow cursor-pointer"
                      >
                        {pledgeSubmitting ? tText('Registrazione in corso...', 'Submitting...') : tText('Invia Segnalazione Donazione', 'Submit Notice')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* AUDITED STATEMENTS & EXPENSE REPORTS (REQUESTED FEATURE) */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#0a1c3e] flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                      {tText('Rendicontazione Bancaria Ufficiale & Estratti Conto', 'Official Bank Statements & Audit Reports')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {tText(
                        'Tutti i bonifici in entrata e le uscite per i fornitori dell\'opera sono rendicontati con la pubblicazione degli estratti conto bancari.',
                        'All incoming donations and vendor construction expenses are audited and substantiated with downloadable bank statements.'
                      )}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    {selectedProject.statementReports?.length || 0} {tText('Documenti Pubblicati', 'Audited Documents')}
                  </span>
                </div>

                {selectedProject.statementReports && selectedProject.statementReports.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {selectedProject.statementReports.map((report) => (
                      <div key={report.id} className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${report.type === 'statement_in' ? 'bg-emerald-100 text-emerald-700' : report.type === 'expense_out' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 text-sm">{report.title}</div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(report.date).toLocaleDateString('it-IT')}
                              </span>
                              <span className="font-bold text-[#0a1c3e]">
                                {report.amount}
                              </span>
                              <span>• {report.fileSize || 'PDF'}</span>
                            </div>
                            {report.notes && (
                              <p className="text-xs text-slate-500 line-clamp-2 pt-0.5">
                                {report.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => downloadProjectStatement(selectedProject, report)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#0a1c3e] hover:text-white text-slate-700 text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-center border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{tText('Scarica Documento', 'Download PDF')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500 space-y-1">
                    <p>{tText('Nessun estratto conto ancora caricato per questo progetto.', 'No bank statements published for this project yet.')}</p>
                    <p className="text-[11px] text-slate-400">
                      {tText('I documenti contabili vengono caricati periodicamente all\'emissione dell\'estratto conto dalla banca.', 'Bank statements are uploaded upon quarterly or monthly issuance by the bank.')}
                    </p>
                  </div>
                )}
              </div>

              {/* DONOR LEDGER / ALBO TRASPARENZA */}
              {selectedProject.donorLedger && selectedProject.donorLedger.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base text-[#0a1c3e] flex items-center gap-2">
                      <Heart className="w-4 h-4 text-brand-gold" />
                      {tText('Albo dei Donatori & Riscontri Contabili', 'Donor Ledger & Verified Deposits')}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedProject.donorLedger.length} {tText('donazioni registrate', 'recorded donations')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {selectedProject.donorLedger.map((donor) => (
                      <div key={donor.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-800 font-medium truncate">{donor.donorName}</strong>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            € {donor.amount.toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>{new Date(donor.date).toLocaleDateString('it-IT')}</span>
                          {donor.verifiedOnStatement ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> {tText('Verificato c/c', 'Audited')}
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {tText('In attesa e/c', 'Pending stmt')}
                            </span>
                          )}
                        </div>
                        {donor.publicNote && (
                          <p className="text-[11px] text-slate-500 italic pt-0.5 line-clamp-1">
                            "{donor.publicNote}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* MODAL FOOTER */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span className="font-mono text-[11px]">
                {tText('New World State • Trasparenza Statutaria Bancaria', 'New World State • Verified Bank Ledger')}
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-bold transition cursor-pointer"
              >
                {tText('Chiudi Finestra', 'Close Window')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
