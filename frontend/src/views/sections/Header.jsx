import { Download } from 'lucide-react';
import { DATA_URL } from '../../services/dashboardService.js';
import GlowButton from '../ui/GlowButton.jsx';
import ThemeSwitch from '../ui/ThemeSwitch.jsx';
import styles from './Header.module.css';

function Logo() {
  return (
    <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
      <defs>
        <linearGradient id="logo-oil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d35c" />
          <stop offset="1" stopColor="#8e8a1a" />
        </linearGradient>
      </defs>
      <path d="M32 4C22 18 14 28 14 40a18 18 0 0 0 36 0C50 28 42 18 32 4Z" fill="url(#logo-oil)" />
      <path d="M24 42a8 8 0 0 0 6 8" stroke="#fff" strokeOpacity=".65" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Header({ theme }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#contenido" aria-label="Oleómetro, inicio">
        <Logo />
        <span>Oleómetro</span>
      </a>
      <div className={styles.actions}>
        <GlowButton href={DATA_URL} download="oleometro-datos.json" icon={<Download size={16} aria-hidden="true" />}>
          Descargar datos
        </GlowButton>
        <ThemeSwitch theme={theme.theme} onToggle={theme.toggle} />
      </div>
    </header>
  );
}
