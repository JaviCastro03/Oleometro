import { FlaskConical } from 'lucide-react';
import styles from './DemoBanner.module.css';

export default function DemoBanner() {
  return (
    <aside className={styles.banner} role="note">
      <FlaskConical size={20} aria-hidden="true" />
      <p>
        <strong>Datos de demostración.</strong> Estas series son sintéticas y siguen referencias públicas; no son cifras
        oficiales. La actualización semanal las sustituye por los datos de la Comisión Europea.
      </p>
    </aside>
  );
}
