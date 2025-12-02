import React from 'react';
import ReactDOM from 'react-dom/client';
import {initAnalytics} from './analytics';
import App from './App';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-LN9LN30S0S';

initAnalytics(measurementId);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
