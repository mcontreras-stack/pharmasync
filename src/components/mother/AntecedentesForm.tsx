'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, ClinicalHistory } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';
import { FileText, Save, Check } from 'lucide-react';
import { auditService } from '@/services/auditService';

interface AntecedentesFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export default function AntecedentesForm({ patientId, onSuccess }: AntecedentesFormProps) {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [successMsg, setSuccessMsg] = useState('');

  // Find or create clinical history record
  const existingHistory = db.clinical_histories?.find(ch => ch.id === patientId) || {
    id: patientId,
    has_diabetes: false,
    has_hypertension: false,
    has_asthma: false,
    has_heart_disease: false,
    has_autoimmune: false,
    chronic_illnesses: '',
    past_surgeries: '',
    past_hospitalizations: '',
    allergies: '',
    permanent_medications: '',
    fam_diabetes: false,
    fam_hypertension: false,
    fam_cancer: false,
    fam_cardiovascular: false,
    fam_genetic_diseases: '',
    past_pregnancies: 0,
    past_abortions: 0,
    past_c_sections: 0,
    past_vaginal_births: 0,
    past_ectopic_pregnancies: 0,
    obstetric_complications: ''
  } as ClinicalHistory;

  const [formData, setFormData] = useState<ClinicalHistory>({ ...existingHistory });

  const handleCheckboxChange = (field: keyof ClinicalHistory) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field] as any
    }));
  };

  const handleTextChange = (field: keyof ClinicalHistory, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field: keyof ClinicalHistory, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const histories = db.clinical_histories || [];
    const index = histories.findIndex(h => h.id === patientId);
    let updatedHistories = [...histories];

    if (index >= 0) {
      updatedHistories[index] = { ...formData };
    } else {
      updatedHistories.push({ ...formData });
    }

    const updatedDb = {
      ...db,
      clinical_histories: updatedHistories
    };

    // Save to database
    saveMockDb(updatedDb);
    setDb(updatedDb);

    // Audit logs
    if (user) {
      auditService.logAction(
        user.id,
        user.email,
        user.role,
        'update_clinical_history',
        'clinical_histories',
        patientId,
        existingHistory,
        formData
      );
    }

    setSuccessMsg('Historial clínico actualizado correctamente.');
    setTimeout(() => {
      setSuccessMsg('');
      if (onSuccess) onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 select-none">
      {/* Antecedentes Personales */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4.5 w-4.5" />
          Antecedentes Personales
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Diabetes', field: 'has_diabetes' },
            { label: 'Hipertensión', field: 'has_hypertension' },
            { label: 'Asma', field: 'has_asthma' },
            { label: 'Cardiopatías', field: 'has_heart_disease' },
            { label: 'Autoinmunes', field: 'has_autoimmune' }
          ].map(item => (
            <label 
              key={item.field}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                formData[item.field as keyof ClinicalHistory] 
                  ? 'border-purple-500 bg-purple-50/20 text-purple-800' 
                  : 'border-gray-200 bg-white text-slate-700 hover:border-gray-300'
              }`}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <input
                type="checkbox"
                checked={!!formData[item.field as keyof ClinicalHistory]}
                onChange={() => handleCheckboxChange(item.field as keyof ClinicalHistory)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Alergias</label>
            <textarea
              value={formData.allergies || ''}
              onChange={(e) => handleTextChange('allergies', e.target.value)}
              placeholder="Ej. Penicilina, mariscos, latex..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-16 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Medicamentos Permanentes</label>
            <textarea
              value={formData.permanent_medications || ''}
              onChange={(e) => handleTextChange('permanent_medications', e.target.value)}
              placeholder="Ej. Levotiroxina 50mcg diario..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-16 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cirugías Previas</label>
            <input
              type="text"
              value={formData.past_surgeries || ''}
              onChange={(e) => handleTextChange('past_surgeries', e.target.value)}
              placeholder="Ej. Apendicetomía (2018), Cesárea previa"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-purple-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Enfermedades Crónicas</label>
            <input
              type="text"
              value={formData.chronic_illnesses || ''}
              onChange={(e) => handleTextChange('chronic_illnesses', e.target.value)}
              placeholder="Ej. Hipotiroidismo, Ovario Poliquístico"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-purple-500"
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Antecedentes Familiares */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4.5 w-4.5" />
          Antecedentes Familiares
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Diabetes Fam.', field: 'fam_diabetes' },
            { label: 'Hipertensión Fam.', field: 'fam_hypertension' },
            { label: 'Cáncer Fam.', field: 'fam_cancer' },
            { label: 'Cardiopatías Fam.', field: 'fam_cardiovascular' }
          ].map(item => (
            <label 
              key={item.field}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                formData[item.field as keyof ClinicalHistory] 
                  ? 'border-indigo-500 bg-indigo-50/20 text-indigo-800' 
                  : 'border-gray-200 bg-white text-slate-700 hover:border-gray-300'
              }`}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <input
                type="checkbox"
                checked={!!formData[item.field as keyof ClinicalHistory]}
                onChange={() => handleCheckboxChange(item.field as keyof ClinicalHistory)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </label>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Enfermedades Genéticas / Hereditarias</label>
          <input
            type="text"
            value={formData.fam_genetic_diseases || ''}
            onChange={(e) => handleTextChange('fam_genetic_diseases', e.target.value)}
            placeholder="Ej. Anemia Falciforme, Síndrome de Down en tíos..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-indigo-500"
          />
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Antecedentes Obstétricos (Solo relevante para madres) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4.5 w-4.5" />
          Historial Obstétrico (Gestas)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Gestas (G)', field: 'past_pregnancies' },
            { label: 'Partos (P)', field: 'past_vaginal_births' },
            { label: 'Cesáreas (C)', field: 'past_c_sections' },
            { label: 'Abortos (A)', field: 'past_abortions' },
            { label: 'Ectópicos (E)', field: 'past_ectopic_pregnancies' }
          ].map(item => (
            <div key={item.field} className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 block">{item.label}</label>
              <input
                type="number"
                value={(formData[item.field as keyof ClinicalHistory] as number) || 0}
                onChange={(e) => handleNumberChange(item.field as keyof ClinicalHistory, parseInt(e.target.value, 10))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-slate-800"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Complicaciones Obstétricas Previas</label>
          <textarea
            value={formData.obstetric_complications || ''}
            onChange={(e) => handleTextChange('obstetric_complications', e.target.value)}
            placeholder="Ej. Preeclampsia en segundo embarazo, parto prematuro a la semana 34..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 h-16 resize-none"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
          <Check className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Save className="h-4 w-4" />
        Guardar Historial Clínico
      </button>
    </form>
  );
}
