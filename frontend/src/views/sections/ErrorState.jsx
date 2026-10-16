import { RotateCw } from 'lucide-react';
import styles from './ErrorState.module.css';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.wrap} role="alert">
      <h2>No se han podido cargar los precios</h2>
      <p>{message}. Comprueba tu conexión e inténtalo de nuevo.</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        <RotateCw size={16} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
