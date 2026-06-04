'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, NewbornRecord } from '@/lib/mockDb';
import { Baby, Activity, Scale, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NewbornRecordFormProps {
  babyId: string;
  onSuccess?: () => void;
}

export default function NewbornRecordForm({ babyId, onSuccess }: NewbornRecordFormProps) {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [successMsg, setSuccessMsg] = useState('');

  // Find or initialize newborn record
  const existingRecord = db.newborn_records?.find(r => r.baby_id === babyId) || {
    id: `newborn-${Date.now()}`,
    baby_id: babyId,
    pregnancy_id: '',
    apgar_1min: 9,
    apgar_5min: 10,
    birth_weight_grams: 3200,
    birth_height_cm: 50,
    head_circumference_cm: 34.5,
    complications: '',
    screenings: [
      { test_name: 'Metabólico', result: 'normal', date: new Date().toISOString().split('T')[0] },
      { test_name: 'Auditivo', result: 'normal', date: new Date().toISOString().split('T')[0] }
    ],
    vaccines: [
      { name: 'BCG (Tuberculosis)', applied: true, date: new Date().toISOString().split('T')[0], lot: 'BCG-99A' },
      { name: 'Hepatitis B (Dosis Recién Nacido)', applied: true, date: new Date().toISOString().split('T')[0], lot: 'HB-881' }
    ]
  } as NewbornRecord;

  const [record, setRecord] = useState<NewbornRecord>({ ...existingRecord });

  const handleChange = (field: keyof NewbornRecord, value: any) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleScreeningResultChange = (idx: number, result: string) => {
    const updatedScreenings = [...(record.screenings || [])];
    updatedScreenings[idx] = { ...updatedScreenings[idx], result };
    setRecord(prev => ({ ...prev, screenings: updatedScreenings }));
  };

  const handleVaccineChange = (idx: number, applied: boolean, lot: string | undefined) => {
    const updatedVaccines = [...(record.vaccines || [])];
    updatedVaccines[idx] = { ...updatedVaccines[idx], applied, lot };
    setRecord(prev => ({ ...prev, vaccines: updatedVaccines }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const records = db.newborn_records || [];
    const index = records.findIndex(r => r.baby_id === babyId);
    let updatedRecords = [...records];

    if (index >= 0) {
      updatedRecords[index] = { ...record };
    } else {
      updatedRecords.push({ ...record });
    }

    const updatedDb = {
      ...db,
      newborn_records: updatedRecords
    };

    saveMockDb(updatedDb);
    setDb(updatedDb);
    setSuccessMsg('Ficha de Nacimiento guardada exitosamente.');
    setTimeout(() => {
      setSuccessMsg('');
      if (onSuccess) onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 select-none text-left">
      {/* Physical birth details */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
          <Scale className="h-4.5 w-4.5" />
          Medidas de Nacimiento (Somatometría)
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-400 block uppercase">Peso al nacer (g)</label>
            <input
              type="number"
              value={record.birth_weight_grams}
              onChange={(e) => handleChange('birth_weight_grams', parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-400 block uppercase">Talla al nacer (cm)</label>
            <input
              type="number"
              step="0.1"
              value={record.birth_height_cm}
              onChange={(e) => handleChange('birth_height_cm', parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-400 block uppercase">C. Cefálica (cm)</label>
            <input
              type="number"
              step="0.1"
              value={record.head_circumference_cm}
              onChange={(e) => handleChange('head_circumference_cm', parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
              required
            />
          </div>
        </div>
      </div>

      {/* APGAR Scores */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-4.5 w-4.5" />
          Puntuación APGAR
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-400 block uppercase">Al 1er Minuto (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={record.apgar_1min}
              onChange={(e) => handleChange('apgar_1min', parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-gray-400 block uppercase">A los 5 Minutos (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={record.apgar_5min}
              onChange={(e) => handleChange('apgar_5min', parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 text-center"
              required
            />
          </div>
        </div>
      </div>

      {/* Complications */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Complicaciones de Nacimiento</label>
        <textarea
          value={record.complications || ''}
          onChange={(e) => handleChange('complications', e.target.value)}
          placeholder="Ej. Ninguna, Circular de cordón leve, Aspiración de meconio leve..."
          className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-16 resize-none"
        />
      </div>

      <hr className="border-gray-100" />

      {/* Screenings */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <HeartPulse className="h-4.5 w-4.5" />
          Tamizajes Neonatales
        </h3>

        <div className="space-y-2">
          {record.screenings?.map((scr, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-50 border border-gray-150 p-3 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{scr.test_name}</span>
                <span className="text-[8px] text-gray-400 font-bold block mt-0.5">Fecha: {scr.date}</span>
              </div>

              <select
                value={scr.result}
                onChange={(e) => handleScreeningResultChange(idx, e.target.value)}
                className="bg-white border border-gray-200 rounded-xl p-1 text-[10px] font-bold text-slate-700"
              >
                <option value="normal">Normal</option>
                <option value="anormal">Anormal</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Initial Vaccines */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
          <Baby className="h-4.5 w-4.5" />
          Vacunas Inmediatas
        </h3>

        <div className="space-y-3">
          {record.vaccines?.map((vac, idx) => (
            <div key={idx} className="bg-slate-50 border border-gray-150 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{vac.name}</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vac.applied}
                    onChange={(e) => handleVaccineChange(idx, e.target.checked, vac.lot)}
                    className="rounded border-gray-300 text-purple-600 h-4 w-4"
                  />
                  <span className="text-[10px] font-bold text-slate-700">Aplicada</span>
                </label>
              </div>

              {vac.applied && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase shrink-0">Lote:</span>
                  <input
                    type="text"
                    value={vac.lot}
                    onChange={(e) => handleVaccineChange(idx, vac.applied, e.target.value)}
                    placeholder="Lote de vacuna"
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-800"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
          <CheckCircle2 className="h-4.5 w-4.5" />
          {successMsg}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        Guardar Ficha Neonatal
      </button>
    </form>
  );
}
