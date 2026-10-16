const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** Static JSON (GitHub Pages) unless VITE_API_URL points to the FastAPI backend. */
export const DATA_URL = API ? `${API}/api/v1/dashboard` : `${import.meta.env.BASE_URL}data/dashboard.json`;

export async function fetchDashboard(signal) {
  const response = await fetch(DATA_URL, { signal });
  if (!response.ok) throw new Error(`No se pudieron cargar los datos (HTTP ${response.status})`);
  return response.json();
}
