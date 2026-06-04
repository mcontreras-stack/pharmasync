'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Profile, Pregnancy, PrenatalVisit, LabResult, UltrasoundResult, Appointment, MOCK_OBSTETRICIAN_ID } from '@/lib/mockDb';
import {
  User,
  Search,
  Calendar,
  Activity,
  Heart,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Image,
  Award,
  CheckCircle2,
  AlertCircle,
  Lock,
  Check,
  X
} from 'lucide-react';

export default function ObstetricianDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Patient states
  const [selectedMotherId, setSelectedMotherId] = useState<string>('mother-maria-123');
  const [showVisitModal, setShowVisitModal] = useState(false);

  // New Visit form states
  const [gestationalWeek, setGestationalWeek] = useState('28');
  const [weightKg, setWeightKg] = useState('68.5');
  const [bloodPressure, setBloodPressure] = useState('110/70');
  const [fetalHeartRate, setFetalHeartRate] = useState('140');
  const [visitNotes, setVisitNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  if (!user) return null;

  const doctor = db.doctors.find(d => d.id === user.id) || { exequatur: '', colegiatura: '' };
  
  // Blocker overlay if account is not approved
  if (user.status !== 'approved' && user.id !== MOCK_OBSTETRICIAN_ID) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-150 p-12 text-center max-w-xl mx-auto my-12 space-y-6 select-none shadow-sm">
        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-800">Verificación de Cuenta Requerida</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto font-medium">
            Tu perfil profesional se encuentra en estado <span className="font-extrabold text-amber-600">Revisión de Documentos</span>.
            Para prescribir recetas y acceder a expedientes clínicos, nuestro equipo administrativo interno debe validar tus credenciales sanitarias.
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

    let updatedPregnancies = db.pregnancies;
    if (action === 'approve') {
      // Find mother's active pregnancy and set obstetrician_id
      updatedPregnancies = db.pregnancies.map(p => {
        if (p.mother_id === link.mother_id && p.status === 'active') {
          return { ...p, obstetrician_id: user.id };
        }
        return p;
      });
    }

    // Add notification to Mother
    const motherProfile = db.profiles.find(p => p.id === link.mother_id);
    let updatedNotifications = db.notifications;
    if (motherProfile) {
      const newNot = {
        id: `not-${Date.now()}`,
        user_id: link.mother_id,
        title: action === 'approve' ? 'Vinculación de Obstetra Aceptada' : 'Vinculación de Obstetra Rechazada',
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
      pregnancies: updatedPregnancies,
      notifications: updatedNotifications
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Query connected patients (mothers linked to this doctor)
  const connectedMothers = db.mothers.filter(m => {
    // Mothers who have an active pregnancy linked to this obstetrician
    return db.pregnancies.some(p => p.mother_id === m.id && p.obstetrician_id === user.id);
  });

  const patientProfiles = connectedMothers.map(m => {
    const profile = db.profiles.find(p => p.id === m.id);
    const pregnancy = db.pregnancies.find(p => p.mother_id === m.id && p.status === 'active');
    return {
      mother: m,
      profile,
      pregnancy
    };
  }).filter(p => {
    if (!searchQuery) return true;
    return p.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Active highlighted patient data
  const selectedPatient = patientProfiles.find(p => p.mother.id === selectedMotherId) || patientProfiles[0];

  // Visit calculation details
  let pregnancyWeeks = 28;
  if (selectedPatient?.pregnancy) {
    const lmp = new Date(selectedPatient.pregnancy.last_menstrual_period);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lmp.getTime());
    pregnancyWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  // Related logs for the selected patient
  const patientVisits = selectedPatient 
    ? db.prenatal_visits
        .filter(v => v.pregnancy_id === selectedPatient.pregnancy?.id)
        .sort((a, b) => b.gestational_week - a.gestational_week)
    : [];

  const patientLabs = selectedPatient
    ? db.lab_results.filter(l => l.pregnancy_id === selectedPatient.pregnancy?.id)
    : [];

  const patientUltrasounds = selectedPatient
    ? db.ultrasound_results.filter(u => u.pregnancy_id === selectedPatient.pregnancy?.id)
    : [];

  const nextAppointment = selectedPatient
    ? db.appointments.find(a => a.mother_id === selectedPatient.mother.id && a.doctor_id === user.id && a.status === 'scheduled')
    : null;

  const handleAddPrenatalVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient?.pregnancy) return;

    const newVisit: PrenatalVisit = {
      id: `pvisit-${Date.now()}`,
      pregnancy_id: selectedPatient.pregnancy.id,
      visit_date: new Date().toISOString().split('T')[0],
      gestational_week: parseInt(gestationalWeek),
      mother_weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      blood_pressure: bloodPressure || undefined,
      fetal_heart_rate_bpm: fetalHeartRate ? parseInt(fetalHeartRate) : undefined,
      notes: visitNotes || undefined,
      recommendations: recommendations || undefined
    };

    // If there's an appointment, complete it
    const updatedAppointments = db.appointments.map(a => {
      if (a.mother_id === selectedPatient.mother.id && a.doctor_id === user.id && a.status === 'scheduled') {
        return { ...a, status: 'completed' as const };
      }
      return a;
    });

    const updatedDb = {
      ...db,
      prenatal_visits: [newVisit, ...db.prenatal_visits],
      appointments: updatedAppointments
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setShowVisitModal(false);

    // Reset forms
    setVisitNotes('');
    setRecommendations('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header card with doctor details & Invitation code */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡Hola, {user.full_name}! 👋</h1>
          <p className="text-xs text-gray-500 mt-1">Panel clínico de control obstétrico pre-natal</p>
        </div>

        {/* Invite code */}
        <div className="bg-purple-50 border border-purple-200/50 rounded-2xl p-3 flex items-center gap-3">
          <div>
            <span className="text-[9px] font-bold text-purple-500 uppercase block tracking-wider">Código de Invitación</span>
            <span className="text-sm font-black text-purple-700 tracking-widest font-mono">OB-ANA-28</span>
          </div>
          <span className="text-[10px] text-purple-600 bg-white/70 px-2 py-1 rounded-lg font-semibold max-w-[120px] leading-tight">
            Compártelo con tus pacientes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients Board Roster */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2">
            <User className="h-5 w-5 text-purple-500" />
            Mis Pacientes ({patientProfiles.length})
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
                        <p className="text-[8px] text-gray-450 font-semibold truncate">{momProfile.email}</p>
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
              placeholder="Buscar paciente por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-purple-500"
            />
          </div>

          {/* Roster lists */}
          <div className="space-y-2 overflow-y-auto max-h-[480px]">
            {patientProfiles.length > 0 ? (
              patientProfiles.map(p => {
                const isActive = p.mother.id === selectedMotherId;
                return (
                  <div
                    key={p.mother.id}
                    onClick={() => setSelectedMotherId(p.mother.id)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${isActive ? 'bg-purple-500 text-white border-purple-500 shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:border-purple-200'}`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{p.profile?.full_name}</h4>
                      <p className={`text-[10px] ${isActive ? 'text-purple-100' : 'text-gray-400'} mt-0.5`}>
                        FPP: {p.pregnancy?.estimated_due_date}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>
                      Semana {pregnancyWeeks}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">No se encontraron pacientes vinculados.</p>
            )}
          </div>
        </div>

        {/* Selected Patient File Board */}
        {selectedPatient ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {selectedPatient.profile?.full_name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-base">{selectedPatient.profile?.full_name}</h2>
                    <p className="text-[11px] text-gray-400">Tel: {selectedPatient.mother.phone} • Sangre: {selectedPatient.mother.blood_type} • Alergias: {selectedPatient.mother.allergies || 'Ninguna'}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Consulta
                </button>
              </div>

              {/* Grid indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-gray-400 block">Semanas de Gestación</span>
                  <span className="text-sm font-bold text-purple-600">Semana {pregnancyWeeks}</span>
                </div>
                <div className="border-x border-gray-50">
                  <span className="text-[10px] text-gray-400 block">Fecha Última Regla</span>
                  <span className="text-sm font-bold text-gray-700">{selectedPatient.pregnancy?.last_menstrual_period}</span>
                </div>
                <div className="border-r border-gray-50">
                  <span className="text-[10px] text-gray-400 block">Edad de la Madre</span>
                  <span className="text-sm font-bold text-gray-700">28 años</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Riesgo Embarazo</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Bajo</span>
                </div>
              </div>
            </div>

            {/* Labs, Ultrasounds, and Timeline logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinical Timeline & visits history */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Historial de Controles prenatales
                </h3>

                <div className="relative border-l border-purple-100 pl-4 ml-2 space-y-5 max-h-72 overflow-y-auto pt-2">
                  {patientVisits.map((visit) => (
                    <div key={visit.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 bg-purple-500 border-2 border-white rounded-full"></span>
                      <div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-purple-600">Semana {visit.gestational_week}</span>
                          <span className="text-[10px] text-gray-400">{visit.visit_date}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 font-medium leading-relaxed">
                          Peso: {visit.mother_weight_kg}kg • Presión: {visit.blood_pressure} • FCF: {visit.fetal_heart_rate_bpm} bpm
                        </p>
                        {visit.notes && <p className="text-[10px] text-gray-400 mt-0.5 italic">" {visit.notes} "</p>}
                      </div>
                    </div>
                  ))}
                  
                  {patientVisits.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No hay visitas prenatales registradas aún.</p>
                  )}
                </div>
              </div>

              {/* Lab & Ultrasound results */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Estudios y Ecografías
                </h3>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {/* Ecografías */}
                  {patientUltrasounds.map((u) => (
                    <div key={u.id} className="bg-purple-50/20 border border-purple-100/50 p-3 rounded-2xl flex items-start gap-3">
                      <Image className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-700">Ecografía Semana {u.gestational_week}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{u.findings}</p>
                        <span className="text-[9px] text-gray-400 mt-1 block">Subida el {u.scan_date}</span>
                      </div>
                    </div>
                  ))}

                  {/* Laboratorios */}
                  {patientLabs.map((l) => (
                    <div key={l.id} className="bg-gray-50 p-3 rounded-2xl flex items-start gap-3 border border-gray-100">
                      <FileText className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-700">{l.test_name}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{l.result_summary}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-bold ${l.is_normal ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1.5 py-0.25 rounded-md`}>
                            {l.is_normal ? 'Normal' : 'Observación'}
                          </span>
                          <span className="text-[9px] text-gray-400">Fecha: {l.test_date}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {patientUltrasounds.length === 0 && patientLabs.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No hay reportes de laboratorio ni ecografías registradas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-3xl p-10 border border-gray-100 text-center italic text-xs text-gray-400 shadow-sm">
            Selecciona una paciente del menú izquierdo para ver su expediente obstétrico.
          </div>
        )}
      </div>

      {/* NEW VISIT LOG MODAL */}
      {showVisitModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-bold text-lg text-gray-800">Registrar Consulta Prenatal</h3>
              <p className="text-xs text-gray-400 mt-1">Paciente: <span className="font-bold text-purple-600">{selectedPatient.profile?.full_name}</span></p>
            </div>
            <form onSubmit={handleAddPrenatalVisit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Semana Gestacional</label>
                  <input
                    type="number"
                    value={gestationalWeek}
                    onChange={(e) => setGestationalWeek(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso de la Madre (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Arterial</label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Frecuencia Cardiaca Fetal (bpm)</label>
                  <input
                    type="number"
                    value={fetalHeartRate}
                    onChange={(e) => setFetalHeartRate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas Clínicas</label>
                <textarea
                  placeholder="Escribe observaciones clínicas sobre el útero, movimientos, estado de salud..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-20"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Recomendaciones para la Madre</label>
                <textarea
                  placeholder="ej. Dieta hiposódica, descanso reposo de lado, suplemento de hierro..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-purple-500 h-20"
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
                  className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold"
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
