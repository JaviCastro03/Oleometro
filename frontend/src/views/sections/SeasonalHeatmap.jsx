import { useId, useState } from 'react';
import { MONTHS_ES, countryColor } from '../../models/constants.js';
import { eur, monthYear } from '../../models/format.js';
import SpotlightCard from '../ui/SpotlightCard.jsx';
import panel from './panel.module.css';
import styles from './SeasonalHeatmap.module.css';

export default function SeasonalHeatmap({ vm }) {
  const headingId = `${useId()}-h`;
  const [hover, setHover] = useState(null);
  const { rows, min, max } = vm.heatmap;
  if (!rows.length) return null;

  const readout = hover
    ? `${monthYear(hover.year, hover.month)}: ${eur(hover.value)} por tonelada de media`
    : 'Pasa el cursor por un mes para ver su precio medio.';

  return (
    <SpotlightCard as="section" className={panel.panel} aria-labelledby={headingId}>
      <header className={panel.head}>
        <div>
          <h2 id={headingId} className={panel.title}>
            Mes a mes, año a año
          </h2>
          <p className={panel.sub}>
            Precio medio mensual de {vm.productLabel} en {vm.countryLabel}. Cuanto más intenso el color, más caro estuvo
            ese mes.
          </p>
        </div>
        <div className={styles.scale} aria-hidden="true">
          <span>{eur(min)}</span>
          <span className={styles.ramp} style={{ '--heat': countryColor(vm.selection.country) }} />
          <span>{eur(max)}</span>
        </div>
      </header>

      <p className={styles.readout} aria-live="polite">
        {readout}
      </p>

      <div
        className={styles.grid}
        style={{ '--heat': countryColor(vm.selection.country) }}
        onPointerLeave={() => setHover(null)}
        role="table"
        aria-label={`Precio medio mensual por año. ${readout}`}
      >
        <div className={styles.row} role="row">
          <span role="columnheader" />
          {MONTHS_ES.map((month) => (
            <span key={month} role="columnheader" className={styles.month}>
              {month}
            </span>
          ))}
        </div>
        {rows.map(({ year, cells }) => (
          <div key={year} className={styles.row} role="row">
            <span role="rowheader" className={styles.year}>
              {year}
            </span>
            {cells.map((cell) =>
              cell.value == null ? (
                <span key={cell.month} role="cell" className={styles.empty} aria-label={`${monthYear(year, cell.month)}: sin dato`} />
              ) : (
                <span
                  key={cell.month}
                  role="cell"
                  className={styles.cell}
                  style={{ '--t': cell.intensity }}
                  aria-label={`${monthYear(year, cell.month)}: ${eur(cell.value)}`}
                  onPointerEnter={() => setHover({ year, month: cell.month, value: cell.value })}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}
