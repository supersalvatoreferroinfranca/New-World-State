import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  X, 
  Send, 
  FileText, 
  Award, 
  Link as LinkIcon, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Newspaper, 
  UserCheck 
} from 'lucide-react';

interface ReporterCandidacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: any;
  onApplicationSubmitted?: () => void;
}

export default function ReporterCandidacyModal({
  isOpen,
  onClose,
  citizen,
  onApplicationSubmitted
}: ReporterCandidacyModalProps) {
  const { tText } = useI18n();

  const [professionalCredentials, setProfessionalCredentials] = useState('');
  const [motivation, setMotivation] = useState('');
  const [cvSummary, setCvSummary] = useState('');
  const [referencesOnline, setReferencesOnline] = useState('');
  const [referencesPaper, setReferencesPaper] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [neutralityDeclaration, setNeutralityDeclaration] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Existing application state if user has already submitted
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (isOpen && citizen) {
      setError(null);
      setSuccessMsg(null);
      // Pre-fill default local area from citizen residence if available
      const defaultArea = [citizen.residenceCity, citizen.residenceProvince, citizen.residenceCountry]
        .filter(Boolean)
        .join(', ');
      setLocalArea(defaultArea || '');

      // Check if citizen has existing candidacy application
      fetchMyApplication();
    }
  }, [isOpen, citizen]);

  const fetchMyApplication = async () => {
    if (!citizen?.id && !citizen?.citizenCode && !citizen?.email) return;
    setLoadingExisting(true);
    try {
      const citizenId = citizen.id || citizen.citizenCode || citizen.email;
      const res = await fetch(`/api/role-applications/my?citizenId=${encodeURIComponent(citizenId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.application) {
          setExistingApplication(data.application);
        } else {
          setExistingApplication(null);
        }
      }
    } catch (e) {
      console.warn('Failed to load existing candidacy application:', e);
    } finally {
      setLoadingExisting(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalCredentials.trim()) {
      setError(tText('Please specify your professional credentials or qualifications.', 'Specificare le proprie credenziali o qualifiche professionali.'));
      return;
    }
    if (!motivation.trim()) {
      setError(tText('Please explain why you wish to perform this neutral reporter role.', 'Specificare perché desideri svolgere questo ruolo di cronista neutrale.'));
      return;
    }
    if (!cvSummary.trim()) {
      setError(tText('Please summarize your professional CV and journalism background.', 'Inserisci un riepilogo del tuo curriculum professionale.'));
      return;
    }
    if (!localArea.trim()) {
      setError(tText('Please specify your local coverage area (e.g. municipality, region).', 'Specifica la tua area locale di riferimento (comune, provincia o regione).'));
      return;
    }
    if (!neutralityDeclaration) {
      setError(tText('You must accept the neutrality and impartiality declaration.', 'Devi accettare la dichiarazione di neutralità ed imparzialità del cronista.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      citizen_id: citizen?.id || `mem-${Date.now()}`,
      citizen_name: `${citizen?.firstName || ''} ${citizen?.surname || ''}`.trim() || citizen?.username || 'Cittadino',
      citizen_code: citizen?.citizenCode || citizen?.code || 'N/A',
      citizen_email: citizen?.email || '',
      role_id: 8,
      role_name: 'Cronista Locale',
      professional_credentials: professionalCredentials.trim(),
      motivation: motivation.trim(),
      cv_summary: cvSummary.trim(),
      references_online: referencesOnline.trim(),
      references_paper: referencesPaper.trim(),
      local_area: localArea.trim()
    };

    try {
      const res = await fetch('/api/role-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(tText('Candidacy submitted successfully! Administrators will review your application in the Admin Console.', 'Candidatura inviata con successo! Gli amministratori esamineranno la tua richiesta nella Consolle Amministratore.'));
        setExistingApplication(data.application || payload);
        if (onApplicationSubmitted) onApplicationSubmitted();
      } else {
        setError(data.message || tText('Failed to submit application. Please try again.', 'Impossibile inviare la candidatura. Riprova.'));
      }
    } catch (err: any) {
      setError(err.message || tText('Network error while submitting candidacy.', 'Errore di connessione durante l\'invio della candidatura.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-[#c5a880]/40 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a1c3e] text-white p-6 border-b border-[#c5a880]/30 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-tech text-brand-gold uppercase tracking-widest block">
                {tText('Operational Role Candidacy', 'Candidatura Incarico Operativo')}
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                {tText('Apply as Local Neutral Reporter', 'Candidatura a Cronista Locale')}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Role Mandate Notice Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{tText('Mandate & Scope of Local Reporter', 'Scopo e Mandato del Cronista Locale')}</span>
            </div>
            <p className="leading-relaxed text-amber-800 font-light">
              {tText(
                'The local reporter acts as a neutral chronicler of events and incidents in their local area, providing verified photos, videos, and objective reports for the State Journal.',
                'Lo scopo dell\'incaricato è quello di cronista neutrale di eventi e accadimenti che si verificano nell\'area locale in cui vive, fornendo foto, video e testi imparziali ed accurati.'
              )}
            </p>
          </div>

          {/* Existing Application Status View */}
          {existingApplication && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-gold" />
                  {tText('Submitted Application Status:', 'Stato Candidatura Inviata:')}
                </span>

                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  existingApplication.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : existingApplication.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {existingApplication.status === 'approved'
                    ? tText('APPROVED', 'APPROVATA')
                    : existingApplication.status === 'rejected'
                    ? tText('REJECTED', 'RESPINTA')
                    : tText('PENDING ADMIN REVIEW', 'IN REVISIONE AMMINISTRATIVA')}
                </span>
              </div>

              {existingApplication.status === 'approved' && (
                <p className="text-xs text-emerald-700 font-medium">
                  {tText(
                    'Congratulations! Your candidacy has been approved. You are now officially authorized as a Local Reporter. You can create and publish articles.',
                    'Congratulazioni! La tua candidatura è stata approvata. Sei ora ufficialmente autorizzato come Cronista Locale ed hai pieno accesso al CMS articoli!'
                  )}
                </p>
              )}

              {existingApplication.status === 'rejected' && existingApplication.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>{tText('Rejection Reason:', 'Motivazione del Rifiuto:')}</strong> {existingApplication.rejection_reason}
                </div>
              )}

              {existingApplication.status === 'pending' && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tText(
                    'Your candidacy is currently queued for evaluation by administrators in the Admin Console. You will be notified as soon as it is reviewed.',
                    'La tua candidatura è attualmente in fase di valutazione da parte degli amministratori nella Consolle Amministratore. Riceverai riscontro al termine della revisione.'
                  )}
                </p>
              )}
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Candidacy Form */}
          {(!existingApplication || existingApplication.status === 'rejected') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Professional Credentials */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-gold" />
                  <span>{tText('1. Professional Credentials & Registration', '1. Credenziali Professionali e Titoli')} *</span>
                </label>
                <input
                  type="text"
                  value={professionalCredentials}
                  onChange={(e) => setProfessionalCredentials(e.target.value)}
                  placeholder={tText('e.g. Press Card #12345, Member of Journalists Guild, Degree in Communications, Independent Photojournalist...', 'Es. Tessera Ordine dei Giornalisti n° 12345, Pubblicista, Laurea in Scienze della Comunicazione, Fotoreporter...')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                  required
                />
              </div>

              {/* Motivation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  <span>{tText('2. Motivation & Role Purpose', '2. Motivazione per il Ruolo')} *</span>
                </label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={3}
                  placeholder={tText('Explain why you wish to serve as a local neutral chronicler in your territory...', 'Specifica perché desideri svolgere questo ruolo di cronista locale e come intendi contribuire all\'informazione neutrale...')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none resize-none"
                  required
                />
              </div>

              {/* Professional CV Summary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-gold" />
                  <span>{tText('3. Professional Curriculum & Background', '3. Curriculum Professionale')} *</span>
                </label>
                <textarea
                  value={cvSummary}
                  onChange={(e) => setCvSummary(e.target.value)}
                  rows={3}
                  placeholder={tText('Summarize your education, journalistic background, media collaborations, and past work...', 'Sintetizza il tuo percorso di studi, esperienze di collaborazione con testate, quotidiani o media locali...')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none resize-none"
                  required
                />
              </div>

              {/* References Online & Paper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-brand-gold" />
                    <span>{tText('4a. Online References', '4a. Referenze Online')}</span>
                  </label>
                  <textarea
                    value={referencesOnline}
                    onChange={(e) => setReferencesOnline(e.target.value)}
                    rows={2}
                    placeholder={tText('URLs to published articles, online portfolios, videos...', 'Link ad articoli pubblicati, portfolio online, video...')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                    <span>{tText('4b. Paper / Print References', '4b. Referenze Cartacee')}</span>
                  </label>
                  <textarea
                    value={referencesPaper}
                    onChange={(e) => setReferencesPaper(e.target.value)}
                    rows={2}
                    placeholder={tText('Names of newspapers, magazines, books or print press published...', 'Testate cartacee, quotidiani locali, riviste stampate o libri...')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Coverage Local Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-gold" />
                  <span>{tText('5. Local Coverage Area', '5. Area Locale di Copertura')} *</span>
                </label>
                <input
                  type="text"
                  value={localArea}
                  onChange={(e) => setLocalArea(e.target.value)}
                  placeholder={tText('e.g. City of Florence, Tuscany, Italy', 'Es. Comune di Firenze, Provincia di Roma, Regione Lombardia...')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                  required
                />
              </div>

              {/* Neutrality Oath Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="neutrality_declaration"
                  checked={neutralityDeclaration}
                  onChange={(e) => setNeutralityDeclaration(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#0a1c3e] rounded border-slate-300 focus:ring-[#0a1c3e] cursor-pointer"
                />
                <label htmlFor="neutrality_declaration" className="text-xs text-slate-700 cursor-pointer leading-relaxed">
                  <strong>{tText('Neutrality & Objectivity Commitment:', 'Impegno di Neutralità ed Imparzialità:')}</strong>{' '}
                  {tText(
                    'I solemnly declare to act as an objective, neutral chronicler of local events, providing accurate photos, videos, and texts without political bias or propaganda.',
                    'Dichiaro solennemente di operare come cronista imparziale e neutrale di eventi e fatti locali, fornendo foto, video e testi veritieri senza condizionamenti politici o propagandistici.'
                  )}
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {tText('Cancel', 'Annulla')}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#0a1c3e] hover:bg-[#122852] text-brand-gold font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg border border-brand-gold/40 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? tText('Submitting...', 'Invio in corso...') : tText('Submit Application', 'Invia Candidatura')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
