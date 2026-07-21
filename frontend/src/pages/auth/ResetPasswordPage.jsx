import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import client from '../../api/client';

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ email: '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/reset-password', {
        email: form.email,
        code: form.code,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-bg to-brand-bg">
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-primary/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-heading font-bold text-4xl text-white mb-3">Reset Your Password</h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Enter the verification code sent to your email and choose a new password.
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

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-heading font-bold text-2xl text-white mb-2">Password Reset!</h2>
              <p className="text-gray-400">Your password has been updated. Redirecting to login...</p>
            </motion.div>
          ) : (
            <>
              <h1 className="font-heading font-bold text-3xl text-white mb-1">Reset Password</h1>
              <p className="text-gray-500 mb-8">Enter the code from your email</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input name="email" type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Verification Code</label>
                  <input name="code" className="input-field text-center tracking-[0.5em] font-mono" placeholder="000000" maxLength={6} value={form.code} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input name="password" type="password" className="input-field" placeholder="Min. 8 characters with uppercase, lowercase, number & special char" value={form.password} onChange={handleChange} required />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input name="confirmPassword" type="password" className="input-field" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
                <p className="text-center text-sm text-gray-500">
                  <Link to="/forgot-password" className="text-brand-primary hover:text-brand-hover font-medium transition-colors">Request a new code</Link>
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
