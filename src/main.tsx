import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { runStartupSecurityAndStorageAudit } from './utils/securityGuard';
import './index.css';

// Run self-healing storage & security audit before mounting
runStartupSecurityAndStorageAudit();

// Global resilience listeners to prevent unhandled promise rejections or script errors from disrupting users
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Aegis Resilience Guard] Intercepted unhandled rejection:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    // Intercept third-party script/extension errors gracefully
    if (event.filename && !event.filename.includes(window.location.origin)) {
      console.warn('[Aegis Resilience Guard] Filtered external script error:', event.message);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
