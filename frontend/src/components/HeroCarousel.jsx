import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, getImageUrl } from '../utils/format';

export default function HeroCarousel({ movies, isLoading }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (movies?.length || 1));
  }, [movies]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + (movies?.length || 1)) % (movies?.length || 1));
  }, [movies]);

  useEffect(() => {
    if (!movies?.length) return;
    intervalRef.current = setInterval(next, 6000);
    return () => clearInterval(intervalRef.current);
  }, [movies, next]);

  const goTo = (i) => {
    setCurrent(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 6000);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[70vh] md:h-[85vh] skeleton rounded-none" />
    );
  }

  if (!movies?.length) return null;

  const movie = movies[current];

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-brand-bg">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(movie.coverUrl || movie.posterUrl)}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                {movie.genre && (
                  <span className="text-sm font-medium text-brand-primary uppercase tracking-wider">
                    {movie.genre}
                  </span>
                )}
                {movie.releaseYear && (
                  <span className="text-sm text-gray-400">{movie.releaseYear}</span>
                )}
                {movie.duration && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span className="text-sm text-gray-400">
                      {Math.floor(movie.duration / 60)} min
                    </span>
                  </>
                )}
                {movie.quality && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-brand-accent/30 text-brand-accent font-semibold uppercase tracking-wider">
                      {movie.quality}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-4 leading-tight">
                {movie.title}
              </h1>

              {movie.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-semibold">{movie.averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400 text-sm">{movie.viewCount?.toLocaleString() || 0} views</span>
                </div>
              )}

              <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-6 max-w-xl">
                {movie.description}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to={movie.isFree ? `/movies/${movie.slug}` : `/movies/${movie.slug}`}
                  className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-heading font-semibold py-3 px-6 md:py-4 md:px-8 rounded-lg transition-all duration-200 shadow-lg shadow-brand-primary/20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Now
                </Link>
                <Link
                  to={`/movies/${movie.slug}`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-heading font-medium py-3 px-6 md:py-4 md:px-8 rounded-lg backdrop-blur-sm transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  More Info
                </Link>
                {movie.price > 0 && !movie.isFree && (
                  <span className="text-sm text-gray-400">
                    From {formatCurrency(movie.price)}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Carousel indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-8 h-1.5 bg-brand-primary'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev/Next buttons */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 hover:opacity-100 focus:opacity-100"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all opacity-0 hover:opacity-100 focus:opacity-100"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
