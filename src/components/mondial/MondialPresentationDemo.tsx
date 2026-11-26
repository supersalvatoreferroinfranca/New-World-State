import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Coins,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  Sparkles,
  Globe,
  Lock,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Info,
  RotateCcw,
  UserPlus,
  LogIn,
  ArrowUpRight,
  ArrowDownLeft,
  BellRing,
  LogOut,
  Clock
} from 'lucide-react';
import { BARTER_CATEGORIES, BarterCategory } from '../../services/mondialBackend';

interface PublicLedgerItem {
  tx_hash: string;
  masked_sender: string;
  masked_receiver: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

interface CitizenStatusInfo {
  id: number;
  citizenCode?: string;
  username?: string;
  firstName?: string;
  surname?: string;
  status?: string;
}

interface DemoTx {
  id: string;
  type: 'sent' | 'received';
  counterparty: string;
  amount: number;
  category: string;
  description: string;
  time: string;
}

interface MondialPresentationDemoProps {
  citizen: CitizenStatusInfo | null;
  publicLedger: PublicLedgerItem[];
  onRefreshLedger: () => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onGoToRegister?: () => void;
}

const DEMO_PRESETS: Array<{ label: string; category: BarterCategory; description: string; amount: string; counterparty: string }> = [
  {
    label: 'Cassetta Ortaggi Bio (5 kg)',
    category: 'Cibo & Agricoltura',
    description: 'Cassetta mista di ortaggi biologici di stagione a km 0',
    amount: '35',
    counterparty: 'Bottega Agricola Solidale (NWS-DEMO-AGR1)'
  },
  {
    label: 'Riparazione Bicicletta',
    category: 'Servizi & Consulenze',
    description: 'Manutenzione completa freni, catena e pneumatici',
    amount: '80',
    counterparty: 'Ciclofficina Cooperativa (NWS-DEMO-ART4)'
  },
  {
    label: 'Vaso in Ceramica Artigianale',
    category: 'Beni & Artigianato',
    description: 'Manufatto unico tornito e smaltato a mano',
    amount: '120',
    counterparty: 'Atelier Terracotta (NWS-DEMO-CER7)'
  }
];

export default function MondialPresentationDemo({
  citizen,
  publicLedger,
  onRefreshLedger,
  onOpenLogin,
  onLogout,
  onGoToRegister
}: MondialPresentationDemoProps) {
  const [demoBalance, setDemoBalance] = useState<number>(5000);
  const [demoMode, setDemoMode] = useState<'pay' | 'receive'>('pay');
  const [demoStep, setDemoStep] = useState<'idle' | 'scanned' | 'pin_prompt' | 'completed'>('idle');
  const [demoCounterparty, setDemoCounterparty] = useState<string>('Bottega Agricola Solidale (NWS-DEMO-AGR1)');
  const [demoCategory, setDemoCategory] = useState<BarterCategory>('Cibo & Agricoltura');
  const [demoDescription, setDemoDescription] = useState<string>('Cassetta mista di ortaggi biologici di stagione a km 0');
  const [demoAmount, setDemoAmount] = useState<string>('35');
  const [demoPin, setDemoPin] = useState<string>('1234');
  const [demoNotification, setDemoNotification] = useState<string | null>(null);
  const [demoHistory, setDemoHistory] = useState<DemoTx[]>([
    {
      id: 'TX-DEMO-INIT',
      type: 'received',
      counterparty: 'Anagrafe Centrale NWS (Credito Benvenuto)',
      amount: 5000,
      category: 'Aiuto Reciproco',
      description: 'Credito solidale immediato di ingresso al circuito',
      time: 'Iniziale'
    }
  ]);

  const [demoQrUrl, setDemoQrUrl] = useState<string>('');
  const [receiveDemoAmount, setReceiveDemoAmount] = useState<string>('50');
  const [receiveDemoDesc, setReceiveDemoDesc] = useState<string>('Lezione di lingua italiana / Consulenza');

  useEffect(() => {
    const payload = JSON.stringify({
      nws_mondial_demo: true,
      code: 'NWS-CIT-DEMO',
      amount: receiveDemoAmount ? parseFloat(receiveDemoAmount) : undefined,
      description: receiveDemoDesc
    });
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 2,
      color: { dark: '#0a1c3e', light: '#ffffff' }
    })
      .then(setDemoQrUrl)
      .catch(() => {});
  }, [receiveDemoAmount, receiveDemoDesc]);

  const handleSelectPreset = (preset: (typeof DEMO_PRESETS)[number]) => {
    setDemoCounterparty(preset.counterparty);
    setDemoCategory(preset.category);
    setDemoDescription(preset.description);
    setDemoAmount(preset.amount);
    setDemoStep('scanned');
    setDemoNotification(null);
  };

  const handleSimulateScan = () => {
    setDemoStep('scanned');
    setDemoNotification('QR Code del cittadino letto dal dispositivo: seleziona importo e causale.');
  };

  const handleConfirmDemoPay = (method: 'pin' | 'biometric') => {
    const amt = parseFloat(demoAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > demoBalance) {
      setDemoNotification('Saldo demo insufficiente per questo importo.');
      return;
    }

    setDemoBalance((prev) => Math.max(0, prev - amt));
    const newTx: DemoTx = {
      id: `TX-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'sent',
      counterparty: demoCounterparty,
      amount: amt,
      category: demoCategory,
      description: demoDescription || 'Baratto solidale dimostrativo',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    };
    setDemoHistory((prev) => [newTx, ...prev]);
    setDemoStep('completed');
    setDemoNotification(
      method === 'biometric'
        ? `Conferma biometrica riuscita! Addebitati -${amt.toFixed(2)} Ɱ e accreditati al destinatario.`
        : `PIN verificato! Addebitati -${amt.toFixed(2)} Ɱ e notifica inviata al destinatario.`
    );
  };

  const handleSimulateIncomingPayment = () => {
    const amt = parseFloat(receiveDemoAmount) || 50;
    setDemoBalance((prev) => prev + amt);
    const newTx: DemoTx = {
      id: `TX-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'received',
      counterparty: 'Cittadino Acquirente (NWS-DEMO-USR9)',
      amount: amt,
      category: 'Servizi & Consulenze',
      description: receiveDemoDesc || 'Scambio solidale tramite QR',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    };
    setDemoHistory((prev) => [newTx, ...prev]);
    setDemoNotification(`Notifica ricevuta sul dispositivo: accreditati +${amt.toFixed(2)} Ɱ sul tuo portafoglio!`);
  };

  const resetDemo = () => {
    setDemoBalance(5000);
    setDemoStep('idle');
    setDemoNotification(null);
    setDemoHistory([
      {
        id: 'TX-DEMO-INIT',
        type: 'received',
        counterparty: 'Anagrafe Centrale NWS (Credito Benvenuto)',
        amount: 5000,
        category: 'Aiuto Reciproco',
        description: 'Credito solidale immediato di ingresso al circuito',
        time: 'Iniziale'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 pb-24 pt-6 md:pt-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* TOP ACCESS GATE BANNER */}
        <div className="rounded-3xl bg-gradient-to-br from-[#071530] via-[#0a1c3e] to-[#102956] text-white p-6 sm:p-10 shadow-xl border border-amber-400/30 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none text-amber-300">
            <Coins className="w-72 h-72" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Accesso Riservato ai Cittadini Censiti &amp; Approvati</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
                Mondial <span className="text-amber-300">(Ɱ)</span> — Circuito di Baratto Solidale e Mutuo Credito
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                Il <strong>Mondial (Ɱ)</strong> permette ai cittadini del New World State di scambiare beni, prodotti agricoli, artigianato e servizi professionali su base equa e solidale attraverso il proprio smartphone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-xs">
                  <div className="text-amber-300 font-mono font-black text-xl">5.000,00 Ɱ</div>
                  <div className="text-xs text-slate-200 mt-0.5">
                    Credito immediato di benvenuto assegnato all&apos;approvazione della cittadinanza
                  </div>
                </div>
                <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-xs">
                  <div className="text-emerald-300 font-mono font-black text-xl">+5.000,00 Ɱ</div>
                  <div className="text-xs text-slate-200 mt-0.5">
                    Ulteriore accredito solidale quando favorisci l&apos;iscrizione di 50 nuovi cittadini
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT ACTION CARD */}
            <div className="lg:col-span-5 bg-white text-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
              {citizen ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0a1c3e]">
                        Profilo in Attesa di Validazione Anagrafica
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Benvenuto <strong>{citizen.firstName || citizen.username}</strong> ({citizen.citizenCode || `ID #${citizen.id}`}). La tua pratica risulta attualmente in stato{' '}
                        <span className="font-mono font-bold uppercase text-amber-700">{citizen.status || 'pending'}</span>.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Solo dopo la verifica dell&apos;Anagrafe Centrale potrai scambiare Mondial reali con gli altri cittadini. Nel frattempo puoi provare la <strong>Demo Interattiva</strong> qui sotto.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Cambia Profilo</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Esci</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-[#0a1c3e]">
                      Attiva o Accedi al Tuo Portafoglio Mondial
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Per tutelare l&apos;integrità del circuito solidale, solo i cittadini censiti e approvati possono generare QR reali e scambiare valore.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-amber-300" />
                      <span>Accedi con la tua Cittadinanza</span>
                    </button>

                    {onGoToRegister && (
                      <button
                        type="button"
                        onClick={onGoToRegister}
                        className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Iscriviti Gratis e Ricevi 5.000 Ɱ</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    Non sei ancora iscritto? Esplora liberamente la guida e la demo interattiva qui sotto.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* LEGAL & ETHICAL SAFEGUARD BANNER */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Natura Giuridica del Baratto Solidale — Nessuna Competizione con Valute Legali</p>
            <p className="text-amber-900/90 leading-relaxed">
              Il Mondial (Ɱ) è un&apos;unità di conto interna per la compensazione multilaterale del baratto di beni e servizi tra cittadini. <strong>Non è una valuta fiat a corso legale</strong>, non è convertibile in denaro convenzionale, non matura interessi e non costituisce strumento finanziario: nasce per valorizzare l&apos;economia reale di comunità nel pieno rispetto delle normative vigenti.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS: 4 CLEAR STEPS */}
        <div className="space-y-4">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">
              Guida Rapida Mobile-First
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0a1c3e]">
              Come Funziona lo Scambio di Valore in Mondial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0a1c3e]">1. Cittadinanza &amp; 5.000 Ɱ</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al momento dell&apos;approvazione nell&apos;Anagrafe Sovrana, il tuo portafoglio viene attivato automaticamente con 5.000 Ɱ di credito solidale.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0a1c3e]">2. Mostra il Tuo QR Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quando cedi un bene o presti un servizio, mostra il QR Code dal telefono (anche con importo e causale già preimpostati).
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ScanLine className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0a1c3e]">3. Scansiona &amp; Conferma</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chi riceve il bene scansiona il QR, inserisce categoria e causale di baratto, autorizza con PIN o conferma biometrica e riceve notifica immediata.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0a1c3e] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0a1c3e]">4. Invita 50 Cittadini</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Condividendo il tuo link personale, quando 50 persone si iscrivono grazie a te ricevi altri 5.000 Ɱ e controlli i tuoi invitati in area privata.
              </p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE DEMO SIMULATOR */}
        <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#0a1c3e] to-indigo-950 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <h2 className="font-bold text-base">Demo Interattiva: Simula uno Scambio Mobile in Mondial</h2>
                <p className="text-[11px] text-slate-300">
                  Simulazione sicura in locale per vedere dal vivo il flusso di pagamento, scansione QR, PIN/Biometria e notifiche.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetDemo}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Azzera Demo</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: SIMULATED MOBILE DEVICE & CONTROLS */}
            <div className="lg:col-span-7 space-y-5">
              {/* SIMULATED BALANCE HEADER */}
              <div className="rounded-2xl bg-[#0a1c3e] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-amber-300 font-bold">
                    Portafoglio Simulato (Demo)
                  </span>
                  <div className="text-3xl font-mono font-black text-white mt-0.5">
                    {demoBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })} <span className="text-amber-300">Ɱ</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDemoMode('pay'); setDemoNotification(null); }}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      demoMode === 'pay' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Dai Valore (Paga QR)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDemoMode('receive'); setDemoNotification(null); }}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      demoMode === 'receive' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Ricevi (Mostra QR)
                  </button>
                </div>
              </div>

              {demoNotification && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 font-medium">
                  <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{demoNotification}</span>
                </div>
              )}

              {demoMode === 'pay' ? (
                <div className="space-y-4">
                  {/* QUICK PRESETS */}
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-slate-500 mb-2">
                      Scegli un esempio di baratto o scansiona il QR demo:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-xs font-semibold text-slate-700 cursor-pointer transition"
                        >
                          {preset.label} ({preset.amount} Ɱ)
                        </button>
                      ))}
                    </div>
                  </div>

                  {demoStep === 'idle' && (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 text-center space-y-3">
                      <ScanLine className="w-10 h-10 text-[#0a1c3e] mx-auto" />
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Nella realtà inquadri il QR Code sullo smartphone dell&apos;altro cittadino. Clicca qui sotto per simulare la lettura immediata del QR!
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateScan}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ScanLine className="w-4 h-4 text-amber-300" />
                        <span>Simula Scansione QR Cittadino</span>
                      </button>
                    </div>
                  )}

                  {(demoStep === 'scanned' || demoStep === 'completed') && (
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Destinatario Rilevato: {demoCounterparty}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Importo (Ɱ)</label>
                          <input
                            type="number"
                            value={demoAmount}
                            onChange={(e) => setDemoAmount(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoria Baratto</label>
                          <select
                            value={demoCategory}
                            onChange={(e) => setDemoCategory(e.target.value as BarterCategory)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                          >
                            {BARTER_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Causale Obbligatoria</label>
                        <input
                          type="text"
                          value={demoDescription}
                          onChange={(e) => setDemoDescription(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setDemoStep('pin_prompt')}
                        className="w-full min-h-[44px] py-3 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs cursor-pointer"
                      >
                        Procedi alla Conferma Addebito ({demoAmount || '0'} Ɱ)
                      </button>
                    </div>
                  )}

                  {demoStep === 'pin_prompt' && (
                    <div className="p-5 rounded-2xl border-2 border-indigo-300 bg-indigo-50/60 space-y-4">
                      <div className="flex items-center gap-2 text-[#0a1c3e] font-bold text-sm">
                        <KeyRound className="w-4 h-4 text-indigo-700" />
                        <span>Autorizza l&apos;Addebito dal Tuo Smartphone</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Inserisci il PIN dimostrativo (<strong className="font-mono">1234</strong>) oppure usa la conferma biometrica istantanea:
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={demoPin}
                          onChange={(e) => setDemoPin(e.target.value)}
                          placeholder="PIN (1234)"
                          className="sm:w-32 px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-center font-mono font-bold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmDemoPay('pin')}
                          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0a1c3e] text-white font-bold text-xs cursor-pointer"
                        >
                          Conferma con PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDemoPay('biometric')}
                          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Fingerprint className="w-4 h-4" />
                          <span>Biometria Rapida</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="text-center space-y-2">
                    {demoQrUrl && (
                      <img
                        src={demoQrUrl}
                        alt="QR Code Demo Mondial"
                        className="w-44 h-44 mx-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                      />
                    )}
                    <span className="block font-mono text-[11px] font-bold text-slate-500">NWS-CIT-DEMO</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Valore Richiesto (Ɱ)</label>
                      <input
                        type="number"
                        value={receiveDemoAmount}
                        onChange={(e) => setReceiveDemoAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Bene / Servizio Offerto</label>
                      <input
                        type="text"
                        value={receiveDemoDesc}
                        onChange={(e) => setReceiveDemoDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateIncomingPayment}
                      className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Simula Ricezione Pagamento (+{receiveDemoAmount || '0'} Ɱ)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: SIMULATED ACTIVITY LOG */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Registro Movimenti Simulati
                </h3>
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {demoHistory.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            item.type === 'received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.type === 'received' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{item.counterparty}</div>
                          <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.category} • {item.time}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-mono font-bold whitespace-nowrap ${
                          item.type === 'received' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {item.type === 'received' ? '+' : '-'}
                        {item.amount.toFixed(2)} Ɱ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-center space-y-2">
                <p className="text-[11px] text-slate-500">
                  Pronto a partecipare al circuito reale con <strong>5.000 Ɱ</strong> di benvenuto?
                </p>
                {onGoToRegister && !citizen && (
                  <button
                    type="button"
                    onClick={onGoToRegister}
                    className="w-full min-h-[42px] py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Richiedi Cittadinanza &amp; Portafoglio Reale
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PUBLIC TRANSPARENT LEDGER (READ-ONLY) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#0a1c3e] flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Registro Pubblico Trasparente del Circuito (Codici Anonimizzati)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Consultabile pubblicamente a garanzia della trasparenza dei baratti solidali della comunità
              </p>
            </div>
            <button
              type="button"
              onClick={onRefreshLedger}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer self-start sm:self-auto"
            >
              Aggiorna Registro
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-mono">ID Transazione</th>
                  <th className="py-3 px-4">Mittente</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Causale</th>
                  <th className="py-3 px-4 text-right">Valore (Ɱ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publicLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Nessuna transazione pubblica registrata al momento.
                    </td>
                  </tr>
                ) : (
                  publicLedger.slice(0, 15).map((row) => (
                    <tr key={row.tx_hash} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-slate-600">{row.tx_hash.slice(0, 14)}...</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{row.masked_sender}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{row.masked_receiver}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{row.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0a1c3e]">
                        {row.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} Ɱ
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
