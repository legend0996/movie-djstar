import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.password,
      });
      navigate('/verify-email', {
        state: { email: form.email, code: data.data.verificationCode },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Left - Artwork */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-bg to-brand-bg">
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-primary/30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h2 className="font-heading font-bold text-4xl text-white mb-3">Start Watching</h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Join thousands of movie lovers. Create your account and start streaming instantly.
            </p>
            <div className="mt-12 space-y-4 max-w-sm mx-auto">
              {['Unlimited streaming', 'No ads', 'Watch offline', 'Cancel anytime'].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-left">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
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

          <h1 className="font-heading font-bold text-3xl text-white mb-1">Create Account</h1>
          <p className="text-gray-500 mb-8">Start your premium movie experience</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input name="username" className="input-field" placeholder="Choose a username" value={form.username} onChange={handleChange} required minLength={3} />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="Create a password" value={form.password} onChange={handleChange} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input name="confirmPassword" type="password" className="input-field" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-hover font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
