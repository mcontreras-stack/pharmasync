'use client';

import React, { useState } from 'react';
import { X, CalendarHeart } from 'lucide-react';

interface PregnancySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (lastMenstrualPeriod: string, estimatedDueDate: string, notes?: string) => Promise<void>;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PregnancySetupModal({ isOpen, onClose, onRegister }: PregnancySetupModalProps) {
  const [lmp, setLmp] = useState('');
  const [edd, setEdd] = useState('');
  const [eddTouched, setEddTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLmpChange = (value: string) => {
    setLmp(value);
    // Regla de Naegele: FPP = FUM + 280 días (editable)
    if (value && !eddTouched) setEdd(addDays(value, 280));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmp || !edd) return;
    setSaving(true);
    setError(null);
    try {
      await onRegister(lmp, edd, notes.trim() || undefined);
      setLmp(''); setEdd(''); setNotes(''); setEddTouched(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el embarazo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <CalendarHeart className="h-5 w-5 text-pink-500" />
              Registrar mi Embarazo
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Con la fecha de tu última menstruación calculamos la fecha probable de parto y la semana de gestación.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha de Última Menstruación (FUM)</label>
            <input
              type="date"
              value={lmp}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => handleLmpChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold text-slate-700"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha Probable de Parto (FPP)</label>
            <input
              type="date"
              value={edd}
              onChange={(e) => { setEdd(e.target.value); setEddTouched(true); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold text-slate-700"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">Se calcula automáticamente (FUM + 280 días). Ajústala si tu médico te indicó otra fecha.</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Embarazo gemelar, FIV..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold text-slate-700"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-2xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Registrar Embarazo 🤰'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
