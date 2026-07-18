import { useState, useEffect } from 'react';
import client from '../api/client';
import { useToast } from './Toast';
import { formatCurrency } from '../utils/format';

export default function PurchaseModal({ movie, onClose }) {
  const [phone, setPhone] = useState(movie.userPhone || '');
  const [step, setStep] = useState('input');
  const [error, setError] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (step === 'polling' && checkoutId) {
      const interval = setInterval(async () => {
        try {
          const { data } = await client.get(`/payments/status/${checkoutId}`);
          if (data.data.status === 'successful') {
            clearInterval(interval);
            toast('Purchase successful! Redirecting...', 'success');
            setTimeout(() => { onClose(); window.location.href = '/my-library'; }, 1500);
          } else if (data.data.status === 'failed') {
            clearInterval(interval);
            setStep('failed');
            setError(data.data.message || 'Payment failed. Please try again.');
          }
        } catch { /* retry */ }
      }, 3000);
      setTimeout(() => {
        clearInterval(interval);
        setStep('failed');
        setError('Payment timed out. Please try again.');
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [step, checkoutId, onClose, toast]);

  const handlePurchase = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid Safaricom phone number');
      return;
    }
    setError('');
    try {
      const { data } = await client.post('/payments/purchase', {
        movieId: movie.id,
        phoneNumber: phone,
      });
      setCheckoutId(data.data.checkoutRequestID);
      setStep('polling');
      toast('STK Push sent. Check your phone to complete payment.', 'info');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {step === 'input' && (
          <>
            <h3 className="text-xl font-bold mb-2">Purchase Movie</h3>
            <p className="text-gray-400 mb-4">{movie.title} - {formatCurrency(movie.price)}</p>
            <input
              className="input-field mb-4"
              placeholder="Safaricom number (e.g. 0712345678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex space-x-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handlePurchase} className="btn-primary flex-1">Pay Now</button>
            </div>
          </>
        )}
        {step === 'polling' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Waiting for Payment</h3>
            <p className="text-gray-400 text-sm">STK Push sent. Please check your phone and enter your M-Pesa PIN.</p>
          </div>
        )}
        {step === 'failed' && (
          <>
            <h3 className="text-xl font-bold mb-2 text-red-400">Payment Failed</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button onClick={onClose} className="btn-secondary flex-1">Close</button>
              <button onClick={() => setStep('input')} className="btn-primary flex-1">Try Again</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
