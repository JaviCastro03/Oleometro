// VISTA: panel "Previsión". Solo dibuja: los números los calcula Python (backend) y el modelo.
// Muestra, para 1 semana, 1 mes y 1 año: el valor estimado, su rango del 80 % y la dirección,
// y debajo cuánto habría acertado el método en el pasado (para que se sepa cuánto fiarse).
// Props: vm = view model con la serie elegida y su previsión (o null si no hay datos suficientes).
import { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { countryColor } from '../../models/constants.js';
import { buildTimeAxis, describeBacktest, FORECAST_HORIZONS, forecastChartRows, forecastLabel } from '../../models/dashboardModel.js';
import { dateLong, dateShort, decimal, eur, eurCompact } from '../../models/format.js';
import Delta from '../ui/Delta.jsx';
import GliderRadio from '../ui/GliderRadio.jsx';
import Panel from '../ui/Panel.jsx';
import tip from './ChartTooltip.module.css';
import styles from './ForecastPanel.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };

// Hasta dónde se dibuja el gráfico (en semanas). Es solo un ajuste visual, por eso vive aquí.
const CHART_SPAN = [
  { id: '13', label: '3 m' },
  { id: '26', label: '6 m' },
  { id: '52', label: '1 a' },
];

function Horizon({ horizon }) {
  const meta = FORECAST_HORIZONS[horizon.key];
  return (
    <article className={styles.horizon}>
      <h3 className={styles.hTitle}>{meta.title}</h3>
      <p className={`${styles.verdict} ${styles[horizon.direction]}`}>{forecastLabel(horizon)}</p>
      <p className={styles.price}>
        {decimal(horizon.price, 0)}
        <small> €/t</small>
      </p>
      <p className={styles.range}>
        Rango del 80 %: {eur(horizon.low)} a {eur(horizon.high)}
      </p>
      <p className={styles.when}>
        <Delta value={horizon.change_pct} digits={1} size="sm" /> hacia el {dateLong(horizon.target_date)}
      </p>
      {horizon.key === 'year' && <p className={styles.caution}>A un año el margen es muy amplio.</p>}
    </article>
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
        {isForecast ? ' (previsión)' : ''}
      </p>
      <ul className={tip.list}>
        <li>
          <span className={tip.swatch} style={{ background: color }} />
          <span>{isForecast ? 'Estimado' : 'Precio'}</span>
          <strong>{decimal(isForecast ? row.forecast : row.price, 2)} €/t</strong>
        </li>
        {isForecast && (
          <li>
            <span />
            <span>Rango</span>
            <strong>
              {eur(row.band[0])} a {eur(row.band[1])}
            </strong>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function ForecastPanel({ vm }) {
  const [span, setSpan] = useState('13');
  const forecast = vm.forecast;
  const color = countryColor(vm.selection.country);

  const rows = useMemo(() => forecastChartRows(vm.series, Number(span)), [vm.series, span]);
  const axis = useMemo(() => buildTimeAxis(rows), [rows]);

  // Sin previsión (serie corta, con huecos largos o sin datos recientes) lo decimos en vez de esconder el panel.
  if (!forecast) {
    return (
      <Panel id="prevision" title="Previsión" sub={`No hay previsión para ${vm.productLabel} en ${vm.countryLabel}.`}>
        <p className={styles.empty}>
          La fuente no publica suficientes datos seguidos o recientes para estimar el precio con honestidad. Prueba con otro mercado o
          calidad en la tabla de cotizaciones.
        </p>
      </Panel>
    );
  }

  // El backtest que se enseña es el de 1 mes, el horizonte más útil para decidir.
  const month = forecast.horizons.find((h) => h.key === 'month');
  const reliability = describeBacktest(month?.backtest);
  const nowT = vm.series.points[vm.series.points.length - 1].t;

  return (
    <Panel
      id="prevision"
      title="Previsión"
      sub={`Estimación de ${vm.productLabel} en ${vm.countryLabel} a partir de su histórico: tendencia, época del año y un rango donde el precio debería caer el 80 % de las veces.`}
      actions={<GliderRadio name="forecast-span" label="Horizonte del gráfico" size="sm" options={CHART_SPAN} value={span} onChange={setSpan} />}
    >
      <div className={styles.horizons}>
        {forecast.horizons.map((h) => (
          <Horizon key={h.key} horizon={h} />
        ))}
      </div>

      <div
        className={styles.chart}
        role="img"
        aria-label={`Gráfico con el precio del último año y la previsión de las próximas ${span} semanas. Las cifras de arriba resumen los mismos datos.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={axis.ticks} tickFormatter={axis.format} tick={tick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} tickMargin={8} />
            <YAxis orientation="right" tickFormatter={eurCompact} tick={tick} tickLine={false} axisLine={false} width={50} domain={['auto', 'auto']} />
            <Tooltip cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }} content={<ForecastTooltip color={color} />} />
            <Area dataKey="band" stroke="none" fill={color} fillOpacity={0.18} isAnimationActive={false} activeDot={false} />
            <Line dataKey="price" stroke={color} strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 4.5, stroke: 'var(--panel)', strokeWidth: 2, fill: color }} animationDuration={600} />
            <Line dataKey="forecast" stroke={color} strokeWidth={2.2} strokeDasharray="6 5" dot={false} connectNulls={false} activeDot={{ r: 4.5, stroke: 'var(--panel)', strokeWidth: 2, fill: color }} animationDuration={600} />
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
        <span className={styles.item}>Última semana con datos: {dateShort(nowT)}</span>
      </p>

      <div className={styles.trust}>
        <h3 className={styles.trustTitle}>¿Cuánto fiarse? Así de bien lo habría hecho antes</h3>
        <p>{reliability ?? 'No hay suficiente histórico para comprobar el método.'}</p>
        <p className={styles.disclaimer}>
          Es una estimación estadística hecha solo con el histórico de precios. No conoce el clima, la cosecha ni la política, que son lo
          que más mueve este mercado. Úsala como orientación y no como asesoramiento financiero.
        </p>
      </div>
    </Panel>
  );
}
