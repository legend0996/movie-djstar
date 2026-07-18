import { useState } from 'react';
import { useFetch } from '../../hooks/useApi';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';
import client from '../../api/client';

export default function UserManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch } = useFetch(['admin-users', page, search], `/admin/users?page=${page}&limit=20${search ? `&q=${search}` : ''}`);

  async function handleRoleChange(userId, role) {
    try {
      await client.put(`/admin/users/${userId}`, { role });
      toast('User role updated', 'success');
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  }

  async function handleBan(userId, banned) {
    try {
      await client.put(`/admin/users/${userId}`, { status: banned ? 'suspended' : 'active' });
      toast(banned ? 'User suspended' : 'User restored', 'success');
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage platform users and roles</p>
      </div>

      <div className="relative max-w-md mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input-field pl-10"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium">User</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Role</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-right py-3.5 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((u) => (
                    <tr key={u.id} className="border-b border-brand-border hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 hidden md:table-cell">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <select
                          className="bg-white/5 text-sm rounded-lg px-2.5 py-1.5 border border-brand-border text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                          value={u.role?.slug || u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="movie_owner">Movie Owner</option>
                          <option value="developer">Developer</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        {u.status === 'suspended' ? (
                          <span className="badge badge-error">Suspended</span>
                        ) : u.status === 'active' ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-warning">{u.status}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleBan(u.id, u.status !== 'suspended')}
                          className={`text-sm font-medium transition-colors ${u.status === 'suspended' ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                        >
                          {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6">
            <Pagination pagination={data?.pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
