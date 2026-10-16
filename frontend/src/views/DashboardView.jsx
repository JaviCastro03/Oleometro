import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/manrope/index.css';
import { MotionConfig } from 'framer-motion';
import '../styles/tokens.css';
import '../styles/base.css';
import Loader from './ui/Loader.jsx';
import Backdrop from './sections/Backdrop.jsx';
import ComparePanel from './sections/ComparePanel.jsx';
import DemoBanner from './sections/DemoBanner.jsx';
import ErrorState from './sections/ErrorState.jsx';
import Footer from './sections/Footer.jsx';
import Header from './sections/Header.jsx';
import Hero from './sections/Hero.jsx';
import KpiGrid from './sections/KpiGrid.jsx';
import PriceChartPanel from './sections/PriceChartPanel.jsx';
import ProductionPanel from './sections/ProductionPanel.jsx';
import SeasonalHeatmap from './sections/SeasonalHeatmap.jsx';
import styles from './DashboardView.module.css';

/** Pure presentation: receives everything it needs from the controller. */
export default function DashboardView({ status, error, model, viewModel, actions, theme }) {
  const ready = status === 'ready' && model && viewModel?.series;

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Backdrop />
      <div className={styles.shell}>
        <Header theme={theme} />
        <main id="contenido" className={styles.main} tabIndex={-1}>
          {status === 'loading' && <Loader />}
          {status === 'error' && <ErrorState message={error} onRetry={actions.reload} />}
          {ready && (
            <>
              {model.meta.is_demo && <DemoBanner />}
              <Hero model={model} vm={viewModel} actions={actions} />
              <KpiGrid vm={viewModel} />
              <PriceChartPanel vm={viewModel} onRange={actions.setRange} />
              <div className={styles.pair}>
                <ComparePanel model={model} vm={viewModel} />
                <ProductionPanel model={model} vm={viewModel} />
              </div>
              <SeasonalHeatmap vm={viewModel} />
            </>
          )}
        </main>
        <Footer meta={ready ? model.meta : null} />
      </div>
    </MotionConfig>
  );
}
