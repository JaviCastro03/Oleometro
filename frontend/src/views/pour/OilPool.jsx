// VISTA: el charco de aceite (OilPool) en la base de la página.
// Un remanso de aceite de oliva virgen extra líquido, denso y luminoso:
// - Olas fluidas de doble cresta con reflejo dorado especular.
// - Colores adaptados armónicamente tanto para el tema oscuro como para el tema claro:
//   * Modo oscuro: oro miel profundo que se funde en ámbar y cacao natural.
//   * Modo claro: oro puro translúcido y cálido, evitando tonos oscuros o cortes bruscos sobre el pergamino.
import styles from './OilPool.module.css';

const WAVE_BACK = (() => {
  let d = 'M0 32';
  for (let x = 0; x < 2880; x += 240) d += ' q60 -24 120 0 t120 0';
  return `${d} V80 H0 Z`;
})();

const WAVE_FRONT = (() => {
  let d = 'M0 26';
  for (let x = 0; x < 2880; x += 240) d += ' q60 -28 120 0 t120 0';
  return `${d} V80 H0 Z`;
})();

export default function OilPool() {
  return (
    <div className={styles.pool} data-pool aria-hidden="true">
      <div className={styles.liquid}>
        <svg className={styles.waves} viewBox="0 0 2880 80" preserveAspectRatio="none">
          <defs>
            {/* Ola trasera: profundidad translúcida según el tema */}
            <linearGradient id="waveDeepGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--pool-back-0)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="var(--pool-back-1)" stopOpacity="0.75" />
              <stop offset="100%" stopColor="var(--pool-back-2)" stopOpacity="0.95" />
            </linearGradient>

            {/* Ola delantera: cresta iluminada y cuerpo dorado */}
            <linearGradient id="waveFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--pool-front-0)" />
              <stop offset="22%" stopColor="var(--pool-front-1)" />
              <stop offset="60%" stopColor="var(--pool-front-2)" />
              <stop offset="100%" stopColor="var(--pool-front-3)" />
            </linearGradient>
          </defs>

          <g className={styles.back}>
            <path d={WAVE_BACK} fill="url(#waveDeepGrad)" />
          </g>
          <g className={styles.front}>
            <path d={WAVE_FRONT} fill="url(#waveFrontGrad)" />
          </g>
        </svg>

        {/* Cuerpo del charco de aceite */}
        <div className={styles.body}>
          <div className={styles.surfaceSheen} />
          <div className={styles.ambientGlow} />
        </div>
      </div>
    </div>
  );
}