import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';

try { const t = localStorage.getItem('tcs-theme'); if (t) document.documentElement.dataset.theme = t; } catch { /* storage blocked */ }
createRoot(document.getElementById('root')!).render(<App />);
