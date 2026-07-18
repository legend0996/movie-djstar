import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">403</h1>
        <p className="text-gray-400">You do not have permission to access this page.</p>
        <a href="/" className="text-brand-primary hover:text-brand-hover mt-4 inline-block">Go Home</a>
      </div>
    );
  }

  return <Outlet />;
}
