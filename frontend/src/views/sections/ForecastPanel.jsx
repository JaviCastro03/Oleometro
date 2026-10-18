// VISTA (la "V" de MVC): panel "Qué puede pasar".
// Solo dibuja: los números ya vienen calculados por Python (backend) y por el modelo (dashboardModel.js).
// Props: vm = el "view model" con la serie elegida y su previsión.
import { useId, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { countryColor } from '../../models/constants.js';
import { buildTimeAxis, describeBacktest, FORECAST_HORIZONS, forecastChartRows, forecastLabel } from '../../models/dashboardModel.js';
import { dateLong, dateShort, eur, eurCompact, pct } from '../../models/format.js';
import GliderRadio from '../ui/GliderRadio.jsx';
import SpotlightCard from '../ui/SpotlightCard.jsx';
import tip from './ChartTooltip.module.css';
import panel from './panel.module.css';
import styles from './ForecastPanel.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };

// Hasta dónde se dibuja el gráfico (en semanas). Es solo un ajuste visual, por eso vive aquí.
const CHART_SPAN = [
  { id: '13', label: '3 meses' },
  { id: '26', label: '6 meses' },
  { id: '52', label: '1 año' },
];

const ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

function HorizonCard({ horizon }) {
  const Icon = ICONS[horizon.direction];
  const meta = FORECAST_HORIZONS[horizon.key];
  return (
    <SpotlightCard as="article" className={styles.card}>
      <h3 className={styles.cardTitle}>{meta.title}</h3>
      <p className={`${styles.verdict} ${styles[horizon.direction]}`}>
        <Icon size={20} strokeWidth={2.6} aria-hidden="true" />
        {forecastLabel(horizon)}
      </p>
      <p className={styles.price}>
        {eur(horizon.price)}
        <small> /t</small>
      </p>
      <p className={styles.note}>
        Entre {eur(horizon.low)} y {eur(horizon.high)}
        <br />({pct(horizon.change_pct, 1)} · {dateLong(horizon.target_date)})
      </p>
      {horizon.key === 'year' && <p className={styles.caution}>A un año el margen es muy amplio.</p>}
    </SpotlightCard>
  );
}

function ForecastTooltip({ active, payload, color }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const isForecast = row.price == null;
  return (
    <div className={tip.tip}>
      <p className={tip.title}>
        {dateShort(row.t)}
        {isForecast ? ' · previsión' : ''}
      </p>
      <ul className={tip.list}>
        <li>
          <span className={tip.swatch} style={{ background: color }} />
          <span>{isForecast ? 'Estimado' : 'Precio'}</span>
          <strong>{eur(isForecast ? row.forecast : row.price)}/t</strong>
        </li>
        {isForecast && (
          <li>
            <span />
            <span>Rango</span>
            <strong>
              {eur(row.band[0])} – {eur(row.band[1])}
            </strong>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function ForecastPanel({ vm }) {
  const uid = useId();
  const headingId = `${uid}-h`;
  const [span, setSpan] = useState('13');
  const forecast = vm.forecast;
  const color = countryColor(vm.selection.country);

  const rows = useMemo(() => forecastChartRows(vm.series, Number(span)), [vm.series, span]);
  const axis = useMemo(() => buildTimeAxis(rows), [rows]);
  const nowT = vm.series?.points[vm.series.points.length - 1]?.t;

  // Sin previsión (serie demasiado corta) no pintamos el panel.
  if (!forecast) return null;

  // El backtest que se enseña es el de 1 mes, el horizonte más útil para decidir.
  const month = forecast.horizons.find((h) => h.key === 'month');
  const reliability = describeBacktest(month?.backtest);

  return (
    <SpotlightCard as="section" className={panel.panel} aria-labelledby={headingId}>
      <header className={panel.head}>
        <div>
          <h2 id={headingId} className={panel.title}>
            Qué puede pasar
          </h2>
          <p className={panel.sub}>
            Estimación de {vm.productLabel} en {vm.countryLabel} según su histórico: tendencia, época del año y un rango donde el precio debería caer el 80 % de las veces.
          </p>
        </div>
        <GliderRadio name="forecast-span" label="Hasta" size="sm" options={CHART_SPAN} value={span} onChange={setSpan} />
      </header>

      <div className={styles.cards}>
        {forecast.horizons.map((h) => (
          <HorizonCard key={h.key} horizon={h} />
        ))}
      </div>

      <div
        className={panel.chartShort}
        role="img"
        aria-label={`Gráfico con el precio del último año y la previsión de las próximas ${span} semanas. Las tarjetas de arriba resumen los mismos datos.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={axis.ticks}
              tickFormatter={axis.format}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tickMargin={8}
            />
            <YAxis tickFormatter={eurCompact} tick={tick} tickLine={false} axisLine={false} width={52} domain={['auto', 'auto']} />
            <Tooltip cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }} content={<ForecastTooltip color={color} />} />
            <Area dataKey="band" stroke="none" fill={color} fillOpacity={0.18} isAnimationActive={false} activeDot={false} />
            <Line dataKey="price" stroke={color} strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2, fill: color }} animationDuration={700} />
            <Line dataKey="forecast" stroke={color} strokeWidth={2.4} strokeDasharray="6 5" dot={false} connectNulls={false} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2, fill: color }} animationDuration={700} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.legend}>
        <span className={styles.item}>
          <span className={styles.solid} style={{ borderColor: color }} aria-hidden="true" /> Precio real
        </span>
        <span className={styles.item}>
          <span className={styles.dashed} style={{ borderColor: color }} aria-hidden="true" /> Estimación
        </span>
        <span className={styles.item}>
          <span className={styles.band} style={{ background: color }} aria-hidden="true" /> Rango del 80 %
        </span>
        {nowT && <span className={styles.item}>Última semana con datos: {dateShort(nowT)}</span>}
      </p>

      <div className={styles.trust}>
        <h3 className={styles.trustTitle}>¿Cuánto fiarse? Así de bien lo habría hecho antes</h3>
        <p>{reliability ?? 'No hay suficiente histórico para comprobar el método.'}</p>
        <p className={styles.disclaimer}>
          Es una estimación estadística hecha solo con el histórico de precios. No conoce el clima, la cosecha ni la política, que son lo que más mueve este mercado. Úsala como orientación y no como asesoramiento financiero.
        </p>
      </div>
    </SpotlightCard>
  );
}
