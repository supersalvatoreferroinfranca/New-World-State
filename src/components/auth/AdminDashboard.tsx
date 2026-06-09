import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../services/api';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Eye, 
  RotateCw, 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  ExternalLink,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';

interface Citizen {
  id: string | number;
  firstName: string;
  surname: string;
  username: string;
  email: string;
  citizenCode: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  birthCountry?: string;
  residenceAddress?: string;
  residenceNumber?: string;
  residenceZip?: string;
  residenceCity?: string;
  residenceCountry?: string;
  plusCode?: string;
  arubaFrontUrl?: string;
  arubaBackUrl?: string;
  arubaPhotoUrl?: string;
  documentHash?: string;
  createdAt?: string;
}

export default function AdminDashboard() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch all citizens
  const fetchCitizens = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch('/api/admin/citizens');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setCitizens(result.data || []);
      } else {
        throw new Error(result.message || 'Errore durante il caricamento');
      }
    } catch (err: any) {
      console.error('[ADMIN-DASHBOARD] Fetch failed:', err);
      setError(err.message || 'Impossibile connettersi alle API di amministrazione.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  // Counters
  const totalCount = citizens.length;
  const pendingCount = citizens.filter(c => !c.status || c.status === 'pending').length;
  const approvedCount = citizens.filter(c => c.status === 'approved').length;
  const rejectedCount = citizens.filter(c => c.status === 'rejected').length;

  // Filter & Search
  const filteredCitizens = citizens.filter(cit => {
    const fullName = `${cit.firstName} ${cit.surname}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      (cit.citizenCode && cit.citizenCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cit.email && cit.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cit.username && cit.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const status = cit.status || 'pending';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Approve action
  const handleApprove = async (id: string | number) => {
    if (window.confirm('Sei sicuro di voler approvare questa domanda di cittadinanza? Verrà generata la ID card ufficiale e inviata via email.')) {
      setActionLoading(true);
      try {
        const res = await safeFetch('/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
          alert('Pratica approvata e ID Card spedita con successo!');
          await fetchCitizens();
          // Update selected view
          if (selectedCitizen && selectedCitizen.id === id) {
            if (data.citizen) {
              setSelectedCitizen(data.citizen);
            } else {
              setSelectedCitizen({ ...selectedCitizen, status: 'approved' });
            }
          }
        } else {
          alert(`Errore: ${data.message}`);
        }
      } catch (err: any) {
        alert(`Errore di rete: ${err.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Reject action
  const submitRejection = async () => {
    if (!selectedCitizen) return;
    if (!rejectionReason.trim()) {
      alert('Inserire un motivo valido per il rifiuto.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await safeFetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCitizen.id, reason: rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pratica respinta correttamente e notifica email recapitata.');
        setRejectionModalOpen(false);
        setRejectionReason('');
        await fetchCitizens();
        // Update selected view
        if (selectedCitizen) {
          setSelectedCitizen({ ...selectedCitizen, status: 'rejected', rejectionReason });
        }
      } else {
        alert(`Errore: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Errore di rete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-blue/10 shadow-xl overflow-hidden animate-fade-in" id="admin-console-view">
      {/* Banner Titolo */}
      <div className="bg-brand-blue text-white p-8 border-b border-brand-gold/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-gold text-xs font-semibold uppercase tracking-[0.2em] font-tech">
              <Shield className="w-4 h-4" /> Sovereign Registry Center
            </div>
            <h2 className="text-3xl font-serif text-white tracking-tight mt-1">
              Consolle Gestione Cittadini
            </h2>
            <p className="text-white/60 text-xs mt-1">
              Pannello ufficiale di revisione e validazione delle domande d'ingresso del New World State
            </p>
          </div>
          <button 
            onClick={fetchCitizens}
            disabled={loading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-xs font-semibold transition border border-white/10 active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Ricarica Dati
          </button>
        </div>
      </div>

      {/* METRICHE RAPIDE */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-brand-blue/5 text-brand-blue">
        <div className="p-6 border-r border-[#0a1c3e]/5 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Domande Totali</span>
          <span className="text-3xl font-serif font-bold text-brand-blue block mt-1">{totalCount}</span>
        </div>
        <div className="p-6 border-r border-[#0a1c3e]/5 text-center">
          <span className="text-amber-500 text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> Da Validare
          </span>
          <span className="text-3xl font-serif font-bold text-amber-600 block mt-1">{pendingCount}</span>
        </div>
        <div className="p-6 border-r border-[#0a1c3e]/5 text-center">
          <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approvati NWS
          </span>
          <span className="text-3xl font-serif font-bold text-emerald-600 block mt-1">{approvedCount}</span>
        </div>
        <div className="p-6 text-center">
          <span className="text-rose-500 text-[10px] uppercase font-bold tracking-wider block flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3" /> Respinti
          </span>
          <span className="text-3xl font-serif font-bold text-rose-600 block mt-1">{rejectedCount}</span>
        </div>
      </div>

      {loading && citizens.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-xs">Ricerca dei dati dei cittadini registrati in corso...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-rose-600 space-y-3">
          <p className="font-bold">Richiesta fallita</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <p className="text-xs text-slate-400 mt-4 bg-slate-50 max-w-lg mx-auto p-4 rounded-xl border border-red-100">
            Nessun database di produzione connesso. Verifica la configurazione di <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">DATABASE_URL</code> nell'ambiente del server o inserisci nuovi cittadini registrati per testare la persistenza in memoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* TABELLA CITTADINI */}
          <div className="lg:col-span-12 xl:col-span-8 p-6 md:p-8 space-y-4 border-r border-slate-100">
            {/* Filtri */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca per cognome, codice, email o username..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-blue/10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold bg-[#fbfbf9]"
                />
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <span className="text-xs text-slate-400 hidden sm:inline">Stato:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-brand-blue/10 bg-[#fbfbf9] px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="pending">In Attesa</option>
                  <option value="approved">Approvati</option>
                  <option value="rejected">Respinti</option>
                </select>
              </div>
            </div>

            {/* Elenco Tabella */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-[#fefefe]">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                    <th className="py-4 px-5">Candidato</th>
                    <th className="py-4 px-4">Codice Univoco (16 cifre)</th>
                    <th className="py-4 px-4">Cittadinanza</th>
                    <th className="py-4 px-4 text-center">Stato</th>
                    <th className="py-4 px-5 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {filteredCitizens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-5 text-center text-slate-400 text-xs">
                        Nessun cittadino corrisponde ai criteri impostati
                      </td>
                    </tr>
                  ) : (
                    filteredCitizens.map(cit => {
                      const status = cit.status || 'pending';
                      const badgeClass = status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                         status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                         'bg-amber-50 text-amber-700 border-amber-100';
                      const badgeText = status === 'approved' ? 'Approvato' :
                                        status === 'rejected' ? 'Respinto' : 'NWS In Attesa';

                      return (
                        <tr 
                          key={cit.id}
                          className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedCitizen && selectedCitizen.id === cit.id ? 'bg-brand-gold/5' : ''}`}
                          onClick={() => setSelectedCitizen(cit)}
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{cit.surname} {cit.firstName}</div>
                            <div className="text-[11px] text-slate-400">{cit.email || 'Nessuna email'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-gold">
                            {cit.citizenCode}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold">{cit.citizenship || 'Generica'}</div>
                            <div className="text-[10px] text-slate-400 font-mono capitalize">{cit.gender || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setSelectedCitizen(cit)}
                              className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-gold font-semibold transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Esamina
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              * Nota: Cliccando su un cittadino nella tabella è possibile aprire il pannello di revisione laterale per visionare i documenti completi d'identificazione salvati sul server.
            </p>
          </div>

          {/* SIDE INSIGHT DETTAGLIO CITTADINO */}
          <div className="lg:col-span-12 xl:col-span-4 p-6 bg-slate-50/70 border-t xl:border-t-0 border-slate-100 flex flex-col justify-between min-h-[500px]">
            {selectedCitizen ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-mono bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full font-bold">Fascicolo ID: #{selectedCitizen.id}</span>
                    <h3 className="text-xl font-serif text-slate-900 mt-2">{selectedCitizen.surname} {selectedCitizen.firstName}</h3>
                    <p className="text-xs text-slate-400">Username: <span className="font-mono bg-white px-1 py-0.5 border border-slate-100 rounded text-slate-600 font-semibold">{selectedCitizen.username}</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedCitizen(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    Chiudi
                  </button>
                </div>

                {/* Info List */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm text-xs">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cittadinanza Richiesta</span>
                      <strong className="text-brand-blue font-semibold">{selectedCitizen.citizenship}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nato il / Marital Status</span>
                      <strong className="text-neutral-700">{selectedCitizen.birthDate || 'N/A'} a {selectedCitizen.birthPlace} ({selectedCitizen.birthCountry}) • {selectedCitizen.maritalStatus || 'Single'}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email di Recapito</span>
                      <strong className="text-slate-700 select-all">{selectedCitizen.email}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recapito Telefonico</span>
                      <strong className="text-slate-700">{selectedCitizen.phonePrefix || ''} {selectedCitizen.phoneNumber || 'N/D'}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Residenza Dichiarata</span>
                      <strong className="text-slate-700">
                        {(() => {
                          const parts = [];
                          if (selectedCitizen.residenceAddress?.trim()) parts.push(selectedCitizen.residenceAddress.trim());
                          if (selectedCitizen.residenceNumber?.trim()) parts.push(selectedCitizen.residenceNumber.trim());
                          const street = parts.join(', ');

                          const secondParts = [];
                          if (selectedCitizen.residenceZip?.trim()) secondParts.push(selectedCitizen.residenceZip.trim());
                          if (selectedCitizen.residenceCity?.trim()) secondParts.push(selectedCitizen.residenceCity.trim());
                          if (selectedCitizen.residenceCountry?.trim()) secondParts.push(`(${selectedCitizen.residenceCountry.trim()})`);
                          const cityZip = secondParts.join(' ');

                          if (street && cityZip) return `${street} - ${cityZip}`;
                          if (street) return street;
                          if (cityZip) return cityZip;
                          return 'N/D';
                        })()}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 leading-tight">
                    <Globe className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Plus Code Posizione</span>
                      <strong className="font-mono text-cyan-600">{selectedCitizen.plusCode || 'NON MEMORIZZATO'}</strong>
                    </div>
                  </div>
                </div>

                {/* Document previews */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Documenti Allegati (Aruba Links)</span>
                  
                  <div className={`grid ${selectedCitizen.status === 'approved' ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center text-[10px] font-semibold text-brand-blue`}>
                    
                    <a 
                      href={selectedCitizen.arubaFrontUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaFrontUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-slate-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="font-bold">Fronte</div>
                      <div className="text-[9px] text-[#c5a880] mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    <a 
                      href={selectedCitizen.arubaBackUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaBackUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-slate-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="font-bold">Retro</div>
                      <div className="text-[9px] text-[#c5a880] mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    <a 
                      href={selectedCitizen.arubaPhotoUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`border rounded-xl p-2.5 block transition ${selectedCitizen.arubaPhotoUrl ? 'bg-white hover:border-brand-gold shadow-sm' : 'bg-[#0a1c3e]/5 border-brand-gold/20'}`}
                    >
                      <div className="font-bold text-slate-800">Foto</div>
                      <div className="text-[9px] text-brand-gold mt-1 flex items-center justify-center gap-0.5">Vedi <ExternalLink className="w-2.5 h-2.5" /></div>
                    </a>

                    {selectedCitizen.status === 'approved' && (
                      <button 
                        onClick={async () => {
                          if (downloadingPdf) return;
                          setDownloadingPdf(true);
                          try {
                            const res = await safeFetch(`/api/admin/citizen-card?id=${selectedCitizen.id}`);
                            if (!res.ok) {
                              throw new Error(`Il server ha risposto con codice ${res.status}`);
                            }
                            const blob = await res.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            
                            // Open in a new tab directly
                            const newTab = window.open(blobUrl, '_blank');
                            if (!newTab) {
                              // If popup blocker intervened, trigger file download fallback
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = `ID_Card_NWS_${selectedCitizen.citizenCode || selectedCitizen.id}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          } catch (err: any) {
                            console.error('[PDF-DOWNLOAD-ERROR]:', err);
                            alert(`Errore durante lo scaricamento della ID Card: ${err.message || 'Connessione fallita'}`);
                          } finally {
                            setDownloadingPdf(false);
                          }
                        }}
                        disabled={downloadingPdf}
                        className="border rounded-xl p-2.5 block text-center w-full transition bg-emerald-50 border-emerald-100/50 hover:border-emerald-300 hover:bg-emerald-100/20 text-emerald-800 disabled:opacity-60 cursor-pointer outline-none"
                      >
                        <div className="font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                          {downloadingPdf ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generazione...</span>
                            </>
                          ) : (
                            <span>PDF Card</span>
                          )}
                        </div>
                        <div className="text-[9px] text-emerald-600 mt-1 flex items-center justify-center gap-0.5">
                          {downloadingPdf ? 'Attendere prego' : 'Vedi / Stampa'} <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </button>
                    )}

                  </div>
                </div>

                {/* Decision options panel */}
                <div className="border border-brand-gold/20 rounded-2xl bg-white p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Azione di Validazione</h4>
                  
                  {selectedCitizen.status === 'approved' ? (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Approvata col Codice: {selectedCitizen.citizenCode || (selectedCitizen as any).citizencode || (selectedCitizen as any).citizen_code || 'IN GENERAZIONE'}
                    </div>
                  ) : selectedCitizen.status === 'rejected' ? (
                    <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1"><XCircle className="w-4 h-4 text-rose-600" /> Domanda Respinta</div>
                      <p className="text-[11px] text-slate-500 italic">"Motivo: {selectedCitizen.rejectionReason}"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                      <button 
                        onClick={() => handleApprove(selectedCitizen.id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 transition active:scale-95 disabled:opacity-50"
                      >
                        Approva
                      </button>
                      <button 
                        onClick={() => {
                          setRejectionReason(selectedCitizen.rejectionReason || '');
                          setRejectionModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 transition active:scale-95 disabled:opacity-50"
                      >
                        Respingi
                      </button>
                    </div>
                  )}

                  <a 
                    href={`/admin/action?id=${selectedCitizen.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 py-2.5 rounded-xl text-[11px] font-semibold transition mt-2"
                  >
                    Apri console interattiva esterna <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-10 text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold">Nessun dossier esaminato</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Seleziona un cittadino o candidato dalla tabella anagrafica per esaminare i dettagli completi, i documenti caricati su Aruba e procedere con la validazione d'ingresso.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* REJECTION REASON MODAL POPUP */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-[#0a1c3e]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col space-y-4 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <span className="text-rose-500">✕</span> Motivo della Respinta
            </h3>
            <p className="text-xs text-slate-500">Fornisci una motivazione chiara e specifica. Questa verrà inviata via email come motivazione formale al candidato per poter presentare un ricorso o correggere gli atti.</p>
            
            <textarea 
              rows={4} 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Esempio: Foto tessera sbiadita o Hash firma non corrispondente..."
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 bg-slate-50"
            />

            <div className="flex gap-3 text-xs font-bold justify-end pt-2">
              <button 
                onClick={() => setRejectionModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition"
              >
                Annulla
              </button>
              <button 
                onClick={submitRejection}
                disabled={actionLoading}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                Invia e Respingi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
