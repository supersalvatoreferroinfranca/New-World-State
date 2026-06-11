import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Server, 
  Key, 
  Database, 
  CheckCircle, 
  FileLock, 
  Network,
  Users
} from 'lucide-react';

interface ProtocolSection {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleIt: string;
  descriptionEn: string;
  descriptionIt: string;
  detailsEn: string[];
  detailsIt: string[];
}

const protocols: ProtocolSection[] = [
  {
    id: 'digital-immunity',
    icon: <Lock className="w-6 h-6 text-brand-gold" />,
    titleEn: 'Digital Immunity Charter',
    titleIt: 'Carta dell’Immunità Digitale',
    descriptionEn: 'Your identity data is considered an inviolable projection of your biological person. No tracking, profiling, or monetization of citizen records is technologically possible or legally tolerated.',
    descriptionIt: 'I dati della tua identità sono considerati una proiezione inviolabile della tua persona biologica. Nessun tracciamento, profilazione o monetizzazione dei record dei cittadini è tecnologicamente possibile o legalmente tollerato.',
    detailsEn: [
      'Self-sovereign cryptographic control keys owned exclusively by the citizen.',
      'Absolute non-cooperation with third-party advertising, profiling engines, or surveillance brokers.',
      'Protected digital domicile with zero external analytics tracking.'
    ],
    detailsIt: [
      'Chiavi di controllo crittografiche auto-sovrane possedute esclusivamente dal cittadino.',
      'Assoluta non-cooperazione con motori pubblicitari esterni, tracciamenti o broker di dati.',
      'Domicilio digitale protetto con zero tracciatori analitici esterni.'
    ]
  },
  {
    id: 'e2e-encryption',
    icon: <FileLock className="w-6 h-6 text-brand-gold" />,
    titleEn: 'End-to-End Credential Encryption',
    titleIt: 'Crittografia End-to-End delle Credenziali',
    descriptionEn: 'Sovereign ID Card data, photographs, and citizen identifiers are secured at rest and during transit. The federation implements high-level standard hashes with secure signature engines.',
    descriptionIt: 'I dati delle ID Card Sovrane, le fotografie e gli identificativi dei cittadini sono cifrati in transito e sui sistemi di persistenza. La federazione implementa hash standard di alto livello con motori di firma sicuri.',
    detailsEn: [
      'Zero-knowledge photo and PDF generation flow.',
      'Verification hashes are decoupled from standard search engines to prevent automated indexing.',
      'Encrypted digital signatures on all approved certificates.'
    ],
    detailsIt: [
      'Flusso di generazione PDF e foto con paradigma zero-knowledge.',
      'Gli hash di verifica sono separati dai motori di ricerca standard per impedire l’indicizzazione automatica.',
      'Firme digitali crittografate su tutti i certificati approvati.'
    ]
  },
  {
    id: 'infrastructure-privacy',
    icon: <Server className="w-6 h-6 text-brand-gold" />,
    titleEn: 'Sovereign Edge Infrastructure',
    titleIt: 'Infrastruttura di Confine Sovrana',
    descriptionEn: 'Our databases and servers run exclusively on cloud-native networks protected by advanced web shields and regional secure containers with zero automated backdoors.',
    descriptionIt: 'I nostri database e server operano esclusivamente su reti cloud-native protette da difese avanzate e container sicuri a livello regionale con assenza assoluta di backdoor automatizzate.',
    detailsEn: [
      'Edge workers execute tasks in sandbox isolation, minimizing data footprints.',
      'Encrypted backup procedures without external proprietary intermediaries.',
      'Real-time automated validation checks without logging IP addresses.'
    ],
    detailsIt: [
      'Edge worker che eseguono i compiti in sandbox Isolate, minimizzando l’impronta dei dati.',
      'Procedure di backup cifrate senza alcun intermediario proprietario esterno.',
      'Controlli automatici di validazione in tempo reale senza memorizzare gli indirizzi IP.'
    ]
  }
];

export default function PrivacyProtocolPage() {
  const { language } = useI18n();
  const isEn = language === 'en';

  const titleText = isEn ? 'Sovereign Privacy Protocol' : 'Protocollo della Privacy Sovrana';
  const subtitleText = isEn 
    ? 'The fundamental protection layers governing global citizen data with absolute safety and cryptographic transparency.'
    : 'I livelli fondamentali di protezione che regolano i dati dei cittadini globali con sicurezza assoluta e trasparenza crittografica.';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-1"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Background Emblem Watermark */}
        <div className="absolute right-0 bottom-0 opacity-[0.02] transform translate-x-24 translate-y-24 pointer-events-none">
          <EyeOff className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <EyeOff className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Introductory Banner */}
        <div className="bg-[#0A1C3E] text-white border border-brand-blue/10 rounded-2xl p-6 md:p-8 mb-12 space-y-4 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 opacity-10">
            <ShieldCheck className="w-48 h-48 text-brand-gold" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold border border-brand-gold/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold font-tech">
              {isEn ? 'Universal Immunity Protocol' : 'Protocollo di Immunità Universale'}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-200 leading-relaxed max-w-4xl relative z-10">
            {isEn ? (
              <>
                The New World State does not collect data to monitor, control, or restrict its populations. 
                Instead, our civil registry serves as a decentralizable repository designed to shield individual identities. 
                Your files are generated dynamically, held securely, and verification checks are governed under rigid zero-disclosure terms.
              </>
            ) : (
              <>
                Il New World State non raccoglie dati per monitorare, controllare o limitare le sue popolazioni. 
                Invece, l’Anagrafe Mondiale funge da registro protettivo configurato per tutelare l’identità individuale. 
                I tuoi file sono generati dinamicamente, custoditi in sicurezza e i controlli di validazione avvengono sotto rigidi termini di non divulgazione.
              </>
            )}
          </p>
        </div>

        {/* Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {protocols.map((section) => (
            <div 
              key={section.id} 
              className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-gold/40 transition-colors"
            >
              <div className="space-y-4">
                <div className="p-3 bg-brand-gold/5 rounded-xl border border-brand-gold/15 inline-block">
                  {section.icon}
                </div>
                <h4 className="font-serif font-bold text-xl text-brand-blue">
                  {isEn ? section.titleEn : section.titleIt}
                </h4>
                <p className="text-xs text-muted/90 font-light leading-relaxed">
                  {isEn ? section.descriptionEn : section.descriptionIt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-blue/5 space-y-2">
                {(isEn ? section.detailsEn : section.detailsIt).map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px] text-brand-blue/90 font-light">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cryptographic Standards */}
        <div className="border border-brand-blue/10 rounded-2xl bg-gradient-to-br from-[#0a1c3e] to-[#040c1c] p-6 text-white md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[9px] font-bold font-tech bg-brand-gold/20 text-brand-gold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {isEn ? 'ENCRYPTION METRICS' : 'METRICHE DI CIFRATURA'}
              </span>
              <h4 className="font-serif font-semibold text-xl md:text-2xl text-brand-gold">
                {isEn ? 'State System Auditing' : 'Verifica dei Sistemi di Stato'}
              </h4>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                {isEn 
                  ? 'All verification QR codes printed on physical papers route through decentralized verification paths. We protect the integrity of citizen registration certificates against external manipulation.'
                  : 'Tutti i codici QR stampati sui documenti cartacei sono instradati tramite canali di verifica protetti. Preserviamo l’integrità delle iscrizioni anagrafiche dei nostri cittadini contro manipolazioni esterne.'}
              </p>
            </div>

            <div className="flex gap-4 shrink-0 flex-wrap">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[110px]">
                <p className="text-[10px] text-brand-gold/80 font-tech uppercase font-bold tracking-wider">{isEn ? 'Data Lease' : 'Durata Dati'}</p>
                <p className="text-lg font-serif font-bold text-white mt-1">Sovereign</p>
                <p className="text-[9px] text-white/40">{isEn ? 'Until revocation' : 'Fino a revoca'}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[110px]">
                <p className="text-[10px] text-brand-gold/80 font-tech uppercase font-bold tracking-wider">{isEn ? 'Cookie Profilers' : 'Profilatori Cookie'}</p>
                <p className="text-lg font-serif font-bold text-white mt-1">Zero (0)</p>
                <p className="text-[9px] text-white/40">{isEn ? 'Fully Blocked' : 'Nessun tracciante'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
