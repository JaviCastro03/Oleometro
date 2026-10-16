import { countryColor } from '../../models/constants.js';
import styles from './ColorKey.module.css';

/**
 * Legend for country series. With `onToggle` it doubles as a filter:
 * each entry is a pressed/unpressed button, never colour alone.
 */
export default function ColorKey({ items, hidden, onToggle }) {
  return (
    <ul className={styles.key} aria-label="Leyenda">
      {items.map(({ id, label }) => {
        const off = hidden?.has(id);
        const swatch = <span className={styles.swatch} style={{ background: countryColor(id) }} aria-hidden="true" />;
        return (
          <li key={id}>
            {onToggle ? (
              <button type="button" className={styles.chip} aria-pressed={!off} onClick={() => onToggle(id)}>
                {swatch}
                {label}
              </button>
            ) : (
              <span className={styles.chip}>
                {swatch}
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
