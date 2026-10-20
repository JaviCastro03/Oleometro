import { motion } from 'framer-motion';
import { useId } from 'react';
import { eur } from '../../models/format.js';
import styles from './OilBottle.module.css';

const BODY =
  'M92 40 L92 112 C92 150 52 160 52 206 L52 372 Q52 396 76 396 L144 396 Q168 396 168 372 L168 206 C168 160 128 150 128 112 L128 40 Z';
const WAVE =
  'M0 10 Q27.5 0 55 10 T110 10 T165 10 T220 10 T275 10 T330 10 T385 10 T440 10 V460 H0 Z';
const SURFACE_FULL = 130; // y of the liquid surface when the price sits at its maximum
const SURFACE_EMPTY = 382; // ...and at its minimum

/**
 * VISTA: una botella que se llena según dónde está el precio actual dentro de su
 * rango histórico (mínimo = vacía, máximo = llena). Es el elemento expresivo de la
 * página, y es un dato: la marca de la izquierda indica el precio exacto.
 * Props: level (0..1), price, min, max, product y country (textos).
 */
export default function OilBottle({ level, price, min, max, product, country }) {
  const id = useId();
  const clamped = Math.min(1, Math.max(0, level ?? 0));
  const surface = SURFACE_EMPTY - clamped * (SURFACE_EMPTY - SURFACE_FULL);

  return (
    <svg
      className={styles.bottle}
      viewBox="0 0 340 420"
      role="img"
      aria-label={`${product} en ${country}: ${eur(price)} por tonelada, al ${Math.round(clamped * 100)} % de su rango histórico, entre ${eur(min)} y ${eur(max)}.`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={BODY} />
        </clipPath>
        {/* El aceite: del acento claro arriba a un tono más hondo abajo (como el aceite real en una botella). */}
        <linearGradient id={`${id}-oil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--oil)" />
          <stop offset="1" stopColor="var(--oil-deep)" />
        </linearGradient>
      </defs>

      <g transform="translate(40 0)">
        <path d={BODY} className={styles.glass} />

        <g clipPath={`url(#${id}-clip)`}>
          <motion.g
            initial={{ y: 440 }}
            animate={{ y: surface - 5 }}
            transition={{ duration: 2, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <g className={styles.waveBack}>
              <path d={WAVE} fill={`url(#${id}-oil)`} opacity="0.5" />
            </g>
            <g className={styles.waveFront}>
              <path d={WAVE} fill={`url(#${id}-oil)`} />
            </g>
          </motion.g>
        </g>

        <path d={BODY} className={styles.outline} />

        <rect x="88" y="8" width="44" height="34" rx="3" className={styles.cap} />
        <path d="M96 14 V36 M104 14 V36 M112 14 V36 M120 14 V36" className={styles.ridges} />

        <rect x="62" y="262" width="96" height="82" rx="3" className={styles.label} />
        <text x="110" y="284" textAnchor="middle" className={styles.labelSmall}>
          Aceite de oliva
        </text>
        <path d="M84 292 H136" className={styles.rule} />
        <text x="110" y="314" textAnchor="middle" className={styles.labelTitle}>
          {product}
        </text>
        <text x="110" y="334" textAnchor="middle" className={styles.labelSmall}>
          {country}
        </text>
      </g>

      {/* Scale: where the price sits between its minimum and maximum. */}
      <g className={styles.scale}>
        <path d={`M216 ${SURFACE_FULL} H228`} />
        <path d={`M216 ${SURFACE_EMPTY} H228`} />
        <text x="234" y={SURFACE_FULL + 4}>máx. {eur(max)}</text>
        <text x="234" y={SURFACE_EMPTY + 4}>mín. {eur(min)}</text>
      </g>

      <motion.g
        className={styles.current}
        initial={{ y: 440 - surface, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <path d={`M86 ${surface} H92`} />
        <text x="80" y={surface + 5} textAnchor="end">
          {eur(price)}
        </text>
      </motion.g>
    </svg>
  );
}
