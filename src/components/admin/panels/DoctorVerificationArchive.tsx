'use client';

import React from 'react';
import { History } from 'lucide-react';
import { Doctor, Profile } from '@/lib/mockDb';

interface DoctorVerificationArchiveProps {
  otherDocs: Doctor[];
  profiles: Profile[];
}

export default function DoctorVerificationArchive({
  otherDocs,
  profiles
}: DoctorVerificationArchiveProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
        <History className="h-5 w-5 text-slate-700 shrink-0" />
        Historial y Archivo de Validaciones
      </h3>
      <p className="text-[10px] text-gray-400 font-semibold">Registro histórico de especialistas médicos evaluados.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
              <th className="py-3 px-4">Médico</th>
              <th className="py-3 px-4">Especialidad</th>
              <th className="py-3 px-4">N° Licencia</th>
              <th className="py-3 px-4">Estado Verificación</th>
              <th className="py-3 px-4">Historial de Eventos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {otherDocs.map(doc => {
              const profile = profiles.find(p => p.id === doc.id);
              if (!profile) return null;

              let statusBadge = 'bg-emerald-100 text-emerald-700';
              let statusLabel = 'Aprobado';
              if (doc.verification_status === 'rejected') {
                statusBadge = 'bg-rose-100 text-rose-700';
                statusLabel = 'Rechazado';
              } else if (doc.verification_status === 'pending_corrections') {
                statusBadge = 'bg-amber-100 text-amber-700';
                statusLabel = 'Requiere Cambios';
              }

              return (
                <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-700">{profile.full_name}</td>
                  <td className="py-4 px-4 capitalize font-semibold text-gray-600">
                    {doc.specialty === 'obstetrician' ? 'Obstetra' : 'Pediatra'}
                  </td>
                  <td className="py-4 px-4 font-mono text-gray-500">{doc.license_number}</td>
                  <td className="py-4 px-4">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-4 px-4 max-w-sm">
                    <div className="space-y-1.5">
                      {doc.verification_history && doc.verification_history.length > 0 ? (
                        doc.verification_history.map((hist, idx) => (
                          <div key={idx} className="text-[9px] bg-slate-50 p-2 rounded-lg border border-gray-100 leading-normal">
                            <div className="flex justify-between font-bold text-slate-700 uppercase">
                              <span>
                                {hist.status === 'approved'
                                  ? 'Aprobado'
                                  : hist.status === 'rejected'
                                  ? 'Rechazado'
                                  : 'Observación'}
                              </span>
                              <span className="text-gray-400 text-[8px] font-normal text-right">
                                {new Date(hist.date).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-gray-550 font-medium mt-0.5">{hist.note}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic font-medium">Sin historial cargado</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
