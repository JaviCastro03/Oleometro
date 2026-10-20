// VISTA: pie de página sobrio con la procedencia de los datos y enlaces útiles.
import { DATA_URL } from '../../services/dashboardService.js';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.mega} aria-hidden="true">
        Oleómetro
      </p>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>Oleómetro</p>
          <p className={styles.text}>
            Precios del aceite de oliva en origen con datos abiertos de la Comisión Europea. Proyecto personal de código abierto, sin
            publicidad ni seguimiento.
          </p>
        </div>
        <nav aria-label="Enlaces" className={styles.links}>
          <a href="https://github.com/JaviCastro03/Oleometro" target="_blank" rel="noreferrer">
            Código en GitHub
          </a>
          <a href="https://agridata.ec.europa.eu/extensions/DataPortal/olive-oil.html" target="_blank" rel="noreferrer">
            Agri-food Data Portal
          </a>
          <a href={DATA_URL} download="oleometro-datos.json">
            Datos (JSON)
          </a>
        </nav>
      </div>
      <p className={styles.legal}>
        La información es orientativa y no constituye asesoramiento financiero ni una cotización oficial. Hecho por{' '}
        <a href="https://github.com/JaviCastro03" target="_blank" rel="noreferrer">
          JaviCastro03
        </a>
        .
      </p>
    </footer>
  );
}
