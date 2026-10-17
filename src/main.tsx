import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { ThemeProvider } from './context/ThemeContext';
import { PWAInstallProvider } from './context/PWAInstallContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PWAInstallProvider>
        <App />
      </PWAInstallProvider>
    </ThemeProvider>
  </StrictMode>,
);
