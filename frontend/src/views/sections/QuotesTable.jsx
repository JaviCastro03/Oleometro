// VISTA: tabla de cotizaciones. Una fila por mercado y calidad, con el último precio, las
// variaciones y la posición dentro del rango de 52 semanas. Pulsar una fila cambia lo que
// se ve en la portada y en el gráfico. Todo sale de los datos reales de la fuente.
// Estado propio (solo de presentación): columna de orden y filtro de calidad.
import { useMemo, useState } from 'react';
import { sortQuotes } from '../../models/dashboardModel.js';
import { countryColor } from '../../models/constants.js';
import { dateIso, decimal, eur } from '../../models/format.js';
import Delta from '../ui/Delta.jsx';
import GliderRadio from '../ui/GliderRadio.jsx';
import Panel from '../ui/Panel.jsx';
import RangeBar from '../ui/RangeBar.jsx';
import Sparkline from '../ui/Sparkline.jsx';
import styles from './QuotesTable.module.css';

// Columnas con orden. `first` = sentido al pulsar por primera vez (los precios y variaciones, de mayor a menor).
const COLUMNS = [
  { key: 'market', label: 'Mercado', first: 'asc' },
  { key: 'product', label: 'Calidad', first: 'asc' },
  { key: 'price', label: 'Precio €/t', first: 'desc', numeric: true },
  { key: 'week', label: 'Semana', first: 'desc', numeric: true },
  { key: 'month', label: '4 semanas', first: 'desc', numeric: true },
  { key: 'year', label: 'Año', first: 'desc', numeric: true },
  { key: 'position', label: 'Rango 52 sem.', first: 'desc' },
  { key: null, label: 'Tendencia' },
  { key: 'date', label: 'Última semana', first: 'desc' },
];

// Para el selector del móvil (donde no hay cabeceras que pulsar).
const MOBILE_SORTS = [
  { id: 'market:asc', label: 'Mercado (A-Z)' },
  { id: 'price:desc', label: 'Precio, de mayor a menor' },
  { id: 'price:asc', label: 'Precio, de menor a mayor' },
  { id: 'week:desc', label: 'Variación semanal' },
  { id: 'year:desc', label: 'Variación anual' },
];

export default function QuotesTable({ model, vm, actions }) {
  const [sort, setSort] = useState({ key: 'market', dir: 'asc' });
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const filtered = filter === 'all' ? vm.quotes : vm.quotes.filter((r) => r.product === filter);
    return sortQuotes(filtered, sort.key, sort.dir);
  }, [vm.quotes, filter, sort]);

  const filters = [{ id: 'all', label: 'Todas' }, ...model.products];
  const sortBy = (column) =>
    setSort((s) => (s.key === column.key ? { key: s.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: column.key, dir: column.first }));
  const ariaSort = (column) => (column.key && sort.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined);
  const stale = vm.quotes.filter((r) => r.stale);

  return (
    <Panel
      id="cotizaciones"
      title="Cotizaciones"
      sub="Precio medio semanal en origen, en euros por tonelada. Pulsa un mercado para verlo arriba y en el gráfico."
      actions={
        <>
          <label className={styles.mobileSort}>
            <span className="sr-only">Ordenar por</span>
            <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setSort({ key, dir }); }}>
              {MOBILE_SORTS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <GliderRadio name="quote-filter" label="Filtrar por calidad" size="sm" options={filters} value={filter} onChange={setFilter} />
        </>
      }
    >
      <div className={styles.wrap} role="region" aria-label="Tabla de cotizaciones, desplazable" tabIndex={0}>
        <table className={styles.table}>
          <caption className="sr-only">Cotizaciones del aceite de oliva por mercado y calidad, con variaciones y fecha del último dato.</caption>
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.label} scope="col" aria-sort={ariaSort(column)} className={column.numeric ? styles.num : undefined}>
                  {column.key ? (
                    <button type="button" className={styles.sortBtn} onClick={() => sortBy(column)}>
                      {column.label}
                      <span className={styles.arrow} aria-hidden="true">
                        {sort.key === column.key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.country === vm.selection.country && row.product === vm.selection.product;
              return (
                <tr key={row.id} className={`${styles.row} ${selected ? styles.selected : ''} ${row.stale ? styles.stale : ''}`}>
                  <th scope="row" className={styles.cMarket}>
                    <button type="button" className={styles.pick} aria-pressed={selected} onClick={() => actions.select(row.country, row.product)}>
                      <span className={styles.dot} style={{ background: countryColor(row.country) }} aria-hidden="true" />
                      {row.countryLabel}
                    </button>
                  </th>
                  <td className={styles.cProduct}>{row.productLabel}</td>
                  <td className={`${styles.num} ${styles.cPrice}`}>{decimal(row.price, 2)}</td>
                  <td className={`${styles.num} ${styles.cWeek}`} data-label="Semana">
                    <Delta value={row.weekPct} size="sm" />
                  </td>
                  <td className={`${styles.num} ${styles.cMonth}`} data-label="4 semanas">
                    <Delta value={row.monthPct} size="sm" />
                  </td>
                  <td className={`${styles.num} ${styles.cYear}`} data-label="Año">
                    <Delta value={row.yearPct} size="sm" />
                  </td>
                  <td className={styles.cRange} title={`Mínimo ${eur(row.low52)}, máximo ${eur(row.high52)} en las últimas 52 semanas`}>
                    <RangeBar position={row.position} label={`Entre ${eur(row.low52)} y ${eur(row.high52)} en 52 semanas; ahora al ${Math.round(row.position * 100)} %`} />
                  </td>
                  <td className={styles.cSpark} style={{ color: countryColor(row.country) }}>
                    <Sparkline values={row.spark} />
                  </td>
                  <td className={styles.cDate}>
                    {dateIso(row.date)}
                    {row.stale && <span className={styles.tag}>Sin datos recientes</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        Fuente: Comisión Europea, Agri-food Data Portal. Las variaciones comparan con la semana, las 4 semanas y el año anteriores. El
        rango de 52 semanas muestra dónde está el precio entre su mínimo y su máximo del último año.
        {stale.length > 0 && (
          <>
            {' '}
            <strong>Sin datos recientes:</strong> {stale.map((r) => `${r.countryLabel}, ${r.productLabel.toLowerCase()} (último dato ${dateIso(r.date)})`).join('; ')}.
          </>
        )}
      </p>
    </Panel>
  );
}
