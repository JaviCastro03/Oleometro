// MODELO: funciones para mostrar números y fechas en español (1.234 €, +2,5 %, 3 mar 2025).
// Son puras: reciben un valor y devuelven un texto, sin tocar la pantalla.
import { MONTHS_ES } from './constants.js';

// Intl.NumberFormat es el formateador de números del navegador.
// 'es-ES' = estilo español; useGrouping 'always' fuerza el punto de miles también en 4 cifras (1.234).
const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

// Si no hay dato (null/undefined) se muestra '—' en vez de romper o escribir "NaN".
export const eur = (n) => (n == null ? '—' : `${int.format(Math.round(n))} €`);
export const eurCompact = (n) => (n == null ? '' : int.format(Math.round(n)));
export const integer = (n) => int.format(Math.round(n));

// Porcentaje con signo explícito (+ o −) para que se vea si sube o baja.
export function pct(n, digits = 1) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const body = Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${sign}${body} %`;
}

// Las fechas se muestran siempre en UTC para que no cambien de día según la zona horaria del usuario.
const utc = { timeZone: 'UTC' };
// Recibe un texto ISO ("2025-03-03"); añadimos hora 00:00 UTC para interpretarlo sin desfases.
export const dateLong = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-ES', { ...utc, day: 'numeric', month: 'long', year: 'numeric' });
// Recibe un timestamp (milisegundos desde 1970).
export const dateShort = (t) =>
  new Date(t).toLocaleDateString('es-ES', { ...utc, day: 'numeric', month: 'short', year: 'numeric' });
export const monthYear = (year, month) => `${MONTHS_ES[month]} ${year}`;

// Número con decimales fijos y punto de miles siempre (3.338,37). Los precios se muestran con 2 decimales
// para transmitir precisión: es el dato tal cual lo publica la fuente.
export const decimal = (n, digits = 2) =>
  n == null
    ? '—'
    : n.toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' });

// Variación con signo explícito y sin depender del color: "+1,25" / "−0,40".
export function signed(n, digits = 2) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${decimal(Math.abs(n), digits)}`;
}

// Fecha corta a partir de un texto ISO ("2026-10-05" → "5 oct 2026").
export const dateIso = (iso) => dateShort(Date.parse(`${iso}T00:00:00Z`));
// Fecha y hora de una marca ISO con zona ("2026-10-18T11:39:43+00:00"), en hora de Madrid.
export const dateTimeMadrid = (iso) =>
  new Date(iso).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
