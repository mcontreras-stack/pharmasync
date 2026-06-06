'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, MOCK_MOTHER_ID, Baby, BabyVaccine, DevelopmentMilestone } from '@/lib/mockDb';
import { Heart, Baby as BabyIcon, BrainCircuit } from 'lucide-react';
import PregnancyView from './PregnancyView';
import FamilyView from './FamilyView';
import AiChatWidget from '../ai/AiChatWidget';

export default function MotherDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [aiOpen, setAiOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'pregnancy' | 'family'>(() => {
    const database = getMockDb();
    const hasActivePregnancy = database.pregnancies.some(p => p.mother_id === MOCK_MOTHER_ID && p.status === 'active');
    const hasBabies = database.babies.some(b => b.mother_id === MOCK_MOTHER_ID);
    return !hasActivePregnancy && hasBabies ? 'family' : 'pregnancy';
  });

  const motherId = MOCK_MOTHER_ID;
  const babies = db.babies.filter(b => b.mother_id === motherId);
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id || '');

  if (!user) return null;

  const activePregnancy = db.pregnancies.find(p => p.mother_id === motherId && p.status === 'active');

  // Calculate gestational details for header summary
  const lmp = activePregnancy ? new Date(activePregnancy.last_menstrual_period) : null;
  const weeksText = lmp 
    ? `Semana ${Math.floor(Math.ceil(Math.abs(new Date().getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)) / 7)} de Gestación`
    : 'Gestión y Control de tus Hijos';

  const handleLinkDoctor = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.toUpperCase().trim();
    const targetDoc = db.doctors.find(d => 
      (d.invite_code && d.invite_code.toUpperCase() === cleanCode) || 
      (d.id === 'doctor-ana-456' && cleanCode === 'OB-ANA-28') || 
      (d.id === 'doctor-andres-789' && cleanCode === 'PE-AND-04')
    );

    if (!targetDoc) {
      return { success: false, message: 'Código de invitación no encontrado.' };
    }

    const exists = (db.doctor_patient_links || []).some(lnk => 
      lnk.doctor_id === targetDoc.id && lnk.mother_id === motherId && lnk.status !== 'inactive'
    );

    if (exists) {
      return { success: false, message: 'Ya tienes una vinculación activa con este especialista.' };
    }

    const newLink = {
      id: `lnk-${Date.now()}`,
      doctor_id: targetDoc.id,
      mother_id: motherId,
      link_code: cleanCode,
      status: 'pending' as const
    };

    const updatedDb = {
      ...db,
      doctor_patient_links: [...(db.doctor_patient_links || []), newLink]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    return { success: true, message: 'Vínculo solicitado correctamente. Pendiente de aprobación.' };
  };

  const handleRevokeLink = (linkId: string) => {
    const updatedLinks = db.doctor_patient_links.map(l => {
      if (l.id === linkId) return { ...l, status: 'inactive' as const };
      return l;
    });

    const link = db.doctor_patient_links.find(l => l.id === linkId);
    let updatedPregnancies = db.pregnancies;
    let updatedBabies = db.babies;

    if (link) {
      const doc = db.doctors.find(d => d.id === link.doctor_id);
      if (doc?.specialty === 'obstetrician') {
        updatedPregnancies = db.pregnancies.map(p => p.mother_id === motherId && p.obstetrician_id === link.doctor_id ? { ...p, obstetrician_id: null } : p);
      } else {
        updatedBabies = db.babies.map(b => b.mother_id === motherId && b.pediatrician_id === link.doctor_id ? { ...b, pediatrician_id: null } : b);
      }
    }

    const updatedDb = {
      ...db,
      doctor_patient_links: updatedLinks,
      pregnancies: updatedPregnancies,
      babies: updatedBabies
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleRegisterBirth = (name: string, date: string, gender: string, weight?: number, height?: number) => {
    if (!activePregnancy) return;

    const newBaby: Baby = {
      id: `baby-${Date.now()}`,
      mother_id: motherId,
      pregnancy_id: activePregnancy.id,
      name,
      birth_date: date,
      birth_weight_grams: weight,
      birth_height_cm: height,
      gender,
      pediatrician_id: null
    };

    const updatedPregnancies = db.pregnancies.map(p => p.id === activePregnancy.id ? { ...p, status: 'completed' as const } : p);

    const babyVaccines: BabyVaccine[] = db.vaccines.map(v => ({
      id: `bvac-${Date.now()}-${v.id}`,
      baby_id: newBaby.id,
      vaccine_id: v.id,
      status: v.recommended_age_months === 0 ? 'applied' : 'pending',
      applied_date: v.recommended_age_months === 0 ? date : undefined
    }));

    const milestones: DevelopmentMilestone[] = [
      { id: `mil-${Date.now()}-1`, baby_id: newBaby.id, category: 'Motor', milestone_name: 'Sostiene la cabeza erguida', target_age_months: 3, status: 'pending' },
      { id: `mil-${Date.now()}-2`, baby_id: newBaby.id, category: 'Social', milestone_name: 'Sonrisa social espontánea', target_age_months: 2, status: 'pending' },
      { id: `mil-${Date.now()}-3`, baby_id: newBaby.id, category: 'Lenguaje', milestone_name: 'Balbucea sonidos', target_age_months: 4, status: 'pending' }
    ];

    const updatedDb = {
      ...db,
      pregnancies: updatedPregnancies,
      babies: [...db.babies, newBaby],
      baby_vaccines: [...db.baby_vaccines, ...babyVaccines],
      development_milestones: [...db.development_milestones, ...milestones]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setSelectedBabyId(newBaby.id);
    setActiveMode('family');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Welcome header & Mode Switcher */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ¡Hola, {user.full_name}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeMode === 'pregnancy' && activePregnancy ? weeksText : 'Gestión y control de tus hijos'}
          </p>
        </div>

        <div className="flex bg-pink-50 p-1.5 rounded-2xl w-full md:w-auto self-start md:self-center">
          <button
            onClick={() => setActiveMode('pregnancy')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${activeMode === 'pregnancy' ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-500 hover:text-pink-600'}`}
          >
            <Heart className="h-4 w-4" />
            Mi Embarazo
          </button>
          <button
            onClick={() => setActiveMode('family')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${activeMode === 'family' ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-500 hover:text-pink-600'}`}
          >
            <BabyIcon className="h-4 w-4" />
            Mis Hijos
          </button>
        </div>
      </div>

      {activeMode === 'pregnancy' && activePregnancy ? (
        <PregnancyView 
          activePregnancy={activePregnancy} 
          onGraduation={handleRegisterBirth} 
          onLinkDoctor={handleLinkDoctor} 
          onRevokeLink={handleRevokeLink} 
        />
      ) : activeMode === 'pregnancy' ? (
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center max-w-lg mx-auto space-y-4 text-slate-800">
          <span className="text-5xl block">🤰</span>
          <h2 className="text-xl font-bold">No tienes un embarazo activo registrado</h2>
          <p className="text-xs text-gray-400">Comience registrando su embarazo actual para hacer seguimiento semana a semana.</p>
        </div>
      ) : babies.length > 0 ? (
        <FamilyView 
          babies={babies} 
          selectedBabyId={selectedBabyId} 
          onSelectBaby={setSelectedBabyId} 
          onLinkDoctor={handleLinkDoctor} 
          onRevokeLink={handleRevokeLink} 
        />
      ) : (
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center max-w-lg mx-auto space-y-4 text-slate-800">
          <span className="text-5xl block">👶</span>
          <h2 className="text-xl font-bold">No tienes hijos registrados</h2>
          <p className="text-xs text-gray-400">Si tu embarazo ya finalizó, puedes registrar a tu bebé de inmediato.</p>
        </div>
      )}

      {/* Floating AI assistant button (Phase 7) */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 z-40 cursor-pointer animate-bounce"
        title="Consultar Asistente de IA"
      >
        <BrainCircuit className="h-6 w-6" />
      </button>

      {/* Mounting the AI helper Drawer */}
      <AiChatWidget isOpen={aiOpen} onClose={() => setAiOpen(false)} contextType="mother" />
    </div>
  );
}
