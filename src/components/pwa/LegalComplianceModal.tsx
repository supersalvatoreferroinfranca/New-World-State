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
  initialDoc: 'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa';
  language: 'it' | 'en';
}

export default function LegalComplianceModal({ isOpen, onClose, initialDoc, language }: LegalComplianceModalProps) {
  const { config, loading } = useLegal();
  const [docType, setDocType] = useState<'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa'>(initialDoc);
  const [lang, setLang] = useState<'it' | 'en'>(language);
  const [ccpaOptOut, setCcpaOptOut] = useState<boolean>(() => {
    return localStorage.getItem('nws_ccpa_optout') !== 'false'; // defaults to true (opted out / do not sell)
  });

  const handleCcpaToggle = (val: boolean) => {
    setCcpaOptOut(val);
    localStorage.setItem('nws_ccpa_optout', String(val));
  };

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
          title: isIt ? 'Informativa sulla Privacy (Privacy Policy)' : 'Privacy Policy',
          badge: 'GDPR / CCPA / APP COMPLIANT',
          icon: <Shield className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 mb-4">
                <strong>DATA DI EFFICACIA:</strong> 7 Luglio 2026 (Ultimo aggiornamento)
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. TITOLARE DEL TRATTAMENTO DEI DATI</p>
              <p>Il Titolare del trattamento dei dati personali raccolti tramite il Registro Mondiale della Cittadinanza del New World State è <strong>{controller}</strong>, avente sede presso: <em>{address}</em>. È possibile inoltrare domande, richieste o esercitare i propri diritti scrivendo direttamente all'Ufficio Privacy tramite l'email ufficiale: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">2. TIPOLOGIA DI DATI TRATTATI E MODALITÀ</p>
              <p>Raccogliamo ed elaboriamo le seguenti categorie di dati forniti direttamente dall'utente in fase di registrazione o interazione:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Dati Anagrafici e Biografici:</strong> Nome, cognome, genere, data e luogo di nascita, paese di origine, indirizzo di residenza fisica.</li>
                <li><strong>Dati di Contatto:</strong> Indirizzo email, preferenze di lingua.</li>
                <li><strong>Dati Biometrici/Identificativi:</strong> Foto ritratto per il riconoscimento facciale e l'emissione dei documenti d'identità.</li>
                <li><strong>Dati d'Uso Tecnici:</strong> Indirizzo IP (raccolto temporaneamente dai nostri sistemi e partner per motivi di sicurezza) e identificativi dei dispositivi per le notifiche regionali.</li>
              </ul>
              <p>I dati vengono trattati tramite strumenti elettronici e informatici, con l'adozione di rigorose misure di sicurezza per prevenire la perdita dei dati, usi illeciti o accessi non autorizzati.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">3. BASE GIURIDICA E FINALITÀ DEL TRATTAMENTO</p>
              <p>Il trattamento dei tuoi dati personali si fonda sulle seguenti basi giuridiche:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Consenso Esplicito e Revocabile (Art. 6.1(a) GDPR):</strong> Fornito liberamente all'atto della registrazione per l'iscrizione anagrafica e l'elaborazione del ritratto cartaceo/digitale.</li>
                <li><strong>Esecuzione di un Accordo/Contratto (Art. 6.1(b) GDPR):</strong> Erogazione dei servizi associati alla cittadinanza digitale, tra cui l'emissione e la validazione crittografica della ID Card e del passaporto ufficiale.</li>
                <li><strong>Legittimo Interesse (Art. 6.1(f) GDPR):</strong> Protezione dell'infrastruttura di voto da frodi elettorali ed attacchi informatici.</li>
              </ul>
              <p>I tuoi dati sono trattati unicamente per l'iscrizione anagrafica, la validazione della ID Card, la partecipazione alle riforme legislative democratiche tramite voto elettronico, l'invio di notifiche istituzionali e l'adempimento di obblighi di legge dello Stato. Escludiamo categoricamente qualunque forma di profilazione pubblicitaria, vendita o cessione di dati a terze parti commerciali.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">4. TRASFERIMENTI DI DATI OLTRE FRONTIERA E SICUREZZA</p>
              <p>Per sua natura, il New World State adotta un'infrastruttura di server decentralizzata a livello globale. I dati possono essere archiviati e trasferiti in server sicuri situati al di fuori dello Spazio Economico Europeo (SEE) o del tuo paese di origine (compresa l'Australia). Al fine di garantire un livello di protezione equivalente a quello stabilito dal GDPR e dall'Australian Privacy Principle 8 (APP 8), tutti i trasferimenti transfrontalieri avvengono esclusivamente nel rispetto di idonee garanzie legali, incluse le <strong>Clausole Contrattuali Standard (Standard Contractual Clauses - SCC)</strong> adottate dalla Commissione Europea e robusti standard di crittografia AES-256 a riposo e TLS 1.3 in transito.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">5. I TUOI DIRITTI (GDPR / CCPA / CPRA)</p>
              <p>In conformità con i più elevati standard globali di salvaguardia della privacy, ti garantiamo i seguenti diritti esigibili in qualsiasi momento:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Diritto di Accesso (Art. 15 GDPR):</strong> Ricevere conferma se sia o meno in corso un trattamento e scaricare una copia strutturata dei tuoi dati personali.</li>
                <li><strong>Diritto di Rettifica (Art. 16 GDPR):</strong> Ottenere la correzione tempestiva di informazioni inesatte o incomplete.</li>
                <li><strong>Diritto alla Cancellazione / Oblio (Art. 17 GDPR):</strong> Richiedere l'eliminazione definitiva e irreversibile del tuo dossier di cittadinanza da tutti i sistemi.</li>
                <li><strong>Diritto di Limitazione del Trattamento (Art. 18 GDPR):</strong> Ottenere il blocco temporaneo del trattamento in caso di contestazioni.</li>
                <li><strong>Diritto alla Portabilità dei Dati (Art. 20 GDPR):</strong> Ricevere i tuoi dati in formato leggibile da dispositivo automatico.</li>
                <li><strong>Diritto di Opposizione (Art. 21 GDPR):</strong> Opporti in qualsiasi momento al trattamento basato sul legittimo interesse.</li>
                <li><strong>Revoca del Consenso:</strong> Revocare in qualsiasi momento il consenso precedentemente fornito, senza pregiudicare la liceità del trattamento basata sul consenso prima della revoca.</li>
                <li><strong>Diritto di Proporre Reclamo:</strong> Presentare un reclamo formale all'Autorità Garante per la Protezione dei Dati Personali competente del tuo paese di residenza.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">6. SERVIZI DI TERZE PARTI CON ACCESSO AI DATI</p>
              <p>Per garantire la sicurezza tecnica, mitigare attacchi dannosi e visualizzare l'interfaccia grafica con prestazioni elevate, ci avvaliamo dei seguenti partner:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Cloudflare (Cloudflare, Inc.):</strong> Protezione del sito contro attacchi di forza bruta e DDoS. Cloudflare raccoglie metadati tecnici e indirizzi IP per scopi di instradamento sicuro. I dati possono essere trasferiti negli Stati Uniti sotto adeguate SCC.</li>
                <li><strong>Google Fonts (Google Ireland Limited):</strong> Fornitura tecnica dei font dell'interfaccia. Google riceve l'indirizzo IP e l'intestazione dello User-Agent per trasmettere i font del design.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">7. MODULI DI ISCRIZIONE, STATISTICHE E ATTIVITÀ DI COMUNICAZIONE</p>
              <p>Al fine di garantire trasparenza e conformità con il GDPR e le normative internazionali, dettagliamo di seguito i flussi specifici di raccolta:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Moduli di Iscrizione (Anagrafica Cittadini):</strong> L'invio del form di registrazione digitale comporta l'acquisizione dei dati biografici e del ritratto. Tale invio è rigorosamente subordinato alla selezione preventiva e attiva della casella di consenso ("Opt-In"). Nessun dato viene archiviato o processato prima di tale azione esplicita.</li>
                <li><strong>Attività di Comunicazione e Notifiche:</strong> Il New World State non svolge alcuna attività di marketing commerciale o pubblicità mirata. Le uniche comunicazioni inviate consistono in avvisi istituzionali locali, bollettini regionali e aggiornamenti democratici (referendum attivi). Queste notifiche avvengono esclusivamente a livello client tramite Service Worker e possono essere revocate o disattivate istantaneamente spegnendo l'opzione nei settaggi o revocando il consenso ai cookie di tracciamento/notifiche.</li>
                <li><strong>Statistiche di Utilizzo:</strong> Raccogliamo dati statistici anonimi e aggregati sull'efficienza di caricamento dei nostri nodi server e sull'affluenza di voto per soli fini di diagnostica tecnica e bilanciamento del carico. Tali statistiche non utilizzano cookie di profilazione e non consentono in alcun modo l'identificazione personale dell'utente.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">8. REVOCA DEL CONSENSO IN TEMPO REALE (STRUMENTI INTERATTIVI)</p>
              <p>La revoca del consenso deve essere semplice come il suo conferimento. Mettiamo a disposizione dei cittadini strumenti immediati per esercitare i propri diritti in un clic:</p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 mt-2">
                <p className="font-semibold text-slate-800 text-[10px]">Esercita i tuoi diritti di revoca istantanea:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                      onClose();
                    }}
                    className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                  >
                    Personalizza Cookie
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('nws_cookie_consent');
                      localStorage.removeItem('nws_dismiss_pwa');
                      localStorage.removeItem('nws_access_font_size');
                      localStorage.removeItem('nws_access_contrast');
                      localStorage.removeItem('nws_local_notifications');
                      localStorage.removeItem('nws_notifications_enabled');
                      localStorage.removeItem('nws_last_seen_broadcast_id');
                      alert(isIt ? 'Consenso revocato e cookie non essenziali cancellati con successo!' : 'Consent revoked and non-essential cookies cleared successfully!');
                      window.location.reload();
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                  >
                    Revoca Tutto e Resetta Cookie
                  </button>
                </div>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">9. NOTIFICA DI MODIFICHE E AGGIORNAMENTI</p>
              <p>Il Titolare del Trattamento si riserva il diritto di modificare o aggiornare la presente informativa per adeguarla a nuove riforme costituzionali o normative internazionali. Gli utenti saranno tempestivamente informati di eventuali modifiche sostanziali tramite notifiche di sistema nel portale del cittadino, avvisi pop-up o tramite messaggi di broadcast regionali. Ti invitiamo a consultare regolarmente questa sezione.</p>

              {customPrivacy && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">10. INFORMAZIONI COMPLEMENTARI</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customPrivacy}</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 mb-4">
                <strong>EFFECTIVE DATE:</strong> July 7, 2026 (Last Updated)
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm">1. DATA CONTROLLER</p>
              <p>The official Data Controller responsible for processing personal records under the New World State Global Citizenship Registry is <strong>{controller}</strong>, with coordinate office and technical deployment at: <em>{address}</em>. For any privacy requests, inquiries, or to exercise your rights, contact our Privacy Desk directly at: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">2. TYPES OF DATA PROCESSED & METHODS</p>
              <p>We collect and process the following categories of information supplied voluntarily by you during enrollment or interface usage:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Biographical Information:</strong> Legal first name, surname, gender, date/place of birth, country of origin, physical residency address.</li>
                <li><strong>Contact Information:</strong> Valid email address, regional localization preference.</li>
                <li><strong>Biometric / Identification Assets:</strong> Ported facial photograph for identification rendering and security verification.</li>
                <li><strong>Technical Diagnostics:</strong> Connection IP address (retained temporarily for safety auditing by our systems and CDNs) and device push tokens for official communications.</li>
              </ul>
              <p>All data processing is performed using encrypted digital databases, adhering to rigorous technical guidelines to prevent accidental loss, unauthorized destruction, or breach of records.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">3. LAWFUL BASIS AND PURPOSES</p>
              <p>Your personal details are processed in strict accordance with the following legal grounds:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Explicit and Revocable Consent (Art. 6.1(a) GDPR):</strong> Freely provided during registration to establish your public citizenship and design your digital ID portrait.</li>
                <li><strong>Performance of a Contract/Agreement (Art. 6.1(b) GDPR):</strong> Supplying essential citizenship functions, such as printing and cryptographically auditing your Citizen ID Card or biometric passport.</li>
                <li><strong>Legitimate Interest (Art. 6.1(f) GDPR):</strong> Protecting voting processes against duplicates, defending systems from network exploits, and monitoring regional uptime metrics.</li>
              </ul>
              <p>The data is processed solely for official registration, ID card issuance, democratic voting participation in legislative reforms, edge notification delivery, and satisfying legal compliance mandates. Commercial sales, behavior profiling, or rental of citizenship data to third-party advertisers is constitutionally forbidden.</p>
 
              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">4. CROSS-BORDER DATA TRANSFERS & SEGREGATION</p>
              <p>Due to our global, decentralized infrastructure, records may be processed or stored in secure host servers distributed worldwide (including regions outside the European Economic Area or Australia). To safeguard your fundamental rights under GDPR and Australian Privacy Principle 8 (APP 8), any cross-border transfer is strictly guarded by <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission, protected by continuous AES-256 server-side encryption at rest, and secured by TLS 1.3 encryption in transit.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">5. YOUR GLOBAL DIGITAL RIGHTS</p>
              <p>Under the highest worldwide data protection standards, you can exercise the following absolute rights at any moment:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right of Access (Art. 15 GDPR):</strong> Inspect and request a structured, structured export of your citizenship record.</li>
                <li><strong>Right to Rectification (Art. 16 GDPR):</strong> Request instant correction of any outdated or faulty details.</li>
                <li><strong>Right to Erasure / Forgotten (Art. 17 GDPR):</strong> Command complete, irreversible deletion of your profile from all active databases and offline copies.</li>
                <li><strong>Right to Restrict Processing (Art. 18 GDPR):</strong> Freeze data processing pending dispute resolutions.</li>
                <li><strong>Right to Data Portability (Art. 20 GDPR):</strong> Receive your personal data in a modern, machine-readable format.</li>
                <li><strong>Right to Object (Art. 21 GDPR):</strong> Contest processing activities justified by legitimate interest.</li>
                <li><strong>Withdrawal of Consent:</strong> Retract your active consent at any point without affecting processing done prior to the revocation.</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a formal claim with your country's national Data Protection Authority or supervisory body.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">6. THIRD-PARTY SERVICES WITH DATA RECIPIENCY</p>
              <p>To preserve technical integrity, ward off cyber threats, and load high-quality layouts, we coordinate with the following external processors:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Cloudflare (Cloudflare, Inc.):</strong> Mitigating DDoS attempts and optimizing routing speeds. Processes connection metadata and IP details. Transfers to the USA are fully covered by Standard Contractual Clauses.</li>
                <li><strong>Google Fonts (Google Ireland Limited):</strong> Delivering beautiful, high-readability typography assets. Processes IP addresses and User-Agents solely to load custom fonts.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">7. ENROLLMENT FORMS, ANALYTICS & COMMUNICATIONS DISCLOSURE</p>
              <p>To guarantee maximum transparency and compliance with GDPR, California’s CCPA/CPRA, and Australian Privacy Principles (APPs), we disclose the following explicit data flows:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Enrollment/Registration Forms:</strong> Submitting your digital citizenship registration form results in capturing legal biography data and portrait assets. This processing is strictly locked behind a mandatory, active, prior consent checkbox ("Opt-In"). No personal database records are initialized before you check this box.</li>
                <li><strong>Marketing & System Notifications:</strong> The New World State operates under a strict anti-commercial mandate. We never share or sell personal records to third-party advertisers. System communications consist solely of local push messages, regional bulletins, and active referendum updates. These alerts are pushed purely client-side via modern Service Workers and can be fully disabled at any time in your dashboard or by clearing tracker cookie consent.</li>
                <li><strong>Web Diagnostics & Statistics:</strong> We collect fully anonymized, aggregated telemetry to evaluate server node responses and voting loads. These metrics are processed without profiling cookies, protecting user privacy while optimizing network stability.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">8. REAL-TIME CONSENT REVOCATION (INTERACTIVE TOOLS)</p>
              <p>Withdrawing consent must be as effortless as giving it. We provide users with instantaneous one-click tools to exercise their digital sovereignty:</p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 mt-2">
                <p className="font-semibold text-slate-800 text-[10px]">Exercise your instant revocation rights:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                      onClose();
                    }}
                    className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                  >
                    Customize Cookies
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('nws_cookie_consent');
                      localStorage.removeItem('nws_dismiss_pwa');
                      localStorage.removeItem('nws_access_font_size');
                      localStorage.removeItem('nws_access_contrast');
                      localStorage.removeItem('nws_local_notifications');
                      localStorage.removeItem('nws_notifications_enabled');
                      localStorage.removeItem('nws_last_seen_broadcast_id');
                      alert('Consent revoked and non-essential cookies cleared successfully!');
                      window.location.reload();
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                  >
                    Revoke All & Reset Cookies
                  </button>
                </div>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">9. NOTIFICATION OF POLICY CHANGES & UPDATES</p>
              <p>The Data Controller reserves the right to amend this Privacy Policy to ensure alignment with international standards or system updates. Citizens will be immediately alerted of any material changes via system-wide notifications in the citizenship dashboard, modal alerts, or push broadcasts. We advise checking this portal periodically to stay informed.</p>
 
              {customPrivacy && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-sm mt-4">10. COMPLEMENTARY DISPOSITIONS</p>
                  <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 italic text-slate-600">{customPrivacy}</p>
                </>
              )}
            </div>
          )
        };
      case 'cookies':
        return {
          title: isIt ? 'Informativa Estesa sui Cookie (Cookie Policy)' : 'Extended Cookie & Tracking Policy',
          badge: isIt ? 'CONSENSO INFORMATO GDPR' : 'GDPR INFORMED CONSENT',
          icon: <EyeOff className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">INFORMATIVA SUI COOKIE (COOKIE POLICY)</p>
              <p>In conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR - Regolamento UE 2016/679), la Direttiva ePrivacy (2002/58/CE modificata dalla Direttiva 2009/136/CE) e le linee guida del Garante della Privacy, questa pagina descrive dettagliatamente l'uso dei cookie e degli altri strumenti di tracciamento utilizzati in questo portale.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. COSA SONO I COOKIE E GLI STRUMENTI DI TRACCIAMENTO?</p>
              <p>I cookie sono stringhe di testo di piccole dimensioni che i siti visitati dall'utente inviano al suo dispositivo, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla successiva visita. Strumenti analoghi (come il Local Storage del browser) memorizzano informazioni direttamente sul tuo browser per garantire il corretto funzionamento dell'applicazione.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. TIPOLOGIE DI COOKIE UTILIZZATI E LORO DURATA</p>
              <p>Utilizziamo sia cookie di prima parte (tecnici ed essenziali) sia strumenti per memorizzare le tue preferenze e ottimizzare le notifiche regionali. Non viene svolta alcuna profilazione pubblicitaria o commerciale.</p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl mt-2 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-[10px] text-left font-mono">
                  <thead className="bg-slate-50 font-sans text-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Chiave / Cookie</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Durata</th>
                      <th className="px-3 py-2">Finalità</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_cookie_consent</td>
                      <td className="px-3 py-2">Essenziale (Prima Parte)</td>
                      <td className="px-3 py-2">180 Giorni</td>
                      <td className="px-3 py-2">Memorizza lo stato del consenso dell'utente (essenziali, preferenze, analitici).</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_dismiss_pwa</td>
                      <td className="px-3 py-2">Preferenze (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Ricorda l'avvenuta chiusura o installazione dell'app PWA per non mostrare nuovamente il banner.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_access_font_size</td>
                      <td className="px-3 py-2">Preferenze (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Conserva la dimensione dei caratteri personalizzata impostata dall'utente.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_access_contrast</td>
                      <td className="px-3 py-2">Preferenze (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Conserva la modalità a contrasto elevato preferita per l'accessibilità visiva.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_local_notifications</td>
                      <td className="px-3 py-2">Analisi / Notifiche (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Memorizza la coda di messaggi istituzionali ricevuti e notificati localmente nel browser.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_notifications_enabled</td>
                      <td className="px-3 py-2">Analisi / Notifiche (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Memorizza la preferenza di ricezione delle notifiche del Service Worker.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_last_seen_broadcast_id</td>
                      <td className="px-3 py-2">Analisi / Notifiche (Prima Parte)</td>
                      <td className="px-3 py-2">Persistente (Local)</td>
                      <td className="px-3 py-2">Traccia l'ID dell'ultima comunicazione ufficiale scaricata per allineare i database locali.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. STRUMENTI DI TERZE PARTI CHE ACCEDONO AI DATI</p>
              <p>Per fini di sicurezza informatica, instradamento rapido globale (CDN) e caricamento dei caratteri di design, ci avvaliamo di fornitori esterni certificati. Essi non utilizzano i dati raccolti per profilazione pubblicitaria.</p>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif font-bold text-slate-800 text-[11px]">Cloudflare, Inc.</p>
                      <p className="text-[9px] text-slate-500 font-mono">Cookie Tecnici di Sicurezza e CDN (es. __cf_bm, __cfruid)</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase">Sicurezza / Routing</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    <strong>Finalità:</strong> Protezione contro attacchi DDoS, mitigazione di bot dannosi e ottimizzazione della velocità di caricamento delle pagine. Cloudflare elabora metadati di rete, log e indirizzi IP.
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <strong>Durata:</strong> Da poche ore a un massimo di 30 giorni.
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] font-sans">
                    <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Informativa Privacy Cloudflare <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                    <span className="text-slate-300">|</span>
                    <a href="https://www.cloudflare.com/cookie-policy/" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Cookie Policy & Opt-Out <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif font-bold text-slate-800 text-[11px]">Google Ireland Limited</p>
                      <p className="text-[9px] text-slate-500 font-mono">Google Fonts API (Richiesta Tecnica / IP Address)</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase">Interfaccia Grafica</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    <strong>Finalità:</strong> Caricamento dinamico dei caratteri tipografici dell'interfaccia (Inter, Space Grotesk, JetBrains Mono). Al fine di inviare i font, Google riceve l'indirizzo IP del browser e l'intestazione User-Agent.
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <strong>Durata:</strong> Sessione (eliminato alla chiusura del browser).
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] font-sans">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Informativa Privacy Google <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                    <span className="text-slate-300">|</span>
                    <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Impostazioni Privacy & Opt-Out <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. CONTROLLO E REVOCA DEL CONSENSO IN TEMPO REALE</p>
              <p>Il New World State blocca preventivamente i cookie non essenziali (preferenze e analitici) prima che tu dia il consenso esplicito. Puoi modificare o revocare il tuo consenso in qualsiasi momento cliccando sul pulsante sottostante o cancellando i cookie del tuo browser.</p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                    onClose();
                  }}
                  className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Riapri Cookie Banner per Modificare il Consenso
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">COOKIE POLICY (EXTENDED NOTICE)</p>
              <p>In accordance with the General Data Protection Regulation (GDPR - Regulation EU 2016/679), the ePrivacy Directive (2002/58/EC as amended by Directive 2009/136/CE), and privacy authority guidelines, this document outlines the exact types, durations, and purposes of cookies and local storage keys processed on this platform.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. WHAT ARE COOKIES AND TRACKERS?</p>
              <p>Cookies are short snippets of text stored in your browser when visiting websites. Similar sandboxed APIs (like modern HTML5 Local Storage) store technical properties directly on your device to maintain session states and interface preferences securely.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. FIRST-PARTY COOKIES & RETENTION RETRIEVAL</p>
              <p>We deploy first-party tech trackers to store secure operational attributes. Commercial tracking or ad profiling is strictly banned under our digital constitution.</p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl mt-2 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-[10px] text-left font-mono">
                  <thead className="bg-slate-50 font-sans text-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Key / Cookie Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Retention</th>
                      <th className="px-3 py-2">Scope of Install</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_cookie_consent</td>
                      <td className="px-3 py-2">Essential (First Party)</td>
                      <td className="px-3 py-2">180 Days</td>
                      <td className="px-3 py-2">Stores the granular consent status selected by the user.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_dismiss_pwa</td>
                      <td className="px-3 py-2">Preferences (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Remembers if the user closed the PWA download modal.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_access_font_size</td>
                      <td className="px-3 py-2">Preferences (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Remembers layout magnification scale for visual accessibility.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_access_contrast</td>
                      <td className="px-3 py-2">Preferences (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Preserves selection of high-contrast styling for readability.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_local_notifications</td>
                      <td className="px-3 py-2">Analytics (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Stores local notification streams and regional edge delivery metrics.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_notifications_enabled</td>
                      <td className="px-3 py-2">Analytics (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Preserves active subscription status for offline background service workers.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">nws_last_seen_broadcast_id</td>
                      <td className="px-3 py-2">Analytics (First Party)</td>
                      <td className="px-3 py-2">Persistent (Local)</td>
                      <td className="px-3 py-2">Tracks administrative notification offsets to keep registry data updated.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. THIRD-PARTY TRACKERS & EXTERNAL ACCESS</p>
              <p>For network shield protection, global edge CDN delivery, and high-quality type styling, we coordinate with trusted external providers. These platforms handle technical queries only and do not engage in behavioral advertising.</p>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif font-bold text-slate-800 text-[11px]">Cloudflare, Inc.</p>
                      <p className="text-[9px] text-slate-500 font-mono">Technical Shield Cookies (e.g., __cf_bm, __cfruid)</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase">Security & Delivery</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    <strong>Purpose:</strong> Safeguarding against DDoS attacks, filtering malicious bots, and optimizing network delivery speed. Processes connection telemetry, IP addresses, and routing metadata.
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <strong>Duration:</strong> Between 1 hour and 30 days.
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] font-sans">
                    <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Cloudflare Privacy Policy <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                    <span className="text-slate-300">|</span>
                    <a href="https://www.cloudflare.com/cookie-policy/" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Cookie Policy & Opt-Out <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif font-bold text-slate-800 text-[11px]">Google Ireland Limited</p>
                      <p className="text-[9px] text-slate-500 font-mono">Google Fonts CDN API (Technical Asset Delivery / IP Query)</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase">Interface Styling</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    <strong>Purpose:</strong> Delivering typography assets dynamically (Inter, Space Grotesk, JetBrains Mono) directly to the browser view. Google receives IP addresses and browser characteristics to deliver font assets.
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <strong>Duration:</strong> Session (instantly wiped upon tab closure).
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] font-sans">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Google Privacy Policy <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                    <span className="text-slate-300">|</span>
                    <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#0a1c3e] hover:text-brand-gold underline font-bold flex items-center gap-0.5">
                      Google Account Opt-Out <Globe className="w-2.5 h-2.5 inline" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. REAL-TIME REVOCATION AND USER RIGHTS</p>
              <p>Our Privacy Sandbox prevents the storage of non-essential trackers prior to your explicit consent. You can manage or revoke your choices at any moment by clicking below or by wiping cookies via browser preferences.</p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                    onClose();
                  }}
                  className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Reopen Cookie Banner to Modify Choices
                </button>
              </div>
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
              <p>I documenti digitali, ID Card ed attestati generati dal sistema costituiscono certificazione crittografica di appartenenza digitale al New World State. È vietato qualunque uso fraudolento, falsificazione o cessione a terzi non autorizzati per scopi illeciti o attività contrarie ai diritti umani.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. DEMOCRAZIA DIRETTA E DOVERI CIVICI</p>
              <p>L'approvazione formale dello stato di cittadinanza conferisce il diritto inviolabile di partecipazione diretta tramite referendum, discussioni pubbliche e deposito di proposte legislative sul portale.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. USO CONSENTITO E DIVIETI STRUTTURALI</p>
              <p>Questo portale e i servizi connessi devono essere utilizzati esclusivamente in modo lecito e conforme ai presenti Termini. È espressamente vietata la registrazione tramite bot o strumenti automatizzati. Sono severamente proibite attività di estrazione dati non autorizzata (scraping), violazione delle misure di sicurezza (probing/vulnerability testing), caricamento di malware, abuso delle risorse tecniche, molestia o propagazione di contenuti d'odio, discriminazione e pornografia.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">5. SOSPENSIONE E CHIUSURA ACCOUNT</p>
              <p>L'Autorità si riserva il diritto esclusivo e insindacabile di sospendere o cancellare la registrazione o lo stato civile di un utente in qualsiasi momento, senza preavviso e a propria discrezione, qualora sussista il sospetto di violazioni di legge, dei diritti di terzi, della Costituzione o dei presenti Termini.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">6. LIMITAZIONE DI RESPONSABILITÀ E MANLEVA</p>
              <p>I servizi e i certificati crittografici digitali sono forniti "così come sono" ("as is") e secondo disponibilità, senza alcuna garanzia esplicita o implicita di commerciabilità o idoneità a scopi specifici. Il New World State non fornisce consulenza legale o amministrativa statale professionale e non assume alcuna responsabilità per danni diretti, indiretti o interruzioni tecniche derivanti da forza maggiore. L'utente si impegna a tenere indenne e manlevare il Titolare e i suoi funzionari da qualsiasi pretesa o spesa legale derivante da un utilizzo improprio o illecito del portale.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">7. CLAUSOLA DI SALVAGUARDIA E LEGGE APPLICABILE</p>
              <p>La nullità o inefficacia di una singola disposizione dei presenti Termini non inficia la validità delle restanti clausole. Qualsiasi controversia o rapporto giuridico è regolato in via esclusiva dalle norme digitali del New World State e, in via sussidiaria, dalle leggi del luogo di stabilimento del Titolare, con foro competente esclusivo stabilito presso la sede dell'Autorità.</p>

              {customTerms && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">8. CLAUSOLE INTEGRATIVE SPECIFICHE</p>
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

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">4. PERMITTED USE & STRICT PROHIBITIONS</p>
              <p>This portal and its services must be used exclusively for lawful purposes and in accordance with these Terms. Automated registration (via bots) is prohibited. Any form of scraping, security vulnerability scanning, system testing, malware insertion, server overload, harassment, or distribution of hateful, discriminatory, or illicit content is strictly banned.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">5. ACCOUNT SUSPENSION & TERMINATION</p>
              <p>The Authority reserves the exclusive right to suspend or terminate a user's account and civic registry status at any time, without prior notice and at its sole discretion, in case of suspected violations of the law, third-party rights, the Constitution, or these Terms.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">6. LIMITATION OF LIABILITY & INDEMNIFICATION</p>
              <p>All cryptographic credentials and digital services are provided on an "as is" and "as available" basis without warranties of any kind. The New World State does not provide professional legal or state-registered administrative advice, and users assume all risks. The user agrees to indemnify and hold harmless the Owner and its officers from any third-party claims or legal expenses arising from their misuse of the platform.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">7. SEVERABILITY & GOVERNING LAW</p>
              <p>Should any provision of these Terms be deemed invalid or unenforceable, the remaining provisions shall continue in full force. These Terms are governed by the digital laws of the New World State and, secondarily, the laws of the location of the Owner, with exclusive jurisdiction in the courts designated by the Authority.</p>

              {customTerms && (
                <>
                  <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">8. SUPPLEMENTARY COVENANTS</p>
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
      case 'ccpa':
        return {
          title: isIt ? 'Dichiarazione CCPA & Opt-Out (Do Not Sell)' : 'CCPA Compliance & Opt-Out (Do Not Sell/Share)',
          badge: 'CALIFORNIA CONSUMER RIGHTS',
          icon: <Globe className="w-5 h-5 text-brand-gold" />,
          html: isIt ? (
            <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">INFORMATIVA SULLA PRIVACY PER I RESIDENTI DELLA CALIFORNIA (CCPA/CPRA)</p>
              <p>Il California Consumer Privacy Act (CCPA) e il California Privacy Rights Act (CPRA) riconoscono ai consumatori residenti in California diritti specifici relativi alle loro informazioni personali.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. NESSUNA VENDITA O CONDIVISIONE DI DATI PERSONALI</p>
              <p>Confermiamo espressamente che il New World State <strong>NON vende, cede, affitta o condivide</strong> (ai fini di pubblicità comportamentale cross-context) le tue informazioni personali con terze parti commerciali, broker o inserzionisti.</p>
              <p>Non abbiamo venduto né condiviso alcuna informazione personale nei 12 mesi precedenti e non lo faremo in futuro.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. I TUOI DIRITTI AI SENSI DEL CCPA/CPRA</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Diritto di Sapere (Right to Know):</strong> Richiedere quali dati personali raccogliamo, utilizziamo, divulghiamo o vendiamo.</li>
                <li><strong>Diritto di Cancellazione (Right to Delete):</strong> Richiedere la rimozione definitiva dei dati archiviati nel nostro portale anagrafico.</li>
                <li><strong>Diritto di Rettifica (Right to Correct):</strong> Chiedere la correzione immediata di informazioni anagrafiche inesatte.</li>
                <li><strong>Diritto di Opt-Out:</strong> Richiedere formalmente che le proprie informazioni non vengano "vendute" o "condivise".</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. ESERCIZIO DEL DIRITTO DI OPT-OUT (DO NOT SELL OR SHARE)</p>
              <p>Anche se non vendiamo né condividiamo alcuna informazione personale, forniamo questo controllo interattivo per consentire ai cittadini di registrare in modo esplicito la propria preferenza di Opt-Out, in conformità con i requisiti legali californiani.</p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Non vendere o condividere le mie informazioni personali</p>
                    <p className="text-[9px] text-slate-500 font-mono">Do Not Sell or Share My Personal Information</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={ccpaOptOut}
                      onChange={(e) => handleCcpaToggle(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0a1c3e]"></div>
                  </label>
                </div>
                
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[9px]">
                  <span className={`inline-block w-2 h-2 rounded-full ${ccpaOptOut ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-mono text-slate-600">
                    STATO PREFERENZA: {ccpaOptOut ? (
                      <strong className="text-emerald-700 font-bold">OPT-OUT ATTIVO (Nessuna vendita autorizzata)</strong>
                    ) : (
                      <strong className="text-amber-700 font-bold">CONSENTITO (Nessuna vendita effettuata comunque)</strong>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
              <p className="font-serif font-bold text-[#0a1c3e] text-sm">PRIVACY NOTICE FOR CALIFORNIA RESIDENTS (CCPA/CPRA)</p>
              <p>The California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA) grant specific digital rights to residents of California regarding their personal information.</p>
              
              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">1. ZERO DATA SELLING OR SHARING DISCLOSURE</p>
              <p>We explicitly declare that the New World State <strong>DOES NOT sell, rent, lease, or share</strong> (for cross-context behavioral advertising) your personal information to third-party commercial databases, data brokers, or advertisers.</p>
              <p>We have not sold or shared any personal data in the preceding 12 months, and we guarantee we will never do so.</p>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">2. YOUR CCPA/CPRA RIGHTS</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right to Know:</strong> Discover what categories of personal information we collect and process.</li>
                <li><strong>Right to Delete:</strong> Request permanent removal of your citizenship dossier from our secure servers.</li>
                <li><strong>Right to Correct:</strong> Instantly amend any inaccurate, outdated, or incomplete administrative records.</li>
                <li><strong>Right to Opt-Out:</strong> Command that your data never be sold or shared under any corporate circumstance.</li>
              </ul>

              <p className="font-serif font-bold text-[#0a1c3e] text-[11px] mt-4">3. DO NOT SELL OR SHARE MY PERSONAL INFORMATION REQUEST</p>
              <p>Although we engage in zero commercial data transfers, we implement this interactive toggle to give our citizens absolute sovereignty and formal compliance with the CCPA/CPRA standards.</p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Do Not Sell or Share My Personal Information</p>
                    <p className="text-[9px] text-slate-500 font-mono">CCPA / CPRA Consumer Opt-Out Choice</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={ccpaOptOut}
                      onChange={(e) => handleCcpaToggle(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0a1c3e]"></div>
                  </label>
                </div>
                
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[9px]">
                  <span className={`inline-block w-2 h-2 rounded-full ${ccpaOptOut ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-mono text-slate-600">
                    PREFERENCE STATUS: {ccpaOptOut ? (
                      <strong className="text-emerald-700 font-bold">OPT-OUT ACTIVE (No sales authorized)</strong>
                    ) : (
                      <strong className="text-amber-700 font-bold">ALLOWED (No sales performed regardless)</strong>
                    )}
                  </span>
                </div>
              </div>
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
          <button
            onClick={() => setDocType('ccpa')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition ${docType === 'ccpa' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            CCPA Opt-Out
          </button>
        </div>

      </div>
    </div>
  );
}
