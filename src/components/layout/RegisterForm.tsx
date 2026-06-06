'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, Lock, Sparkles } from 'lucide-react';

interface RegisterFormProps {
  onLoginClick: () => void;
}

export default function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'mother' | 'obstetrician' | 'pediatrician'>('mother');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !email || !phone || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, registerRole, phone, selectedPlan);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Crear Nueva Cuenta</h2>
        <p className="text-[10px] text-slate-400 mt-1">Regístrate en la red clínica para activar tu expediente digital.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <User className="h-3 w-3 text-slate-500" /> Nombre Completo
          </label>
          <input
            type="text"
            placeholder="Ej. Dra. Ana Santos o María López"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Mail className="h-3 w-3 text-slate-500" /> Correo Electrónico
          </label>
          <input
            type="email"
            placeholder="ana.santos@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-500" /> Teléfono / WhatsApp
          </label>
          <input
            type="tel"
            placeholder="809-555-1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Lock className="h-3 w-3 text-slate-500" /> Contraseña (Mínimo 6 caracteres)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-slate-500" /> Tipo de Cuenta
          </label>
          <select
            value={registerRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRegisterRole(e.target.value as 'mother' | 'obstetrician' | 'pediatrician')}
            className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-205 focus:outline-none focus:border-pink-500 cursor-pointer"
            disabled={loading}
          >
            <option value="mother">Madre / Familia</option>
            <option value="obstetrician">Médico Obstetra</option>
            <option value="pediatrician">Médico Pediatra</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-slate-500" /> Plan de Suscripción
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {/* Free Plan */}
            <div
              onClick={() => !loading && setSelectedPlan('free')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-24 text-left ${
                selectedPlan === 'free'
                  ? 'bg-pink-950/20 border-pink-500/80 shadow-md'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-white">Gratis</p>
                <p className="text-[7.5px] text-slate-400 mt-0.5 leading-tight">Seguimiento básico y portal web</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-black text-pink-400">$0.00</span>
                <div className="h-3 w-3 rounded-full border border-pink-500 flex items-center justify-center">
                  {selectedPlan === 'free' && <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />}
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div
              className="p-2.5 rounded-xl border border-slate-800/40 bg-slate-950/20 opacity-45 cursor-not-allowed flex flex-col justify-between h-24 text-left relative overflow-hidden"
              title="Plan Premium - No disponible actualmente"
            >
              <div className="absolute top-1 right-1 bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[5.5px] font-extrabold uppercase tracking-widest px-0.5 rounded-sm">
                Pro
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">Premium</p>
                <p className="text-[7.5px] text-slate-500 mt-0.5 leading-tight">IA Diagnósticos y alertas activas</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-bold text-slate-500">$9.99/m</span>
                <span className="text-[7px] font-bold text-slate-500">Demo</span>
              </div>
            </div>

            {/* Hospital Plan */}
            <div
              className="p-2.5 rounded-xl border border-slate-800/40 bg-slate-950/20 opacity-45 cursor-not-allowed flex flex-col justify-between h-24 text-left relative overflow-hidden"
              title="Plan Clínico - No disponible actualmente"
            >
              <div className="absolute top-1 right-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[5.5px] font-extrabold uppercase tracking-widest px-0.5 rounded-sm">
                Clínica
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">Clínica</p>
                <p className="text-[7.5px] text-slate-500 mt-0.5 leading-tight">Soporte médico integrado</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-bold text-slate-500">$49.99/m</span>
                <span className="text-[7px] font-bold text-slate-500">Demo</span>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-[10px] text-rose-400 font-bold text-center bg-rose-950/20 border border-rose-500/10 p-2 rounded-xl">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            'Registrarse y Validar'
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onLoginClick}
          className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          disabled={loading}
        >
          ¿Ya tienes cuenta? <span className="text-emerald-400 font-bold hover:underline">Inicia Sesión</span>
        </button>
      </div>
    </div>
  );
}
