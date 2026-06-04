'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Profile, PediatricVisit, GrowthRecord, BabyVaccine, DevelopmentMilestone, MOCK_PEDIATRICIAN_ID } from '@/lib/mockDb';
import {
  Baby as BabyIcon,
  Search,
  Calendar,
  Activity,
  Syringe,
  Smile,
  Clock,
  Plus,
  TrendingUp,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Lock,
  Check,
  X
} from 'lucide-react';

export default function PediatricianDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected child states
  const [selectedBabyId, setSelectedBabyId] = useState<string>('baby-mateo-999');
  const [showVisitModal, setShowVisitModal] = useState(false);

  // New Visit form states
  const [weightKg, setWeightKg] = useState('6.8');
  const [heightCm, setHeightCm] = useState('64');
  const [headCirc, setHeadCirc] = useState('41.2');
  const [devStatus, setDevStatus] = useState('Buen tono muscular. Balbucea y sonríe.');
  const [visitNotes, setVisitNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  if (!user) return null;

  const doctor = db.doctors.find(d => d.id === user.id) || { exequatur: '', colegiatura: '' };
  
  // Blocker overlay if account is not approved
  if (user.status !== 'approved' && user.id !== MOCK_PEDIATRICIAN_ID) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-150 p-12 text-center max-w-xl mx-auto my-12 space-y-6 select-none shadow-sm">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-800">Verificación de Cuenta Requerida</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto font-medium">
            Tu perfil profesional se encuentra en estado <span className="font-extrabold text-amber-600">Revisión de Documentos</span>.
            Para registrar visitas pediátricas y emitir recetas de medicamentos, nuestro equipo administrativo debe validar tus credenciales médicas.
          </p>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-center gap-6 text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
          <span>Exequátur: {doctor.exequatur || 'Pendiente'}</span>
          <span>CMD: {doctor.colegiatura || 'Pendiente'}</span>
        </div>
      </div>
    );
  }

  const pendingLinks = (db.doctor_patient_links || []).filter(lnk => lnk.doctor_id === user.id && lnk.status === 'pending');

  const handleLinkAction = (linkId: string, action: 'approve' | 'reject') => {
    const link = db.doctor_patient_links.find(l => l.id === linkId);
    if (!link) return;

    const nextStatus = action === 'approve' ? 'active' as const : 'inactive' as const;

    const updatedLinks = db.doctor_patient_links.map(l => {
      if (l.id === linkId) return { ...l, status: nextStatus };
      return l;
    });

    let updatedBabies = db.babies;
    if (action === 'approve') {
      // Find mother's babies and set pediatrician_id for the first baby, or all babies
      updatedBabies = db.babies.map(b => {
        if (b.mother_id === link.mother_id) {
          return { ...b, pediatrician_id: user.id };
        }
        return b;
      });
    }

    // Add notification to Mother
    const motherProfile = db.profiles.find(p => p.id === link.mother_id);
    let updatedNotifications = db.notifications;
    if (motherProfile) {
      const newNot = {
        id: `not-${Date.now()}`,
        user_id: link.mother_id,
        title: action === 'approve' ? 'Vinculación de Pediatra Aceptada' : 'Vinculación de Pediatra Rechazada',
        content: action === 'approve' 
          ? `El especialista ${user.full_name} ha aceptado tu solicitud de vinculación.` 
          : `El especialista ${user.full_name} ha declinado tu solicitud de vinculación.`,
        type: 'system' as const,
        created_at: new Date().toISOString()
      };
      updatedNotifications = [newNot, ...db.notifications];
    }

    const updatedDb = {
      ...db,
      doctor_patient_links: updatedLinks,
      babies: updatedBabies,
      notifications: updatedNotifications
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Query connected babies (babies linked to this pediatrician)
  const connectedBabies = db.babies.filter(b => b.pediatrician_id === user.id);

  const babyProfiles = connectedBabies.map(b => {
    const motherProfile = db.profiles.find(p => p.id === b.mother_id);
    return {
      baby: b,
      motherProfile
    };
  }).filter(p => {
    if (!searchQuery) return true;
    return p.baby.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Selected baby details
  const selectedBabyProfile = babyProfiles.find(p => p.baby.id === selectedBabyId) || babyProfiles[0];

  const today = new Date();
  let ageMonths = 4;
  if (selectedBabyProfile) {
    const birth = new Date(selectedBabyProfile.baby.birth_date);
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    ageMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4));
  }

  // Related logs
  const babyVisits = selectedBabyProfile
    ? db.pediatric_visits
        .filter(v => v.baby_id === selectedBabyProfile.baby.id)
        .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
    : [];

  const babyGrowth = selectedBabyProfile
    ? db.growth_records
        .filter(g => g.baby_id === selectedBabyProfile.baby.id)
        .sort((a, b) => b.age_months - a.age_months)
    : [];

  const babyVaccines = selectedBabyProfile
    ? db.baby_vaccines
        .filter(bv => bv.baby_id === selectedBabyProfile.baby.id)
    : [];

  const babyMilestones = selectedBabyProfile
    ? db.development_milestones
        .filter(m => m.baby_id === selectedBabyProfile.baby.id)
    : [];

  const handleAddPediatricVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabyProfile) return;

    const babyId = selectedBabyProfile.baby.id;

    // 1. Create pediatric visit
    const newVisit: PediatricVisit = {
      id: `pedvisit-${Date.now()}`,
      baby_id: babyId,
      visit_date: new Date().toISOString().split('T')[0],
      weight_kg: parseFloat(weightKg),
      height_cm: parseFloat(heightCm),
      head_circ_cm: headCirc ? parseFloat(headCirc) : undefined,
      development_status: devStatus || undefined,
      notes: visitNotes || undefined,
      recommendations: recommendations || undefined
    };

    // 2. Add to growth record
    const newGrowth: GrowthRecord = {
      id: `gro-${Date.now()}`,
      baby_id: babyId,
      record_date: new Date().toISOString().split('T')[0],
      age_months: ageMonths,
      weight_kg: parseFloat(weightKg),
      height_cm: parseFloat(heightCm),
      head_circ_cm: headCirc ? parseFloat(headCirc) : undefined,
      weight_percentile: 45, // default simulation percentile
      height_percentile: 50
    };

    const updatedDb = {
      ...db,
      pediatric_visits: [newVisit, ...db.pediatric_visits],
      growth_records: [newGrowth, ...db.growth_records]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setShowVisitModal(false);

    // Reset forms
    setVisitNotes('');
    setRecommendations('');
  };

  const handleToggleVaccineStatus = (babyVaccineId: string) => {
    const updatedVaccines = db.baby_vaccines.map(bv => {
      if (bv.id === babyVaccineId) {
        return {
          ...bv,
          status: (bv.status === 'applied' ? 'pending' : 'applied') as 'pending' | 'applied',
          applied_date: bv.status === 'applied' ? undefined : new Date().toISOString().split('T')[0],
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
          achieved_date: m.status === 'achieved' ? undefined : new Date().toISOString().split('T')[0]
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
      {/* Header card with doctor details & Invitation code */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡Hola, {user.full_name}! 👋</h1>
          <p className="text-xs text-gray-500 mt-1">Panel clínico de control de niños y pediatría</p>
        </div>

        {/* Invite code */}
        <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-3 flex items-center gap-3">
          <div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase block tracking-wider">Código de Invitación</span>
            <span className="text-sm font-black text-emerald-700 tracking-widest font-mono">PE-AND-04</span>
          </div>
          <span className="text-[10px] text-emerald-600 bg-white/70 px-2 py-1 rounded-lg font-semibold max-w-[120px] leading-tight">
            Compártelo con los padres
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Roster Board */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2">
            <BabyIcon className="h-5 w-5 text-emerald-500" />
            Mis Niños Pacientes ({babyProfiles.length})
          </h3>

          {/* Pending patient requests */}
          {pendingLinks.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3.5 space-y-2">
              <span className="text-[9px] font-black text-amber-700 uppercase bg-amber-100/40 px-2 py-0.5 rounded-md inline-block">
                Solicitudes Pendientes ({pendingLinks.length})
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {pendingLinks.map(lnk => {
                  const momProfile = db.profiles.find(p => p.id === lnk.mother_id);
                  if (!momProfile) return null;
                  return (
                    <div key={lnk.id} className="bg-white border border-gray-150 p-2.5 rounded-xl flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-700 truncate" title={momProfile.full_name}>{momProfile.full_name}</p>
                        <p className="text-[8px] text-gray-455 font-semibold truncate">{momProfile.email}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleLinkAction(lnk.id, 'approve')}
                          className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="Aceptar"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleLinkAction(lnk.id, 'reject')}
                          className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="Rechazar"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar niño por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-emerald-500"
            />
          </div>

          {/* Roster list */}
          <div className="space-y-2 overflow-y-auto max-h-[480px]">
            {babyProfiles.length > 0 ? (
              babyProfiles.map(p => {
                const isActive = p.baby.id === selectedBabyId;
                return (
                  <div
                    key={p.baby.id}
                    onClick={() => setSelectedBabyId(p.baby.id)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${isActive ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:border-emerald-200'}`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{p.baby.name}</h4>
                      <p className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-gray-400'} mt-0.5`}>
                        Madre: {p.motherProfile?.full_name}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                      {ageMonths} meses
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">No se encontraron niños vinculados.</p>
            )}
          </div>
        </div>

        {/* Selected Child Expediente Board */}
        {selectedBabyProfile ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Header profile info */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {selectedBabyProfile.baby.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-base">{selectedBabyProfile.baby.name}</h2>
                    <p className="text-[11px] text-gray-400">Madre: {selectedBabyProfile.motherProfile?.full_name} • Fecha Nacimiento: {selectedBabyProfile.baby.birth_date}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Control
                </button>
              </div>

              {/* Grid indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-gray-400 block">Edad Actual</span>
                  <span className="text-sm font-bold text-emerald-600">{ageMonths} meses</span>
                </div>
                <div className="border-x border-gray-50">
                  <span className="text-[10px] text-gray-400 block">Peso Nacimiento</span>
                  <span className="text-sm font-bold text-gray-700">{selectedBabyProfile.baby.birth_weight_grams ? `${selectedBabyProfile.baby.birth_weight_grams / 1000} kg` : '3.2 kg'}</span>
                </div>
                <div className="border-r border-gray-50">
                  <span className="text-[10px] text-gray-400 block">Talla Nacimiento</span>
                  <span className="text-sm font-bold text-gray-700">{selectedBabyProfile.baby.birth_height_cm ? `${selectedBabyProfile.baby.birth_height_cm} cm` : '50 cm'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Género</span>
                  <span className="text-xs font-bold text-gray-700">{selectedBabyProfile.baby.gender}</span>
                </div>
              </div>
            </div>

            {/* Growth history & Vaccine calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Growth tracking */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Curva de Crecimiento
                </h3>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {babyGrowth.map((g) => (
                    <div key={g.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-700 block">Mes {g.age_months}</span>
                        <span className="text-[10px] text-gray-400">{g.record_date}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">Peso: {g.weight_kg} kg <span className="text-[10px] text-gray-400 font-normal">(P-{g.weight_percentile})</span></p>
                        <p className="font-semibold text-gray-800">Talla: {g.height_cm} cm <span className="text-[10px] text-gray-400 font-normal">(P-{g.height_percentile})</span></p>
                      </div>
                    </div>
                  ))}
                  
                  {babyGrowth.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No hay registros de peso ni talla.</p>
                  )}
                </div>
              </div>

              {/* Vaccines applied registry */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-emerald-500" />
                  Control de Vacunación
                </h3>

                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {babyVaccines.map((bv) => {
                    const vaccine = db.vaccines.find(v => v.id === bv.vaccine_id);
                    if (!vaccine) return null;
                    return (
                      <div key={bv.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div>
                          <h4 className="text-xs font-bold text-gray-700">{vaccine.name}</h4>
                          <span className="text-[9px] text-gray-400 block">{vaccine.target_disease} • {vaccine.recommended_age_months}m</span>
                        </div>
                        <button
                          onClick={() => handleToggleVaccineStatus(bv.id)}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-xs transition-colors ${bv.status === 'applied' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        >
                          {bv.status === 'applied' ? 'Aplicada' : 'Marcar Aplicada'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Development milestones status */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Smile className="h-5 w-5 text-emerald-500" />
                Hitos del Desarrollo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {babyMilestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestoneStatus(m.id)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${m.status === 'achieved' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/50 border-gray-200 hover:border-emerald-200'}`}
                  >
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-700">{m.milestone_name}</h4>
                      <span className="text-[9px] text-gray-400">{m.category} • {m.target_age_months}m</span>
                    </div>
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${m.status === 'achieved' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'}`}>
                      {m.status === 'achieved' && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-3xl p-10 border border-gray-100 text-center italic text-xs text-gray-400 shadow-sm">
            Selecciona un niño del menú izquierdo para ver su expediente pediátrico.
          </div>
        )}
      </div>

      {/* NEW VISIT LOG MODAL */}
      {showVisitModal && selectedBabyProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-bold text-lg text-gray-800">Registrar Control de Crecimiento</h3>
              <p className="text-xs text-gray-400 mt-1">Bebé: <span className="font-bold text-emerald-600">{selectedBabyProfile.baby.name}</span></p>
            </div>
            <form onSubmit={handleAddPediatricVisit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Talla / Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">C. Cefálica (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={headCirc}
                    onChange={(e) => setHeadCirc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Desarrollo e Hitos de la visita</label>
                <input
                  type="text"
                  value={devStatus}
                  onChange={(e) => setDevStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas Adicionales</label>
                <textarea
                  placeholder="Observaciones generales sobre alimentación, sueño, deposiciones..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-20"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Indicaciones / Recomendaciones</label>
                <textarea
                  placeholder="ej. Suplementar Vitamina D, continuar lactancia exclusiva, próxima vacuna..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-20"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Registrar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
