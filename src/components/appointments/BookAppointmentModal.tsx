'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/database';
import { X, Calendar } from 'lucide-react';

interface BookAppointmentModalProps {
  doctorsList: Profile[];
  onClose: () => void;
  onBook: (data: { doctorId: string; date: string; time: string; reason: string; notes?: string }) => void;
}

export default function BookAppointmentModal({ doctorsList, onClose, onBook }: BookAppointmentModalProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [reasonVal, setReasonVal] = useState('');
  const [notesVal, setNotesVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !dateVal || !timeVal || !reasonVal.trim()) return;

    onBook({
      doctorId: selectedDoctorId,
      date: dateVal,
      time: timeVal,
      reason: reasonVal,
      notes: notesVal || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
          <h3 className="font-bold text-base text-gray-800 flex items-center gap-1.5">
            <Calendar className="h-4.5 w-4.5 text-pink-500" />
            Programar Cita Médica
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-xl cursor-pointer">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Seleccionar Médico</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
              required
            >
              <option value="">Seleccione un especialista...</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.role === 'obstetrician' ? 'Obstetricia' : 'Pediatría'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha</label>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Hora</label>
              <input
                type="time"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Motivo de la Cita</label>
            <input
              type="text"
              placeholder="ej. Control prenatal de rutina, Vacunas, Fiebre..."
              value={reasonVal}
              onChange={(e) => setReasonVal(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas previas (Opcional)</label>
            <textarea
              placeholder="Escribe alguna aclaración o síntoma previo para el doctor..."
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs focus:outline-none h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Programar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
