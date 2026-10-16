import { useCallback, useEffect, useState } from 'react';
import { buildModel } from '../models/dashboardModel.js';
import { fetchDashboard } from '../services/dashboardService.js';

/** Loads the payload and exposes { status, model, error, reload }. */
export function useDashboard() {
  const [state, setState] = useState({ status: 'loading', model: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchDashboard(controller.signal)
      .then((payload) => setState({ status: 'ready', model: buildModel(payload), error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', model: null, error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
