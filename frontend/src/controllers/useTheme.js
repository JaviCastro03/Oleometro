import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'oleometro-theme';

const initialTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage can be blocked; the choice just won't persist */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
