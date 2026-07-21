import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const email = state?.email || '';
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputsRef = useRef([]);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isVerified) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const focusNext = useCallback((i) => {
    if (i < 5) inputsRef.current[i + 1]?.focus();
  }, []);

  const focusPrev = useCallback((i) => {
    if (i > 0) inputsRef.current[i - 1]?.focus();
  }, []);

  function handleChange(i, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    setError('');
    if (value) focusNext(i);
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i]) focusPrev(i);
    if (e.key === 'ArrowLeft') focusPrev(i);
    if (e.key === 'ArrowRight') focusNext(i);
  }

  function handlePaste(e) {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    for (let j = 0; j < data.length; j++) next[j] = data[j];
    setDigits(next);
    inputsRef.current[Math.min(data.length, 5)]?.focus();
  }

  async function handleVerify(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/verify-email', { email, code });
      if (data.data) updateUser(data.data);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      inputsRef.current[0]?.focus();
    }
    setLoading(false);
  }

  async function handleResend() {
    setCooldown(RESEND_COOLDOWN);
    try {
      await client.post('/auth/resend-verification', { email });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
      setCooldown(0);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg bg-noise">
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
    <div className="min-h-screen flex bg-brand-bg bg-noise">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-primary/15 via-brand-bg to-brand-bg">
        <div className="absolute inset-0 hero-gradient" />
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
          <p className="text-gray-500 mb-6">
            Enter the 6-digit code sent to <strong className="text-white">{email || 'your email'}</strong>
          </p>
          {state?.code && (
            <p className="text-brand-accent text-sm mb-6 font-mono bg-brand-card rounded-lg p-2 text-center">
              Dev mode — your code: <strong>{state.code}</strong>
            </p>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="label text-center w-full mb-3">Verification Code</label>
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono bg-white/5 border border-brand-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200"
                    required
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-3">
                {error}
              </motion.p>
            )}
            <button type="submit" disabled={loading || digits.join('').length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
            <button type="button" onClick={handleResend} disabled={cooldown > 0} className="w-full text-center text-sm text-gray-400 hover:text-white disabled:hover:text-gray-400 transition-colors disabled:cursor-not-allowed">
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Didn't receive the code? Resend"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
