// VISTA: contenedor común de cada sección (título, subtítulo y controles opcionales).
// Es una superficie plana con borde fino: sin sombras ni esquinas muy redondeadas.
// Props: id (ancla para el menú), title, sub, actions (controles a la derecha), children.
import { useId } from 'react';
import styles from './Panel.module.css';

export default function Panel({ id, title, sub, actions, children, className = '' }) {
  const headingId = `${useId()}-h`;
  return (
    <section id={id} className={`${styles.panel} ${className}`} aria-labelledby={headingId}>
      <header className={styles.head}>
        <div className={styles.titles}>
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {sub && <p className={styles.sub}>{sub}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </section>
  );
}
