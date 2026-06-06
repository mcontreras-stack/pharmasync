'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Doctor } from '@/lib/mockDb';
import { 
  Settings, 
  MapPin, 
  Clock, 
  Phone, 
  QrCode, 
  Copy, 
  Check, 
  UploadCloud,
  CreditCard,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import ProfessionalCredentialsForm from './ProfessionalCredentialsForm';
import BillingSubTab from './BillingSubTab';
import SupportTicketsSubTab from './SupportTicketsSubTab';

export default function DoctorSettingsTab() {
  const { user, refreshUser } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'consultorio' | 'credentials' | 'billing' | 'support'>('consultorio');

  // Find doctor details
  const doctor = user ? (db.doctors.find(d => d.id === user.id) || {
    id: user.id,
    license_number: 'N/A',
    specialty: 'obstetrician',
    phone: '',
    clinic_address: '',
    consultation_hours: '',
    verification_status: 'pending',
    exequatur: 'EQ-00000',
    invite_code: 'DR-XYZ-0000'
  } as Doctor) : {
    id: '',
    license_number: 'N/A',
    specialty: 'obstetrician',
    phone: '',
    clinic_address: '',
    consultation_hours: '',
    verification_status: 'pending',
    exequatur: 'EQ-00000',
    invite_code: 'DR-XYZ-0000'
  } as Doctor;

  const [clinicAddress, setClinicAddress] = useState(doctor.clinic_address || '');
  const [consultHours, setConsultHours] = useState(doctor.consultation_hours || '');
  const [clinicPhone, setClinicPhone] = useState(doctor.clinic_phone || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  if (!user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new globalThis.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150; canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 150, 150);
          const base64String = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(base64String);
          const updatedUser = { ...user, avatar_url: base64String };
          localStorage.setItem('vitarahealth_user', JSON.stringify(updatedUser));
          const updatedDb = { ...db, profiles: db.profiles.map(p => p.id === user.id ? { ...p, avatar_url: base64String } : p) };
          setDb(updatedDb);
          saveMockDb(updatedDb);
          refreshUser();
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCode = () => {
    if (doctor.invite_code) {
      navigator.clipboard.writeText(doctor.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const updatedDoctors = db.doctors.map(d => {
      if (d.id === user.id) {
        return {
          ...d,
          clinic_address: clinicAddress,
          consultation_hours: consultHours,
          clinic_phone: clinicPhone
        };
      }
      return d;
    });

    const updatedDb = { ...db, doctors: updatedDoctors };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setSuccessMsg('Configuración guardada correctamente.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 select-none">
      {/* Subtabs Navigation */}
      <div className="flex border-b border-gray-100 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('consultorio')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'consultorio' 
              ? 'border-pink-500 text-pink-600 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          Mi Consultorio
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'credentials' 
              ? 'border-pink-500 text-pink-600 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Credenciales Médicas
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'billing' 
              ? 'border-pink-500 text-pink-600 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Plan & Suscripción
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'support' 
              ? 'border-pink-500 text-pink-600 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Soporte Técnico
        </button>
      </div>

      {/* Render subtab based on activeTab */}
      {activeTab === 'consultorio' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor Invite Code card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 md:col-span-1 h-fit">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <QrCode className="h-4.5 w-4.5 text-pink-500 shrink-0" />
              Vínculo de Paciente
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Comparta este código con las madres para vincular el historial médico automáticamente a su consulta.
            </p>

            <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-center space-y-3">
              <span className="font-mono text-base font-extrabold text-slate-800 tracking-wider block">
                {doctor.invite_code}
              </span>
              
              <button
                onClick={handleCopyCode}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar Código
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col items-center">
              <div className="h-28 w-28 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center shadow-xs">
                <img 
                  src={`https://chart.googleapis.com/chart?cht=qr&chs=120x120&chl=${encodeURIComponent(doctor.invite_code || '')}`} 
                  alt="QR Code" 
                  className="h-full w-full"
                />
              </div>
              <span className="text-[8px] text-gray-400 font-semibold mt-2">Escáner rápido QR en consultorio</span>
            </div>
          </div>

          {/* Doctor Clinic Configuration Form */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 md:col-span-2">
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Configuración del Consultorio</h2>
              <p className="text-[10px] text-gray-400 mt-1">Configure la información física del centro médico que se reflejará en las recetas.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-150">
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-slate-50 border border-gray-250 flex items-center justify-center text-slate-500 font-bold shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl">{user?.full_name?.substring(0, 2).toUpperCase() || 'DR'}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Foto de Perfil Profesional</label>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold transition-colors">
                    <UploadCloud className="h-3.5 w-3.5" /> Cambiar Imagen
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Dirección de Consultorio</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="Ej. Clínica Corazones Unidos, Consultorio 201"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Horario de Atención</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      value={consultHours}
                      onChange={(e) => setConsultHours(e.target.value)}
                      placeholder="Ej. Lun a Vie 9:00 AM - 4:00 PM"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 max-w-sm">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="Ej. 809-555-4321"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
                  />
                </div>
              </div>

              {successMsg && (
                <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">{successMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Guardar Configuración
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'credentials' && <ProfessionalCredentialsForm />}
      {activeTab === 'billing' && <BillingSubTab />}
      {activeTab === 'support' && <SupportTicketsSubTab />}
    </div>
  );
}
