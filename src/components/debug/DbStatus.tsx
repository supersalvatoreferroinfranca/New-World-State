import React, { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { safeFetch } from '../../services/api';

export default function DbStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'unconfigured'>('loading');
  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await safeFetch('/api/db-status');
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setStatus(data.status);
          if (data.status === 'error') {
            setErrorInfo(data.message || 'Database non configurato correttamente');
          }
        } else {
          const text = await res.text();
          setStatus('error');
          setErrorInfo(`Risposta non valida (${res.status}): ${text.slice(0, 100)}...`);
        }
      } catch (e: any) {
        setStatus('error');
        setErrorInfo(`Errore di rete: ${e.message}`);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-blue/10 shadow-sm text-[10px] uppercase tracking-wider font-bold">
      {status === 'loading' && (
        <>
          <Loader2 className="w-3 h-3 text-brand-blue animate-spin" />
          <span className="text-brand-blue">Verifica Database...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-green-600">Database Neon: Connesso</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-red-600">Database Neon: {errorInfo}</span>
          <a 
            href="https://nws-wk.supersalvatoreferroinfranca.workers.dev/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="ml-2.5 px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-[8px] normal-case tracking-normal transition-colors"
          >
            Apri Test Diagnostico Worker &rarr;
          </a>
        </>
      )}
      {status === 'unconfigured' && (
        <>
          <Database className="w-3 h-3 text-amber-500" />
          <span className="text-amber-600">Database: Non configurato</span>
        </>
      )}
    </div>
  );
}
