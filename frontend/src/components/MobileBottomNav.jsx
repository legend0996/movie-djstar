import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  {
    to: '/',
    label: 'Home',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    auth: false,
  },
  {
    to: '/movies',
    label: 'Browse',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    auth: false,
  },
  {
    to: '/my-library',
    label: 'Library',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    auth: true,
  },
  {
    to: '/support',
    label: 'Support',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />,
    auth: true,
  },
];

export default function MobileBottomNav() {
  const { user } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          if (link.auth && !user) return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-brand-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {link.icon}
              </svg>
              <span className="text-[10px] font-medium leading-none">{link.label}</span>
            </NavLink>
          );
        })}
        {user ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-[10px] font-bold text-white">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-[10px] font-medium leading-none">Profile</span>
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-0 flex-1 text-gray-500 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium leading-none">Sign In</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}