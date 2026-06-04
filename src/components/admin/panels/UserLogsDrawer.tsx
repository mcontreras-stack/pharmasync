'use client';

import React from 'react';
import { Profile, AuditLog } from '@/types/database';
import { History, X, AlertCircle } from 'lucide-react';

interface UserLogsDrawerProps {
  user: Profile | null;
  logs: AuditLog[];
  onClose: () => void;
}

export default function UserLogsDrawer({ user, logs, onClose }: UserLogsDrawerProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 border-l border-gray-100 flex flex-col justify-between animate-slide-in">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-sky-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800">Bitácora de Seguridad</h3>
                <p className="text-[10px] text-sky-600 font-semibold">{user.full_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Logs loop */}
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                No hay registros de seguridad guardados para este usuario.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border text-xs relative ${log.is_suspicious ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-gray-100'}`}
                >
                  {log.is_suspicious && (
                    <span className="absolute top-3 right-3 text-[8px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-md animate-pulse">
                      Sospechoso
                    </span>
                  )}
                  <h4 className="font-bold text-slate-800 pr-12">{log.event || log.action}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Origen IP: {log.ip_address}</p>
                  <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate" title={log.user_agent}>
                    UA: {log.user_agent}
                  </p>
                  <span className="text-[9px] text-gray-400 block mt-2 text-right font-medium">
                    {new Date(log.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Cerrar Bitácora
        </button>
      </div>
    </div>
  );
}
