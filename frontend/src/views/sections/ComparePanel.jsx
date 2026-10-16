import { useId, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { countryColor } from '../../models/constants.js';
import { dateShort, eur, eurCompact } from '../../models/format.js';
import SpotlightCard from '../ui/SpotlightCard.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import ColorKey from './ColorKey.jsx';
import panel from './panel.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };

export default function ComparePanel({ model, vm }) {
  const headingId = `${useId()}-h`;
  const [hidden, setHidden] = useState(() => new Set());
  const { countries, rows } = vm.compare;
  const labels = Object.fromEntries(model.countries.map((c) => [c.id, c.label]));
  const items = countries.map((id) => ({ id, label: labels[id] }));

  const toggle = (id) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < countries.length - 1) next.add(id); // always keep one visible
      return next;
    });

  return (
    <SpotlightCard as="section" className={panel.panel} aria-labelledby={headingId}>
      <header className={panel.head}>
        <div>
          <h2 id={headingId} className={panel.title}>
            Países frente a frente
          </h2>
          <p className={panel.sub}>
            {vm.productLabel}: el mismo periodo para cada país. Pulsa un país para ocultarlo.
          </p>
        </div>
      </header>
      <ColorKey items={items} hidden={hidden} onToggle={toggle} />

      <div className={panel.chartShort} role="img" aria-label={`Comparativa de precios de ${vm.productLabel} entre ${items.map((i) => i.label).join(', ')}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={vm.axis.ticks}
              tickFormatter={vm.axis.format}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tickMargin={8}
            />
            <YAxis tickFormatter={eurCompact} tick={tick} tickLine={false} axisLine={false} width={52} domain={[0, 'auto']} />
            <Tooltip
              cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 4' }}
              content={
                <ChartTooltip
                  formatLabel={(t) => dateShort(t)}
                  formatValue={(v) => `${eur(v)}/t`}
                  nameFor={(id) => labels[id] ?? id}
                />
              }
            />
            {countries
              .filter((id) => !hidden.has(id))
              .map((id) => {
                return (
                  <Line
                    key={id}
                    dataKey={id}
                    stroke={countryColor(id)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                    animationDuration={700}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SpotlightCard>
  );
}
