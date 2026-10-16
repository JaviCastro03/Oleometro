import { MONTHS_ES } from './constants.js';

const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

export const eur = (n) => (n == null ? '—' : `${int.format(Math.round(n))} €`);
export const eurCompact = (n) => (n == null ? '' : int.format(Math.round(n)));
export const integer = (n) => int.format(Math.round(n));

export function pct(n, digits = 1) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const body = Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${sign}${body} %`;
}

const utc = { timeZone: 'UTC' };
export const dateLong = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-ES', { ...utc, day: 'numeric', month: 'long', year: 'numeric' });
export const dateShort = (t) =>
  new Date(t).toLocaleDateString('es-ES', { ...utc, day: 'numeric', month: 'short', year: 'numeric' });
export const monthYear = (year, month) => `${MONTHS_ES[month]} ${year}`;
