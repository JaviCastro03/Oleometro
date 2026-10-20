// VISTA: la primera pantalla. El protagonista es el precio, con todo lo necesario para no
// confundirlo: qué aceite, qué mercado, qué unidad, de qué fecha y cuánto ha variado.
// Props: model (datos), vm (view model con la selección y los cálculos), actions (cambiar la selección).
import { perKg } from '../../models/dashboardModel.js';
import { countryColor } from '../../models/constants.js';
import { dateIso, decimal, eur } from '../../models/format.js';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';
import Delta from '../ui/Delta.jsx';
import GliderRadio from '../ui/GliderRadio.jsx';
import RangeBar from '../ui/RangeBar.jsx';
import styles from './Hero.module.css';

// Formatos estables (mismo objeto siempre) para AnimatedNumber.
const wholePart = (n) => decimal(n, 2).split(',')[0];
const centsPart = (n) => `,${decimal(n, 2).split(',')[1]}`;

function Change({ label, change, withAbs = true }) {
  return (
    <div className={styles.change}>
      <dt>{label}</dt>
      <dd>
        <Delta value={change?.pct} digits={2} unit="%" />
        {withAbs && change && <span className={styles.abs}>{`${change.abs > 0 ? '+' : change.abs < 0 ? '−' : ''}${decimal(Math.abs(change.abs), 2)} €/t`}</span>}
      </dd>
    </div>
  );
}

export default function Hero({ model, vm, actions }) {
  const { insight } = vm.series;
  const last = vm.series.points[vm.series.points.length - 1];
  const countries = model.countries.map((c) => ({ id: c.id, label: c.label, dot: countryColor(c.id) }));
  const rangePosition = insight.level;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.main}>
        <div className={styles.controls}>
          <GliderRadio name="country" label="Mercado" options={countries} value={vm.selection.country} onChange={actions.setCountry} />
          <GliderRadio name="product" label="Calidad del aceite" options={model.products} value={vm.selection.product} onChange={actions.setProduct} />
        </div>

        <h2 id="hero-title" className={styles.title}>
          Aceite de oliva {vm.productLabel.toLowerCase()} en {vm.countryLabel}
        </h2>

        <p className={styles.price}>
          <span className="sr-only">{eur(last.price)} por tonelada</span>
          <span aria-hidden="true" className={styles.whole}>
            <AnimatedNumber value={last.price} format={wholePart} />
          </span>
          <span aria-hidden="true" className={styles.cents}>
            <AnimatedNumber value={last.price} format={centsPart} />
          </span>
          <span aria-hidden="true" className={styles.unit}>
            €/t
          </span>
        </p>

        <p className={styles.asof}>
          Precio medio semanal en origen. Semana del <strong>{dateIso(last.date)}</strong>. Equivale a{' '}
          <strong>{decimal(perKg(last.price), 2)} €/kg</strong>.
        </p>

        <dl className={styles.changes}>
          <Change label="Frente a la semana anterior" change={vm.changes.week} />
          <Change label="Frente a 4 semanas" change={vm.changes.month} />
          <Change label="Frente a hace un año" change={vm.changes.year} />
          <Change label="Frente al máximo histórico" change={vm.changes.peak} />
        </dl>

        <p className={styles.summary}>{vm.summary}</p>
      </div>

      <figure className={styles.gauge}>
        <div className={styles.barWrap}>
          <RangeBar position={rangePosition} tone="oil" label={`Al ${Math.round(rangePosition * 100)} % de su rango histórico`} />
          <span className={styles.barMin}>mín. {eur(insight.trough_price)}</span>
          <span className={styles.barMax}>máx. {eur(insight.peak_price)}</span>
        </div>
        <figcaption className={styles.caption}>
          Posición del precio actual dentro de su rango histórico, entre el mínimo ({eur(insight.trough_price)}) y el máximo (
          {eur(insight.peak_price)}).
        </figcaption>
      </figure>
    </section>
  );
}
