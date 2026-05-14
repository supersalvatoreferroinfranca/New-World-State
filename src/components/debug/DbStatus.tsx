import React, { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function DbStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'unconfigured'>('loading');
  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const API_BASE = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev';
        const res = await fetch(`${API_BASE}/api/db-status`);
        const data = await res.json();
        setStatus(data.status);
        if (data.status === 'error') setErrorInfo(data.code || data.message);
      } catch (e) {
        setStatus('error');
        setErrorInfo('Server unreachable');
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
