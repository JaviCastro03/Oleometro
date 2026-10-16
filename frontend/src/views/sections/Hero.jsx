import { motion } from 'framer-motion';
import { countryColor } from '../../models/constants.js';
import { eur, monthYear, pct } from '../../models/format.js';
import GliderRadio from '../ui/GliderRadio.jsx';
import OilBottle from './OilBottle.jsx';
import styles from './Hero.module.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};

function headline(vm) {
  const { insight } = vm.series;
  const [year, month] = insight.peak_date.split('-').map(Number);
  const peak = monthYear(year, month - 1);
  const subject = `${vm.productLabel} en ${vm.countryLabel}`;
  if (insight.from_peak_pct > -0.5) {
    return `${subject} cotiza a ${eur(insight.latest_price)} por tonelada, en su máximo histórico (${peak}).`;
  }
  return `${subject} cotiza a ${eur(insight.latest_price)} por tonelada, un ${pct(Math.abs(insight.from_peak_pct), 0).replace('+', '')} por debajo de su máximo de ${peak}.`;
}

export default function Hero({ model, vm, actions }) {
  const { selection, series } = vm;
  const { insight } = series;
  const countryOptions = model.countries.map((c) => ({ ...c, dot: countryColor(c.id) }));

  return (
    <section className={styles.hero} aria-labelledby="titulo">
      <motion.div className={styles.copy} variants={container} initial="hidden" animate="show">
        <motion.h1 id="titulo" className={styles.title} variants={item}>
          El precio del aceite de oliva, semana a semana
        </motion.h1>
        <motion.p className={styles.lead} variants={item}>
          Precios medios en origen de los principales países productores de Europa, con datos abiertos de la Comisión
          Europea.
        </motion.p>

        <motion.div className={styles.filters} variants={item}>
          <div className={styles.filter}>
            <span className={styles.filterLabel}>País</span>
            <GliderRadio
              name="country"
              label="País"
              options={countryOptions}
              value={selection.country}
              onChange={actions.setCountry}
            />
          </div>
          <div className={styles.filter}>
            <span className={styles.filterLabel}>Calidad</span>
            <GliderRadio
              name="product"
              label="Calidad del aceite"
              options={model.products}
              value={selection.product}
              onChange={actions.setProduct}
            />
          </div>
        </motion.div>

        <motion.p className={styles.story} variants={item} aria-live="polite">
          {headline(vm)}
        </motion.p>
      </motion.div>

      <figure className={styles.figure}>
        <OilBottle
          level={insight.level}
          price={insight.latest_price}
          min={insight.trough_price}
          max={insight.peak_price}
          product={vm.productLabel}
          country={vm.countryLabel}
        />
        <figcaption>
          La botella se llena según dónde está el precio actual entre su mínimo y su máximo históricos:{' '}
          <strong>{Math.round(insight.level * 100)} %</strong>.
        </figcaption>
      </figure>
    </section>
  );
}
