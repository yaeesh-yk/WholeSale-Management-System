import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, expiresAt, logout } = useAuthStore();
  const isExpired = expiresAt ? Date.now() >= expiresAt : false;

  useEffect(() => {
    if (isExpired) logout();
  }, [isExpired, logout]);

  if (!isAuthenticated || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
