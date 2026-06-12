'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import { Baby, Pregnancy, Mother } from '@/lib/mockDb';
import { Heart, Baby as BabyIcon, BrainCircuit, CalendarHeart, ClipboardList, Loader2 } from 'lucide-react';
import PregnancyView from './PregnancyView';
import FamilyView from './FamilyView';
import AiChatWidget from '../ai/AiChatWidget';
import PregnancySetupModal from './PregnancySetupModal';
import BirthRegisterModal from './BirthRegisterModal';
import { getActivePregnancy, getBabies, getMotherRecord, createPregnancy, registerBirth } from '@/services/motherService';
import { requestLink, setLinkStatus } from '@/services/linkService';

export default function MotherDashboard() {
  const { user } = useAuth();
  const { setActiveTab: setShellTab } = useTab();
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePregnancy, setActivePregnancy] = useState<Pregnancy | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [motherRecord, setMotherRecord] = useState<Mother | null>(null);
  const [activeMode, setActiveMode] = useState<'pregnancy' | 'family'>('pregnancy');
  const [selectedBabyId, setSelectedBabyId] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [birthOpen, setBirthOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const motherId = user?.id || '';

  const loadData = useCallback(async () => {
    if (!motherId) return;
    setLoading(true);
    setOnboardingDismissed(localStorage.getItem(`vitarahealth_onboarding_done_${motherId}`) === 'true');
    try {
      const [pregnancy, babyList, record] = await Promise.all([
        getActivePregnancy(motherId),
        getBabies(motherId),
        getMotherRecord(motherId),
      ]);
      setActivePregnancy(pregnancy);
      setBabies(babyList);
      setMotherRecord(record);
      setSelectedBabyId(prev => prev || babyList[0]?.id || '');
      setActiveMode(prev => (!pregnancy && babyList.length > 0 && prev === 'pregnancy') ? 'family' : prev);
    } catch (err) {
      console.error('[MotherDashboard] Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, [motherId]);

  useEffect(() => {
    const t = setTimeout(() => { loadData(); }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  if (!user) return null;

  // Calculate gestational details for header summary
  const lmp = activePregnancy ? new Date(activePregnancy.last_menstrual_period) : null;
  const weeksText = lmp
    ? `Semana ${Math.floor(Math.ceil(Math.abs(new Date().getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)) / 7)} de Gestación`
    : 'Gestión y Control de tus Hijos';

  // ¿Primer inicio sin información cargada?
  const profileIncomplete = !motherRecord || (!motherRecord.birth_date && !motherRecord.blood_type);
  const showOnboarding = !loading && !onboardingDismissed && profileIncomplete && !activePregnancy && babies.length === 0;

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    localStorage.setItem(`vitarahealth_onboarding_done_${motherId}`, 'true');
  };

  const handleCreatePregnancy = async (lmpDate: string, edd: string, notes?: string) => {
    await createPregnancy(motherId, lmpDate, edd, notes);
    dismissOnboarding();
    await loadData();
    setActiveMode('pregnancy');
  };

  const handleLinkDoctor = async (code: string): Promise<{ success: boolean; message: string }> => {
    const result = await requestLink(motherId, code);
    if (result.success) await loadData();
    return result;
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await setLinkStatus(linkId, 'revoke');
      await loadData();
    } catch (err) {
      console.error('[MotherDashboard] Error revocando vínculo:', err);
    }
  };

  const handleRegisterBirth = async (name: string, date: string, gender: string, weight?: number, height?: number) => {
    const baby = await registerBirth(motherId, {
      name,
      birth_date: date,
      gender,
      birth_weight_grams: weight,
      birth_height_cm: height,
      pregnancy_id: activePregnancy?.id || null,
    });
    setBirthOpen(false);
    dismissOnboarding();
    await loadData();
    setSelectedBabyId(baby.id);
    setActiveMode('family');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
      </div>
    );
  }

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

      {/* Onboarding de primer inicio: pedir la información de la usuaria */}
      {showOnboarding && (
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 text-white shadow-lg space-y-4">
          <div>
            <h2 className="text-lg font-black">¡Bienvenida! Completemos tu información 📋</h2>
            <p className="text-xs text-pink-100 mt-1">
              Para que el sistema muestre tus datos reales necesitamos conocerte. Los campos que no completes quedarán en blanco hasta que los agregues.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setSetupOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-pink-600 rounded-xl text-xs font-black hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <CalendarHeart className="h-4 w-4" />
              Estoy embarazada — Registrar
            </button>
            <button
              onClick={() => { setBirthOpen(true); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/15 border border-white/40 text-white rounded-xl text-xs font-black hover:bg-white/25 transition-colors cursor-pointer"
            >
              <BabyIcon className="h-4 w-4" />
              Ya tengo hijos — Registrar
            </button>
            <button
              onClick={() => setShellTab('perfil')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/15 border border-white/40 text-white rounded-xl text-xs font-black hover:bg-white/25 transition-colors cursor-pointer"
            >
              <ClipboardList className="h-4 w-4" />
              Completar mi Ficha Médica
            </button>
          </div>
          <button onClick={dismissOnboarding} className="text-[10px] text-pink-100 underline hover:text-white cursor-pointer">
            Omitir por ahora
          </button>
        </div>
      )}

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
          <button
            onClick={() => setSetupOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
          >
            <CalendarHeart className="h-4 w-4" />
            Registrar mi Embarazo
          </button>
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
          <button
            onClick={() => setBirthOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
          >
            <BabyIcon className="h-4 w-4" />
            Registrar a mi Bebé
          </button>
        </div>
      )}

      {/* Modales */}
      <PregnancySetupModal
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        onRegister={handleCreatePregnancy}
      />
      <BirthRegisterModal
        isOpen={birthOpen}
        onClose={() => setBirthOpen(false)}
        onRegister={handleRegisterBirth}
      />

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
