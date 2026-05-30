import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const INACTIVITY_LIMIT_MS = 60 * 1000;

export default function ProtectedRoute() {
  const { isAuthenticated, expiresAt, lastActivityAt, logout } = useAuthStore();
  const isTokenExpired = expiresAt ? Date.now() >= expiresAt : false;
  const isInactive = lastActivityAt ? Date.now() - lastActivityAt >= INACTIVITY_LIMIT_MS : false;

  useEffect(() => {
    if (isTokenExpired || isInactive) {
      logout();
    }
  }, [isTokenExpired, isInactive, logout]);

  if (!isAuthenticated || isTokenExpired || isInactive) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
