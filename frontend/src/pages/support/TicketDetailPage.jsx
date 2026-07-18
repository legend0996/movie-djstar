import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch, usePut } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, getStatusBadge } from '../../utils/format';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const { data, isLoading, refetch } = useFetch(['ticket', id], `/support/${id}`);
  const { mutate: updateTicket, isPending } = usePut(`/support/${id}`);

  function handleReply(e) {
    e.preventDefault();
    updateTicket({ message: reply }, {
      onSuccess: () => {
        toast('Reply sent', 'success');
        setReply('');
        refetch();
      },
      onError: (err) => toast(err.response?.data?.message || 'Failed to send reply', 'error'),
    });
  }

  function handleStatusChange(status) {
    updateTicket({ status }, {
      onSuccess: () => { toast(`Ticket ${status}`, 'success'); refetch(); },
      onError: (err) => toast(err.response?.data?.message || 'Failed to update ticket', 'error'),
    });
  }

  if (isLoading) return <Loader fullPage />;
  if (!data?.data) return (
    <div className="min-h-screen bg-brand-bg pt-24">
      <EmptyState icon="ticket" title="Ticket not found" message="This ticket may have been removed" actionLabel="Back to Tickets" actionTo="/support" />
    </div>
  );

  const ticket = data.data;
  const isStaff = user?.role === 'movie_owner' || user?.role === 'developer';

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Link to="/support" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tickets
          </Link>

          <div className="bg-brand-card rounded-xl border border-brand-border p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="font-heading text-2xl font-bold text-white">{ticket.subject}</h1>
              <span className={getStatusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-5">
              <span>{formatDateTime(ticket.createdAt)}</span>
              <span className={`${ticket.priority === 'critical' ? 'text-red-400' : ticket.priority === 'high' ? 'text-orange-400' : 'text-gray-500'}`}>
                {ticket.priority}
              </span>
            </div>

            {/* Original message */}
            <div className="p-4 bg-white/5 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold">
                  {ticket.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-white">{ticket.user?.username || 'You'}</span>
              </div>
              <p className="text-gray-300">{ticket.message}</p>
            </div>

            {/* Replies */}
            {ticket.replies?.map((r) => (
              <div key={r.id} className="p-4 bg-white/5 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r.isStaff ? 'bg-brand-primary' : 'bg-gray-600'}`}>
                    {r.user?.username?.[0]?.toUpperCase() || (r.isStaff ? 'S' : 'U')}
                  </div>
                  <span className="text-sm font-medium text-white">{r.user?.username || (r.isStaff ? 'Support Staff' : 'User')}</span>
                  {r.isStaff && <span className="badge badge-default text-[10px]">Staff</span>}
                </div>
                <p className="text-gray-300">{r.message}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDateTime(r.createdAt)}</p>
              </div>
            ))}
          </div>

          {/* Reply form */}
          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h3 className="font-heading font-bold text-lg text-white mb-4">Add Reply</h3>
              <form onSubmit={handleReply} className="space-y-4">
                <textarea
                  className="input-field min-h-[100px]"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  required
                />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={isPending} className="btn-primary">
                    {isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                  {isStaff && (
                    <>
                      <button type="button" onClick={() => handleStatusChange('in_progress')} className="btn-secondary">Mark In Progress</button>
                      <button type="button" onClick={() => handleStatusChange('resolved')} className="btn-secondary">Resolve</button>
                      <button type="button" onClick={() => handleStatusChange('closed')} className="btn-danger">Close</button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}

          {ticket.status === 'closed' && (
            <div className="text-center py-8">
              <p className="text-gray-500">This ticket is closed.</p>
              {isStaff && (
                <button type="button" onClick={() => handleStatusChange('open')} className="btn-secondary mt-3">Reopen</button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
