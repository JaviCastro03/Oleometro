// PUNTO DE ENTRADA de la app React (lo carga index.html).
// Su único trabajo: "enchufar" el controlador en el <div id="root"> de la página.
// Piensa en él como el interruptor general: no hace nada más.
import { createRoot } from 'react-dom/client';
import DashboardController from './controllers/DashboardController.jsx';

createRoot(document.getElementById('root')).render(<DashboardController />);
