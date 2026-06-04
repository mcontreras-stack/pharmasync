'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import {
  Lock,
  ShieldAlert,
  Search,
  ShieldCheck,
  Eye,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Info
} from 'lucide-react';

export default function ModerationSecurity() {
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'success' | 'failed' | 'chart'>('all');

  // Logs counters
  const totalLogs = db.audit_logs.length;
  const suspiciousLogs = db.audit_logs.filter(l => l.is_suspicious);

  // Filters
  const filteredLogs = db.audit_logs.filter(log => {
    const matchesSearch = 
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.email && log.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.ip_address.includes(searchQuery);

    let matchesFilter = true;
    if (filterType === 'success') {
      matchesFilter = log.event.includes('exitoso');
    } else if (filterType === 'failed') {
      matchesFilter = log.event.includes('fallido') || log.event.includes('bloqueado');
    } else if (filterType === 'chart') {
      matchesFilter = log.event.includes('expediente');
    }

    return matchesSearch && matchesFilter;
  });

  const handleClearAlert = (logId: string) => {
    const updatedLogs = db.audit_logs.map(log => {
      if (log.id === logId) {
        return { ...log, is_suspicious: false };
      }
      return log;
    });

    const updatedDb = { ...db, audit_logs: updatedLogs };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP ALERTS INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total logs */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Eventos Auditados</span>
            <span className="text-xl font-black text-gray-800">{totalLogs}</span>
          </div>
        </div>

        {/* Suspicious logs ticker */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${suspiciousLogs.length > 0 ? 'bg-rose-55/10 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Alertas Sospechosas</span>
            <span className={`text-xl font-black block ${suspiciousLogs.length > 0 ? 'text-rose-600' : 'text-emerald-650'}`}>{suspiciousLogs.length}</span>
          </div>
        </div>

        {/* System audit score */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Estado Cumplimiento</span>
            <span className="text-sm font-black text-slate-800">100% Conforme HIPAA</span>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATIC WARNINGS BANNER */}
      {suspiciousLogs.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-850">Intentos de Acceso Inusuales Detectados</h4>
              <p className="text-[10px] text-rose-600 mt-0.5">Se han registrado {suspiciousLogs.length} eventos sospechosos de inicio de sesión o acceso de red desde ubicaciones IP bloqueadas o con credenciales erróneas repetidas.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. LOGS AUDIT TRAIL BOARD */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-700 shrink-0" />
              Bitácora de Auditoría de Accesos Globales
            </h3>
            <p className="text-[10px] text-gray-400">Registro histórico forense de inicios de sesión y modificaciones de datos clínicos</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por IP o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-150 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-slate-400 w-52 font-medium"
              />
            </div>

            {/* Filter tags */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[9px] font-bold">
              {(['all', 'success', 'failed', 'chart'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1.5 rounded-lg capitalize transition-all duration-150 ${filterType === type ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {type === 'all' ? 'Todos' : type === 'success' ? 'Exitosos' : type === 'failed' ? 'Fallidos' : 'Expedientes'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-medium text-xs">
              No hay registros de auditoría que coincidan con la búsqueda.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${log.is_suspicious ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/50' : 'bg-slate-50 border-gray-100 hover:bg-slate-100/60'}`}
              >
                <div className="space-y-1.5 flex-1 pr-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-800 text-xs">{log.event}</span>
                    {log.is_suspicious && (
                      <span className="bg-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.25 rounded-md animate-pulse">
                        ALERTA DE SEGURIDAD
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-semibold">
                    {log.email && <span>Usuario: {log.email}</span>}
                    <span>IP: {log.ip_address}</span>
                    <span className="truncate max-w-[280px]" title={log.user_agent}>Navegador: {log.user_agent}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('es-ES')}
                  </span>
                  {log.is_suspicious && (
                    <button
                      onClick={() => handleClearAlert(log.id)}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-[9px] font-black uppercase shadow-xs transition-colors"
                      title="Descartar alerta tras verificar"
                    >
                      Resolver Alerta
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
