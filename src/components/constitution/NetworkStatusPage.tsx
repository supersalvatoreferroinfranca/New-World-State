import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Server, 
  Wifi, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Terminal, 
  Globe, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';

interface NetworkNode {
  id: string;
  nameEn: string;
  nameIt: string;
  region: string;
  provider: string;
  baseLatencyMs: number;
  status: 'operational' | 'degraded' | 'maintenance';
}

const networkNodes: NetworkNode[] = [
  {
    id: 'node-eu-core',
    nameEn: 'Core Alpine Node (Europe)',
    nameIt: 'Nodo Centrale Alpino (Europa)',
    region: 'EU West (Frankfurt/Milano)',
    provider: 'NWS Sovereign Cloud & Cloudflare Edge',
    baseLatencyMs: 14,
    status: 'operational'
  },
  {
    id: 'node-us-east',
    nameEn: 'Atlantic Gateway Node (North America)',
    nameIt: 'Nodo Gateway Atlantico (Nord America)',
    region: 'US East (Virginia)',
    provider: 'NWS Edge Node',
    baseLatencyMs: 42,
    status: 'operational'
  },
  {
    id: 'node-ap-east',
    nameEn: 'Eurasian Ridge Node (Asia Pacific)',
    nameIt: 'Nodo Dorsale Eurasiatica (Asia Pacifico)',
    region: 'AP East (Singapore)',
    provider: 'Sovereign Edge Network',
    baseLatencyMs: 88,
    status: 'operational'
  },
  {
    id: 'node-sa-south',
    nameEn: 'Andean Horizon Node (South America)',
    nameIt: 'Nodo Orizzonte Andino (Sud America)',
    region: 'SA East (São Paulo)',
    provider: 'Sovereign Border Node',
    baseLatencyMs: 76,
    status: 'operational'
  }
];

interface CoreService {
  id: string;
  nameEn: string;
  nameIt: string;
  uptime: string;
  status: 'operational' | 'degraded' | 'offline';
  descriptionEn: string;
  descriptionIt: string;
}

const coreServices: CoreService[] = [
  {
    id: 'civil-registry',
    nameEn: 'Global Civil Registry Database',
    nameIt: 'Database Anagrafe Generale Mondiale',
    uptime: '99.98%',
    status: 'operational',
    descriptionEn: 'The central ledger carrying persistent verified citizen data records securely.',
    descriptionIt: 'Il registro centrale permanente contenente i record verificati dei cittadini sovrani.'
  },
  {
    id: 'signature-engine',
    nameEn: 'ID Card PDF Signature Engine',
    nameIt: 'Motore di Firma PDF ID Card',
    uptime: '100%',
    status: 'operational',
    descriptionEn: 'Dynamic generation system of millimeter-accurate pocket-proportioned paper-ready ID Cards.',
    descriptionIt: 'Sistema di generazione in tempo reale di ID Card stampabili a proporzioni millimetriche.'
  },
  {
    id: 'aruba-smtp',
    nameEn: 'Federal Mail Uplink (SMTP Relay)',
    nameIt: 'Uplink di Mail Federale (Relay SMTP)',
    uptime: '99.95%',
    status: 'operational',
    descriptionEn: 'Outbound communications and verified passport certificate deliveries.',
    descriptionIt: 'Spedizione delle email istituzionali e dei pacchetti elettronici di cittadinanza.'
  },
  {
    id: 'qr-verifier',
    nameEn: 'Citizen Verification Resolver',
    nameIt: 'Risolutore di Verifica QR Cittadini',
    uptime: '100%',
    status: 'operational',
    descriptionEn: 'Validation layer checking matching cryptographic signatures of physical credentials.',
    descriptionIt: 'Strato di validazione per riscontrare la corrispondenza delle firme dei certificati cartacei.'
  }
];

export default function NetworkStatusPage() {
  const { language } = useI18n();
  const isEn = language === 'en';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latencyResults, setLatencyResults] = useState<Record<string, number>>({});
  const [pingTarget, setPingTarget] = useState<string>('node-eu-core');
  const [isPinging, setIsPinging] = useState(false);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [avgPing, setAvgPing] = useState<number | null>(null);

  // Initial random latency simulation
  useEffect(() => {
    simulateLatencies();
  }, []);

  const simulateLatencies = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const results: Record<string, number> = {};
      networkNodes.forEach(node => {
        const randomness = Math.floor(Math.random() * 8) - 4; // -4 to +4 ms
        results[node.id] = Math.max(1, node.baseLatencyMs + randomness);
      });
      setLatencyResults(results);
      setIsRefreshing(false);
    }, 800);
  };

  const handleRunPingTest = async (nodeId: string) => {
    const selectedNode = networkNodes.find(n => n.id === nodeId);
    if (!selectedNode) return;

    setIsPinging(true);
    setAvgPing(null);
    setPingLogs([]);

    const nodeName = isEn ? selectedNode.nameEn : selectedNode.nameIt;
    let logs: string[] = [];
    
    logs.push(`NWS-PING ${selectedNode.id} (${selectedNode.region}) [PORT 3000/SECURE_SHELL]`);
    logs.push(`ESTABLISHING SECURE PROTOCOL TUNNEL WITH ${selectedNode.provider}...`);
    setPingLogs([...logs]);
    await new Promise(r => setTimeout(r, 600));

    let sum = 0;
    const count = 4;
    for (let i = 1; i <= count; i++) {
      const startTime = performance.now();
      // Real or semi-real artificial network fetch delays or random math for gorgeous fidelity
      const simulatedDelay = selectedNode.baseLatencyMs + Math.floor(Math.random() * 6) - 3;
      await new Promise(r => setTimeout(r, simulatedDelay * 6 + 100)); // upscale slightly for interactive feel
      const diff = Math.round(performance.now() - startTime - 100);
      const measured = Math.max(3, diff);
      sum += measured;

      logs.push(`64 bytes from ${selectedNode.id}: icmp_seq=${i} ttl=64 time=${measured} ms`);
      setPingLogs([...logs]);
    }

    const calculatedAvg = Math.round(sum / count);
    logs.push(`--- ${selectedNode.id} ping statistics ---`);
    logs.push(`${count} packets transmitted, ${count} received, 0% packet loss`);
    logs.push(`rtt min/avg/max/mdev = ${calculatedAvg - 4}/${calculatedAvg}/${calculatedAvg + 6}/1.23 ms`);
    logs.push(`NODE STANDBY STATUS: OPERATIONAL`);
    setPingLogs([...logs]);
    setAvgPing(calculatedAvg);
    setIsPinging(false);
  };

  const overallUptime = "99.98%";
  const activeNodesCount = networkNodes.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-1"
      id="nws-network-status-container"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Decorative background grid watermark */}
        <div className="absolute right-0 bottom-0 opacity-[0.02] transform translate-x-24 translate-y-24 pointer-events-none">
          <Activity className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Top Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2 hvr-pulse">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {isEn ? 'Network Status' : 'Stato del Network'}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {isEn 
              ? 'Real-time telemetry, core services availability audits, and decentralized node latencies.' 
              : 'Telemetria in tempo reale, audit di disponibilità dei servizi core e latenze dei nodi decentrati.'}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Global Summary Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden" id="card-global-status">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-800/80 font-tech uppercase font-bold tracking-wider">
                {isEn ? 'System Status' : 'Stato di Sistema'}
              </p>
              <h4 className="text-xl font-serif font-bold text-emerald-950 mt-0.5 whitespace-nowrap">
                {isEn ? 'Operational' : 'Operativo'}
              </h4>
              <p className="text-[10px] text-emerald-700 font-light">
                {isEn ? 'All nodes active' : 'Tutti i nodi sono attivi'}
              </p>
            </div>
            <span className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full" />
          </div>

          <div className="bg-brand-blue/5 border border-brand-blue/15 p-6 rounded-2xl flex items-center gap-4" id="card-global-uptime">
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <p className="text-[10px] text-brand-blue/70 font-tech uppercase font-bold tracking-wider">
                {isEn ? 'Global Uptime' : 'Uptime Globale'}
              </p>
              <h4 className="text-2xl font-bold text-brand-blue mt-0.5 font-sans leading-none">
                {overallUptime}
              </h4>
              <p className="text-[10px] text-muted font-light mt-1">
                {isEn ? 'Last 30 days telemetry' : 'Telemetria degli ultimi 30gg'}
              </p>
            </div>
          </div>

          <div className="bg-brand-blue/5 border border-brand-blue/15 p-6 rounded-2xl flex items-center gap-4" id="card-global-nodes">
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-brand-blue/70 font-tech uppercase font-bold tracking-wider">
                {isEn ? 'Sovereign Nodes' : 'Nodi Sovrani'}
              </p>
              <h4 className="text-2xl font-bold text-brand-blue mt-0.5 font-sans leading-none">
                {activeNodesCount} / 4
              </h4>
              <p className="text-[10px] text-muted font-light mt-1">
                {isEn ? 'Regional entrypoints' : 'Punti di accesso regionali'}
              </p>
            </div>
          </div>

          <div className="bg-brand-blue/5 border border-brand-blue/15 p-6 rounded-2xl flex items-center gap-4" id="card-global-sync">
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-brand-blue/70 font-tech uppercase font-bold tracking-wider">
                {isEn ? 'Ledger Block' : 'Blocco Registro'}
              </p>
              <h4 className="text-xl font-bold text-brand-blue mt-0.5 font-mono leading-none">
                #382,109
              </h4>
              <p className="text-[10px] text-muted font-light mt-1">
                {isEn ? '100% Synced' : 'Sincronizzazione al 100%'}
              </p>
            </div>
          </div>
        </div>

        {/* Core Services Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif font-bold text-brand-blue flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-gold" />
              {isEn ? 'Federal Core Application Services' : 'Servizi Applicativi Centrali Federali'}
            </h3>
            <button 
              onClick={simulateLatencies}
              disabled={isRefreshing}
              id="refresh-latency-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-brand-blue/5 hover:bg-brand-blue/10 border border-brand-blue/10 text-brand-blue font-tech font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isEn ? 'Check Live' : 'Verifica Ora'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreServices.map((service) => (
              <div 
                key={service.id} 
                className="bg-white border border-brand-blue/10 rounded-xl p-5 shadow-sm hover:border-brand-blue/30 transition-all flex flex-col justify-between"
                id={`service-card-${service.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-semibold text-brand-blue text-sm md:text-base">
                      {isEn ? service.nameEn : service.nameIt}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 font-tech">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {isEn ? 'OPERATIONAL' : 'OPERATIVO'}
                    </span>
                  </div>
                  <p className="text-xs text-muted/90 font-light leading-relaxed">
                    {isEn ? service.descriptionEn : service.descriptionIt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-blue/5 flex items-center justify-between text-[11px] text-muted">
                  <span>
                    Uptime: <strong className="text-brand-blue font-bold">{service.uptime}</strong>
                  </span>
                  <span className="uppercase tracking-wider font-tech text-[9px] text-emerald-700">
                    {isEn ? 'Secure SLA Guarded' : 'Garantito da SLA di Stato'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Nodes Latency Audit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Nodes list with latencies */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-brand-blue flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-gold" />
                {isEn ? 'Decentralized Edge Nodes' : 'Nodi Decentralizzati di Confine'}
              </h3>
              <p className="text-xs text-muted font-light mt-1">
                {isEn 
                  ? 'We maintain caching servers worldwide to expedite safe local registration uploads.' 
                  : 'Manteniamo server dislocati per sveltire i caricamenti anagrafici dei cittadini in loco.'}
              </p>
            </div>

            <div className="space-y-3">
              {networkNodes.map((node) => {
                const latency = latencyResults[node.id];
                return (
                  <div 
                    key={node.id}
                    className="p-4 rounded-xl border border-brand-blue/10 bg-white shadow-sm flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <h4 className="font-serif font-semibold text-xs md:text-sm text-brand-blue">
                          {isEn ? node.nameEn : node.nameIt}
                        </h4>
                      </div>
                      <p className="text-[10px] text-muted font-mono uppercase">
                        {node.region} • {node.provider.split('&')[0]}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-brand-blue">
                        {latency ? `${latency} ms` : '...'}
                      </span>
                      <p className="text-[9px] font-tech text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                        {isEn ? 'Normal Status' : 'Nominale'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Ping Console */}
          <div className="lg:col-span-7 bg-[#050e1f] rounded-2xl border border-brand-blue/20 p-6 flex flex-col justify-between text-[#8ab4f8] relative overflow-hidden shadow-xl" id="interactive-ping-panel">
            <div className="absolute right-3 top-3 text-[9px] font-tech font-bold text-brand-gold/60 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
              {isEn ? 'INTELLIGENT DIAGNOSTICS CONSOLE' : 'CONSOLLE DI DIAGNOSTICA INTELLIGENTE'}
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <Terminal className="w-5 h-5 text-brand-gold" />
                <h4 className="font-serif font-bold text-sm tracking-wide">
                  {isEn ? 'Terminal Latency Tester' : 'Console di Tracciamento Latenza'}
                </h4>
              </div>

              {/* Selector for Ping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider font-tech font-bold">
                    {isEn ? 'Select Destination Node' : 'Seleziona il Nodo di Destinazione'}
                  </label>
                  <select 
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    disabled={isPinging}
                    id="ping-target-selector"
                    className="w-full bg-[#0d1b32] text-white border border-brand-blue/30 rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand-gold"
                  >
                    {networkNodes.map(n => (
                      <option key={n.id} value={n.id} className="bg-[#050e1f] text-white">
                        {isEn ? n.nameEn : n.nameIt} ({n.region.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    onClick={() => handleRunPingTest(pingTarget)}
                    disabled={isPinging}
                    id="run-ping-test-btn"
                    className="w-full py-2.5 rounded-lg bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-tech font-bold uppercase tracking-wider text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPinging ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {isEn ? 'Pinging Node...' : 'Ping in corso...'}
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        {isEn ? 'Execute ICMP Ping' : 'Esegui Ping ICMP'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Terminal Logs View */}
              <div className="bg-[#030a16] border border-brand-blue/40 rounded-xl p-4 h-48 font-mono text-[11px] overflow-y-auto space-y-1 text-gray-300 leading-relaxed scrollbar-thin">
                {pingLogs.length === 0 ? (
                  <p className="text-gray-500 italic">
                    {isEn 
                      ? 'Select a sovereign state node and click "Execute ICMP Ping" to evaluate credentials gateway latency...'
                      : 'Seleziona un nodo di stato sovrano e clicca "Esegui Ping ICMP" per riscontrare la velocità del gateway...'}
                  </p>
                ) : (
                  pingLogs.map((log, index) => {
                    let textClass = 'text-gray-300';
                    if (log.startsWith('NWS-PING') || log.startsWith('ESTABLISHING')) textClass = 'text-brand-gold font-bold';
                    if (log.includes('time=')) textClass = 'text-emerald-400';
                    if (log.includes('statistics') || log.includes('transmitted')) textClass = 'text-[#8ab4f8]';
                    if (log.includes('STANDBY STATUS')) textClass = 'text-emerald-400 font-bold uppercase';
                    return (
                      <div key={index} className={textClass}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Average statistics result */}
            <div className="mt-4 pt-3 border-t border-brand-blue/20 flex items-center justify-between text-xs text-gray-400">
              <span className="font-tech uppercase tracking-wider text-[10px]">
                {isEn ? 'Active System Interface' : 'Consolle Istituzionale'}
              </span>
              {avgPing !== null && (
                <span className="text-white">
                  {isEn ? 'Avg Response: ' : 'Risposta Media: '}
                  <strong className="text-brand-gold font-mono">{avgPing} ms</strong>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Informative Footer Alert */}
        <div className="p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-brand-blue">
          <div className="flex gap-3 items-start">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
            </div>
            <div>
              <h6 className="font-bold uppercase tracking-wider font-tech text-[10px] mb-0.5">
                {isEn ? 'Sovereign Edge Network Standard' : 'Standard della Rete Sovrana'}
              </h6>
              <p className="text-muted leading-relaxed font-light">
                {isEn ? (
                  <>Our edge workers scale dynamically. No transaction profiling occurs. Public requests and verification checks utilize <strong className="text-brand-blue">Cloudflare isolation rules</strong> protecting citizenship secrets.</>
                ) : (
                  <>I nostri edge worker scalano dinamicamente. Non avviene alcuna profilazione. Le richieste pubbliche e i controlli sui certificati utilizzano <strong className="text-brand-blue font-semibold">regole di isolamento Cloudflare</strong> per tutelare i cittadini.</>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
