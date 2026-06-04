'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, getActivePregnancy, getBabies, getDoctorDetails, MOCK_MOTHER_ID, Pregnancy, Baby, Symptom, VitalSign, Appointment, BabyVaccine, DevelopmentMilestone } from '@/lib/mockDb';
import {
  Heart,
  Baby as BabyIcon,
  Calendar,
  ChevronRight,
  Plus,
  Activity,
  Smile,
  MessageSquare,
  Shield,
  FileText,
  User,
  PlusCircle,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function MotherDashboard() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [activeMode, setActiveMode] = useState<'pregnancy' | 'family'>(() => {
    const database = getMockDb();
    const hasActivePregnancy = database.pregnancies.some(p => p.mother_id === MOCK_MOTHER_ID && p.status === 'active');
    const hasBabies = database.babies.some(b => b.mother_id === MOCK_MOTHER_ID);
    if (!hasActivePregnancy && hasBabies) {
      return 'family';
    }
    return 'pregnancy';
  });
  
  // Modals / Input states
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [newSymptomName, setNewSymptomName] = useState('');
  const [newSymptomIntensity, setNewSymptomIntensity] = useState<'Bajo' | 'Medio' | 'Alto'>('Bajo');
  const [newSymptomNotes, setNewSymptomNotes] = useState('');

  const [showVitalModal, setShowVitalModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newSystolic, setNewSystolic] = useState('');
  const [newDiastolic, setNewDiastolic] = useState('');
  const [newHeartRate, setNewHeartRate] = useState('');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthName, setBirthName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [birthGender, setBirthGender] = useState('Masculino');

  if (!user) return null;

  const motherId = MOCK_MOTHER_ID;
  const activePregnancy = db.pregnancies.find(p => p.mother_id === motherId && p.status === 'active');
  const babies = db.babies.filter(b => b.mother_id === motherId);
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id || '');
  const selectedBaby = babies.find(b => b.id === selectedBabyId) || babies[0];

  // Dynamically find active/pending links for the obstetrician
  const obstetricianLink = (db.doctor_patient_links || []).find(lnk => 
    lnk.mother_id === motherId && 
    lnk.status !== 'inactive' && 
    (lnk.doctor_id === 'doctor-ana-456' || db.doctors.find(d => d.id === lnk.doctor_id)?.specialty === 'obstetrician')
  );

  const currentObstetrician = obstetricianLink && obstetricianLink.status === 'active'
    ? db.profiles.find(p => p.id === obstetricianLink.doctor_id)
    : null;

  // Dynamically find active/pending links for the pediatrician
  const pediatricianLink = (db.doctor_patient_links || []).find(lnk => 
    lnk.mother_id === motherId && 
    lnk.status !== 'inactive' && 
    (lnk.doctor_id === 'doctor-andres-789' || db.doctors.find(d => d.id === lnk.doctor_id)?.specialty === 'pediatrician')
  );

  const currentPediatrician = pediatricianLink && pediatricianLink.status === 'active'
    ? db.profiles.find(p => p.id === pediatricianLink.doctor_id)
    : null;

  // Calculate Gestational stats
  const lmp = activePregnancy ? new Date(activePregnancy.last_menstrual_period) : new Date();
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lmp.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(diffDays / 7);
  const totalRemainingDays = diffDays % 7;
  const progressPercent = Math.min(Math.round((totalWeeks / 40) * 100), 100);

  // Fruit comparison based on weeks
  const getFruitSize = (weeks: number) => {
    if (weeks < 8) return { name: 'Semilla de sésamo', icon: '🌱' };
    if (weeks < 12) return { name: 'Lenteja', icon: '🫘' };
    if (weeks < 16) return { name: 'Limón', icon: '🍋' };
    if (weeks < 20) return { name: 'Manzana', icon: '🍎' };
    if (weeks < 24) return { name: 'Coco', icon: '🥥' };
    if (weeks < 28) return { name: 'Coliflor', icon: '🥦' };
    if (weeks < 32) return { name: 'Berenjena', icon: '🍆' };
    if (weeks < 36) return { name: 'Melón', icon: '🍈' };
    return { name: 'Sandía', icon: '🍉' };
  };

  const fruit = getFruitSize(totalWeeks);

  // Actions
  const handleAddSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymptomName) return;

    const newSymptom: Symptom = {
      id: `sym-${Date.now()}`,
      mother_id: motherId,
      pregnancy_id: activePregnancy?.id,
      symptom_name: newSymptomName,
      intensity: newSymptomIntensity,
      logged_date: new Date().toISOString().split('T')[0],
      notes: newSymptomNotes
    };

    const updatedDb = {
      ...db,
      symptoms: [newSymptom, ...db.symptoms]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    
    // Reset states
    setNewSymptomName('');
    setNewSymptomIntensity('Bajo');
    setNewSymptomNotes('');
    setShowSymptomModal(false);
  };

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const newVital: VitalSign = {
      id: `vit-${Date.now()}`,
      mother_id: motherId,
      logged_date: new Date().toISOString().split('T')[0],
      weight_kg: newWeight ? parseFloat(newWeight) : undefined,
      systolic_bp: newSystolic ? parseInt(newSystolic) : undefined,
      diastolic_bp: newDiastolic ? parseInt(newDiastolic) : undefined,
      heart_rate_bpm: newHeartRate ? parseInt(newHeartRate) : undefined,
      temperature_c: 36.6
    };

    const updatedDb = {
      ...db,
      vital_signs: [newVital, ...db.vital_signs]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    setNewWeight('');
    setNewSystolic('');
    setNewDiastolic('');
    setNewHeartRate('');
    setShowVitalModal(false);
  };

  const handleLinkDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');

    if (!linkCode.trim()) return;

    if (user.status !== 'approved' && user.id !== MOCK_MOTHER_ID) {
      setLinkError('Debes completar la verificación de documentos antes de vincular médicos.');
      return;
    }

    const cleanCode = linkCode.toUpperCase().trim();
    
    // Find doctor in the mock registry
    const targetDoc = db.doctors.find(d => 
      (d.invite_code && d.invite_code.toUpperCase() === cleanCode) || 
      (d.id === 'doctor-ana-456' && cleanCode === 'OB-ANA-28') || 
      (d.id === 'doctor-andres-789' && cleanCode === 'PE-AND-04')
    );

    if (!targetDoc) {
      setLinkError('Código de invitación no encontrado. Por favor verifica con tu especialista.');
      return;
    }

    // Check if link already exists
    const exists = (db.doctor_patient_links || []).some(lnk => 
      lnk.doctor_id === targetDoc.id && 
      lnk.mother_id === motherId && 
      lnk.status !== 'inactive'
    );

    if (exists) {
      setLinkError('Ya posees una vinculación activa o pendiente con este especialista.');
      return;
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
    setLinkSuccess('¡Solicitud de vinculación enviada! El médico debe aceptarla en su portal.');
    setTimeout(() => {
      setShowLinkModal(false);
      setLinkCode('');
      setLinkSuccess('');
    }, 2000);
  };

  const handleRevokeLink = (linkId: string) => {
    const link = (db.doctor_patient_links || []).find(l => l.id === linkId);
    if (!link) return;

    const updatedLinks = db.doctor_patient_links.map(l => {
      if (l.id === linkId) return { ...l, status: 'inactive' as const };
      return l;
    });

    let updatedPregnancies = db.pregnancies;
    let updatedBabies = db.babies;

    const doctorDetails = db.doctors.find(d => d.id === link.doctor_id);
    if (doctorDetails?.specialty === 'obstetrician') {
      updatedPregnancies = db.pregnancies.map(p => {
        if (p.mother_id === motherId && p.obstetrician_id === link.doctor_id) {
          return { ...p, obstetrician_id: null };
        }
        return p;
      });
    } else {
      updatedBabies = db.babies.map(b => {
        if (b.mother_id === motherId && b.pediatrician_id === link.doctor_id) {
          return { ...b, pediatrician_id: null };
        }
        return b;
      });
    }

    // Add audit log
    const newAudit = {
      id: `log-${Date.now()}`,
      user_id: user.id,
      event: `Vínculo de médico revocado (ID Enlace: ${linkId}, Especialista ID: ${link.doctor_id})`,
      ip_address: '127.0.0.1',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      created_at: new Date().toISOString(),
      is_suspicious: false
    };

    const updatedDb = {
      ...db,
      doctor_patient_links: updatedLinks,
      pregnancies: updatedPregnancies,
      babies: updatedBabies,
      audit_logs: [newAudit, ...(db.audit_logs || [])]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleRegisterBirth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthName || !birthDate || !activePregnancy) return;

    const newBaby: Baby = {
      id: `baby-${Date.now()}`,
      mother_id: motherId,
      pregnancy_id: activePregnancy.id,
      name: birthName,
      birth_date: birthDate,
      birth_weight_grams: birthWeight ? parseInt(birthWeight) : undefined,
      birth_height_cm: birthHeight ? parseFloat(birthHeight) : undefined,
      gender: birthGender,
      pediatrician_id: null
    };

    // Close pregnancy
    const updatedPregnancies = db.pregnancies.map(p => {
      if (p.id === activePregnancy.id) {
        return { ...p, status: 'completed' as const };
      }
      return p;
    });

    // Create default vaccines for baby
    const babyVaccines: BabyVaccine[] = db.vaccines.map(v => ({
      id: `bvac-${Date.now()}-${v.id}`,
      baby_id: newBaby.id,
      vaccine_id: v.id,
      status: v.recommended_age_months === 0 ? 'applied' : 'pending',
      applied_date: v.recommended_age_months === 0 ? birthDate : undefined
    }));

    // Create default milestones
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
    
    // Reset states
    setBirthName('');
    setBirthDate('');
    setBirthWeight('');
    setBirthHeight('');
    setShowBirthModal(false);
    
    // Switch view to family
    setActiveMode('family');
  };

  const handleToggleVaccine = (vaccineId: string) => {
    const updatedVaccines = db.baby_vaccines.map(bv => {
      if (bv.id === vaccineId) {
        return {
          ...bv,
          status: (bv.status === 'applied' ? 'pending' : 'applied') as 'pending' | 'applied',
          applied_date: bv.status === 'applied' ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return bv;
    });
    const updatedDb = { ...db, baby_vaccines: updatedVaccines };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  const handleToggleMilestone = (milestoneId: string) => {
    const updatedMilestones = db.development_milestones.map(dm => {
      if (dm.id === milestoneId) {
        return {
          ...dm,
          status: (dm.status === 'achieved' ? 'pending' : 'achieved') as 'pending' | 'achieved',
          achieved_date: dm.status === 'achieved' ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return dm;
    });
    const updatedDb = { ...db, development_milestones: updatedMilestones };
    setDb(updatedDb);
    saveMockDb(updatedDb);
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
            {activeMode === 'pregnancy' 
              ? `Progreso de embarazo: Semana ${totalWeeks} + ${totalRemainingDays} días` 
              : 'Gestión y control de tus hijos'
            }
          </p>
        </div>

        {/* Toggle Pills */}
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

      {activeMode === 'pregnancy' ? (
        activePregnancy ? (
          /* PREGNANCY MODE */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left/Middle Column (Agestational countdown, indicators) */}
            <div className="md:col-span-2 space-y-6">
              {/* Pregnancy summary card */}
              <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-3xl p-6 border border-pink-100 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 bottom-2 text-8xl opacity-10">🤰</div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest bg-pink-100/50 px-2 py-0.5 rounded-md">
                      Trimester 3
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-800 mt-2">
                      Semana {totalWeeks} + {totalRemainingDays} días
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha probable de parto: <span className="font-semibold text-pink-600">{activePregnancy.estimated_due_date}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
                    <span>Progreso: {progressPercent}%</span>
                    <span>Quedan aprox. {Math.max(0, 280 - diffDays)} días</span>
                  </div>
                  <div className="w-full bg-pink-100 h-3.5 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-pink-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Fruit comparison */}
                <div className="mt-6 flex items-center gap-4 bg-white/70 backdrop-blur-sm p-3.5 rounded-2xl border border-pink-100/50">
                  <span className="text-4xl">{fruit.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tu bebé tiene el tamaño de una</h4>
                    <p className="text-lg font-bold text-pink-600">{fruit.name}</p>
                  </div>
                </div>
              </div>

              {/* Vital Signs Today */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-pink-500" />
                    Mis Indicadores (Hoy)
                  </h3>
                  <button 
                    onClick={() => setShowVitalModal(true)}
                    className="p-1 text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Weight */}
                  <div className="bg-pink-50/30 border border-pink-100/30 rounded-2xl p-4 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Peso</span>
                    <span className="text-xl font-bold text-gray-700">
                      {db.vital_signs[0]?.weight_kg ? `${db.vital_signs[0].weight_kg} kg` : '--'}
                    </span>
                    <span className="text-[10px] text-pink-500 block mt-1">+1.2 kg vs anterior</span>
                  </div>

                  {/* BP */}
                  <div className="bg-pink-50/30 border border-pink-100/30 rounded-2xl p-4 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Presión</span>
                    <span className="text-xl font-bold text-gray-700">
                      {db.vital_signs[0]?.systolic_bp ? `${db.vital_signs[0].systolic_bp}/${db.vital_signs[0].diastolic_bp}` : '110/70'}
                    </span>
                    <span className="text-[10px] text-emerald-500 block mt-1 font-semibold">Normal</span>
                  </div>

                  {/* Heart rate */}
                  <div className="bg-pink-50/30 border border-pink-100/30 rounded-2xl p-4 text-center">
                    <span className="text-xs text-gray-400 block mb-1">R. Cardíaco</span>
                    <span className="text-xl font-bold text-gray-700">
                      {db.vital_signs[0]?.heart_rate_bpm ? `${db.vital_signs[0].heart_rate_bpm} lpm` : '84 lpm'}
                    </span>
                    <span className="text-[10px] text-emerald-500 block mt-1 font-semibold">Normal</span>
                  </div>

                  {/* Fetal movement */}
                  <div className="bg-pink-50/30 border border-pink-100/30 rounded-2xl p-4 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Mov. Fetal</span>
                    <span className="text-xl font-bold text-gray-700">Activo</span>
                    <span className="text-[10px] text-pink-500 block mt-1">Registrado</span>
                  </div>
                </div>
              </div>

              {/* Symptoms log list */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Smile className="h-5 w-5 text-pink-500" />
                    Registro de Síntomas
                  </h3>
                  <button
                    onClick={() => setShowSymptomModal(true)}
                    className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir
                  </button>
                </div>

                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                  {db.symptoms.map((sym) => (
                    <div key={sym.id} className="py-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700">{sym.symptom_name}</h4>
                        <p className="text-[10px] text-gray-400">{sym.logged_date} {sym.notes ? `• ${sym.notes}` : ''}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${sym.intensity === 'Alto' ? 'bg-rose-100 text-rose-600' : sym.intensity === 'Medio' ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>
                        {sym.intensity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Appointments & Doctor Links) */}
            <div className="space-y-6">
              {/* Next appointment */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-500" />
                  Próxima Cita
                </h3>

                {db.appointments[0] ? (
                  <div className="bg-pink-50/20 border border-pink-100/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-pink-600 uppercase bg-pink-100/50 px-2 py-0.5 rounded-md">
                          Control Prenatal
                        </span>
                        <h4 className="text-sm font-bold text-gray-800 mt-2">
                          {db.appointments[0].reason}
                        </h4>
                      </div>
                      <div className="text-center bg-white p-2.5 rounded-xl border border-pink-100 shadow-xs">
                        <span className="text-[10px] text-pink-500 block uppercase font-bold">Jun</span>
                        <span className="text-lg font-black text-gray-700 block leading-none">22</span>
                      </div>
                    </div>
                    <div className="border-t border-pink-100/30 pt-2 text-xs text-gray-500 space-y-1">
                      <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-pink-400" /> Dra. Ana Rodríguez</p>
                      <p className="font-medium text-pink-600 pl-5">10:30 AM • Consultorio 4B</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No hay citas programadas.</p>
                )}
              </div>

              {/* Obstetrician connection info */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-pink-500" />
                  Obstetra Vinculado
                </h3>

                {currentObstetrician ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="h-10 w-10 bg-purple-100 text-purple-650 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {currentObstetrician.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 truncate">{currentObstetrician.full_name}</h4>
                      <p className="text-[9px] text-gray-450 font-semibold truncate">Lic. {db.doctors.find(d => d.id === currentObstetrician.id)?.license_number || 'MN'} • Obstetricia</p>
                    </div>
                    {obstetricianLink && (
                      <button 
                        onClick={() => handleRevokeLink(obstetricianLink.id)}
                        className="text-[9px] text-rose-500 font-extrabold bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2 py-1 rounded-lg transition-colors shrink-0"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                ) : obstetricianLink && obstetricianLink.status === 'pending' ? (
                  <div className="bg-slate-50 border border-gray-150 p-3.5 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-700 uppercase bg-amber-100/50 px-2 py-0.5 rounded-md">
                        Pendiente de Aceptación
                      </span>
                      <button 
                        onClick={() => handleRevokeLink(obstetricianLink.id)}
                        className="text-[9px] text-rose-500 font-extrabold hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">El especialista debe validar la solicitud.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">Vincula a tu obstetra para que pueda dar seguimiento a tu embarazo, cargar ecografías y escribir notas clínicas.</p>
                    <button 
                      onClick={() => setShowLinkModal(true)}
                      className="w-full text-center py-2 bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-pink-600 transition-colors"
                    >
                      Vincular Médico
                    </button>
                  </div>
                )}
              </div>

              {/* Advice of the Day */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
                <span className="text-xs uppercase font-extrabold tracking-widest opacity-80 block">Consejo del día</span>
                <p className="text-sm mt-3 font-medium leading-relaxed">
                  "Duerme de lado izquierdo. Mejora la circulación hacia la placenta y la entrega de oxígeno a tu bebé."
                </p>
                <div className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-10">💡</div>
              </div>

              {/* Graduation trigger: Registrar Nacimiento */}
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 text-center space-y-3">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">¡El gran día ha llegado!</h4>
                <p className="text-[11px] text-rose-600">Si tu bebé ya nació, puedes registrar su nacimiento para graduar tu embarazo y abrir su expediente pediátrico automáticamente.</p>
                <button
                  onClick={() => setShowBirthModal(true)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Registrar Nacimiento 🎉
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* NO ACTIVE PREGNANCY ACTIVE UI */
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <span className="text-5xl block">🤰</span>
            <h2 className="text-xl font-bold text-gray-800">No tienes un embarazo activo registrado</h2>
            <p className="text-xs text-gray-400">Comienza registrando tu embarazo actual para hacer seguimiento semana a semana, registrar síntomas e indicadores.</p>
            <button 
              onClick={() => {
                const newPregnancy: Pregnancy = {
                  id: `pregnancy-${Date.now()}`,
                  mother_id: motherId,
                  obstetrician_id: null,
                  status: 'active',
                  last_menstrual_period: new Date(Date.now() - 196 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 28 weeks ago
                  estimated_due_date: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  weeks_gestation_offset: 0
                };
                const updatedDb = { ...db, pregnancies: [...db.pregnancies, newPregnancy] };
                setDb(updatedDb);
                saveMockDb(updatedDb);
              }}
              className="px-6 py-2.5 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-colors shadow-sm"
            >
              Registrar Nuevo Embarazo
            </button>
          </div>
        )
      ) : (
        /* FAMILY MODE (MIS HIJOS) */
        babies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left/Middle Column (Baby stats, Vaccines list) */}
            <div className="md:col-span-2 space-y-6">
              {/* Baby selection / Profile */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                      {selectedBaby.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{selectedBaby.name}</h2>
                      <p className="text-xs text-gray-400">Nacido el {selectedBaby.birth_date} • {Math.floor((today.getTime() - new Date(selectedBaby.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.4))} meses de edad</p>
                    </div>
                  </div>

                  {/* Selector dropdown if multiple babies */}
                  {babies.length > 1 && (
                    <select
                      value={selectedBabyId}
                      onChange={(e) => setSelectedBabyId(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 font-medium"
                    >
                      {babies.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Birth details */}
                <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 block">Peso Nacimiento</span>
                    <span className="text-sm font-bold text-gray-700">{selectedBaby.birth_weight_grams ? `${selectedBaby.birth_weight_grams / 1000} kg` : '3.2 kg'}</span>
                  </div>
                  <div className="text-center border-x border-gray-50">
                    <span className="text-[10px] text-gray-400 block">Talla Nacimiento</span>
                    <span className="text-sm font-bold text-gray-700">{selectedBaby.birth_height_cm ? `${selectedBaby.birth_height_cm} cm` : '50 cm'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 block">Grupo Sanguíneo</span>
                    <span className="text-sm font-bold text-gray-700">{selectedBaby.blood_type || 'O+'}</span>
                  </div>
                </div>
              </div>

              {/* Vaccine registry */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-pink-500" />
                  Vacunas y Calendario
                </h3>

                <div className="divide-y divide-gray-50">
                  {db.baby_vaccines
                    .filter(bv => bv.baby_id === selectedBaby.id)
                    .map((bv) => {
                      const vaccine = db.vaccines.find(v => v.id === bv.vaccine_id);
                      if (!vaccine) return null;
                      return (
                        <div key={bv.id} className="py-3 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700">{vaccine.name}</h4>
                            <p className="text-[10px] text-gray-400">Dirigido a: {vaccine.target_disease} • Edad recomendada: {vaccine.recommended_age_months} meses</p>
                          </div>
                          <button
                            onClick={() => handleToggleVaccine(bv.id)}
                            className={`text-xs px-3 py-1 rounded-full font-bold shadow-xs transition-colors ${bv.status === 'applied' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                          >
                            {bv.status === 'applied' ? 'Aplicada ✓' : 'Pendiente'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Milestones registry */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Smile className="h-5 w-5 text-pink-500" />
                  Hitos del Desarrollo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {db.development_milestones
                    .filter(dm => dm.baby_id === selectedBaby.id)
                    .map((dm) => (
                      <div 
                        key={dm.id} 
                        onClick={() => handleToggleMilestone(dm.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${dm.status === 'achieved' ? 'bg-pink-50/30 border-pink-100/50' : 'bg-gray-50/50 border-gray-200/50 hover:border-pink-200'}`}
                      >
                        <span className="text-lg">{dm.category === 'Motor' ? '🏃' : dm.category === 'Social' ? '🤝' : dm.category === 'Lenguaje' ? '🗣️' : '🧠'}</span>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-gray-700 leading-tight">{dm.milestone_name}</h4>
                          <span className="text-[9px] text-gray-400 block mt-0.5">{dm.category} • Recomendado: {dm.target_age_months}m</span>
                        </div>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${dm.status === 'achieved' ? 'border-pink-500 bg-pink-500 text-white' : 'border-gray-300'}`}>
                          {dm.status === 'achieved' && <span className="text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column (Pediatrician Link & Growth metrics summary) */}
            <div className="space-y-6">
              {/* Pediatrician connection info */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-pink-500" />
                  Pediatra Vinculado
                </h3>

                {currentPediatrician ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-650 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {currentPediatrician.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 truncate">{currentPediatrician.full_name}</h4>
                      <p className="text-[9px] text-gray-450 font-semibold truncate">Lic. {db.doctors.find(d => d.id === currentPediatrician.id)?.license_number || 'MN'} • Pediatría</p>
                    </div>
                    {pediatricianLink && (
                      <button 
                        onClick={() => handleRevokeLink(pediatricianLink.id)}
                        className="text-[9px] text-rose-500 font-extrabold bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2 py-1 rounded-lg transition-colors shrink-0"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                ) : pediatricianLink && pediatricianLink.status === 'pending' ? (
                  <div className="bg-slate-50 border border-gray-150 p-3.5 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-700 uppercase bg-amber-100/50 px-2 py-0.5 rounded-md">
                        Pendiente de Aceptación
                      </span>
                      <button 
                        onClick={() => handleRevokeLink(pediatricianLink.id)}
                        className="text-[9px] text-rose-500 font-extrabold hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">El especialista debe validar la solicitud.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">Vincula a tu pediatra para enviarle el historial clínico del bebé, actualizar vacunas y registrar sus curvas de crecimiento.</p>
                    <button 
                      onClick={() => setShowLinkModal(true)}
                      className="w-full text-center py-2 bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-pink-600 transition-colors"
                    >
                      Vincular Pediatra
                    </button>
                  </div>
                )}
              </div>

              {/* Growth summary values */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-pink-500" />
                  Curva de Crecimiento
                </h3>

                <div className="bg-pink-50/20 border border-pink-100/50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Último Peso (4 meses):</span>
                    <span className="font-bold text-gray-700">6.8 kg (Percentil 45)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Última Talla:</span>
                    <span className="font-bold text-gray-700">64.0 cm (Percentil 50)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-pink-100/30 pt-2">
                    <span className="text-gray-500 font-medium">Próximo Control:</span>
                    <span className="font-bold text-pink-600">07 de Julio, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NO BABIES ACTIVE */
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <span className="text-5xl block">👶</span>
            <h2 className="text-xl font-bold text-gray-800">No tienes hijos registrados</h2>
            <p className="text-xs text-gray-400">Si tu embarazo ya finalizó, puedes registrar a tu bebé para dar inicio a su expediente clínico e historial de vacunas.</p>
            <button 
              onClick={() => setShowBirthModal(true)}
              className="px-6 py-2.5 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-colors shadow-sm"
            >
              Registrar Bebé
            </button>
          </div>
        )
      )}

      {/* SYMPTOM MODAL */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-lg text-gray-800">Registrar Síntoma</h3>
            <form onSubmit={handleAddSymptom} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre del síntoma</label>
                <input
                  type="text"
                  placeholder="ej. Náuseas, Dolor lumbar, Fatiga"
                  value={newSymptomName}
                  onChange={(e) => setNewSymptomName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Intensidad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Bajo', 'Medio', 'Alto'] as const).map(intensity => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => setNewSymptomIntensity(intensity)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 ${newSymptomIntensity === intensity ? 'bg-pink-500 text-white shadow-xs' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas adicionales (Opcional)</label>
                <textarea
                  placeholder="Escribe detalles sobre cómo te sientes..."
                  value={newSymptomNotes}
                  onChange={(e) => setNewSymptomNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VITALS MODAL */}
      {showVitalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-lg text-gray-800">Registrar Signos Vitales</h3>
            <form onSubmit={handleAddVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="68.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Frecuencia Cardiaca (lpm)</label>
                  <input
                    type="number"
                    placeholder="84"
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Sistólica (Sist.)</label>
                  <input
                    type="number"
                    placeholder="110"
                    value={newSystolic}
                    onChange={(e) => setNewSystolic(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Presión Diastólica (Diast.)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={newDiastolic}
                    onChange={(e) => setNewDiastolic(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVitalModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR LINKING INVITE MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-bold text-lg text-gray-800">Vincular con Médico</h3>
              <p className="text-xs text-gray-400 mt-1">Ingresa el código que te dio tu obstetra o pediatra para autorizar el acceso a tu expediente.</p>
            </div>
            <form onSubmit={handleLinkDoctor} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Código de vinculación / Invitación</label>
                <input
                  type="text"
                  placeholder="ej. OB-ANA-28 o PE-AND-04"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-center tracking-widest focus:outline-pink-500"
                  required
                />
              </div>

              {linkError && (
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-xs text-center border border-rose-100 flex items-center gap-1.5 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  <span>{linkError}</span>
                </div>
              )}

              {linkSuccess && (
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl text-xs text-center border border-emerald-100 flex items-center gap-1.5 justify-center">
                  <CheckCircle className="h-4 w-4" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BIRTH REGISTER MODAL */}
      {showBirthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="font-bold text-lg text-gray-800">Registrar Nacimiento</h3>
              <p className="text-xs text-gray-400 mt-1">Registra los datos de tu bebé. Esto creará su perfil y cerrará tu embarazo de forma oficial.</p>
            </div>
            <form onSubmit={handleRegisterBirth} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre del bebé</label>
                <input
                  type="text"
                  placeholder="ej. Mateo López"
                  value={birthName}
                  onChange={(e) => setBirthName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Género</label>
                  <select
                    value={birthGender}
                    onChange={(e) => setBirthGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso (gramos)</label>
                  <input
                    type="number"
                    placeholder="3250"
                    value={birthWeight}
                    onChange={(e) => setBirthWeight(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Talla / Altura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="50"
                    value={birthHeight}
                    onChange={(e) => setBirthHeight(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBirthModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Registrar Nacimiento 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
