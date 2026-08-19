import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/AuthProvider.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider><AuthProvider><App /></AuthProvider></I18nProvider>
  </React.StrictMode>,
);
