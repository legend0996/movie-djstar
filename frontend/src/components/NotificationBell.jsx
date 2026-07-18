import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { formatDateTime } from '../utils/format';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchUnread() {
    try {
      const { data } = await client.get('/notifications/unread-count');
      setUnread(data.data.unreadCount);
    } catch { /* ignore */ }
  }

  async function toggleDropdown() {
    setOpen(!open);
    if (!open && !notifications.length) {
      setLoading(true);
      try {
        const { data } = await client.get('/notifications?limit=10');
        setNotifications(data.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleDropdown} className="relative p-2 text-gray-400 hover:text-white transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                className="text-xs text-indigo-400 hover:text-indigo-300"
                onClick={async () => {
                  await client.put('/notifications/read-all');
                  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  setUnread(0);
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${!n.isRead ? 'bg-gray-800/50' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
