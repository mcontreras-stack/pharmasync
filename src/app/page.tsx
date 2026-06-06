'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import { Clock, CheckCircle, LogOut, ShieldCheck } from 'lucide-react';

// Import subcomponents
import Landing from '@/components/layout/Landing';
import OtpVerification from '@/components/layout/OtpVerification';
import OnboardingWizard from '@/components/layout/OnboardingWizard';
import Shell from '@/components/layout/Shell';

// Import dashboards & tabs
import MotherDashboard from '@/components/mother/MotherDashboard';
import ObstetricianDashboard from '@/components/obstetrician/ObstetricianDashboard';
import PediatricianDashboard from '@/components/pediatrician/PediatricianDashboard';
import AppointmentsTab from '@/components/dashboard/AppointmentsTab';
import ChatTab from '@/components/dashboard/ChatTab';
import ProfileTab from '@/components/mother/ProfileTab';
import AdminDashboard from '@/components/admin/AdminDashboard';
import DoctorSettingsTab from '@/components/dashboard/DoctorSettingsTab';
import PrescriptionsTab from '@/components/dashboard/PrescriptionsTab';

export default function RootPage() {
  const { user, loading, signOut, updateUserStatus } = useAuth();
  const { activeTab } = useTab();
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = !!localStorage.getItem('vitarahealth_admin_impersonator');
      setTimeout(() => {
        setIsImpersonating(val);
      }, 0);
    }
  }, [user]);

  const handleExitImpersonation = () => {
    if (typeof window === 'undefined') return;
    const adminSession = localStorage.getItem('vitarahealth_admin_impersonator');
    if (adminSession) {
      localStorage.setItem('vitarahealth_user', adminSession);
      localStorage.removeItem('vitarahealth_admin_impersonator');
      window.location.reload();
    }
  };

  const handleOnboardingSubmitted = () => {
    updateUserStatus('under_review');
  };

  const handleOtpVerify = () => {
    updateUserStatus('pending_documents');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-xs text-slate-400 font-semibold mt-4">Cargando Vitara Health...</p>
      </div>
    );
  }

  // --- 1. LANDING PORTAL ---
  if (!user) {
    return <Landing />;
  }

  // --- 2. OTP TWO-STEP VERIFICATION ---
  if (user.status === 'email_pending') {
    return <OtpVerification userEmail={user.email} onVerify={handleOtpVerify} onSignOut={signOut} />;
  }

  // --- 3. PENDIENTE DE APROBACIÓN POR EL ADMIN ---
  if (user.status === 'under_review') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>
        <div className="w-full max-w-md z-10 bg-slate-900/60 backdrop-blur-2xl border border-slate-800/50 rounded-[40px] p-10 space-y-8 text-center shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <Clock className="h-9 w-9 text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Cuenta Creada</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">Pendiente de Aprobación</p>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-pink-400 shrink-0" />
              <span className="text-xs font-bold text-white">Tu cuenta fue registrada exitosamente</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tu solicitud está siendo revisada por el administrador del sistema.
              Recibirás acceso completo una vez que tu cuenta sea aprobada.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">En Revisión por Administrador</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-slate-500">
            <p>¿Necesitas ayuda? Contacta a</p>
            <a href="mailto:admin@alvisautomate.com" className="text-pink-400 font-bold hover:text-pink-300 transition-colors">
              admin@alvisautomate.com
            </a>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-2xl text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // --- 4. ONBOARDING DOCUMENTS UPLOAD ---
  if (user.status === 'pending_documents' || user.status === 'rejected') {
    return <OnboardingWizard user={user} onSignOut={signOut} onSubmitted={handleOnboardingSubmitted} />;
  }

  // --- 4. SECURE APP LAYOUT SHELL ---
  const renderTabContent = () => {
    if (user.role === 'mother') {
      switch (activeTab) {
        case 'home':
        case 'hijos':
          return <MotherDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'chat':
          return <ChatTab />;
        case 'perfil':
          return <ProfileTab />;
        default:
          return <MotherDashboard />;
      }
    }

    if (user.role === 'obstetrician') {
      switch (activeTab) {
        case 'home':
          return <ObstetricianDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'chat':
          return <ChatTab />;
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'settings':
          return <DoctorSettingsTab />;
        default:
          return <ObstetricianDashboard />;
      }
    }

    if (user.role === 'pediatrician') {
      switch (activeTab) {
        case 'home':
          return <PediatricianDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'chat':
          return <ChatTab />;
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'settings':
          return <DoctorSettingsTab />;
        default:
          return <PediatricianDashboard />;
      }
    }

    if (user.role === 'admin') {
      return <AdminDashboard />;
    }

    return <div className="text-xs text-gray-500 font-bold p-10">Perfil no reconocido.</div>;
  };

  return (
    <Shell 
      user={user} 
      isImpersonating={isImpersonating} 
      onExitImpersonation={handleExitImpersonation} 
      renderTabContent={renderTabContent} 
    />
  );
}
