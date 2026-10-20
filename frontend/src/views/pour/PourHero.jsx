// VISTA: la portada con estética vintage de cartelería y almazara (DESIGN.md).
// Combina:
//  - Titular monumental con interlineado apretado y actitud de valla pintada.
//  - Gran Gota de Aceite protagonista (OilSphere), orgánica y translúcida.
//  - Sello circular de autenticidad de la Unión Europea (Trace Seal).
//  - Botón píldora pura (1000px) en Honeycomb Gold sobre Dark Cocoa.
//  - Tarjeta de cotización destacada con código de trazabilidad tipográfico.
import { dateIso, decimal } from '../../models/format.js';
import Delta from '../ui/Delta.jsx';
import OilSphere from './OilSphere.jsx';
import ParticleField from './ParticleField.jsx';
import styles from './PourHero.module.css';

export default function PourHero({ vm }) {
  const last = vm?.series?.points?.[vm.series.points.length - 1];

  return (
    <section className={styles.hero} data-hero aria-label="Portada">
      <div className={styles.sphereWrap}>
        <OilSphere />
      </div>
      <ParticleField />

      <div className={styles.copy}>
        <p className={styles.label}>
          <span className={styles.badgeTag}>UE</span>
          Precios del aceite en origen · Comisión Europea
        </p>

        <h1 className={styles.title}>
          El aceite
          <br />
          de oliva,
          <br />
          <span>gota a gota.</span>
        </h1>

        <p className={styles.lead}>
          Cotizaciones semanales en <strong className={styles.highlight}>España, Italia, Grecia y Portugal</strong>, con su serie histórica, volúmenes de producción y una previsión honesta.
        </p>

        <div className={styles.actions}>
          <a className={styles.cta} href="#mercado">
            Ver cotizaciones
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </a>
          <a className={styles.ghost} href="#metodo">
            Cómo se calcula
          </a>
        </div>

        {last ? (
          <a className={styles.card} href="#mercado" aria-label={`Ver el mercado de ${vm.productLabel} en ${vm.countryLabel}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTag}>MERCADO ACTIVO</span>
              <span className={styles.cardLabel}>
                {vm.productLabel} · {vm.countryLabel}
              </span>
            </div>
            <span className={styles.cardPrice}>
              {decimal(last.price, 2)} <small>€/t</small>
            </span>
            <span className={styles.cardMeta}>
              <Delta value={vm.changes.week?.pct} digits={2} unit="%" />
              <span className={styles.cardDate}>Semana del {dateIso(last.date)}</span>
            </span>
          </a>
        ) : (
          <div className={styles.cardSkeleton} aria-hidden="true" />
        )}
      </div>

      <p className={styles.serial} aria-hidden="true">
        Oleómetro · Registro Abierto UE · Edición 2026
      </p>
    </section>
  );
}