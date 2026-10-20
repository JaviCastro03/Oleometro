// CONTROLADOR: hook que carga los datos del dashboard y los mantiene al día.
// Estados: 'loading' = cargando, 'ready' = listo, 'error' = falló la primera carga.
//
// Los datos de precios son SEMANALES, así que no hay "tiempo real". Lo que sí hacemos,
// de forma honesta, es volver a preguntar al servidor cada 30 minutos y al volver a la
// pestaña. Si hay datos nuevos, se actualizan sin recargar la página. Si la comprobación
// falla, se siguen mostrando los últimos datos y se avisa con `refreshFailed`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildModel } from '../models/dashboardModel.js';
import { fetchDashboard } from '../services/dashboardService.js';

const REFRESH_EVERY_MS = 30 * 60 * 1000;
const MIN_GAP_MS = 5 * 60 * 1000; // al volver a la pestaña, no preguntar más de una vez cada 5 minutos

/** Carga los datos y devuelve { status, model, error, reload, refreshFailed }. */
export function useDashboard() {
  const [state, setState] = useState({ status: 'loading', model: null, error: null });
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const generatedAt = useRef(null);
  const lastCheck = useRef(0);

  // 1) Carga inicial (y cada "reintentar").
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchDashboard(controller.signal)
      .then((payload) => {
        generatedAt.current = payload.meta.generated_at;
        lastCheck.current = Date.now();
        setRefreshFailed(false);
        setState({ status: 'ready', model: buildModel(payload), error: null });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', model: null, error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);

  // 2) Comprobación periódica: solo cuando ya hay datos en pantalla.
  const ready = state.status === 'ready';
  useEffect(() => {
    if (!ready) return undefined;
    let controller = new AbortController();

    const check = async () => {
      lastCheck.current = Date.now();
      controller.abort();
      controller = new AbortController();
      try {
        const payload = await fetchDashboard(controller.signal, { revalidate: true });
        setRefreshFailed(false);
        // Solo se reconstruye el modelo si el servidor ha publicado datos nuevos.
        if (payload.meta.generated_at !== generatedAt.current) {
          generatedAt.current = payload.meta.generated_at;
          setState({ status: 'ready', model: buildModel(payload), error: null });
        }
      } catch (error) {
        if (error.name !== 'AbortError') setRefreshFailed(true);
      }
    };

    const timer = setInterval(check, REFRESH_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > MIN_GAP_MS) check();
    };
    // Si el navegador pierde y recupera la red, volvemos a comprobar.
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      controller.abort();
      window.removeEventListener('online', check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ready]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, refreshFailed, reload };
}
