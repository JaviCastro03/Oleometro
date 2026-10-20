// SERVICIO: la única parte que habla con el "exterior" (hace el fetch).
// Analogía: es el repartidor; va a buscar el paquete (JSON) y lo trae tal cual,
// sin abrirlo. Transformarlo es trabajo del modelo.

// import.meta.env es cómo Vite entrega variables de entorno (las que empiezan por VITE_)
// al código del navegador. Si VITE_API_URL no existe usamos '' y quitamos una '/' final si la hubiera.
const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * Dos orígenes posibles para los datos:
 * - Por defecto, un JSON estático (así funciona gratis en GitHub Pages).
 * - Si se define VITE_API_URL, se piden al backend FastAPI.
 * BASE_URL es la base de Vite (ver vite.config.js), para que la ruta valga en cualquier alojamiento.
 */
export const DATA_URL = API ? `${API}/api/v1/dashboard` : `${import.meta.env.BASE_URL}data/dashboard.json`;

// "signal" permite cancelar la petición desde el controlador (AbortController).
// Con { revalidate: true } se pregunta siempre al servidor si hay datos nuevos (cache 'no-cache':
// si no han cambiado, el servidor contesta "sin cambios" y no se descarga nada).
export async function fetchDashboard(signal, { revalidate = false } = {}) {
  const response = await fetch(DATA_URL, { signal, ...(revalidate ? { cache: 'no-cache' } : {}) });
  // fetch no falla con errores HTTP (404, 500...), así que lo comprobamos a mano.
  if (!response.ok) throw new Error(`No se pudieron cargar los datos (HTTP ${response.status})`);
  return response.json();
}
