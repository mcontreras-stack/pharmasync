'use client';

import React from 'react';
import Header from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';
import BottomNav from '../dashboard/BottomNav';

interface ShellProps {
  user: {
    full_name: string;
    email: string;
    status?: string;
  };
  isImpersonating: boolean;
  onExitImpersonation: () => void;
  renderTabContent: () => React.ReactNode;
}

export default function Shell({ user, isImpersonating, onExitImpersonation, renderTabContent }: ShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50/50">
      {/* Impersonation Warning Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-3 z-50 shadow-xs shrink-0 select-none">
          <span>⚠️ Modo Impersonación Activo: Visualizando la plataforma como {user.full_name} ({user.email})</span>
          <button
            onClick={onExitImpersonation}
            className="bg-slate-950 text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            Volver a Admin
          </button>
        </div>
      )}
      
      <Header />
      
      {/* Review banner block for professionals/mothers */}
      {user.status === 'under_review' && (
        <div className="bg-amber-500 border-b border-amber-600 text-slate-955 px-4 py-2.5 text-center text-[10px] font-extrabold flex items-center justify-center gap-2 z-40 shadow-xs shrink-0 select-none">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping"></span>
          <span>⚠️ Tu cuenta se encuentra en revisión. La validación de credenciales médicas y documentos puede tardar hasta 24 horas hábiles. Las funciones principales están temporalmente limitadas.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          {renderTabContent()}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
