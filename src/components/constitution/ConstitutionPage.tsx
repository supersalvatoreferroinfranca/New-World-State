import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion } from 'motion/react';
import { BookOpen, Download, FileText, Globe, Scale, Shield, Landmark } from 'lucide-react';

export interface ConstitutionLink {
  language: string;
  nativeName: string;
  url: string;
  flag: string;
  code: string;
  descriptionEn: string;
  descriptionIt: string;
}

const constitutionLinks: ConstitutionLink[] = [
  {
    language: 'English',
    nativeName: 'Constitution EN',
    url: 'https://www.newworldstate.org/costitution/CONSTITUTION-OF-THE-SOVEREIGN-WORLD-STATE.pdf',
    flag: '🇺🇸',
    code: 'EN',
    descriptionEn: 'Official English version of the Sovereign World State Constitution.',
    descriptionIt: 'Versione ufficiale in lingua inglese della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'Italiano',
    nativeName: 'Costituzione',
    url: 'https://www.newworldstate.org/costitution/COSTITUZIONE-E-ATTO-COSTITUTIVO-STATO-MONDIALE.pdf',
    flag: '🇮🇹',
    code: 'IT',
    descriptionEn: 'Official Italian version containing the statute and constitution.',
    descriptionIt: 'Versione ufficiale in italiano contenente lo statuto e atto costitutivo.'
  },
  {
    language: 'Français',
    nativeName: 'Constitution FR',
    url: 'https://www.newworldstate.org/costitution/CONSTITUTION-DE-LETAT-MONDIAL-SOUVERAIN-Francese.pdf',
    flag: '🇫🇷',
    code: 'FR',
    descriptionEn: 'French translation of the Constitution of the Sovereign World State.',
    descriptionIt: 'Traduzione in lingua francese della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'Español',
    nativeName: 'Constitución',
    url: 'https://www.newworldstate.org/costitution/CONSTITUCION-DEL-ESTADO-MUNDIAL-SOBERANO.pdf',
    flag: '🇪🇸',
    code: 'ES',
    descriptionEn: 'Spanish translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua spagnola della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'Português',
    nativeName: 'Constituição',
    url: 'https://www.newworldstate.org/costitution/CONSTITUICAO-DO-ESTADO-SOBERANO-MUNDIAL-Portoghese.pdf',
    flag: '🇵🇹',
    code: 'PT',
    descriptionEn: 'Portuguese translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua portoghese della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'Русский',
    nativeName: 'Конституция',
    url: 'https://www.newworldstate.org/costitution/КОНСТИТУЦИЯ-СУВЕРЕННОГО-МИРОВОГО-ГОСУДАРСТВА-Russo.pdf',
    flag: '🇷🇺',
    code: 'RU',
    descriptionEn: 'Russian translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua russa della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'हिन्दी (Hindi)',
    nativeName: 'संविधान',
    url: 'https://www.newworldstate.org/costitution/संप्रभु-विश्व-राज्य-Hindi.pdf',
    flag: '🇮🇳',
    code: 'HI',
    descriptionEn: 'Hindi translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua hindi della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'বাংলা (Bengali)',
    nativeName: 'সংবিধান',
    url: 'https://www.newworldstate.org/costitution/সার্বভৌম-विश्व-राष्ट्र-Bengalese.pdf',
    flag: '🇧🇩',
    code: 'BN',
    descriptionEn: 'Bengali translation of the sovereign world state constitution.',
    descriptionIt: 'Traduzione in lingua bengalese della costituzione dello stato mondiale.'
  },
  {
    language: '中文 (Chinese)',
    nativeName: '憲法 / 宪法',
    url: 'https://www.newworldstate.org/costitution/主权世界国家-Cinese.pdf',
    flag: '🇨🇳',
    code: 'ZH',
    descriptionEn: 'Chinese translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua cinese della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: '日本語 (Japanese)',
    nativeName: '憲法',
    url: 'https://www.newworldstate.org/costitution/主権世界国家-Giapponese.pdf',
    flag: '🇯🇵',
    code: 'JA',
    descriptionEn: 'Japanese translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua giapponese della Costituzione dello Stato Mondiale Sovrano.'
  },
  {
    language: 'العربية (Arabic)',
    nativeName: 'دستور',
    url: 'https://www.newworldstate.org/costitution/دستور-الدولة-العالمية-ذات-السيادة-Arabo.pdf',
    flag: '🌍',
    code: 'AR',
    descriptionEn: 'Arabic translation of the Sovereign World State Constitution.',
    descriptionIt: 'Traduzione in lingua araba della Costituzione dello Stato Mondiale Sovrano.'
  }
];

export default function ConstitutionPage() {
  const { language } = useI18n();

  const isEn = language === 'en';

  const titleText = isEn ? 'The Supreme Constitution' : 'Costituzione Suprema';
  const subtitleText = isEn 
    ? 'Official constitutional documents and international pacts of the sovereign community.' 
    : 'Documenti costituzionali ufficiali e patti internazionali della comunità sovrana.';

  const preambleHeading = isEn ? 'Constitutional Fulfillments & Preambles' : 'Preambolo e Fondamenti dello Stato';
  const preambleText = isEn 
    ? 'The New World State is established under universal values of peace, preservation of life, and sovereign citizen representation. Our Supreme Constitution represents the common agreement binding all citizens regardless of geography, race, or previous jurisdiction.'
    : 'Lo Stato Mondiale dei Cittadini si fonda sui valori universali della pace, della conservazione della vita e della rappresentanza sovrana del cittadino. La nostra Suprema Costituzione rappresenta l’accordo comune che vincola tutti i cittadini, indipendentemente dalla loro posizione geografica, razza o giurisdizione precedente.';

  const downloadsHeading = isEn ? 'Available Translations' : 'Traduzioni Disponibili';
  const downloadButtonText = isEn ? 'Download PDF' : 'Scarica PDF';

  const preambles = [
    {
      icon: <Scale className="w-6 h-6 text-brand-gold shrink-0" />,
      title: isEn ? 'Universal Justice' : 'Giustizia Universale',
      desc: isEn 
        ? 'A legal ecosystem guaranteeing freedom, protection of human integrity, and unconditional digital defense.'
        : 'Un ecosistema legale che garantisce libertà, tutela dell’integrità umana ed una difesa digitale incondizionata.'
    },
    {
      icon: <Globe className="w-6 h-6 text-brand-gold shrink-0" />,
      title: isEn ? 'Borderless Sovereignty' : 'Sovranità Senza Confini',
      desc: isEn
        ? 'Direct global citizenship via decentralized systems, decoupling representation from regional limitations.'
        : 'Cittadinanza globale diretta tramite sistemi digitali decentrati, slegando la rappresentanza da confini regionali.'
    },
    {
      icon: <Shield className="w-6 h-6 text-brand-gold shrink-0" />,
      title: isEn ? 'Global Heritage Preservation' : 'Preservazione del Patrimonio',
      desc: isEn
        ? 'Commitment to human evolution, safe automation guidelines, absolute ecological defense, and collective prosperity.'
        : 'Impegno per l’evoluzione umana, linee guida sull’automazione sicura, difesa ecologica assoluta e progresso collettivo.'
    }
  ];

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
          <Landmark className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Foundations & Preambles Bento Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="md:col-span-3 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-blue font-tech">
              {preambleHeading}
            </h3>
            <p className="text-xs md:text-sm text-brand-blue/80 leading-relaxed max-w-4xl">
              {preambleText}
            </p>
          </div>

          {preambles.map((p, idx) => (
            <div key={idx} className="bg-white border border-brand-blue/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4">
              <div className="p-3 bg-brand-gold/5 rounded-xl inline-self-start shrink-0">
                {p.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-brand-blue font-bold">{p.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Downloads Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-brand-blue/10 pb-4">
            <LandingIndicator />
            <h3 className="text-lg md:text-xl font-serif text-brand-blue font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-gold" />
              {downloadsHeading}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {constitutionLinks.map((link) => (
              <motion.div 
                key={link.code}
                whileHover={{ y: -3 }}
                className="bg-white hover:bg-brand-parchment/30 rounded-2xl border border-brand-blue/10 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group duration-200"
              >
                <div className="space-y-4">
                  {/* Language and Flag Tag */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" role="img" aria-label={link.language}>
                      {link.flag}
                    </span>
                    <span className="text-[9px] font-bold font-tech bg-brand-blue/5 text-brand-blue/80 px-2.5 py-1 rounded-full uppercase tracking-wider group-hover:bg-[#0A1C3E] group-hover:text-white transition-colors duration-200">
                      {link.code}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-md text-brand-blue group-hover:text-brand-gold transition-colors duration-150">
                      {link.nativeName}
                    </h4>
                    <p className="text-[10px] uppercase font-tech tracking-wider text-brand-gold/80 font-bold leading-none">
                      {link.language}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-muted leading-normal line-clamp-3">
                    {isEn ? link.descriptionEn : link.descriptionIt}
                  </p>
                </div>

                {/* Download Button */}
                <div className="pt-5 mt-4 border-t border-gray-50">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#0A1C3E] hover:bg-brand-gold text-white hover:text-[#0A1C3E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadButtonText}</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final Disclaimer */}
        <div className="mt-12 p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 text-center text-[11px] text-brand-blue/70">
          {isEn ? (
            <span>For official inquiries or physical printing, contact the General Secretary Office at <strong className="text-brand-blue">info@newworldstate.org</strong>. All documents are encrypted and signed digitally.</span>
          ) : (
            <span>Per richieste ufficiali o stampe tipografiche, contattare l&apos;Ufficio del Segretario Generale a <strong className="text-brand-blue">info@newworldstate.org</strong>. Tutti i documenti sono firmati digitalmente.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Minimal flag/indicator for section titles
function LandingIndicator() {
  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand-gold opacity-75"></span>
    </div>
  );
}
