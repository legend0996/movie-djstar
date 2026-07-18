import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import MovieCard from '../../components/MovieCard';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';

const tabs = [
  { label: 'My Library', to: '/my-library' },
  { label: 'Purchases', to: '/purchases' },
  { label: 'Receipts', to: '/receipts' },
];

export default function MyLibraryPage() {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const { data, isLoading } = useFetch(['library', page], `/movies/library/list?page=${page}&limit=20`);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">My Library</h1>
          <p className="text-gray-500 mb-6">Your purchased and saved movies</p>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl w-fit">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {isLoading ? (
            <Loader />
          ) : data?.data?.length === 0 ? (
            <EmptyState
              icon="library"
              title="Your library is empty"
              message="Movies you purchase or add to your library will appear here"
              actionLabel="Browse Movies"
              actionTo="/movies"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {data?.data?.map((item) => (
                  <MovieCard key={item.id} movie={item.movie || item} />
                ))}
              </div>
              <div className="mt-8">
                <Pagination pagination={data?.pagination} onPageChange={setPage} />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
