// CONTROLADOR: hook del tema claro/oscuro.
// Recuerda la elección en localStorage, una pequeña "libreta" del navegador
// donde se guardan datos que siguen ahí aunque cierres la pestaña.
import { useCallback, useEffect, useState } from 'react';

// Nombre con el que guardamos el tema (el mismo que lee index.html al arrancar).
const STORAGE_KEY = 'oleometro-theme';

// index.html ya puso el tema en <html data-theme="...">; partimos de ese valor.
const initialTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  // Cuando cambia el tema, lo escribimos en <html>; el CSS cambia los colores según ese atributo.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Alterna entre claro y oscuro y guarda la preferencia.
  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* el almacenamiento puede estar bloqueado; la elección simplemente no se recordará */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
