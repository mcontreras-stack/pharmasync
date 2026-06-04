'use client';

import React, { useState } from 'react';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight?: number, systolic?: number, diastolic?: number, heartRate?: number) => void;
}

export default function VitalsModal({ isOpen, onClose, onSave }: VitalsModalProps) {
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      weight ? parseFloat(weight) : undefined,
      systolic ? parseInt(systolic, 10) : undefined,
      diastolic ? parseInt(diastolic, 10) : undefined,
      heartRate ? parseInt(heartRate, 10) : undefined
    );
    setWeight('');
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <h3 className="font-bold text-lg text-gray-800">Registrar Signos Vitales</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 68.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Frec. Cardíaca (lpm)</label>
              <input
                type="number"
                placeholder="Ej. 84"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Sistólica (Sist.)</label>
              <input
                type="number"
                placeholder="Ej. 110"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Diastólica (Diast.)</label>
              <input
                type="number"
                placeholder="Ej. 70"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
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
              Guardar Signos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
