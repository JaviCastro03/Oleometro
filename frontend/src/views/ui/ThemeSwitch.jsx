// VISTA: botón de modo claro/oscuro. Para lectores de pantalla es un interruptor real (role="switch").
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeSwitch.module.css';

export default function ThemeSwitch({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Modo oscuro" className={styles.switch} onClick={onToggle}>
      {dark ? <Moon size={16} strokeWidth={2} aria-hidden="true" /> : <Sun size={16} strokeWidth={2} aria-hidden="true" />}
      <span className={styles.text}>{dark ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}
