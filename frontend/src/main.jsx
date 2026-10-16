// Application index: a single route to the controller. Nothing else is wired here.
import { createRoot } from 'react-dom/client';
import DashboardController from './controllers/DashboardController.jsx';

createRoot(document.getElementById('root')).render(<DashboardController />);
