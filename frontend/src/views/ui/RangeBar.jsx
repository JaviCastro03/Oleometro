// VISTA: barra que muestra dónde está un valor entre un mínimo y un máximo (0 a 1).
// Se usa en la tabla (rango de 52 semanas) y en el hero móvil (rango histórico).
// Props: position (0..1), label (texto accesible), tone ('plain' | 'oil').
import styles from './RangeBar.module.css';

export default function RangeBar({ position, label, tone = 'plain' }) {
  const p = Math.min(1, Math.max(0, position ?? 0));
  return (
    <span className={`${styles.bar} ${styles[tone]}`} role="img" aria-label={label}>
      <span className={styles.fill} style={{ width: `${p * 100}%` }} />
      <span className={styles.mark} style={{ left: `${p * 100}%` }} />
    </span>
  );
}
