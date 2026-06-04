'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotFormProps {
  onBackToLogin: () => void;
}

export default function ForgotForm({ onBackToLogin }: ForgotFormProps) {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccessMsg('Código de recuperación enviado. Revisa tu buzón de correo.');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar el código de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!code || !newPassword) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('La contraseña nueva debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email, code, newPassword);
      setSuccessMsg('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'El código ingresado es incorrecto o expiró.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Recuperar Acceso</h2>
        <p className="text-[10px] text-slate-400 mt-1">
          {step === 1 
            ? 'Ingresa tu correo y te enviaremos un código de seguridad para restablecer tu cuenta.' 
            : 'Ingresa el código OTP enviado y tu nueva contraseña.'}
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-500" /> Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="ana.santos@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              'Enviar Código de Restablecimiento'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
              <KeyRound className="h-3 w-3 text-slate-500" /> Código OTP de Restablecimiento
            </label>
            <input
              type="text"
              placeholder="Ej. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 transition-colors text-center font-mono letter-spacing-2"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-500" /> Nueva Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              'Guardar Nueva Contraseña'
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 mx-auto"
          disabled={loading}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a Iniciar Sesión
        </button>
      </div>
    </div>
  );
}
