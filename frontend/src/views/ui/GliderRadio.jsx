import styles from './GliderRadio.module.css';

/**
 * Segmented radio group with a sliding highlight.
 * options: [{ id, label, dot? }]  (dot is any CSS colour)
 */
export default function GliderRadio({ name, label, options, value, onChange, size = 'md' }) {
  const index = Math.max(0, options.findIndex((option) => option.id === value));

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${styles.group} ${styles[size]}`}
      style={{ '--n': options.length, '--i': index }}
    >
      <span className={styles.glider} aria-hidden="true" />
      {options.map((option) => (
        <label key={option.id} className={styles.option} data-checked={option.id === value}>
          <input
            className={styles.input}
            type="radio"
            name={name}
            value={option.id}
            checked={option.id === value}
            onChange={() => onChange(option.id)}
          />
          {option.dot && <span className={styles.dot} style={{ background: option.dot }} aria-hidden="true" />}
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
