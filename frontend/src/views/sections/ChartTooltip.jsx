import styles from './ChartTooltip.module.css';

/** Shared hover card for every chart. Text stays in ink tokens; a swatch carries identity. */
export default function ChartTooltip({ active, payload, label, formatLabel, formatValue, nameFor, footer }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((entry) => entry.value != null).sort((a, b) => b.value - a.value);

  return (
    <div className={styles.tip}>
      <p className={styles.title}>{formatLabel(label, payload)}</p>
      <ul className={styles.list}>
        {rows.map((entry) => (
          <li key={entry.dataKey}>
            <span className={styles.swatch} style={{ background: entry.color ?? entry.stroke ?? entry.fill }} />
            <span>{nameFor(entry.dataKey)}</span>
            <strong>{formatValue(entry.value)}</strong>
          </li>
        ))}
      </ul>
      {footer?.(payload)}
    </div>
  );
}
