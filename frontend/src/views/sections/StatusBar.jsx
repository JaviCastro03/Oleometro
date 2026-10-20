// VISTA: franja superior con el estado REAL de los datos.
// Los precios son semanales y llegan con retraso, así que nunca se habla de "tiempo real":
// se dice cuál es el último dato disponible y cuándo se descargó. El punto no es verde
// ("conectado"): es neutro si todo está al día y de aviso si hay retraso, demo o falta de conexión.
// Props: freshness (lo calcula dataStatus en el modelo).
import { dateIso, dateTimeMadrid } from '../../models/format.js';
import styles from './StatusBar.module.css';

export default function StatusBar({ freshness }) {
  if (!freshness) {
    return (
      <div className={styles.bar} role="status">
        <p className={styles.main}>Cargando los últimos precios…</p>
      </div>
    );
  }
  const { state, label, lastDate, generatedAt } = freshness;
  const showDate = state !== 'demo' && state !== 'offline';

  return (
    <div className={`${styles.bar} ${styles[state]}`} role="status" aria-live="polite">
      <p className={styles.main}>
        <span className={styles.dot} aria-hidden="true" />
        <span>
          {label}
          {showDate && (
            <>
              : <strong>{dateIso(lastDate)}</strong>
            </>
          )}
        </span>
      </p>
      <p className={styles.meta}>
        Precios semanales. Descargados el {dateTimeMadrid(generatedAt)}. Fuente: Comisión Europea.
      </p>
    </div>
  );
}
