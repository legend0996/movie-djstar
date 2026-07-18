import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch, usePost } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { formatDate, getStatusBadge } from '../../utils/format';

export default function TicketsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const { data, isLoading, refetch } = useFetch(['tickets', page], `/support?page=${page}&limit=20`);
  const { mutate: createTicket, isPending } = usePost('/support');

  function handleSubmit(e) {
    e.preventDefault();
    createTicket(newTicket, {
      onSuccess: () => {
        toast('Ticket created', 'success');
        setShowNew(false);
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        refetch();
      },
      onError: (err) => toast(err.response?.data?.message || 'Failed to create ticket', 'error'),
    });
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-white">Support Tickets</h1>
              <p className="text-gray-500 mt-1">Get help from our support team</p>
            </div>
            <button onClick={() => setShowNew(!showNew)} className="btn-primary">
              {showNew ? 'Cancel' : 'New Ticket'}
            </button>
          </div>

          {showNew && (
            <motion.form
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              onSubmit={handleSubmit}
              className="bg-brand-card rounded-xl border border-brand-border p-6 mb-8 space-y-4"
            >
              <div>
                <label className="label">Subject</label>
                <input className="input-field" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} required />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input-field" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input-field min-h-[120px]" value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} required />
              </div>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Creating...' : 'Submit Ticket'}
              </button>
            </motion.form>
          )}

          {isLoading ? (
            <Loader />
          ) : data?.data?.length === 0 ? (
            <EmptyState icon="ticket" title="No tickets yet" message="Create a support ticket and we'll get back to you" />
          ) : (
            <>
              <div className="space-y-3">
                {data?.data?.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/support/${ticket.id}`}
                    className="block bg-brand-card rounded-xl border border-brand-border p-5 hover:border-brand-primary/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white group-hover:text-brand-primary transition-colors">{ticket.subject}</h3>
                      <span className={getStatusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span className={`${ticket.priority === 'critical' ? 'text-red-400' : ticket.priority === 'high' ? 'text-orange-400' : 'text-gray-500'}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </Link>
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
