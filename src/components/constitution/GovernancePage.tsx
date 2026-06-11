import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Cpu, 
  Scale, 
  Vote, 
  Layers, 
  Users, 
  Award, 
  Network, 
  BookOpen, 
  ArrowRight, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react';

interface Pillar {
  id: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  titleEn: string;
  titleIt: string;
  detailsEn: string[];
  detailsIt: string[];
  roleEn: string;
  roleIt: string;
}

const statePillars: Pillar[] = [
  {
    id: 'executive',
    icon: <Landmark className="w-6 h-6 text-brand-gold" />,
    bgClass: 'bg-brand-blue/5',
    textClass: 'text-brand-blue',
    borderClass: 'border-brand-blue/15',
    titleEn: 'Federal Executive Council',
    titleIt: 'Consiglio Esecutivo Federale',
    roleEn: 'Responsible for active daily administration, secure state servers, citizen validation protocols, and international representations.',
    roleIt: 'Responsabile per l’amministrazione attiva quotidiana, i server di stato sicuri, la convalida sull’onboarding dei cittadini e la rappresentanza estera.',
    detailsEn: [
      'Chaired by Ministers of State appointed by the Assembly.',
      'Implements public digital infrastructure development.',
      'Supervises the General Registry and NWS Uploade.r engines.'
    ],
    detailsIt: [
      'Presieduto da Ministri di Stato nominati dall’Assemblea.',
      'Sviluppa l’infrastruttura digitale e i servizi pubblici.',
      'Supervisiona l’Anagrafe Generale e i motori di caricamento.'
    ]
  },
  {
    id: 'democracy',
    icon: <Vote className="w-6 h-6 text-emerald-600" />,
    bgClass: 'bg-emerald-500/5',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-500/15',
    titleEn: 'Decentralized Assembly',
    titleIt: 'Assemblea Cittadina Decentrata',
    roleEn: 'Represents the sovereign legislative body. Every citizen has direct proposing, lobbying, and voting rights for all civil initiatives.',
    roleIt: 'Rappresenta l’organo legislativo sovrano. Ogni cittadino ha diritti diretti di proposta, discussione e voto per tutte le iniziative civiche.',
    detailsEn: [
      '100% direct voting without political intermediaries.',
      'Proposals executed automatically after consensus.',
      'Cryptographically safe citizen voting keys.'
    ],
    detailsIt: [
      'Voto diretto al 100% senza intermediazioni partitiche.',
      'Proposte attuate automaticamente al raggiungimento del quorum.',
      'Chiavi di voto crittograficamente sicure per ogni cittadino.'
    ]
  },
  {
    id: 'judicial',
    icon: <Scale className="w-6 h-6 text-purple-600" />,
    bgClass: 'bg-purple-500/5',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-500/15',
    titleEn: 'Constitutional Justice',
    titleIt: 'Consiglio di Giustizia Costituzionale',
    roleEn: 'The supreme guarantor of the Constitution. Resolves disputes, enforces individual digital immunity, and audits state software integrity.',
    roleIt: 'L’organo garante supremo della Costituzione. Risolve dispute, applica l’immunità digitale individuale e verifica l’integrità dei software di stato.',
    detailsEn: [
      'Acts completely independent of the executive body.',
      'Reviews algorithms for state service transparency.',
      'Abolishes acts violating the Charter of Rights.'
    ],
    detailsIt: [
      'Agisce in totale indipendenza rispetto all’organo esecutivo.',
      'Riesamina gli algoritmi per garantire la massima trasparenza.',
      'Annulla i decreti in contrasto con la Carta dei Diritti.'
    ]
  },
  {
    id: 'infrastructure',
    icon: <Cpu className="w-6 h-6 text-blue-600" />,
    bgClass: 'bg-blue-500/5',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-500/15',
    titleEn: 'Digital State Infrastructure',
    titleIt: 'Infrastruttura Digitale di Stato',
    roleEn: 'The technological foundation ensuring absolute data ownership, zero-tracking, and encrypted communication channels.',
    roleIt: 'Il pilastro tecnologico che assicura la proprietà assoluta dei dati, assenza di tracciamento e comunicazioni protette da crittografia.',
    detailsEn: [
      'Runs on verified sovereign Cloudflare & secure edge endpoints.',
      'Physical ID Card PDF generations at exact metric proportions.',
      'Automatic offline backup rules protect citizen data vaults.'
    ],
    detailsIt: [
      'Opera su Cloudflare e nodi distribuiti controllati dal NWS.',
      'Generazione PDF delle ID Card fisiche a proporzioni metriche esatte.',
      'Regole di backup offline automatico per proteggere i dati personali.'
    ]
  }
];

export default function GovernancePage() {
  const { language } = useI18n();
  const isEn = language === 'en';
  const [selectedPillar, setSelectedPillar] = useState<string>('executive');

  const titleText = isEn ? 'State Governance' : 'Governance dello Stato';
  const subtitleText = isEn 
    ? 'Discover the digital direct democracy model, institutional organization, and secure state operations.'
    : 'Scopri il modello di democrazia diretta digitale, l’organizzazione istituzionale e la sicurezza dello Stato.';

  const activePillar = statePillars.find(p => p.id === selectedPillar) || statePillars[0];

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
          <Layers className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Main Governance Introduction */}
        <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 md:p-8 mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue font-tech">
              {isEn ? 'A New Horizon of Representation' : 'Un Nuovo Orizzonte di Rappresentanza'}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-brand-blue/80 leading-relaxed">
            {isEn ? (
              <>
                The New World State transitions from traditional geopolitical representation to we-centric, values-based digital representation. 
                Our governance model eliminates bureaucratic friction, giving maximum power to the sovereign citizen. 
                Every document, law, and administrative ledger is signed digitally to ensure absolute transparency and auditability.
              </>
            ) : (
              <>
                Il New World State passa dai tradizionali sistemi geopolitici a un modello basato sui valori e sulla rappresentanza digitale diretta dei cittadini. 
                Il nostro modello di governance riduce gli attriti burocratici, ponendo il potere reale direttamente nelle mani dei cittadini. 
                Ogni documento, legge e registro amministrativo è firmato digitalmente per garantire la massima trasparenza e ispezionabilità.
              </>
            )}
          </p>
        </div>

        {/* Interactive Organigram Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Navigation/Selector */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold font-tech mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {isEn ? 'Institutional Foundations' : 'Istituzioni Costituzionali'}
            </h4>
            
            <div className="flex flex-col gap-3">
              {statePillars.map((p) => {
                const isActive = p.id === selectedPillar;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPillar(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isActive 
                        ? 'bg-[#0A1C3E] text-white border-brand-gold shadow-lg' 
                        : 'bg-white hover:bg-brand-parchment/40 text-brand-blue border-brand-blue/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-blue/5'}`}>
                        {p.icon}
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider font-tech font-bold opacity-60">
                          {p.id}
                        </span>
                        <h5 className="font-serif font-bold text-sm md:text-base leading-tight mt-0.5">
                          {isEn ? p.titleEn : p.titleIt}
                        </h5>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'text-brand-gold translate-x-1' : 'text-brand-blue/30 group-hover:translate-x-1'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Pane */}
          <div className="lg:col-span-7 bg-white border border-brand-blue/10 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPillar}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-start justify-between border-b border-brand-blue/5 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest font-tech font-extrabold text-brand-gold mt-1 block">
                      {isEn ? 'Sovereign Pillar Details' : 'Dettagli Pilastro Sovrano'}
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-brand-blue mt-1">
                      {isEn ? activePillar.titleEn : activePillar.titleIt}
                    </h4>
                  </div>
                  <div className="p-3 bg-brand-gold/5 rounded-xl border border-brand-gold/15">
                    {activePillar.icon}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted font-tech">
                      {isEn ? 'Core Mandate' : 'Mandato Principale'}
                    </h5>
                    <p className="text-xs md:text-sm text-brand-blue/80 font-light leading-relaxed mt-1.5">
                      {isEn ? activePillar.roleEn : activePillar.roleIt}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted font-tech">
                      {isEn ? 'Operational Protocols' : 'Protocolli Operativi'}
                    </h5>
                    <ul className="space-y-2.5">
                      {(isEn ? activePillar.detailsEn : activePillar.detailsIt).map((det, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs text-brand-blue/90">
                          <CheckCircle className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                          <span>{det}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 pt-4 border-t border-brand-blue/5 flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-tech uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-brand-gold" />
                {isEn ? 'Audit Status: Fully Verifiable' : 'Stato Audit: Complessivamente Verificabile'}
              </span>
              <span className="font-bold text-emerald-600 uppercase tracking-widest">
                {isEn ? 'Active • Sovereign' : 'Attivo • Sovrano'}
              </span>
            </div>
          </div>

        </div>

        {/* State Telemetry Dashboard */}
        <div className="border border-brand-blue/10 rounded-2xl bg-gradient-to-br from-brand-blue to-[#06122a] p-6 text-white mb-10 overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <Award className="w-96 h-96 text-white" />
          </div>
          
          <div className="max-w-xl space-y-2 mb-6">
            <span className="text-[9px] font-bold font-tech bg-brand-gold/20 text-brand-gold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {isEn ? 'STATE METADATA' : 'METADATI DI STATO'}
            </span>
            <h4 className="font-serif font-bold text-xl md:text-2xl text-brand-gold">
              {isEn ? 'Administrative Framework' : 'Quadro Amministrativo di Controllo'}
            </h4>
            <p className="text-xs text-white/70 font-light">
              {isEn 
                ? 'Immutable administrative values registered under civil consensus rules.' 
                : 'Valori amministrativi immutabili registrati secondo i consensi di ammissione civica.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {isEn ? 'Active Ministries' : 'Ministeri Istituiti'}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">6</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {isEn ? 'Meritocratically managed' : 'Gestiti per competenze'}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {isEn ? 'Current Term' : 'Legislatura Attuale'}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">2024 - 2028</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {isEn ? '4-Year Cycle' : 'Ciclo quadriennale'}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {isEn ? 'Vesting Quorum' : 'Quorum Delibere'}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">50.1% + 1</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {isEn ? 'Of active voters' : 'Degli elettori attivi'}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {isEn ? 'State Platform' : 'Server di Veridicità'}
              </p>
              <h5 className="text-xl font-bold font-tech uppercase leading-none text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-gold block shrink-0 animate-pulse" />
                Cloud-Secure
              </h5>
              <p className="text-[9px] text-white/50 leading-none">
                {isEn ? 'Zero trust architecture' : 'Architettura Zero-Trust'}
              </p>
            </div>
          </div>
        </div>

        {/* Warning / Call to Action Alert */}
        <div className="p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-brand-blue">
          <div className="flex gap-3 items-start">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h6 className="font-bold uppercase tracking-wider font-tech text-[10px] mb-0.5">
                {isEn ? 'Security Warning' : 'Avviso di Sicurezza'}
              </h6>
              <p className="text-muted leading-relaxed font-light">
                {isEn ? (
                  <>The New World State does not issue administrative accounts via third-party emails. General official inquiries must go directly to <strong className="text-brand-blue">info@newworldstate.org</strong>.</>
                ) : (
                  <>Il New World State non rilascia account di amministrazione tramite comunicazioni di terze parti. Le richieste ufficiali passano unicamente da <strong className="text-brand-blue">info@newworldstate.org</strong>.</>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
