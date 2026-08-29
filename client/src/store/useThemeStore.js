import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: typeof window !== 'undefined' ? localStorage.getItem('auramail-theme') || 'dark' : 'dark',
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('auramail-theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    });
  },
  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auramail-theme') || 'dark';
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: saved });
    }
  },
}));
