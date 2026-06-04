import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App/App.jsx'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx'
import { HashRouter } from 'react-router-dom';
import './index.css'

// Clear cached figures on startup to ensure migrations and database updates are loaded
try {
  localStorage.removeItem('diaspora_figures');
  localStorage.removeItem('diaspora_figures_ts');
  localStorage.removeItem('diaspora_featured');
  localStorage.removeItem('diaspora_featured_ts');
} catch (e) {
  console.warn('Failed to clear initial localStorage cache:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
