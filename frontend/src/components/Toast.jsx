import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (msg, type = 'info') => {
        const event = new CustomEvent('app-toast', { detail: { message: msg, type } });
        window.dispatchEvent(event);
      },
    };
  }
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const handler = (e) => addToast(e.detail.message, e.detail.type);
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-up ${
              t.type === 'success' ? 'bg-green-800 text-green-100' :
              t.type === 'error' ? 'bg-red-800 text-red-100' :
              t.type === 'warning' ? 'bg-yellow-800 text-yellow-100' :
              'bg-gray-800 text-gray-100'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default function Toast() {
  return null;
}
