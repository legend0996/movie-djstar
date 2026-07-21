import { useState } from 'react';
import { useFetch } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatDate, getStatusBadge } from '../../utils/format';
import client from '../../api/client';

const filters = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminSupport() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('open');
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const { data, isLoading, refetch } = useFetch(['admin-tickets', page, filter], `/admin/support/tickets?page=${page}&limit=20&status=${filter}`);

  async function handleStatus(ticketId, status) {
    try {
      await client.put(`/admin/support/tickets/${ticketId}/status`, { status });
      toast(`Ticket ${status}`, 'success');
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
  }

  async function handleReply(ticketId) {
    if (!replyMessage.trim()) return;
    setReplying(true);
    try {
      await client.post(`/admin/support/tickets/${ticketId}/reply`, { message: replyMessage });
      toast('Reply sent', 'success');
      setReplyMessage('');
      setReplyOpen(null);
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send reply', 'error');
    }
    setReplying(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">Manage customer support requests</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16 bg-brand-card rounded-xl border border-brand-border">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="text-gray-500">No {filter.replace('_', ' ')} tickets</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data?.map((ticket) => (
              <div key={ticket.id} className="bg-brand-card rounded-xl border border-brand-border p-5 hover:border-brand-primary/30 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                  <button onClick={() => setReplyOpen(replyOpen === ticket.id ? null : ticket.id)} className="font-semibold text-white hover:text-brand-primary transition-colors text-left">
                    {ticket.subject}
                  </button>
                  <span className={getStatusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-bold">
                      {ticket.user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span>{ticket.user?.username}</span>
                    <span>·</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    {(ticket.priority === 'critical' || ticket.priority === 'high') && (
                      <>
                        <span>·</span>
                        <span className={ticket.priority === 'critical' ? 'text-red-400' : 'text-orange-400'}>{ticket.priority}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === 'open' && (
                      <button onClick={() => handleStatus(ticket.id, 'in_progress')} className="text-xs text-brand-primary hover:text-brand-hover font-medium transition-colors">
                        Take
                      </button>
                    )}
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <>
                        <button onClick={() => handleStatus(ticket.id, 'resolved')} className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">Resolve</button>
                        <button onClick={() => handleStatus(ticket.id, 'closed')} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Close</button>
                      </>
                    )}
                  </div>
                </div>
                {replyOpen === ticket.id && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <textarea
                      className="input-field min-h-[80px] mb-3"
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(ticket.id)} disabled={replying || !replyMessage.trim()} className="btn-primary text-sm">
                        {replying ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button onClick={() => { setReplyOpen(null); setReplyMessage(''); }} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Pagination pagination={data?.pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
