import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { countryColor } from '../../models/constants.js';
import { integer } from '../../models/format.js';
import Panel from '../ui/Panel.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import ColorKey from './ColorKey.jsx';
import styles from './ProductionPanel.module.css';
import tooltipStyles from './ChartTooltip.module.css';

const tick = { fill: 'var(--ink-3)', fontSize: 12 };

export default function ProductionPanel({ model, vm }) {
  const { countries, rows } = vm.production;
  const labels = Object.fromEntries(model.countries.map((c) => [c.id, c.label]));
  const items = countries.map((id) => ({ id, label: labels[id] }));
  const estimated = new Map(rows.map((row) => [row.year, row.estimated]));
  const byYear = new Map(rows.map((row) => [row.year, row]));

  if (!rows.length) return null;

  return (
    <Panel
      id="produccion"
      title="Cuánto aceite se produce"
      sub="Producción anual en miles de toneladas, según la Comisión Europea. Una cosecha corta suele coincidir con precios altos. Los años con asterisco son estimaciones."
    >
      <ColorKey items={items} />

      <div className={styles.chart} role="img" aria-label="Gráfico de barras apiladas con la producción anual de aceite por país.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="26%">
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="year"
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tickFormatter={(year) => `${year}${estimated.get(year) ? '*' : ''}`}
              tickMargin={8}
            />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={46} tickFormatter={integer} domain={[0, (max) => Math.ceil(max / 500) * 500]} tickCount={6} />
            <Tooltip
              cursor={{ fill: 'var(--grid)' }}
              content={
                <ChartTooltip
                  formatLabel={(year) => `Campaña ${year}${estimated.get(year) ? ' (estimación)' : ''}`}
                  formatValue={(v) => `${integer(v)} mil t`}
                  nameFor={(id) => labels[id] ?? id}
                  footer={(payload) => (
                    <p className={tooltipStyles.foot}>Total: {integer(byYear.get(payload[0].payload.year)?.total ?? 0)} mil t</p>
                  )}
                />
              }
            />
            {countries.map((id, i) => (
              <Bar
                key={id}
                dataKey={id}
                stackId="production"
                fill={countryColor(id)}
                stroke="var(--panel)"
                strokeWidth={2}
                radius={i === countries.length - 1 ? [2, 2, 0, 0] : 0}
                animationDuration={700}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
