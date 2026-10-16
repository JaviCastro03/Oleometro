import { useMemo } from 'react';
import { buildViewModel } from '../models/dashboardModel.js';
import DashboardView from '../views/DashboardView.jsx';
import { useDashboard } from './useDashboard.js';
import { useSelection } from './useSelection.js';
import { useTheme } from './useTheme.js';

/**
 * The only controller mounted by the index.
 * It owns state and orchestration; the model computes, the view renders.
 */
export default function DashboardController() {
  const { status, model, error, reload } = useDashboard();
  const { selection, actions } = useSelection(model);
  const theme = useTheme();

  const viewModel = useMemo(
    () => (model && selection ? buildViewModel(model, selection) : null),
    [model, selection],
  );

  return (
    <DashboardView
      status={status}
      error={error}
      model={model}
      viewModel={viewModel}
      actions={{ ...actions, reload }}
      theme={theme}
    />
  );
}
