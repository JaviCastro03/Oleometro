// CONTROLADOR: hook de la selección del usuario (país, producto y rango).
// Se guarda también en el "hash" de la URL: es la parte que va tras el '#',
// p. ej. ".../#es-evoo-3y". Así se puede copiar el enlace y compartir
// exactamente la misma vista. Leer/escribir el hash lo hace el modelo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatHash, parseHash, resolveSelection } from '../models/dashboardModel.js';

/** Selección país / producto / rango: se valida con el modelo y se refleja en el hash de la URL. */
export function useSelection(model) {
  // Lo que el usuario pidió (viene del hash al abrir la página). Puede ser inválido.
  // El "typeof window" evita errores si el código corre fuera del navegador (tests).
  const [picked, setPicked] = useState(() => parseHash(typeof window === 'undefined' ? '' : window.location.hash));

  // Selección ya corregida: si el hash trae algo que no existe, se usan valores por defecto.
  const selection = useMemo(() => (model ? resolveSelection(model, picked) : null), [model, picked]);

  // Cada vez que la selección cambia, actualizamos la URL (sin recargar ni ensuciar el historial).
  useEffect(() => {
    if (!selection) return;
    try {
      window.history.replaceState(null, '', formatHash(selection));
    } catch {
      /* el hash es solo una comodidad; se ignora si el navegador lo bloquea */
    }
  }, [selection]);

  // Fabrica un "setter" para cada campo: set('country')('PT') cambia solo el país.
  const set = useCallback((key) => (value) => setPicked((p) => ({ ...p, [key]: value })), []);
  const actions = useMemo(
    () => ({
      setCountry: set('country'),
      setProduct: set('product'),
      setRange: set('range'),
      // Elegir una fila de la tabla de cotizaciones cambia país y calidad a la vez.
      select: (country, product) => setPicked((p) => ({ ...p, country, product })),
    }),
    [set],
  );
  return { selection, actions };
}
