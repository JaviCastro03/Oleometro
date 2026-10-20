// VISTA: Calculadora interactiva del aceite de oliva.
// Permite calcular en tiempo real el valor de una partida de aceite o cosecha de aceituna,
// convertir entre toneladas, kilos, litros y garrafas (densidad 0,916 kg/L)
// y comparar el valor resultante entre los mercados de España, Italia, Grecia y Portugal.
import { useId, useMemo, useState } from 'react';
import { countryColor } from '../../models/constants.js';
import { decimal, eur, integer, pct } from '../../models/format.js';
import styles from './OilCalculator.module.css';

const DENSITY = 0.916; // Densidad del aceite de oliva a 20 °C (kg/L)

const PRESETS_OIL = [
  { label: '500 kg', value: 500 },
  { label: '2.000 kg', value: 2000 },
  { label: '5.000 kg', value: 5000 },
  { label: '25.000 kg (cisterna)', value: 25000 },
];

const PRESETS_OLIVES = [
  { label: '1.000 kg', value: 1000 },
  { label: '5.000 kg', value: 5000 },
  { label: '15.000 kg', value: 15000 },
  { label: '50.000 kg', value: 50000 },
];

export default function OilCalculator({ model, vm }) {
  const inputId = useId();
  const yieldId = useId();

  // Estados interactivos
  const [mode, setMode] = useState('oil'); // 'oil' | 'olives'
  const [selectedCountry, setSelectedCountry] = useState(vm?.selection?.country || 'ES');
  const [selectedProduct, setSelectedProduct] = useState(vm?.selection?.product || 'evoo');
  const [quantity, setQuantity] = useState(2000);
  const [unit, setUnit] = useState('kg'); // 'kg' | 'l'
  const [fatYield, setFatYield] = useState(21.0); // Rendimiento graso (%)
  const [customPrice, setCustomPrice] = useState(null); // null = usa precio oficial de mercado

  const countries = model?.countries || [
    { id: 'ES', label: 'España' },
    { id: 'IT', label: 'Italia' },
    { id: 'GR', label: 'Grecia' },
    { id: 'PT', label: 'Portugal' },
  ];

  const products = model?.products || [
    { id: 'evoo', label: 'Virgen Extra' },
    { id: 'virgin', label: 'Virgen' },
    { id: 'lampante', label: 'Lampante' },
  ];

  // Buscar cotización oficial actual para el país y calidad seleccionados
  const currentQuote = useMemo(() => {
    return vm?.quotes?.find((q) => q.country === selectedCountry && q.product === selectedProduct) || null;
  }, [vm?.quotes, selectedCountry, selectedProduct]);

  const officialPricePerTon = currentQuote?.price || 3338.37;
  const activePricePerTon = customPrice !== null ? customPrice : officialPricePerTon;

  // Cálculos matemáticos
  const pricePerKg = activePricePerTon / 1000;
  const pricePerLiter = pricePerKg * DENSITY;
  const priceGarrafa5L = pricePerLiter * 5;

  let totalOilKg = 0;
  let totalOilLiters = 0;

  if (mode === 'oil') {
    if (unit === 'kg') {
      totalOilKg = quantity;
      totalOilLiters = quantity / DENSITY;
    } else {
      totalOilLiters = quantity;
      totalOilKg = quantity * DENSITY;
    }
  } else {
    // Modo aceituna: aceituna * rendimiento = kg aceite
    totalOilKg = quantity * (fatYield / 100);
    totalOilLiters = totalOilKg / DENSITY;
  }

  const totalValue = totalOilKg * pricePerKg;

  // Comparativa con los otros mercados europeos para ese mismo volumen de aceite
  const marketComparisons = useMemo(() => {
    if (!vm?.quotes || totalOilKg <= 0) return [];
    return countries.map((c) => {
      const q = vm.quotes.find((item) => item.country === c.id && item.product === selectedProduct);
      if (!q) return null;
      const val = totalOilKg * (q.price / 1000);
      const diffVal = val - totalValue;
      const diffPct = totalValue > 0 ? (diffVal / totalValue) * 100 : 0;
      return {
        country: c.id,
        label: c.label,
        pricePerTon: q.price,
        totalVal: val,
        diffVal,
        diffPct,
        isCurrent: c.id === selectedCountry,
      };
    }).filter(Boolean);
  }, [vm?.quotes, countries, selectedProduct, totalOilKg, totalValue, selectedCountry]);

  return (
    <div className={styles.calculator}>
      {/* Selector de modo: Aceite directo o Cosecha de aceituna */}
      <div className={styles.header}>
        <div className={styles.modeTabs} role="tablist" aria-label="Modo de cálculo">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'oil'}
            className={`${styles.modeBtn} ${mode === 'oil' ? styles.activeMode : ''}`}
            onClick={() => {
              setMode('oil');
              setQuantity(2000);
            }}
          >
            💧 Valor por volumen de aceite
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'olives'}
            className={`${styles.modeBtn} ${mode === 'olives' ? styles.activeMode : ''}`}
            onClick={() => {
              setMode('olives');
              setQuantity(10000);
            }}
          >
            🫒 Rendimiento de cosecha de aceituna
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Columna de Controles */}
        <div className={styles.controlsCol}>
          {/* Mercado y Calidad */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>1. Mercado y Calidad de Aceite</span>
            <div className={styles.selectorsWrap}>
              <div className={styles.pillsRow} role="group" aria-label="País">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.pillBtn} ${selectedCountry === c.id ? styles.pillActive : ''}`}
                    onClick={() => {
                      setSelectedCountry(c.id);
                      setCustomPrice(null); // restablece al oficial del nuevo país
                    }}
                  >
                    <span className={styles.countryDot} style={{ background: countryColor(c.id) }} />
                    {c.label}
                  </button>
                ))}
              </div>

              <div className={styles.pillsRow} role="group" aria-label="Calidad">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.pillBtn} ${selectedProduct === p.id ? styles.pillActive : ''}`}
                    onClick={() => {
                      setSelectedProduct(p.id);
                      setCustomPrice(null);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cantidad y Unidad */}
          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <label htmlFor={inputId} className={styles.controlLabel}>
                {mode === 'oil' ? '2. Cantidad de aceite' : '2. Kilos de aceituna cosechada'}
              </label>
              {mode === 'oil' && (
                <div className={styles.unitToggle}>
                  <button
                    type="button"
                    className={`${styles.unitBtn} ${unit === 'kg' ? styles.unitActive : ''}`}
                    onClick={() => setUnit('kg')}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    className={`${styles.unitBtn} ${unit === 'l' ? styles.unitActive : ''}`}
                    onClick={() => setUnit('l')}
                  >
                    Litros
                  </button>
                </div>
              )}
            </div>

            <div className={styles.inputWrap}>
              <input
                id={inputId}
                type="number"
                min="1"
                step="50"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                className={styles.numberInput}
              />
              <span className={styles.unitSuffix}>
                {mode === 'oil' ? unit : 'kg aceituna'}
              </span>
            </div>

            {/* Accesos rápidos */}
            <div className={styles.presetsRow}>
              {(mode === 'oil' ? PRESETS_OIL : PRESETS_OLIVES).map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => setQuantity(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* En modo aceituna: Rendimiento Graso */}
          {mode === 'olives' && (
            <div className={styles.controlGroup}>
              <div className={styles.labelRow}>
                <label htmlFor={yieldId} className={styles.controlLabel}>
                  3. Rendimiento graso medio en almazara
                </label>
                <strong className={styles.yieldVal}>{decimal(fatYield, 1)} %</strong>
              </div>
              <input
                id={yieldId}
                type="range"
                min="14"
                max="28"
                step="0.5"
                value={fatYield}
                onChange={(e) => setFatYield(Number(e.target.value))}
                className={styles.slider}
              />
              <p className={styles.yieldHint}>
                El rendimiento habitual en campaña varía entre el 18 % y el 24 % según madurez y variedad.
              </p>
            </div>
          )}

          {/* Precio aplicado (con opción de editar) */}
          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <span className={styles.controlLabel}>
                {mode === 'oil' ? '3.' : '4.'} Precio en origen considerado
              </span>
              {customPrice !== null && (
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => setCustomPrice(null)}
                >
                  Restablecer oficial
                </button>
              )}
            </div>
            <div className={styles.priceRow}>
              <div className={styles.inputWrap}>
                <input
                  type="number"
                  step="10"
                  value={Math.round(activePricePerTon)}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className={styles.numberInput}
                />
                <span className={styles.unitSuffix}>€/t</span>
              </div>
              <span className={styles.priceOfficialBadge}>
                {customPrice === null ? '✓ Oficial Comisión Europea' : '✎ Precio personalizado'}
              </span>
            </div>
          </div>
        </div>

        {/* Columna de Resultados */}
        <div className={styles.resultsCol}>
          {/* Tarjeta Principal de Valoración */}
          <div className={styles.heroResultCard}>
            <span className={styles.heroResultLabel}>VALOR TOTAL ESTIMADO EN ORIGEN</span>
            <div className={styles.heroPrice}>
              {decimal(totalValue, 2)}
              <span className={styles.heroCurrency}>€</span>
            </div>
            <p className={styles.heroResultSub}>
              Para {integer(totalOilKg)} kg de aceite ({integer(totalOilLiters)} L) · {products.find((p) => p.id === selectedProduct)?.label} en {countries.find((c) => c.id === selectedCountry)?.label}
            </p>
          </div>

          {/* Tarjetas de Métricas Directas */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Precio por kilo</span>
              <strong className={styles.metricValue}>{decimal(pricePerKg, 2)} €/kg</strong>
              <span className={styles.metricHint}>Cotización en origen</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Precio por litro</span>
              <strong className={styles.metricValue}>{decimal(pricePerLiter, 2)} €/L</strong>
              <span className={styles.metricHint}>Densidad: 0,916 kg/L</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Garrafa de 5 litros</span>
              <strong className={styles.metricValue}>{decimal(priceGarrafa5L, 2)} €</strong>
              <span className={styles.metricHint}>En origen sin envasar</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Volumen producido</span>
              <strong className={styles.metricValue}>{integer(totalOilLiters)} L</strong>
              <span className={styles.metricHint}>{integer(totalOilKg)} kg netos</span>
            </div>
          </div>

          {/* Comparativa con otros mercados */}
          <div className={styles.compWrap}>
            <span className={styles.compTitle}>Comparativa del mismo volumen en otros mercados</span>
            <div className={styles.compList}>
              {marketComparisons.map((m) => (
                <div key={m.country} className={`${styles.compItem} ${m.isCurrent ? styles.compCurrent : ''}`}>
                  <div className={styles.compHead}>
                    <span className={styles.compCountry}>
                      <span className={styles.countryDot} style={{ background: countryColor(m.country) }} />
                      {m.label}
                    </span>
                    <span className={styles.compPriceTon}>{decimal(m.pricePerTon, 0)} €/t</span>
                  </div>
                  <div className={styles.compTotalRow}>
                    <strong className={styles.compTotalVal}>{eur(m.totalVal)}</strong>
                    {!m.isCurrent && (
                      <span className={`${styles.compDiff} ${m.diffVal >= 0 ? styles.diffUp : styles.diffDown}`}>
                        {m.diffVal >= 0 ? '+' : ''}{eur(m.diffVal)} ({pct(m.diffPct, 1)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}