import { useState } from 'react';
import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';
import client from '../../api/client';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'audit-logs', label: 'Audit Logs' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'revenue', label: 'Revenue Reports' },
];

export default function DeveloperDashboard() {
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);
  const { data: stats, isLoading } = useFetch('dev-stats', '/admin/developer/dashboard');
  const { data: auditLogs } = useFetch(['audit-logs', page], tab === 'audit-logs' ? `/admin/developer/audit-logs?page=${page}&limit=20` : null);
  const { data: analytics } = useFetch('analytics', tab === 'analytics' ? '/admin/developer/analytics' : null);
  const { data: revenueData } = useFetch(['revenue', page], tab === 'revenue' ? `/admin/developer/revenue-reports?page=${page}&limit=20` : null);

  if (isLoading) return <Loader />;

  const d = stats?.data;
  const totalUsers = d?.users?.total || 0;
  const totalMovies = d?.movies?.total || 0;
  const totalRevenue = d?.orders?.totalRevenue || 0;
  const totalPurchases = d?.orders?.paid || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-white">Developer Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and analytics</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: totalUsers, color: 'text-blue-400' },
              { label: 'Total Movies', value: totalMovies, color: 'text-brand-primary' },
              { label: 'Revenue', value: formatCurrency(totalRevenue), color: 'text-green-400' },
              { label: 'Purchases', value: totalPurchases, color: 'text-brand-accent' },
            ].map((stat) => (
              <div key={stat.label} className="bg-brand-card rounded-xl border border-brand-border p-5">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Users by Role</h2>
              {d?.users?.byRole?.map((r) => (
                <div key={r.slug} className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
                  <span className="text-sm text-gray-400">{r.name}</span>
                  <span className="text-sm font-bold text-white">{r.count}</span>
                </div>
              )) || <p className="text-gray-500 text-sm">No data</p>}
            </div>

            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Activity Summary</h2>
              <div className="space-y-4">
                {[
                  { label: 'New Users Today', value: d?.activity?.newUsersToday || 0 },
                  { label: 'New Orders Today', value: d?.activity?.newOrdersToday || 0 },
                  { label: "Today's Revenue", value: formatCurrency(d?.activity?.todayRevenue || 0) },
                  { label: 'Total Streams', value: d?.activity?.totalStreams?.toLocaleString() || 0 },
                  { label: 'Total Downloads', value: d?.activity?.totalDownloads?.toLocaleString() || 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Storage & Commissions</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Storage Used</span>
                  <span className="text-sm font-semibold text-white">{d?.storage ? `${(d.storage.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : '0 GB'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Files Stored</span>
                  <span className="text-sm font-semibold text-white">{d?.storage?.fileCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Commission Rate</span>
                  <span className="text-sm font-semibold text-white">{d?.commissions?.rate ? `${(d.commissions.rate * 100).toFixed(0)}%` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Developer Commission</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(d?.commissions?.developerCommission || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Owner Earnings</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(d?.commissions?.ownerEarnings || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Recent Errors</h2>
              {d?.recentErrors?.length > 0 ? (
                <div className="space-y-3">
                  {d.recentErrors.map((err, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                      <div>
                        <span className="text-sm text-red-400">{err.action}</span>
                        <p className="text-xs text-gray-500">{err.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(err.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent errors</p>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'audit-logs' && (
        <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden md:table-cell">User</th>
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium hidden sm:table-cell">Entity</th>
                  <th className="text-right py-3.5 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs?.data?.map((log) => (
                  <tr key={log.id} className="border-b border-brand-border hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-white">{log.action}</td>
                    <td className="py-3.5 px-4 text-gray-400 hidden md:table-cell">{log.user?.username || '-'}</td>
                    <td className="py-3.5 px-4 text-gray-400 hidden sm:table-cell">{log.entityType}{log.entityId ? ` #${log.entityId}` : ''}</td>
                    <td className="py-3.5 px-4 text-right text-gray-400">{formatDate(log.createdAt)}</td>
                  </tr>
                )) || <tr><td colSpan={4} className="py-8 text-center text-gray-500">No audit logs found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination pagination={auditLogs?.pagination} onPageChange={setPage} />
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {analytics?.data?.userGrowth?.length > 0 && (
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">User Growth (Last 30 Days)</h2>
              <div className="space-y-2">
                {analytics.data.userGrowth.slice(-14).map((day) => (
                  <div key={day.date} className="flex items-center justify-between py-1.5 border-b border-brand-border last:border-0">
                    <span className="text-sm text-gray-400">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-sm font-semibold text-white">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analytics?.data?.moviesByCategory?.length > 0 && (
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Movies by Category</h2>
              <div className="space-y-2">
                {analytics.data.moviesByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                    <span className="text-sm text-gray-400">{cat.name}</span>
                    <span className="text-sm font-semibold text-white">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analytics?.data?.revenueTrend?.length > 0 && (
            <div className="bg-brand-card rounded-xl border border-brand-border p-6">
              <h2 className="font-heading font-bold text-lg text-white mb-5">Revenue Trend (Last 14 Days)</h2>
              <div className="space-y-2">
                {analytics.data.revenueTrend.map((day) => (
                  <div key={day.date} className="flex items-center justify-between py-1.5 border-b border-brand-border last:border-0">
                    <span className="text-sm text-gray-400">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(day.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!analytics?.data?.userGrowth?.length && !analytics?.data?.moviesByCategory?.length) && (
            <p className="text-center text-gray-500 py-8">No analytics data available</p>
          )}
        </div>
      )}

      {tab === 'revenue' && (
        <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Period</th>
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Orders</th>
                  <th className="text-left py-3.5 px-4 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-3.5 px-4 text-gray-500 font-medium">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {revenueData?.data?.daily?.map((day) => (
                  <tr key={day.date} className="border-b border-brand-border hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-white">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-gray-400">{day.orders}</td>
                    <td className="py-3.5 px-4 text-green-400 font-semibold">{formatCurrency(day.revenue)}</td>
                    <td className="py-3.5 px-4 text-right text-gray-400">{day.avgOrderValue ? formatCurrency(day.avgOrderValue) : '-'}</td>
                  </tr>
                )) || (
                  revenueData?.data?.summary && (
                    <tr className="border-b border-brand-border">
                      <td className="py-3.5 px-4 text-white font-semibold">Total</td>
                      <td className="py-3.5 px-4 text-gray-400">{revenueData.data.summary.totalOrders}</td>
                      <td className="py-3.5 px-4 text-green-400 font-semibold">{formatCurrency(revenueData.data.summary.totalRevenue)}</td>
                      <td className="py-3.5 px-4 text-right text-gray-400">{formatCurrency(revenueData.data.summary.avgOrderValue)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination pagination={revenueData?.pagination} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
