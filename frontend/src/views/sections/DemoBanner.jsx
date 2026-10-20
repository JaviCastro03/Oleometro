// VISTA: aviso visible cuando los datos son de demostración (sintéticos), para no engañar a nadie.
import { FlaskConical } from 'lucide-react';
import styles from './Notice.module.css';

export default function DemoBanner() {
  return (
    <aside className={styles.notice} role="note">
      <FlaskConical size={18} aria-hidden="true" />
      <p>
        <strong>Datos de demostración.</strong> Estas series son sintéticas y siguen referencias públicas; no son cifras oficiales. La
        actualización semanal las sustituye por los datos de la Comisión Europea.
      </p>
    </aside>
  );
}
