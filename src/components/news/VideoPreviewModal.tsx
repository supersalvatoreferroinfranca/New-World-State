import React from 'react';
import { X, ExternalLink, Play, Check, ShieldCheck, Film } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  videoTitle?: string;
  sourceUrl?: string;
  onAttach?: () => void;
  isAttached?: boolean;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle,
  sourceUrl,
  onAttach,
  isAttached
}) => {
  const { tText } = useI18n();

  if (!isOpen || !videoUrl) return null;

  // Extract YouTube ID or format embed URL
  let embedUrl = videoUrl;
  let directWatchUrl = sourceUrl || videoUrl;

  if (videoUrl.includes('youtube.com/watch?v=')) {
    const id = videoUrl.split('v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    directWatchUrl = `https://www.youtube.com/watch?v=${id}`;
  } else if (videoUrl.includes('youtu.be/')) {
    const id = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    directWatchUrl = `https://www.youtube.com/watch?v=${id}`;
  } else if (videoUrl.includes('youtube.com/embed/')) {
    const id = videoUrl.split('youtube.com/embed/')[1]?.split('?')[0];
    embedUrl = `${videoUrl}?autoplay=1&rel=0&modestbranding=1`;
    directWatchUrl = `https://www.youtube.com/watch?v=${id}`;
  } else if (videoUrl.includes('vimeo.com/')) {
    const id = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1`;
    directWatchUrl = `https://vimeo.com/${id}`;
  }

  const isEmbeddable = embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com');

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-[#0a1c3e] border border-brand-gold/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900/90 border-b border-brand-gold/30 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="font-serif font-bold text-sm md:text-base text-brand-gold truncate">
                {videoTitle || tText('Video Player & Preview', 'Riproduzione & Anteprima Video')}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {tText('Direct in-browser stream preview', 'Anteprima di streaming integrata ad alta risoluzione')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="p-4 md:p-6 bg-black flex-1 flex flex-col items-center justify-center">
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
            {isEmbeddable ? (
              <iframe
                src={embedUrl}
                title={videoTitle || 'Video Preview'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Il tuo browser non supporta la riproduzione diretta del file video.
              </video>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={directWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{tText('Open on YouTube ↗', 'Guarda su YouTube Ufficiale ↗')}</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {onAttach && (
              <button
                type="button"
                onClick={() => {
                  onAttach();
                  onClose();
                }}
                disabled={isAttached}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border shadow ${
                  isAttached
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                    : 'bg-brand-gold hover:bg-white text-[#0a1c3e] border-brand-gold'
                }`}
              >
                {isAttached ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{tText('Already Attached', 'Già Allegato')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-[#0a1c3e]" />
                    <span>{tText('Attach Video to Article', 'Allega Video all\'Articolo')}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              {tText('Close', 'Chiudi')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
