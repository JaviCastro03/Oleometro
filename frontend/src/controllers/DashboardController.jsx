// CONTROLADOR PRINCIPAL (la "C" de MVC).
// Analogía: es el camarero. Pide los datos a la cocina (servicio y modelo),
// y se los lleva a la mesa (la vista). Él no cocina ni sirve a la vista por dentro.
//
// Un "hook" es una función de React cuyo nombre empieza por "use". Sirve para
// añadir memoria o efectos a un componente (aquí: useDashboard, useSelection, useTheme).
import { useMemo } from 'react';
import { buildViewModel, dataStatus } from '../models/dashboardModel.js';
import DashboardView from '../views/DashboardView.jsx';
import { useDashboard } from './useDashboard.js';
import { useSelection } from './useSelection.js';
import { useTheme } from './useTheme.js';

/**
 * Único controlador que monta main.jsx.
 * Guarda el estado y coordina: el modelo calcula, la vista dibuja.
 */
export default function DashboardController() {
  const { status, model, error, reload, refreshFailed } = useDashboard();
  const { selection, actions } = useSelection(model);
  const theme = useTheme();

  // useMemo guarda un resultado calculado y solo lo recalcula si cambian
  // los datos de la lista [model, selection]. Así no repetimos cálculos pesados
  // cada vez que React vuelve a dibujar la pantalla.
  const viewModel = useMemo(
    () => (model && selection ? buildViewModel(model, selection) : null),
    [model, selection],
  );

  // Estado honesto de los datos (al día, con retraso, sin conexión...). Depende de la hora actual.
  const freshness = useMemo(
    () => (model ? dataStatus(model.meta, { refreshFailed }) : null),
    [model, refreshFailed],
  );

  // Entregamos a la vista todo lo que necesita; ella solo pinta y avisa de clics.
  return (
    <DashboardView
      status={status}
      error={error}
      model={model}
      viewModel={viewModel}
      freshness={freshness}
      actions={{ ...actions, reload }}
      theme={theme}
    />
  );
}
