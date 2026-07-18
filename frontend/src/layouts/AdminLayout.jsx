import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';
import Toast from '../components/Toast';

const icons = {
  movies: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
  support: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
  developer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
};

const navItems = [
  { to: '/admin/movies', label: 'Movies', icon: 'movies', roles: [ROLES.MOVIE_OWNER, ROLES.DEVELOPER] },
  { to: '/admin/support', label: 'Support', icon: 'support', roles: [ROLES.MOVIE_OWNER, ROLES.DEVELOPER] },
  { to: '/admin/developer', label: 'Developer', icon: 'developer', roles: [ROLES.DEVELOPER] },
  { to: '/admin/users', label: 'Users', icon: 'users', roles: [ROLES.DEVELOPER] },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const visible = navItems.filter((n) => n.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-brand-surface border-r border-brand-border p-4 flex flex-col flex-shrink-0">
          <div className="mb-6 px-4">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Admin Panel</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-white">
                DJ<span className="text-brand-primary">Star</span>
              </span>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {visible.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {icons[item.icon]}
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-white transition-all duration-200 mt-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Site
          </NavLink>
        </aside>
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <Toast />
    </div>
  );
}
