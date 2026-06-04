'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotForm from './ForgotForm';

export default function Landing() {
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <main className="min-h-screen bg-slate-955 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden min-h-[550px] relative text-left">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>

        {/* Brand / Info Panel */}
        <div className="bg-gradient-to-br from-pink-600 via-rose-700 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden select-none">
          <div className="absolute right-[-10%] top-[-10%] h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute left-[-20%] bottom-[-20%] h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-black">PS</span>
            <span>Vitara Health Mom & Baby</span>
          </div>

          <div className="space-y-4 my-8 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-pink-200">
              <Sparkles className="h-3 w-3" />
              SaaS de Telemedicina y Receta Digital
            </span>
            <h1 className="text-3xl font-black leading-tight">
              El control médico de tu embarazo y tu bebé.
            </h1>
            <p className="text-xs font-semibold text-pink-100/80 leading-relaxed max-w-sm">
              Conectamos de forma regulada el expediente clínico con las recetas farmacológicas para Obstetras, Pediatras y Madres en la República Dominicana.
            </p>
          </div>

          <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Cumplimiento Legal SNS & Ley de Salud 87-01</span>
          </div>
        </div>

        {/* Form Panel */}
        <div className="p-8 flex flex-col justify-center space-y-6 relative z-10">
          {authTab === 'login' && (
            <LoginForm 
              onForgotPasswordClick={() => setAuthTab('forgot')} 
              onRegisterClick={() => setAuthTab('register')} 
            />
          )}

          {authTab === 'register' && (
            <RegisterForm 
              onLoginClick={() => setAuthTab('login')} 
            />
          )}

          {authTab === 'forgot' && (
            <ForgotForm 
              onBackToLogin={() => setAuthTab('login')} 
            />
          )}
        </div>
      </div>
    </main>
  );
}
