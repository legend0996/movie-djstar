import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, getImageUrl } from '../utils/format';

export default function MovieCard({ movie, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link
        to={`/movies/${movie.slug}`}
        className="group block relative rounded-2xl overflow-hidden bg-brand-card border border-white/5 hover:border-brand-primary/25 transition-all duration-500 hover:glow-red hover:-translate-y-1.5"
      >
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden bg-brand-surface">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={getImageUrl(movie.posterUrl)}
            alt={movie.title}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />

          {/* Gradient edge fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col items-center justify-end p-4 pb-6">
            <div className="flex gap-2 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
              <span
                className={`flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 ${
                  movie.isFree
                    ? 'bg-white/90 text-black hover:bg-white'
                    : 'bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/20'
                }`}
              >
                {movie.isFree ? 'Watch Free' : 'Buy Now'}
              </span>
              <button
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Add to wishlist"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
            <div className="flex flex-col gap-1">
              {movie.isFree && (
                <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-semibold backdrop-blur-sm">
                  Free
                </span>
              )}
              {movie.averageRating > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-brand-accent/15 text-brand-accent text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {movie.averageRating.toFixed(1)}
                </span>
              )}
            </div>
            {movie.quality && (
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-[10px] uppercase tracking-wider font-semibold backdrop-blur-sm border border-white/5">
                {movie.quality}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="font-heading font-semibold text-sm truncate text-white group-hover:text-brand-primary transition-colors duration-200">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2">
              {movie.releaseYear && (
                <span className="text-xs text-gray-500">{movie.releaseYear}</span>
              )}
              {movie.genre && (
                <>
                  <span className="text-gray-700 text-[8px]">&#9679;</span>
                  <span className="text-xs text-gray-500 truncate max-w-[80px]">{movie.genre}</span>
                </>
              )}
            </div>
            {movie.price > 0 && !movie.isFree ? (
              <span className="text-xs font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md">{formatCurrency(movie.price)}</span>
            ) : (
              <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md">Free</span>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary/0 via-brand-primary/50 to-brand-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </Link>
    </motion.div>
  );
}
