// VISTA: indicador de variación. Comunica el sentido con TRES señales a la vez
// (flecha, signo y color), así no depende solo del color (daltonismo).
// Props: value (número o null), digits (decimales), unit ('%' o '€/t'), label (texto accesible).
import { signed } from '../../models/format.js';
import styles from './Delta.module.css';

const Up = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false">
    <path d="M5 1.5 9 8.5H1Z" fill="currentColor" />
  </svg>
);
const Down = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false">
    <path d="M5 8.5 1 1.5h8Z" fill="currentColor" />
  </svg>
);
const Flat = () => (
  <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false">
    <path d="M1 5h8" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export default function Delta({ value, digits = 2, unit = '%', size = 'md' }) {
  if (value == null) return <span className={`${styles.none} ${styles[size]}`}>Sin dato</span>;
  const direction = value > 0.0049 ? 'up' : value < -0.0049 ? 'down' : 'flat';
  const Icon = direction === 'up' ? Up : direction === 'down' ? Down : Flat;
  const word = direction === 'up' ? 'sube' : direction === 'down' ? 'baja' : 'sin cambios';
  return (
    <span className={`${styles.delta} ${styles[direction]} ${styles[size]}`}>
      <Icon />
      <span>
        {signed(value, digits)}
        {unit === '%' ? ' %' : ` ${unit}`}
      </span>
      <span className="sr-only"> ({word})</span>
    </span>
  );
}
