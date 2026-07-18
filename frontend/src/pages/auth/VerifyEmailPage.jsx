import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const [code, setCode] = useState(state?.code || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isVerified) navigate('/');
  }, [user, navigate]);

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/verify-email', { email: user?.email, code });
      if (data.data) updateUser(data.data);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    try {
      await client.post('/auth/resend-verification', { email: user?.email });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
    setResending(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading font-bold text-2xl text-white mb-2">Email Verified!</h2>
          <p className="text-gray-400">Redirecting you to the homepage...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-bg to-brand-bg">
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-primary/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-heading font-bold text-4xl text-white mb-3">Verify Your Email</h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              We've sent a verification code to your email. Enter it below to activate your account.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <span className="font-heading font-bold text-xl text-white">DJ<span className="text-brand-primary">Star</span></span>
          </div>

          <h1 className="font-heading font-bold text-3xl text-white mb-1">Verify Your Email</h1>
          <p className="text-gray-500 mb-2">
            Enter the 6-digit code sent to <strong className="text-white">{user?.email || 'your email'}</strong>
          </p>
          {state?.code && (
            <p className="text-brand-accent text-sm mb-6 font-mono bg-brand-card rounded-lg p-2 text-center">
              Dev mode — your code: <strong>{state.code}</strong>
            </p>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="label">Verification Code</label>
              <input
                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
            <button type="button" onClick={handleResend} disabled={resending} className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors">
              {resending ? 'Resending...' : "Didn't receive the code? Resend"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
