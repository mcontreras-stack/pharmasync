'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';

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

  // --- 3. ONBOARDING DOCUMENTS UPLOAD ---
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
