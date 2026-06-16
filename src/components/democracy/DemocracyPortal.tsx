import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../services/api';
import { 
  Vote, 
  FileText, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Lock, 
  BarChart2, 
  Clock, 
  Award, 
  ChevronRight, 
  Search, 
  Loader2, 
  Inbox, 
  Check, 
  HelpCircle,
  TrendingUp,
  Shield,
  Activity,
  Calendar,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie
} from 'recharts';
import { useI18n } from '../../contexts/I18nContext';

interface CitizenSession {
  id: number;
  firstName: string;
  surname: string;
  username: string;
  email: string;
  citizenCode: string;
  isAmbassador: boolean;
  isPeacekeeper: boolean;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  proponent_id: number;
  proponent_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'passed' | 'failed';
  rejection_reason: string | null;
  created_at: string;
  voting_starts_at: string | null;
  voting_ends_at: string | null;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  total_votes: number;
}

export default function DemocracyPortal() {
  const { language } = useI18n();

  // Citizen auth states
  const [citizen, setCitizen] = useState<CitizenSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nws_democracy_citizen');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'username' | 'password'>('username');
  const [loginMode, setLoginMode] = useState<'standard' | 'temp-email' | 'temp-phone'>('standard');
  const [tempPhoneCode, setTempPhoneCode] = useState<string | null>(null);
  const [preflightMessage, setPreflightMessage] = useState<string | null>(null);
  const [targetContactInfo, setTargetContactInfo] = useState<string>('');

  // Administrative verification credentials
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nws_admin_auth') === 'true';
    }
    return false;
  });

  // Proposals states
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  // Filter and navigation states
  const [subTab, setSubTab] = useState<'active' | 'new' | 'archive' | 'admin'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Submit proposal form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Costituzionale');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action states (voting, admin approval/rejection)
  const [actionLoading, setActionLoading] = useState<number | null>(null); // Proposal ID being voted or modified
  const [adminRejectionProposalId, setAdminRejectionProposalId] = useState<number | null>(null);
  const [adminRejectionReason, setAdminRejectionReason] = useState('');

  // Fetch proposals list
  const fetchProposals = async () => {
    setProposalsLoading(true);
    setProposalsError(null);
    try {
      const res = await safeFetch('/api/democracy/proposals');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setProposals(data.data || []);
      } else {
        throw new Error(data.message || 'Impossibile estrarre le proposte.');
      }
    } catch (err: any) {
      console.error('[DEMOCRACY-FETCH-ERR]', err);
      setProposalsError(err.message || 'Connessione al database della democrazia interrotta.');
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Handle pre-check for citizen identification and generate temporary password if needed
  const handlePreflight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setAuthError('Inserisci codice, username, email o telefono.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setTempPhoneCode(null);
    setPreflightMessage(null);

    try {
      const res = await safeFetch('/api/democracy/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrCode: usernameInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoginStep('password');
        setLoginMode(data.mode);
        setPreflightMessage(data.message);
        if (data.mode === 'temp-email') {
          setTargetContactInfo(data.email);
        } else if (data.mode === 'temp-phone') {
          setTargetContactInfo(data.phone);
          setTempPhoneCode(data.tempPassword);
        } else {
          setTargetContactInfo('');
        }
      } else {
        setAuthError(data.message || 'Cittadino non riconosciuto nell\'Anagrafe Centrale.');
      }
    } catch (err: any) {
      setAuthError('Errore di connessione: ' + (err.message || 'Server Edge offline.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle citizen login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthError('Inserire la password di accesso ricevuta.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await safeFetch('/api/democracy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrCode: usernameInput.trim(),
          password: passwordInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCitizen(data.citizen);
        sessionStorage.setItem('nws_democracy_citizen', JSON.stringify(data.citizen));
        // Reset inputs & login state
        setUsernameInput('');
        setPasswordInput('');
        setLoginStep('username');
        setLoginMode('standard');
        setTempPhoneCode(null);
        setPreflightMessage(null);
        // Refresh proposals
        fetchProposals();
      } else {
        setAuthError(data.message || 'Accesso non riuscito. Controlla le credenziali.');
      }
    } catch (err: any) {
      setAuthError('Errore di connessione: ' + (err.message || 'Server Edge offline.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out citizen
  const handleLogout = () => {
    setCitizen(null);
    sessionStorage.removeItem('nws_democracy_citizen');
    setLoginStep('username');
    setLoginMode('standard');
    setTempPhoneCode(null);
    setPreflightMessage(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  // Submit law proposal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;

    if (!newTitle.trim() || !newContent.trim()) {
      setSubmitMessage({ type: 'error', text: 'Compilare il titolo e il testo legislativo completo.' });
      return;
    }

    setSubmitLoading(true);
    setSubmitMessage(null);

    try {
      const res = await safeFetch('/api/democracy/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          content: newContent.trim(),
          category: newCategory,
          citizen_id: citizen.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: 'La tua iniziativa popolare è stata inserita nel registro sovrano ed è ora in attesa di convalida!' 
        });
        // Clear fields
        setNewTitle('');
        setNewDescription('');
        setNewContent('');
        // Refresh proposals list in background
        fetchProposals();
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Errore durante l\'inserimento.' });
      }
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: 'Impossibile inviare la proposta: ' + err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Cast vote for proposal
  const handleVote = async (proposalId: number, value: 'yes' | 'no' | 'abstain') => {
    if (!citizen) {
      alert('Effettuare l\'accesso sovrano come cittadino approvato per votare.');
      return;
    }

    setActionLoading(proposalId);
    try {
      const res = await safeFetch('/api/democracy/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          citizen_id: citizen.id,
          vote: value
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Voto registrato con successo nel database crittografato di democrazia diretta!');
        // Refresh proposals list to reflect vote immediately
        await fetchProposals();
        // If viewing detailed view, update selected proposal count
        if (selectedProposal && selectedProposal.id === proposalId) {
          const updated = proposals.find(p => p.id === proposalId);
          if (updated) {
            // Apply client side simulation for immediate feedback if async fetch didn't finish
            setSelectedProposal({
              ...selectedProposal,
              yes_votes: value === 'yes' ? selectedProposal.yes_votes + 1 : selectedProposal.yes_votes,
              no_votes: value === 'no' ? selectedProposal.no_votes + 1 : selectedProposal.no_votes,
              abstain_votes: value === 'abstain' ? selectedProposal.abstain_votes + 1 : selectedProposal.abstain_votes,
              total_votes: selectedProposal.total_votes + 1
            });
          }
        }
      } else {
        alert(data.message || 'Impossibile depositare il voto.');
      }
    } catch (err: any) {
      alert('Errore di connessione: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Admin action on proposals
  const handleAdminAction = async (proposalId: number, action: 'approve' | 'reject' | 'delete') => {
    const adminPass = sessionStorage.getItem('nws_admin_password') || '';
    if (!adminPass) {
      alert('Password di amministrazione mancante. Accedi nuovamente alla Console Amministratore.');
      return;
    }

    if (action === 'delete' && !window.confirm('Sei sicuro di voler eliminare irrevocabilmente questa proposta normativa e tutti i suoi voti?')) {
      return;
    }

    setActionLoading(proposalId);
    try {
      const res = await safeFetch('/api/democracy/admin/action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPass
        },
        body: JSON.stringify({
          action,
          proposal_id: proposalId,
          rejection_reason: action === 'reject' ? adminRejectionReason : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Azione completata con successo!');
        setAdminRejectionProposalId(null);
        setAdminRejectionReason('');
        setSelectedProposal(null);
        await fetchProposals();
      } else {
        alert(data.message || 'Errore durante la convalida amministrativa.');
      }
    } catch (err: any) {
      alert('Errore di connessione: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter proposals list
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.proponent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    if (subTab === 'active') {
      return matchesSearch && matchesCategory && p.status === 'approved';
    } else if (subTab === 'archive') {
      return matchesSearch && matchesCategory && (p.status === 'passed' || p.status === 'failed' || p.status === 'rejected');
    } else if (subTab === 'admin') {
      return matchesSearch && matchesCategory && p.status === 'pending';
    }
    return matchesSearch && matchesCategory;
  });

  const activeVotingsCount = proposals.filter(p => p.status === 'approved').length;
  const pendingValidationCount = proposals.filter(p => p.status === 'pending').length;
  const passedReferendumsCount = proposals.filter(p => p.status === 'passed').length;

  return (
    <div className="bg-white rounded-3xl border border-brand-blue/10 shadow-xl overflow-hidden animate-fade-in" id="democracy-portal-root">
      {/* Banner Titolo */}
      <div className="bg-brand-blue text-white p-8 border-b border-brand-gold/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-gold text-xs font-semibold uppercase tracking-[0.2em] font-tech">
              <Vote className="w-4 h-4 animate-pulse" /> Decentred Sovereign Democracy Center
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight mt-1">
              {language === 'en' ? 'Online Sovereign Democracy' : 'Consiglio di Democrazia Diretta'}
            </h2>
            <p className="text-white/60 text-xs mt-1 max-w-2xl">
              Spazio legislativo ufficiale del New World State. I cittadini approvati possono depositare iniziative e votare i referendum costituzionali in modo del tutto trasparente.
            </p>
          </div>
          
          {citizen ? (
            <div className="bg-brand-gold/10 border border-brand-gold/30 px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center font-serif text-[#0a1c3e] font-bold text-sm shadow">
                {citizen.firstName[0]}{citizen.surname[0]}
              </div>
              <div>
                <p className="text-xs font-bold font-serif text-brand-gold leading-none">{citizen.firstName} {citizen.surname}</p>
                <p className="text-[10px] font-mono mt-1 text-white/70 block">CODE: {citizen.citizenCode}</p>
                <button 
                  onClick={handleLogout}
                  id="democracy-logout-btn"
                  className="text-[9px] text-[#ef4444] hover:underline font-bold uppercase tracking-wider block mt-0.5 cursor-pointer"
                >
                  {language === 'en' ? 'Log out' : 'Disconnetti Sessione'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-300 text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping inline-block" />
              <span>{language === 'en' ? 'Access portal to exercise voting rights' : 'Esegui l\'accesso per esercitare il diritto di voto'}</span>
            </div>
          )}
        </div>
      </div>

      {/* CITIZEN LOGIN BLOCK IF NOT LOGGED IN */}
      {!citizen && (
        <div className="py-16 px-6 max-w-md mx-auto text-center" id="democracy-auth-gate">
          <div className="w-16 h-16 bg-brand-blue/5 border border-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-brand-gold" />
          </div>
          <h3 className="text-xl font-serif text-brand-blue font-bold tracking-tight mb-2">
            Autenticazione Sovrana Richiesta
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Per garantire la genuinità della delibera e impedire il voto plurimo, inserisci le credenziali create durante la tua domanda di cittadinanza del New World State.
          </p>

          <form onSubmit={loginStep === 'username' ? handlePreflight : handleLogin} className="space-y-4 text-left">
            {loginStep === 'username' ? (
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Codice Cittadino, Username, Email o Telefono</label>
                <input 
                  type="text"
                  placeholder="es: nome@dominio.it o +39 333..."
                  id="democracy-login-username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-mono"
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 mt-2 block leading-normal">
                  Se ti sei registrato solo con email o solo con telefono, riceverai una password temporanea valida per questa sessione.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual state indicator/header for step 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-mono">UTENTE RILEVATO</span>
                    <span className="text-xs font-bold font-mono text-[#0a1c3e] truncate max-w-[200px]">{usernameInput}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('username');
                      setAuthError(null);
                    }}
                    className="text-[10px] text-brand-gold hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {language === 'en' ? 'Modify' : 'Modifica'}
                  </button>
                </div>

                {preflightMessage && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-700 leading-normal">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{preflightMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">
                    {loginMode === 'temp-email' 
                      ? 'Inserisci Password Temporanea (inviata via Email)' 
                      : loginMode === 'temp-phone' 
                      ? 'Inserisci Password Temporanea (inviata via SMS)' 
                      : 'Password di Registrazione'}
                  </label>
                  <input 
                    type="password"
                    placeholder="La tua password"
                    id="democracy-login-password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-mono"
                    autoFocus
                  />
                </div>

                {/* Simulated SMS notification drawer for beautiful, interactive validation on the demo runtime */}
                {loginMode === 'temp-phone' && tempPhoneCode && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex items-start gap-3 animate-pulse mt-1">
                    <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <div className="font-semibold text-[9px] text-emerald-400 uppercase tracking-widest font-mono">SIMULATORE SMS (Ricevuto Ora)</div>
                      <p className="text-[11px] text-slate-300 font-mono mt-1 leading-normal">
                        [New World State Anagrafe] La tua password temporanea per la Democrazia Online è: <strong className="text-white underline font-bold bg-slate-800 px-2 py-1 rounded inline-block select-all cursor-pointer">{tempPhoneCode}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-[11px] text-rose-500 leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              id={loginStep === 'username' ? 'democracy-next-login-btn' : 'democracy-submit-login-btn'}
              className="w-full bg-brand-blue hover:bg-[#071530] text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-brand-gold"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {language === 'en' ? 'Verifying...' : 'Verifica...'}
                </>
              ) : loginStep === 'username' ? (
                <>
                  {language === 'en' ? 'Continue' : 'Avanti'} <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                language === 'en' ? 'Authenticate Identity' : 'Sblocca Diritto di Voto'
              )}
            </button>
          </form>

          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Sei autenticato come Amministratore nel sistema. Per validare o rifiutare le proposte in sospeso senza un account cittadino, accedi comunque con un account sovrano di test o approvato.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PORTAL MAIN AREA */}
      {citizen && (
        <div id="democracy-main-portal-view">
          {/* TABS E RICERCA */}
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              {/* Sotto-Tabs */}
              <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-200 flex-wrap gap-1">
                <button
                  onClick={() => { setSubTab('active'); setSelectedProposal(null); }}
                  id="tab-active-votes-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'active' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Active Votes' : 'Votazioni Attive'}
                  {activeVotingsCount > 0 && (
                    <span className="bg-[#ef4444] text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans animate-pulse font-extrabold">{activeVotingsCount}</span>
                  )}
                </button>
                <button
                  onClick={() => { setSubTab('new'); setSelectedProposal(null); }}
                  id="tab-new-proposal-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'new' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Propose Law' : 'Presenta Proposta'}
                </button>
                <button
                  onClick={() => { setSubTab('archive'); setSelectedProposal(null); }}
                  id="tab-democracy-archive-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'archive' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Sovereign Archive' : 'Archivio Referendum'}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { setSubTab('admin'); setSelectedProposal(null); }}
                    id="tab-democracy-admin-btn"
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'admin' ? 'bg-amber-600 text-white shadow' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                  >
                    <Shield className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
                    {language === 'en' ? 'Verify Proposes' : 'Verifica Proposte'}
                    {pendingValidationCount > 0 && (
                      <span className="bg-brand-blue text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">{pendingValidationCount}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Barra di Ricerca e Categoria */}
              {subTab !== 'new' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder={language === 'en' ? 'Search proposals...' : 'Cerca proposte normat.'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-slate-200 outline-none text-xs rounded-xl px-9 py-2 w-full sm:w-48 text-brand-blue focus:border-brand-gold shrink-0 transition"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 outline-none text-xs rounded-xl px-3 py-2 text-brand-blue cursor-pointer focus:border-brand-gold"
                  >
                    <option value="all">{language === 'en' ? 'All Categories' : 'Tutte le Categorie'}</option>
                    <option value="Costituzionale">{language === 'en' ? 'Constitutional' : 'Costituzionale'}</option>
                    <option value="Diritti Civili">{language === 'en' ? 'Civil Rights' : 'Diritti Civili'}</option>
                    <option value="Tecnologia & Rete">{language === 'en' ? 'Technology & Net' : 'Tecnologia & Rete'}</option>
                    <option value="Ambiente & Clima">{language === 'en' ? 'Environment' : 'Ambiente & Clima'}</option>
                    <option value="Politica Estera">{language === 'en' ? 'Foreign Policy' : 'Politica Estera'}</option>
                    <option value="Generale">{language === 'en' ? 'Other / General' : 'Altro / Generale'}</option>
                  </select>
                  
                  <button 
                    onClick={fetchProposals}
                    disabled={proposalsLoading}
                    className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-brand-blue hover:text-brand-gold transition duration-150 shrink-0 cursor-pointer text-xs flex items-center justify-center disabled:opacity-50"
                  >
                    <TrendingUp className={`w-3.5 h-3.5 ${proposalsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 max-w-6xl mx-auto">
            {/* NO PROPOSALS ERROR */}
            {proposalsError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-xs mb-6">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Database Error</p>
                  <p>{proposalsError}</p>
                </div>
              </div>
            )}

            {/* LOADING STATE */}
            {proposalsLoading && proposals.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold mx-auto mb-4" />
                <p className="font-serif italic text-sm">{language === 'en' ? 'Reading sovereign ballot records...' : 'Acquisizione del registro elettorale in corso...'}</p>
              </div>
            )}

            {/* SUBTAB: ACTIVE VOTES & ARCHIVE REFERENDUMS */}
            {(subTab === 'active' || subTab === 'archive' || subTab === 'admin') && !proposalsLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LISTA PROPOSTE (7 Colonne) */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs uppercase font-mono-tech tracking-widest text-[#475569] font-bold flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-brand-gold" /> 
                    {subTab === 'active' ? (language === 'en' ? 'Open referendums' : 'Iniziative aperte al voto') : subTab === 'admin' ? 'Istanze parlamentari in sospeso' : 'Eti democratici registrati'}
                    <span className="text-[10px] font-sans font-normal text-slate-400">({filteredProposals.length})</span>
                  </h3>

                  {filteredProposals.length === 0 ? (
                    <div className="border border-dashed border-slate-200 bg-slate-50/50 p-12 rounded-3xl text-center text-slate-400">
                      <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs">{language === 'en' ? 'No proposals found matching this filter' : 'Nessuna proposta normativa presente in questa sezione.'}</p>
                    </div>
                  ) : (
                    filteredProposals.map(prop => {
                      const isSelected = selectedProposal?.id === prop.id;
                      const hasEnded = prop.voting_ends_at && new Date(prop.voting_ends_at) < new Date();
                      
                      return (
                        <div 
                          key={prop.id}
                          onClick={() => setSelectedProposal(prop)}
                          className={`border rounded-2xl p-5 cursor-pointer text-left transition duration-200 hover:shadow-md relative ${isSelected ? 'border-brand-gold bg-brand-gold/5 shadow' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                          id={`proposal-card-${prop.id}`}
                        >
                          {/* Badge Categoria e Stato */}
                          <div className="flex justify-between items-start gap-4 mb-3 flex-wrap">
                            <span className="text-[9px] uppercase tracking-widest bg-brand-blue/5 text-[#0a1c3e] font-bold font-tech px-2.5 py-1 rounded-full border border-brand-blue/5">
                              {prop.category}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {prop.status === 'approved' && !hasEnded && (
                                <span className="bg-emerald-550/10 text-emerald-600 text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1 animate-pulse">
                                  ● {language === 'en' ? 'Open' : 'Vota Ora'}
                                </span>
                              )}
                              {prop.status === 'pending' && (
                                <span className="bg-amber-100 text-amber-700 text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-amber-250 font-bold">
                                  {language === 'en' ? 'Pending Validation' : 'In sospeso'}
                                </span>
                              )}
                              {prop.status === 'passed' && (
                                <span className="bg-emerald-600 text-white text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> {language === 'en' ? 'Passed' : 'Approvata'}
                                </span>
                              )}
                              {prop.status === 'failed' && (
                                <span className="bg-rose-600 text-white text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> {language === 'en' ? 'Rejected' : 'Respinta'}
                                </span>
                              )}
                              {prop.status === 'rejected' && (
                                <span className="bg-slate-400 text-white text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {language === 'en' ? 'Disapproved' : 'Respinta Admin'}
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-serif text-lg font-bold text-brand-blue leading-tight mb-2">
                            {prop.title}
                          </h4>
                          
                          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4">
                            {prop.description || 'Nessun abstract inserito.'}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3 text-[10px] text-slate-450 text-[#475569]/80 font-mono">
                            <span>{language === 'en' ? 'Proposed by' : 'Proponente'}: <strong className="text-brand-blue">{prop.proponent_name}</strong></span>
                            
                            {prop.status === 'approved' && prop.voting_ends_at && (
                              <span className="flex items-center gap-1 text-slate-400 font-sans">
                                <Clock className="w-3 h-3" /> SCADE IL: {new Date(prop.voting_ends_at).toLocaleDateString()}
                              </span>
                            )}
                            {prop.total_votes > 0 && (
                              <span className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-brand-blue font-bold">
                                {prop.total_votes} {language === 'en' ? 'sovereign votes cast' : 'voti espressi'}
                              </span>
                            )}
                          </div>
                          
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* DETTAGLIO SELEZIONATO (5 Colonne) */}
                <div className="lg:col-span-5">
                  <div className="sticky top-24">
                    {selectedProposal ? (
                      <div className="bg-slate-50 rounded-2xl border border-slate-150 p-6 flex flex-col justify-between text-left shadow animate-fade-in" id="proposal-detail-pane">
                        <div>
                          {/* Dettaglio Titolo */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-tech text-white bg-brand-blue px-2 py-0.5 rounded tracking-wider uppercase">{selectedProposal.category}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID #{selectedProposal.id}</span>
                          </div>

                          <h3 className="font-serif text-xl font-bold text-brand-blue tracking-tight leading-tight mb-3">
                            {selectedProposal.title}
                          </h3>

                          {/* Info Proponente e Data */}
                          <div className="space-y-1 border-y border-slate-200/50 py-3 mb-4 text-xs text-slate-600 font-sans">
                            <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-brand-gold shrink-0" /> {language === 'en' ? 'Draft Author: ' : 'Consigliere redattore: '} <strong className="text-brand-blue">{selectedProposal.proponent_name}</strong></p>
                            <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {language === 'en' ? 'Presented on: ' : 'Presentato il: '} {new Date(selectedProposal.created_at).toLocaleDateString()}</p>
                            
                            {selectedProposal.voting_starts_at && (
                              <p className="flex items-center gap-1.5 text-slate-550"><Clock className="w-3.5 h-3.5 text-slate-450 shrink-0" /> {language === 'en' ? 'Voting window: ' : 'Finestra di voto: '} 
                                {new Date(selectedProposal.voting_starts_at).toLocaleDateString()} - {selectedProposal.voting_ends_at ? new Date(selectedProposal.voting_ends_at).toLocaleDateString() : 'N/A'}
                              </p>
                            )}
                          </div>

                          {/* Testo Normativo */}
                          <div className="space-y-3 mb-6">
                            <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">{language === 'en' ? 'Full law bill content' : 'Articolato normativo ufficiale'}:</p>
                            <div className="bg-white border border-slate-150 p-4 rounded-xl max-h-52 overflow-y-auto text-xs text-slate-705 leading-relaxed font-sans whitespace-pre-wrap">
                              {selectedProposal.content}
                            </div>
                          </div>

                          {/* SEZIONE VOTO ATTIVO */}
                          {selectedProposal.status === 'approved' && (
                            <div className="bg-[#0a1c3e]/5 border border-[#0a1c3e]/10 p-4 rounded-xl mb-6">
                              <h4 className="text-[11px] uppercase font-mono-tech tracking-wider text-brand-blue font-bold text-center mb-3">
                                {language === 'en' ? 'Cast your sovereign vote' : 'Esprimi la tua sovranità popolare'}
                              </h4>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleVote(selectedProposal.id, 'yes')}
                                  disabled={actionLoading !== null}
                                  id="vote-yes-btn"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 flex-col active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>{language === 'en' ? 'YES' : 'SÌ'}</span>
                                </button>
                                <button
                                  onClick={() => handleVote(selectedProposal.id, 'no')}
                                  disabled={actionLoading !== null}
                                  id="vote-no-btn"
                                  className="bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 flex-col active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
                                >
                                  <span className="text-sm font-bold leading-3">✕</span>
                                  <span className="mt-1">{language === 'en' ? 'NO' : 'NO'}</span>
                                </button>
                                <button
                                  onClick={() => handleVote(selectedProposal.id, 'abstain')}
                                  disabled={actionLoading !== null}
                                  id="vote-abstain-btn"
                                  className="bg-slate-250 hover:bg-slate-300 text-slate-750 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 flex-col active:scale-95 disabled:opacity-50 cursor-pointer border border-slate-300/50"
                                >
                                  <HelpCircle className="w-4 h-4 text-slate-500" />
                                  <span>{language === 'en' ? 'Abstain' : 'ASTIENITI'}</span>
                                </button>
                              </div>
                              <p className="text-[9px] text-[#475569] text-center mt-3 font-mono">
                                Votando accetti l'irreversibilità e la memorizzazione immutabile della preferenza.
                              </p>
                            </div>
                          )}

                          {/* RECHART STATS FOR APPROVED OR CLOSED REFERENDUMS */}
                          {(selectedProposal.status === 'passed' || selectedProposal.status === 'failed' || selectedProposal.status === 'approved') && (
                            <div className="space-y-4 mb-6">
                              <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
                                {selectedProposal.status === 'approved' ? (language === 'en' ? 'Intermediate Results' : 'Spoglio Parziale Referendario') : (language === 'en' ? 'Final Referendum Results' : 'Esiti Scrutinio Popolare definitivo')}
                              </p>

                              {selectedProposal.total_votes === 0 ? (
                                <div className="border border-slate-200/50 bg-white p-4 rounded-xl text-center text-[11px] text-slate-400 font-mono">
                                  In attesa dei primi voti dai cittadini sovrani.
                                </div>
                              ) : (
                                <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-4 shadow-sm">
                                  {/* Pie Chart / Bar visualization */}
                                  <div className="h-32 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={[
                                            { name: 'Sì', value: selectedProposal.yes_votes },
                                            { name: 'No', value: selectedProposal.no_votes },
                                            { name: 'Astenuto', value: selectedProposal.abstain_votes }
                                          ].filter(item => item.value > 0)}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={25}
                                          outerRadius={45}
                                          paddingAngle={5}
                                          dataKey="value"
                                        >
                                          <Cell fill="#10b981" /> {/* Sì (Emerald) */}
                                          <Cell fill="#f43f5e" /> {/* No (Rose) */}
                                          <Cell fill="#94a3b8" /> {/* Astenuto (Slate) */}
                                        </Pie>
                                        <Tooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* Ripartizione percentuale accurata */}
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-50 pt-3">
                                    <div className="text-emerald-600 font-bold">
                                      <span className="block text-[10px] uppercase font-mono tracking-wider font-normal">Sì</span>
                                      <span className="text-sm font-serif">
                                        {selectedProposal.yes_votes} ({Math.round((selectedProposal.yes_votes / selectedProposal.total_votes) * 100)}%)
                                      </span>
                                    </div>
                                    <div className="text-rose-600 font-bold">
                                      <span className="block text-[10px] uppercase font-mono tracking-wider font-normal">No</span>
                                      <span className="text-sm font-serif">
                                        {selectedProposal.no_votes} ({Math.round((selectedProposal.no_votes / selectedProposal.total_votes) * 100)}%)
                                      </span>
                                    </div>
                                    <div className="text-slate-500 font-bold">
                                      <span className="block text-[10px] uppercase font-mono tracking-wider font-normal">Ast.</span>
                                      <span className="text-sm font-serif">
                                        {selectedProposal.abstain_votes} ({Math.round((selectedProposal.abstain_votes / selectedProposal.total_votes) * 100)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-center font-mono text-slate-400">AFFLUENZA POPOLARE COMPLESSIVA: <strong className="text-brand-blue">{selectedProposal.total_votes} {language === 'en' ? 'citizens' : 'partecipanti'}</strong></p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* REJECTION MOTIVATION FROM ADMIN */}
                          {selectedProposal.status === 'rejected' && selectedProposal.rejection_reason && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-xs mb-6">
                              <p className="font-bold text-rose-800 flex items-center gap-1 mb-1"><XCircle className="w-3.5 h-3.5" /> Motivo del Rifiuto dell'Esecutivo:</p>
                              <p className="text-rose-700 italic">{selectedProposal.rejection_reason}</p>
                            </div>
                          )}

                          {/* ADMIN CONVALIDA INTERFACE */}
                          {subTab === 'admin' && isAdmin && selectedProposal.status === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl space-y-4">
                              <h4 className="text-[11px] uppercase font-mono font-bold text-amber-800 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" /> Pannello Convalida Legislativa
                              </h4>
                              <p className="text-[11px] text-amber-705 leading-relaxed">
                                In qualità di Amministratore dello Stato, rivedi il contenuto soprastante e convalida l'iniziativa per metterla ufficialmente al referendum della cittadinanza per 7 giorni, oppure respingila.
                              </p>

                              {adminRejectionProposalId === selectedProposal.id ? (
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Motivazione istituzionale del respingimento:</label>
                                  <textarea 
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-brand-blue outline-none"
                                    rows={3}
                                    placeholder="Indica il vizio di costituzionalità o il motivo del rigetto..."
                                    value={adminRejectionReason}
                                    onChange={(e) => setAdminRejectionReason(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={() => handleAdminAction(selectedProposal.id, 'reject')}
                                      className="bg-rose-600 hover:bg-rose-700 text-white rounded px-3 py-1.5 text-xs font-bold transition flex-1 cursor-pointer"
                                    >
                                      Conferma Rifiuto
                                    </button>
                                    <button
                                      onClick={() => setAdminRejectionProposalId(null)}
                                      className="bg-slate-200 hover:bg-slate-350 text-slate-705 rounded px-3 py-1.5 text-xs transition cursor-pointer"
                                    >
                                      Annulla
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <button
                                    id="admin-validate-btn"
                                    disabled={actionLoading !== null}
                                    onClick={() => handleAdminAction(selectedProposal.id, 'approve')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approva ed Avvia Votazione
                                  </button>
                                  <button
                                    id="admin-reject-btn"
                                    disabled={actionLoading !== null}
                                    onClick={() => setAdminRejectionProposalId(selectedProposal.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    ✕ Respingi Domanda
                                  </button>
                                  <button
                                    id="admin-delete-btn"
                                    disabled={actionLoading !== null}
                                    onClick={() => handleAdminAction(selectedProposal.id, 'delete')}
                                    className="text-slate-400 hover:text-red-500 rounded px-2.5 py-2 text-xs border border-transparent hover:border-red-100 transition duration-150 cursor-pointer"
                                    title="Cancella per sempre"
                                  >
                                    Elimina
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
                        <Inbox className="w-10 h-10 text-slate-300 mb-4" />
                        <h4 className="font-serif italic text-sm text-slate-500 mb-1">Nessuna proposta selezionata</h4>
                        <p className="text-xs max-w-xs">{language === 'en' ? 'Click on a legislative bill card to view full textual provisions, proponent, and real-time voter turnout and distribution' : 'Seleziona una scheda legislativa dall\'elenco per leggerne il testo integrale, l\'autore e le percentuali di voto.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: SUBMIT NEW PROPOSAL */}
            {subTab === 'new' && (
              <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-150 p-6 md:p-8 text-left animate-fade-in" id="submit-proposal-pane">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-blue tracking-tight leading-none">{language === 'en' ? 'Draft Bill Initiative' : 'Disegna una Nuova Iniziativa Legislativa'}</h3>
                    <p className="text-slate-500 text-[11px] mt-1">Presenta e redigi una proposta di legge da sottoporre all'intera cittadinanza del New World State.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitProposal} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Categoria della Delibera</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue cursor-pointer"
                      >
                        <option value="Costituzionale">Costituzionale (Revisione Carta)</option>
                        <option value="Diritti Civili">Diritti Civili & Welfare</option>
                        <option value="Tecnologia & Rete">Tecnologia, Identità & Digitale</option>
                        <option value="Ambiente & Clima">Ambiente, Clima & Sostenibilità</option>
                        <option value="Politica Estera">Diplomazia & Politica Estera</option>
                        <option value="Generale">Amministrazione Generale</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Titolo dell'Iniziativa</label>
                      <input 
                        type="text"
                        required
                        placeholder="es: Carta dei Diritti del Cittadino Digitale..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        id="new-proposal-title"
                        className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Introduzione Breve (Sintesi)</label>
                    <input 
                      type="text"
                      placeholder="Fornisci un riassunto di 1-2 righe per descrivere lo scopo essenziale del documento"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      id="new-proposal-desc"
                      className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Testo Legislativo Integrale (Articoli ed effetti)</label>
                    <textarea 
                      required
                      placeholder="Specifica in modo preciso il testo normativo in articoli (es: Articolo 1 - Ogni cittadino...). Sii formale, esaustivo e chiaro."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      id="new-proposal-content"
                      rows={8}
                      className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-4 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-sans whitespace-pre-wrap leading-relaxed"
                    />
                  </div>

                  {submitMessage && (
                    <div className={`p-4 rounded-xl border text-xs flex items-start gap-2 ${submitMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                      {submitMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{submitMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading}
                    id="submit-proposal-btn"
                    className="w-full bg-brand-blue hover:bg-[#071530] text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-brand-gold"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {language === 'en' ? 'Submitting Initiative...' : 'Registrazione Proposta nel Registro...'}
                      </>
                    ) : (
                      language === 'en' ? 'Sponsor & Propose Bill' : 'Sottoscrivi e Deposita Proposta di Legge'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
