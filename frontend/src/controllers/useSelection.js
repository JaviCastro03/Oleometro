import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatHash, parseHash, resolveSelection } from '../models/dashboardModel.js';

/** Country / product / range selection, validated against the model and mirrored in the URL hash. */
export function useSelection(model) {
  const [picked, setPicked] = useState(() => parseHash(typeof window === 'undefined' ? '' : window.location.hash));

  const selection = useMemo(() => (model ? resolveSelection(model, picked) : null), [model, picked]);

  useEffect(() => {
    if (!selection) return;
    try {
      window.history.replaceState(null, '', formatHash(selection));
    } catch {
      /* the hash is a convenience; ignore sandboxed contexts */
    }
  }, [selection]);

  const set = useCallback((key) => (value) => setPicked((p) => ({ ...p, [key]: value })), []);
  const actions = useMemo(
    () => ({ setCountry: set('country'), setProduct: set('product'), setRange: set('range') }),
    [set],
  );
  return { selection, actions };
}
