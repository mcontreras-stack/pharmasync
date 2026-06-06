'use client';

import React, { useState } from 'react';
import { TrendingUp, Syringe, Smile, ChevronDown, ChevronUp, Edit3, HeartPulse, Plus } from 'lucide-react';
import { getMockDb } from '@/lib/mockDb';
import NewbornRecordViewer from '../neonatal/NewbornRecordViewer';
import NewbornRecordForm from '../neonatal/NewbornRecordForm';

interface PediatricianPatientFileProps {
  selectedBabyProfile: {
    baby: {
      id: string;
      name: string;
      birth_date: string;
      birth_weight_grams?: number;
      birth_height_cm?: number;
      gender: string;
    };
    motherProfile?: {
      full_name: string;
    } | null;
  } | null;
  ageMonths: number;
  onAddVisitClick: () => void;
  onToggleVaccine: (id: string) => void;
  onToggleMilestone: (id: string) => void;
}

export default function PediatricianPatientFile({
  selectedBabyProfile,
  ageMonths,
  onAddVisitClick,
  onToggleVaccine,
  onToggleMilestone
}: PediatricianPatientFileProps) {
  const db = getMockDb();
  const [neonatalOpen, setNeonatalOpen] = useState(false);
  const [neonatalEditOpen, setNeonatalEditOpen] = useState(false);

  if (!selectedBabyProfile) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-gray-150 text-center italic text-xs text-gray-400 shadow-sm select-none">
        Selecciona un niño del menú izquierdo para ver su expediente pediátrico.
      </div>
    );
  }

  const baby = selectedBabyProfile.baby;
  const babyGrowth = db.growth_records
    .filter(g => g.baby_id === baby.id)
    .sort((a, b) => b.age_months - a.age_months);

  const babyVaccines = db.baby_vaccines.filter(bv => bv.baby_id === baby.id);
  const babyMilestones = db.development_milestones.filter(m => m.baby_id === baby.id);

  return (
    <div className="space-y-6 text-left select-none">
      {/* Patient header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-emerald-100 text-emerald-605 rounded-full flex items-center justify-center font-black text-sm shrink-0">
              {baby.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-gray-800 text-base truncate">{baby.name}</h2>
              <p className="text-[11px] text-gray-400 font-semibold truncate">
                Madre: {selectedBabyProfile.motherProfile?.full_name} • Nacido: {baby.birth_date}
              </p>
            </div>
          </div>

          <button
            onClick={onAddVisitClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Registrar Consulta
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50 pt-4 text-center">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Edad Lactante</span>
            <span className="text-sm font-black text-emerald-600">{ageMonths} meses</span>
          </div>
          <div className="border-x border-gray-100">
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Peso Nacido</span>
            <span className="text-sm font-bold text-gray-700">{baby.birth_weight_grams ? `${(baby.birth_weight_grams / 1000).toFixed(1)} kg` : '3.2 kg'}</span>
          </div>
          <div className="border-r border-gray-100">
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Talla Nacido</span>
            <span className="text-sm font-bold text-gray-700">{baby.birth_height_cm ? `${baby.birth_height_cm} cm` : '50 cm'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Género</span>
            <span className="text-sm font-bold text-gray-700">{baby.gender}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Newborn Ficha Neonatal (Phase 9) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-emerald-500" />
            Expediente de Nacimiento (Ficha Neonatal)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setNeonatalEditOpen(true)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
              title="Editar Ficha Neonatal"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNeonatalOpen(!neonatalOpen)}
              className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
            >
              {neonatalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {neonatalOpen ? (
          <NewbornRecordViewer babyId={baby.id} />
        ) : (
          <p className="text-[10px] text-gray-400 font-semibold italic">Presione la flecha para desplegar la somatometría del parto, APGAR y tamizajes del recién nacido.</p>
        )}
      </div>

      {/* Growth history & Vaccine calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth records */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Evolución de Crecimiento
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {babyGrowth.map((g) => (
              <div key={g.id} className="bg-slate-50 border border-gray-150 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-700 block">Mes {g.age_months}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{g.record_date}</span>
                </div>
                <div className="text-right font-bold text-slate-700">
                  <p>Peso: {g.weight_kg} kg <span className="text-[10px] text-gray-400 font-normal">(P-{g.weight_percentile})</span></p>
                  <p>Talla: {g.height_cm} cm <span className="text-[10px] text-gray-400 font-normal">(P-{g.height_percentile})</span></p>
                </div>
              </div>
            ))}
            
            {babyGrowth.length === 0 && (
              <p className="text-xs text-gray-400 italic">No hay registros de crecimiento en el sistema.</p>
            )}
          </div>
        </div>

        {/* Vaccines list */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Syringe className="h-5 w-5 text-emerald-500" />
            Historial de Vacunación
          </h3>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {babyVaccines.map((bv) => {
              const vaccine = db.vaccines.find(v => v.id === bv.vaccine_id);
              if (!vaccine) return null;
              return (
                <div key={bv.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors text-xs">
                  <div>
                    <h4 className="font-bold text-gray-700">{vaccine.name}</h4>
                    <span className="text-[9px] text-gray-400 block">{vaccine.target_disease} • {vaccine.recommended_age_months}m</span>
                  </div>
                  <button
                    onClick={() => onToggleVaccine(bv.id)}
                    className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase transition-colors shrink-0 cursor-pointer ${
                      bv.status === 'applied' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {bv.status === 'applied' ? 'Aplicada' : 'Aplicar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Developmental Milestones checklist */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Smile className="h-5 w-5 text-emerald-500" />
          Monitoreo de Hitos del Desarrollo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {babyMilestones.map((m) => (
            <div
              key={m.id}
              onClick={() => onToggleMilestone(m.id)}
              className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                m.status === 'achieved' 
                  ? 'bg-emerald-50/20 border-emerald-100' 
                  : 'bg-slate-50/50 border-gray-150 hover:border-emerald-200'
              }`}
            >
              <div>
                <h4 className="text-[11px] font-bold text-slate-700 leading-snug">{m.milestone_name}</h4>
                <span className="text-[9px] text-gray-400 font-bold">{m.category} • {m.target_age_months}m</span>
              </div>
              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                m.status === 'achieved' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-250 bg-white'
              }`}>
                {m.status === 'achieved' && <span className="text-[9px] font-bold">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ficha Neonatal Form Modal */}
      {neonatalEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 backdrop-blur-xs text-left">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="font-bold text-sm text-gray-800">Actualizar Ficha Neonatal</h3>
              <button onClick={() => setNeonatalEditOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer font-bold">✕</button>
            </div>
            <NewbornRecordForm babyId={baby.id} onSuccess={() => setNeonatalEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
