'use client';

import React, { useState } from 'react';
import { 
  Baby, CheckCircle, Smile, Shield, TrendingUp, ChevronDown, ChevronUp, Edit3, HeartPulse
} from 'lucide-react';
import { getMockDb, saveMockDb, Baby as BabyType, BabyVaccine, DevelopmentMilestone, MOCK_MOTHER_ID } from '@/lib/mockDb';
import LinkDoctorModal from './LinkDoctorModal';
import NewbornRecordViewer from '../neonatal/NewbornRecordViewer';
import NewbornRecordForm from '../neonatal/NewbornRecordForm';

interface FamilyViewProps {
  babies: BabyType[];
  selectedBabyId: string;
  onSelectBaby: (id: string) => void;
  onLinkDoctor: (code: string) => Promise<{ success: boolean; message: string }>;
  onRevokeLink: (linkId: string) => void;
}

export default function FamilyView({ babies, selectedBabyId, onSelectBaby, onLinkDoctor, onRevokeLink }: FamilyViewProps) {
  const [db, setDb] = useState(getMockDb());
  
  // Selection
  const selectedBaby = babies.find(b => b.id === selectedBabyId) || babies[0];

  // Collapsibles and Modals
  const [linkOpen, setLinkOpen] = useState(false);
  const [neonatalOpen, setNeonatalOpen] = useState(false);
  const [neonatalEditOpen, setNeonatalEditOpen] = useState(false);

  if (!selectedBaby) return null;

  // Pediatrician details
  const pediatricianLink = (db.doctor_patient_links || []).find(lnk => 
    lnk.mother_id === MOCK_MOTHER_ID && 
    lnk.status !== 'inactive' && 
    db.doctors.find(d => d.id === lnk.doctor_id)?.specialty === 'pediatrician'
  );
  const currentPediatrician = pediatricianLink && pediatricianLink.status === 'active'
    ? db.profiles.find(p => p.id === pediatricianLink.doctor_id)
    : null;

  const handleToggleVaccine = (vaccineId: string) => {
    const updated = db.baby_vaccines.map(bv => {
      if (bv.id === vaccineId) {
        return {
          ...bv,
          status: (bv.status === 'applied' ? 'pending' : 'applied') as 'pending' | 'applied',
          applied_date: bv.status === 'applied' ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return bv;
    });
    const updatedDb = { ...db, baby_vaccines: updated };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleToggleMilestone = (milestoneId: string) => {
    const updated = db.development_milestones.map(dm => {
      if (dm.id === milestoneId) {
        return {
          ...dm,
          status: (dm.status === 'achieved' ? 'pending' : 'achieved') as 'pending' | 'achieved',
          achieved_date: dm.status === 'achieved' ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return dm;
    });
    const updatedDb = { ...db, development_milestones: updated };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const babyVaccines = db.baby_vaccines.filter(bv => bv.baby_id === selectedBaby.id);
  const babyMilestones = db.development_milestones.filter(dm => dm.baby_id === selectedBaby.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none text-left">
      <div className="md:col-span-2 space-y-6">
        {/* Baby profile header */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-black text-lg">
                {selectedBaby.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">{selectedBaby.name}</h2>
                <p className="text-xs text-gray-400 font-semibold">F. Nacimiento: {selectedBaby.birth_date}</p>
              </div>
            </div>

            {babies.length > 1 && (
              <select
                value={selectedBabyId}
                onChange={(e) => onSelectBaby(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-250 rounded-xl p-2 font-bold cursor-pointer text-slate-700"
              >
                {babies.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 text-center">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Peso Nacimiento</span>
              <span className="text-sm font-bold text-gray-700">{selectedBaby.birth_weight_grams ? `${(selectedBaby.birth_weight_grams / 1000).toFixed(1)} kg` : '3.2 kg'}</span>
            </div>
            <div className="border-x border-gray-100">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Talla Nacimiento</span>
              <span className="text-sm font-bold text-gray-700">{selectedBaby.birth_height_cm ? `${selectedBaby.birth_height_cm} cm` : '50 cm'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Grupo Sanguíneo</span>
              <span className="text-sm font-bold text-gray-700">{selectedBaby.blood_type || 'O+'}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Newborn Ficha Neonatal (Phase 9) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-emerald-500" />
              Ficha Clínica Neonatal (Nacimiento)
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
            <NewbornRecordViewer babyId={selectedBaby.id} />
          ) : (
            <p className="text-[10px] text-gray-400 font-semibold italic">Presione la flecha para desplegar la somatometría del parto, test APGAR y tamizajes del recién nacido.</p>
          )}
        </div>

        {/* Vaccines list */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-pink-500" />
            Calendario de Vacunas
          </h3>

          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-1">
            {babyVaccines.map((bv) => {
              const vaccine = db.vaccines.find(v => v.id === bv.vaccine_id);
              if (!vaccine) return null;
              return (
                <div key={bv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700">{vaccine.name}</h4>
                    <p className="text-[9px] text-gray-400 font-semibold">Enfermedad: {vaccine.target_disease} • Edad: {vaccine.recommended_age_months}m</p>
                  </div>
                  <button
                    onClick={() => handleToggleVaccine(bv.id)}
                    className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase transition-colors shrink-0 cursor-pointer ${
                      bv.status === 'applied' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {bv.status === 'applied' ? 'Aplicada ✓' : 'Pendiente'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones list */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Smile className="h-5 w-5 text-pink-500" /> Hitos del Desarrollo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {babyMilestones.map((dm) => (
              <div 
                key={dm.id} 
                onClick={() => handleToggleMilestone(dm.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                  dm.status === 'achieved' 
                    ? 'bg-pink-50/20 border-pink-100/50' 
                    : 'bg-slate-50/50 border-gray-150 hover:border-pink-200'
                }`}
              >
                <span className="text-base">{dm.category === 'Motor' ? '🏃' : dm.category === 'Social' ? '🤝' : '🗣️'}</span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-700 leading-tight">{dm.milestone_name}</h4>
                  <span className="text-[8px] text-gray-400 font-bold block mt-0.5">{dm.category} • {dm.target_age_months}m</span>
                </div>
                <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                  dm.status === 'achieved' ? 'border-pink-500 bg-pink-500 text-white' : 'border-gray-250 bg-white'
                }`}>
                  {dm.status === 'achieved' && <span className="text-[9px] font-black">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Pediatrician Connection */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-pink-500" /> Pediatra Vinculado
          </h3>
          {currentPediatrician ? (
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-gray-150 p-3 rounded-2xl text-xs">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{currentPediatrician.full_name}</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate">Lic: {db.doctors.find(d => d.id === currentPediatrician.id)?.license_number}</p>
              </div>
              <button onClick={() => onRevokeLink(pediatricianLink!.id)} className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-xl border border-rose-100 shrink-0 cursor-pointer">Revocar</button>
            </div>
          ) : pediatricianLink && pediatricianLink.status === 'pending' ? (
            <div className="bg-slate-50 border border-gray-150 p-3 rounded-2xl text-xs flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Pendiente</span>
              <button onClick={() => onRevokeLink(pediatricianLink.id)} className="text-[9px] font-bold text-rose-500 cursor-pointer">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setLinkOpen(true)} className="w-full py-2 bg-pink-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer">Vincular Pediatra</button>
          )}
        </div>

        {/* Growth Curves Summary */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-pink-500" /> Crecimiento (Peso/Talla)
          </h3>
          <div className="bg-pink-50/10 border border-pink-100/50 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-gray-400">Último Peso:</span>
              <span className="text-slate-700">6.8 kg (Percentil 45)</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-400">Última Talla:</span>
              <span className="text-slate-700">64.0 cm (Percentil 50)</span>
            </div>
          </div>
        </div>
      </div>

      <LinkDoctorModal isOpen={linkOpen} onClose={() => setLinkOpen(false)} onLink={onLinkDoctor} />

      {/* Ficha Neonatal Form Modal */}
      {neonatalEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="font-bold text-sm text-gray-800">Actualizar Ficha Neonatal</h3>
              <button onClick={() => setNeonatalEditOpen(false)} className="p-1 hover:bg-gray-150 rounded-lg text-gray-400 cursor-pointer">✕</button>
            </div>
            <NewbornRecordForm babyId={selectedBaby.id} onSuccess={() => setNeonatalEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
