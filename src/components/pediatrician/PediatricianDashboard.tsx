'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, PediatricVisit, GrowthRecord, MOCK_PEDIATRICIAN_ID, Doctor } from '@/lib/mockDb';
import { Lock, BrainCircuit } from 'lucide-react';
import PediatricianRoster from './PediatricianRoster';
import PediatricianPatientFile from './PediatricianPatientFile';
import PediatricianVisitModal from './PediatricianVisitModal';
import AiChatWidget from '../ai/AiChatWidget';

export default function PediatricianDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBabyId, setSelectedBabyId] = useState<string>('baby-mateo-999');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  if (!user) return null;

  const doctor = (db.doctors.find(d => d.id === user.id) || { exequatur: '', cmd_number: '' }) as Doctor;

  // Verification blocker overlay if doctor is not approved
  if (user.status !== 'approved' && user.id !== MOCK_PEDIATRICIAN_ID) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-150 p-12 text-center max-w-xl mx-auto my-12 space-y-6 select-none shadow-sm text-slate-800">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-black">Verificación de Cuenta Requerida</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Tu perfil profesional se encuentra en estado <span className="font-extrabold text-amber-600">Revisión de Documentos</span>.
            Para registrar visitas pediátricas y emitir recetas de medicamentos, nuestro equipo administrativo debe validar tus credenciales médicas.
          </p>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-center gap-6 text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
          <span>Exequátur: {doctor.exequatur || 'Pendiente'}</span>
          <span>CMD: {doctor.cmd_number || 'Pendiente'}</span>
        </div>
      </div>
    );
  }

  const pendingLinks = (db.doctor_patient_links || []).filter(lnk => lnk.doctor_id === user.id && lnk.status === 'pending');
  const connectedBabies = db.babies.filter(b => b.pediatrician_id === user.id);

  const babyProfiles = connectedBabies.map(b => {
    const motherProfile = db.profiles.find(p => p.id === b.mother_id);
    return { baby: b, motherProfile };
  }).filter(p => {
    if (!searchQuery) return true;
    return p.baby.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedBabyProfile = babyProfiles.find(p => p.baby.id === selectedBabyId) || babyProfiles[0];

  const today = new Date();
  let ageMonths = 4;
  if (selectedBabyProfile) {
    const birth = new Date(selectedBabyProfile.baby.birth_date);
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    ageMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4));
  }

  const handleLinkAction = (linkId: string, action: 'approve' | 'reject') => {
    const link = db.doctor_patient_links.find(l => l.id === linkId);
    if (!link) return;

    const nextStatus = action === 'approve' ? 'active' as const : 'inactive' as const;
    const updatedLinks = db.doctor_patient_links.map(l => l.id === linkId ? { ...l, status: nextStatus } : l);

    let updatedBabies = db.babies;
    if (action === 'approve') {
      updatedBabies = db.babies.map(b => b.mother_id === link.mother_id ? { ...b, pediatrician_id: user.id } : b);
    }

    const updatedDb = { ...db, doctor_patient_links: updatedLinks, babies: updatedBabies };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleSaveVisit = (weight: number, height: number, headCirc?: number, devStatus?: string, notes?: string, recommendations?: string) => {
    if (!selectedBabyProfile) return;

    const babyId = selectedBabyProfile.baby.id;

    const newVisit: PediatricVisit = {
      id: `pedvisit-${Date.now()}`,
      baby_id: babyId,
      visit_date: today.toISOString().split('T')[0],
      weight_kg: weight,
      height_cm: height,
      head_circ_cm: headCirc,
      development_status: devStatus,
      notes,
      recommendations
    };

    const newGrowth: GrowthRecord = {
      id: `gro-${Date.now()}`,
      baby_id: babyId,
      record_date: today.toISOString().split('T')[0],
      age_months: ageMonths,
      weight_kg: weight,
      height_cm: height,
      head_circ_cm: headCirc,
      weight_percentile: 45,
      height_percentile: 50
    };

    const updatedDb = {
      ...db,
      pediatric_visits: [newVisit, ...db.pediatric_visits],
      growth_records: [newGrowth, ...db.growth_records]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setVisitModalOpen(false);
  };

  const handleToggleVaccineStatus = (babyVaccineId: string) => {
    const updatedVaccines = db.baby_vaccines.map(bv => {
      if (bv.id === babyVaccineId) {
        return {
          ...bv,
          status: (bv.status === 'applied' ? 'pending' : 'applied') as 'pending' | 'applied',
          applied_date: bv.status === 'applied' ? undefined : today.toISOString().split('T')[0],
          pediatrician_id: bv.status === 'applied' ? undefined : user.id
        };
      }
      return bv;
    });
    const updatedDb = { ...db, baby_vaccines: updatedVaccines };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleToggleMilestoneStatus = (milestoneId: string) => {
    const updatedMilestones = db.development_milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: (m.status === 'achieved' ? 'pending' : 'achieved') as 'pending' | 'achieved',
          achieved_date: m.status === 'achieved' ? undefined : today.toISOString().split('T')[0]
        };
      }
      return m;
    });
    const updatedDb = { ...db, development_milestones: updatedMilestones };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡Hola, {user.full_name}! 👋</h1>
          <p className="text-xs text-gray-500 mt-1">Consola clínica de control de niños y pediatría</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-3 flex items-center gap-3">
          <div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase block tracking-wider">Código de Invitación</span>
            <span className="text-sm font-black text-emerald-700 tracking-widest font-mono">{doctor.invite_code || 'PE-AND-04'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PediatricianRoster 
          babyProfiles={babyProfiles} 
          selectedBabyId={selectedBabyId} 
          onSelectBaby={setSelectedBabyId} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          pendingLinks={pendingLinks} 
          onLinkAction={handleLinkAction} 
          ageMonths={ageMonths}
        />
        <div className="lg:col-span-2">
          <PediatricianPatientFile 
            selectedBabyProfile={selectedBabyProfile} 
            ageMonths={ageMonths} 
            onAddVisitClick={() => setVisitModalOpen(true)} 
            onToggleVaccine={handleToggleVaccineStatus} 
            onToggleMilestone={handleToggleMilestoneStatus} 
          />
        </div>
      </div>

      {visitModalOpen && selectedBabyProfile && (
        <PediatricianVisitModal 
          isOpen={visitModalOpen} 
          onClose={() => setVisitModalOpen(false)} 
          patientName={selectedBabyProfile.baby.name} 
          onSave={handleSaveVisit} 
        />
      )}

      {/* Pediatrician AI Assistant Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 z-40 cursor-pointer animate-bounce"
        title="Consultar Copiloto AI"
      >
        <BrainCircuit className="h-6 w-6" />
      </button>

      <AiChatWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} contextType="doctor" patientId={selectedBabyId} />
    </div>
  );
}
