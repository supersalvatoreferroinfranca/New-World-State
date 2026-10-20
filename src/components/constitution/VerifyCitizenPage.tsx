import React, { useEffect, useState } from 'react';
import { safeFetch } from '../../services/api';
import { ShieldCheck, ShieldAlert, Shield, Loader2, ArrowLeft, RefreshCw, User } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface CitizenData {
  id: string | number;
  firstName: string;
  surname: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  citizenCode: string;
  gender: string;
  status: string;
  arubaPhotoUrl: string;
  documentHash: string;
}

export default function VerifyCitizenPage() {
  const { language } = useI18n();
  const isEn = language === 'en';
  
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [citizen, setCitizen] = useState<CitizenData | null>(null);

  function extractCleanCitizenKey(rawKey: string): string {
    if (!rawKey) return '';
    let str = String(rawKey).trim().replace(/^["'\s]+|["'\s]+$/g, '');
    if (str.includes('verify') || str.includes('http://') || str.includes('https://') || str.includes('?') || str.includes('=')) {
      try {
        const parsedUrl = new URL(str.startsWith('http') ? str : `https://newworldstate.cloud/${str.replace(/^\//, '')}`);
        const paramCode = parsedUrl.searchParams.get('id') || 
                          parsedUrl.searchParams.get('ID') || 
                          parsedUrl.searchParams.get('code') || 
                          parsedUrl.searchParams.get('CODE') || 
                          parsedUrl.searchParams.get('c') || 
                          parsedUrl.searchParams.get('C') ||
                          parsedUrl.searchParams.get('citizenCode') ||
                          parsedUrl.searchParams.get('citizencode');
        if (paramCode) return paramCode.trim();
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        const verifyIdx = pathParts.indexOf('verify');
        if (verifyIdx !== -1 && pathParts[verifyIdx + 1]) {
          return decodeURIComponent(pathParts[verifyIdx + 1]).trim();
        }
      } catch {}
    }
    const matchId = str.match(/(?:[?&](?:id|ID|code|CODE|c|C|citizenCode|citizencode)=|id=|\/verify\/)([A-Za-z0-9\-]+)/i);
    if (matchId && matchId[1]) return matchId[1].trim();
    // Remove query string or slash if present
    str = str.replace(/[?#].*$/, '').replace(/\/$/, '');
    return str.trim();
  }

  useEffect(() => {
    // Parse ID or Code from search parameters or pathname
    const params = new URLSearchParams(window.location.search);
    let idParam = params.get('id') || 
                  params.get('ID') || 
                  params.get('code') || 
                  params.get('CODE') || 
                  params.get('c') || 
                  params.get('C') ||
                  params.get('citizenCode') ||
                  params.get('citizencode') || '';
    if (!idParam && window.location.pathname.startsWith('/verify/')) {
      idParam = decodeURIComponent(window.location.pathname.replace(/^\/verify\/?/, '').split('/')[0]).trim();
    }
    const cleanId = extractCleanCitizenKey(idParam);
    setId(cleanId);

    if (!cleanId) {
      setLoading(false);
      setError(
        isEn 
          ? 'Missing citizen identifier key' 
          : 'Parametro o chiave identificativa mancante per la verifica'
      );
      return;
    }

    fetchVerification(cleanId);
  }, []);

  const fetchVerification = async (citizenId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanKey = extractCleanCitizenKey(citizenId);
      const res = await safeFetch(`/api/verify?id=${encodeURIComponent(cleanKey)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            isEn 
              ? 'Citizen warning: code not registered in central registry' 
              : 'Avviso di sicurezza: codice non censito o non registrato nell\'Anagrafe Centrale'
          );
        }
        throw new Error(
          isEn 
            ? `Server returned code ${res.status}` 
            : `Il server ha risposto con codice ${res.status}`
        );
      }
      const data = await res.json();
      if (data.success && data.citizen) {
        setCitizen(data.citizen);
      } else {
        throw new Error(
          isEn 
            ? 'Failed to decode verification payload' 
            : 'Firma di crittografia invalida nel pacchetto di risposta'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
        <p className="text-sm font-mono text-brand-blue/60 uppercase tracking-widest animate-pulse">
          {isEn ? 'CONTACTING FEDERAL REGISTRY...' : 'INTERROGAZIONE REGISTRO FEDERALE...'}
        </p>
      </div>
    );
  }

  if (error || !id) {
    const isCounterfeit = error?.includes('contraffatto') || error?.includes('counterfeit');
    
    return (
      <div className="max-w-md mx-auto p-4 md:p-6 mb-12" id="verify-error-view">
        <div className={`bg-white rounded-3xl border-2 ${isCounterfeit ? 'border-red-500/30 shadow-red-500/5' : 'border-slate-200/50'} shadow-2xl p-6 md:p-8 space-y-6 text-center overflow-hidden relative`}>
          {isCounterfeit && (
            <div className="absolute top-0 left-0 right-0 bg-red-600/10 text-red-600 text-[10px] font-mono tracking-widest py-2 uppercase font-bold border-b border-red-500/20">
              {isEn ? 'SECURITY DIVISION ALERT' : 'DIVISIONE SICUREZZA - ALLERTA'}
            </div>
          )}
          
          <div className="pt-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-bold ${isCounterfeit ? 'bg-red-50 text-red-500 border border-red-500/20' : 'bg-amber-50 text-amber-500 border border-amber-500/20'}`}>
              !
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-serif text-slate-950 font-bold leading-tight">
              {isCounterfeit 
                ? (isEn ? 'COUNTERFEIT WARNING' : 'AVVISO CONTRAFFATTURA') 
                : (isEn ? 'MISSING PARAMETER' : 'PARAMETRO MANCANTE')}
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
              {isCounterfeit
                ? (isEn 
                  ? `The citizen code "${id}" was not resolved in our secure database. Handheld or printed credentials presenting this key are legally invalid.` 
                  : `Il codice cittadino "${id}" inserito o scansionato non risulta inserito o approvato nell'Anagrafe Centrale. Il documento presenta un severo rischio di contraffazione.`)
                : (isEn
                  ? 'No valid citizen code or identifier was supplied.'
                  : 'Nessun codice cittadino specificato per la verifica.')}
            </p>
          </div>

          {isCounterfeit && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-left text-[11px] text-slate-500 space-y-2 leading-relaxed">
              <span className="font-bold text-red-800 uppercase block tracking-wider mb-1 text-[10px]">
                {isEn ? 'AGENT PROTOCOLS' : 'ISTRUZIONI PER FUNZIONARI'}
              </span>
              <p>🛡️ {isEn ? 'Retain physical card if scan fails.' : 'Trattieni la tessera cartacea per controlli.'}</p>
              <p>🛡️ {isEn ? 'Sovereign signatures are cryptographically cross-verified.' : 'Le firme verificate garantiscono l\'integrità penale.'}</p>
            </div>
          )}

          <div className="pt-2">
            <a 
              href="/" 
              className="inline-flex w-full items-center justify-center bg-brand-blue text-[#f7f5f0] font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:opacity-90 transition duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> {isEn ? 'Back to Home' : 'Torna alla Home'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Approved and verified Citizen details successfully found!
  const isApproved = citizen?.status === 'approved';
  const cleanHash = (citizen?.documentHash || 'VALIDATED').slice(0, 16).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 mb-12" id="verify-success-view">
      <div className="bg-white rounded-3xl border border-brand-gold/20 shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        
        {/* Verification stamp banner */}
        <div className={`${isApproved ? 'bg-emerald-500/10 border-b border-emerald-500/15' : 'bg-amber-500/10 border-b border-amber-500/20'} absolute top-0 left-0 right-0 py-2.5 px-4 text-center`}>
          <span className={`text-[10px] font-mono uppercase tracking-widest ${isApproved ? 'text-emerald-600' : 'text-amber-700'} font-bold inline-flex items-center gap-1.5`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {isApproved 
              ? (isEn ? 'AUTHENTIC CITIZENSHIP RECORD • APPROVED' : 'REGISTRO CITTADINANZA AUTENTICO • APPROVATO')
              : (isEn ? 'AUTHENTIC REGISTRATION • VALIDATION IN PROGRESS' : 'REGISTRAZIONE AUTENTICA • IN FASE DI VALIDAZIONE')}
          </span>
        </div>

        {/* Header verification result */}
        <div className="text-center pt-6 space-y-2">
          <div className={`w-14 h-14 ${isApproved ? 'bg-emerald-50 text-emerald-500 border border-emerald-500/20' : 'bg-amber-50 text-amber-600 border border-amber-500/25'} rounded-full flex items-center justify-center mx-auto text-2xl font-bold`}>
            {isApproved ? '✓' : '⏳'}
          </div>
          <div>
            <h2 className="text-2xl font-serif text-slate-900 leading-tight">
              {isApproved 
                ? (isEn ? 'Federal Certificate Verified' : 'Anagrafe Federale Validata')
                : (isEn ? 'Registration Under Validation' : 'Registrazione Autentica in Convalida')}
            </h2>
            <p className={`text-[10px] ${isApproved ? 'text-brand-gold' : 'text-amber-600'} uppercase tracking-widest font-mono font-bold`}>
              {isApproved 
                ? (isEn ? 'Status: Active & Validated Citizen' : 'Stato: Cittadino Attivo e Convalidato')
                : (isEn ? 'Status: Registered Member • Pending Final Review' : 'Stato: Membro Registrato • Pratica in Approvazione Finale')}
            </p>
          </div>
        </div>

        {/* Context Guidelines */}
        <div className={`${isApproved ? 'bg-brand-parchment/30 border-brand-gold/10 text-brand-blue/70' : 'bg-amber-50 border-amber-200 text-amber-900'} rounded-2xl p-4 border text-xs leading-relaxed`}>
          <strong className={`${isApproved ? 'text-brand-blue' : 'text-amber-900'} block mb-1`}>
            {isApproved 
              ? (isEn ? 'DATA INTEGRITY CHECK:' : 'CONFRONTO ANTIFRAUDE:') 
              : (isEn ? 'AUTHENTIC RECORD NOTICE:' : 'CONFERMA REGISTRAZIONE AUTENTICA:')}
          </strong>
          {isApproved 
            ? (isEn 
              ? 'Compare physical coordinates on the printed card with real-time variables below. Digital photographs must perfectly correspond to ensure compliance.'
              : 'Riscontra i dati anagrafici stampati sulla tessera cartacea con le risultanze estratte in tempo reale dal server centrale. Verifica che la fototessera coincida.')
            : (isEn
              ? 'This citizen is correctly enrolled in the New World State Central Registry. The document is authentic and currently undergoing final review by Digital Custodians. No counterfeit risk.'
              : 'Questo cittadino è regolarmente registrato nell\'Anagrafe Centrale di New World State. Il documento è autentico ed è in corso di convalida finale da parte dei Custodi Digitali. Nessun rischio di contraffazione.')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
          
          {/* Photo area */}
          <div className="md:col-span-4 flex flex-col items-center space-y-2">
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              {isEn ? 'REGISTRY PHOTO' : 'FOTOTESSERA DATABASE'}
            </div>
            <div className="w-32 h-44 rounded-2xl border-2 border-brand-gold/20 overflow-hidden bg-brand-parchment/10 shadow-lg flex items-center justify-center relative bg-slate-50">
              {citizen?.arubaPhotoUrl ? (
                <img 
                  src={citizen.arubaPhotoUrl} 
                  className="w-full h-full object-cover" 
                  alt="Citizen Dossier Photo" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="text-center p-3 text-slate-400">
                  <User className="w-8 h-8 mx-auto opacity-30" />
                  <span className="text-[8px] text-slate-400/80 font-mono block mt-1">Photo pending</span>
                </div>
              )}
            </div>
            <span className={`text-[10px] ${isApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-700'} py-1 px-3 rounded-full font-mono font-bold tracking-wider uppercase`}>
              {isApproved 
                ? (isEn ? 'Verified Identity' : 'Identità Verificata')
                : (isEn ? 'Enrolled Member' : 'Membro Registrato')}
            </span>
          </div>

          {/* Fields Area */}
          <div className="md:col-span-8 space-y-4">
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              {isEn ? 'BIOMETRICS & REGISTRATION' : 'DETTAGLI CITTADINANZA'}
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Cognome / Surname</span>
                  <strong className="text-slate-900 text-sm font-bold font-serif select-all">
                    {(citizen?.surname || '').toUpperCase()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Nome / Given Names</span>
                  <strong className="text-slate-900 text-sm font-bold font-serif select-all">
                    {(citizen?.firstName || '').toUpperCase()}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Nato il / DOB</span>
                  <strong className="text-slate-800 font-mono select-all">
                    {citizen?.birthDate || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Luogo di Nascita / Place of Birth</span>
                  <strong className="text-slate-800 select-all leading-tight block">
                    {(citizen?.birthPlace || '').toUpperCase()} ({(citizen?.birthCountry || '').toUpperCase()})
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Codice Cittadino / Citizen Code</span>
                  <strong className="text-brand-gold font-bold text-sm font-mono tracking-wider select-all">
                    {citizen?.citizenCode || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Genere / Sex</span>
                  <strong className="text-slate-800 select-all uppercase font-semibold">
                    {citizen?.gender || '-'}
                  </strong>
                </div>
              </div>

              <div className="pt-1 select-all">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">
                  {isEn ? 'Cryptographic Stamp' : 'Firma Algoritmica'}
                </span>
                <strong className="text-slate-400 font-mono text-[9px] block overflow-x-auto whitespace-nowrap bg-white p-2 border border-slate-100 rounded-lg mt-1 uppercase leading-none">
                  HASH: {citizen?.documentHash || 'VALIDATED'}
                </strong>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-2 text-center">
          <a 
            href="/" 
            className="inline-flex w-full items-center justify-center bg-brand-blue text-[#f7f5f0] font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-brand-blue/90 shadow transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> {isEn ? 'Cancel & Return Home' : 'Torna alla Pagina Principale'}
          </a>
        </div>

      </div>
    </div>
  );
}
