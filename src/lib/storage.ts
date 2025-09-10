// Safe localStorage utilities for Next.js SSR compatibility

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  },

  clear: (): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
  }
};