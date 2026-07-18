import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { formatDate, formatCurrency, getStatusBadge, getImageUrl } from '../../utils/format';

const tabs = [
  { label: 'My Library', to: '/my-library' },
  { label: 'Purchases', to: '/purchases' },
  { label: 'Receipts', to: '/receipts' },
];

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const { data, isLoading } = useFetch(['purchases', page], `/payments/history?page=${page}&limit=20`);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Purchase History</h1>
          <p className="text-gray-500 mb-6">Your transaction records</p>

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
            <EmptyState icon="library" title="No purchases yet" message="Movies you purchase will appear here" actionLabel="Browse Movies" actionTo="/movies" />
          ) : (
            <>
              <div className="space-y-3">
                {data?.data?.map((purchase) => (
                  <motion.div key={purchase.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card rounded-xl border border-brand-border p-4 flex items-center gap-4 hover:border-brand-primary/30 transition-all duration-200">
                    {purchase.movie?.posterUrl && (
                      <img src={getImageUrl(purchase.movie.posterUrl)} alt="" className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{purchase.movie?.title || 'Movie'}</p>
                      <p className="text-sm text-gray-500">{formatDate(purchase.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-brand-primary">{formatCurrency(purchase.amount)}</p>
                      <span className={getStatusBadge(purchase.status)}>{purchase.status}</span>
                    </div>
                  </motion.div>
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
