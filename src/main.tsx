import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';
import { CmsDataProvider } from './context/CmsDataContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastHost from './components/ToastHost';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <CmsDataProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <ToastHost />
      </CmsDataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
