import React, { useState, useEffect } from 'react';
import { useLegal, LegalConfig } from '../../hooks/useLegal';
import { 
  X, 
  Globe, 
  Shield, 
  Scale, 
  FileText, 
  Accessibility, 
  Printer, 
  Lock,
  EyeOff
} from 'lucide-react';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc: 'privacy' | 'cookies' | 'terms' | 'accessibility';
  language: 'it' | 'en';
}

export default function LegalComplianceModal({ isOpen, onClose, initialDoc, language }: LegalComplianceModalProps) {
  const { config, loading } = useLegal();
  const [docType, setDocType] = useState<'privacy' | 'cookies' | 'terms' | 'accessibility'>(initialDoc);
  const [lang, setLang] = useState<'it' | 'en'>(language);

  useEffect(() => {
    setDocType(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    setLang(language);
  }, [language]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const controller = config?.legal_controller_name || 'New World State Authority';
  const address = config?.legal_controller_address || 'Global Decentralized Infrastructure';
  const email = config?.legal_controller_email || 'privacy@newworldstate.org';
  const cookies = config?.legal_cookies_list || 'Session storage essenziale';
  const score = config?.legal_accessibility_score || 'WCAG 2.1 AA';
  
  const customPrivacy = lang === 'it' ? config?.legal_custom_privacy_it : config?.legal_custom_privacy_en;
  const customTerms = lang === 'it' ? config?.legal_custom_terms_it : config?.legal_custom_terms_en;

  const isIt = lang === 'it';

  // Generate contents
  const getDocDetails = () => {
    switch (docType) {
      case 'privacy':
        return {
          title: isIt ? 'Informativa sulla Privacy' : 'Privacy Policy',
          badge: 'GDPR / CCPA SECURE',
          icon: <Shield className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. TITOLARE DEL TRATTAMENTO DEI DATI</p>
              <p>Il Titolare del trattamento dei dati personali raccolti tramite il Registro Mondiale della Cittadinanza del New World State è <strong>{controller}</strong>, avente sede presso: <em>{address}</em>. È possibile inoltrare domande, richieste o segnalazioni all'Ufficio Privacy tramite l'email ufficiale: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">2. BASE GIURIDICA E FINALITÀ DEL TRATTAMENTO</p>
              <p>Il trattamento dei tuoi dati (nome, cognome, genere, data e luogo di nascita, paese, indirizzo di residenza, email e foto per il riconoscimento) avviene unicamente con il tuo <strong>consenso esplicito e revocabile</strong> (Art. 6.1(a) GDPR) all'atto della registrazione. I dati sono trattati esclusivamente per:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Iscrizione ufficiale nel registro anagrafico digitale della nostra comunità.</li>
                <li>Emissione e validazione tramite crittografia asimmetrica della tua ID Card ufficiale.</li>
                <li>Esercizio del voto democratico digitale nel nostro portale delle riforme legislative.</li>
              </ul>
              <p>Escludiamo categoricamente qualunque forma di profilazione, vendita, incrocio statistico o cessione di dati a broker di marketing e terze parti commerciali.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">3. SICUREZZA, INTEGRITÀ E BACKUP</p>
              <p>Tutti i flussi di registrazione viaggiano su protocolli HTTPS protetti con crittografia end-to-end e sono immagazzinati in server-vault blindati con crittografia dei database a riposo. L'autenticazione è protetta per impedire accessi non autorizzati.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">4. I TUOI DIRITTI (GDPR / CCPA)</p>
              <p>Sulla base della più restrittiva normativa al mondo per la salvaguardia dei dati personali, ti sono garantiti i seguenti diritti assoluti:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Accesso e Portabilità:</strong> Puoi scaricare o ricevere in chiaro tutti i dati in possesso dello Stato.</li>
                <li><strong>Rettifica:</strong> Correzione istantanea dei dati qualora errati o non aggiornati.</li>
                <li><strong>Cancellazione (Oblio):</strong> Rimozione totale e definitiva del tuo record anagrafico dai server con revoca della cittadinanza.</li>
                <li><strong>Revoca del Consenso:</strong> Puoi cessare il trattamento dei dati in qualsiasi momento.</li>
              </ul>

              {customPrivacy && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">5. INFORMAZIONI COMPLEMENTARI</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customPrivacy}</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. DATA CONTROLLER</p>
              <p>The official Data Controller responsible for processing personal records under the New World State Global Citizenship Registry is <strong>{controller}</strong>, with coordinate office and technical deployment at: <em>{address}</em>. For any privacy requests or to exercise your rights, contact our Privacy Desk directly at: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">2. LAWFUL BASIS AND PURPOSES</p>
              <p>The processing of your biographical records (first name, surname, gender, date/place of birth, address, email, and portrait photo) is based on your <strong>explicit and revocable consent</strong> (Art. 6.1(a) GDPR). The purpose of processing is restricted to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Official enrollment in the global sovereign digital registry.</li>
                <li>Issuance, generation, and cryptographic public validation of your Citizen ID Card.</li>
                <li>Democratic voting and referendum participation on our Portal of Democracy.</li>
              </ul>
              <p>We do not profile, commercialize, or share your data with any corporate third parties, advertisements, or data brokers.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">3. DATA SAFETY & ENCRYPTION</p>
              <p>All data transit utilizes robust SSL/TLS protocols and is stored within secure regional databases featuring at-rest AES encryption. System auditing runs continuously with zero automated backdoors.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">4. YOUR RIGHTS UNDER WORLD STANDARDS</p>
              <p>According to the strictest international privacy protection laws, you hold the following rights:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access & Portability:</strong> Obtain a transparent, structured copy of your citizen dossier in JSON/PDF format.</li>
                <li><strong>Rectification:</strong> Correct or modify any inaccurate records.</li>
                <li><strong>Erasure (Right to be Forgotten):</strong> Request the permanent, immediate deletion of your registration profile from all servers.</li>
                <li><strong>Objection:</strong> Revoke consent and request administrative suspension of processing.</li>
              </ul>

              {customPrivacy && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">5. COMPLEMENTARY DISPOSITIONS</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customPrivacy}</p>
                </>
              )}
            </div>
          )
        };
      case 'cookies':
        return {
          title: isIt ? 'Cookie Policy & Tracciamento' : 'Cookie & Tracking Policy',
          badge: 'TRACKER FREE ZONE',
          icon: <EyeOff className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">ZEROTRACKING COOKIE PROTOCOL</p>
              <p>Questo portale applica un protocollo di rispetto totale esente da tracciamenti invasivi. In osservanza della Direttiva Europea ePrivacy e del GDPR, il sito adotta una filosofia <strong>Zero Cookie Statistici/Pubblicitari</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. QUALE STORAGE UTILIZZIAMO?</p>
              <p>Non viene caricata alcuna risorsa pubblicitaria di Google, Meta, o altri intermediari. Memorizziamo unicamente:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Session Storage locale:</strong> Per l'accesso sicuro temporaneo dell'amministratore o dei cittadini.</li>
                <li><strong>Local Storage tecnico:</strong> Per conservare esclusivamente preferenze di visualizzazione (es. lingua selezionata) o salvataggio temporaneo per non perdere i dati del form.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. ELENCO CHIAVI DI STORAGE TECNICHE</p>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[10px] text-slate-600 leading-normal">
                {cookies}
              </p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. CONSENSO DEI COOKIE</p>
              <p>Poiché non impieghiamo cookie di profilazione, per legge <strong>non è richiesto alcun banner di accettazione</strong> o consenso preventivo. Il sito è accessibile in modo fluido senza pop-up fastidiosi, garantendo al contempo il massimo livello di protezione al mondo.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">ZEROTRACKING COOKIE PROTOCOL</p>
              <p>This portal implements a strict user-first policy regarding data storage. In accordance with the EU ePrivacy Directive and GDPR, we execute a <strong>Zero Profiling/Zero Analytics Cookie Policy</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. ACTIVE LOCAL STORAGE</p>
              <p>We do not load scripts or assets from third-party advertising or monitoring networks. We only initiate:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Session Storage:</strong> Used strictly to identify your authenticated state while navigating securely.</li>
                <li><strong>Local Technical Storage:</strong> Used to store basic interface parameters, such as selected language (Italian or English) to maintain readability preferences.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. REGISTERED TECHNICAL TRACKERS</p>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[10px] text-slate-600 leading-normal">
                {cookies}
              </p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. CONSENT PROTOCOLS</p>
              <p>Because zero tracking or advertising cookies are initialized, under European guidelines <strong>no disruptive tracking banners are necessary</strong>, as technical cookie storage is strictly exempted. Seamless navigation, absolute sovereignty.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: isIt ? 'Termini e Condizioni Civiche' : 'Terms & Conditions of Citizenship',
          badge: 'CIVIC TREATY 1.0',
          icon: <Scale className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. ADESIONE CIVICA DIGITALE</p>
              <p>L'iscrizione ufficiale all'Anagrafe Mondiale del New World State sancisce la sottoscrizione morale alla Costituzione e alla Carta dei Diritti della nostra comunità globale digitale, basata sulla pace universale, il progresso scientifico e l'uguaglianza sociale senza confini fisici.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. CREDENZIALI E VALIDITÀ LEGALE</p>
              <p>I documenti digitali, ID Card ed attestati generati dal sistema costituiscono certificazione crittografica di appartenenza digitale al New World State. È vietato qualunque uso fraudolento, falsificazione o cessione a terzi non autorizzati per scopi illeciti.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. DEMOCRAZIA DIRETTA E DOVERI CIVICI</p>
              <p>L'approvazione formale dello stato di cittadinanza conferisce il diritto inviolabile di partecipazione diretta tramite referendum, discussioni pubbliche e deposito di proposte legislative sul portale.</p>

              {customTerms && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. CLAUSOLE INTEGRATIVE SPECIFICHE</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customTerms}</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. DIGITAL CIVIC AFFILIATION</p>
              <p>Official registration within the World Registry of the New World State constitutes a moral commitment to the Constitution and the Charter of Rights, dedicated to peace, borderless scientific advancement, and digital equality.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. CREDENTIALS AND USE RESTRICTIONS</p>
              <p>The digital certificates, ID Cards, and signatures issued by this system remain the cryptographic property of the New World State Authority, licensed for personal, peaceful use. Falsification, forgery, or malicious use for activities violating human rights is strictly prohibited.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. DIRECT DEMOCRACY & CIVIC ENGAGEMENT</p>
              <p>Citizenship verification grants active and passive political participation within the Democracy Portal, allowing the co-authoring and voting of global sovereign resolutions.</p>

              {customTerms && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. SUPPLEMENTARY COVENANTS</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customTerms}</p>
                </>
              )}
            </div>
          )
        };
      case 'accessibility':
        return {
          title: isIt ? 'Dichiarazione di Accessibilità' : 'Accessibility Statement',
          badge: 'WCAG 2.1 AA COMPLIANT',
          icon: <Accessibility className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">ACCESSIBILITÀ DIGITALE COME DIRITTO CIVILE</p>
              <p>Il New World State sancisce che l'accesso senza barriere a strumenti, portali e registri della cittadinanza digitale sia un'estensione diretta dell'uguaglianza civile. Ci impegniamo ad applicare elevatissimi standard tecnologici d'inclusione.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. GRADO DI CONFORMITÀ REQUISITI</p>
              <p>Questo portale rispetta pienamente i requisiti previsti dalle linee guida internazionali <strong>WCAG 2.1 a livello AA</strong> (Web Content Accessibility Guidelines) e le leggi statali sull'accessibilità (ADA Act negli Stati Uniti, Standard Europei EN 301 549).</p>
              <p>Stato di conformità tecnica accertato: <strong className="text-emerald-700 uppercase">{score}</strong></p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. TECNOLOGIE DI SUPPORTO ED INCLUSIONE</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supporto Screen Reader:</strong> Codice semantico pulito con attributi ARIA strutturati per una sintesi vocale impeccabile delle anagrafiche.</li>
                <li><strong>Controllo via Tastiera:</strong> Gli utenti possono scorrere e interagire con ogni form, bottone o tab esclusivamente tramite tasto TAB, con focus ad alto contrasto visibile.</li>
                <li><strong>Aumento Caratteri e Zoom:</strong> Layout fluido che tollera ridimensionamenti dei caratteri del browser fino al 200% senza alcuna alterazione funzionale.</li>
                <li><strong>Rapporto Contrasto Cromatico:</strong> Calcolato con accuratezza superiore a 4.5:1 per contrastare l'affaticamento visivo e favorire l'ipovisione.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. FEEDBACK ED INFORMAZIONI DI CONTATTO</p>
              <p>Se riscontri barriere digitali o difficoltà d'uso, ti preghiamo di contattare immediatamente l'Ufficio Inclusione via email all'indirizzo: <strong className="text-[#0a1c3e]">{email}</strong>. Implementeremo i correttivi tecnologici necessari entro 48 ore.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">DIGITAL INCLUSION AS A CIVIC RIGHT</p>
              <p>The New World State views barrier-free digital access to citizenship systems as a fundamental civil right. We commit to continuous auditing and implementation of international inclusion standards.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. STANDARDS AND COMPLIANCE</p>
              <p>This platform has been engineered to comply with the <strong>WCAG 2.1 Level AA</strong> standard (Web Content Accessibility Guidelines) and regional inclusion directives (such as the ADA in the United States or EN 301 549 in Europe).</p>
              <p>Current Conformance Metric: <strong className="text-emerald-700 uppercase">{score}</strong></p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. INTEGRATED ACCESSIBILITY FEATURES</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Screen Reader Semantics:</strong> Strategic placement of ARIA labels, descriptive alt-text, and unique element IDs to support modern speech engines.</li>
                <li><strong>Keyboard Navigation:</strong> Thorough focus rings and tab-index configurations to enable navigation entirely without a cursor.</li>
                <li><strong>Aesthetic Contrast:</strong> Strict compliance with the 4.5:1 text-to-background contrast ratio to aid visually impaired individuals.</li>
                <li><strong>Responsive Fluidity:</strong> Seamless layout adaptations supporting browser zooms up to 200% with zero loss of content integrity.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. FEEDBACK AND ACCESSIBILITY OFFICER</p>
              <p>Should you find any accessibility issues on this site, please send a brief message to: <strong className="text-[#0a1c3e]">{email}</strong>. Our technical team will prioritize and resolve the barrier within 48 hours.</p>
            </div>
          )
        };
    }
  };

  const currentDoc = getDocDetails();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Intestazione Modal */}
        <div className="bg-[#0a1c3e] p-5 text-white flex items-center justify-between border-b border-[#c5a880]/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-gold/15 rounded-lg border border-brand-gold/25">
              {currentDoc.icon}
            </div>
            <div>
              <span className="text-[8px] tracking-widest font-mono text-brand-gold font-bold block uppercase">{currentDoc.badge}</span>
              <h3 className="text-sm font-serif font-bold text-[#f7f5f0]">{currentDoc.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Selettore Lingua */}
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/10">
              <button 
                onClick={() => setLang('it')}
                className={`px-2 py-1 rounded text-[9px] font-bold transition ${lang === 'it' ? 'bg-white text-[#0a1c3e] shadow' : 'text-white/60 hover:text-white'}`}
              >
                IT
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-[9px] font-bold transition ${lang === 'en' ? 'bg-white text-[#0a1c3e] shadow' : 'text-white/60 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            <button 
              onClick={handlePrint}
              title={isIt ? "Stampa Documento" : "Print Document"}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo Documento Scrollabile */}
        <div className="p-6 md:p-8 overflow-y-auto bg-[#f7f5f0] flex-1 text-slate-800">
          <div className="bg-white border border-[#c5a880]/20 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Watermark in background */}
            <div className="absolute right-0 bottom-0 opacity-[0.01] transform translate-x-12 translate-y-12 pointer-events-none">
              <Scale className="w-96 h-96 text-brand-blue" />
            </div>

            {/* Header Formale Carta */}
            <div className="border-b border-dashed border-slate-200 pb-4 text-center space-y-1.5 relative">
              <p className="font-serif font-extrabold tracking-widest text-[#0a1c3e] text-[10px] uppercase">NEW WORLD STATE AUTHORITY</p>
              <p className="text-[7px] text-slate-400 font-mono tracking-widest uppercase">Official Legal compliance Protocol</p>
              <div className="h-0.5 w-16 bg-brand-gold/30 mx-auto rounded-full mt-1" />
            </div>

            {/* Contenuto Dinamico */}
            {currentDoc.html}

            {/* Firma e Sigillo */}
            <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between text-[8px] text-slate-400 font-mono gap-4">
              <div className="text-center md:text-left">
                <p>DOCUMENT CODE: NWS-COMPLIANCE-{docType.toUpperCase()}-2026</p>
                <p>STATUS: ACTIVE & VERIFIED</p>
              </div>
              <div className="text-center md:text-right border-l md:border-l-0 pl-4 md:pl-0">
                <p className="text-brand-gold font-bold">NEW WORLD STATE CHANCELLERY</p>
                <p>GENUINE DECENTRALIZED AUTHENTICATION</p>
              </div>
            </div>

          </div>
        </div>

        {/* Selettore Tab Inferiore */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 flex justify-center gap-1 flex-wrap">
          <button
            onClick={() => setDocType('privacy')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${docType === 'privacy' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setDocType('cookies')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${docType === 'cookies' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Cookie Policy
          </button>
          <button
            onClick={() => setDocType('terms')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${docType === 'terms' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            {isIt ? 'Termini' : 'Terms'}
          </button>
          <button
            onClick={() => setDocType('accessibility')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${docType === 'accessibility' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            {isIt ? 'Accessibilità' : 'Accessibility'}
          </button>
        </div>

      </div>
    </div>
  );
}
