import { Moon, Sun } from 'lucide-react';
import styles from './ThemeSwitch.module.css';

/** Day/night switch. Exposed as a real switch for assistive tech. */
export default function ThemeSwitch({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      className={styles.switch}
      onClick={onToggle}
    >
      <span className={styles.stars} aria-hidden="true">
        <i /> <i /> <i />
      </span>
      <span className={styles.cloud} aria-hidden="true" />
      <span className={styles.knob} aria-hidden="true">
        {dark ? <Moon size={16} strokeWidth={2.4} /> : <Sun size={16} strokeWidth={2.4} />}
      </span>
    </button>
  );
}
