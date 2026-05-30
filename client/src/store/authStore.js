import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const parseTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (err) {
    return null;
  }
};

let logoutTimer = null;

const scheduleLogout = (expiresAt) => {
  if (logoutTimer) clearTimeout(logoutTimer);
  if (!expiresAt) return;

  const msUntilExpiry = expiresAt - Date.now() - 3000;
  if (msUntilExpiry <= 0) {
    useAuthStore.getState().logout();
    window.location.replace('/login');
    return;
  }

  logoutTimer = setTimeout(() => {
    useAuthStore.getState().logout();
    window.location.replace('/login');
  }, msUntilExpiry);
};

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      username: null,
      expiresAt: null,
      isAuthenticated: false,
      login: (token, username) => {
        const expiresAt = parseTokenExpiry(token);
        set({ token, username, expiresAt, isAuthenticated: true });
        localStorage.setItem('ws_token', token);
        scheduleLogout(expiresAt);
      },
      logout: () => {
        if (logoutTimer) clearTimeout(logoutTimer);
        localStorage.removeItem('ws_token');
        set({ token: null, username: null, expiresAt: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ws-auth',
      partialize: (state) => ({ token: state.token, username: state.username, expiresAt: state.expiresAt, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('ws_token', state.token);
          const expiresAt = parseTokenExpiry(state.token);
          if (expiresAt) scheduleLogout(expiresAt);
        }
      },
    }
  )
);
