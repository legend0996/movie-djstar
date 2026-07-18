import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFetch } from '../hooks/useApi';
import { getImageUrl } from '../utils/format';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const { data, isLoading } = useFetch(
    ['search', query],
    query ? `/movies/search?q=${encodeURIComponent(query)}&limit=8` : null,
    { enabled: query.length > 0 }
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const results = data?.data || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60]"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-2xl mx-auto mt-20 px-4"
          >
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden shadow-2xl shadow-black/40">
              {/* Search input */}
              <div className="flex items-center gap-3 p-4 border-b border-brand-border">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies by title, genre, actor..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-500 bg-white/5 rounded border border-brand-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading && (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-12 h-16 skeleton rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 skeleton w-2/3" />
                          <div className="h-2.5 skeleton w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && query && results.length === 0 && (
                  <div className="p-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500">No results found for "{query}"</p>
                    <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
                  </div>
                )}

                {!isLoading && !query && (
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-3">Trending searches</p>
                    <div className="flex flex-wrap gap-2">
                      {['Action', 'Comedy', 'Free', '4K', 'Nairobi', 'Animation'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <div className="p-2">
                    {results.map((movie) => (
                      <Link
                        key={movie.id}
                        to={`/movies/${movie.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <img
                          src={getImageUrl(movie.posterUrl)}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-brand-primary transition-colors truncate">
                            {movie.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {movie.releaseYear && <span>{movie.releaseYear}</span>}
                            {movie.genre && <><span>&#183;</span><span>{movie.genre}</span></>}
                            {movie.quality && <><span>&#183;</span><span>{movie.quality}</span></>}
                          </div>
                        </div>
                        {movie.averageRating > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <svg className="w-3.5 h-3.5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-gray-400">{movie.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
