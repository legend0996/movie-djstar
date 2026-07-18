import { useState, useEffect } from 'react';
import client from '../api/client';
import { useToast } from './Toast';
import { formatCurrency } from '../utils/format';

// Phone number validation - Kenyan Safaricom numbers
const validatePhoneNumber = (phone) => {
  if (!phone) return { valid: false, message: 'Phone number is required' };
  
  const trimmed = phone.trim();
  
  // Check length
  if (trimmed.length < 10 || trimmed.length > 13) {
    return { valid: false, message: 'Phone number must be 10-13 characters' };
  }
  
  // Check format: must start with 0, 254, or +254 and then 1 or 7
  const patterns = [
    /^0[17]\d{8}$/,        // 0712345678 (10 chars)
    /^254[17]\d{8}$/,      // 254712345678 (12 chars)
    /^\+254[17]\d{8}$/,    // +254712345678 (13 chars)
  ];
  
  const isValid = patterns.some(pattern => pattern.test(trimmed));
  
  if (!isValid) {
    return { 
      valid: false, 
      message: 'Please enter a valid Safaricom number (e.g., 0712345678 or +254712345678)' 
    };
  }
  
  return { valid: true };
};

export default function PurchaseModal({ movie, onClose }) {
  const [phone, setPhone] = useState(movie.userPhone || '');
  const [step, setStep] = useState('input');
  const [error, setError] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (step === 'polling' && checkoutId) {
      let pollCount = 0;
      const maxPolls = 20; // 60 seconds / 3 seconds
      
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
        } catch (err) {
          pollCount++;
          if (pollCount >= maxPolls) {
            clearInterval(interval);
            setStep('failed');
            setError('Payment timeout. Please check your transaction status.');
          }
          // Otherwise retry on next interval
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [step, checkoutId, onClose, toast]);

  const handlePurchase = async () => {
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const normalized = normalizePhoneNumber(phone);
      const { data } = await client.post('/payments/purchase', {
        movieId: movie.id,
        phoneNumber: normalized,
      });
      
      setCheckoutId(data.data.checkoutRequestID);
      setStep('polling');
      toast('STK Push sent. Check your phone to complete payment.', 'info');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.details?.[0]?.message ||
                          'Failed to initiate payment. Please try again.';
      setError(errorMessage);
      setStep('input');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizePhoneNumber = (phone) => {
    const trimmed = phone.trim();
    
    // Starting with 0: replace with 254
    if (trimmed.startsWith('0')) {
      return '254' + trimmed.slice(1);
    }
    
    // Already in 254 format
    if (trimmed.startsWith('254')) {
      return trimmed;
    }
    
    // With +254 prefix: remove the +
    if (trimmed.startsWith('+254')) {
      return trimmed.slice(1);
    }
    
    // Fallback: shouldn't reach here if validation passed
    return trimmed;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {step === 'input' && (
          <>
            <h3 className="text-xl font-bold mb-2">Purchase Movie</h3>
            <p className="text-gray-400 mb-4">{movie.title} - {formatCurrency(movie.price)}</p>
            <div className="mb-4">
              <label className="label block mb-2">Phone Number</label>
              <input
                className="input-field w-full"
                placeholder="0712345678 or +254712345678"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Safaricom M-Pesa enabled number</p>
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex space-x-3">
              <button 
                onClick={onClose} 
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handlePurchase} 
                className="btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </>
        )}
        {step === 'polling' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Waiting for Payment</h3>
            <p className="text-gray-400 text-sm">STK Push sent. Please check your phone and enter your M-Pesa PIN.</p>
            <p className="text-gray-500 text-xs mt-3">Auto-refreshing every 3 seconds...</p>
          </div>
        )}
        {step === 'failed' && (
          <>
            <h3 className="text-xl font-bold mb-2 text-red-400">Payment Failed</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button onClick={onClose} className="btn-secondary flex-1">Close</button>
              <button 
                onClick={() => {
                  setStep('input');
                  setError('');
                }} 
                className="btn-primary flex-1"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
