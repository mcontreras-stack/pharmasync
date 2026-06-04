'use client';

import React, { useState } from 'react';

interface PediatricianVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onSave: (weightKg: number, heightCm: number, headCircCm?: number, devStatus?: string, notes?: string, recommendations?: string) => void;
  initialWeight?: number;
  initialHeight?: number;
}

export default function PediatricianVisitModal({
  isOpen,
  onClose,
  patientName,
  onSave,
  initialWeight = 6.8,
  initialHeight = 64
}: PediatricianVisitModalProps) {
  const [weightKg, setWeightKg] = useState(String(initialWeight));
  const [heightCm, setHeightCm] = useState(String(initialHeight));
  const [headCirc, setHeadCirc] = useState('41.2');
  const [devStatus, setDevStatus] = useState('Buen tono muscular. Balbucea y sonríe.');
  const [visitNotes, setVisitNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      parseFloat(weightKg),
      parseFloat(heightCm),
      headCirc ? parseFloat(headCirc) : undefined,
      devStatus || undefined,
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
          <h3 className="font-bold text-lg text-gray-800">Registrar Control de Crecimiento</h3>
          <p className="text-xs text-gray-400 mt-1">Bebé: <span className="font-bold text-emerald-600">{patientName}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Talla (cm)</label>
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">C. Cefálica (cm)</label>
              <input
                type="number"
                step="0.1"
                value={headCirc}
                onChange={(e) => setHeadCirc(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Desarrollo y Estado de Hitos</label>
            <input
              type="text"
              value={devStatus}
              onChange={(e) => setDevStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas Clínicas Pediátricas</label>
            <textarea
              placeholder="Describa observaciones del sueño, lactancia, digestión..."
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-20 font-medium resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Indicaciones para los Padres</label>
            <textarea
              placeholder="Ej. Lactancia exclusiva a libre demanda, suplemento de hierro..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-20 font-medium resize-none"
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
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Registrar Consulta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
