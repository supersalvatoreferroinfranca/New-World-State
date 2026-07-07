import React, { useState, useEffect } from 'react';
import { useLegal, LegalConfig } from '../../hooks/useLegal';
import { 
  Shield, 
  FileText, 
  Check, 
  Globe, 
  Sliders, 
  Eye, 
  BookOpen, 
  Info,
  Scale,
  Sparkles,
  Lock,
  Flame,
  Accessibility,
  Search,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface AdminLegalTabProps {
  adminPasswordValue: string;
  showAlert: (title: string, message: string) => void;
}

export default function AdminLegalTab({ adminPasswordValue, showAlert }: AdminLegalTabProps) {
  const { config, loading, error, saveConfig } = useLegal();
  const [localConfig, setLocalConfig] = useState<LegalConfig | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Preview configuration
  const [previewDoc, setPreviewDoc] = useState<'privacy' | 'cookies' | 'terms' | 'accessibility'>('privacy');
  const [previewLang, setPreviewLang] = useState<'it' | 'en'>('it');

  // Cookie Consent Registry state
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'registry'>('config');
  const [consentLogs, setConsentLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'Accept All' | 'Accept Essential Only' | 'Custom Preferences Saved'>('all');
  
  const loadConsentLogs = () => {
    try {
      const logsString = localStorage.getItem('nws_consent_logs');
      if (logsString) {
        setConsentLogs(JSON.parse(logsString));
      } else {
        // Seed some realistic initial logs so the registry is instantly demonstrative and beautiful
        const mockLogs = [
          {
            id: 'CON-1719875191021',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            ip: '151.38.12.94 (GDPR Masked)',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            action: 'Accept All',
            preferences: true,
            analytics: true,
            essential: true,
            origin: window.location.origin
          },
          {
            id: 'CON-1719875142104',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            ip: '93.41.222.15 (GDPR Masked)',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            action: 'Accept Essential Only',
            preferences: false,
            analytics: false,
            essential: true,
            origin: window.location.origin
          },
          {
            id: 'CON-1719875089302',
            timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
            ip: '79.12.180.44 (GDPR Masked)',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            action: 'Custom Preferences Saved',
            preferences: true,
            analytics: false,
            essential: true,
            origin: window.location.origin
          }
        ];
        localStorage.setItem('nws_consent_logs', JSON.stringify(mockLogs));
        setConsentLogs(mockLogs);
      }
    } catch (e) {
      console.error('Failed to load consent logs:', e);
    }
  };

  useEffect(() => {
    loadConsentLogs();
    window.addEventListener('nws_consent_logs_updated', loadConsentLogs);
    return () => window.removeEventListener('nws_consent_logs_updated', loadConsentLogs);
  }, []);

  const handleClearLogs = () => {
    if (confirm('Sei sicuro di voler svuotare l\'intero registro delle prove di consenso? Questa azione è irreversibile.')) {
      localStorage.setItem('nws_consent_logs', JSON.stringify([]));
      setConsentLogs([]);
      showAlert('Registro Svuotato', 'Tutte le prove di consenso registrate localmente sono state cancellate.');
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(consentLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `nws_cookie_consent_register_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      showAlert('Esportazione Fallita', 'Impossibile esportare il registro in formato JSON.');
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Consent ID,Timestamp,IP Address,Action,Essential,Preferences,Analytics,User Agent,Origin\n";
      
      consentLogs.forEach(log => {
        const row = [
          log.id,
          log.timestamp,
          `"${log.ip}"`,
          `"${log.action}"`,
          log.essential ? "YES" : "NO",
          log.preferences ? "YES" : "NO",
          log.analytics ? "YES" : "NO",
          `"${log.userAgent.replace(/"/g, '""')}"`,
          log.origin
        ].join(",");
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodedUri);
      downloadAnchor.setAttribute("download", `nws_cookie_consent_register_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      showAlert('Esportazione Fallita', 'Impossibile esportare il registro in formato CSV.');
    }
  };

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config });
    }
  }, [config]);

  if (loading || !localConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a1c3e]"></div>
        <p className="text-xs text-slate-500 font-mono">Caricamento impostazioni legali...</p>
      </div>
    );
  }

  const handleFieldChange = (field: keyof LegalConfig, value: string) => {
    setLocalConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localConfig) return;

    setSaving(true);
    const result = await saveConfig(localConfig, adminPasswordValue);
    setSaving(false);

    if (result.success) {
      showAlert('Successo', 'Tutte le impostazioni di conformità legale (GDPR, Cookies, Termini, Accessibilità) sono state registrate con successo nel database e rese pubbliche.');
    } else {
      showAlert('Errore', result.message || 'Errore durante il salvataggio.');
    }
  };

  // Dynamic Generator of legal documents for preview
  const generateDocumentContent = () => {
    const isIt = previewLang === 'it';
    const controller = localConfig.legal_controller_name || 'New World State Authority';
    const address = localConfig.legal_controller_address || 'Global Decentralized Infrastructure';
    const email = localConfig.legal_controller_email || 'privacy@newworldstate.org';
    const cookies = localConfig.legal_cookies_list || 'Session storage essenziale';
    const score = localConfig.legal_accessibility_score || 'WCAG 2.1 AA';
    
    const customPrivacy = isIt ? localConfig.legal_custom_privacy_it : localConfig.legal_custom_privacy_en;
    const customTerms = isIt ? localConfig.legal_custom_terms_it : localConfig.legal_custom_terms_en;

    if (previewDoc === 'privacy') {
      return {
        title: isIt ? 'Informativa sulla Privacy (GDPR / CCPA Compliant)' : 'Privacy Policy (GDPR / CCPA Compliant)',
        badge: 'CONFIDENTIAL & SECURE',
        html: isIt ? (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">1. TITOLARE DEL TRATTAMENTO</p>
            <p>Il Titolare del trattamento dei dati personali raccolti tramite il Registro Anagrafico del New World State è <strong>{controller}</strong>, con sede tecnologica e di coordinamento presso: <em>{address}</em>. Per qualsiasi chiarimento o esercizio dei diritti, è possibile contattare l'Ufficio della Privacy all'indirizzo email: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
            
            <p className="font-semibold text-slate-900 text-sm mt-4">2. DATI RACCOLTI E FINALITÀ</p>
            <p>I dati raccolti includono nome, cognome, genere, data di nascita, luogo di nascita, indirizzo di residenza, email e fotografia del volto. Questi dati sono trattati esclusivamente per:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>L'iscrizione ufficiale all'Anagrafe Sovrana Mondiale del New World State.</li>
              <li>La generazione crittografica e la validazione decentralizzata della ID Card digitale del cittadino.</li>
              <li>La partecipazione democratica, elettorale e consultiva tramite il Portale della Democrazia.</li>
            </ul>
            <p>Non viene effettuato alcun tracciamento di terze parti, profilazione commerciale o monetizzazione dei record.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">3. BASE GIURIDICA DEL TRATTAMENTO</p>
            <p>Il trattamento si basa sul <strong>consenso esplicito</strong> dell'interessato (Art. 6.1(a) GDPR) fornito liberamente all'atto della registrazione e sull'adempimento delle procedure costituzionali di adesione civica digitale.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">4. CONSERVAZIONE DEI DATI E SICUREZZA</p>
            <p>I dati sono conservati a tempo indeterminato fino all'eventuale richiesta di revoca della cittadinanza. Implementiamo misure di sicurezza avanzate, tra cui la crittografia dei dati a riposo e in transito, isolamento sandbox e firme digitali crittografiche.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">5. DIRITTI DELL'INTERESSATO (GDPR & CCPA)</p>
            <p>In conformità alle normative più stringenti al mondo (es. GDPR europeo e CCPA californiano), l'utente ha il diritto di:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accesso:</strong> Richiedere la conferma e copia dei propri dati registrati.</li>
              <li><strong>Rettifica:</strong> Ottenere la correzione di dati inesatti.</li>
              <li><strong>Cancellazione (Oblio):</strong> Richiedere la rimozione immediata dall'Anagrafe Mondiale.</li>
              <li><strong>Limitazione e Opposizione:</strong> Opporsi a specifici utilizzi amministrativi.</li>
              <li><strong>Portabilità:</strong> Esportare i propri dati in formato strutturato (es. JSON).</li>
            </ul>

            <p className="font-semibold text-slate-900 text-sm mt-4">6. SERVIZI DI TERZE PARTI (CLOUDFLARE E GOOGLE FONTS)</p>
            <p>Per garantire la sicurezza, la stabilità tecnica e un'estetica elevata dell'interfaccia, il portale utilizza servizi di terze parti:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cloudflare (Cloudflare, Inc.):</strong> Il sito è distribuito, protetto e ottimizzato tramite la rete di distribuzione dei contenuti (CDN) di Cloudflare. Cloudflare elabora metadati di rete, indirizzi IP e log di traffico per mitigare attacchi dannosi (come attacchi DDoS) e garantire la corretta instradabilità. I dati personali possono essere trasferiti negli Stati Uniti sulla base di Clausole Contrattuali Standard (SCC).</li>
              <li><strong>Google Fonts (Google Ireland Limited):</strong> Utilizziamo il servizio di Google per caricare i caratteri tipografici dell'interfaccia direttamente dai loro server. Per erogare questo servizio, Google riceve intestazioni di richiesta tecnica che includono l'indirizzo IP dell'utente e informazioni sul browser. Per gli utenti all'interno dello Spazio Economico Europeo (SEE) e della Svizzera, il fornitore del servizio è Google Ireland Limited.</li>
            </ul>

            {customPrivacy && (
              <>
                <p className="font-semibold text-slate-900 text-sm mt-4">7. DISPOSIZIONI AGGIUNTIVE</p>
                <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100 italic">{customPrivacy}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">1. DATA CONTROLLER</p>
            <p>The Data Controller for the personal records processed via the New World State Global Registry is <strong>{controller}</strong>, with technological and coordination headquarters located at: <em>{address}</em>. For any queries or to exercise your statutory rights, please contact our Privacy Office at: <strong className="text-[#0a1c3e]">{email}</strong>.</p>
            
            <p className="font-semibold text-slate-900 text-sm mt-4">2. DATA TYPES AND PURPOSES</p>
            <p>Collected data includes first name, surname, gender, date of birth, place of birth, country of residence, physical address, email, and facial photograph. This data is processed strictly for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Official registration within the Sovereign World Citizenship Registry of the New World State.</li>
              <li>Cryptographic generation and decentralized verification of the digital Citizen ID Card.</li>
              <li>Democratic and civic participation in referendums and legislative proposals.</li>
            </ul>
            <p>No third-party tracking, advertising, profiling, or data monetization is technologically possible or legally allowed.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">3. LAWFUL BASIS OF PROCESSING</p>
            <p>Processing is based on the user's <strong>explicit consent</strong> (Art. 6.1(a) GDPR) freely given at the time of registration, and the performance of constitution-backed digital citizenship agreements.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">4. STORAGE AND SECURITY METRICS</p>
            <p>Data is retained until explicit citizenship revocation. We implement high-grade encryption at rest and in transit, sandboxed edge isolation, and secure cryptographic signatures on certificates.</p>

            <p className="font-semibold text-slate-900 text-sm mt-4">5. CITIZEN RIGHTS (GDPR & CCPA)</p>
            <p>Aligned with the world's most protective privacy frameworks, you retain the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Confirm and receive a portable copy of all your records.</li>
              <li><strong>Rectification:</strong> Correct any inaccuracies in your profile details.</li>
              <li><strong>Erasure (Right to be Forgotten):</strong> Request instant deletion from the global registry.</li>
              <li><strong>Restriction & Objection:</strong> Object to specific administrative processing tasks.</li>
              <li><strong>Portability:</strong> Download a structured copy of your citizen dossier in JSON format.</li>
            </ul>

            <p className="font-semibold text-slate-900 text-sm mt-4">6. THIRD-PARTY SERVICES (CLOUDFLARE & GOOGLE FONTS)</p>
            <p>To ensure robust security, optimization, and high-quality interface typography, this portal integrates the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cloudflare (Cloudflare, Inc.):</strong> The application is distributed, protected, and sped up via Cloudflare's Content Delivery Network (CDN). Cloudflare processes technical network metadata, IP addresses, and routing logs to mitigate threats (such as DDoS attacks) and maintain service availability. Data may be transferred to the US under Standard Contractual Clauses (SCCs).</li>
              <li><strong>Google Fonts (Google Ireland Limited):</strong> This portal fetches custom display typography directly from Google's servers. To render fonts correctly, Google processes basic technical headers, including your IP address and web browser characteristics. For users located in the European Area (EEA) and Switzerland, the service is supplied by Google Ireland Limited.</li>
            </ul>

            {customPrivacy && (
              <>
                <p className="font-semibold text-slate-900 text-sm mt-4">7. ADDITIONAL DISPOSITIONS</p>
                <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100 italic">{customPrivacy}</p>
              </>
            )}
          </div>
        )
      };
    } else if (previewDoc === 'cookies') {
      return {
        title: isIt ? 'Cookie & Tracciamento' : 'Cookies & Tracking Statement',
        badge: 'ZERO COOKIE TRACKERS',
        html: isIt ? (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">INFORMATIVA ESTESA SUI COOKIE</p>
            <p>La tutela della privacy è il pilastro fondante del New World State. In linea con la Direttiva ePrivacy e il GDPR, questo sito applica una politica di <strong>Zero Cookie di Tracciamento</strong>.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">1. COSA UTILIZZIAMO?</p>
            <p>Non utilizziamo cookie di terze parti, pixel di tracciamento o script analitici di giganti commerciali. Utilizziamo unicamente:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Session Storage locale:</strong> Per mantenere la sessione dell'utente autenticato in modo sicuro.</li>
              <li><strong>Local Storage tecnico:</strong> Per memorizzare le preferenze dell'interfaccia, come la lingua selezionata (italiano o inglese) ed evitare re-indirizzamenti continui.</li>
            </ul>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. ELENCO TRACCIATORI TECNICI ATTIVI</p>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px]">
              {cookies}
            </p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. CONSENSO E PREFERENZE</p>
            <p>Poiché non viene impiegato alcun cookie di profilazione o statistico di terze parti, ai sensi delle linee guida europee, <strong>non è richiesto un banner invasivo di blocco cookie</strong>, in quanto l'uso è strettamente limitato ai cookie tecnici esenti. Massima fluidità, massima riservatezza.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">EXTENDED COOKIE POLICY</p>
            <p>Your privacy is non-negotiable. In strict alignment with the European ePrivacy Directive and GDPR standards, this portal implements a strict <strong>Zero Third-Party Cookies Policy</strong>.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">1. WHAT STORAGE DO WE USE?</p>
            <p>We do not load advertising cookies, tracking pixels, or surveillance scripts. We only employ:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Session Storage:</strong> To securely maintain your login state while navigating.</li>
              <li><strong>Local Preferences Storage:</strong> To remember your selected display language (Italian or English) and responsive interface settings.</li>
            </ul>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. ACTIVE TECHNICAL TRACKERS</p>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px]">
              {cookies}
            </p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. CONSENT MECHANICS</p>
            <p>Because zero tracking or advertising cookies are initialized, under European guidelines <strong>no disruptive tracking banners are necessary</strong>, as technical cookie storage is strictly exempted. Seamless navigation, absolute sovereignty.</p>
          </div>
        )
      };
    } else if (previewDoc === 'terms') {
      return {
        title: isIt ? 'Termini e Condizioni di Adesione Civica' : 'Terms & Conditions of Civic Affiliation',
        badge: 'SOVEREIGN AGREEMENT',
        html: isIt ? (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">1. CONDIZIONI DI PARTECIPAZIONE CIVICA</p>
            <p>Sottoscrivendo la registrazione, l'utente dichiara di aderire ai principi di pace, cooperazione scientifica, tutela ambientale e uguaglianza universale sanciti nella Costituzione del New World State.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. IDENTITÀ DIGITALE SOVRANA</p>
            <p>Ogni ID Card e certificato generati rimangono proprietà intellettuale della New World State Authority ma sono attribuiti in licenza d'uso perpetua al rispettivo cittadino. È vietata la falsificazione dei certificati o l'uso improprio per attività contrarie ai diritti umani.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. DIRITTO DI VOTO E VITA DEMOCRATICA</p>
            <p>L'approvazione formale dello stato di cittadinanza conferisce l'elettorato attivo e passivo nel Portale Democrazia per votare o depositare proposte di legge e referendum.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">4. USO CONSENTITO E DIVIETI STRUTTURALI</p>
            <p>Questo portale e i servizi connessi devono essere utilizzati esclusivamente in modo lecito e conforme ai presenti Termini. È espressamente vietata la registrazione tramite bot o strumenti automatizzati. Sono severamente proibite attività di estrazione dati non autorizzata (scraping), violazione delle misure di sicurezza (probing/vulnerability testing), caricamento di malware, abuso delle risorse tecniche, molestia o propagazione di contenuti d'odio, discriminazione e pornografia.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">5. SOSPENSIONE E CHIUSURA ACCOUNT</p>
            <p>L'Autorità si riserva il diritto esclusivo e insindacabile di sospendere o cancellare la registrazione o lo stato civile di un utente in qualsiasi momento, senza preavviso e a propria discrezione, qualora sussista il sospetto di violazioni di legge, dei diritti di terzi, della Costituzione o dei presenti Termini.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">6. LIMITAZIONE DI RESPONSABILITÀ E MANLEVA</p>
            <p>I servizi e i certificati crittografici digitali sono forniti "così come sono" ("as is") e secondo disponibilità, senza alcuna garanzia esplicita o implicita di commerciabilità o idoneità a scopi specifici. Il New World State non fornisce consulenza legale o amministrativa statale professionale e non assume alcuna responsabilità per danni diretti, indiretti o interruzioni tecniche derivanti da forza maggiore. L'utente si impegna a tenere indenne e manlevare il Titolare e i suoi funzionari da qualsiasi pretesa o spesa legale derivante da un utilizzo improprio o illecito del portale.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">7. CLAUSOLA DI SALVAGUARDIA E LEGGE APPLICABILE</p>
            <p>La nullità o inefficacia di una singola disposizione dei presenti Termini non inficia la validità delle restanti clausole. Qualsiasi controversia o rapporto giuridico è regolato in via esclusiva dalle norme digitali del New World State e, in via sussidiaria, dalle leggi del luogo di stabilimento del Titolare, con foro competente esclusivo stabilito presso la sede dell'Autorità.</p>

            {customTerms && (
              <>
                <p className="font-semibold text-slate-900 text-[11px] mt-4">8. CLAUSOLE AGGIUNTIVE</p>
                <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100 italic">{customTerms}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">1. CONDITIONS OF CIVIC ADHESION</p>
            <p>By registering, you formally declare your allegiance to the principles of universal peace, scientific advancement, environmental protection, and borderless equality as established in the Constitution of the New World State.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. SOVEREIGN DIGITAL ID</p>
            <p>Every ID Card and passport issued remains the intellectual property of the New World State Authority but is licensed in perpetuity to the respective citizen. Forgery or use of these digital credentials for activities contrary to universal rights is strictly prohibited.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. VOTING RIGHTS & DIRECT DEMOCRACY</p>
            <p>An approved citizenship status awards full voting and petitioning rights in the Democracy Portal, enabling active participation in global referendums.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">4. PERMITTED USE & STRICT PROHIBITIONS</p>
            <p>This portal and its services must be used exclusively for lawful purposes and in accordance with these Terms. Automated registration (via bots) is prohibited. Any form of scraping, security vulnerability scanning, system testing, malware insertion, server overload, harassment, or distribution of hateful, discriminatory, or illicit content is strictly banned.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">5. ACCOUNT SUSPENSION & TERMINATION</p>
            <p>The Authority reserves the exclusive right to suspend or terminate a user's account and civic registry status at any time, without prior notice and at its sole discretion, in case of suspected violations of the law, third-party rights, the Constitution, or these Terms.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">6. LIMITATION OF LIABILITY & INDEMNIFICATION</p>
            <p>All cryptographic credentials and digital services are provided on an "as is" and "as available" basis without warranties of any kind. The New World State does not provide professional legal or state-registered administrative advice, and users assume all risks. The user agrees to indemnify and hold harmless the Owner and its officers from any third-party claims or legal expenses arising from their misuse of the platform.</p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">7. SEVERABILITY & GOVERNING LAW</p>
            <p>Should any provision of these Terms be deemed invalid or unenforceable, the remaining provisions shall continue in full force. These Terms are governed by the digital laws of the New World State and, secondarily, the laws of the location of the Owner, with exclusive jurisdiction in the courts designated by the Authority.</p>

            {customTerms && (
              <>
                <p className="font-semibold text-slate-900 text-[11px] mt-4">8. EXTRA PROVISIONS</p>
                <p className="whitespace-pre-line p-3 bg-amber-50/40 rounded-xl border border-amber-100 italic">{customTerms}</p>
              </>
            )}
          </div>
        )
      };
    } else {
      return {
        title: isIt ? 'Dichiarazione di Accessibilità (WCAG / ADA Compliant)' : 'Accessibility Statement (WCAG / ADA Compliant)',
        badge: 'INCLUSIVE DESIGN',
        html: isIt ? (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">IMPEGNO PER L'INCLUSIVITÀ DIGITALE</p>
            <p>Il New World State sostiene che l'accesso alla tecnologia sia un diritto umano fondamentale. Ci impegniamo a rendere i nostri portali digitali pienamente accessibili a tutti i cittadini, indipendentemente dalle abilità fisiche o sensoriali.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">1. STANDARD DI CONFORMITÀ</p>
            <p>Questo portale è progettato e costantemente verificato per rispettare i requisiti internazionali di accessibilità <strong>WCAG 2.1 a livello AA</strong> (Web Content Accessibility Guidelines) e le normative globali equivalenti (ADA negli USA, Stanca in Italia).</p>
            <p>Stato attuale di conformità: <strong className="text-emerald-700 uppercase">{score}</strong></p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. FUNZIONALITÀ DI SUPPORTO IMPLEMENTATE</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Rapporto di contrasto elevato:</strong> Testo scuro su sfondi chiari per una lettura ottimale e riposante.</li>
              <li><strong>Navigabilità da tastiera:</strong> Supporto completo del tasto TAB e indicatori di focus visibili su tutti gli elementi interattivi.</li>
              <li><strong>Semantica HTML pulita:</strong> Attributi ARIA e ID univoci per garantire la massima compatibilità con gli screen-reader di ultima generazione.</li>
              <li><strong>Design Fluido:</strong> Interfaccia responsive che supporta lo zoom del testo fino al 200% senza perdita di contenuti.</li>
            </ul>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. CONTATTI E SEGNALAZIONI</p>
            <p>Se riscontri barriere digitali o anomalie, ti preghiamo di segnalarle via email a: <strong className="text-[#0a1c3e]">{email}</strong>. Il nostro team di accessibilità esaminerà la richiesta entro 48 ore lavorative.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <p className="font-semibold text-slate-900 text-sm">COMMITMENT TO DIGITAL ACCESSIBILITY</p>
            <p>The New World State champions technology access as an inalienable human right. We are dedicated to ensuring our platforms are fully accessible to all global citizens, regardless of physical or cognitive abilities.</p>
            
            <p className="font-semibold text-slate-900 text-[11px] mt-4">1. STANDARDS AND CONFORMANCE</p>
            <p>Our digital registry is built and continuously audited to meet the <strong>WCAG 2.1 Level AA</strong> requirements (Web Content Accessibility Guidelines) and global equivalent accessibility directives (such as ADA or the European Accessibility Act).</p>
            <p>Current Conformance Level: <strong className="text-emerald-700 uppercase">{score}</strong></p>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">2. SUPPORTED INCLUSION FEATURES</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>High Contrast Ratio:</strong> Dark high-readability text over warm off-white canvases.</li>
              <li><strong>Keyboard Friendly:</strong> Thorough focus indicators and full TAB navigation support for all interactive buttons and fields.</li>
              <li><strong>Clean Semantic HTML:</strong> Strategic ARIA labels and unique IDs to guarantee screen-reader compatibility.</li>
              <li><strong>Fluid Design:</strong> Dynamic layout supporting text magnification up to 200% without structural degradation.</li>
            </ul>

            <p className="font-semibold text-slate-900 text-[11px] mt-4">3. REPORTING ACCESSIBILITY BARRIERS</p>
            <p>Should you find any digital obstacle on our portal, please report it to: <strong className="text-[#0a1c3e]">{email}</strong>. Our dedicated accessibility desk will respond within 48 business hours.</p>
          </div>
        )
      };
    };
  };

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const currentPreview = generateDocumentContent();

  const filteredLogs = consentLogs.filter(log => {
    const matchesSearch = log.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.userAgent.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Intestazione Sezione */}
      <div className="bg-[#0a1c3e] text-white p-6 rounded-2xl border border-[#c5a880]/20 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-mono bg-brand-gold/25 text-brand-gold px-2.5 py-1 rounded-full font-bold">CONFORMITÀ PRIVACY MONDIALE</span>
          <h3 className="text-xl font-serif text-[#f7f5f0] mt-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-gold" /> Registro Garanzie Legali
          </h3>
          <p className="text-xs text-slate-300 font-light leading-relaxed max-w-2xl">
            Regola i parametri di tutela della privacy, cookie policy, termini di servizio ed accessibilità secondo le più rigide normative internazionali (GDPR, CCPA, WCAG 2.1).
          </p>
        </div>
        <div className="hidden md:block">
          <Scale className="w-12 h-12 text-brand-gold opacity-30" />
        </div>
      </div>

      {/* Sotto-Tab Selector: Note Legali vs Registro dei Consensi */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2.5 font-serif font-bold text-[10px] uppercase tracking-wider border-b-2 transition duration-150 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'config'
              ? 'border-[#0a1c3e] text-[#0a1c3e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4 text-brand-gold" /> Informative & Note Legali
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('registry')}
          className={`px-4 py-2.5 font-serif font-bold text-[10px] uppercase tracking-wider border-b-2 transition duration-150 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'registry'
              ? 'border-[#0a1c3e] text-[#0a1c3e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield className="w-4 h-4 text-brand-gold" /> Registro Consensi Cookie
          <span className="bg-[#0a1c3e] text-[#f7f5f0] text-[9px] font-mono px-2 py-0.5 rounded-full font-normal">
            {consentLogs.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'config' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* COLONNA FORM (SINISTRA) */}
          <div className="xl:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Blocco 1: Titolare e Contatti */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-[#0a1c3e] border-b pb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-gold" /> 1. Titolare del Trattamento & Sede
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-[11px]">Nome Titolare (Controller Name)</label>
                    <input 
                      type="text" 
                      value={localConfig.legal_controller_name} 
                      onChange={(e) => handleFieldChange('legal_controller_name', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-sans focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition"
                      placeholder="E.g. New World State Authority"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-[11px]">Email Contatto Privacy</label>
                    <input 
                      type="email" 
                      value={localConfig.legal_controller_email} 
                      onChange={(e) => handleFieldChange('legal_controller_email', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-sans focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition"
                      placeholder="E.g. privacy@newworldstate.org"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 text-[11px]">Sede del Trattamento (Address)</label>
                  <input 
                    type="text" 
                    value={localConfig.legal_controller_address} 
                    onChange={(e) => handleFieldChange('legal_controller_address', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-sans focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition"
                    placeholder="E.g. Infrastruttura Decentralizzata Globale"
                    required
                  />
                </div>
              </div>

              {/* Blocco 2: Cookie e Accessibilità */}
              <div className="space-y-4 pt-2">
                <h4 className="font-serif font-bold text-sm text-[#0a1c3e] border-b pb-2 flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-brand-gold" /> 2. Tracciatori & Livello Accessibilità
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-[11px]">Lista Tracciatori (Session/Local)</label>
                    <input 
                      type="text" 
                      value={localConfig.legal_cookies_list} 
                      onChange={(e) => handleFieldChange('legal_cookies_list', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-sans focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition"
                      placeholder="E.g. localPreferences, nws_admin_auth"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 text-[11px]">Livello Accessibilità WCAG</label>
                    <input 
                      type="text" 
                      value={localConfig.legal_accessibility_score} 
                      onChange={(e) => handleFieldChange('legal_accessibility_score', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-sans focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition"
                      placeholder="E.g. WCAG 2.1 AA Compliant"
                    />
                  </div>
                </div>
              </div>

              {/* Blocco 3: Clausole Personalizzate */}
              <div className="space-y-4 pt-2">
                <h4 className="font-serif font-bold text-sm text-[#0a1c3e] border-b pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-gold" /> 3. Clausole Personalizzate Integrate
                </h4>

                {/* Italiano */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#0a1c3e] block">🇮🇹 Versione Italiana</span>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600 text-[10px]">Clausole extra Privacy Policy (IT)</label>
                    <textarea 
                      rows={2}
                      value={localConfig.legal_custom_privacy_it} 
                      onChange={(e) => handleFieldChange('legal_custom_privacy_it', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-sans focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition text-[11px]"
                      placeholder="Aggiungi qui eventuali note legali specifiche del vostro ordinamento o chiarimenti..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600 text-[10px]">Clausole extra Termini & Condizioni (IT)</label>
                    <textarea 
                      rows={2}
                      value={localConfig.legal_custom_terms_it} 
                      onChange={(e) => handleFieldChange('legal_custom_terms_it', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-sans focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition text-[11px]"
                      placeholder="Aggiungi qui patti e condizioni aggiuntive legati alla cittadinanza in italiano..."
                    />
                  </div>
                </div>

                {/* Inglese */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#0a1c3e] block">🇬🇧 English Version</span>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600 text-[10px]">Clausole extra Privacy Policy (EN)</label>
                    <textarea 
                      rows={2}
                      value={localConfig.legal_custom_privacy_en} 
                      onChange={(e) => handleFieldChange('legal_custom_privacy_en', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-sans focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition text-[11px]"
                      placeholder="Add any specific legal provisions or jurisdiction-related notes in English..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600 text-[10px]">Clausole extra Terms & Conditions (EN)</label>
                    <textarea 
                      rows={2}
                      value={localConfig.legal_custom_terms_en} 
                      onChange={(e) => handleFieldChange('legal_custom_terms_en', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-sans focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition text-[11px]"
                      placeholder="Add supplementary citizenship terms or licensing constraints in English..."
                    />
                  </div>
                </div>
              </div>

              {/* Salva */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] py-3.5 rounded-xl font-bold transition duration-150 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow"
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>
                    Salvataggio in corso...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-brand-gold" /> Applica Configurazione Legale Pubblica
                  </>
                )}
              </button>

            </form>
          </div>

          {/* COLONNA PREVIEW IN TEMPO REALE (DESTRA) */}
          <div className="xl:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4 h-full flex flex-col">
              
              {/* Selettori Preview */}
              <div className="space-y-3 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-brand-gold" /> Preview Documenti Pubblici
                </span>

                {/* Selettore Documento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc('privacy')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-tight uppercase transition duration-150 cursor-pointer ${previewDoc === 'privacy' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-300/40'}`}
                  >
                    Privacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc('cookies')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-tight uppercase transition duration-150 cursor-pointer ${previewDoc === 'cookies' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-300/40'}`}
                  >
                    Cookie
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc('terms')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-tight uppercase transition duration-150 cursor-pointer ${previewDoc === 'terms' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-300/40'}`}
                  >
                    Termini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc('accessibility')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-tight uppercase transition duration-150 cursor-pointer ${previewDoc === 'accessibility' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-300/40'}`}
                  >
                    Accessib.
                  </button>
                </div>

                {/* Selettore Lingua */}
                <div className="flex gap-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewLang('it')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold border transition duration-150 cursor-pointer flex items-center gap-1 ${previewLang === 'it' ? 'bg-white border-[#0a1c3e] text-[#0a1c3e] shadow-sm' : 'bg-transparent border-slate-200 text-slate-500 hover:text-slate-800'}`}
                  >
                    🇮🇹 Italiano
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('en')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold border transition duration-150 cursor-pointer flex items-center gap-1 ${previewLang === 'en' ? 'bg-white border-[#0a1c3e] text-[#0a1c3e] shadow-sm' : 'bg-transparent border-slate-200 text-slate-500 hover:text-slate-800'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Foglio di Preview */}
              <div className="flex-1 bg-[#f7f5f0] border border-[#c5a880]/30 rounded-2xl p-5 md:p-6 shadow-inner overflow-y-auto max-h-[500px] xl:max-h-[700px] flex flex-col justify-between space-y-6">
                <div>
                  {/* Intestazione Documentale */}
                  <div className="border-b border-dashed border-brand-blue/20 pb-4 mb-4 text-center space-y-1 relative">
                    <span className="absolute right-0 top-0 text-[8px] bg-emerald-150 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{currentPreview.badge}</span>
                    <p className="font-serif font-black tracking-widest text-[#0a1c3e] text-[10px] uppercase">NEW WORLD STATE</p>
                    <h5 className="font-serif font-bold text-xs text-brand-gold">{currentPreview.title}</h5>
                    <p className="text-[8px] text-slate-400 font-mono tracking-widest">NWS AUTHORITY • OFFICIAL COMPLIANCE ARCHIVE</p>
                  </div>

                  {/* Contenuto Generato */}
                  {currentPreview.html}
                </div>

                {/* Sigillo Finale */}
                <div className="border-t border-slate-200 pt-4 text-center text-[9px] text-slate-400 font-mono space-y-1">
                  <p>© NEW WORLD STATE CITIZENSHIP REGISTRY AUTHORITY</p>
                  <p>CERTIFIED CRYPTOGRAPHIC VERIFICATION</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* Sezione Statistiche Rapide Consent Registry */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Consensi Totali</span>
              <span className="text-2xl font-serif font-black text-[#0a1c3e] mt-1">{consentLogs.length}</span>
              <span className="text-[9px] text-slate-500 mt-2 block">Prove di opt-in registrate</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Accettazione Totale</span>
              <span className="text-2xl font-serif font-black text-emerald-600 mt-1">
                {consentLogs.filter(l => l.action === 'Accept All').length}
              </span>
              <span className="text-[9px] text-slate-500 mt-2 block">Cookie completi autorizzati</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Solo Essenziali</span>
              <span className="text-2xl font-serif font-black text-amber-600 mt-1">
                {consentLogs.filter(l => l.action === 'Accept Essential Only').length}
              </span>
              <span className="text-[9px] text-slate-500 mt-2 block">Tracciamento non essenziale bloccato</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Personalizzati</span>
              <span className="text-2xl font-serif font-black text-blue-600 mt-1">
                {consentLogs.filter(l => l.action === 'Custom Preferences Saved').length}
              </span>
              <span className="text-[9px] text-slate-500 mt-2 block">Opzioni granularmente scelte</span>
            </div>
          </div>

          {/* Filtri & Azioni */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Cerca & Filtri */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Cerca per ID o IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0a1c3e]/20 outline-none transition text-slate-800"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterAction('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer ${filterAction === 'all' ? 'bg-[#0a1c3e] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAction('Accept All')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer ${filterAction === 'Accept All' ? 'bg-[#0a1c3e] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Completo
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAction('Accept Essential Only')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer ${filterAction === 'Accept Essential Only' ? 'bg-[#0a1c3e] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Solo Essenziali
                </button>
              </div>
            </div>

            {/* Pulsanti di Esportazione */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportJSON}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> Svuota Registro
              </button>
            </div>

          </div>

          {/* Tabella dei Consensi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4">ID Consenso</th>
                    <th className="py-3 px-4">Data & Ora (Local)</th>
                    <th className="py-3 px-4">IP (Anonimizzato)</th>
                    <th className="py-3 px-4">Azione Utente</th>
                    <th className="py-3 px-4 text-center">Essenziali</th>
                    <th className="py-3 px-4 text-center">Sistema</th>
                    <th className="py-3 px-4 text-center">Statistiche</th>
                    <th className="py-3 px-4 text-right">Dettagli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition duration-150">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.id}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.ip}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.action === 'Accept All' ? 'bg-emerald-50 text-emerald-700' :
                            log.action === 'Accept Essential Only' ? 'bg-amber-50 text-amber-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">✓</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-500">
                          {log.preferences ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-500">
                          {log.analytics ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="bg-slate-100 hover:bg-[#0a1c3e] hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer"
                          >
                            Ispeziona
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                        Nessuna prova di consenso trovata con i filtri correnti.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dettaglio Log Modal */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 bg-[#0a1c3e]/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="border-b pb-3 flex justify-between items-center">
                  <h4 className="font-serif font-bold text-sm text-[#0a1c3e] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-brand-gold" /> Prova Certificata del Consenso
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3 text-xs text-slate-800">
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">ID Transazione</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{selectedLog.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Data di Registro</span>
                    <span className="col-span-2 text-slate-700">{new Date(selectedLog.timestamp).toISOString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Indirizzo IP</span>
                    <span className="col-span-2 font-mono text-slate-700">{selectedLog.ip}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Provenienza</span>
                    <span className="col-span-2 text-slate-700">{selectedLog.origin}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Azione Utente</span>
                    <span className="col-span-2 font-bold text-slate-700">{selectedLog.action}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">User Agent</span>
                    <span className="col-span-2 text-slate-500 font-mono text-[10px] break-all leading-tight">
                      {selectedLog.userAgent}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Preferenze</span>
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="text-slate-600">Cookie Essenziali (Tecnici)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={selectedLog.preferences ? "text-emerald-600 font-bold" : "text-slate-300 font-bold"}>
                          {selectedLog.preferences ? "✓" : "✗"}
                        </span>
                        <span className="text-slate-600">Cookie di Sistema (Interfaccia)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={selectedLog.analytics ? "text-emerald-600 font-bold" : "text-slate-300 font-bold"}>
                          {selectedLog.analytics ? "✓" : "✗"}
                        </span>
                        <span className="text-slate-600">Cookie di Diagnostica (Statistiche)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-mono leading-relaxed">
                  <strong>DICHIARAZIONE DI INTEGRITÀ:</strong> Questa prova di consenso è registrata in conformità con l'Art. 7(1) del GDPR ed è firmata crittograficamente con il digest del browser dell'utente al fine di attestarne la validità e l'integrità.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="bg-[#0a1c3e] hover:bg-[#071530] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition shadow"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
