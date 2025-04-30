// Import polyfills first
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';
import { checkBrowserCompatibility, debugClickEvents } from './browserCheck';

// Check browser compatibility
checkBrowserCompatibility();

// Enable click debugging in development
if (process.env.NODE_ENV !== 'production') {
  debugClickEvents();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);