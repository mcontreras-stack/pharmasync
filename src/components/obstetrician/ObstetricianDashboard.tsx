'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, PrenatalVisit, MOCK_OBSTETRICIAN_ID, Doctor } from '@/lib/mockDb';
import { Lock, BrainCircuit } from 'lucide-react';
import ObstetricianRoster from './ObstetricianRoster';
import ObstetricianPatientFile from './ObstetricianPatientFile';
import ObstetricianVisitModal from './ObstetricianVisitModal';
import AiChatWidget from '../ai/AiChatWidget';

export default function ObstetricianDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMotherId, setSelectedMotherId] = useState<string>('mother-maria-123');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  if (!user) return null;

  const doctor = (db.doctors.find(d => d.id === user.id) || { exequatur: '', cmd_number: '' }) as Doctor;

  // Verification blocker overlay if doctor is not approved
  if (user.status !== 'approved' && user.id !== MOCK_OBSTETRICIAN_ID) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-150 p-12 text-center max-w-xl mx-auto my-12 space-y-6 select-none shadow-sm text-slate-800">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-black">Verificación de Cuenta Requerida</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Tu perfil profesional se encuentra en estado <span className="font-extrabold text-amber-600">Revisión de Documentos</span>.
            Para prescribir recetas y acceder a expedientes clínicos, nuestro equipo administrativo interno debe validar tus credenciales.
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
  const connectedMothers = db.mothers.filter(m => db.pregnancies.some(p => p.mother_id === m.id && p.obstetrician_id === user.id));

  const patientProfiles = connectedMothers.map(m => {
    const profile = db.profiles.find(p => p.id === m.id);
    const pregnancy = db.pregnancies.find(p => p.mother_id === m.id && p.status === 'active');
    return { mother: m, profile, pregnancy };
  }).filter(p => {
    if (!searchQuery) return true;
    return p.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedPatient = patientProfiles.find(p => p.mother.id === selectedMotherId) || patientProfiles[0];

  let pregnancyWeeks = 28;
  if (selectedPatient?.pregnancy) {
    const lmp = new Date(selectedPatient.pregnancy.last_menstrual_period);
    const diffTime = Math.abs(new Date().getTime() - lmp.getTime());
    pregnancyWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  const handleLinkAction = (linkId: string, action: 'approve' | 'reject') => {
    const link = db.doctor_patient_links.find(l => l.id === linkId);
    if (!link) return;

    const nextStatus = action === 'approve' ? 'active' as const : 'inactive' as const;
    const updatedLinks = db.doctor_patient_links.map(l => l.id === linkId ? { ...l, status: nextStatus } : l);

    let updatedPregnancies = db.pregnancies;
    if (action === 'approve') {
      updatedPregnancies = db.pregnancies.map(p => p.mother_id === link.mother_id && p.status === 'active' ? { ...p, obstetrician_id: user.id } : p);
    }

    const updatedDb = { ...db, doctor_patient_links: updatedLinks, pregnancies: updatedPregnancies };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleSaveVisit = (week: number, weight?: number, bp?: string, heartRate?: number, notes?: string, recommendations?: string) => {
    if (!selectedPatient?.pregnancy) return;

    const newVisit: PrenatalVisit = {
      id: `pvisit-${Date.now()}`,
      pregnancy_id: selectedPatient.pregnancy.id,
      visit_date: new Date().toISOString().split('T')[0],
      gestational_week: week,
      mother_weight_kg: weight,
      blood_pressure: bp,
      fetal_heart_rate_bpm: heartRate,
      notes,
      recommendations
    };

    const updatedAppointments = db.appointments.map(a => a.mother_id === selectedPatient.mother.id && a.doctor_id === user.id && a.status === 'scheduled' ? { ...a, status: 'completed' as const } : a);
    const updatedDb = { ...db, prenatal_visits: [newVisit, ...db.prenatal_visits], appointments: updatedAppointments };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setVisitModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡Hola, {user.full_name}! 👋</h1>
          <p className="text-xs text-gray-500 mt-1">Consola clínica prenatal de control obstétrico</p>
        </div>

        <div className="bg-purple-50 border border-purple-200/50 rounded-2xl p-3 flex items-center gap-3">
          <div>
            <span className="text-[9px] font-bold text-purple-500 uppercase block tracking-wider">Código de Invitación</span>
            <span className="text-sm font-black text-purple-700 tracking-widest font-mono">{doctor.invite_code || 'OB-ANA-28'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ObstetricianRoster 
          patientProfiles={patientProfiles} 
          selectedMotherId={selectedMotherId} 
          onSelectPatient={setSelectedMotherId} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          pendingLinks={pendingLinks} 
          onLinkAction={handleLinkAction} 
          pregnancyWeeks={pregnancyWeeks}
        />
        <div className="lg:col-span-2">
          <ObstetricianPatientFile 
            selectedPatient={selectedPatient} 
            pregnancyWeeks={pregnancyWeeks} 
            onAddVisitClick={() => setVisitModalOpen(true)} 
          />
        </div>
      </div>

      {visitModalOpen && selectedPatient && (
        <ObstetricianVisitModal 
          isOpen={visitModalOpen} 
          onClose={() => setVisitModalOpen(false)} 
          patientName={selectedPatient.profile?.full_name || 'Paciente'} 
          onSave={handleSaveVisit} 
          initialWeek={pregnancyWeeks}
        />
      )}

      {/* Doctor AI Assistant Floating Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 z-40 cursor-pointer animate-bounce"
        title="Consultar Copiloto AI"
      >
        <BrainCircuit className="h-6 w-6" />
      </button>

      <AiChatWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} contextType="doctor" patientId={selectedMotherId} />
    </div>
  );
}
