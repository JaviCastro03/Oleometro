export const RANGES = [
  { id: '1y', label: '1 año', months: 12 },
  { id: '3y', label: '3 años', months: 36 },
  { id: '5y', label: '5 años', months: 60 },
  { id: 'all', label: 'Todo', months: null },
];

export const DEFAULTS = { country: 'ES', product: 'evoo', range: 'all' };

export const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Colours live in CSS tokens so light/dark can swap them (validated palette). */
export const countryColor = (code) => `var(--c-${code}, var(--c-other))`;
