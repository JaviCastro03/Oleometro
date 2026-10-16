import { eur, monthYear, pct } from '../../models/format.js';
import styles from './DataTable.module.css';

/** Same data as the chart, as a table (monthly averages, newest first). */
export default function DataTable({ rows, caption }) {
  const view = rows
    .map((row, i) => ({ ...row, change: i ? (row.price / rows[i - 1].price - 1) * 100 : null }))
    .reverse();

  return (
    <div className={styles.wrap} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Precio medio</th>
            <th scope="col">Cambio mensual</th>
          </tr>
        </thead>
        <tbody>
          {view.map((row) => (
            <tr key={`${row.year}-${row.month}`}>
              <th scope="row">{monthYear(row.year, row.month)}</th>
              <td>{eur(row.price)}/t</td>
              <td>{pct(row.change)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
