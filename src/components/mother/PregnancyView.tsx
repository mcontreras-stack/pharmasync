'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Calendar, Activity, Smile, Shield, PlusCircle, Plus, FileText, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Pregnancy, Symptom, VitalSign, Appointment } from '@/lib/mockDb';
import { getSymptoms, addSymptom, getVitals, addVital } from '@/services/motherService';
import { getLinksForMother, PatientLink } from '@/services/linkService';
import { getAppointmentsFor } from '@/services/appointmentService';
import SymptomModal from './SymptomModal';
import VitalsModal from './VitalsModal';
import LinkDoctorModal from './LinkDoctorModal';
import BirthRegisterModal from './BirthRegisterModal';
import AntecedentesViewer from './AntecedentesViewer';
import AntecedentesForm from './AntecedentesForm';

interface PregnancyViewProps {
  activePregnancy: Pregnancy;
  onGraduation: (name: string, date: string, gender: string, weight?: number, height?: number) => void;
  onLinkDoctor: (code: string) => Promise<{ success: boolean; message: string }>;
  onRevokeLink: (linkId: string) => void;
}

export default function PregnancyView({ activePregnancy, onGraduation, onLinkDoctor, onRevokeLink }: PregnancyViewProps) {
  const { user } = useAuth();

  // Modals visibility
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [birthOpen, setBirthOpen] = useState(false);
  const [antecedentesOpen, setAntecedentesOpen] = useState(false);
  const [antecedentesEditOpen, setAntecedentesEditOpen] = useState(false);

  const motherId = user?.id || activePregnancy.mother_id;

  // Datos clínicos (demo, Supabase o PostgreSQL según configuración)
  const [mySymptoms, setMySymptoms] = useState<Symptom[]>([]);
  const [myVitals, setMyVitals] = useState<VitalSign[]>([]);
  const [myLinks, setMyLinks] = useState<PatientLink[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  const loadClinicalData = useCallback(async () => {
    try {
      const [symptoms, vitals, links, appointments] = await Promise.all([
        getSymptoms(motherId, activePregnancy.id),
        getVitals(motherId, activePregnancy.id),
        getLinksForMother(motherId),
        getAppointmentsFor({ id: motherId, role: 'mother' }),
      ]);
      setMySymptoms(symptoms);
      setMyVitals(vitals);
      setMyLinks(links);
      setMyAppointments(appointments.filter(a => a.status !== 'cancelled'));
    } catch (err) {
      console.error('[PregnancyView] Error cargando datos clínicos:', err);
    }
  }, [motherId, activePregnancy.id]);

  useEffect(() => {
    const t = setTimeout(() => { loadClinicalData(); }, 0);
    return () => clearTimeout(t);
  }, [loadClinicalData]);

  // Obstetrician details
  const obstetricianLink = myLinks.find(l => l.specialty === 'obstetrician' && l.status !== 'inactive');
  const currentObstetrician = obstetricianLink && obstetricianLink.status === 'active' ? obstetricianLink : null;

  // Weeks gestation logic
  const lmp = new Date(activePregnancy.last_menstrual_period);
  const diffDays = Math.ceil(Math.abs(new Date().getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(diffDays / 7);
  const totalRemainingDays = diffDays % 7;
  const progressPercent = Math.min(Math.round((totalWeeks / 40) * 100), 100);

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
  const trimester = totalWeeks < 14 ? 'Primer Trimestre' : totalWeeks < 28 ? 'Segundo Trimestre' : 'Tercer Trimestre';

  // En blanco si aún no registra nada
  const latestVitals = myVitals[0];
  const nextAppointment = myAppointments[0];
  const nextApptDate = nextAppointment ? new Date(nextAppointment.appointment_date) : null;
  const nextApptDoctorName = nextAppointment
    ? ((nextAppointment as Appointment & { doctor_name?: string }).doctor_name
        || myLinks.find(l => l.doctor_id === nextAppointment.doctor_id)?.doctor_name
        || 'Especialista')
    : '';

  const handleLink = async (code: string) => {
    const result = await onLinkDoctor(code);
    if (result.success) await loadClinicalData();
    return result;
  };

  const handleRevoke = async (linkId: string) => {
    await onRevokeLink(linkId);
    await loadClinicalData();
  };

  const handleSaveSymptom = async (name: string, intensity: 'Bajo' | 'Medio' | 'Alto', notes: string) => {
    try {
      const symptom = await addSymptom(motherId, {
        pregnancy_id: activePregnancy.id,
        symptom_name: name,
        intensity,
        notes,
      });
      setMySymptoms(prev => [symptom, ...prev]);
    } catch (err) {
      console.error('[PregnancyView] Error guardando síntoma:', err);
    }
    setSymptomOpen(false);
  };

  const handleSaveVitals = async (weight?: number, systolic?: number, diastolic?: number, heartRate?: number) => {
    try {
      const vital = await addVital(motherId, {
        weight_kg: weight,
        systolic_bp: systolic,
        diastolic_bp: diastolic,
        heart_rate_bpm: heartRate,
        temperature_c: 36.6,
      });
      setMyVitals(prev => [vital, ...prev]);
    } catch (err) {
      console.error('[PregnancyView] Error guardando signos vitales:', err);
    }
    setVitalsOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none text-left">
      <div className="md:col-span-2 space-y-6">
        {/* Pregnancy progress */}
        <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-3xl p-6 border border-pink-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 bottom-2 text-8xl opacity-10">🤰</div>
          <div>
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-100/50 px-2 py-0.5 rounded-md">{trimester}</span>
            <h2 className="text-2xl font-black text-slate-800 mt-2">Semana {totalWeeks} + {totalRemainingDays} días</h2>
            <p className="text-xs text-gray-500 mt-1">FPP probable: <span className="font-bold text-pink-600">{activePregnancy.estimated_due_date}</span></p>
          </div>
          
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
              <span>Progreso: {progressPercent}%</span>
              <span>Quedan aprox. {Math.max(0, 280 - diffDays)} días</span>
            </div>
            <div className="w-full bg-pink-100 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-pink-400 to-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-pink-100/40">
            <span className="text-4xl">{fruit.icon}</span>
            <div>
              <h4 className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Tu bebé tiene el tamaño de una</h4>
              <p className="text-base font-black text-pink-600">{fruit.name}</p>
            </div>
          </div>
        </div>

        {/* Clinical History Section (Phase 1) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Expediente Clínico Maternal (Antecedentes)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setAntecedentesEditOpen(true)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-all cursor-pointer"
                title="Editar Antecedentes"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setAntecedentesOpen(!antecedentesOpen)}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
              >
                {antecedentesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {antecedentesOpen ? (
            <AntecedentesViewer patientId={motherId} />
          ) : (
            <p className="text-[10px] text-gray-400 font-semibold italic">Presione la flecha para desplegar sus antecedentes personales, familiares y gineco-obstétricos.</p>
          )}
        </div>

        {/* Vital Signs today */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-pink-500" />
              Mis Indicadores (Hoy)
            </h3>
            <button onClick={() => setVitalsOpen(true)} className="p-1 text-pink-500 hover:bg-pink-50 rounded-full cursor-pointer">
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-pink-50/20 border border-pink-100/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">Peso</span>
              <span className="text-base font-black text-slate-700">{latestVitals?.weight_kg ? `${latestVitals.weight_kg} kg` : '--'}</span>
            </div>
            <div className="bg-pink-50/20 border border-pink-100/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">Presión</span>
              <span className="text-base font-black text-slate-700">
                {latestVitals?.systolic_bp ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` : '--'}
              </span>
            </div>
            <div className="bg-pink-50/20 border border-pink-100/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">R. Cardíaco</span>
              <span className="text-base font-black text-slate-700">{latestVitals?.heart_rate_bpm ? `${latestVitals.heart_rate_bpm} lpm` : '--'}</span>
            </div>
            <div className="bg-pink-50/20 border border-pink-100/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">Mov. Fetal</span>
              <span className="text-base font-black text-slate-700">{latestVitals ? 'Activo' : '--'}</span>
            </div>
          </div>
        </div>

        {/* Symptoms tracker */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Smile className="h-5 w-5 text-pink-500" />
              Registro de Síntomas
            </h3>
            <button onClick={() => setSymptomOpen(true)} className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors font-semibold cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Añadir
            </button>
          </div>

          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
            {mySymptoms.length === 0 && (
              <p className="text-xs text-gray-400 italic py-2">Aún no has registrado síntomas.</p>
            )}
            {mySymptoms.map(sym => (
              <div key={sym.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-700">{sym.symptom_name}</h4>
                  <p className="text-[9px] text-gray-400 font-semibold">{sym.logged_date} {sym.notes ? `• ${sym.notes}` : ''}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                  sym.intensity === 'Alto' ? 'bg-rose-100 text-rose-700' : sym.intensity === 'Medio' ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'
                }`}>{sym.intensity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Next appointment */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-500" /> Próxima Cita
          </h3>
          {nextAppointment && nextApptDate ? (
            <div className="bg-pink-50/10 border border-pink-100/50 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black text-pink-600 uppercase bg-pink-100/40 px-2 py-0.5 rounded">Control Prenatal</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-2">{nextAppointment.reason}</h4>
                </div>
                <div className="text-center bg-white p-2 border border-pink-100/50 rounded-xl shadow-xs shrink-0">
                  <span className="text-[8px] text-pink-500 block uppercase font-black">
                    {nextApptDate.toLocaleDateString('es', { month: 'short' })}
                  </span>
                  <span className="text-base font-black text-slate-700 block leading-none">{nextApptDate.getDate()}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-medium border-t border-gray-100/50 pt-2">
                {nextApptDoctorName} • {nextApptDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No hay citas programadas.</p>
          )}
        </div>

        {/* Doctor obstetrician details */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-pink-500" /> Obstetra Vinculado
          </h3>
          {currentObstetrician ? (
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-gray-150 p-3 rounded-2xl text-xs">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{currentObstetrician.doctor_name}</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate">Lic: {currentObstetrician.license_number || '--'}</p>
              </div>
              <button onClick={() => handleRevoke(obstetricianLink!.id)} className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-xl border border-rose-100 shrink-0 cursor-pointer">Revocar</button>
            </div>
          ) : obstetricianLink && obstetricianLink.status === 'pending' ? (
            <div className="bg-slate-50 border border-gray-150 p-3 rounded-2xl text-xs flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Pendiente</span>
              <button onClick={() => handleRevoke(obstetricianLink.id)} className="text-[9px] font-bold text-rose-500 cursor-pointer">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setLinkOpen(true)} className="w-full py-2 bg-pink-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer">Vincular Médico</button>
          )}
        </div>

        {/* Childbirth graduation box */}
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 text-center space-y-2">
          <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider">¿Ya nació tu bebé?</h4>
          <p className="text-[10px] text-rose-600 font-medium">Registra el parto de forma oficial para graduar tu embarazo y abrir su expediente de neonato.</p>
          <button onClick={() => setBirthOpen(true)} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer">Registrar Nacimiento 🎉</button>
        </div>
      </div>

      {/* Modals Mounting */}
      <SymptomModal isOpen={symptomOpen} onClose={() => setSymptomOpen(false)} onSave={handleSaveSymptom} />
      <VitalsModal isOpen={vitalsOpen} onClose={() => setVitalsOpen(false)} onSave={handleSaveVitals} />
      <LinkDoctorModal isOpen={linkOpen} onClose={() => setLinkOpen(false)} onLink={handleLink} />
      <BirthRegisterModal isOpen={birthOpen} onClose={() => setBirthOpen(false)} onRegister={onGraduation} />

      {/* Antecedentes Form Modal */}
      {antecedentesEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="font-bold text-sm text-gray-800">Actualizar Antecedentes Clínicos</h3>
              <button onClick={() => setAntecedentesEditOpen(false)} className="p-1 hover:bg-gray-150 rounded-lg text-gray-400 cursor-pointer">✕</button>
            </div>
            <AntecedentesForm patientId={motherId} onSuccess={() => setAntecedentesEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
