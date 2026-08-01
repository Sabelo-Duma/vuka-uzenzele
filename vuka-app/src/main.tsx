import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/figtree'; // bundled, self-hosted brand font (offline-friendly)
import './lib/pwaInstall'; // capture the PWA install prompt ASAP (before React mounts)
import './index.css';
import { App } from './App';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppProvider } from './store/appStore';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </StrictMode>,
);
