import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';

export default function MovieRow({ title, subtitle, viewAllLink, movies, isLoading }) {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkArrows, { passive: true });
    checkArrows();
    return () => el.removeEventListener('scroll', checkArrows);
  }, [checkArrows, movies]);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="relative group/row">
      <div className="section-header">
        <div>
          <h2 className="section-title text-gradient-brand">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && movies?.length > 0 && (
          <Link
            to={viewAllLink}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1 group/link"
          >
            View All
            <svg className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Left arrow - always visible on mobile/touch */}
        {showLeftArrow && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-brand-bg to-transparent flex items-center justify-start pl-2 opacity-100 lg:opacity-0 lg:group-hover/row:opacity-100 transition-opacity duration-300"
            aria-label="Scroll left"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Right arrow - always visible on mobile/touch */}
        {showRightArrow && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-brand-bg to-transparent flex items-center justify-end pr-2 opacity-100 lg:opacity-0 lg:group-hover/row:opacity-100 transition-opacity duration-300"
            aria-label="Scroll right"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}

        {/* Movie row */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 scroll-smooth"
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                  <div className="aspect-[2/3] skeleton rounded-xl" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 skeleton w-3/4" />
                    <div className="h-2.5 skeleton w-1/2" />
                  </div>
                </div>
              ))
            : movies?.map((movie, i) => (
                <div key={movie.id} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]">
                  <MovieCard movie={movie} index={i} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
