// Model layer: turns the API payload into the shapes the views need.
// Everything here is pure (no React, no DOM) so it is trivially testable.

import { DEFAULTS, RANGES } from './constants.js';

const DAY = 86_400_000;

export const seriesKey = (country, product) => `${country}|${product}`;

export function buildModel(payload) {
  const index = new Map();
  for (const s of payload.series) {
    index.set(seriesKey(s.country, s.product), {
      country: s.country,
      product: s.product,
      insight: s.insight,
      points: s.points.map(([date, price]) => ({ date, t: Date.parse(date), price })),
      forecast: buildForecast(s.forecast),
    });
  }
  return {
    meta: payload.meta,
    countries: payload.countries,
    products: payload.products,
    production: payload.production,
    index,
  };
}

/** Convierte la previsión de la API (arrays compactos) en objetos fáciles de usar. Si no hay previsión, null. */
function buildForecast(raw) {
  if (!raw) return null;
  return {
    horizons: raw.horizons.map((h) => ({ ...h, t: Date.parse(h.target_date) })),
    path: raw.path.map(([date, price, low, high]) => ({ date, t: Date.parse(date), price, low, high })),
  };
}

export const getSeries = (model, country, product) => model.index.get(seriesKey(country, product)) ?? null;

export function sliceRange(points, rangeId) {
  const range = RANGES.find((r) => r.id === rangeId);
  if (!points.length || !range?.months) return points;
  const cutoff = points[points.length - 1].t - range.months * 30.4375 * DAY;
  return points.filter((p) => p.t >= cutoff);
}

/** Average weekly points into calendar months. */
export function toMonthly(points) {
  const buckets = new Map();
  for (const p of points) {
    const d = new Date(p.t);
    const key = d.getUTCFullYear() * 12 + d.getUTCMonth();
    const bucket = buckets.get(key) ?? { year: d.getUTCFullYear(), month: d.getUTCMonth(), sum: 0, n: 0 };
    bucket.sum += p.price;
    bucket.n += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, b]) => ({ year: b.year, month: b.month, price: b.sum / b.n }));
}

/** Years x months matrix of monthly averages, newest year first, with 0..1 intensity. */
export function seasonalHeatmap(points) {
  const monthly = toMonthly(points);
  if (!monthly.length) return { rows: [], min: 0, max: 0 };
  const values = monthly.map((m) => m.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const byYear = new Map();
  for (const m of monthly) {
    const row = byYear.get(m.year) ?? Array.from({ length: 12 }, (_, month) => ({ month, value: null, intensity: 0 }));
    row[m.month] = { month: m.month, value: m.price, intensity: (m.price - min) / span };
    byYear.set(m.year, row);
  }
  const rows = [...byYear.entries()].sort(([a], [b]) => b - a).map(([year, cells]) => ({ year, cells }));
  return { rows, min, max };
}

/** Axis ticks/labels that adapt to the visible time span. */
export function buildTimeAxis(points) {
  if (points.length < 2) return { ticks: [], format: () => '' };
  const first = points[0].t;
  const last = points[points.length - 1].t;
  const years = (last - first) / (365 * DAY);
  const start = new Date(first);
  const ticks = [];

  if (years > 3) {
    const step = years > 8 ? 2 : 1;
    for (let y = start.getUTCFullYear() + 1; Date.UTC(y, 0, 1) <= last; y += step) ticks.push(Date.UTC(y, 0, 1));
    return { ticks, format: (t) => String(new Date(t).getUTCFullYear()) };
  }

  const stepMonths = years > 1.2 ? 3 : 1;
  let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
  while (cursor <= last) {
    const d = new Date(cursor);
    if (d.getUTCMonth() % stepMonths === 0) ticks.push(cursor);
    cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return {
    ticks,
    format: (t) => {
      const d = new Date(t);
      const label = monthNames[d.getUTCMonth()];
      return d.getUTCMonth() === 0 || years > 1.2 ? `${label} ${String(d.getUTCFullYear()).slice(2)}` : label;
    },
  };
}

/** One row per week with a column per country, for the comparison chart. */
export function compareRows(model, product, rangeId) {
  const rows = new Map();
  const countries = [];
  for (const { id } of model.countries) {
    const series = getSeries(model, id, product);
    if (!series) continue;
    countries.push(id);
    for (const p of sliceRange(series.points, rangeId)) {
      const row = rows.get(p.t) ?? { t: p.t, date: p.date };
      row[id] = p.price;
      rows.set(p.t, row);
    }
  }
  return { countries, rows: [...rows.values()].sort((a, b) => a.t - b.t) };
}

/** Annual production, one row per marketing year with a column per country. */
export function productionRows(model) {
  const rows = new Map();
  const countries = new Set();
  for (const r of model.production) {
    countries.add(r.country);
    const row = rows.get(r.marketing_year) ?? { year: r.marketing_year, estimated: false, total: 0 };
    row[r.country] = r.production_kt;
    row.total += r.production_kt;
    row.estimated ||= r.estimated;
    rows.set(r.marketing_year, row);
  }
  const order = model.countries.map((c) => c.id).filter((id) => countries.has(id));
  return { countries: order, rows: [...rows.values()].sort((a, b) => a.year.localeCompare(b.year)) };
}

// ---------------------------------------------------------------- selection

const hashToParts = (hash) => hash.replace(/^#/, '').split('-');

export function parseHash(hash) {
  const [country, product, range] = hashToParts(hash ?? '');
  return { country: country?.toUpperCase(), product, range };
}

export const formatHash = ({ country, product, range }) => `#${country.toLowerCase()}-${product}-${range}`;

/** Validate a partial selection against what the model really contains. */
export function resolveSelection(model, picked = {}) {
  const countryIds = model.countries.map((c) => c.id);
  const productIds = model.products.map((p) => p.id);
  const country = countryIds.includes(picked.country) ? picked.country : countryIds.includes(DEFAULTS.country) ? DEFAULTS.country : countryIds[0];
  const product = productIds.includes(picked.product) ? picked.product : productIds.includes(DEFAULTS.product) ? DEFAULTS.product : productIds[0];
  const range = RANGES.some((r) => r.id === picked.range) ? picked.range : DEFAULTS.range;
  return { country, product, range };
}

// ---------------------------------------------------------------- previsión

export const FORECAST_HORIZONS = {
  week: { title: 'Próxima semana', short: '1 semana' },
  month: { title: 'Próximo mes', short: '1 mes' },
  year: { title: 'Próximo año', short: '1 año' },
};

/** Etiqueta en palabras de una previsión. "Probable" = el rango entero está a un lado del precio actual. */
export function forecastLabel({ direction, strength }) {
  if (direction === 'flat') return 'Estable';
  const clear = strength === 'clear';
  if (direction === 'up') return clear ? 'Subida probable' : 'Posible subida';
  return clear ? 'Bajada probable' : 'Posible bajada';
}

/** Explica con números cuánto habría acertado el método en el pasado (el "backtest"). */
export function describeBacktest(backtest) {
  if (!backtest) return null;
  const num = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const parts = [`En ${backtest.samples} pruebas con datos pasados, se desvió de media un ${num(backtest.mean_error_pct)} % del precio real.`];
  if (backtest.direction_hit_pct != null) {
    parts.push(`Acertó si iba a subir o bajar el ${num(backtest.direction_hit_pct)} % de las veces.`);
  }
  if (backtest.vs_naive_pct != null) {
    parts.push(
      backtest.vs_naive_pct > 0
        ? `Mejora un ${num(backtest.vs_naive_pct)} % a suponer que el precio se queda igual.`
        : 'No mejora a suponer que el precio se queda igual: tómalo con mucha cautela.',
    );
  }
  return parts.join(' ');
}

/**
 * Filas para el gráfico: el histórico reciente (línea continua) seguido de la
 * previsión (línea discontinua + banda de rango) hasta `weeks` semanas vista.
 * La última semana real se repite en la previsión para que las dos líneas se unan.
 */
export function forecastChartRows(series, weeks = 13, historyWeeks = 52) {
  if (!series?.forecast) return [];
  const history = series.points.slice(-historyWeeks).map((p) => ({ t: p.t, date: p.date, price: p.price }));
  const last = history[history.length - 1];
  const future = series.forecast.path
    .slice(0, weeks)
    .map((p) => ({ t: p.t, date: p.date, forecast: p.price, band: [p.low, p.high] }));
  const bridge = { ...last, forecast: last.price, band: [last.price, last.price] };
  return [...history.slice(0, -1), bridge, ...future];
}

/** Everything the dashboard view renders for a given selection. */
export function buildViewModel(model, selection) {
  const series = getSeries(model, selection.country, selection.product);
  const visible = series ? sliceRange(series.points, selection.range) : [];
  const peak = visible.length ? visible.reduce((a, b) => (b.price > a.price ? b : a)) : null;
  return {
    selection,
    series,
    visible,
    peak,
    axis: buildTimeAxis(visible),
    monthly: toMonthly(visible),
    heatmap: seasonalHeatmap(series?.points ?? []),
    forecast: series?.forecast ?? null,
    compare: compareRows(model, selection.product, selection.range),
    production: productionRows(model),
    countryLabel: model.countries.find((c) => c.id === selection.country)?.label ?? selection.country,
    productLabel: model.products.find((p) => p.id === selection.product)?.label ?? selection.product,
  };
}
