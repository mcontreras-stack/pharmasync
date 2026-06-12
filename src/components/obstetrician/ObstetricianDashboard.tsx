'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, PrenatalVisit, MOCK_OBSTETRICIAN_ID, Doctor } from '@/lib/mockDb';
import { Lock, BrainCircuit } from 'lucide-react';
import ObstetricianRoster from './ObstetricianRoster';
import ObstetricianPatientFile from './ObstetricianPatientFile';
import ObstetricianVisitModal from './ObstetricianVisitModal';
import AiChatWidget from '../ai/AiChatWidget';
import { getObstetricPatients, getPendingLinksForDoctor, setLinkStatus, getMyProfessional, ObstetricPatient, PatientLink } from '@/services/linkService';

export default function ObstetricianDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMotherId, setSelectedMotherId] = useState<string>('');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Datos del backend activo (demo, Supabase o PostgreSQL)
  const [patients, setPatients] = useState<ObstetricPatient[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PatientLink[]>([]);
  const [doctor, setDoctor] = useState<Partial<Doctor>>({});

  const doctorId = user?.id || '';

  const loadData = useCallback(async () => {
    if (!doctorId) return;
    try {
      const [roster, pending, prof] = await Promise.all([
        getObstetricPatients(doctorId),
        getPendingLinksForDoctor(doctorId),
        getMyProfessional(doctorId, ''),
      ]);
      setPatients(roster);
      setPendingLinks(pending);
      setDoctor(prof);
      setSelectedMotherId(prev => prev || roster[0]?.motherId || '');
    } catch (err) {
      console.error('[ObstetricianDashboard] Error cargando datos:', err);
    }
  }, [doctorId]);

  useEffect(() => {
    const t = setTimeout(() => { loadData(); }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  if (!user) return null;

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

  const patientProfiles = patients.map(p => ({
    mother: p.mother || { id: p.motherId, phone: '', birth_date: '', emergency_contact_name: '', emergency_contact_phone: '', blood_type: '' },
    profile: { full_name: p.full_name },
    pregnancy: p.pregnancy,
  })).filter(p => {
    if (!searchQuery) return true;
    return p.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedPatient = patientProfiles.find(p => p.mother.id === selectedMotherId) || patientProfiles[0];

  let pregnancyWeeks = 28;
  if (selectedPatient?.pregnancy) {
    const lmp = new Date(selectedPatient.pregnancy.last_menstrual_period);
    const diffTime = Math.abs(new Date().getTime() - lmp.getTime());
    pregnancyWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  const handleLinkAction = async (linkId: string, action: 'approve' | 'reject') => {
    try {
      await setLinkStatus(linkId, action);
      await loadData();
    } catch (err) {
      console.error('[ObstetricianDashboard] Error gestionando vínculo:', err);
    }
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

    // Las visitas prenatales se registran en la base demo (módulo pendiente de migrar)
    const db = getMockDb();
    db.appointments = db.appointments.map(a => a.mother_id === selectedPatient.mother.id && a.doctor_id === user.id && a.status === 'scheduled' ? { ...a, status: 'completed' as const } : a);
    db.prenatal_visits = [newVisit, ...db.prenatal_visits];
    saveMockDb(db);
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
