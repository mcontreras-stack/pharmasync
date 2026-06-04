'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error de Runtime capturado por ErrorBoundary:', error, errorInfo);
    // En producción comercial, aquí se reportaría a un servicio de telemetría seguro (e.g. Sentry/LogRocket)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-[32px] p-8 shadow-2xl text-center space-y-6">
            <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-black text-white">Ha ocurrido un error inesperado</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema experimentó una interrupción temporal. Los registros médicos continúan seguros y encriptados.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-left">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Detalles del Error</span>
                <p className="text-[10px] font-mono text-rose-400 break-words leading-normal select-text">
                  {this.state.error.message || 'Error desconocido'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Home className="h-3.5 w-3.5" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
