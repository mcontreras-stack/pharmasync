'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, ThumbsUp } from 'lucide-react';

interface DocumentObsModalProps {
  documentId: string | null;
  initialNotes: string;
  onClose: () => void;
  onSubmit: (documentId: string, notes: string) => void;
}

export default function DocumentObsModal({
  documentId,
  initialNotes,
  onClose,
  onSubmit
}: DocumentObsModalProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (documentId) {
      setTimeout(() => {
        setNotes(initialNotes);
      }, 0);
    }
  }, [documentId, initialNotes]);

  if (!documentId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(documentId, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] border border-gray-150 w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
          type="button"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
          Observaciones del Documento
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">Escriba comentarios sobre el estado técnico o legibilidad de este archivo específico.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nota de Calidad</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. La imagen está borrosa en la esquina del número de serie. Por favor volver a escanear."
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
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Guardar Observación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
