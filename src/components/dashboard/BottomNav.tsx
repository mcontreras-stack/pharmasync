'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import { Home, Calendar, Baby, MessageSquare, Heart, Users, Activity } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useTab();

  if (!user) return null;

  const role = user.role;

  // Configuration for tabs based on active role
  const motherMenu = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'hijos', label: 'Bebé', icon: Baby },
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'perfil', label: 'Perfil', icon: Heart }
  ];

  const doctorMenu = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'citas', label: 'Agenda', icon: Calendar },
    { id: 'chat', label: 'Mensajes', icon: MessageSquare }
  ];

  const adminMenu = [
    { id: 'home', label: 'Resumen', icon: Home },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'support', label: 'Soporte', icon: MessageSquare },
    { id: 'monitoring', label: 'Monitoreo', icon: Activity }
  ];

  let currentMenu = motherMenu;
  if (role === 'obstetrician' || role === 'pediatrician') {
    currentMenu = doctorMenu;
  } else if (role === 'admin') {
    currentMenu = adminMenu;
  }

  // Active theme indicator
  let activeText = 'text-pink-600';
  if (role === 'obstetrician') activeText = 'text-purple-600';
  if (role === 'pediatrician') activeText = 'text-emerald-600';
  if (role === 'admin') activeText = 'text-slate-800';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-2 py-1.5 flex items-center justify-around z-40 select-none shadow-lg pb-safe-bottom">
      {currentMenu.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 text-center transition-all duration-200"
          >
            <Icon className={`h-5 w-5 ${isActive ? activeText : 'text-gray-400 hover:text-gray-600'}`} />
            <span className={`text-[10px] font-semibold tracking-wide ${isActive ? activeText : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
