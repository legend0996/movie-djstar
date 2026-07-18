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
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/movies/${movie.slug}`}
        className="group block relative rounded-xl overflow-hidden bg-brand-card border border-brand-border/50 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-1"
      >
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden bg-brand-surface">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={getImageUrl(movie.posterUrl)}
            alt={movie.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-4 pb-6">
            <div className="flex gap-2 w-full pointer-events-none">
              <span
                className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
                  movie.isFree
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-brand-primary text-white hover:bg-brand-hover'
                }`}
              >
                {movie.isFree ? 'Watch Free' : 'Buy Now'}
              </span>
              <button
                className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
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
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
            <div className="flex flex-col gap-1">
              {movie.isFree && (
                <span className="badge badge-success text-[10px] uppercase tracking-wider font-semibold">
                  Free
                </span>
              )}
              {movie.isFeatured && (
                <span className="badge badge-warning text-[10px] uppercase tracking-wider font-semibold">
                  Featured
                </span>
              )}
            </div>
            {movie.quality && (
              <span className="badge badge-default text-[10px] uppercase tracking-wider font-semibold">
                {movie.quality}
              </span>
            )}
          </div>

          {/* Rating badge */}
          {movie.averageRating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-3.5 h-3.5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-white">{movie.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
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
              <span className="text-xs font-bold text-brand-primary">{formatCurrency(movie.price)}</span>
            ) : (
              <span className="text-xs font-bold text-green-400">Free</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
