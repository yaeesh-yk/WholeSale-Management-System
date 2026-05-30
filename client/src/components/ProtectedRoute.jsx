import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

export default function ProtectedRoute() {
  const { hydrated, isAuthenticated, expiresAt, lastActivityAt, logout } = useAuthStore();
  const isTokenExpired = expiresAt ? Date.now() >= expiresAt : false;
  const isInactive = lastActivityAt ? Date.now() - lastActivityAt >= INACTIVITY_LIMIT_MS : false;

  useEffect(() => {
    if (!hydrated) return;
    if (isTokenExpired || isInactive) {
      logout();
    }
  }, [hydrated, isTokenExpired, isInactive, logout]);

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated || isTokenExpired || isInactive) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
