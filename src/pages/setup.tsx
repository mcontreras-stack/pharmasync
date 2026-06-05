'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hasAdmins } from '@/services/adminService';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingAdmins, setHasExistingAdmins] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      if (typeof window === 'undefined') return;
      const adminsExist = await hasAdmins();
      setHasExistingAdmins(adminsExist);

      if (adminsExist) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.fullName) {
        throw new Error('Por favor completa todos los campos');
      }

      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'admin',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Error al crear el usuario');
      }

      // Pequeña pausa para asegurar que el trigger se ejecute
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al crear el Super Usuario');
      console.error('Setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (hasExistingAdmins === null) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-pink-500/20 border border-pink-500/30 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">PharmaSync</h1>
            <p className="text-slate-400 text-sm font-medium">Configuración de Super Usuario</p>
          </div>

          {/* Alert */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-400 leading-relaxed">
            Estás iniciando el sistema por primera vez. Esta cuenta tendrá <strong>acceso total</strong> para gestionar médicos, pacientes y recetas.
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ej. Dr. Alexander Smith"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Maestro</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@pharmasync.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Inicializar Plataforma
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-500 font-medium">
            PharmaSync Production Environment v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
