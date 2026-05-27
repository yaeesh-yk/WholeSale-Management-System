import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      username: null,
      isAuthenticated: false,
      login: (token, username) => set({ token, username, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('ws_token');
        set({ token: null, username: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ws-auth',
      partialize: (state) => ({ token: state.token, username: state.username, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Sync token to localStorage for api.js usage
        if (state?.token) localStorage.setItem('ws_token', state.token);
      },
    }
  )
);
