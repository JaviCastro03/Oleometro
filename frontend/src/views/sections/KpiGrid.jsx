import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { countryColor } from '../../models/constants.js';
import { dateLong, dateShort, eur, pct } from '../../models/format.js';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';
import Sparkline from '../ui/Sparkline.jsx';
import SpotlightCard from '../ui/SpotlightCard.jsx';
import styles from './KpiGrid.module.css';

const formatEur = (n) => eur(n);
const formatPct = (n) => pct(n, 1);

function Delta({ value }) {
  if (value == null) return <span className={styles.none}>Sin dato</span>;
  const direction = value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat';
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  return (
    <span className={`${styles.delta} ${styles[direction]}`}>
      <Icon size={18} strokeWidth={2.6} aria-hidden="true" />
      <AnimatedNumber value={value} format={formatPct} />
    </span>
  );
}

function Kpi({ label, children, note, aside }) {
  return (
    <SpotlightCard as="article" className={styles.kpi}>
      <h3 className={styles.label}>{label}</h3>
      <div className={styles.value}>{children}</div>
      <div className={styles.foot}>
        <p className={styles.note}>{note}</p>
        {aside}
      </div>
    </SpotlightCard>
  );
}

export default function KpiGrid({ vm }) {
  const { insight, points } = vm.series;
  const recent = points.slice(-26).map((p) => p.price);

  return (
    <section className={styles.grid} aria-label="Indicadores clave">
      <Kpi
        label="Último precio"
        note={`Semana del ${dateShort(vm.series.points[points.length - 1].t)}`}
        aside={
          <span style={{ color: countryColor(vm.selection.country) }}>
            <Sparkline values={recent} />
          </span>
        }
      >
        <AnimatedNumber value={insight.latest_price} format={formatEur} />
        <small> /t</small>
      </Kpi>
      <Kpi label="Frente a la semana anterior" note="Variación del precio medio">
        <Delta value={insight.week_change_pct} />
      </Kpi>
      <Kpi label="Frente a hace un año" note="Misma semana del año anterior">
        <Delta value={insight.year_change_pct} />
      </Kpi>
      <Kpi label="Máximo histórico" note={dateLong(insight.peak_date)}>
        <AnimatedNumber value={insight.peak_price} format={formatEur} />
        <small> /t</small>
      </Kpi>
      <Kpi label="Distancia al máximo" note="Cuánto ha bajado desde el pico">
        <Delta value={insight.from_peak_pct} />
      </Kpi>
      <Kpi label="Media de 52 semanas" note={`Las subidas y bajadas semanales rondan el ${insight.volatility_52w.toLocaleString('es-ES')} %`}>
        <AnimatedNumber value={insight.avg_52w} format={formatEur} />
        <small> /t</small>
      </Kpi>
    </section>
  );
}
