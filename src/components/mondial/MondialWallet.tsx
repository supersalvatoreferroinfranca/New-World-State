import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { 
  Coins, 
  QrCode, 
  ScanLine, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  History, 
  Globe, 
  ChevronRight, 
  Info, 
  Lock, 
  X, 
  Camera, 
  FileText,
  CheckCircle2,
  ExternalLink,
  Share2,
  SlidersHorizontal
} from 'lucide-react';
import { BARTER_CATEGORIES, BarterCategory } from '../../services/mondialBackend';

interface MondialWalletProps {
  onGoToRegister?: () => void;
  onGoToDemocracy?: () => void;
}

interface CitizenSession {
  id: number;
  citizenCode?: string;
  username?: string;
  firstName?: string;
  surname?: string;
  email?: string;
  status?: string;
}

interface WalletState {
  id?: number;
  citizen_id: number;
  citizen_code: string;
  citizen_name: string;
  balance: number;
  has_pin: boolean;
  referral_count: number;
  referral_bonus_awarded: boolean;
}

interface TransactionItem {
  id?: number;
  tx_hash: string;
  sender_code: string;
  sender_name: string;
  receiver_code: string;
  receiver_name: string;
  amount: number;
  category: BarterCategory;
  description: string;
  status: string;
  created_at: string;
}

interface PublicLedgerItem {
  tx_hash: string;
  masked_sender: string;
  masked_receiver: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

export default function MondialWallet({ onGoToRegister, onGoToDemocracy }: MondialWalletProps) {
  // Citizen authentication session
  const [citizen, setCitizen] = useState<CitizenSession | null>(() => {
    try {
      const saved = localStorage.getItem('nws_democracy_citizen') || sessionStorage.getItem('nws_democracy_citizen');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading citizen session:', e);
    }
    return null;
  });

  // Active view tab: 'overview' | 'pay' | 'receive' | 'ledger' | 'referrals'
  const [activeTab, setActiveTab] = useState<'overview' | 'pay' | 'receive' | 'ledger' | 'referrals'>('overview');

  // Wallet & transaction state
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [publicLedger, setPublicLedger] = useState<PublicLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Login / Switch profile modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginCodeOrUser, setLoginCodeOrUser] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Pay / Transfer State (Barter flow)
  const [recipientCode, setRecipientCode] = useState<string>('');
  const [recipientLookup, setRecipientLookup] = useState<{ found: boolean; name?: string } | null>(null);
  const [isLookingUpRecipient, setIsLookingUpRecipient] = useState<boolean>(false);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferCategory, setTransferCategory] = useState<BarterCategory>('Cibo & Agricoltura');
  const [transferDescription, setTransferDescription] = useState<string>('');
  const [transferPin, setTransferPin] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferSuccessTx, setTransferSuccessTx] = useState<TransactionItem | null>(null);

  // QR Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerCameraError, setScannerCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Receive QR State
  const [receiveQrUrl, setReceiveQrUrl] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [receiveDescription, setReceiveDescription] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // PIN Setup Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState<boolean>(false);

  // Filter for personal transactions
  const [txFilter, setTxFilter] = useState<'all' | 'received' | 'sent'>('all');

  // Load wallet data
  const loadWalletData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    const currentCitizenId = citizen?.id || 1;
    const currentCitizenCode = citizen?.citizenCode || citizen?.username || `NWS-SOV-001`;
    const currentCitizenName = citizen ? `${citizen.firstName || ''} ${citizen.surname || ''}`.trim() || citizen.username || 'Cittadino Sovrano' : 'Cittadino Sovrano';

    try {
      const res = await fetch(`/api/mondial/wallet?citizenId=${encodeURIComponent(currentCitizenId)}&citizenCode=${encodeURIComponent(currentCitizenCode)}&citizenName=${encodeURIComponent(currentCitizenName)}`);
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
      } else {
        setErrorMsg(data.message || 'Errore nel caricamento del saldo Mondial.');
      }
    } catch (err: any) {
      setErrorMsg('Impossibile connettersi al circuito Mondial: ' + err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load public ledger
  const loadPublicLedger = async () => {
    try {
      const res = await fetch('/api/mondial/public-ledger?limit=60');
      const data = await res.json();
      if (data.success) {
        setPublicLedger(data.ledger || []);
      }
    } catch (err: any) {
      console.warn('Errore caricamento registro pubblico:', err);
    }
  };

  useEffect(() => {
    loadWalletData();
    loadPublicLedger();
  }, [citizen]);

  // Generate QR Code for receiving value
  useEffect(() => {
    const activeCode = wallet?.citizen_code || citizen?.citizenCode || 'NWS-SOV-001';
    const payload = JSON.stringify({
      nws_mondial: true,
      code: activeCode,
      name: wallet?.citizen_name || 'Cittadino Sovrano',
      amount: receiveAmount ? parseFloat(receiveAmount) : undefined,
      description: receiveDescription.trim() || undefined
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0a1c3e',
        light: '#ffffff'
      }
    }).then(url => {
      setReceiveQrUrl(url);
    }).catch(err => {
      console.error('QR generation error:', err);
    });
  }, [wallet?.citizen_code, citizen?.citizenCode, receiveAmount, receiveDescription]);

  // Recipient lookup debounced
  useEffect(() => {
    if (!recipientCode || recipientCode.trim().length < 3) {
      setRecipientLookup(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUpRecipient(true);
      try {
        const res = await fetch(`/api/mondial/lookup-citizen?code=${encodeURIComponent(recipientCode.trim())}`);
        const data = await res.json();
        if (data.success && data.found) {
          setRecipientLookup({ found: true, name: data.fullName });
        } else {
          setRecipientLookup({ found: false });
        }
      } catch (err) {
        setRecipientLookup({ found: false });
      } finally {
        setIsLookingUpRecipient(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recipientCode]);

  // Camera QR Code Scanner lifecycle
  const startCamera = async () => {
    setScannerCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanQrFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setScannerCameraError('Impossibile accedere alla fotocamera. Assicurati di aver concesso i permessi nel browser o inserisci il codice cittadino manualmente.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanQrFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        // Haptic feedback if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 60]);
        }

        try {
          // Attempt JSON parse
          const parsed = JSON.parse(code.data);
          if (parsed && (parsed.nws_mondial || parsed.code)) {
            setRecipientCode(parsed.code || '');
            if (parsed.amount) setTransferAmount(String(parsed.amount));
            if (parsed.description) setTransferDescription(parsed.description);
          } else {
            setRecipientCode(code.data.trim());
          }
        } catch {
          // Raw string fallback (e.g. "NWS-IT-2025-0012")
          setRecipientCode(code.data.trim());
        }

        setIsScannerOpen(false);
        setActiveTab('pay');
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQrFrame);
  };

  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScannerOpen]);

  // Execute Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Inserisci un importo valido superiore a 0 Ɱ.');
      return;
    }
    if (amt > wallet.balance) {
      alert(`Saldo insufficiente. Disponi di ${wallet.balance.toFixed(2)} Ɱ.`);
      return;
    }
    if (!recipientCode.trim()) {
      alert('Inserisci il codice del cittadino destinatario.');
      return;
    }
    if (!transferDescription.trim() || transferDescription.trim().length < 3) {
      alert('La causale del baratto (descrizione del bene o servizio) è obbligatoria.');
      return;
    }
    if (wallet.has_pin && !transferPin) {
      alert('Inserisci il tuo PIN di sicurezza per confermare l\'addebito.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/mondial/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderCitizenId: wallet.citizen_id,
          senderCode: wallet.citizen_code,
          senderName: wallet.citizen_name,
          receiverCode: recipientCode.trim(),
          amount: amt,
          category: transferCategory,
          description: transferDescription.trim(),
          pin: transferPin || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setTransferSuccessTx(data.transaction);
        setTransferAmount('');
        setTransferDescription('');
        setTransferPin('');
        setRecipientCode('');
        setRecipientLookup(null);
        await loadWalletData(true);
        loadPublicLedger();
      } else {
        alert(data.message || 'Errore durante il trasferimento.');
      }
    } catch (err: any) {
      alert('Errore di connessione: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Save Security PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!newPin || newPin.length < 4 || !/^\d+$/.test(newPin)) {
      setPinError('Il PIN deve essere composto da almeno 4 cifre numeriche.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('I PIN inseriti non corrispondono.');
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await fetch('/api/mondial/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: wallet?.citizen_id || citizen?.id || 1,
          pin: newPin
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPinModalOpen(false);
        setNewPin('');
        setConfirmPin('');
        await loadWalletData(true);
        alert('✓ PIN di sicurezza impostato con successo!');
      } else {
        setPinError(data.message || 'Errore nel salvataggio del PIN.');
      }
    } catch (err: any) {
      setPinError('Errore di connessione: ' + err.message);
    } finally {
      setIsSavingPin(false);
    }
  };

  // Citizen Login Submit
  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginCodeOrUser || !loginPassword) {
      setLoginError('Inserisci codice cittadino e password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/democracy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrCode: loginCodeOrUser.trim(),
          password: loginPassword
        })
      });
      const data = await res.json();
      if (data.success && data.citizen) {
        localStorage.setItem('nws_democracy_citizen', JSON.stringify(data.citizen));
        sessionStorage.setItem('nws_democracy_citizen', JSON.stringify(data.citizen));
        setCitizen(data.citizen);
        setIsLoginModalOpen(false);
        setLoginCodeOrUser('');
        setLoginPassword('');
      } else {
        setLoginError(data.message || 'Credenziali non valide o profilo in attesa.');
      }
    } catch (err: any) {
      setLoginError('Errore durante il login: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'received') {
      return t.receiver_code === wallet?.citizen_code;
    }
    if (txFilter === 'sent') {
      return t.sender_code === wallet?.citizen_code;
    }
    return true;
  });

  // Calculate referral progress
  const referralTarget = 50;
  const currentReferrals = wallet?.referral_count || 0;
  const referralPercent = Math.min(100, Math.round((currentReferrals / referralTarget) * 100));

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 pb-24 pt-4 md:pt-8 font-sans selection:bg-[#c5a880]/30 selection:text-[#0a1c3e]">
      {/* HEADER SECTION */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* TOP BAR / BREADCRUMB & CITIZEN BADGE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0a1c3e] flex items-center justify-center text-[#c5a880] shadow-md border border-[#c5a880]/30">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0a1c3e] tracking-tight">
                  Mondial <span className="text-[#c5a880]">(Ɱ)</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  Baratto Solidale
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistema di Scambio Valori e Mutuo Credito Sovrano
              </p>
            </div>
          </div>

          {/* CITIZEN PROFILE STATUS */}
          <div className="flex items-center gap-2 bg-white p-1.5 pr-3 rounded-2xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0a1c3e] font-bold text-xs">
              {wallet?.citizen_name ? wallet.citizen_name.slice(0, 2).toUpperCase() : 'NWS'}
            </div>
            <div className="text-left text-xs pr-1">
              <p className="font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {wallet?.citizen_name || 'Cittadino Sovrano'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {wallet?.citizen_code || 'NWS-SOV-001'}
              </p>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-[11px] font-medium text-[#0a1c3e] hover:text-[#c5a880] px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors ml-1 cursor-pointer border border-slate-200"
            >
              {citizen ? 'Cambia' : 'Accedi'}
            </button>
          </div>
        </div>

        {/* LEGAL ETHICAL DISCLAIMER BANNER */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Finalità Etica e Tutela Giuridica di Baratto Solidale
            </p>
            <p className="text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">
              Il <strong>Mondial (Ɱ)</strong> è uno strumento interno di cooperazione multilaterale per facilitare lo scambio solidale ed equo di beni, prodotti artigianali, agricoli e servizi professionali tra i cittadini del New World State. 
              <strong> Non è una valuta legale fiat</strong>, non è convertibile in valute statali esterne e non genera interessi, garantendo la piena salvaguardia e non concorrenzialità con i sistemi monetari sovrani convenzionali.
            </p>
          </div>
        </div>

        {/* HERO WALLET CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1c3e] via-[#0f2858] to-[#08152e] text-white p-6 sm:p-8 shadow-xl border border-[#c5a880]/30 mb-8">
          {/* Subtle watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-[#c5a880]">
            <Coins className="w-64 h-64" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#c5a880] font-bold font-mono">
                  Saldo Disponibile
                </span>
                <button
                  onClick={() => loadWalletData(true)}
                  disabled={isRefreshing}
                  className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
                  title="Aggiorna saldo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#c5a880]' : ''}`} />
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                  {wallet ? wallet.balance.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '5.000,00'}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#c5a880]">Ɱ</span>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
                Credito solidale immediato assegnato: <strong>5.000,00 Ɱ</strong>
              </p>
            </div>

            {/* QUICK ACTIONS ON CARD */}
            <div className="flex items-center gap-3 pt-2 md:pt-0">
              <button
                onClick={() => setActiveTab('pay')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#c5a880] hover:bg-[#b3956e] text-[#0a1c3e] font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Paga / Scambia</span>
              </button>

              <button
                onClick={() => setActiveTab('receive')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
              >
                <QrCode className="w-4 h-4 text-[#c5a880]" />
                <span>Ricevi Valore</span>
              </button>
            </div>
          </div>

          {/* REFERRAL PROGRESS BAR SECTION */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-[#c5a880]" />
                <span>
                  Obiettivo Solidale: <strong>{currentReferrals} / {referralTarget}</strong> cittadini invitati
                </span>
              </div>
              <span className="font-semibold text-[#c5a880]">
                {wallet?.referral_bonus_awarded 
                  ? '✓ Bonus +5.000 Ɱ Riconosciuto!' 
                  : `Mancano ${Math.max(0, referralTarget - currentReferrals)} iscritti per altri +5.000 Ɱ`}
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#c5a880] to-amber-300 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${referralPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0a1c3e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>I Miei Baratti</span>
          </button>

          <button
            onClick={() => setActiveTab('pay')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pay'
                ? 'bg-[#0a1c3e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ScanLine className="w-4 h-4 text-[#c5a880]" />
            <span>Paga (Scansiona QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-[#0a1c3e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#c5a880]" />
            <span>Ricevi (Mostra QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#0a1c3e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Registro Pubblico Trasparente</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'referrals'
                ? 'bg-[#0a1c3e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Inviti (+5.000 Ɱ)</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PERSONAL TRANSACTIONS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0a1c3e]">Storico Operazioni Personali</h2>
                <p className="text-xs text-slate-500">I beni e servizi che hai scambiato all'interno della comunità sovrana</p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setTxFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${txFilter === 'all' ? 'bg-[#0a1c3e] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Tutte ({transactions.length})
                </button>
                <button
                  onClick={() => setTxFilter('received')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${txFilter === 'received' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Ricevuti
                </button>
                <button
                  onClick={() => setTxFilter('sent')}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${txFilter === 'sent' ? 'bg-amber-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Inviati
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                <RefreshCw className="w-6 h-6 animate-spin text-[#c5a880] mx-auto mb-2" />
                <p className="text-xs text-slate-500">Caricamento transazioni Mondial in corso...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Nessuna transazione trovata</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Non hai ancora effettuato scambi con questo filtro. Prova a scambiare valore con un altro cittadino tramite QR code.
                </p>
                <button
                  onClick={() => setActiveTab('pay')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a1c3e] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#142d5c] transition-colors cursor-pointer"
                >
                  <ScanLine className="w-4 h-4 text-[#c5a880]" />
                  Inizia il tuo primo baratto
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {filteredTransactions.map((tx) => {
                  const isReceived = tx.receiver_code === wallet?.citizen_code;
                  return (
                    <div key={tx.tx_hash} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isReceived 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {isReceived ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {isReceived ? `Da: ${tx.sender_name}` : `A: ${tx.receiver_name}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {tx.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5 font-medium">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                            <span>{new Date(tx.created_at).toLocaleString('it-IT')}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{tx.tx_hash}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-base font-extrabold font-mono ${isReceived ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isReceived ? '+' : '-'}{tx.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} Ɱ
                        </span>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Convalidato ✓
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECURITY PIN MANAGEMENT BOX */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">PIN di Sicurezza Dispositivo</h4>
                  <p className="text-xs text-slate-500">
                    {wallet?.has_pin 
                      ? 'Il tuo PIN a 4 cifre è attivo per autorizzare i pagamenti con QR.' 
                      : 'Proteggi i tuoi Mondial impostando un PIN a 4 cifre per le autorizzazioni.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer border border-slate-300"
              >
                <KeyRound className="w-3.5 h-3.5 inline-block mr-1.5" />
                {wallet?.has_pin ? 'Modifica PIN' : 'Imposta PIN'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PAY / SCAN QR CODE */}
        {activeTab === 'pay' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#0a1c3e] text-[#c5a880] flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#0a1c3e]">Paga o Scambia Valore (Mondial)</h2>
                <p className="text-xs text-slate-500">Scansiona il QR code di un altro cittadino oppure inserisci il suo codice</p>
              </div>

              {/* CAMERA SCAN BUTTON */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0a1c3e] to-[#142d5c] hover:from-[#112347] hover:to-[#1a3870] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer border border-[#c5a880]/30"
              >
                <Camera className="w-5 h-5 text-[#c5a880]" />
                <span>Apri Fotocamera per Scansionare QR</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 mx-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">oppure compila manualmente</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                {/* RECIPIENT CITIZEN CODE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Codice Cittadino Destinatario *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="es. NWS-IT-2025-0012 oppure username"
                      value={recipientCode}
                      onChange={(e) => setRecipientCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] focus:border-transparent uppercase"
                    />
                    {isLookingUpRecipient && (
                      <div className="absolute right-3 top-3">
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>

                  {recipientLookup && (
                    <div className={`mt-1.5 text-xs flex items-center gap-1.5 font-medium ${recipientLookup.found ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {recipientLookup.found ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Destinatario verificato: <strong>{recipientLookup.name}</strong></span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Codice non trovato nell'anagrafe: verrà registrato al primo accredito.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* AMOUNT INPUT */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Importo di Valore (Ɱ) *
                    </label>
                    <span className="text-xs text-slate-500 font-mono">
                      Saldo: <strong>{wallet?.balance.toFixed(2)} Ɱ</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={wallet?.balance || 50000}
                      required
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] focus:border-transparent text-slate-900"
                    />
                    <span className="absolute right-4 top-3.5 text-lg font-bold text-[#c5a880]">
                      Ɱ
                    </span>
                  </div>
                </div>

                {/* MANDATORY BARTER CATEGORY */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoria di Baratto Solidale *
                  </label>
                  <select
                    value={transferCategory}
                    onChange={(e) => setTransferCategory(e.target.value as BarterCategory)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] focus:border-transparent bg-white text-slate-800"
                  >
                    {BARTER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* MANDATORY BARTER DESCRIPTION */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Causale Obbligatoria (Bene o Servizio) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. 3 kg di frutta biologica, 2 ore di consulenza tecnica..."
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] focus:border-transparent text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    La causale è richiesta per garantire l'etica dello scambio e la conformità al baratto solidale.
                  </p>
                </div>

                {/* PIN AUTHORIZATION IF SET */}
                {wallet?.has_pin && (
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                      PIN di Sicurezza Dispositivo *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="••••"
                      value={transferPin}
                      onChange={(e) => setTransferPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-300 text-center text-xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <p className="text-[10px] text-amber-800 text-center">
                      Inserisci il PIN per autorizzare l'addebito sul tuo portafoglio.
                    </p>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="w-full py-4 rounded-2xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#c5a880]" />
                      <span>Esecuzione trasferimento...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#c5a880]" />
                      <span>Conferma Addebito ed Esegui Baratto</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: RECEIVE VALUE / SHOW QR CODE */}
        {activeTab === 'receive' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-5">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c5a880]/20 text-[#0a1c3e]">
                  Ricevi Pagamento o Valore
                </span>
                <h2 className="text-xl font-bold text-[#0a1c3e] pt-1">Mostra il tuo QR Code</h2>
                <p className="text-xs text-slate-500">
                  L'altro cittadino potrà scansionarlo direttamente con la fotocamera del suo telefono per accreditarti i Mondial.
                </p>
              </div>

              {/* QR CODE CONTAINER */}
              <div className="p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-inner inline-block mx-auto relative group">
                {receiveQrUrl ? (
                  <img 
                    src={receiveQrUrl} 
                    alt="QR Code Mondial" 
                    className="w-64 h-64 mx-auto rounded-xl object-contain shadow-xs"
                  />
                ) : (
                  <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              {/* CITIZEN CODE BADGE */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="text-left font-mono text-xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans">Tuo Codice Cittadino</span>
                  <span className="font-bold text-slate-800">{wallet?.citizen_code || 'NWS-SOV-001'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(wallet?.citizen_code || 'NWS-SOV-001');
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0a1c3e] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiato' : 'Copia'}</span>
                </button>
              </div>

              {/* OPTIONAL PRE-FILLED AMOUNT & DESCRIPTION */}
              <div className="pt-2 text-left space-y-3">
                <details className="text-xs group">
                  <summary className="font-semibold text-[#0a1c3e] hover:text-[#c5a880] cursor-pointer flex items-center gap-1.5 py-1">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Imposta importo o causale specifica nel QR (opzionale)</span>
                  </summary>
                  <div className="pt-3 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Importo richiesto (Ɱ)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Lascia vuoto per importo libero"
                        value={receiveAmount}
                        onChange={(e) => setReceiveAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Causale suggerita
                      </label>
                      <input
                        type="text"
                        placeholder="es. Fornitura legna da ardere..."
                        value={receiveDescription}
                        onChange={(e) => setReceiveDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PUBLIC TRANSPARENT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0a1c3e] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>Registro Pubblico Trasparente dei Baratti</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Transazioni solidali consultabili pubblicamente con codici dei cittadini anonimizzati a tutela della privacy
                </p>
              </div>

              <button
                onClick={loadPublicLedger}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Aggiorna Registro</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4 font-mono">ID Transazione</th>
                      <th className="py-3.5 px-4">Mittente (Anonimizzato)</th>
                      <th className="py-3.5 px-4">Destinatario</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Causale Baratto</th>
                      <th className="py-3.5 px-4 text-right">Valore (Ɱ)</th>
                      <th className="py-3.5 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publicLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Nessun record pubblico disponibile al momento.
                        </td>
                      </tr>
                    ) : (
                      publicLedger.map((row) => (
                        <tr key={row.tx_hash} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {row.tx_hash.slice(0, 16)}...
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-800">
                            {row.masked_sender}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-800">
                            {row.masked_receiver}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate" title={row.description}>
                            {row.description}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0a1c3e]">
                            {row.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} Ɱ
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString('it-IT')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REFERRALS / INVITATIONS */}
        {activeTab === 'referrals' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-2xs">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#0a1c3e]">Programma Solidale +5.000 Ɱ</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  La forza del circuito Mondial si basa sulla nostra comunità. Fai iscrivere <strong>50 persone</strong> al New World State per ricevere un ulteriore accredito immediato di <strong>5.000 Mondial (Ɱ)</strong>.
                </p>
              </div>

              {/* PROGRESS STATUS CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Progresso Attuale:</span>
                  <span className="font-mono font-bold text-indigo-900 text-sm">
                    {currentReferrals} / {referralTarget} Cittadini
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${referralPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Inizio: 0</span>
                  <span>Traguardo: 50 iscritti (+5.000 Ɱ)</span>
                </div>
              </div>

              {/* INVITATION LINK COPY */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Il Tuo Codice Invito Personale
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={wallet?.citizen_code || 'NWS-SOV-001'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm bg-slate-50 text-slate-800 font-bold"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wallet?.citizen_code || 'NWS-SOV-001');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-5 py-3 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#c5a880]" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiato' : 'Copia'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Comunica questo codice al nuovo iscritto: inserendolo durante la registrazione all'Anagrafe del New World State, il sistema collegherà automaticamente l'invito al tuo portafoglio.
                </p>
              </div>

              {onGoToRegister && (
                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={onGoToRegister}
                    className="text-xs font-bold text-[#0a1c3e] hover:text-[#c5a880] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Vai al modulo di registrazione cittadinanza</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: CAMERA QR SCANNER */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#c5a880]" />
                <span className="font-bold text-sm">Scansiona QR Code Cittadino</span>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Graphic */}
              <div className="relative z-10 w-64 h-64 border-2 border-[#c5a880] rounded-3xl flex items-center justify-center pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="w-full h-0.5 bg-red-500/80 animate-pulse" />
              </div>

              {scannerCameraError && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <p className="text-xs text-slate-300">{scannerCameraError}</p>
                  <button
                    onClick={() => setIsScannerOpen(false)}
                    className="px-4 py-2 bg-white/10 rounded-xl text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Chiudi e inserisci manualmente
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 text-center text-xs text-slate-400">
              Inquadra il QR code generato dal dispositivo dell'altro cittadino
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUCCESSFUL TRANSACTION RECEIPT */}
      {transferSuccessTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Baratto Confermato con Successo!
              </span>
              <h3 className="text-2xl font-extrabold text-[#0a1c3e] font-mono">
                -{transferSuccessTx.amount.toFixed(2)} Ɱ
              </h3>
              <p className="text-xs text-slate-500">
                L'importo è stato addebitato e accreditato istantaneamente al destinatario.
              </p>
            </div>

            {/* RECEIPT DETAILS */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Destinatario:</span>
                <span className="font-bold text-slate-800">{transferSuccessTx.receiver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Codice:</span>
                <span className="font-mono text-slate-700">{transferSuccessTx.receiver_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Categoria:</span>
                <span className="font-semibold text-slate-800">{transferSuccessTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Causale:</span>
                <span className="text-slate-800 font-medium truncate max-w-[200px]">{transferSuccessTx.description}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                <span className="text-slate-400">ID Transazione:</span>
                <span className="font-mono text-slate-500">{transferSuccessTx.tx_hash}</span>
              </div>
            </div>

            <button
              onClick={() => setTransferSuccessTx(null)}
              className="w-full py-3.5 rounded-xl bg-[#0a1c3e] text-white font-bold text-xs hover:bg-[#142d5c] transition-colors cursor-pointer"
            >
              Chiudi e Torna al Portafoglio
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SET SECURITY PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Imposta PIN di Sicurezza</h3>
              <p className="text-xs text-slate-500">
                Verrà richiesto dal dispositivo per confermare ogni transazione in uscita.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {pinError}
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nuovo PIN (min. 4 cifre)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-center text-lg tracking-[0.25em] font-mono focus:ring-2 focus:ring-[#0a1c3e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Conferma PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-center text-lg tracking-[0.25em] font-mono focus:ring-2 focus:ring-[#0a1c3e]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="flex-1 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingPin ? 'Salvataggio...' : 'Salva PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK CITIZEN LOGIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0a1c3e] text-[#c5a880] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Accedi con la tua Cittadinanza</h3>
              <p className="text-xs text-slate-500">
                Inserisci le tue credenziali per collegare il tuo portafoglio istituzionale Mondial.
              </p>
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-left">
                {loginError}
              </div>
            )}

            <form onSubmit={handleCitizenLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Codice Cittadino / Username / Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. NWS-IT-2025-0012"
                  value={loginCodeOrUser}
                  onChange={(e) => setLoginCodeOrUser(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0a1c3e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0a1c3e]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
