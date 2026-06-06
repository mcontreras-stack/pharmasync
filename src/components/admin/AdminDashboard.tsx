'use client';

import React from 'react';
import { useAuth, AdminSubRole } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import { Lock } from 'lucide-react';

// Import all sub-panels
import ExecutiveDashboard from './panels/ExecutiveDashboard';
import UserManagement from './panels/UserManagement';
import DoctorVerification from './panels/DoctorVerification';
import SubscriptionsPayments from './panels/SubscriptionsPayments';
import SupportTickets from './panels/SupportTickets';
import CmsContent from './panels/CmsContent';
import GlobalNotifications from './panels/GlobalNotifications';
import ModerationSecurity from './panels/ModerationSecurity';
import MedicalAnalytics from './panels/MedicalAnalytics';
import SystemReports from './panels/SystemReports';
import GeneralConfiguration from './panels/GeneralConfiguration';
import HipaaPrivacy from './panels/HipaaPrivacy';
import AiAutomation from './panels/AiAutomation';
import SystemMonitoring from './panels/SystemMonitoring';
import FutureRoadmap from './panels/FutureRoadmap';

export default function AdminDashboard() {
  const { user, adminSubRole, setAdminSubRole } = useAuth();
  const { activeTab } = useTab();

  if (!user || user.role !== 'admin') return null;

  // Sub-roles definition with metadata
  const subRolesInfo = {
    superadmin: {
      name: 'Super Administrador',
      desc: 'Acceso total y sin restricciones a todos los módulos y configuraciones.',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      allowedTabs: ['home', 'users', 'verify', 'billing', 'support', 'cms', 'notifications', 'security', 'med-analytics', 'reports', 'settings', 'hipaa', 'ai-auto', 'monitoring', 'roadmap']
    },
    admin: {
      name: 'Administrador Operaciones',
      desc: 'Gestión de usuarios, aprobaciones y soporte general de la plataforma.',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      allowedTabs: ['home', 'users', 'verify', 'billing', 'support', 'cms', 'notifications', 'security', 'med-analytics', 'reports', 'settings', 'hipaa', 'ai-auto', 'monitoring', 'roadmap']
    },
    calidad: {
      name: 'Auditor de Calidad Médica',
      desc: 'Revisión y auditoría de documentos sanitarios, CMS y analíticas clínicas.',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      allowedTabs: ['verify', 'cms', 'med-analytics', 'hipaa', 'roadmap']
    },
    verificador_documental: {
      name: 'Verificador Documental',
      desc: 'Revisión de colas de aprobación y validación individual de exequátur e identificaciones.',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      allowedTabs: ['verify', 'roadmap']
    },
    soporte: {
      name: 'Agente de Soporte Técnico',
      desc: 'Gestión de tickets y resolución de incidencias (Acceso restringido a datos clínicos y financieros).',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      allowedTabs: ['users', 'support', 'notifications', 'roadmap']
    },
    finanzas: {
      name: 'Analista de Finanzas',
      desc: 'Gestión de suscripciones, planes de pago y reportes financieros MRR/ARR (Acceso restringido a historias clínicas).',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      allowedTabs: ['home', 'billing', 'reports', 'roadmap']
    },
    auditor: {
      name: 'Auditor de Cumplimiento & HIPAA',
      desc: 'Vista de solo lectura a logs de seguridad, HIPAA y monitoreo técnico.',
      badgeColor: 'bg-slate-550/20 text-slate-300 border-slate-500/30',
      allowedTabs: ['home', 'users', 'billing', 'security', 'med-analytics', 'reports', 'hipaa', 'monitoring', 'roadmap']
    }
  };

  const currentRoleConfig = subRolesInfo[adminSubRole] || subRolesInfo.superadmin;
  const isTabAllowed = currentRoleConfig.allowedTabs.includes(activeTab);

  const renderActivePanel = () => {
    if (!isTabAllowed) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-12 text-center max-w-xl mx-auto my-12 space-y-6">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">Módulo Restringido</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El rol <span className="font-bold text-slate-200">{currentRoleConfig.name}</span> no posee permisos para acceder a esta pestaña. 
              Esta política de seguridad HIPAA previene la exposición innecesaria de datos.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Requerido: Superadmin, Admin o Rol Específico de {activeTab.toUpperCase()}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return <ExecutiveDashboard />;
      case 'users':
        return <UserManagement />;
      case 'verify':
        return <DoctorVerification />;
      case 'billing':
        return <SubscriptionsPayments />;
      case 'support':
        return <SupportTickets />;
      case 'cms':
        return <CmsContent />;
      case 'notifications':
        return <GlobalNotifications />;
      case 'security':
        return <ModerationSecurity />;
      case 'med-analytics':
        return <MedicalAnalytics />;
      case 'reports':
        return <SystemReports />;
      case 'settings':
        return <GeneralConfiguration />;
      case 'hipaa':
        return <HipaaPrivacy />;
      case 'ai-auto':
        return <AiAutomation />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'roadmap':
        return <FutureRoadmap />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Admin Operations Sub-Role Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-850 to-transparent pointer-events-none rounded-bl-full"></div>
        
        <div className="space-y-1 relative z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Panel de Control Interno</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${currentRoleConfig.badgeColor}`}>
              {currentRoleConfig.name}
            </span>
          </div>
          <h2 className="text-base font-black text-white">Consola de Control del Negocio</h2>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {currentRoleConfig.desc}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3 relative z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rol Operativo:</label>
          <span className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold font-mono">
            {subRolesInfo[adminSubRole]?.name || 'Super Administrador'}
          </span>
        </div>

      </div>

      <div className="mt-4">
        {renderActivePanel()}
      </div>
    </div>
  );
}
