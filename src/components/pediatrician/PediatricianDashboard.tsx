'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, PediatricVisit, GrowthRecord, MOCK_PEDIATRICIAN_ID, Doctor } from '@/lib/mockDb';
import { Lock, BrainCircuit } from 'lucide-react';
import PediatricianRoster from './PediatricianRoster';
import PediatricianPatientFile from './PediatricianPatientFile';
import PediatricianVisitModal from './PediatricianVisitModal';
import AiChatWidget from '../ai/AiChatWidget';
import { getPediatricPatients, getPendingLinksForDoctor, setLinkStatus, getMyProfessional, PediatricPatient, PatientLink } from '@/services/linkService';

export default function PediatricianDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Datos del backend activo (demo, Supabase o PostgreSQL)
  const [myPatients, setMyPatients] = useState<PediatricPatient[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PatientLink[]>([]);
  const [doctor, setDoctor] = useState<Partial<Doctor>>({});

  const doctorId = user?.id || '';

  const loadData = useCallback(async () => {
    if (!doctorId) return;
    try {
      const [roster, pending, prof] = await Promise.all([
        getPediatricPatients(doctorId),
        getPendingLinksForDoctor(doctorId),
        getMyProfessional(doctorId, ''),
      ]);
      setMyPatients(roster);
      setPendingLinks(pending);
      setDoctor(prof);
      setSelectedBabyId(prev => prev || roster[0]?.baby.id || '');
    } catch (err) {
      console.error('[PediatricianDashboard] Error cargando datos:', err);
    }
  }, [doctorId]);

  useEffect(() => {
    const t = setTimeout(() => { loadData(); }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  if (!user) return null;

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

  const babyProfiles = myPatients.map(p => ({
    baby: p.baby,
    motherProfile: { full_name: p.mother_name },
  })).filter(p => {
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

  const handleLinkAction = async (linkId: string, action: 'approve' | 'reject') => {
    try {
      await setLinkStatus(linkId, action);
      await loadData();
    } catch (err) {
      console.error('[PediatricianDashboard] Error gestionando vínculo:', err);
    }
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
