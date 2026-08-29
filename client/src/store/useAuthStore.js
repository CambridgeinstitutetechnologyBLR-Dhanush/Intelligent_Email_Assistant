import { create } from 'zustand';
import { authService } from '../services/authService';
import { gmailService } from '../services/gmailService';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  gmailStatus: {
    isConnected: false,
    email: null,
    scopes: [],
    error: null,
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const { user } = await authService.getMe();
      set({ user, token, isAuthenticated: true, isLoading: false });
      get().checkGmailStatus();
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const data = await authService.login({ email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    set({ user: data.user, token: data.token, isAuthenticated: true });
    get().checkGmailStatus();
    return data;
  },

  register: async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    set({ user: data.user, token: data.token, isAuthenticated: true });
    get().checkGmailStatus();
    return data;
  },

  logout: async () => {
    await authService.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      gmailStatus: { isConnected: false, email: null, scopes: [], error: null },
    });
  },

  checkGmailStatus: async () => {
    try {
      const status = await gmailService.getStatus();
      set({ gmailStatus: status });
      return status;
    } catch (error) {
      set({
        gmailStatus: { isConnected: false, email: null, scopes: [], error: error.message },
      });
    }
  },
}));
