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
  Smartphone,
  Sparkles,
  BookOpen,
  Lightbulb,
  PenTool,
  Share2
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
import { startBackgroundSync, stopBackgroundSync } from '../../services/notifications';
import PWANotifierBanner from '../pwa/PWANotifierBanner';
import { LegislativeTextRenderer } from './LegislativeTextRenderer';
import { NWSShareWidget } from './NWSShareWidget';
import FederalChat from '../chat/FederalChat';

interface CitizenSession {
  id: number;
  firstName: string;
  surname: string;
  username: string;
  email: string;
  citizenCode: string;
  isAmbassador: boolean;
  isPeacekeeper: boolean;
  operationalRole?: string | null;
  isAdmin?: boolean;
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

interface AlboItem {
  id: number;
  proposal_id: number;
  title: string;
  voting_starts_at: string;
  voting_ends_at: string;
  published_at: string;
}

export default function DemocracyPortal({ onGoToAdmin }: { onGoToAdmin?: () => void } = {}) {
  const { language } = useI18n();

  // Citizen auth states
  const [citizen, setCitizen] = useState<CitizenSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nws_democracy_citizen') || sessionStorage.getItem('nws_democracy_citizen');
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
      return localStorage.getItem('nws_admin_auth') === 'true' || sessionStorage.getItem('nws_admin_auth') === 'true';
    }
    return false;
  });

  // Proposals states
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  // Albo pretorio states
  const [alboItems, setAlboItems] = useState<AlboItem[]>([]);
  const [alboLoading, setAlboLoading] = useState(false);
  const [alboError, setAlboError] = useState<string | null>(null);

  // Filter and navigation states
  const [subTab, setSubTab] = useState<'active' | 'new' | 'archive' | 'admin' | 'albo' | 'share' | 'chat'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'chat') {
        return 'chat';
      }
      if (window.location.pathname === '/chat' || window.location.pathname.endsWith('/chat')) {
        return 'chat';
      }
    }
    return 'active';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Submit proposal form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Diritti Civili');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // New Guided/Dummies Drafting States
  const [draftMode, setDraftMode] = useState<'ai' | 'simple' | 'manual'>('ai');
  const [simpleIdeaText, setSimpleIdeaText] = useState('');
  const [aiProblem, setAiProblem] = useState('');
  const [aiSolution, setAiSolution] = useState('');
  const [aiBenefits, setAiBenefits] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);


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

  const fetchAlbo = async () => {
    setAlboLoading(true);
    setAlboError(null);
    try {
      const res = await safeFetch('/api/democracy/albo');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setAlboItems(data.data || []);
      } else {
        throw new Error(data.message || 'La lettura dell\'Albo Pretorio è fallita.');
      }
    } catch (err: any) {
      console.error('[FETCH-ALBO-ERR]', err);
      setAlboError(err.message || 'Impossibile connettersi all\'Albo delle Votazioni convalidate.');
    } finally {
      setAlboLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchAlbo();
  }, []);

  useEffect(() => {
    // Avvia la sincronizzazione in background per notifiche di voto e modifiche anagrafe personale
    startBackgroundSync(citizen ? citizen.id : null, (newStatus) => {
      setCitizen(prev => {
        if (prev && prev.status !== newStatus) {
          return { ...prev, status: newStatus };
        }
        return prev;
      });
    });
  }, [citizen?.id]);

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
        localStorage.setItem('nws_democracy_citizen', JSON.stringify(data.citizen));
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
    localStorage.removeItem('nws_democracy_citizen');
    setLoginStep('username');
    setLoginMode('standard');
    setTempPhoneCode(null);
    setPreflightMessage(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  // AI-Assisted Proposal Drafting using Gemini API on Server
  const handleGenerateAIDraft = async () => {
    if (!aiSolution.trim()) {
      setAiError(language === 'en' 
        ? 'Please describe your solution or idea to proceed.' 
        : 'Per favore, descrivi la tua idea o soluzione proposta per procedere.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setSubmitMessage(null);

    try {
      const res = await safeFetch('/api/democracy/ai-draft-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: aiProblem.trim(),
          solution: aiSolution.trim(),
          benefits: aiBenefits.trim(),
          category: newCategory
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewTitle(data.data.title || '');
        setNewDescription(data.data.description || '');
        setNewContent(data.data.content || '');
        setDraftMode('manual'); // Switch to editor mode so they can review and modify it!
        setEditorTab('preview'); // Set tab to preview so they see the gorgeous rendered document!
        setSubmitMessage({
          type: 'success',
          text: language === 'en'
            ? '🪄 Proposal drafted successfully by Gemini! We formatted it into formal articles below. Feel free to revise, edit and sponsor it!'
            : '🪄 Bozza legislativa strutturata dall\'AI con successo! Abbiamo articolato la tua idea in moduli normativi formali. Controllala qui sotto, modificala se vuoi, e depositala ufficialmente!'
        });
      } else {
        setAiError(data.message || 'Errore di elaborazione da parte dell\'AI.');
      }
    } catch (err: any) {
      setAiError(language === 'en'
        ? 'Connection error: ' + (err.message || 'AI service down.')
        : 'Errore di connessione: ' + (err.message || 'Servizio AI non raggiungibile.'));
    } finally {
      setAiLoading(false);
    }
  };

  // Submit law proposal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;

    const contentToSubmit = draftMode === 'simple'
      ? `======================================================
PROPOSTA POPOLARE DIRETTA (FORMATO SEMPLICE ED IMMEDIATO)
======================================================

AUTORE PROPONENTE: ${citizen.firstName || citizen.firstname} ${citizen.surname}
CATEGORIA: ${newCategory}

DESCRIZIONE SINTETICA:
${newDescription.trim() || 'Nessuna descrizione specificata'}

TESTO DELLA PROPOSTA (IDEA PRINCIPALE):
${simpleIdeaText.trim()}

------------------------------------------------------
Nota: Questa proposta è stata presentata in modalità semplificata.
I cittadini della nazione possono discuterne e raffinarla direttamente nel forum sovrano.
======================================================`
      : newContent.trim();

    const titleToSubmit = newTitle.trim();
    if (!titleToSubmit) {
      setSubmitMessage({ 
        type: 'error', 
        text: language === 'en' ? 'Proposal Title is required.' : 'Il titolo dell\'iniziativa è obbligatorio.' 
      });
      return;
    }

    if (draftMode === 'simple' && !simpleIdeaText.trim()) {
      setSubmitMessage({ 
        type: 'error', 
        text: language === 'en' ? 'Proposal idea text is required.' : 'Il testo dell\'idea semplificata è obbligatorio.' 
      });
      return;
    }

    if (draftMode !== 'simple' && !contentToSubmit) {
      setSubmitMessage({ 
        type: 'error', 
        text: language === 'en' ? 'Full legislative content is required.' : 'È richiesto il testo legislativo completo suddiviso in articoli.' 
      });
      return;
    }

    setSubmitLoading(true);
    setSubmitMessage(null);

    try {
      const res = await safeFetch('/api/democracy/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToSubmit,
          description: newDescription.trim() || (draftMode === 'simple' ? 'Proposta semplificata presentata da cittadino sovrano' : ''),
          content: contentToSubmit,
          category: newCategory,
          citizen_id: citizen.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage({ 
          type: 'success', 
          text: language === 'en' 
            ? 'Your initiative has been submitted successfully in the Sovereign Ledger and is awaiting administrative validation!'
            : 'La tua iniziativa popolare è stata inserita nel registro sovrano ed è ora in attesa di convalida!' 
        });
        // Clear fields
        setNewTitle('');
        setNewDescription('');
        setNewContent('');
        setSimpleIdeaText('');
        setAiProblem('');
        setAiSolution('');
        setAiBenefits('');
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
        await fetchAlbo();
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* ACCESSO RAPIDO CONSOLLE AMMINISTRATORE */}
              {(citizen.isAmbassador || citizen.isPeacekeeper || citizen.isAdmin || citizen.operationalRole) && onGoToAdmin && (
                <button
                  onClick={onGoToAdmin}
                  id="header-admin-quick-link"
                  className="bg-gradient-to-r from-amber-500 to-amber-650 hover:from-amber-600 hover:to-amber-700 text-white font-serif font-bold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-1.5 border border-amber-300 animate-pulse cursor-pointer shrink-0"
                >
                  <Shield className="w-3.5 h-3.5 fill-current text-white" />
                  <span>{language === 'en' ? 'Admin Console' : 'Consolle Amministratore'}</span>
                </button>
              )}

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
            {language === 'en' ? 'Sovereign Authentication Required' : 'Autenticazione Sovrana Richiesta'}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            {language === 'en'
              ? 'To guarantee the authenticity of the vote and prevent multiple voting, please enter the credentials created during your New World State citizenship application.'
              : 'Per garantire la genuinità della delibera e impedire il voto plurimo, inserisci le credenziali create durante la tua domanda di cittadinanza del New World State.'}
          </p>

          <form onSubmit={loginStep === 'username' ? handlePreflight : handleLogin} className="space-y-4 text-left">
            {loginStep === 'username' ? (
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">
                  {language === 'en' ? 'Citizen Code, Username, Email or Phone' : 'Codice Cittadino, Username, Email o Telefono'}
                </label>
                <input 
                  type="text"
                  placeholder={language === 'en' ? 'e.g. name@domain.com or +44 777...' : 'es: nome@dominio.it o +39 333...'}
                  id="democracy-login-username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-mono"
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 mt-2 block leading-normal">
                  {language === 'en'
                    ? 'If you registered only with email or phone, you will receive a temporary password valid for this session.'
                    : 'Se ti sei registrato solo con email o solo con telefono, riceverai una password temporanea valida per questa sessione.'}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual state indicator/header for step 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-mono">
                      {language === 'en' ? 'DETECTED USER' : 'UTENTE RILEVATO'}
                    </span>
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
                    {language === 'en' ? (
                      loginMode === 'temp-email' 
                        ? 'Enter Temporary Password (sent via Email)' 
                        : loginMode === 'temp-phone' 
                        ? 'Enter Temporary Password (sent via SMS)' 
                        : 'Registration Password'
                    ) : (
                      loginMode === 'temp-email' 
                        ? 'Inserisci Password Temporanea (inviata via Email)' 
                        : loginMode === 'temp-phone' 
                        ? 'Inserisci Password Temporanea (inviata via SMS)' 
                        : 'Password di Registrazione'
                    )}
                  </label>
                  <input 
                    type="password"
                    placeholder={language === 'en' ? 'Your password' : 'La tua password'}
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
                      <div className="font-semibold text-[9px] text-emerald-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'SMS SIMULATOR (Received Just Now)' : 'SIMULATORE SMS (Ricevuto Ora)'}
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono mt-1 leading-normal">
                        {language === 'en' ? (
                          <>
                            [New World State Registry] Your temporary password for Online Democracy is:{' '}
                            <strong className="text-white underline font-bold bg-slate-800 px-2 py-1 rounded inline-block select-all cursor-pointer">
                              {tempPhoneCode}
                            </strong>.
                          </>
                        ) : (
                          <>
                            [New World State Anagrafe] La tua password temporanea per la Democrazia Online è:{' '}
                            <strong className="text-white underline font-bold bg-slate-800 px-2 py-1 rounded inline-block select-all cursor-pointer">
                              {tempPhoneCode}
                            </strong>.
                          </>
                        )}
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
                {language === 'en'
                  ? 'You are authenticated as an Administrator in this system. To validate or reject pending proposals without a citizen account, you still need to log in with a test or approved sovereign citizen account.'
                  : 'Sei autenticato come Amministratore nel sistema. Per validare o rifiutare le proposte in sospeso senza un account cittadino, accedi comunque con un account sovrano di test o approvato.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PORTAL MAIN AREA */}
      {citizen && (
        <div id="democracy-main-portal-view">
          {/* PROMINENT GOVERNMENT OFFICIAL BANNER */}
          {(citizen.isAmbassador || citizen.isPeacekeeper || citizen.isAdmin || citizen.operationalRole) && onGoToAdmin && (
            <div className="mx-4 lg:mx-auto max-w-6xl mt-6 bg-gradient-to-r from-amber-50 to-amber-100/60 border-l-4 border-amber-500 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-amber-200/50">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                  <Shield className="w-5 h-5 fill-current text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest font-serif flex items-center gap-1.5">
                    ✨ {language === 'en' ? 'Official Sovereign Delegation' : 'Autorità Statale Rilevata'}
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    {language === 'en' 
                      ? `You hold an official operational role as: "${citizen.operationalRole || (citizen.isAmbassador ? 'Digital Ambassador' : 'Peace Officer')}". You are authorized to access and manage the sovereign console.` 
                      : `Il tuo profilo ricopre la carica ufficiale di: "${citizen.operationalRole || (citizen.isAmbassador ? 'Ambasciatore Digitale' : 'Ufficiale di Pace')}". Sei autorizzato a gestire la consolle amministrativa.`}
                  </p>
                </div>
              </div>
              <button
                onClick={onGoToAdmin}
                className="bg-amber-600 hover:bg-amber-700 text-white font-serif font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border-b-2 border-amber-700"
              >
                <span>{language === 'en' ? 'Quick Access Admin Console' : 'Consolle Amministratore (Accesso Rapido)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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

                <button
                  onClick={() => { setSubTab('albo'); setSelectedProposal(null); fetchAlbo(); }}
                  id="tab-democracy-albo-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'albo' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                  {language === 'en' ? 'Official Albo Gazette' : 'Albo delle Votazioni'}
                  {alboItems.length > 0 && (
                    <span className="bg-brand-gold text-[#0a1c3e] text-[9px] px-1.5 py-0.5 rounded-full font-bold font-sans ml-1">{alboItems.length}</span>
                  )}
                </button>

                <button
                  onClick={() => { setSubTab('share'); setSelectedProposal(null); }}
                  id="tab-democracy-share-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'share' ? 'bg-[#0a1c3e] text-[#f7f5f0] shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-gold" />
                  {language === 'en' ? 'Invite & Share' : 'Divulga e Invita'}
                </button>

                <button
                  onClick={() => { setSubTab('chat'); setSelectedProposal(null); }}
                  id="tab-democracy-chat-btn"
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${subTab === 'chat' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>{language === 'en' ? 'Federal Chat' : 'Chat Federale'}</span>
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
              {subTab !== 'new' && subTab !== 'albo' && subTab !== 'chat' && (
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

          <div className={`${subTab === 'chat' ? 'p-0 lg:p-6' : 'p-6'} max-w-6xl mx-auto`}>
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
                            <div className="max-h-110 overflow-y-auto rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50">
                              <LegislativeTextRenderer content={selectedProposal.content} className="border-0 shadow-none bg-transparent p-5 md:p-6" />
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
                      <div className="space-y-6">
                        <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                          <Inbox className="w-8 h-8 text-slate-300 mb-3" />
                          <h4 className="font-serif italic text-sm text-slate-500 mb-1">Nessuna proposta selezionata</h4>
                          <p className="text-xs max-w-xs">{language === 'en' ? 'Click on a legislative bill card to view full textual provisions, proponent, and real-time voter turnout and distribution' : 'Seleziona una scheda legislativa dall\'elenco per leggerne il testo integrale, l\'autore e le percentuali di voto.'}</p>
                        </div>

                        {/* CALLOUT DIVULGAZIONE COSTO ZERO */}
                        <div className="bg-gradient-to-br from-[#0a1c3e] to-[#11254c] text-white rounded-2xl p-6 border border-brand-gold/30 shadow-md space-y-4 text-left">
                          <div className="flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-brand-gold animate-bounce" />
                            <h4 className="font-serif font-bold text-sm tracking-wide text-white">
                              {language === 'en' ? 'Invite friends & family!' : 'Cresciamo Insieme! 🌍'}
                            </h4>
                          </div>
                          <p className="text-xs text-white/80 leading-relaxed">
                            {language === 'en' 
                              ? 'The best way to build a free society is to invite your loved ones. Send preformatted invites via WhatsApp, Telegram, and Email at zero cost.'
                              : 'Offri ai tuoi cari l\'opportunità di far parte di una società digitale pacifica e ottenere un passaporto gratuito. Invia inviti pronti via WhatsApp, Telegram o Email.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSubTab('share')}
                            className="w-full bg-brand-gold hover:bg-brand-gold/95 text-[#0a1c3e] py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <span>{language === 'en' ? 'Start Inviting Now 🚀' : 'Invia Inviti Adesso 🚀'}</span>
                          </button>
                        </div>

                        <PWANotifierBanner />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: ALBO PRETORIO */}
            {subTab === 'albo' && (
              <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in" id="albo-pretorio-pane">
                {/* Header d'effetto */}
                <div className="bg-gradient-to-br from-[#0a1c3e] to-[#040c1a] border-2 border-brand-gold/40 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-brand-gold text-[10px] font-bold uppercase tracking-widest font-tech">
                        <Award className="w-4 h-4 text-brand-gold animate-bounce" /> Registro Federale Pubblico dello "New World State"
                      </div>
                      <h3 className="font-serif text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {language === 'en' ? 'Official Voting Bulletin Notice Board' : 'Albo delle Votazioni convalidate'}
                      </h3>
                      <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
                        Ai sensi della Costituzione del New World State, in questa sezione vengono solennemente pubblicati i decreti di indizione referendaria, i quesiti convalidati e i precisi termini temporali delle votazioni approvate dal Consiglio.
                      </p>
                    </div>
                    
                    <div className="bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-4 py-3 rounded-xl text-center flex-shrink-0">
                      <div className="font-tech text-[10px] font-bold uppercase tracking-wider">{language === 'en' ? 'STATE BULLETIN' : 'BOLLETTINO UFFICIALE'}</div>
                      <div className="text-xl font-serif font-extrabold tracking-tight mt-1">NWS-GAZETTE</div>
                    </div>
                  </div>
                </div>

                {/* Loading o Errore */}
                {alboLoading ? (
                  <div className="py-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto mb-3" />
                    <p className="font-serif italic text-xs">{language === 'en' ? 'Loading Gazette entries...' : 'Caricamento dell\'Albo Pretorio in corso...'}</p>
                  </div>
                ) : alboError ? (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{alboError}</span>
                  </div>
                ) : alboItems.length === 0 ? (
                  <div className="border border-dashed border-slate-200 bg-slate-50 p-12 rounded-2xl text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs font-serif italic mb-1">{language === 'en' ? 'Notice Board Empty' : 'Albo delle Votazioni Libero da Annunci'}</p>
                    <p className="text-[11px] text-slate-400">{language === 'en' ? 'No votings have been scheduled or convalidated yet.' : 'Nessuna votazione è stata ancora programmata o convalidata.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {alboItems.map((item) => {
                      const now = new Date();
                      const starts = new Date(item.voting_starts_at);
                      const ends = new Date(item.voting_ends_at);
                      
                      let statusBadge = (
                        <span className="bg-amber-100/85 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase font-tech px-2.5 py-1 rounded-md tracking-wider">
                          {language === 'en' ? 'Scheduled' : 'Programmata'}
                        </span>
                      );
                      
                      if (now >= starts && now <= ends) {
                        statusBadge = (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase font-tech px-2.5 py-1 rounded-md tracking-wider animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                            {language === 'en' ? 'Voting Live' : 'In Corso'}
                          </span>
                        );
                      } else if (now > ends) {
                        statusBadge = (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase font-tech px-2.5 py-1 rounded-md tracking-wider">
                            {language === 'en' ? 'Completed' : 'Votazione Conclusa'}
                          </span>
                        );
                      }

                      return (
                        <div 
                          key={item.id} 
                          className="bg-[#faf9f6] border border-brand-gold/25 rounded-xl p-5 shadow-sm hover:shadow relative overflow-hidden flex flex-col justify-between"
                          style={{ backgroundImage: 'radial-gradient(rgba(217, 119, 6, 0.02) 1px, transparent 0)', backgroundSize: '24px 24px' }}
                        >
                          {/* Top Border Accent */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-gold/40"></div>

                          {/* Stamp di Validità */}
                          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-brand-gold/5 rounded-full border border-dashed border-brand-gold/10 flex items-center justify-center -rotate-12 pointer-events-none select-none">
                            <span className="text-[10px] font-tech font-extrabold text-brand-gold/20 tracking-widest uppercase">PUBBLICATO</span>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider block">
                                REGISTRO ATTI: #{item.id} • NWS-{item.proposal_id}
                              </div>
                              {statusBadge}
                            </div>

                            <div>
                              <h4 className="font-serif text-base font-bold text-brand-blue tracking-tight leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                {language === 'en' ? 'Announced on: ' : 'Pubblicato il: '} 
                                {new Date(item.published_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
                              </p>
                            </div>

                            <hr className="border-brand-gold/15" />

                            <div className="space-y-2 bg-white/70 p-3 rounded-lg border border-slate-100">
                              <h5 className="text-[9px] font-bold uppercase tracking-widest text-[#475569] font-tech">CONDIZIONI E LIMITI DI TEMPO:</h5>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] block font-medium">{language === 'en' ? 'Start Date:' : 'Apertura Seggio:'}</span>
                                  <span className="font-mono text-brand-blue font-bold text-[11px]">
                                    {starts.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block font-medium">{language === 'en' ? 'End Date:' : 'Chiusura Seggio:'}</span>
                                  <span className="font-mono text-brand-blue font-bold text-[11px]">
                                    {ends.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-150 flex justify-between items-center text-[10px] font-medium text-slate-400">
                            <span>REGISTRO ELETTORALE NWS</span>
                            <span className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wide">
                              <Clock className="w-3 h-3" /> {starts > now ? (language === 'en' ? 'Scheduled' : 'In Attesa') : ends < now ? (language === 'en' ? 'Completed' : 'Concluso') : (language === 'en' ? 'Vote Now' : 'Vota Adesso')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB: SHARE & INVITE */}
            {subTab === 'share' && (
              <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in" id="share-invite-pane">
                <NWSShareWidget />
              </div>
            )}

            {/* SUBTAB: CHAT SERVICE */}
            {subTab === 'chat' && (
              <div className="max-w-6xl mx-auto text-left animate-fade-in animate-duration-300" id="chat-services-pane">
                <FederalChat />
              </div>
            )}

            {/* SUBTAB: SUBMIT NEW PROPOSAL */}
            {subTab === 'new' && (
              <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-150 p-6 md:p-8 text-left animate-fade-in" id="submit-proposal-pane">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-blue tracking-tight leading-none">
                      {language === 'en' ? 'Sovereign Proposal Initiative' : 'Disegna una Nuova Iniziativa Legislativa'}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1">
                      {language === 'en' 
                        ? 'Present your idea or draft a legislative proposal to the citizens of New World State.' 
                        : 'Presenta una semplice idea o redigi una proposta strutturata da sottoporre all\'intera cittadinanza.'}
                    </p>
                  </div>
                </div>

                {/* DRAFTING MODE TABS (FOR DUMMIES WIZARD SELECTOR) */}
                <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 mb-5" id="draft-mode-selector">
                  <button
                    type="button"
                    onClick={() => setDraftMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      draftMode === 'ai' 
                        ? 'bg-brand-blue text-white shadow font-bold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>AI Co-Pilot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMode('simple')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      draftMode === 'simple' 
                        ? 'bg-brand-blue text-white shadow font-bold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === 'en' ? 'Simple Idea' : 'Idea Semplice'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      draftMode === 'manual' 
                        ? 'bg-brand-blue text-white shadow font-bold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === 'en' ? 'Manual Draft' : 'Bozza Manuale'}</span>
                  </button>
                </div>

                <form onSubmit={handleSubmitProposal} className="space-y-5">
                  {/* WIZARD SCENARIO A: AI-CO-PILOT WIZARD */}
                  {draftMode === 'ai' && (
                    <div className="space-y-4 bg-white p-5 rounded-xl border border-dashed border-slate-300 shadow-sm" id="ai-wizard-pane">
                      <div className="flex items-center gap-2 mb-2 text-brand-gold">
                        <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-tech">Processo Guidato AI "For Dummies"</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Categoria della Delibera</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue cursor-pointer"
                          >
                            <option value="Diritti Civili">Diritti Civili & Welfare</option>
                            <option value="Tecnologia & Rete">Tecnologia, Identità & Digitale</option>
                            <option value="Ambiente & Clima">Ambiente, Clima & Sostenibilità</option>
                            <option value="Politica Estera">Diplomazia & Politica Estera</option>
                            <option value="Generale">Amministrazione Generale</option>
                          </select>
                        </div>
                        <div className="flex items-end text-slate-400 text-[11px] pb-2 italic">
                          <span>Seleziona l'argomento principale della tua iniziativa.</span>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-brand-blue font-bold uppercase tracking-wider mb-1">
                            1. Che problema o esigenza vuoi risolvere nella nostra nazione digitale?
                          </label>
                          <span className="block text-[10px] text-slate-400 mb-1.5">Spiega semplicemente di cosa si tratta, in parole tue.</span>
                          <textarea 
                            placeholder="es: I cittadini viaggiano molto ma non hanno un modo facile per mostrare la propria nazionalità digitale all'estero tramite API sicure e NFC..."
                            value={aiProblem}
                            onChange={(e) => setAiProblem(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-brand-blue font-bold uppercase tracking-wider mb-1">
                            2. Qual è la tua idea o soluzione proposta? <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <span className="block text-[10px] text-slate-400 mb-1.5">Spiega brevemente la tua idea. L'AI la tradurrà in veri articoli normativi per te.</span>
                          <textarea 
                            required={draftMode === 'ai'}
                            placeholder="es: Suggerisco di aggiungere un modulo ID crittografico esportabile e integrabile con Apple/Google Wallet con chiavi asimmetriche anonime..."
                            value={aiSolution}
                            onChange={(e) => setAiSolution(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-brand-blue font-bold uppercase tracking-wider mb-1">
                            3. Quali saranno i vantaggi pratici per la comunità?
                          </label>
                          <span className="block text-[10px] text-slate-400 mb-1.5">Quali benefici speri di portare con questo cambiamento?</span>
                          <textarea 
                            placeholder="es: Trasparenza, facilità nei viaggi con passaporto elettronico sovrano, zero tracciamento dei cittadini e integrazioni automatiche..."
                            value={aiBenefits}
                            onChange={(e) => setAiBenefits(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-3 text-xs outline-none transition text-brand-blue placeholder-slate-400 leading-relaxed"
                          />
                        </div>
                      </div>

                      {aiError && (
                        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{aiError}</span>
                        </div>
                      )}

                      {submitMessage && (
                        <div className={`p-4 rounded-xl border text-xs flex items-start gap-2 ${submitMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                          {submitMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                          <span>{submitMessage.text}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleGenerateAIDraft}
                        disabled={aiLoading}
                        className="w-full bg-brand-gold hover:bg-amber-400 text-brand-blue py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow border-b-4 border-amber-600 font-tech"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generazione Bozza in Articoli...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Genera Bozza in Articoli con AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* WIZARD SCENARIO B: SIMPLE IDEA (PETITION) */}
                  {draftMode === 'simple' && (
                    <div className="space-y-4" id="simple-idea-pane">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Categoria della Delibera</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue cursor-pointer"
                          >
                            <option value="Diritti Civili">Diritti Civili & Welfare</option>
                            <option value="Tecnologia & Rete">Tecnologia, Identità & Digitale</option>
                            <option value="Ambiente & Clima">Ambiente, Clima & Sostenibilità</option>
                            <option value="Politica Estera">Diplomazia & Politica Estera</option>
                            <option value="Generale">Amministrazione Generale</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Titolo Semplice dell'Iniziativa</label>
                          <input 
                            type="text"
                            required
                            placeholder="es: Semplificare i requisiti di voto elettronico..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Sintesi Breve (1 riga)</label>
                        <input 
                          type="text"
                          placeholder="Fornisci una sintesi lampo della tua idea."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">La tua idea in poche righe d'effetto</label>
                        <textarea 
                          required
                          placeholder="Esponi liberamente e semplicemente la tua idea. Non preoccuparti del formato legale o delle formule in articoli: qui basta descrivere onestamente il bene comune che vuoi realizzare."
                          value={simpleIdeaText}
                          onChange={(e) => setSimpleIdeaText(e.target.value)}
                          rows={8}
                          className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-4 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-sans whitespace-pre-wrap leading-relaxed focus:ring-brand-gold/30"
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
                        className="w-full bg-brand-blue hover:bg-[#071530] text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-150 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-brand-gold"
                      >
                        {submitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> {language === 'en' ? 'Submitting Idea...' : 'Sottomissione Bozza Semplificata...'}
                          </>
                        ) : (
                          language === 'en' ? 'Submit Simple Idea' : 'Sottoscrivi e Deposita Idea Semplice'
                        )}
                      </button>
                    </div>
                  )}

                  {/* WIZARD SCENARIO C: MANUAL BILL DRAFTING */}
                  {draftMode === 'manual' && (
                    <div className="space-y-4" id="manual-articles-pane">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Categoria della Delibera</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue cursor-pointer"
                          >
                            <option value="Diritti Civili">Diritti Civili & Welfare</option>
                            <option value="Tecnologia & Rete">Tecnologia, Identità & Digitale</option>
                            <option value="Ambiente & Clima">Ambiente, Clima & Sostenibilità</option>
                            <option value="Politica Estera">Diplomazia & Politica Estera</option>
                            <option value="Generale">Amministrazione Generale</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 font-tech">Titolo dell'Iniziativa Legislativa</label>
                          <input 
                            type="text"
                            required
                            placeholder="es: Carta dei Diritti del Cittadino Digitale..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
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
                          className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl px-4 py-2.5 text-xs outline-none transition text-brand-blue placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest font-tech font-bold text-brand-gold flex items-center gap-1">
                            <span>Testo Legislativo Integrale (Articoli ed effetti)</span>
                          </label>
                          {newContent && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditorTab('edit')}
                                className={`text-[9px] px-2.5 py-1 rounded font-bold uppercase tracking-wider font-tech transition-all cursor-pointer ${
                                  editorTab === 'edit'
                                    ? 'bg-brand-blue text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {language === 'en' ? 'Edit Draft' : 'Modifica Bozza'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditorTab('preview')}
                                className={`text-[9px] px-2.5 py-1 rounded font-bold uppercase tracking-wider font-tech transition-all cursor-pointer ${
                                  editorTab === 'preview'
                                    ? 'bg-brand-gold text-brand-blue shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {language === 'en' ? 'Anteprima' : 'Anteprima'}
                              </button>
                              <span className="text-[9px] bg-brand-gold/15 text-brand-gold/80 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-tech animate-pulse">
                                🪄 AI
                              </span>
                            </div>
                          )}
                        </div>
                        {editorTab === 'preview' && newContent ? (
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1 max-h-110 overflow-y-auto mb-4">
                            <LegislativeTextRenderer content={newContent} title={newTitle || 'Proposta Normativa'} className="border-0 shadow-none bg-transparent p-4 md:p-5" />
                          </div>
                        ) : (
                          <textarea 
                            required
                            placeholder="Specifica in modo preciso il testo normativo codificato in articoli (es: Articolo 1 - Ogni cittadino...). Sii formale, esaustivo e chiaro."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            rows={12}
                            className="w-full bg-white border border-slate-200 focus:border-brand-gold focus:ring focus:ring-brand-gold/20 rounded-xl p-4 text-xs outline-none transition text-brand-blue placeholder-slate-400 font-sans whitespace-pre-wrap leading-relaxed focus:ring-brand-gold/30 mb-4"
                          />
                        )}
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
                        className="w-full bg-brand-blue hover:bg-[#071530] text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-150 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-brand-gold"
                      >
                        {submitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> {language === 'en' ? 'Submitting Bill...' : 'Registrazione Proposta nel Registro...'}
                          </>
                        ) : (
                          language === 'en' ? 'Sponsor & Propose Bill' : 'Sottoscrivi e Deposita Testo in Articoli'
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
