'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import {
  Home,
  Calendar,
  Baby,
  MessageSquare,
  User,
  TrendingUp,
  Settings,
  ShieldCheck,
  ClipboardCheck,
  CreditCard,
  Users,
  Activity,
  Bell,
  Lock,
  Cpu,
  Bookmark,
  FileBarChart2,
  FileDown,
  FileText
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useTab();

  if (!user) return null;

  const role = user.role;

  // Configuration for tabs based on active role
  const motherMenu = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'citas', label: 'Citas Médicas', icon: Calendar },
    { id: 'hijos', label: 'Mis Hijos / Bebé', icon: Baby },
    { id: 'prescriptions', label: 'Mis Recetas', icon: FileText },
    { id: 'chat', label: 'Mensajes', icon: MessageSquare },
    { id: 'perfil', label: 'Mi Salud / Perfil', icon: User }
  ];

  const obstetricianMenu = [
    { id: 'home', label: 'Lista de Pacientes', icon: User },
    { id: 'citas', label: 'Agenda de Citas', icon: Calendar },
    { id: 'prescriptions', label: 'Recetas Emitidas', icon: FileText },
    { id: 'chat', label: 'Chat Pacientes', icon: MessageSquare }
  ];

  const pediatricianMenu = [
    { id: 'home', label: 'Lista de Niños', icon: Baby },
    { id: 'citas', label: 'Agenda Pediátrica', icon: Calendar },
    { id: 'prescriptions', label: 'Recetas Emitidas', icon: FileText },
    { id: 'chat', label: 'Chat Padres', icon: MessageSquare }
  ];

  // Grouped Admin Menu for global platform management
  const adminGroups = [
    {
      title: 'OPERACIONES',
      items: [
        { id: 'home', label: 'Resumen Ejecutivo', icon: Home },
        { id: 'users', label: 'Gestión Usuarios', icon: Users },
        { id: 'verify', label: 'Verificaciones', icon: ClipboardCheck },
        { id: 'billing', label: 'Suscripciones y Pagos', icon: CreditCard }
      ]
    },
    {
      title: 'ATENCIÓN Y CONTENIDO',
      items: [
        { id: 'support', label: 'Soporte y Tickets', icon: MessageSquare },
        { id: 'cms', label: 'CMS y Contenido', icon: Bookmark },
        { id: 'notifications', label: 'Notificaciones', icon: Bell }
      ]
    },
    {
      title: 'CONTROLES Y SEGURIDAD',
      items: [
        { id: 'security', label: 'Auditoría / Seguridad', icon: Lock },
        { id: 'med-analytics', label: 'Analíticas Médicas', icon: Activity },
        { id: 'reports', label: 'Generador Reportes', icon: FileDown },
        { id: 'hipaa', label: 'Privacidad HIPAA', icon: ShieldCheck }
      ]
    },
    {
      title: 'SISTEMA Y ROADMAP',
      items: [
        { id: 'ai-auto', label: 'IA y Automatización', icon: Cpu },
        { id: 'monitoring', label: 'Monitoreo del Sistema', icon: FileBarChart2 },
        { id: 'roadmap', label: 'Roadmap Integración', icon: TrendingUp }
      ]
    }
  ];

  let currentMenu = motherMenu;
  let activeStyles = 'bg-pink-500 text-white shadow-sm';
  let hoverStyles = 'hover:bg-pink-50 text-gray-600 hover:text-pink-600';

  if (role === 'obstetrician') {
    currentMenu = obstetricianMenu;
    activeStyles = 'bg-purple-500 text-white shadow-sm';
    hoverStyles = 'hover:bg-purple-50 text-gray-600 hover:text-purple-600';
  } else if (role === 'pediatrician') {
    currentMenu = pediatricianMenu;
    activeStyles = 'bg-emerald-500 text-white shadow-sm';
    hoverStyles = 'hover:bg-emerald-50 text-gray-600 hover:text-emerald-600';
  } else if (role === 'admin') {
    activeStyles = 'bg-slate-800 text-white shadow-xs';
    hoverStyles = 'hover:bg-slate-50 text-slate-600 hover:text-slate-900';
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-4 h-[calc(100vh-61px)] justify-between select-none">
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
        {role !== 'admin' ? (
          <>
            <div className="px-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Menú Principal
              </span>
            </div>
            <nav className="space-y-1">
              {currentMenu.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? activeStyles : hoverStyles}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </>
        ) : (
          /* Grouped layout for platform owners */
          <div className="space-y-5">
            {adminGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <div className="px-2.5">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400/80">
                    {group.title}
                  </span>
                </div>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold text-xs transition-all duration-150 ${isActive ? activeStyles : hoverStyles}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="pt-4 border-t border-gray-50 space-y-1">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${role === 'admin' && activeTab === 'settings' ? 'bg-slate-100 text-slate-850 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </button>
        <div className="px-3 py-2 text-[10px] text-gray-400 font-light flex items-center gap-1.5 justify-center">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Datos encriptados (HIPAA)</span>
        </div>
      </div>
    </aside>
  );
}
