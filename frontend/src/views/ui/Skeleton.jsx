// VISTA: bloque gris que ocupa el sitio de lo que está cargando (mejora la sensación de velocidad).
import styles from './Skeleton.module.css';

export default function Skeleton({ width = '100%', height = 16, className = '' }) {
  return <span className={`${styles.bone} ${className}`} style={{ width, height }} aria-hidden="true" />;
}
