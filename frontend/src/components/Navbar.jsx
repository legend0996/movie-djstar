import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Browse' },
  { to: '/my-library', label: 'My Library', auth: true },
  { to: '/support', label: 'Support', auth: true },
];

export default function Navbar({ onSearchOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? 'glass shadow-lg shadow-black/20'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-lg lg:text-xl text-white">
                DJ<span className="text-brand-primary">Star</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.auth && !user) return null;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-white bg-white/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSearchOpen}
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {user ? (
                <>
                  <NotificationBell />
                  {/* Desktop-only user menu */}
                  <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate">
                        {user.username}
                      </span>
                    </Link>
                    {(user.role === 'movie_owner' || user.role === 'developer') && (
                      <Link to="/admin/movies" className="btn-secondary text-xs !py-1.5 !px-3">
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                      aria-label="Logout"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm !py-2 !px-4">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm !py-2 !px-5">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.nav>
    </>
  );
}
