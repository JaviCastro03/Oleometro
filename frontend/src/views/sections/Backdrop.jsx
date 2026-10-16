import styles from './Backdrop.module.css';

/** Fixed decorative layers: slow aurora, blueprint grid and film grain. */
export default function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <span className={`${styles.blob} ${styles.a}`} />
      <span className={`${styles.blob} ${styles.b}`} />
      <span className={`${styles.blob} ${styles.c}`} />
      <span className={styles.grid} />
      <span className={styles.grain} />
    </div>
  );
}
