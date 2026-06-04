'use client';

import React from 'react';
import { getMockDb, ClinicalHistory } from '@/lib/mockDb';
import { Activity, Users, FlameKindling } from 'lucide-react';

interface AntecedentesViewerProps {
  patientId: string;
}

export default function AntecedentesViewer({ patientId }: AntecedentesViewerProps) {
  const db = getMockDb();
  
  const history = db.clinical_histories?.find(ch => ch.id === patientId) || {
    id: patientId,
    has_diabetes: false,
    has_hypertension: false,
    has_asthma: false,
    has_heart_disease: false,
    has_autoimmune: false,
    chronic_illnesses: '',
    past_surgeries: '',
    past_hospitalizations: '',
    allergies: 'Ninguna reportada',
    permanent_medications: 'Ninguno',
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

  const activeConditions = [
    { label: 'Diabetes', active: history.has_diabetes },
    { label: 'Hipertensión', active: history.has_hypertension },
    { label: 'Asma', active: history.has_asthma },
    { label: 'Cardiopatías', active: history.has_heart_disease },
    { label: 'Autoinmune', active: history.has_autoimmune }
  ].filter(c => c.active);

  const activeFamConditions = [
    { label: 'Diabetes', active: history.fam_diabetes },
    { label: 'Hipertensión', active: history.fam_hypertension },
    { label: 'Cáncer', active: history.fam_cancer },
    { label: 'Cardiovascular', active: history.fam_cardiovascular }
  ].filter(c => c.active);

  return (
    <div className="space-y-6 select-none text-left">
      <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex justify-between items-center text-center">
        <div className="flex-1 border-r border-gray-200">
          <span className="text-lg font-black text-slate-800 block leading-none">{history.past_pregnancies || 0}</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Gestas (G)</span>
        </div>
        <div className="flex-1 border-r border-gray-200">
          <span className="text-lg font-black text-slate-800 block leading-none">{history.past_vaginal_births || 0}</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Partos (P)</span>
        </div>
        <div className="flex-1 border-r border-gray-200">
          <span className="text-lg font-black text-slate-800 block leading-none">{history.past_c_sections || 0}</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Cesáreas (C)</span>
        </div>
        <div className="flex-1 border-r border-gray-200">
          <span className="text-lg font-black text-slate-800 block leading-none">{history.past_abortions || 0}</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Abortos (A)</span>
        </div>
        <div className="flex-1">
          <span className="text-lg font-black text-slate-800 block leading-none">{history.past_ectopic_pregnancies || 0}</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Ectópicos (E)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
            <Activity className="h-4 w-4 text-purple-500" />
            Condiciones Personales
          </h4>

          {activeConditions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeConditions.map(c => (
                <span key={c.label} className="bg-purple-100 text-purple-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  {c.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic">Sin patologías base declaradas.</p>
          )}

          <div className="space-y-2 pt-1 text-[11px]">
            <div>
              <span className="text-gray-400 font-bold block text-[9px] uppercase">Alergias Clínicas:</span>
              <p className="font-semibold text-slate-700">{history.allergies || 'Ninguna reportada'}</p>
            </div>
            <div>
              <span className="text-gray-450 font-bold block text-[9px] uppercase">Medicamentos Activos:</span>
              <p className="font-semibold text-slate-700">{history.permanent_medications || 'Ninguno'}</p>
            </div>
            {history.chronic_illnesses && (
              <div>
                <span className="text-gray-455 font-bold block text-[9px] uppercase">Crónicas Adicionales:</span>
                <p className="font-semibold text-slate-700">{history.chronic_illnesses}</p>
              </div>
            )}
            {history.past_surgeries && (
              <div>
                <span className="text-gray-460 font-bold block text-[9px] uppercase">Cirugías Realizadas:</span>
                <p className="font-semibold text-slate-700">{history.past_surgeries}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Antecedentes Familiares
            </h4>

            {activeFamConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeFamConditions.map(c => (
                  <span key={c.label} className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    {c.label} Fam.
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">Sin antecedentes familiares de riesgo.</p>
            )}

            {history.fam_genetic_diseases && (
              <div className="text-[11px] pt-1">
                <span className="text-gray-400 font-bold block text-[9px] uppercase">Enfermedades Hereditarias:</span>
                <p className="font-semibold text-slate-700">{history.fam_genetic_diseases}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <FlameKindling className="h-4 w-4 text-pink-500" />
              Complicaciones Gineco-Obstétricas
            </h4>
            <p className="text-[11px] font-semibold text-slate-700">
              {history.obstetric_complications || 'Ninguna complicación reportada en gestaciones previas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
