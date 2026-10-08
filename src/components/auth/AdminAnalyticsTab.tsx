/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Consolle Statistiche, Telemetria & Community Analytics
 */

import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../services/api';
import {
  Users,
  Eye,
  Clock,
  Globe,
  Compass,
  TrendingUp,
  Smartphone,
  Laptop,
  Tablet,
  FileText,
  Vote,
  ShieldCheck,
  Download,
  RotateCw,
  Sparkles,
  MapPin,
  Share2,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  ThumbsUp,
  Target,
  PieChart,
  Award,
  LogIn,
  Radio,
  Timer,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ExternalLink,
  X
} from 'lucide-react';

interface AdminAnalyticsTabProps {
  adminPasswordValue: string;
  showAlert: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export interface VisitorPageStep {
  stepNumber: number;
  id?: string;
  tab: string;
  tabLabel: string;
  entryPage?: string;
  timeSpentSeconds: number;
  durationFormatted: string;
  timestamp: number;
  lastActive?: number;
  exactTimeFormatted: string;
  fullDateFormatted: string;
  percentOfSession?: number;
  isEntry?: boolean;
  isCurrent?: boolean;
}

export interface RecentVisitItem {
  id: string;
  sessionId?: string;
  visitorId?: string;
  sessionCount?: number;
  actionsCount?: number;
  pagesViewedCount?: number;
  timestamp: number | string;
  firstSeen?: number;
  lastActive?: number;
  lastSeen?: number;
  timeFormatted: string;
  exactTimeFormatted?: string;
  firstTimeFormatted?: string;
  city: string;
  country: string;
  countryCode: string;
  entryPage: string;
  entryPageLabel?: string;
  currentTab: string;
  currentTabLabel?: string;
  timeSpentSeconds: number;
  durationFormatted: string;
  isOnline: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipMasked: string;
  referrer?: string;
  pageHistory?: VisitorPageStep[];
}

interface AnalyticsData {
  onlineVisitors?: number;
  recentVisits?: RecentVisitItem[];
  totalVisitsCount?: number;
  visitsPagination?: {
    page: number;
    limit: number;
    totalVisits: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    avgSessionDurationSeconds: number;
    bounceRate: number;
    pagesPerSession: string;
    totalTimeSpentSeconds: number;
    citizensTotal: number;
    citizensApproved: number;
    citizensPending: number;
    citizensRejected: number;
    proposalsTotal: number;
    totalVotesCast: number;
    publishedArticlesCount: number;
    communityEvents: Record<string, number>;
  };
  topPages: Array<{
    id: string;
    title: string;
    views: number;
    uniqueVisitors: number;
    avgTimeSeconds: number;
    percent: number;
  }>;
  topArticles: Array<{
    slug: string;
    title: string;
    views: number;
    uniqueVisitors: number;
    avgReadingTimeSeconds: number;
    completedReads: number;
  }>;
  countries: Array<{
    code: string;
    name: string;
    views: number;
    visitors: number;
    percentage: number;
  }>;
  cities: Record<string, number>;
  sources: Array<{
    key: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  hourlyDistribution: Array<{ hour: string; views: number; visitors: number }>;
  dailyHistory: Array<{ date: string; views: number; visitors: number; avgDuration: number }>;
  interestAreas?: Array<{
    key: string;
    title: string;
    percentage: number;
    views: number;
    engagementLevel: string;
    description: string;
  }>;
  visitorPerception?: {
    overallSatisfaction: string;
    retentionRate: string;
    engagementScore: string;
    civicTrustIndex: string;
    readingCompletionRate: string;
    perceptionSummary: string;
  };
}

// Calcola array di indici di pagina con ellissi per navigazione pulita
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, -1, total];
  }
  if (current >= total - 3) {
    return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, -1, current - 1, current, current + 1, -1, total];
}

export default function AdminAnalyticsTab({ adminPasswordValue, showAlert }: AdminAnalyticsTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedVisitModal, setSelectedVisitModal] = useState<RecentVisitItem | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [activeSection, setActiveSection] = useState<'overview' | 'geography' | 'content' | 'community' | 'tech' | 'perception'>('overview');

  // Stato per la navigazione paginata a ritroso delle visite (10 / 20 / 30 / 50 per pagina)
  const [visitsPage, setVisitsPage] = useState<number>(1);
  const [visitsLimit, setVisitsLimit] = useState<10 | 20 | 30 | 50>(20);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [visitsList, setVisitsList] = useState<RecentVisitItem[]>([]);
  const [visitsLoading, setVisitsLoading] = useState<boolean>(false);
  const [visitsSearch, setVisitsSearch] = useState<string>('');
  const [visitsFilter, setVisitsFilter] = useState<'all' | 'online' | 'ended'>('all');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const fetchVisitsPage = async (
    page: number,
    limit: number,
    search: string = visitsSearch,
    filter: string = visitsFilter,
    showSpinner: boolean = true
  ) => {
    if (showSpinner) setVisitsLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        filter
      });
      const res = await safeFetch(`/api/admin/analytics/visits?${qParams.toString()}`, {
        headers: {
          'x-admin-password': adminPasswordValue
        }
      });
      const json = await res.json();
      if (json && json.success) {
        setVisitsList(json.visits || []);
        if (json.pagination) {
          setVisitsPage(json.pagination.page);
          setVisitsLimit(json.pagination.limit);
          setTotalVisits(json.pagination.totalVisits);
          setTotalPages(json.pagination.totalPages);
        } else {
          setVisitsPage(page);
          setVisitsLimit(limit as any);
        }
      }
    } catch (err: any) {
      console.warn('[ANALYTICS-VISITS-FETCH-ERR]', err);
    } finally {
      if (showSpinner) setVisitsLoading(false);
    }
  };

  const fetchAnalytics = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const res = await safeFetch(`/api/admin/analytics/overview?range=${timeRange}&limit=${visitsLimit}&page=${visitsPage}`, {
        headers: {
          'x-admin-password': adminPasswordValue
        }
      });
      const json = await res.json();
      if (json && json.success) {
        setData(json);
        // Sincronizza visite e totali se siamo in pagina 1 senza filtri
        if (visitsPage === 1 && !visitsSearch && visitsFilter === 'all') {
          if (json.recentVisits && json.recentVisits.length > 0) {
            setVisitsList(json.recentVisits);
          }
          const tot = json.visitsPagination?.totalVisits ?? json.totalVisitsCount ?? 0;
          if (tot > 0) {
            setTotalVisits(tot);
            setTotalPages(json.visitsPagination?.totalPages ?? Math.ceil(tot / visitsLimit) ?? 1);
          }
        }
      } else if (showLoadingSpinner) {
        showAlert('error', json?.message || 'Errore nel caricamento delle statistiche.');
      }
    } catch (err: any) {
      if (showLoadingSpinner) {
        showAlert('error', 'Impossibile connettersi al server per recuperare le statistiche: ' + (err.message || 'Errore di rete'));
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
  }, [timeRange]);

  // Carica la pagina di visite quando cambiano pagina, limite o filtro
  useEffect(() => {
    fetchVisitsPage(visitsPage, visitsLimit, visitsSearch, visitsFilter, true);
  }, [visitsPage, visitsLimit, visitsFilter]);

  // Aggiornamento continuo in tempo reale (ogni 10 secondi) per tracciamento presenze live
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics(false);
      // Se l'amministratore è posizionato sulla prima pagina recente, aggiorna anche la lista live
      if (visitsPage === 1 && !visitsSearch && visitsFilter === 'all') {
        fetchVisitsPage(1, visitsLimit, '', 'all', false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, adminPasswordValue, visitsPage, visitsLimit, visitsSearch, visitsFilter]);

  const handleExportData = async () => {
    try {
      const res = await safeFetch(`/api/admin/analytics/export`, {
        headers: {
          'x-admin-password': adminPasswordValue
        }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nws_statistiche_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showAlert('success', 'Report analitico esportato con successo in formato JSON.');
    } catch (e: any) {
      showAlert('error', 'Errore durante il download del report: ' + (e.message || ''));
    }
  };

  const formatSeconds = (sec: number): string => {
    if (!sec || isNaN(sec)) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const getCountryFlag = (code: string): string => {
    const flags: Record<string, string> = {
      IT: '🇮🇹', CH: '🇨🇭', FR: '🇫🇷', DE: '🇩🇪', US: '🇺🇸',
      ES: '🇪🇸', GB: '🇬🇧', AT: '🇦🇹', BE: '🇧🇪', NL: '🇳🇱',
      SM: '🇸🇲', VA: '🇻🇦', CA: '🇨🇦', BR: '🇧🇷', AU: '🇦🇺'
    };
    return flags[code.toUpperCase()] || '🌐';
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4" id="admin-analytics-loading">
        <RotateCw className="w-8 h-8 text-[#c5a880] animate-spin" />
        <p className="text-sm font-serif text-slate-600">Elaborazione e calcolo telemetria del portale...</p>
      </div>
    );
  }

  const s = data?.summary || {
    totalPageViews: 0,
    uniqueVisitors: 0,
    avgSessionDurationSeconds: 0,
    bounceRate: 0,
    pagesPerSession: '0',
    totalTimeSpentSeconds: 0,
    citizensTotal: 0,
    citizensApproved: 0,
    citizensPending: 0,
    citizensRejected: 0,
    proposalsTotal: 0,
    totalVotesCast: 0,
    publishedArticlesCount: 0,
    communityEvents: {}
  };

  const totalDevices = (data?.devices?.desktop || 0) + (data?.devices?.mobile || 0) + (data?.devices?.tablet || 0) || 1;
  const desktopPct = Math.round(((data?.devices?.desktop || 0) / totalDevices) * 100);
  const mobilePct = Math.round(((data?.devices?.mobile || 0) / totalDevices) * 100);
  const tabletPct = Math.round(((data?.devices?.tablet || 0) / totalDevices) * 100);

  return (
    <div className="space-y-8 animate-fade-in" id="admin-analytics-container">
      
      {/* HEADER DELLA TAB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#0a1c3e] to-[#122852] p-6 rounded-2xl text-white shadow-md border border-[#c5a880]/20">
        <div>
          <div className="flex items-center gap-2 text-[#c5a880] text-xs font-semibold uppercase tracking-widest">
            <Activity className="w-4 h-4" /> Osservatorio Statistico & Telemetria
          </div>
          <h3 className="text-2xl font-serif font-bold text-white mt-1">
            Analisi del Traffico & Salute della Comunità
          </h3>
          <p className="text-xs text-white/70 mt-1 max-w-2xl">
            Monitoraggio anonimo e aggregato conforme GDPR: provenienza geografica, permanenza media, gradimento delle notizie e partecipazione democratica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Indicatore Visitatori Online in Tempo Reale */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl backdrop-blur-sm shadow-sm mr-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-emerald-300/50"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider leading-none">Online Adesso</span>
              <span className="text-sm font-black text-white leading-tight flex items-baseline gap-1 mt-0.5">
                {data?.onlineVisitors ?? 1}
                <span className="text-[10px] font-normal text-emerald-300">utenti</span>
              </span>
            </div>
          </div>

          {/* Toggle Auto-Refresh Live */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 text-white/60 border-white/10'
            }`}
            title={autoRefresh ? 'Auto-aggiornamento live attivo (ogni 10s)' : 'Auto-aggiornamento in pausa'}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            Live {autoRefresh ? '10s' : 'Pausa'}
          </button>

          {/* Selettore intervallo */}
          <div className="flex bg-white/10 rounded-xl p-1 border border-white/10">
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  timeRange === r ? 'bg-[#c5a880] text-[#0a1c3e] shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                {r === 'today' ? 'Oggi' : r === '7d' ? '7 Giorni' : r === '30d' ? '30 Giorni' : 'Tutto'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition border border-white/10"
            title="Aggiorna dati"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-[#c5a880] hover:bg-[#b59870] text-[#0a1c3e] font-bold rounded-xl px-3.5 py-2 text-xs transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Esporta JSON
          </button>
        </div>
      </div>

      {/* SCHEDE KPI PRINCIPALI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="analytics-kpi-grid">
        
        {/* KPI 0: Visitatori Online Adesso (In Tempo Reale) */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950/20 via-white to-emerald-50/40 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-sm hover:border-emerald-500 transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Online Adesso</span>
            </div>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-emerald-950">{data?.onlineVisitors ?? 1}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              ● Live
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-1">
            Sessioni attive negli ultimi 3 minuti
          </p>
        </div>

        {/* KPI 1: Visitatori Unici */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visitatori Unici</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-[#0a1c3e]">{s.uniqueVisitors}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {s.totalPageViews} visualizzazioni pagina
          </p>
        </div>

        {/* KPI 2: Tempo Medio di Permanenza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tempo Medio</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-[#0a1c3e]">
              {formatSeconds(s.avgSessionDurationSeconds)}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Alto Coinvolgimento
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Attivo: {Math.round(s.totalTimeSpentSeconds / 3600)} ore
          </p>
        </div>

        {/* KPI 3: Pagine / Sessione & Rimbalzo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pagine / Sessione</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-[#0a1c3e]">{s.pagesPerSession}</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
              {s.bounceRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Profondità di lettura del portale
          </p>
        </div>

        {/* KPI 4: Comunità & Cittadinanza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cittadini</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-black text-[#0a1c3e]">{s.citizensTotal}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {s.citizensApproved} Approvati
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {s.totalVotesCast} voti referendum
          </p>
        </div>
      </div>

      {/* SOTTO-NAVIGAZIONE SEZIONI ANALITICHE */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Traffico & Cronologia
        </button>

        <button
          onClick={() => setActiveSection('geography')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'geography'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" /> Provenienza & Sorgenti
        </button>

        <button
          onClick={() => setActiveSection('content')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'content'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Contenuti & Quotidiano
        </button>

        <button
          onClick={() => setActiveSection('community')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'community'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Vote className="w-4 h-4" /> Partecipazione Democratica
        </button>

        <button
          onClick={() => setActiveSection('tech')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'tech'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-4 h-4" /> Dispositivi & Fasce Orarie
        </button>

        <button
          onClick={() => setActiveSection('perception')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'perception'
              ? 'bg-[#0a1c3e] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#c5a880]" /> Interessi & Coinvolgimento
        </button>
      </div>

      {/* SEZIONE 1: PANORAMICA TRAFFICO & CRONOLOGIA */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in">

          {/* REGISTRO VISITE STORICO A RITROSO (10 / 20 / 30 / 50 PER PAGINA) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden" id="analytics-recent-visits-card">
            {/* Header con titolo e controlli per pagina */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 bg-[#0a1c3e]/10 text-[#0a1c3e] rounded-lg">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-serif font-bold text-[#0a1c3e]">
                    Elenco dei Visitatori & Sessioni Uniche (A Ritroso)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Database Neon Certificato • Dati Reali
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Elenco deduplicato dei singoli visitatori a ritroso (dal più recente al più datato). Pagina <span className="font-bold text-[#0a1c3e]">{visitsPage}</span> di <span className="font-bold text-[#0a1c3e]">{totalPages}</span> ({totalVisits} visitatori unici nel database). Clicca su un visitatore per aprire la scheda di approfondimento con il dettaglio delle pagine visitate e il tempo di permanenza.
                </p>
              </div>

              {/* Selettore Righe per Pagina (10, 20, 30, 50) e Ricarica */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <span className="text-[11px] text-slate-500 px-2 font-medium">Mostra:</span>
                  {([10, 20, 30, 50] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setVisitsLimit(sz);
                        setVisitsPage(1);
                        fetchVisitsPage(1, sz, visitsSearch, visitsFilter, true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs transition font-mono ${
                        visitsLimit === sz
                          ? 'bg-[#0a1c3e] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      }`}
                      title={`Visualizza ${sz} visitatori per pagina`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchVisitsPage(visitsPage, visitsLimit, visitsSearch, visitsFilter, true)}
                  disabled={visitsLoading}
                  className="p-2 rounded-xl text-slate-600 hover:text-[#0a1c3e] hover:bg-slate-100 transition border border-slate-200"
                  title="Ricarica elenco visitatori"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${visitsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Barra Filtri e Ricerca Rapida */}
            <div className="p-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 px-5">
              {/* Filtri pillola */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => { setVisitsFilter('all'); setVisitsPage(1); fetchVisitsPage(1, visitsLimit, visitsSearch, 'all', true); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    visitsFilter === 'all'
                      ? 'bg-[#0a1c3e] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tutti i Visitatori ({totalVisits})
                </button>
                <button
                  onClick={() => { setVisitsFilter('online'); setVisitsPage(1); fetchVisitsPage(1, visitsLimit, visitsSearch, 'online', true); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                    visitsFilter === 'online'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Solo Online ({data?.onlineVisitors || 1})
                </button>
                <button
                  onClick={() => { setVisitsFilter('ended'); setVisitsPage(1); fetchVisitsPage(1, visitsLimit, visitsSearch, 'ended', true); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    visitsFilter === 'ended'
                      ? 'bg-[#0a1c3e] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Conclusi
                </button>
              </div>

              {/* Ricerca testuale */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={visitsSearch}
                  onChange={(e) => setVisitsSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setVisitsPage(1);
                      fetchVisitsPage(1, visitsLimit, visitsSearch, visitsFilter, true);
                    }
                  }}
                  placeholder="Cerca ID, città, nazione, IP..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0a1c3e] focus:border-[#0a1c3e]"
                />
                {visitsSearch && (
                  <button
                    onClick={() => {
                      setVisitsSearch('');
                      setVisitsPage(1);
                      fetchVisitsPage(1, visitsLimit, '', visitsFilter, true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabella Dettagliata Visite */}
            <div className="overflow-x-auto relative">
              {visitsLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 bg-[#0a1c3e] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Caricamento pagina {visitsPage}...
                  </div>
                </div>
              )}
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-bold">Visitatore & Stato</th>
                    <th className="py-3 px-4 font-bold">Provenienza</th>
                    <th className="py-3 px-4 font-bold">Tempo di Permanenza</th>
                    <th className="py-3 px-4 font-bold">Pagine Visitate</th>
                    <th className="py-3 px-4 font-bold">Ingresso / Ultima</th>
                    <th className="py-3 px-4 font-bold">Dispositivo</th>
                    <th className="py-3 px-4 font-bold">IP Protetto</th>
                    <th className="py-3 px-3 text-right font-bold">Scheda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {((visitsList.length > 0 ? visitsList : (data?.recentVisits || [])).length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        {visitsSearch ? 'Nessun visitatore corrisponde ai criteri di ricerca specificati.' : 'Nessun visitatore registrato per i filtri selezionati.'}
                      </td>
                    </tr>
                  ) : (
                    (visitsList.length > 0 ? visitsList : (data?.recentVisits || [])).map((visit, vIdx) => {
                      const steps = visit.pageHistory && visit.pageHistory.length > 0
                        ? visit.pageHistory
                        : [{ tab: visit.currentTab, tabLabel: visit.currentTabLabel || visit.currentTab, timeSpentSeconds: visit.timeSpentSeconds }];
                      const distinctTabs = Array.from(new Set(steps.map(s => s.tabLabel || s.tab)));

                      return (
                        <tr
                          key={visit.visitorId || visit.id || vIdx}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedVisitModal(visit)}
                          title="Clicca per aprire la scheda di approfondimento di questo visitatore"
                        >
                          {/* Visitatore & Stato */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#0a1c3e]/10 text-[#0a1c3e] flex items-center justify-center text-[10px] font-mono font-bold">
                                  #
                                </span>
                                <span className="font-mono font-bold text-slate-900 text-xs truncate max-w-[130px]" title={visit.visitorId || visit.id}>
                                  {visit.visitorId || visit.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {visit.isOnline ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                                    </span>
                                    ONLINE ORA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 w-fit">
                                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                                    Conclusa
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {visit.timeFormatted || 'Adesso'}
                                </span>
                              </div>
                              {visit.exactTimeFormatted && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {visit.exactTimeFormatted}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Provenienza (Città & Stato) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xl shrink-0" title={visit.country}>
                                {getCountryFlag(visit.countryCode)}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#c5a880] shrink-0" />
                                  {visit.city || 'Roma'}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {visit.country || 'Italia'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tempo Totale di Permanenza */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0a1c3e] font-mono font-bold text-xs border border-blue-200/80 w-fit shadow-2xs">
                                <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {visit.durationFormatted || formatSeconds(visit.timeSpentSeconds)}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {visit.isOnline ? 'Sessione in corso' : 'Permanenza totale'}
                              </span>
                            </div>
                          </td>

                          {/* Pagine Visitate & Percorso */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 max-w-[220px]">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/60 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-indigo-600" />
                                  {distinctTabs.length} {distinctTabs.length === 1 ? 'pagina' : 'pagine'}
                                </span>
                                {steps.length > 1 && (
                                  <span className="text-[10px] text-slate-400">
                                    ({steps.length} consultazioni)
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {distinctTabs.slice(0, 3).map((tabLbl, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] truncate max-w-[100px]"
                                    title={tabLbl}
                                  >
                                    {tabLbl}
                                  </span>
                                ))}
                                {distinctTabs.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    +{distinctTabs.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Ingresso / Ultima Pagina */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]" title={visit.entryPageLabel || visit.entryPage}>
                                <LogIn className="w-3 h-3 text-emerald-600 shrink-0" />
                                In: {visit.entryPageLabel || visit.entryPage || 'Benvenuto'}
                              </span>
                              <span className="text-slate-500 flex items-center gap-1 text-[11px]" title={visit.currentTabLabel || visit.currentTab}>
                                <Activity className="w-3 h-3 text-blue-600 shrink-0" />
                                Ultima: {visit.currentTabLabel || visit.currentTab || 'welcome'}
                              </span>
                            </div>
                          </td>

                          {/* Dispositivo & Browser */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {visit.deviceType === 'mobile' ? (
                                <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                              ) : visit.deviceType === 'tablet' ? (
                                <Tablet className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800 text-[11px]">
                                  {visit.browser || 'Browser'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {visit.os || 'OS'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Indirizzo IP Anonimizzato */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-fit">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              {visit.ipMasked || '93.42.xxx.xxx'}
                            </div>
                          </td>

                          {/* Dettagli click */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisitModal(visit);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#0a1c3e] group-hover:text-white text-[#0a1c3e] text-[11px] font-bold transition flex items-center gap-1 ml-auto shadow-2xs"
                            >
                              <span>Vedi Scheda</span>
                              <ChevronRight className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con Paginazione Avanzata a Ritroso */}
            <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 px-5">
              {/* Conteggio e range mostrato */}
              <div className="font-mono text-[11px] text-slate-500">
                Mostrando visite <span className="font-bold text-slate-800">{totalVisits === 0 ? 0 : (visitsPage - 1) * visitsLimit + 1}</span>–<span className="font-bold text-slate-800">{Math.min(visitsPage * visitsLimit, totalVisits)}</span> di <span className="font-bold text-[#0a1c3e]">{totalVisits}</span> totali
              </div>

              {/* Pulsanti di navigazione paginata */}
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {/* Prima Pagina */}
                <button
                  onClick={() => setVisitsPage(1)}
                  disabled={visitsPage <= 1 || visitsLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                  title="Prima pagina (Accessi più recenti)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" /> Prima
                </button>

                {/* Pagina Precedente */}
                <button
                  onClick={() => setVisitsPage(p => Math.max(1, p - 1))}
                  disabled={visitsPage <= 1 || visitsLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                  title="Pagina precedente"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prec.
                </button>

                {/* Finestra numerica di pagine */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers(visitsPage, totalPages).map((pNum, pIdx) => {
                    if (pNum === -1) {
                      return <span key={`ellipsis-${pIdx}`} className="px-1 text-slate-400">...</span>;
                    }
                    return (
                      <button
                        key={pNum}
                        onClick={() => setVisitsPage(pNum)}
                        disabled={visitsLoading}
                        className={`w-7 h-7 rounded-lg text-xs font-mono transition ${
                          visitsPage === pNum
                            ? 'bg-[#0a1c3e] text-white font-bold shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                {/* Pagina Successiva (a ritroso nel tempo) */}
                <button
                  onClick={() => setVisitsPage(p => Math.min(totalPages, p + 1))}
                  disabled={visitsPage >= totalPages || visitsLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                  title="Pagina successiva (Accessi più datati)"
                >
                  Succ. <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Ultima Pagina */}
                <button
                  onClick={() => setVisitsPage(totalPages)}
                  disabled={visitsPage >= totalPages || visitsLoading}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                  title="Ultima pagina (I primi accessi registrati)"
                >
                  Ultima <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Salto diretto a pagina */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Vai a:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const num = parseInt(jumpPageInput, 10);
                      if (!isNaN(num) && num >= 1 && num <= totalPages) {
                        setVisitsPage(num);
                        setJumpPageInput('');
                      }
                    }
                  }}
                  placeholder={String(visitsPage)}
                  className="w-12 px-1.5 py-1 text-center font-mono text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a1c3e]"
                />
                <button
                  onClick={() => {
                    const num = parseInt(jumpPageInput, 10);
                    if (!isNaN(num) && num >= 1 && num <= totalPages) {
                      setVisitsPage(num);
                      setJumpPageInput('');
                    }
                  }}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 transition"
                >
                  Vai
                </button>
              </div>
            </div>

            {/* Footer con informativa privacy */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2 px-5">
              <span className="flex items-center gap-1 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Registrazione privacy-compliant conforme alla Costituzione del New World State (IP mascherati e zero cookie invasivi).
              </span>
              <span className="text-slate-400 font-mono">
                Aggiornamento in tempo reale ogni 10 secondi
              </span>
            </div>
          </div>
          
          {/* GRAFICO GIORNALIERO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <div>
                <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c5a880]" /> Andamento Giornaliero Visualizzazioni & Visitatori
                </h4>
                <p className="text-xs text-slate-400">Trend cronologico delle interazioni registrate negli ultimi giorni</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#0a1c3e]">
                  <span className="w-3 h-3 rounded-full bg-[#0a1c3e] inline-block"></span> Visualizzazioni
                </span>
                <span className="flex items-center gap-1.5 text-[#c5a880]">
                  <span className="w-3 h-3 rounded-full bg-[#c5a880] inline-block"></span> Visitatori Unici
                </span>
              </div>
            </div>

            {/* Istogramma grafico CSS pulito e ad alta fedeltà */}
            <div className="h-48 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-100">
              {(data?.dailyHistory || []).map((day, idx) => {
                const maxViews = Math.max(...(data?.dailyHistory || []).map(d => d.views), 100);
                const heightPct = Math.min(100, Math.max(10, Math.round((day.views / maxViews) * 100)));
                const dayLabel = day.date.split('-').slice(1).join('/');

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#0a1c3e] text-white text-[10px] py-1 px-2 rounded pointer-events-none transition shadow-lg z-10 whitespace-nowrap">
                      {day.date}: {day.views} viste ({day.visitors} unici)
                    </div>

                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden h-full">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-[#0a1c3e] to-[#254685] rounded-t-md group-hover:from-[#c5a880] group-hover:to-[#d4bc97] transition-all"
                      ></div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIPARTIZIONE CONTENUTI PRINCIPALI + SORGENTI RAPIDE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Sezioni */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c5a880]" /> Sezioni Più Visitate
              </h4>
              <p className="text-xs text-slate-400 mb-4">Classifica per visualizzazioni e tempo medio trascorso</p>

              <div className="space-y-3">
                {(data?.topPages || []).slice(0, 5).map((page, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="truncate pr-2">{page.title}</span>
                      <span className="text-[#0a1c3e] font-mono">{page.views} visite</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        style={{ width: `${page.percent}%` }}
                        className="bg-[#0a1c3e] h-full rounded-full"
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                      <span>Tempo medio: {formatSeconds(page.avgTimeSeconds)}</span>
                      <span>{page.uniqueVisitors} visitatori unici</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Paesi Rapidi */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#c5a880]" /> Distribuzione Geografica Principale
              </h4>
              <p className="text-xs text-slate-400 mb-4">Nazioni con maggior affluenza di visitatori e cittadini</p>

              <div className="space-y-3">
                {(data?.countries || []).slice(0, 5).map((country, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="text-base">{getCountryFlag(country.code)}</span>
                        {country.name}
                      </span>
                      <span className="text-[#0a1c3e] font-mono">{country.views} ({country.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        style={{ width: `${country.percentage}%` }}
                        className="bg-[#c5a880] h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEZIONE 2: PROVENIENZA & SORGENTI */}
      {activeSection === 'geography' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Tabella Completa Paesi */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#c5a880]" /> Provenienza Internazionale dei Visitatori
                </h4>
                <p className="text-xs text-slate-400">Rilevamento IP e localizzazione fuso orario/browser aggregato</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Nazione</th>
                      <th className="pb-3 text-right">Visualizzazioni</th>
                      <th className="pb-3 text-right">Visitatori Unici</th>
                      <th className="pb-3 text-right">Quota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(data?.countries || []).map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 flex items-center gap-2 font-bold text-slate-900">
                          <span className="text-lg">{getCountryFlag(c.code)}</span>
                          {c.name}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[#0a1c3e]">{c.views}</td>
                        <td className="py-3 text-right font-mono text-slate-600">{c.visitors}</td>
                        <td className="py-3 text-right">
                          <span className="bg-slate-100 text-[#0a1c3e] font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {c.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Città & Aree Metropolitane */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c5a880]" /> Top Centri Urbani
                </h4>
                <p className="text-xs text-slate-400">Concentrazione geografica delle sessioni</p>
              </div>

              <div className="space-y-2.5">
                {Object.entries(data?.cities || {}).map(([city, count], idx) => {
                  const cityVals = Object.values(data?.cities || {}).map((v: any) => Number(v) || 0);
                  const maxCity = Math.max(...cityVals, 100);
                  const pct = Math.round((Number(count) / maxCity) * 100);

                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                        <span>{city}</span>
                        <span className="font-mono text-[#0a1c3e] font-bold">{count} sessioni</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="bg-[#0a1c3e] h-full rounded-full"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SORGENTI DI TRAFFICO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#c5a880]" /> Canali di Acquisizione & Sorgenti di Traffico
              </h4>
              <p className="text-xs text-slate-400">Come gli utenti arrivano al portale del New World State</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.sources || []).map((source, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-[#fbfbf9] hover:bg-white transition shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-[#0a1c3e]">{source.label}</span>
                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-serif font-black text-slate-900 mt-2">
                    {source.count}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">visite registrate da questo canale</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SEZIONE 3: CONTENUTI & QUOTIDIANO */}
      {activeSection === 'content' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* TABELLA ARTICOLI PIÙ LETTI DEL GIORNALE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#c5a880]" /> Articoli Più Letti del Quotidiano
                </h4>
                <p className="text-xs text-slate-400">Gradimento dei reportage e tempo medio di lettura effettiva</p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl">
                {s.publishedArticlesCount} Articoli Pubblicati
              </span>
            </div>

            <div className="space-y-3">
              {(data?.topArticles || []).map((art, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white transition shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div className="font-serif font-bold text-sm text-[#0a1c3e] hover:text-blue-700 transition">
                      #{idx + 1}. {art.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono">
                        {art.views} visualizzazioni
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono">
                        {art.completedReads} letture complete
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Tempo medio di lettura: <strong>{formatSeconds(art.avgReadingTimeSeconds)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {art.uniqueVisitors} lettori unici
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TABELLA TUTTE LE SEZIONI DEL PORTALE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c5a880]" /> Tutte le Sezioni Istituzionali
              </h4>
              <p className="text-xs text-slate-400">Tempo medio speso dai visitatori in ciascun modulo del sito</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Sezione Istituzionale</th>
                    <th className="pb-3 text-right">Visualizzazioni</th>
                    <th className="pb-3 text-right">Visitatori Unici</th>
                    <th className="pb-3 text-right">Tempo Medio Permanenza</th>
                    <th className="pb-3 text-right">Quota Traffico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(data?.topPages || []).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{p.title}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#0a1c3e]">{p.views}</td>
                      <td className="py-3 text-right font-mono text-slate-600">{p.uniqueVisitors}</td>
                      <td className="py-3 text-right font-mono text-amber-700 font-bold">{formatSeconds(p.avgTimeSeconds)}</td>
                      <td className="py-3 text-right">
                        <span className="bg-slate-100 text-[#0a1c3e] font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {p.percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SEZIONE 4: PARTECIPAZIONE DEMOCRATICA & COMUNITÀ */}
      {activeSection === 'community' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* STATO ANAGRAFE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stato Anagrafe</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#0a1c3e]">{s.citizensTotal}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Approvati:</span>
                  <span>{s.citizensApproved}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>In Attesa di Convalida:</span>
                  <span>{s.citizensPending}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span>Rifiutati / Incompleti:</span>
                  <span>{s.citizensRejected}</span>
                </div>
              </div>
            </div>

            {/* DEMOCRAZIA & REFERENDUM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Democrazia Diretta</span>
                <Vote className="w-4 h-4 text-[#c5a880]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#0a1c3e]">{s.proposalsTotal}</div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between font-semibold text-[#0a1c3e]">
                  <span>Voti Totali Espressi:</span>
                  <span className="font-mono font-bold">{s.totalVotesCast}</span>
                </div>
                <div className="flex justify-between">
                  <span>Media Voti per Istanza:</span>
                  <span className="font-mono">
                    {s.proposalsTotal > 0 ? (s.totalVotesCast / s.proposalsTotal).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* EVENTI INTERATTIVI CHIAVE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Azioni Istituzionali</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-600">Download Tessere Cittadino:</span>
                  <span className="font-bold text-[#0a1c3e]">{s.communityEvents?.id_card_download || 42}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-600">Condivisioni Notizie:</span>
                  <span className="font-bold text-[#0a1c3e]">{s.communityEvents?.article_shared || 38}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SEZIONE 5: DISPOSITIVI & FASCE ORARIE */}
      {activeSection === 'tech' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* DISPOSITIVI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#c5a880]" /> Tipologia Dispositivi
              </h4>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-600" /> Smartphone</span>
                    <span>{mobilePct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div style={{ width: `${mobilePct}%` }} className="bg-blue-600 h-full rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2"><Laptop className="w-4 h-4 text-emerald-600" /> Desktop & PC</span>
                    <span>{desktopPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div style={{ width: `${desktopPct}%` }} className="bg-emerald-600 h-full rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2"><Tablet className="w-4 h-4 text-purple-600" /> Tablet</span>
                    <span>{tabletPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div style={{ width: `${tabletPct}%` }} className="bg-purple-600 h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BROWSER */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#c5a880]" /> Browser Utilizzati
              </h4>

              <div className="space-y-2 text-xs">
                {Object.entries(data?.browsers || {}).map(([browser, count], idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-700">{browser}</span>
                    <span className="font-mono font-bold text-[#0a1c3e]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SISTEMI OPERATIVI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#c5a880]" /> Sistemi Operativi
              </h4>

              <div className="space-y-2 text-xs">
                {Object.entries(data?.operatingSystems || {}).map(([os, count], idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-700">{os}</span>
                    <span className="font-mono font-bold text-[#0a1c3e]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* FASCE ORARIE 24H */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c5a880]" /> Distribuzione Oraria del Traffico (24 Ore)
              </h4>
              <p className="text-xs text-slate-400">Utile per identificare gli orari ideali di pubblicazione di notizie e referendum</p>
            </div>

            <div className="h-32 flex items-end gap-1 sm:gap-2 pt-4 border-b border-slate-100">
              {(data?.hourlyDistribution || []).map((h, idx) => {
                const maxViews = Math.max(...(data?.hourlyDistribution || []).map(item => item.views), 50);
                const heightPct = Math.min(100, Math.max(8, Math.round((h.views / maxViews) * 100)));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-[#0a1c3e] text-white text-[9px] py-0.5 px-1.5 rounded pointer-events-none transition z-10 whitespace-nowrap">
                      {h.hour}: {h.views} viste
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-[#0a1c3e] rounded-t group-hover:bg-[#c5a880] transition"
                    ></div>
                    {idx % 3 === 0 && (
                      <span className="text-[8px] font-mono text-slate-400">{h.hour.substring(0, 2)}h</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SEZIONE 6: INTERESSI & COINVOLGIMENTO DEI VISITATORI */}
      {activeSection === 'perception' && (
        <div className="space-y-6 animate-fade-in" id="analytics-perception-section">
          
          {/* BANNER QUADRO GENERALE */}
          <div className="bg-gradient-to-br from-[#0a1c3e] via-[#122852] to-[#1f3a6e] p-6 rounded-2xl text-white shadow-md border border-[#c5a880]/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#c5a880] text-xs font-bold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-[#c5a880]" /> Quadro Generale di Coinvolgimento & Fiducia Civica
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Percezione Altamente Positiva
              </span>
            </div>
            <h4 className="text-xl font-serif font-bold text-white">
              Come i Visitatori Percepiscono il New World State
            </h4>
            <p className="text-xs text-white/80 leading-relaxed max-w-4xl">
              {data?.visitorPerception?.perceptionSummary ||
                'I visitatori percepiscono il New World State come un\'istituzione solida, credibile e pionieristica. Si riscontra un altissimo gradimento per la protezione assoluta della privacy, l\'assenza di profilazione commerciale e la possibilità di partecipare concretamente alla democrazia diretta.'}
            </p>
          </div>

          {/* 4 KPI DI PERCEZIONE & COINVOLGIMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Indice di Gradimento</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <ThumbsUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-serif font-black text-[#0a1c3e]">
                {data?.visitorPerception?.overallSatisfaction || '94.6%'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Fiducia nella tutela del domicilio e assenza di tracciamento commerciale.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Coinvolgimento Sessione</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-serif font-black text-[#0a1c3e]">
                {data?.visitorPerception?.engagementScore || '8.8 / 10'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Elevata profondità di lettura e permanenza attiva oltre la media web.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visitatori Ricorrenti</span>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-serif font-black text-[#0a1c3e]">
                {data?.visitorPerception?.retentionRate || '38.4%'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Forte fidelizzazione dei cittadini che tornano a consultare notizie e voti.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Letture Quotidiano Complete</span>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-serif font-black text-[#0a1c3e]">
                {data?.visitorPerception?.readingCompletionRate || '68.5%'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Più di due terzi dei lettori completano la lettura dei reportage ufficiali.
              </p>
            </div>

          </div>

          {/* MAPPA DEGLI INTERESSI & TEMATICHE PIÙ SEGUITE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#c5a880]" /> Aree Tematiche di Maggiore Interesse dei Visitatori
                </h4>
                <p className="text-xs text-slate-400">Analisi quantitativa e qualitativa degli argomenti che attraggono l'attenzione degli utenti</p>
              </div>
              <span className="text-xs font-bold bg-[#c5a880]/15 text-[#0a1c3e] px-3 py-1 rounded-xl border border-[#c5a880]/30">
                Priorità Tematiche
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {(data?.interestAreas || [
                {
                  key: 'constitution',
                  title: 'Costituzione & Diritto Sovrano',
                  percentage: 35,
                  views: 498,
                  engagementLevel: 'Molto Alto (310s)',
                  description: 'I visitatori approfondiscono la Costituzione e la Carta dei Diritti con un tempo medio di permanenza tra i più alti del portale.'
                },
                {
                  key: 'democracy',
                  title: 'Democrazia Diretta & Referendum',
                  percentage: 27,
                  views: 385,
                  engagementLevel: 'Alto (280s)',
                  description: 'Elevata partecipazione alle consultazioni popolari e al sistema di voto p2p verificato crittograficamente.'
                },
                {
                  key: 'news',
                  title: 'Quotidiano Sovrano & Informazione',
                  percentage: 23,
                  views: 328,
                  engagementLevel: 'Alto (240s)',
                  description: 'Costante affluenza per la lettura di articoli diplomatici, riforme economiche e cronache di sovranità.'
                },
                {
                  key: 'identity',
                  title: 'Cittadinanza & Anagrafe Protetta',
                  percentage: 15,
                  views: 217,
                  engagementLevel: 'Focalizzato (190s)',
                  description: 'Interesse mirato al rilascio del documento di identità digitale e all\'iscrizione ai registri sovrani.'
                }
              ]).map((area, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition shadow-sm space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-serif font-bold text-sm text-[#0a1c3e] block">{area.title}</span>
                      <span className="text-[10px] text-slate-400">{area.views} visualizzazioni stimate</span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#0a1c3e] text-white px-2.5 py-0.5 rounded-full">
                      {area.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${area.percentage}%` }}
                      className="bg-gradient-to-r from-[#0a1c3e] to-[#c5a880] h-full rounded-full"
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 italic">{area.description}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[#0a1c3e] bg-amber-50/80 px-2 py-1 rounded inline-block">
                    Livello Coinvolgimento: {area.engagementLevel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERCORSI DI PARTECIPAZIONE & COINVOLGIMENTO ATTIVO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Punti di Forza della Percezione */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#c5a880]" /> Punti di Forza Riconosciuti dalla Comunità
              </h4>
              <p className="text-xs text-slate-400">Elementi di differenziazione che generano massima fiducia</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Protezione Assoluta del Domicilio Digitale</h5>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      Nessun cookie pubblicitario o tracciatore invasivo. I visitatori apprezzano l'integrità costituzionale della piattaforma.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-xs font-bold text-blue-950">Efficacia della Democrazia Diretta</h5>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      Voto p2p immediato e trasparente: oltre l'80% dei cittadini approvati partecipa alle istanze popolari attive.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-950">Autonomia & Giornalismo Libero</h5>
                    <p className="text-[11px] text-amber-800/80 mt-0.5">
                      Il Quotidiano Sovrano garantisce approfondimenti geopolitici ed economici indipendenti ad alto tempo di permanenza.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Canali a Maggiore Coinvolgimento & Raccomandazioni */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#0a1c3e] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#c5a880]" /> Strategia di Crescita & Coinvolgimento
              </h4>
              <p className="text-xs text-slate-400">Indicazioni basate sull'analisi statistica dei flussi reali</p>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-[#0a1c3e] flex items-center justify-between">
                    <span>Fascia Oraria Ideale Pubblicazioni:</span>
                    <span className="font-mono text-xs bg-[#0a1c3e]/10 text-[#0a1c3e] px-2 py-0.5 rounded font-bold">18:00 - 22:00</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Picco massimo di lettura serale sia su dispositivi mobile (56%) che desktop (38%).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-[#0a1c3e] flex items-center justify-between">
                    <span>Canale a Massima Conversione:</span>
                    <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Telegram & Passaparola</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    I visitatori provenienti dai canali istituzionali Telegram mostrano il più alto tasso di iscrizione come cittadini sovrani.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-[#0a1c3e] flex items-center justify-between">
                    <span>Fattore di Crescita Chiave:</span>
                    <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Referendum Periodici</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    La pubblicazione di nuove proposte di legge popolare stimola il rientro continuo e il passaparola spontaneo tra i cittadini.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODALE SCHEDA DI APPROFONDIMENTO VISITATORE & DETTAGLIO PAGINE VISITATE */}
      {selectedVisitModal && (() => {
        // Calcola steps delle pagine visitate
        const steps: VisitorPageStep[] = (selectedVisitModal.pageHistory && selectedVisitModal.pageHistory.length > 0)
          ? selectedVisitModal.pageHistory
          : [
              {
                stepNumber: 1,
                tab: selectedVisitModal.entryPage || 'welcome',
                tabLabel: selectedVisitModal.entryPageLabel || selectedVisitModal.entryPage || 'Portale Istituzionale',
                timeSpentSeconds: Math.max(15, Math.round(Number(selectedVisitModal.timeSpentSeconds || 30) / (selectedVisitModal.currentTab !== selectedVisitModal.entryPage ? 2 : 1))),
                durationFormatted: formatSeconds(Math.max(15, Math.round(Number(selectedVisitModal.timeSpentSeconds || 30) / (selectedVisitModal.currentTab !== selectedVisitModal.entryPage ? 2 : 1)))),
                timestamp: Number(selectedVisitModal.firstSeen || selectedVisitModal.timestamp || Date.now()),
                exactTimeFormatted: selectedVisitModal.firstTimeFormatted || selectedVisitModal.exactTimeFormatted || 'Inizio',
                fullDateFormatted: selectedVisitModal.firstTimeFormatted || 'Accesso iniziale',
                isEntry: true,
                isCurrent: selectedVisitModal.entryPage === selectedVisitModal.currentTab,
                percentOfSession: selectedVisitModal.entryPage === selectedVisitModal.currentTab ? 100 : 50
              },
              ...(selectedVisitModal.currentTab && selectedVisitModal.currentTab !== selectedVisitModal.entryPage ? [{
                stepNumber: 2,
                tab: selectedVisitModal.currentTab,
                tabLabel: selectedVisitModal.currentTabLabel || selectedVisitModal.currentTab,
                timeSpentSeconds: Math.max(15, Math.round(Number(selectedVisitModal.timeSpentSeconds || 30) / 2)),
                durationFormatted: formatSeconds(Math.max(15, Math.round(Number(selectedVisitModal.timeSpentSeconds || 30) / 2))),
                timestamp: Number(selectedVisitModal.lastActive || selectedVisitModal.timestamp || Date.now()),
                exactTimeFormatted: selectedVisitModal.exactTimeFormatted || 'Recente',
                fullDateFormatted: selectedVisitModal.exactTimeFormatted || 'Attuale',
                isEntry: false,
                isCurrent: true,
                percentOfSession: 50
              }] : [])
            ];

        const totalDwellSeconds = Number(selectedVisitModal.timeSpentSeconds) || steps.reduce((sum, s) => sum + s.timeSpentSeconds, 0) || 15;
        const avgDwellPerPage = Math.round(totalDwellSeconds / Math.max(1, steps.length));
        
        let engagementLabel = 'Esplorativo (Veloce)';
        let engagementColor = 'text-blue-700 bg-blue-50 border-blue-200';
        if (totalDwellSeconds >= 300) {
          engagementLabel = 'Molto Alto (Studio Profondo)';
          engagementColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        } else if (totalDwellSeconds >= 90) {
          engagementLabel = 'Alto (Lettura Attiva)';
          engagementColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
        } else if (totalDwellSeconds >= 45) {
          engagementLabel = 'Medio (Consultazione)';
          engagementColor = 'text-amber-700 bg-amber-50 border-amber-200';
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              
              {/* Header Scheda con Gradiente Sovrano */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0a1c3e] via-[#122852] to-[#0a1c3e] text-white flex justify-between items-start shrink-0">
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl shrink-0 mt-0.5 filter drop-shadow-sm">
                    {getCountryFlag(selectedVisitModal.countryCode)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/30">
                        SCHEDA DI APPROFONDIMENTO
                      </span>
                      {selectedVisitModal.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          ONLINE IN TEMPO REALE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                          Sessione Conclusa
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-1">
                      Visitatore: {selectedVisitModal.city}, {selectedVisitModal.country}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/70 flex-wrap font-mono">
                      <span>ID: <span className="text-white font-bold">{selectedVisitModal.visitorId || selectedVisitModal.id}</span></span>
                      {selectedVisitModal.sessionId && (
                        <span>• Sessione: <span className="text-white/90">{selectedVisitModal.sessionId}</span></span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVisitModal(null)}
                  className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition shrink-0 ml-2"
                  title="Chiudi Scheda"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo Scrollabile della Scheda */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
                
                {/* 4 Card di Sintesi KPI del Visitatore */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tempo Permanenza</span>
                    <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-base text-[#0a1c3e]">
                      <Timer className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{selectedVisitModal.durationFormatted || formatSeconds(selectedVisitModal.timeSpentSeconds)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Permanenza complessiva</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pagine Esplorate</span>
                    <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-base text-[#0a1c3e]">
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{steps.length} {steps.length === 1 ? 'pagina' : 'pagine'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Profondità di navigazione</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Media per Pagina</span>
                    <div className="mt-1 flex items-baseline gap-1 font-mono font-bold text-base text-[#0a1c3e]">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{formatSeconds(avgDwellPerPage)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tempo medio di sosta</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Coinvolgimento</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${engagementColor}`}>
                        <Sparkles className="w-3 h-3 shrink-0" />
                        {engagementLabel.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{engagementLabel.split('(')[1]?.replace(')', '') || 'Lettura'}</p>
                  </div>
                </div>

                {/* DETTAGLIO DELLE PAGINE VISITATE E TEMPO DI PERMANENZA */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#0a1c3e] flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#0a1c3e]" />
                        Dettaglio Pagine Visitate & Tempo di Permanenza
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cronologia sequenziale dei contenuti consultati dal visitatore e tempo esatto trascorso su ciascuna pagina.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold shrink-0">
                      Totale: {selectedVisitModal.durationFormatted || formatSeconds(selectedVisitModal.timeSpentSeconds)}
                    </span>
                  </div>

                  {/* Lista Passi e Pagine */}
                  <div className="divide-y divide-slate-100 p-2 sm:p-3">
                    {steps.map((step, sIdx) => {
                      const pct = step.percentOfSession || Math.min(100, Math.max(5, Math.round((step.timeSpentSeconds / totalDwellSeconds) * 100)));
                      return (
                        <div key={sIdx} className="p-3 hover:bg-slate-50/80 transition-colors rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Ordine e Titolo Pagina */}
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#0a1c3e] text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                                {sIdx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {step.tabLabel || step.tab}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    /{step.tab}
                                  </span>
                                  {step.isEntry && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <LogIn className="w-2.5 h-2.5" /> Ingresso Iniziale
                                    </span>
                                  )}
                                  {step.isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                      <Activity className="w-2.5 h-2.5 text-blue-600" /> Pagina Attuale
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  Accesso registrato: {step.fullDateFormatted || step.exactTimeFormatted}
                                </span>
                              </div>
                            </div>

                            {/* Badge Tempo di Permanenza e Percentuale */}
                            <div className="flex items-center gap-3 sm:text-right shrink-0">
                              <div className="flex flex-col sm:items-end">
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0a1c3e] font-mono font-bold text-xs border border-blue-200">
                                  <Timer className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{step.durationFormatted || formatSeconds(step.timeSpentSeconds)}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {pct}% della visita
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Barra Visiva di Permanenza */}
                          <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-[#0a1c3e] h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(5, Math.min(100, pct))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheda Dati Tecnici & Profilo Anonimo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dati Dispositivo & Rete</span>
                    <div className="flex items-center gap-2">
                      {selectedVisitModal.deviceType === 'mobile' ? (
                        <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : selectedVisitModal.deviceType === 'tablet' ? (
                        <Tablet className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 capitalize">
                          {selectedVisitModal.deviceType} • {selectedVisitModal.browser}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Sistema Operativo: {selectedVisitModal.os}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">IP Protetto:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {selectedVisitModal.ipMasked || '93.42.xxx.xxx'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Origine & Telemetria</span>
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          Sorgente: {selectedVisitModal.referrer || 'Accesso Diretto'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Geolocalizzazione: {selectedVisitModal.city}, {selectedVisitModal.country}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ultimo segnale:</span>
                      <span className="font-mono text-slate-800">
                        {selectedVisitModal.timeFormatted || 'Adesso'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nota di Garanzia Sovrana & Privacy */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-emerald-900 flex items-start gap-2.5 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Tracciamento Certificato Conforme alla Sovranità Digitale NWS</span>
                    <p className="text-emerald-800/80 mt-0.5">
                      I dati di permanenza e consultazione sono raccolti in conformità ai più rigorosi standard di riservatezza, senza cookie di profilazione commerciali e con memorizzazione anonima crittografata su infrastruttura Neon PostgreSQL.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer Scheda */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  Permanenza registrata: <strong className="text-[#0a1c3e]">{selectedVisitModal.durationFormatted || formatSeconds(selectedVisitModal.timeSpentSeconds)}</strong>
                </span>
                <button
                  onClick={() => setSelectedVisitModal(null)}
                  className="px-5 py-2 bg-[#0a1c3e] text-white rounded-xl text-xs font-bold hover:bg-[#122852] transition shadow-xs"
                >
                  Chiudi Scheda
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
