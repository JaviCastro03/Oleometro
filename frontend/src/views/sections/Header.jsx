// VISTA: cabecera fija con la marca, el menú de secciones y el cambio de tema.
// Inspirada en la barra de navegación de DESIGN (3).md: estilo editorial Dark Cocoa / Cream Parchment,
// enlaces en mayúsculas espaciadas y marca icónica de la gota de aceite.
import ThemeSwitch from '../ui/ThemeSwitch.jsx';
import styles from './Header.module.css';

const NAV = [
  { href: '#mercado', label: 'Mercado' },
  { href: '#evolucion', label: 'Evolución' },
  { href: '#prevision', label: 'Previsión' },
  { href: '#contexto', label: 'Contexto' },
  { href: '#metodo', label: 'Calculadora' },
];

// La marca: una gota de aceite dorada con reflejo líquido
function Mark() {
  return (
    <svg viewBox="0 0 32 36" width="26" height="30" aria-hidden="true">
      <defs>
        <linearGradient id="headerDropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff2ab" />
          <stop offset="35%" stopColor="var(--color-honeycomb-gold, #ffca50)" />
          <stop offset="100%" stopColor="var(--amber, #e08a22)" />
        </linearGradient>
      </defs>
      <path
        d="M 16 3 C 16 3 26 14 26 22 C 26 27.5 21.5 32 16 32 C 10.5 32 6 27.5 6 22 C 6 14 16 3 16 3 Z"
        fill="url(#headerDropGrad)"
      />
      <path
        d="M 12 18 C 11.5 21 13 24 16 26"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="16" cy="34" r="1.5" fill="var(--color-honeycomb-gold, #ffca50)" />
    </svg>
  );
}

export default function Header({ theme }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#mercado" aria-label="Oleómetro, ir al inicio">
          <Mark />
          <span className={styles.name}>Oleómetro</span>
        </a>
        <nav className={styles.nav} aria-label="Secciones">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <ThemeSwitch theme={theme.theme} onToggle={theme.toggle} />
      </div>
    </header>
  );
}