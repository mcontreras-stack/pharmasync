'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import {
  ShieldCheck,
  FileText,
  UserX,
  UserCheck,
  FileDown,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  FileKey
} from 'lucide-react';

export default function HipaaPrivacy() {
  const [db, setDb] = useState(getMockDb());

  // Filter requests
  const pendingRequests = db.privacy_requests.filter(r => r.status === 'pending');
  const completedRequests = db.privacy_requests.filter(r => r.status !== 'pending');

  const handleUpdateRequestStatus = (requestId: string, nextStatus: 'completed' | 'canceled') => {
    const updatedRequests = db.privacy_requests.map(r => {
      if (r.id === requestId) {
        // Send notification to user about privacy request completion
        const newNotification = {
          id: `not-${Date.now()}`,
          user_id: r.user_id,
          title: nextStatus === 'completed' ? 'Solicitud de Privacidad Completada' : 'Solicitud de Privacidad Cancelada',
          content: nextStatus === 'completed' 
            ? `Tu solicitud de ${r.request_type === 'export' ? 'exportación de expediente' : 'eliminación de registros'} ha sido procesada de acuerdo a las regulaciones de la ley HIPAA.`
            : `Tu solicitud de ${r.request_type === 'export' ? 'exportación' : 'eliminación'} ha sido cancelada o denegada.`,
          type: 'system' as const,
          created_at: new Date().toISOString()
        };
        db.notifications = [newNotification, ...db.notifications];

        // If deletion completed, we could flag their user profile as deleted or suspended
        if (nextStatus === 'completed' && r.request_type === 'delete') {
          db.profiles = db.profiles.map(p => {
            if (p.id === r.user_id) {
              return { ...p, is_suspended: true, full_name: 'Usuario Eliminado (HIPAA)' };
            }
            return p;
          });
        }

        return { ...r, status: nextStatus };
      }
      return r;
    });

    const updatedDb = { ...db, privacy_requests: updatedRequests };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  return (
    <div className="space-y-6">
      {/* 1. HIPAA POLICIES OVERVIEW GAUGE */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-gray-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-start gap-4">
          <FileKey className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Cumplimiento HIPAA y Privacidad del Paciente</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Audita las firmas de consentimiento, atiende las solicitudes de portabilidad de datos (Derecho de Acceso) y borrado definitivo de expedientes (Derecho al Olvido / HIPAA Deletion Mandates).
            </p>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-center shrink-0">
          Enlace Seguro PHI Habilitado
        </div>
      </div>

      {/* 2. PRIVACY REQUEST QUEUE (GDPR / HIPAA) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <UserX className="h-5 w-5 text-rose-500 shrink-0" />
          Solicitudes de Derechos de Datos (Pendientes)
        </h3>
        <p className="text-[10px] text-gray-400">Atiende de forma manual o automatizada las solicitudes de exportación o eliminación de PHI</p>

        <div className="divide-y divide-gray-100">
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-1.5">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              No hay solicitudes de derechos de datos pendientes de resolución.
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-800">{req.user_name}</h4>
                    <span className="text-[9px] text-gray-450">({req.user_email})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-650">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${req.request_type === 'export' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
                      {req.request_type === 'export' ? 'Exportar Expediente' : 'Eliminar Cuenta y PHI'}
                    </span>
                    <span>Creado: {new Date(req.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateRequestStatus(req.id, 'canceled')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 text-[10px] font-bold transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Denegar
                  </button>
                  <button
                    onClick={() => handleUpdateRequestStatus(req.id, 'completed')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 text-[10px] font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Procesar y Cerrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. SIGNED LEGAL CONSENTS LOG LEDGER */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-700 shrink-0" />
          Registro Histórico de Firmas de Consentimiento HIPAA
        </h3>
        <p className="text-[10px] text-gray-400 font-semibold">Trazabilidad de aceptación de políticas y términos por usuario</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Documento Firmado</th>
                <th className="py-3 px-4">Versión</th>
                <th className="py-3 px-4">Dirección IP</th>
                <th className="py-3 px-4">Fecha y Hora (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {db.hipaa_consent_logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-700 block">{log.user_name}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">ID: {log.user_id}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-750">{log.consent_type}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">v{log.version}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">{log.ip_address}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-medium">
                    {new Date(log.accepted_at).toLocaleString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
