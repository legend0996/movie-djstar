import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/format';

const tabs = [
  { label: 'My Library', to: '/my-library' },
  { label: 'Purchases', to: '/purchases' },
  { label: 'Receipts', to: '/receipts' },
];

export default function ReceiptsPage() {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const { data, isLoading } = useFetch(['receipts', page], `/payments/receipts?page=${page}&limit=20`);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Receipts</h1>
          <p className="text-gray-500 mb-6">Payment receipts and invoices</p>

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
            <EmptyState icon="library" title="No receipts found" message="Payment receipts will appear here after a successful purchase" />
          ) : (
            <>
              <div className="space-y-3">
                {data?.data?.map((receipt) => (
                  <motion.div key={receipt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card rounded-xl border border-brand-border p-5 hover:border-brand-primary/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Receipt #{receipt.receiptNumber}</p>
                        <p className="text-sm text-gray-500">{formatDate(receipt.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-brand-border">
                      <span className="text-gray-400">{receipt.receiptData?.movieTitle || 'Movie purchase'}</span>
                      <span className="font-bold text-white">{formatCurrency(receipt.receiptData?.amount)}</span>
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
