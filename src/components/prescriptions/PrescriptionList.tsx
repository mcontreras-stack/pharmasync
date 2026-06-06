'use client';

import React from 'react';
import { Prescription, Profile } from '@/types/database';
import { FileText, Eye, Printer, AlertTriangle } from 'lucide-react';

interface PrescriptionListProps {
  user: Profile;
  prescriptions: Prescription[];
  onSelect: (prescription: Prescription) => void;
  onPrint: (prescription: Prescription) => void;
}

export default function PrescriptionList({ user, prescriptions, onSelect, onPrint }: PrescriptionListProps) {
  const isMother = user.role === 'mother';
  const [now, setNow] = React.useState<number>(0);

  React.useEffect(() => {
    setTimeout(() => {
      setNow(Date.now());
    }, 0);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-pink-500" />
          {isMother ? 'Mis Recetas Médicas' : 'Recetas Emitidas'}
        </h3>
        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg font-bold">
          Total: {prescriptions.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
        {prescriptions.map((pres) => {
          const isExpired = now > 0 && new Date(pres.expiry_date).getTime() < now;
          const statusColors = {
            activa: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            expirada: 'bg-rose-50 text-rose-700 border-rose-100',
            cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
            dispensada: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          };
          const statusLabel = isExpired ? 'Expirada' : pres.status.toUpperCase();

          return (
            <div
              key={pres.id}
              className="bg-gray-50/50 hover:bg-gray-50 border border-gray-200/50 hover:border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors select-none"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-gray-800 font-mono">{pres.code}</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded-md font-bold border ${isExpired ? statusColors.expirada : statusColors[pres.status]}`}>
                    {statusLabel}
                  </span>
                  {pres.is_controlled && (
                    <span className="text-[8px] px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-md font-black flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Controlada
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-gray-700 truncate">
                  {pres.items.map(i => i.generic_name).join(', ')}
                </h4>
                <p className="text-[9px] text-gray-400">
                  {isMother ? `Emitida por: ${pres.doctor_name}` : `Paciente: ${pres.patient_name}`} • Expiración: {pres.expiry_date.split('T')[0]}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelect(pres)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  title="Ver receta completa"
                >
                  <Eye className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => onPrint(pres)}
                  className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                  title="Imprimir receta / PDF"
                >
                  <Printer className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          );
        })}

        {prescriptions.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <FileText className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400 italic font-medium">No hay recetas emitidas en este expediente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
