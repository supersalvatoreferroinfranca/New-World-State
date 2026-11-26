import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  Mail,
  MessageSquare,
  Send,
  Share2,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Link as LinkIcon,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { getPublicCanonicalOrigin } from '../../utils/urlUtils';

export interface ReferredCitizenDetail {
  id: number;
  citizenCode: string;
  fullName: string;
  status: string;
  registeredAt: string;
}

interface ReferralProgramPanelProps {
  citizen: {
    id: number;
    citizenCode?: string;
    username?: string;
    firstName?: string;
    surname?: string;
    status?: string;
  };
  walletReferralCount?: number;
  walletBonusAwarded?: boolean;
  onGoToRegister?: () => void;
  compact?: boolean;
}

export default function ReferralProgramPanel({
  citizen,
  walletReferralCount = 0,
  walletBonusAwarded = false,
  onGoToRegister,
  compact = false
}: ReferralProgramPanelProps) {
  const [totalCount, setTotalCount] = useState<number>(walletReferralCount);
  const [target, setTarget] = useState<number>(50);
  const [bonusAwarded, setBonusAwarded] = useState<boolean>(walletBonusAwarded);
  const [referredCitizens, setReferredCitizens] = useState<ReferredCitizenDetail[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState<boolean>(false);

  const [recipientName, setRecipientName] = useState<string>('');
  const [messageTone, setMessageTone] = useState<'solidale' | 'amichevole' | 'diretto'>('solidale');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedMsg, setCopiedMsg] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const personalCode = (citizen.citizenCode || citizen.username || `NWS-CIT-${citizen.id}`).trim().toUpperCase();
  const baseOrigin = getPublicCanonicalOrigin();
  const inviteLink = `${baseOrigin}/?tab=register&ref=${encodeURIComponent(personalCode)}`;

  const buildPresetMessage = useCallback(
    (name: string, tone: 'solidale' | 'amichevole' | 'diretto') => {
      const cleanName = name.trim();
      const greeting = cleanName ? `Ciao ${cleanName},` : 'Ciao!';

      if (tone === 'amichevole') {
        return `${greeting} voglio invitarti ad unirti al New World State e al nostro circuito di Baratto Solidale Mondial (Ɱ).\n\nIscrivendoti gratuitamente tramite questo mio invito personale riceverai il tuo Passaporto Digitale Sovrano e un credito immediato di 5.000 Ɱ da utilizzare per scambiare beni, cibo e servizi con gli altri cittadini.\n\nRegistrati qui (il mio codice invito ${personalCode} verrà abbinato automaticamente):\n${inviteLink}`;
      }

      if (tone === 'diretto') {
        return `${greeting} registrati gratuitamente all'Anagrafe del New World State tramite il mio link diretto per ricevere 5.000 Ɱ di credito solidale immediato:\n${inviteLink}\n\nCodice Segnalatore: ${personalCode}`;
      }

      return `${greeting} ti invito a scoprire il New World State, la comunità digitale globale fondata su sovranità individuale, democrazia diretta e mutuo credito solidale.\n\nCon la cittadinanza gratuita accedi al sistema di baratto equo Mondial (Ɱ) con 5.000 Ɱ di credito di benvenuto per scambiare prodotti e competenze senza commissioni né speculazioni.\n\nUsa questo link ufficiale per completare l'iscrizione a mio nome:\n${inviteLink}\n\nCodice Cittadino Segnalatore: ${personalCode}`;
    },
    [inviteLink, personalCode]
  );

  useEffect(() => {
    setCustomMessage(buildPresetMessage(recipientName, messageTone));
  }, [recipientName, messageTone, buildPresetMessage]);

  const fetchReferrals = useCallback(async () => {
    if (!citizen?.id) return;
    setIsLoadingRefs(true);
    try {
      const res = await fetch(`/api/mondial/my-referrals?citizenId=${encodeURIComponent(citizen.id)}`);
      const data = await res.json();
      if (data.success) {
        setTotalCount(data.totalCount ?? 0);
        setTarget(data.target ?? 50);
        setBonusAwarded(Boolean(data.bonusAwarded));
        setReferredCitizens(Array.isArray(data.referredCitizens) ? data.referredCitizens : []);
      }
    } catch (err) {
      console.warn('Errore caricamento segnalazioni:', err);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [citizen?.id]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const progressPercent = Math.min(100, Math.round((totalCount / target) * 100));
  const remaining = Math.max(0, target - totalCount);

  const handleCopyText = async (text: string, which: 'link' | 'msg' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else if (which === 'msg') {
        setCopiedMsg(true);
        setTimeout(() => setCopiedMsg(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(customMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const shareTelegram = () => {
    const textWithoutLink = customMessage.replace(inviteLink, '').trim();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(textWithoutLink)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Invito al New World State e Circuito Solidale Mondial (5.000 Ɱ inclusi)');
    const body = encodeURIComponent(customMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Invito New World State & Mondial (Ɱ)',
          text: customMessage,
          url: inviteLink
        });
      } catch (err) {
        console.log('Native share cancelled', err);
      }
    }
  };

  return (
    <div className={compact ? 'space-y-6' : 'max-w-4xl mx-auto space-y-6'}>
      {/* SEZIONE 1: PROGRESSO SOLIDALE +5.000 Ɱ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0a1c3e] text-amber-300 flex items-center justify-center shrink-0 shadow-sm border border-amber-400/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0a1c3e]">
                Programma Solidale &amp; Segnalazioni (+5.000 Ɱ)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1 max-w-xl">
                Condividi il tuo link personale: ogni nuovo cittadino che si iscrive tramite il tuo invito viene abbinato al tuo profilo. Al raggiungimento di <strong>{target} iscritti</strong> ricevi un bonus immediato di <strong>5.000 Ɱ</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchReferrals}
            disabled={isLoadingRefs}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-center shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRefs ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Aggiorna Stato</span>
          </button>
        </div>

        {/* PROGRESS BAR CARD */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0a1c3e] to-[#0f2858] text-white space-y-3 shadow-md border border-amber-400/20">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <span className="font-semibold text-amber-200 uppercase tracking-wider font-mono text-[11px]">
              Avanzamento Obiettivo Solidale
            </span>
            <span className="font-mono font-black text-base text-white">
              {totalCount} / {target} Cittadini
            </span>
          </div>

          <div className="w-full bg-white/15 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-300">
            <span>
              {bonusAwarded
                ? '✓ Traguardo raggiunto! Bonus +5.000 Ɱ già accreditato nel tuo portafoglio.'
                : `Mancano ${remaining} segnalazioni al premio extra di +5.000 Ɱ`}
            </span>
            <span className="font-mono font-bold text-amber-300">{progressPercent}% completato</span>
          </div>
        </div>

        {/* LINK PERSONALE E CODICE INVITO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Link Diretto di Iscrizione Abbinato al Tuo Profilo
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50 text-slate-800 font-semibold select-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(inviteLink, 'link')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-[#142d5c] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiato' : 'Copia Link'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Codice Segnalatore
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={personalCode}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 font-mono text-xs bg-amber-50/70 text-[#0a1c3e] font-bold select-all"
              />
              <button
                type="button"
                onClick={() => handleCopyText(personalCode, 'code')}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Ok' : 'Copia'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* MESSAGGIO PREFORMATTATO E PULSANTI DI CONDIVISIONE */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0a1c3e] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Messaggio Preformattato Pronto da Condividere</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Personalizza il nome del destinatario o scegli il tono, poi invia con un clic su WhatsApp, Email o Telegram.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nome del destinatario (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="es. Marco, Giulia, Luca..."
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Tono del messaggio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solidale', label: 'Solidale' },
                    { id: 'amichevole', label: 'Amichevole' },
                    { id: 'diretto', label: 'Diretto' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMessageTone(opt.id as 'solidale' | 'amichevole' | 'diretto')}
                      className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        messageTone === opt.id
                          ? 'bg-[#0a1c3e] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="min-h-[44px] bg-[#25D366] hover:bg-[#1ebe5d] text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={shareTelegram}
                  className="min-h-[44px] bg-[#0088cc] hover:bg-[#0077b3] text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={shareEmail}
                  className="min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
                >
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(customMessage, 'msg')}
                  className="min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  {copiedMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMsg ? 'Messaggio Copiato' : 'Copia Testo'}</span>
                </button>
              </div>

              {typeof navigator !== 'undefined' && !!navigator.share && (
                <button
                  type="button"
                  onClick={shareNative}
                  className="w-full min-h-[44px] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Condividi con App del Dispositivo</span>
                </button>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Anteprima Messaggio (Modificabile)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={7}
                className="w-full flex-1 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-700 leading-relaxed resize-none outline-none focus:ring-2 focus:ring-[#0a1c3e]/20"
              />
            </div>
          </div>
        </div>

        {onGoToRegister && (
          <div className="pt-3 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-xs font-bold text-[#0a1c3e] hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer py-1"
            >
              <span>Vai al modulo di registrazione cittadinanza</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* SEZIONE 2: ELENCO CITTADINI ISCRITTI GRAZIE AL TUO CONTRIBUTO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0a1c3e] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Cittadini Iscritti grazie al tuo Contributo ({referredCitizens.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitora in tempo reale chi si è registrato utilizzando il tuo link o codice segnalatore e lo stato di approvazione della pratica anagrafica.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Cittadino Segnalato</th>
                <th className="py-3.5 px-4 font-mono">Codice Cittadino</th>
                <th className="py-3.5 px-4">Data Registrazione</th>
                <th className="py-3.5 px-4 text-center">Stato Anagrafe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingRefs ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                    Recupero segnalazioni in corso...
                  </td>
                </tr>
              ) : referredCitizens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Nessun cittadino ancora registrato tramite il tuo invito.</p>
                    <p className="text-[11px] text-slate-400">
                      Condividi il link qui sopra: ogni persona che completa l&apos;iscrizione apparirà automaticamente in questo elenco.
                    </p>
                  </td>
                </tr>
              ) : (
                referredCitizens.map((ref) => {
                  const status = ref.status || 'pending';
                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {ref.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0a1c3e]">
                        {ref.citizenCode}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ref.registeredAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Approvato
                          </span>
                        ) : status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Respinto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            In Attesa di Firma
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
