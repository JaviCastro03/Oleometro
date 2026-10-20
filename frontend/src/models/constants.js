// MODELO: valores fijos que usa toda la app (sin lógica).

// Rangos de tiempo que el usuario puede elegir. "months: null" significa "sin límite".
export const RANGES = [
  { id: '3m', label: '3 m', long: 'Últimos 3 meses', months: 3 },
  { id: '6m', label: '6 m', long: 'Últimos 6 meses', months: 6 },
  { id: '1y', label: '1 a', long: 'Último año', months: 12 },
  { id: '3y', label: '3 a', long: 'Últimos 3 años', months: 36 },
  { id: '5y', label: '5 a', long: 'Últimos 5 años', months: 60 },
  { id: 'all', label: 'Máx.', long: 'Histórico completo', months: null },
];

// Selección inicial cuando la URL no dice nada (o dice algo inválido).
export const DEFAULTS = { country: 'ES', product: 'evoo', range: '3y' };

// Nombres cortos de los meses; el índice 0 es enero. Se usan en ejes y tablas.
export const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Los colores viven en variables CSS (tokens) para poder cambiarlos entre claro y oscuro (paleta validada). */
export const countryColor = (code) => `var(--c-${code}, var(--c-other))`;
