'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Lock, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email') || '';
  const codeParam = searchParams?.get('code') || '';

  const { confirmPasswordReset } = useAuth();
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !code || !newPassword || !confirmPassword) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('La contraseña nueva debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email, code, newPassword);
      setSuccessMsg('Tu contraseña ha sido actualizada correctamente. Serás redirigido al portal.');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'El código ingresado es incorrecto, expiró o tu cuenta no existe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-6 text-left relative overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>

      <div className="text-center space-y-2">
        <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-black text-white">Reestablecer Contraseña</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ingresa tus datos de restablecimiento seguros para fijar tu nueva clave de acceso clínico.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!emailParam || loading}
            placeholder="ana.santos@correo.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Código OTP de Seguridad</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!codeParam || loading}
            placeholder="Ingresa los 6 dígitos"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white text-center font-mono focus:outline-none focus:border-pink-500 disabled:opacity-50"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Nueva Contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            placeholder="Mínimo 6 caracteres"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Confirmar Nueva Contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Repite la contraseña"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/20 border border-rose-500/10 text-rose-450 rounded-xl text-[10px] font-bold flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            'Actualizar Contraseña'
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <a
          href="/"
          className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
        </a>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-955 text-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
          <p className="text-[10px] text-slate-400 font-bold mt-4">Iniciando pasarela de restablecimiento...</p>
        </div>
      }>
        <ResetPasswordFormContent />
      </Suspense>
    </main>
  );
}
