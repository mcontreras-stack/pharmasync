'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Send } from 'lucide-react';

interface DoctorActionModalProps {
  action: { docId: string; type: 'reject' | 'corrections' } | null;
  onClose: () => void;
  onSubmit: (doctorId: string, nextStatus: 'rejected' | 'pending_corrections', note: string) => void;
}

export default function DoctorActionModal({ action, onClose, onSubmit }: DoctorActionModalProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (action) {
      setNote('');
    }
  }, [action]);

  if (!action) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      action.docId,
      action.type === 'reject' ? 'rejected' : 'pending_corrections',
      note
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] border border-gray-100 w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <ShieldAlert className={`h-4.5 w-4.5 ${action.type === 'reject' ? 'text-rose-500' : 'text-amber-500'}`} />
          {action.type === 'reject' ? 'Rechazar Solicitud Médica' : 'Solicitar Correcciones de Documentación'}
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">Escribe la justificación o los requisitos faltantes. Esto se notificará al médico.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Descripción / Nota</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action.type === 'reject' ? 'Ej. El exequátur ingresado no coincide con el padrón del Ministerio de Salud Pública.' : 'Ej. Vuelva a subir su título universitario en un archivo PDF legible.'}
              className="w-full h-24 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 resize-none text-slate-800"
              required
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-250 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${action.type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}
            >
              <Send className="h-3.5 w-3.5" />
              Enviar Decisión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
