import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import client from '../../api/client';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  async function handleProfile(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await client.put('/auth/profile', form);
      updateUser(data.data);
      toast('Profile updated', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
    setLoading(false);
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setPassLoading(true);
    setError('');
    try {
      await client.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast('Password updated', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
    setPassLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-primary/20">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">{user?.username}</h1>
              <p className="text-gray-500 text-sm">{user?.email} {!user?.isVerified && <span className="text-yellow-400 ml-2">(unverified)</span>}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Role', value: user?.role?.replace('_', ' ') || 'User' },
              { label: 'Status', value: user?.status || 'Active', color: user?.status === 'active' ? 'text-green-400' : 'text-yellow-400' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-' },
            ].map((stat) => (
              <div key={stat.label} className="bg-brand-card rounded-xl border border-brand-border p-4">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`font-semibold ${stat.color || 'text-white'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* Account Details */}
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Account Details</h2>
              <form onSubmit={handleProfile} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Change Password</h2>
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input-field" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input-field" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input-field" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={passLoading} className="btn-primary">
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
