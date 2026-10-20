// VISTA: gráfico principal de evolución del precio, con dos modos:
//  - "Una serie": el mercado y la calidad elegidos, con las cifras del periodo al lado.
//  - "Comparar países": la misma calidad en todos los países (se pueden ocultar series).
// Recharts dibuja los gráficos. Los números ya vienen calculados por el modelo (vm).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RANGES, countryColor } from '../../models/constants.js';
import { toCsv } from '../../models/dashboardModel.js';
import { dateIso, dateShort, decimal, eur, eurCompact, signed } from '../../models/format.js';
import Delta from '../ui/Delta.jsx';
import GliderRadio from '../ui/GliderRadio.jsx';
import Panel from '../ui/Panel.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import ColorKey from './ColorKey.jsx';
import DataTable from './DataTable.jsx';
import tipStyles from './ChartTooltip.module.css';
import styles from './PriceChartPanel.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };
const MODES = [
  { id: 'single', label: 'Una serie' },
  { id: 'compare', label: 'Comparar países' },
];
// El eje no empieza en cero: así se ven los movimientos. Se redondea a la centena para que quede limpio.
const yDomain = [(min) => Math.floor((min * 0.94) / 100) * 100, (max) => Math.ceil((max * 1.04) / 100) * 100];

function Cell({ label, children, note }) {
  return (
    <div className={styles.cell}>
      <dt>{label}</dt>
      <dd>{children}</dd>
      {note && <dd className={styles.cellNote}>{note}</dd>}
    </div>
  );
}

function PriceTooltip({ active, payload, color }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className={tipStyles.tip}>
      <p className={tipStyles.title}>Semana del {dateShort(row.t)}</p>
      <ul className={tipStyles.list}>
        <li>
          <span className={tipStyles.swatch} style={{ background: color }} />
          <span>Precio</span>
          <strong>{decimal(row.price, 2)} €/t</strong>
        </li>
      </ul>
      {row.delta != null && (
        <p className={tipStyles.foot}>
          {signed(row.delta, 2)} €/t frente a la semana anterior
        </p>
      )}
    </div>
  );
}

export default function PriceChartPanel({ model, vm, onRange }) {
  const [mode, setMode] = useState('single');
  const [hidden, setHidden] = useState(() => new Set());
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const { country, product, range } = vm.selection;
  const color = countryColor(country);
  const { axis, peak, visible, stats } = vm;
  const rangeInfo = RANGES.find((r) => r.id === range);
  const summary = `${vm.productLabel} en ${vm.countryLabel}, de ${dateShort(visible[0].t)} a ${dateShort(visible[visible.length - 1].t)}`;

  // Cada punto lleva su variación frente al anterior (para el tooltip).
  const rows = useMemo(() => visible.map((p, i) => ({ ...p, delta: i ? p.price - visible[i - 1].price : null })), [visible]);

  const { countries, rows: compareRows } = vm.compare;
  const labels = Object.fromEntries(model.countries.map((c) => [c.id, c.label]));
  const items = countries.map((id) => ({ id, label: labels[id] }));
  const toggle = (id) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < countries.length - 1) next.add(id); // siempre queda una serie visible
      return next;
    });

  const download = () => {
    const blob = new Blob([toCsv(visible, { country, product })], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oleometro-${country.toLowerCase()}-${product}-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 3500);
  };

  return (
    <Panel
      id="evolucion"
      title="Evolución del precio"
      sub={
        mode === 'single'
          ? `${vm.productLabel} en ${vm.countryLabel}. Media semanal en origen, en euros por tonelada. ${rangeInfo?.long}.`
          : `${vm.productLabel}: el mismo periodo para cada país. ${rangeInfo?.long}.`
      }
      actions={
        <>
          <GliderRadio name="chart-mode" label="Modo del gráfico" size="sm" options={MODES} value={mode} onChange={setMode} />
          <GliderRadio name="range" label="Periodo" size="sm" options={RANGES} value={range} onChange={onRange} />
        </>
      }
    >
      {mode === 'single' && stats && (
        <dl className={styles.readout}>
          <Cell label="Inicio del periodo" note={dateIso(stats.start.date)}>
            {decimal(stats.start.price, 2)}
          </Cell>
          <Cell label="Último" note={dateIso(stats.end.date)}>
            {decimal(stats.end.price, 2)}
          </Cell>
          <Cell label="Variación del periodo" note={`${signed(stats.change, 2)} €/t`}>
            <Delta value={stats.changePct} unit="%" size="lg" />
          </Cell>
          <Cell label="Máximo" note={dateIso(stats.high.date)}>
            {decimal(stats.high.price, 2)}
          </Cell>
          <Cell label="Mínimo" note={dateIso(stats.low.date)}>
            {decimal(stats.low.price, 2)}
          </Cell>
        </dl>
      )}

      {mode === 'compare' && (
        <>
          <ColorKey items={items} hidden={hidden} onToggle={toggle} />
          <dl className={styles.readout}>
            {vm.compareStats.map((row) => (
              <Cell key={row.id} label={row.label} note={`Último dato ${dateIso(row.date)}`}>
                <span className={styles.compareValue}>
                  {decimal(row.last, 2)} <Delta value={row.changePct} size="sm" />
                </span>
              </Cell>
            ))}
          </dl>
        </>
      )}

      <div
        className={styles.chart}
        role="img"
        aria-label={
          mode === 'single'
            ? `Gráfico de línea. ${summary}. Hay una tabla con los mismos datos debajo.`
            : `Comparativa de precios de ${vm.productLabel} entre ${items.map((i) => i.label).join(', ')}.`
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'single' ? (
            <AreaChart data={rows} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={axis.ticks} tickFormatter={axis.format} tick={tick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} tickMargin={8} />
              <YAxis orientation="right" tickFormatter={eurCompact} tick={tick} tickLine={false} axisLine={false} width={50} domain={yDomain} />
              <Tooltip cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }} content={<PriceTooltip color={color} />} />
              <ReferenceLine y={stats?.end.price} stroke="var(--ink-3)" strokeDasharray="2 4" ifOverflow="extendDomain" />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#price-fill)" activeDot={{ r: 4.5, stroke: 'var(--panel)', strokeWidth: 2, fill: color }} animationDuration={600} />
              {peak && <ReferenceDot x={peak.t} y={peak.price} r={4} fill={color} stroke="var(--panel)" strokeWidth={2} ifOverflow="visible" />}
            </AreaChart>
          ) : (
            <LineChart data={compareRows} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={axis.ticks} tickFormatter={axis.format} tick={tick} tickLine={false} axisLine={{ stroke: 'var(--line)' }} tickMargin={8} />
              <YAxis orientation="right" tickFormatter={eurCompact} tick={tick} tickLine={false} axisLine={false} width={50} domain={yDomain} />
              <Tooltip cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }} content={<ChartTooltip formatLabel={(t) => dateShort(t)} formatValue={(v) => `${decimal(v, 2)} €/t`} nameFor={(id) => labels[id] ?? id} />} />
              {countries
                .filter((id) => !hidden.has(id))
                .map((id) => (
                  <Line key={id} dataKey={id} stroke={countryColor(id)} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4.5, stroke: 'var(--panel)', strokeWidth: 2 }} animationDuration={600} />
                ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className={styles.foot}>
        <button type="button" className={styles.csv} onClick={download}>
          <Download size={15} aria-hidden="true" />
          Descargar CSV
        </button>
        <span className={styles.saved} role="status">
          {saved ? 'CSV descargado.' : ''}
        </span>
        <span className={styles.axisNote}>El eje vertical no empieza en cero.</span>
      </div>

      <details className={styles.details}>
        <summary>Ver como tabla</summary>
        <DataTable rows={vm.monthly} caption={`Precio medio mensual. ${summary}`} />
      </details>
    </Panel>
  );
}
