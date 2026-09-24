import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Both faces are bundled rather than pulled from a CDN: the app has to work
// offline, and a font request to a third party is a request this user pays
// for. The third face — figures — is a 5.9 KB subset declared in index.css.
import '@fontsource-variable/public-sans';           // body, labels, buttons
import '@fontsource-variable/bricolage-grotesque';   // headings, tiers, amounts
import { reloadOnNewWorker } from './lib/boot';
import { trackViewportHeight } from './lib/viewport';
import './lib/pwaInstall'; // capture the PWA install prompt ASAP (before React mounts)
import './index.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './providers/LanguageProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppProvider } from './store/appStore';

/* Armed before React mounts: a worker can take control at any moment, and
   a controllerchange missed is a user left on the previous build. */
reloadOnNewWorker();

/* Before React mounts, so the very first layout is measured rather than guessed
   - which is the one an installed app gets wrong. */
trackViewportHeight();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AppProvider>
          <ErrorBoundary onReset={() => window.location.reload()}>
            <App />
          </ErrorBoundary>
        </AppProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
);
