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
      await signUp(email, password, fullName, registerRole, phone);
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
