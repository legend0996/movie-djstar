import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './constants';

import HomePage from './pages/movies/HomePage';
import BrowsePage from './pages/movies/BrowsePage';
import MovieDetailPage from './pages/movies/MovieDetailPage';
import WatchPage from './pages/movies/WatchPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/auth/ProfilePage';

import MyLibraryPage from './pages/library/MyLibraryPage';
import PurchasesPage from './pages/library/PurchasesPage';
import ReceiptsPage from './pages/library/ReceiptsPage';

import TicketsPage from './pages/support/TicketsPage';
import TicketDetailPage from './pages/support/TicketDetailPage';

import MovieOwnerDashboard from './pages/admin/MovieOwnerDashboard';
import DeveloperDashboard from './pages/admin/DeveloperDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminSupport from './pages/admin/AdminSupport';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<BrowsePage />} />
          <Route path="/movies/:slug" element={<MovieDetailPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/my-library" element={<MyLibraryPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<TicketsPage />} />
            <Route path="/support/:id" element={<TicketDetailPage />} />
          </Route>
        </Route>

        <Route element={<AdminLayout />}>
          <Route element={<ProtectedRoute roles={[ROLES.MOVIE_OWNER, ROLES.DEVELOPER]} />}>
            <Route path="/admin/movies" element={<MovieOwnerDashboard />} />
            <Route path="/admin/support" element={<AdminSupport />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.DEVELOPER]} />}>
            <Route path="/admin/developer" element={<DeveloperDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
