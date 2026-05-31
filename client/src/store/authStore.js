import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

const parseTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

let logoutTimer = null;

const scheduleLogout = ({ expiresAt, lastActivityAt }) => {
  if (logoutTimer) clearTimeout(logoutTimer);

  const now = Date.now();
  const tokenExpiryTime = expiresAt ? expiresAt - 3000 : Infinity;
  const idleExpiryTime = lastActivityAt ? lastActivityAt + INACTIVITY_LIMIT_MS : Infinity;
  const logoutAt = Math.min(tokenExpiryTime, idleExpiryTime);

  if (logoutAt <= now) {
    useAuthStore.getState().logout();
    window.location.replace('/login');
    return;
  }

  logoutTimer = setTimeout(() => {
    useAuthStore.getState().logout();
    window.location.replace('/login');
  }, logoutAt - now);
};

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      username: null,
      expiresAt: null,
      lastActivityAt: null,
      isAuthenticated: false,
      login: (token, username) => {
        const expiresAt = parseTokenExpiry(token);
        const now = Date.now();
        set({ token, username, expiresAt, lastActivityAt: now, isAuthenticated: true });
        localStorage.setItem('ws_token', token);
        scheduleLogout({ expiresAt, lastActivityAt: now });
      },
      logout: () => {
        if (logoutTimer) clearTimeout(logoutTimer);
        localStorage.removeItem('ws_token');
        set({ token: null, username: null, expiresAt: null, lastActivityAt: null, isAuthenticated: false });
      },
      updateActivity: () => {
        const now = Date.now();
        set((state) => {
          const newState = { lastActivityAt: now };
          if (state.token) scheduleLogout({ expiresAt: state.expiresAt, lastActivityAt: now });
          return newState;
        });
      },
    }),
    {
      name: 'ws-auth',
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        expiresAt: state.expiresAt,
        lastActivityAt: state.lastActivityAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('ws_token', state.token);
          const expiresAt = parseTokenExpiry(state.token);
          const lastActivityAt = state.lastActivityAt ?? Date.now();
          if (Date.now() - lastActivityAt >= INACTIVITY_LIMIT_MS) {
            useAuthStore.getState().logout();
          } else {
            scheduleLogout({ expiresAt, lastActivityAt });
          }
        }
      },
    }
  )
);
