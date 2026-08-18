import React, { useState } from 'react';
import { 
  searchArticleMedia, 
  MediaSearchResult, 
  MediaSearchDebugInfo 
} from '../../services/newsService';
import { 
  X, 
  Bug, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Play, 
  Search, 
  Clock, 
  Sparkles, 
  Globe, 
  Image as ImageIcon,
  Check,
  Code
} from 'lucide-react';
import { VideoPreviewModal } from './VideoPreviewModal';

interface MediaDebuggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onAttachMedia?: (item: MediaSearchResult) => void;
}

export const MediaDebuggerModal: React.FC<MediaDebuggerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = 'roma',
  onAttachMedia
}) => {
  const [query, setQuery] = useState(initialQuery || 'roma');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<MediaSearchDebugInfo | null>(null);
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [selectedItemForJson, setSelectedItemForJson] = useState<MediaSearchResult | null>(null);
  const [previewingVideo, setPreviewingVideo] = useState<{ url: string; title: string; sourceUrl?: string } | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnostic = async (overrideQuery?: string, overridePlatform?: string) => {
    const q = (overrideQuery || query).trim();
    const plat = overridePlatform || selectedPlatform;

    if (!q) {
      setErrorMessage('Inserisci un termine o parola chiave per la ricerca.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { results: items, debug } = await searchArticleMedia(q, plat);
      setResults(items || []);
      if (debug) setDebugInfo(debug);
    } catch (err: any) {
      console.error('[DEBUGGER-RUN-ERR]', err);
      setErrorMessage(err.message || 'Errore durante l\'esecuzione del test diagnostico.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLogs = () => {
    if (!debugInfo?.logs) return;
    const fullReport = `=== REPORT DIAGNOSTICO MEDIA NEW WORLD STATE ===
Data: ${debugInfo.timestamp}
Query: "${debugInfo.query}"
Piattaforma: ${debugInfo.platform}
Tempo Totale: ${debugInfo.totalTimeMs}ms
Risultati Restituiti: ${debugInfo.totalResultsCount}

--- PROVIDERS ---
${debugInfo.providers.map(p => `[${p.name}] Status: ${p.status} | Count: ${p.count} | Latency: ${p.latencyMs}ms ${p.error ? '| Error: ' + p.error : ''}`).join('\n')}

--- TRACCIAMENTO LOG ---
${debugInfo.logs.join('\n')}
`;

    navigator.clipboard.writeText(fullReport);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 3000);
  };

  const presets = ['roma', 'colosseo', 'geopolitica', 'tecnologia', 'natura', 'pace'];

  const providerIcons: Record<string, string> = {
    unsplash: '📷 Unsplash',
    pexels: '🖼️ Pexels',
    pixabay: '🎨 Pixabay',
    wikimedia: '🌐 Wikimedia',
    flickr: '📸 Flickr',
    youtube: '▶️ YouTube'
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#0b132b] border border-sky-500/40 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 border-b border-sky-500/30 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 border border-sky-400/40 rounded-2xl text-sky-300">
              <Bug className="w-6 h-6 animate-pulse text-sky-400" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-sky-300 flex items-center gap-2">
                <span>Console Diagnostica & Debugger API Media</span>
                <span className="text-[10px] font-mono bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full">
                  v2.5 Live
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Strumento di ispezione diretta e verifica in tempo reale delle 6 piattaforme multimediali.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 font-sans">
          {/* Controls & Search Bar */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunDiagnostic()}
                  placeholder="Inserisci termine di test (es. roma, colosseo, tecnologia)..."
                  className="w-full bg-black/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunDiagnostic()}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Test in corso...' : 'Esegui Diagnostic Test'}</span>
                </button>
              </div>
            </div>

            {/* Presets & Platform Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">Preset Veloci:</span>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setQuery(p);
                      handleRunDiagnostic(p, selectedPlatform);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer border ${
                      query.toLowerCase() === p
                        ? 'bg-amber-400 text-[#0a1c3e] border-amber-300 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    #{p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">Filtro Canale:</span>
                {['all', 'unsplash', 'pexels', 'pixabay', 'wikimedia', 'flickr', 'youtube'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(plat);
                      handleRunDiagnostic(query, plat);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] uppercase font-bold transition cursor-pointer border ${
                      selectedPlatform === plat
                        ? 'bg-sky-500 text-white border-sky-300 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {plat === 'all' ? 'TUTTI (6)' : plat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-xl flex items-center gap-2.5 shadow">
              <XCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 6 Providers Matrix */}
          {debugInfo?.providers && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-sky-300 border-b border-sky-500/20 pb-2">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  Stato dei 6 Provider In Tempo Reale (Chiamata Simultanea):
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Latenza Totale Server: <strong className="text-emerald-300">{debugInfo.totalTimeMs || 0}ms</strong> | Elementi: <strong className="text-purple-300">{results.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {debugInfo.providers.map((p, idx) => {
                  const isOk = p.status.includes('200') || p.status.toLowerCase().includes('ok');
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 shadow-inner transition ${
                        isOk
                          ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-100'
                          : 'bg-red-950/50 border-red-500/50 text-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm flex items-center gap-1.5">
                          {providerIcons[p.platform] || p.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isOk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      {p.endpoint && (
                        <div className="text-[10px] font-mono text-slate-400 bg-black/50 px-2 py-1 rounded truncate border border-slate-800">
                          {p.endpoint}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 font-mono">
                        <span>Elementi Trovati: <strong className="text-amber-300">{p.count}</strong></span>
                        <span>Latenza: <strong className="text-sky-300">{p.latencyMs}ms</strong></span>
                      </div>

                      {p.details && (
                        <p className="text-[10px] text-slate-300 italic bg-black/30 p-1.5 rounded border border-white/5 line-clamp-2">
                          {p.details}
                        </p>
                      )}

                      {p.error && (
                        <p className="text-[10px] text-red-300 bg-red-900/40 p-1.5 rounded border border-red-500/30 line-clamp-2 font-mono">
                          Err: {p.error}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRunDiagnostic(query, p.platform)}
                        className="w-full mt-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-sky-300 font-bold border border-sky-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Isola & Testa Solo {p.platform.toUpperCase()}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Console Logs Terminal */}
          {debugInfo?.logs && debugInfo.logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-sky-300">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Terminal di Tracciamento Log Server (Passo-Passo):
                </span>
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-bold border border-sky-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLogs ? 'Report Copiato!' : 'Copia Report Diagnostico'}</span>
                </button>
              </div>

              <div className="bg-black/90 border border-slate-800 rounded-xl p-3.5 max-h-52 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300 leading-relaxed shadow-inner">
                {debugInfo.logs.map((logLine, lIdx) => {
                  let textColor = 'text-slate-300';
                  if (logLine.includes('✅')) textColor = 'text-emerald-300 font-bold';
                  else if (logLine.includes('❌') || logLine.includes('💥')) textColor = 'text-red-300 font-bold';
                  else if (logLine.includes('📡')) textColor = 'text-sky-300';
                  else if (logLine.includes('🤖') || logLine.includes('✨')) textColor = 'text-purple-300';
                  else if (logLine.includes('🔍') || logLine.includes('📋')) textColor = 'text-amber-300';
                  else if (logLine.includes('⚠️')) textColor = 'text-yellow-300';

                  return (
                    <div key={lIdx} className={`${textColor} whitespace-pre-wrap break-all`}>
                      {logLine}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Visual & Link Inspector */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Risultati Estratti per "{query}" ({results.length}):</span>
                <span className="text-[11px] text-amber-300 font-mono">
                  Clicca su "Apri Sorgente Live" per verificare la pagina originale del provider
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {results.map((item) => {
                  const isVideo = item.type === 'video' || item.sourcePlatform === 'youtube';
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden hover:border-sky-400 transition flex flex-col justify-between"
                    >
                      <div 
                        className={`relative aspect-video bg-black/60 overflow-hidden ${isVideo ? 'cursor-pointer group' : ''}`}
                        onClick={() => {
                          if (isVideo) {
                            setPreviewingVideo({
                              url: item.url,
                              title: item.title,
                              sourceUrl: item.sourceUrl
                            });
                          }
                        }}
                      >
                        <img
                          src={item.previewUrl || item.url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (item.url && target.src !== item.url) {
                              target.src = item.url;
                            } else {
                              target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80';
                            }
                          }}
                        />
                        <span className="absolute top-1.5 left-1.5 bg-slate-950/80 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/20">
                          {item.sourcePlatform}
                        </span>

                        {isVideo && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                            <div className="p-2 bg-red-600/90 text-white rounded-full shadow-lg group-hover:scale-110 transition">
                              <Play className="w-4 h-4 fill-current" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-[11px] font-bold text-white line-clamp-2 leading-snug" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-[9.5px] text-slate-400 mt-1 truncate">
                            Autore: {item.author || 'Fotografo Indipendente'}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {isVideo ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewingVideo({
                                    url: item.url,
                                    title: item.title,
                                    sourceUrl: item.sourceUrl
                                  });
                                }}
                                className="w-full py-1 px-2 rounded text-[10px] font-bold text-white bg-red-600/80 hover:bg-red-600 border border-red-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>▶️ Anteprima Video Live</span>
                              </button>

                              <a
                                href={item.sourceUrl || item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-0.5 px-2 rounded text-[9.5px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-1 cursor-pointer truncate"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">Apri su YouTube ↗</span>
                              </a>
                            </>
                          ) : (
                            <a
                              href={item.sourceUrl || item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1 px-2 rounded text-[10px] font-bold text-sky-300 hover:text-white bg-slate-800 hover:bg-sky-600 border border-sky-500/30 transition flex items-center justify-center gap-1 cursor-pointer truncate"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">Apri Foto Originale ↗</span>
                            </a>
                          )}

                          {onAttachMedia && (
                            <button
                              type="button"
                              onClick={() => {
                                onAttachMedia(item);
                                alert(`Media "${item.title}" allegato all'articolo!`);
                              }}
                              className="w-full py-1 rounded bg-amber-400 hover:bg-white text-[#0a1c3e] font-bold text-[10px] uppercase transition cursor-pointer"
                            >
                              + Allega ad Articolo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* In-App Video Preview Modal */}
        <VideoPreviewModal
          isOpen={!!previewingVideo}
          onClose={() => setPreviewingVideo(null)}
          videoUrl={previewingVideo?.url || null}
          videoTitle={previewingVideo?.title}
          sourceUrl={previewingVideo?.sourceUrl}
          onAttach={
            previewingVideo && onAttachMedia
              ? () => {
                  const matched = results.find(r => r.url === previewingVideo.url);
                  if (matched) onAttachMedia(matched);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};
