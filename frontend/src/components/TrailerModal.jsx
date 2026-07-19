import { useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/format';

export default function TrailerModal({ movie, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const trailerUrl = movie.trailerUrl || movie.movieUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl mx-4 bg-black rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {trailerUrl ? (
          <video
            ref={videoRef}
            src={trailerUrl}
            poster={getImageUrl(movie.posterUrl)}
            className="w-full max-h-[75vh]"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">No trailer available</p>
            <p className="text-sm">Watch the full movie after purchase</p>
          </div>
        )}

        <div className="p-4 bg-brand-surface">
          <h3 className="font-heading font-bold text-white text-lg">{movie.title} - Trailer</h3>
          {movie.duration && (
            <p className="text-sm text-gray-400 mt-1">Full movie: {formatDuration(movie.duration)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
