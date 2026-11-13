import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import App from './app/App';

try {
  document.documentElement.dataset.lite = localStorage.getItem('escovas-premium:lite') === '1' ? 'true' : 'false';
} catch {
  document.documentElement.dataset.lite = 'false';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
