// VISTA: estados de carga y de error. Cada uno dice qué pasa y qué puede hacer la persona.
import { RotateCw } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';
import styles from './States.module.css';

/** Esqueleto con la misma forma que la portada, para que no salte el diseño al cargar. */
export function LoadingState() {
  return (
    <div className={styles.loading} role="status" aria-label="Cargando los últimos precios">
      <Skeleton width={260} height={32} />
      <Skeleton width={320} height={22} />
      <Skeleton width="min(100%, 560px)" height={120} />
      <Skeleton width="min(100%, 640px)" height={48} />
      <Skeleton height={260} />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.error} role="alert">
      <h2>No se han podido cargar los precios</h2>
      <p>{message}. Comprueba tu conexión e inténtalo de nuevo.</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        <RotateCw size={15} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
