import { useFetch } from '../../hooks/useApi';
import Loader from '../../components/Loader';
import { formatCurrency } from '../../utils/format';

export default function DeveloperDashboard() {
  const { data: stats, isLoading } = useFetch('dev-stats', '/admin/developer/dashboard');

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, color: 'text-blue-400', icon: 'users' },
          { label: 'Total Movies', value: totalMovies, color: 'text-brand-primary', icon: 'movies' },
          { label: 'Revenue', value: formatCurrency(totalRevenue), color: 'text-green-400', icon: 'revenue' },
          { label: 'Purchases', value: totalPurchases, color: 'text-brand-accent', icon: 'purchases' },
        ].map((stat) => (
          <div key={stat.label} className="bg-brand-card rounded-xl border border-brand-border p-5">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}
