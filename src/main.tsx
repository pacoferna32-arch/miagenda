import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Registrar Service Worker para Web Push y Recordatorios
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-push.js', { scope: '/' })
      .then((reg) => {
        // Service Worker registrado correctamente
        if (reg.installing) {
          console.log('Push Service Worker instalándose...');
        } else if (reg.active) {
          console.log('Push Service Worker activo.');
        }
      })
      .catch((err) => {
        console.warn('Error al registrar Service Worker de Push:', err);
      });
  });
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado en la aplicación',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] dark:bg-[#0f111a] p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8533a]/15 text-[#e8533a] flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
              Recuperación automática de la aplicación
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Se ha detectado una interrupción temporal ({this.state.errorMessage}). Tus datos están a salvo.
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="w-full py-2.5 px-4 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Recargar aplicación ahora
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppErrorBoundary>
);
