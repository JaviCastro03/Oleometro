// VISTA PRINCIPAL (la "V" de MVC): ordena las secciones de la página.
// No calcula ni descarga nada: recibe todo ya preparado del controlador.
// La fuente se importa aquí: Inter Variable (una sola familia para todo, con cifras tabulares).
import '@fontsource-variable/inter/index.css';
import { MotionConfig } from 'framer-motion';
import '../styles/tokens.css';
import '../styles/base.css';
import DemoBanner from './sections/DemoBanner.jsx';
import Footer from './sections/Footer.jsx';
import ForecastPanel from './sections/ForecastPanel.jsx';
import Header from './sections/Header.jsx';
import Hero from './sections/Hero.jsx';
import MethodPanel from './sections/MethodPanel.jsx';
import PriceChartPanel from './sections/PriceChartPanel.jsx';
import ProductionPanel from './sections/ProductionPanel.jsx';
import QuotesTable from './sections/QuotesTable.jsx';
import SeasonalHeatmap from './sections/SeasonalHeatmap.jsx';
import { ErrorState, LoadingState } from './sections/States.jsx';
import PourHero from './pour/PourHero.jsx';
import PourStage from './pour/PourStage.jsx';
import styles from './DashboardView.module.css';

export default function DashboardView({ status, error, model, viewModel, freshness, actions, theme }) {
  const ready = status === 'ready' && model && viewModel?.series;

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Header theme={theme} />
      <PourStage hero={<PourHero vm={ready ? viewModel : null} />}>
        <div className={styles.shell}>
          <main id="contenido" data-main className={styles.main} tabIndex={-1}>
            {status === 'loading' && <LoadingState />}
            {status === 'error' && <ErrorState message={error} onRetry={actions.reload} />}
            {ready && (
              <>
                {model.meta.is_demo && <DemoBanner />}
                <div id="mercado">
                  <Hero model={model} vm={viewModel} actions={actions} />
                </div>
                <QuotesTable model={model} vm={viewModel} actions={actions} />
                <PriceChartPanel model={model} vm={viewModel} onRange={actions.setRange} />
                <ForecastPanel vm={viewModel} />
                <div id="contexto" className={styles.pair}>
                  <ProductionPanel model={model} vm={viewModel} />
                  <SeasonalHeatmap vm={viewModel} />
                </div>
                <MethodPanel model={model} vm={viewModel} isDemo={model.meta.is_demo} />
              </>
            )}
          </main>
          <Footer />
        </div>
      </PourStage>
    </MotionConfig>
  );
}