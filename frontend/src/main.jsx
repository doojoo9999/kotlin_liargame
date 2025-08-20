import React from 'react';
import ReactDOM from 'react-dom/client';
import {AppProvider} from './app/providers/AppProvider';
import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
);