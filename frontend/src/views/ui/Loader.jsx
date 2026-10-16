import styles from './Loader.module.css';

/** Three olive-oil drops bouncing. */
export default function Loader({ label = 'Cargando precios…' }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.drops} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>{label}</p>
    </div>
  );
}
