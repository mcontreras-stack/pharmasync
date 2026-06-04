'use client';

import React, { useState } from 'react';

interface ObstetricianVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onSave: (gestationalWeek: number, weightKg?: number, bp?: string, heartRate?: number, notes?: string, recommendations?: string) => void;
  initialWeek: number;
}

export default function ObstetricianVisitModal({
  isOpen,
  onClose,
  patientName,
  onSave,
  initialWeek
}: ObstetricianVisitModalProps) {
  const [gestationalWeek, setGestationalWeek] = useState(String(initialWeek));
  const [weightKg, setWeightKg] = useState('68.5');
  const [bloodPressure, setBloodPressure] = useState('110/70');
  const [fetalHeartRate, setFetalHeartRate] = useState('140');
  const [visitNotes, setVisitNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      parseInt(gestationalWeek, 10),
      weightKg ? parseFloat(weightKg) : undefined,
      bloodPressure || undefined,
      fetalHeartRate ? parseInt(fetalHeartRate, 10) : undefined,
      visitNotes || undefined,
      recommendations || undefined
    );
    setVisitNotes('');
    setRecommendations('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Registrar Consulta Prenatal</h3>
          <p className="text-xs text-gray-400 mt-1">Paciente: <span className="font-bold text-purple-600">{patientName}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Semana Gestacional</label>
              <input
                type="number"
                value={gestationalWeek}
                onChange={(e) => setGestationalWeek(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso Materno (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Arterial</label>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">FC Fetal (bpm)</label>
              <input
                type="number"
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas Clínicas</label>
            <textarea
              placeholder="Describa el estado uterino, bienestar fetal, síntomas reportados..."
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-20 font-medium resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Recomendaciones e Indicaciones</label>
            <textarea
              placeholder="Ej. Dieta baja en sal, reposo, control de presión diario..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-20 font-medium resize-none"
            />
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
              className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Registrar Consulta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
