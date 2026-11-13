import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
function App() {
  return <main><p>Farm management · scaffold</p><h1>Farm Overseer</h1><p>A shared workspace for fields, plants, people, inventory, and farm operations.</p><ul><li>Field maps: plants, poles, sensors, and irrigation</li><li>Inventory: map locations and photos</li><li>Recurring treatments and work history</li><li>Staff management</li><li>Field and plant statistics</li><li>Observations, estimates, and uncertain information</li></ul><p>These features are planned. No farm data is stored yet.</p></main>;
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(<StrictMode><App /></StrictMode>);
