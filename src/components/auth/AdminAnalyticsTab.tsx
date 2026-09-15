/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Consolle Statistiche, Telemetria & Community Analytics
 */

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface AdminAnalyticsTabProps {
  adminPasswordValue: string;
  showAlert: (type: 'success' | 'error' | 'warning', message: string) => void;
}

interface AnalyticsData {
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
}

export default function AdminAnalyticsTab({ adminPasswordValue, showAlert }: AdminAnalyticsTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [activeSection, setActiveSection] = useState<'overview' | 'geography' | 'content' | 'community' | 'tech'>('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/overview?range=${timeRange}`, {
        headers: {
          'x-admin-password': adminPasswordValue
        }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        showAlert('error', json.message || 'Errore nel caricamento delle statistiche.');
      }
    } catch (err: any) {
      showAlert('error', 'Impossibile connettersi al server per recuperare le statistiche.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleExportData = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/export`, {
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
    } catch (e) {
      showAlert('error', 'Errore durante il download del report.');
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
            onClick={fetchAnalytics}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-kpi-grid">
        
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
            {s.totalPageViews} visualizzazioni pagina totali
          </p>
        </div>

        {/* KPI 2: Tempo Medio di Permanenza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tempo Medio Permanenza</span>
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
            Tempo complessivo attivo: {Math.round(s.totalTimeSpentSeconds / 3600)} ore
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
              Rimbalzo: {s.bounceRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Profondità di lettura media del portale
          </p>
        </div>

        {/* KPI 4: Comunità & Cittadinanza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0a1c3e]/30 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cittadini Registrati</span>
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
            {s.totalVotesCast} voti espressi nei referendum
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
      </div>

      {/* SEZIONE 1: PANORAMICA TRAFFICO & CRONOLOGIA */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
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
                  const maxCity = Math.max(...Object.values(data?.cities || {}), 100);
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

    </div>
  );
}
