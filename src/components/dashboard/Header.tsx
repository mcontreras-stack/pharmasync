'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Bell, Shield, User, RefreshCw } from 'lucide-react';

export default function Header() {
  const { user, signOut, switchRole, isMockMode } = useAuth();

  if (!user) return null;

  // Determine theme color based on role
  let themeColor = 'text-pink-600 bg-pink-50';
  let badgeLabel = 'Madre / Paciente';
  if (user.role === 'obstetrician') {
    themeColor = 'text-purple-600 bg-purple-50';
    badgeLabel = 'Obstetra';
  } else if (user.role === 'pediatrician') {
    themeColor = 'text-emerald-600 bg-emerald-50';
    badgeLabel = 'Pediatra';
  } else if (user.role === 'admin') {
    themeColor = 'text-slate-700 bg-slate-100';
    badgeLabel = 'Administrador';
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      {/* Brand Logo & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
          <span className="text-pink-500">Pharma</span>
          <span className="text-emerald-500">Sync</span>
          <span className="text-gray-400 font-light text-sm ml-1 hidden sm:inline">Mom & Baby</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${themeColor}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Notifications Icon */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* Profile Card / Log Out */}
        <div className="flex items-center gap-2 border-l border-gray-100 pl-2 sm:pl-4">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt="Avatar" 
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-8 w-8 bg-slate-100 text-slate-700 font-bold border border-gray-200 rounded-full flex items-center justify-center text-[10px] uppercase">
              {user.full_name.substring(0, 2)}
            </div>
          )}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-gray-800 leading-tight">{user.full_name}</span>
            <span className="text-[10px] text-gray-400">{user.email}</span>
          </div>
          <button 
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
