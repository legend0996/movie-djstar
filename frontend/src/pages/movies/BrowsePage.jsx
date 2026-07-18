import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import MovieCard from '../../components/MovieCard';
import CategoryTabs from '../../components/CategoryTabs';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'title_asc', label: 'Title: A-Z' },
  { value: 'title_desc', label: 'Title: Z-A' },
  { value: 'oldest', label: 'Oldest' },
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');

  const query = new URLSearchParams({
    page, limit: 20, sort,
    ...(search && { q: search }),
    ...(genre && { genre }),
  }).toString();

  const { data, isLoading } = useFetch(['browse', page, sort, search, genre], `/movies?${query}`);

  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (page > 1) params.page = page;
    if (sort !== 'newest') params.sort = sort;
    if (genre) params.genre = genre;
    setSearchParams(params, { replace: true });
  }, [page, sort, search, genre, setSearchParams]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title text-white mb-2">Browse Movies</h1>
          <p className="text-gray-500">Discover our collection of premium films</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="input-field pl-10"
                  placeholder="Search movies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
            <select
              className="input-field w-full sm:w-44"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category pills */}
          <CategoryTabs selected={genre} onSelect={(s) => { setGenre(s); setPage(1); }} />
        </div>

        {/* Results */}
        {isLoading ? (
          <Loader />
        ) : data?.data?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon="search"
              title="No movies found"
              message={search || genre ? "Try adjusting your search or filters" : "No movies have been added yet"}
            />
            {(search || genre) && (
              <div className="text-center -mt-4">
                <button
                  onClick={() => { setSearch(''); setGenre(''); setPage(1); }}
                  className="text-brand-primary hover:text-brand-hover text-sm transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing {data?.data?.length || 0} of {data?.pagination?.total || 0} results
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {data?.data?.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination pagination={data?.pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
