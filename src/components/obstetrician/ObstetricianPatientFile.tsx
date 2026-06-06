'use client';

import React, { useState } from 'react';
import { Clock, FileText, Image, ChevronDown, ChevronUp, Edit3, Plus } from 'lucide-react';
import { getMockDb, ClinicalHistory } from '@/lib/mockDb';
import AntecedentesViewer from '../mother/AntecedentesViewer';
import AntecedentesForm from '../mother/AntecedentesForm';

interface ObstetricianPatientFileProps {
  selectedPatient: {
    pregnancy?: {
      id: string;
      last_menstrual_period?: string;
    } | null;
    profile?: {
      full_name: string;
    } | null;
    mother: {
      id: string;
      phone: string;
      blood_type: string;
      allergies?: string;
    };
  } | null;
  pregnancyWeeks: number;
  onAddVisitClick: () => void;
}

export default function ObstetricianPatientFile({ selectedPatient, pregnancyWeeks, onAddVisitClick }: ObstetricianPatientFileProps) {
  const db = getMockDb();
  const [antecedentesOpen, setAntecedentesOpen] = useState(false);
  const [antecedentesEditOpen, setAntecedentesEditOpen] = useState(false);

  if (!selectedPatient) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center italic text-xs text-gray-400 shadow-sm select-none">
        Seleccione una paciente del menú izquierdo para ver su expediente obstétrico.
      </div>
    );
  }

  const patientVisits = db.prenatal_visits
    .filter(v => v.pregnancy_id === selectedPatient.pregnancy?.id)
    .sort((a, b) => b.gestational_week - a.gestational_week);

  const patientLabs = db.lab_results.filter(l => l.pregnancy_id === selectedPatient.pregnancy?.id);
  const patientUltrasounds = db.ultrasound_results.filter(u => u.pregnancy_id === selectedPatient.pregnancy?.id);

  return (
    <div className="space-y-6 text-left select-none">
      {/* Patient header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-sm shrink-0">
              {selectedPatient.profile?.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-gray-805 text-base truncate">{selectedPatient.profile?.full_name}</h2>
              <p className="text-[11px] text-gray-400 font-semibold truncate">
                Tel: {selectedPatient.mother.phone} • Sangre: {selectedPatient.mother.blood_type} • Alergias: {selectedPatient.mother.allergies || 'Ninguna'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onAddVisitClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Registrar Consulta
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50 pt-4 text-center">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Gestación</span>
            <span className="text-sm font-black text-purple-600">Semana {pregnancyWeeks}</span>
          </div>
          <div className="border-x border-gray-100">
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">FUR / LMP</span>
            <span className="text-sm font-bold text-gray-700">{selectedPatient.pregnancy?.last_menstrual_period}</span>
          </div>
          <div className="border-r border-gray-100">
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Edad Paciente</span>
            <span className="text-sm font-bold text-gray-700">28 años</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Riesgo Clínico</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black uppercase tracking-wider block w-fit mx-auto mt-0.5">Bajo</span>
          </div>
        </div>
      </div>

      {/* Antecedentes Expediente section (Phase 1) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Expediente de Antecedentes Clínicos
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setAntecedentesEditOpen(true)}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-all cursor-pointer"
              title="Editar Expediente"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAntecedentesOpen(!antecedentesOpen)}
              className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
            >
              {antecedentesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {antecedentesOpen ? (
          <AntecedentesViewer patientId={selectedPatient.mother.id} />
        ) : (
          <p className="text-[10px] text-gray-400 font-semibold italic">Presione la flecha para desplegar antecedentes clínicos detallados de la paciente.</p>
        )}
      </div>

      {/* Grid: Visits vs Studies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls timeline */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Historial de Controles Prenatales
          </h3>

          <div className="relative border-l border-purple-100 pl-4 ml-2 space-y-5 max-h-64 overflow-y-auto pt-2">
            {patientVisits.map((visit) => (
              <div key={visit.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 bg-purple-500 border-2 border-white rounded-full"></span>
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-600">Semana {visit.gestational_week}</span>
                    <span className="text-[10px] text-gray-400">{visit.visit_date}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 font-medium leading-relaxed">
                    Peso: {visit.mother_weight_kg}kg • Presión: {visit.blood_pressure} • FCF: {visit.fetal_heart_rate_bpm} bpm
                  </p>
                  {visit.notes && <p className="text-[10px] text-gray-400 mt-0.5 italic">&quot;{visit.notes}&quot;</p>}
                </div>
              </div>
            ))}
            
            {patientVisits.length === 0 && (
              <p className="text-xs text-gray-400 italic">No hay visitas de control registradas.</p>
            )}
          </div>
        </div>

        {/* Labs and Ultrasound Scan */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Estudios y Ecografías
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {patientUltrasounds.map((u) => (
              <div key={u.id} className="bg-purple-50/20 border border-purple-100/50 p-3 rounded-2xl flex items-start gap-3">
                <Image className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-700">Ecografía Semana {u.gestational_week}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{u.findings}</p>
                  <span className="text-[9px] text-gray-400 mt-1 block">Registrada el {u.scan_date}</span>
                </div>
              </div>
            ))}

            {patientLabs.map((l) => (
              <div key={l.id} className="bg-gray-50 p-3 rounded-2xl flex items-start gap-3 border border-gray-100">
                <FileText className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-700">{l.test_name}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{l.result_summary}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-bold ${l.is_normal ? 'text-emerald-605 bg-emerald-50' : 'text-rose-605 bg-rose-50'} px-1.5 py-0.25 rounded-md`}>
                      {l.is_normal ? 'Normal' : 'Observación'}
                    </span>
                    <span className="text-[9px] text-gray-400">Fecha: {l.test_date}</span>
                  </div>
                </div>
              </div>
            ))}

            {patientUltrasounds.length === 0 && patientLabs.length === 0 && (
              <p className="text-xs text-gray-400 italic">No hay reportes ni ecografías en el expediente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Antecedentes Edit Form Modal */}
      {antecedentesEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 backdrop-blur-xs text-left">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="font-bold text-sm text-gray-800">Actualizar Antecedentes Clínicos</h3>
              <button onClick={() => setAntecedentesEditOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer font-bold">✕</button>
            </div>
            <AntecedentesForm patientId={selectedPatient.mother.id} onSuccess={() => setAntecedentesEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
