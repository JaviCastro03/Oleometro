// VISTA: el contenedor de la página que alberga la portada (con la gran gota de aceite),
// las secciones de contenido y el charco de aceite (OilPool) en la base.
import OilPool from './OilPool.jsx';
import styles from './PourStage.module.css';

export default function PourStage({ hero, children }) {
  return (
    <div className={styles.stage}>
      <div className={styles.layer}>
        {hero}
        {children}
      </div>
      <OilPool />
    </div>
  );
}