import { dateLong } from '../../models/format.js';
import styles from './Footer.module.css';

export default function Footer({ meta }) {
  return (
    <footer className={styles.footer}>
      <div>
        <p className={styles.strong}>De dónde salen los datos</p>
        <p>
          Precios y producción de la{' '}
          <a href="https://agridata.ec.europa.eu/extensions/DataPortal/olive-oil.html" target="_blank" rel="noreferrer">
            Comisión Europea (Agri-food Data Portal)
          </a>
          . Los precios son medias semanales en origen y se convierten a euros por tonelada.
          {meta && (
            <>
              {' '}
              Último dato: {dateLong(meta.last_date)}.
            </>
          )}
        </p>
      </div>
      <div>
        <p className={styles.strong}>Cómo está hecho</p>
        <p>
          API en Python (FastAPI) y frontend en React, los dos con arquitectura MVC. Algunos componentes están inspirados
          en la comunidad de{' '}
          <a href="https://uiverse.io" target="_blank" rel="noreferrer">
            Uiverse
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
