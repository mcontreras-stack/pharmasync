'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Heart, Shield, Baby, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onForgotPasswordClick: () => void;
  onRegisterClick: () => void;
}

export default function LoginForm({ onForgotPasswordClick, onRegisterClick }: LoginFormProps) {
  const { signIn, isMockMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => {
    setErrorMsg('');
    let demoEmail = 'maria@vitarahealth.com';
    if (role === 'obstetrician') demoEmail = 'ana.rodriguez@vitarahealth.com';
    if (role === 'pediatrician') demoEmail = 'andres.pediatra@vitarahealth.com';
    if (role === 'admin') demoEmail = 'admin@vitarahealth.com';

    setLoading(true);
    try {
      await signIn(demoEmail, '123456', role);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">Ingresar al Portal</h2>
        <p className="text-[10px] text-slate-400 mt-1">
          {isMockMode 
            ? "Ingresa tus credenciales o selecciona un perfil demo pre-aprobado."
            : "Ingresa tus credenciales para acceder a tu cuenta."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Mail className="h-3 w-3 text-slate-500" /> Correo Electrónico
          </label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 transition-colors"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-500" /> Contraseña
            </label>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-[9px] text-slate-400 hover:text-white transition-colors"
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 transition-colors"
            required
            disabled={loading}
          />
        </div>

        {errorMsg && (
          <p className="text-[10px] text-rose-450 font-bold bg-rose-950/20 border border-rose-500/10 p-2.5 rounded-xl text-center">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            'Ingresar con mi cuenta'
          )}
        </button>
      </form>

      {/* Demo users list */}
      {isMockMode && (
        <div className="space-y-2 pt-2">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-1">Acceso Demo Rápido (Contraseña: 123456):</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('mother')}
              disabled={loading}
              className="flex items-center gap-2 p-2.5 bg-pink-955/20 border border-pink-500/20 rounded-xl hover:bg-pink-950/30 text-left transition-all cursor-pointer"
            >
              <Heart className="h-4 w-4 text-pink-405 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-pink-300">Madre Demo</p>
                <p className="text-[8px] text-pink-400/70 truncate">María López</p>
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin('obstetrician')}
              disabled={loading}
              className="flex items-center gap-2 p-2.5 bg-purple-955/20 border border-purple-500/20 rounded-xl hover:bg-purple-955/30 text-left transition-all cursor-pointer"
            >
              <Shield className="h-4 w-4 text-purple-405 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-purple-300">Obstetra Demo</p>
                <p className="text-[8px] text-purple-400/70 truncate">Dra. Ana R.</p>
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin('pediatrician')}
              disabled={loading}
              className="flex items-center gap-2 p-2.5 bg-emerald-955/20 border border-emerald-500/20 rounded-xl hover:bg-emerald-955/30 text-left transition-all cursor-pointer"
            >
              <Baby className="h-4 w-4 text-emerald-405 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-emerald-300">Pediatra Demo</p>
                <p className="text-[8px] text-emerald-400/70 truncate">Dr. Andrés P.</p>
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 text-left transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-slate-300 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-205">Administrador</p>
                <p className="text-[8px] text-slate-400 truncate">Admin Juan</p>
              </div>
            </button>
          </div>
        </div>
      )}
      
      <div className="text-center pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRegisterClick}
          className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          disabled={loading}
        >
          ¿No tienes una cuenta? <span className="text-pink-400 font-bold hover:underline">Regístrate</span>
        </button>
        {isMockMode && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas restablecer la base de datos local de demostración? Esto borrará tus registros locales creados.')) {
                localStorage.removeItem('vitarahealth_mock_db');
                localStorage.removeItem('vitarahealth_user');
                window.location.reload();
              }
            }}
            className="text-[9px] text-slate-550 hover:text-rose-400 transition-colors font-bold uppercase tracking-wider mt-1 cursor-pointer"
            disabled={loading}
          >
            Restablecer Base de Datos Demo
          </button>
        )}
        {isMockMode && (
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('vitarahealth_force_mock_mode');
              localStorage.removeItem('vitarahealth_user');
              window.location.href = '/';
            }}
            className="text-[10px] text-pink-400 hover:text-pink-300 font-bold transition-colors underline cursor-pointer mt-1"
            disabled={loading}
          >
            Volver a Modo Producción
          </button>
        )}
      </div>
    </div>
  );
}
