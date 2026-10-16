import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RANGES, countryColor } from '../../models/constants.js';
import { dateShort, eur, eurCompact } from '../../models/format.js';
import GliderRadio from '../ui/GliderRadio.jsx';
import SpotlightCard from '../ui/SpotlightCard.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import DataTable from './DataTable.jsx';
import panel from './panel.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };

export default function PriceChartPanel({ vm, onRange }) {
  const uid = useId();
  const headingId = `${uid}-h`;
  const color = countryColor(vm.selection.country);
  const { axis, peak, visible } = vm;
  const summary = `${vm.productLabel} en ${vm.countryLabel}, de ${dateShort(visible[0].t)} a ${dateShort(visible[visible.length - 1].t)}`;

  return (
    <SpotlightCard as="section" className={panel.panel} aria-labelledby={headingId}>
      <header className={panel.head}>
        <div>
          <h2 id={headingId} className={panel.title}>
            Evolución del precio
          </h2>
          <p className={panel.sub}>
            {vm.productLabel} en {vm.countryLabel}. Media semanal en origen, en euros por tonelada.
          </p>
        </div>
        <GliderRadio name="range" label="Periodo" size="sm" options={RANGES} value={vm.selection.range} onChange={onRange} />
      </header>

      <div className={panel.chart} role="img" aria-label={`Gráfico de área. ${summary}. Hay una tabla con los mismos datos debajo.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.38} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <YAxis
              tickFormatter={eurCompact}
              tick={tick}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, 'auto']}
            />
            <Tooltip
              cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }}
              content={
                <ChartTooltip
                  formatLabel={(t) => dateShort(t)}
                  formatValue={(v) => `${eur(v)}/t`}
                  nameFor={() => vm.productLabel}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${uid}-fill)`}
              activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2, fill: color }}
              animationDuration={800}
            />
            {peak && (
              <ReferenceDot
                x={peak.t}
                y={peak.price}
                r={5}
                fill={color}
                stroke="var(--surface)"
                strokeWidth={2}
                ifOverflow="visible"
                label={{ value: `Máximo ${eur(peak.price)}`, position: 'top', fill: 'var(--ink-2)', fontSize: 12, fontWeight: 700 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <details className={panel.details}>
        <summary>Ver como tabla</summary>
        <DataTable rows={vm.monthly} caption={`Precio medio mensual. ${summary}`} />
      </details>
    </SpotlightCard>
  );
}
