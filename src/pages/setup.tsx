'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getMockDb } from '@/lib/mockDb';
import { hasAdmins } from '@/services/adminService';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
    const checkAdminStatus = async () => {
      try {
        if (typeof window === 'undefined') return;
        // Primero verificar si hay sesión activa de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Ya hay un usuario logueado, ir directo al home
          router.push('/');
          return;
        }
        const adminsExist = await hasAdmins();
        setHasExistingAdmins(adminsExist);
        if (adminsExist) {
          setTimeout(() => router.push('/'), 1500);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        // En caso de error, mostrar false para que no quede bloqueado
        setHasExistingAdmins(false);
      }
    };
    checkAdminStatus();
  }, [router]);

  const handleForceMockMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vitarahealth_force_mock_mode', 'true');
      const db = getMockDb();
      const adminUser = db.profiles.find(p => p.role === 'admin') || {
        id: 'admin-super-999',
        email: 'admin@vitarahealth.com',
        full_name: 'Admin Vitara Health',
        role: 'admin',
        status: 'approved'
      };
      localStorage.setItem('vitarahealth_user', JSON.stringify(adminUser));
      router.push('/admin');
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
      // Validaciones básicas
      if (!formData.email || !formData.password || !formData.fullName) {
        throw new Error('Por favor completa todos los campos');
      }

      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres para mayor seguridad');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas ingresadas no coinciden');
      }

      console.log('Intentando registro inicial en Supabase...');

      // 1. Intentar el registro
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'admin',
          },
          emailRedirectTo: `${siteUrl}/`,
        },
      });

      if (signUpError) {
        console.error('Error de Supabase:', signUpError);
        throw new Error(`Error de Supabase: ${signUpError.message}`);
      }

      if (!data.user) {
        throw new Error('El registro se completó pero no se recibió información del usuario. Verifica si el email ya existe o si necesitas confirmar el correo.');
      }

      // 2. Pequeña pausa para asegurar que los triggers de DB se ejecuten
      await new Promise((resolve) => resolve(setTimeout(() => {}, 2000)));

      // 3. Intentar login automático para confirmar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        console.warn('Registro exitoso pero login fallido (posiblemente falta confirmar email):', signInError);
        setError('¡Cuenta creada! Pero necesitas confirmar tu email o desactivar la confirmación en Supabase para entrar.');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (err) {
      const errorInstance = err as Error;
      setError(errorInstance.message || 'Error inesperado durante la configuración');
      console.error('Setup error details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (hasExistingAdmins === null) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-6">
          <Loader2 className="h-10 w-10 text-pink-500 animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Verificando...</p>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-400 hover:text-white underline transition-colors font-bold mt-2"
          >
            ← Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (hasExistingAdmins === true) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-10 text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Sistema ya Inicializado</h2>
          <p className="text-sm text-slate-400">Ya existe un Super Usuario configurado. Serás redirigido al portal de acceso.</p>
          <div className="pt-4">
             <Loader2 className="h-5 w-5 text-slate-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4 font-sans selection:bg-pink-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-pink-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[40px] p-8 md:p-10 shadow-3xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl items-center justify-center shadow-lg shadow-pink-500/20 mb-2">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight italic">PharmaSync</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Configuración Maestra</p>
          </div>

          {/* Alert Info */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Estás configurando el <span className="text-blue-400 font-bold">Acceso Raíz</span>. Esta cuenta tendrá control absoluto sobre médicos, pacientes y auditoría clínica.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="space-y-3">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-medium flex items-center gap-3 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {error.includes('Supabase') && (
                  <button
                    type="button"
                    onClick={handleForceMockMode}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 px-4 rounded-2xl text-xs border border-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Usar Modo Demostración Local (Sin Base de Datos)
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Administrador</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ej. Dr. Mario Contreras"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico Principal</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@alvisautomate.com"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Repetir</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black py-4 rounded-[20px] transition-all shadow-xl shadow-pink-600/20 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Inicializar Infraestructura
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">PharmaSync Core v1.0</span>
            <div className="flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Sistema Listo</span>
            </div>
          </div>

          {/* Enlace al login normal */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-[11px] text-slate-400 hover:text-pink-400 transition-colors font-bold underline"
            >
              ← Ya tengo una cuenta &mdash; Ir al Login
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
