// VISTA: "Cómo se calcula y Calculadora en origen".
// Integra la herramienta interactiva de cálculo (OilCalculator) para que el usuario pueda simular
// liquidaciones, rendimientos y conversiones de unidades al pulsar "Cómo se calcula",
// junto con las explicaciones metodológicas oficiales de la Comisión Europea.
import { dateIso } from '../../models/format.js';
import Panel from '../ui/Panel.jsx';
import OilCalculator from './OilCalculator.jsx';
import styles from './MethodPanel.module.css';

export default function MethodPanel({ model, vm, isDemo }) {
  const stale = vm?.quotes?.filter((r) => r.stale) || [];

  return (
    <Panel
      id="metodo"
      title="Calculadora en origen y cómo se calcula"
      sub="Calcula y simula el valor de tu partida o cosecha con las cotizaciones oficiales de la UE y consulta las fórmulas de conversión."
    >
      {/* Calculadora Interactiva */}
      <OilCalculator model={model} vm={vm} />

      {/* Explicación de Métodos y Fórmulas */}
      <div className={styles.methodDetails}>
        <h3 className={styles.sectionHeading}>Fórmulas oficiales y metodología de los datos</h3>
        <div className={styles.cols}>
          <article>
            <h3>1. Conversión de unidades</h3>
            <p>
              La Comisión Europea publica las cotizaciones en euros por 100 kg. Aquí se normalizan a <strong>euros por tonelada (€/t)</strong> multiplicando por 10. El <strong>precio por kilo (€/kg)</strong> se obtiene dividiendo entre 1.000. Para el <strong>precio por litro (€/L)</strong>, se aplica la densidad oficial estándar del aceite de oliva: <strong>0,916 kg por litro a 20 °C</strong> (1 L = 0,916 kg).
            </p>
          </article>

          <article>
            <h3>2. Rendimiento en almazara</h3>
            <p>
              El rendimiento graso neto de la aceituna expresa el porcentaje de aceite extraíble respecto al peso de aceituna limpia. En la campaña suele situarse entre el <strong>18 % y el 24 %</strong>. La fórmula de liquidación calcula los kilos de aceite obtenidos multiplicando los kilos de aceituna por dicho porcentaje y dividiendo entre la densidad.
            </p>
          </article>

          <article>
            <h3>3. Cómo se calcula la previsión</h3>
            <p>
              Se proyecta la tendencia reciente mediante regresión adaptativa amortiguada y se ajusta con factores de estacionalidad histórica mensual. El rango probabilístico del 80 % refleja el margen de error histórico del modelo ante oscilaciones de mercado.
            </p>
          </article>

          <article>
            <h3>4. Procedencia y límites</h3>
            <p>
              Precios y producción descargados del{' '}
              <a href="https://agridata.ec.europa.eu/extensions/DataPortal/olive-oil.html" target="_blank" rel="noreferrer">
                Agri-food Data Portal
              </a>{' '}
              de la Comisión Europea. Son medias semanales en origen por país y categoría.
              {isDemo && <strong> Estás viendo datos de demostración, no cifras oficiales.</strong>}
              {stale.length > 0 && (
                <>
                  {' '}
                  Series con retraso en origen: {stale.map((r) => `${r.countryLabel}, ${r.productLabel.toLowerCase()} (${dateIso(r.date)})`).join('; ')}.
                </>
              )}
            </p>
          </article>
        </div>
      </div>
    </Panel>
  );
}