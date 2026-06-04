'use client';

import React, { useState } from 'react';
import { Symptom } from '@/lib/mockDb';

interface SymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (symptomName: string, intensity: 'Bajo' | 'Medio' | 'Alto', notes: string) => void;
}

export default function SymptomModal({ isOpen, onClose, onSave }: SymptomModalProps) {
  const [name, setName] = useState('');
  const [intensity, setIntensity] = useState<'Bajo' | 'Medio' | 'Alto'>('Bajo');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, intensity, notes);
    setName('');
    setIntensity('Bajo');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <h3 className="font-bold text-lg text-gray-800">Registrar Síntoma</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre del síntoma</label>
            <input
              type="text"
              placeholder="ej. Náuseas, Dolor lumbar, Fatiga"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Intensidad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Bajo', 'Medio', 'Alto'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setIntensity(option)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    intensity === option 
                      ? 'bg-pink-500 text-white shadow-xs' 
                      : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas adicionales (Opcional)</label>
            <textarea
              placeholder="Escribe detalles sobre cómo te sientes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 h-20 font-medium resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Guardar Síntoma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
