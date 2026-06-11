'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import { getMotherRecord, saveMotherRecord } from '@/services/motherService';
import {
  User, Phone, Calendar, Heart, ShieldAlert, CheckCircle2, UploadCloud, CreditCard, MessageSquare
} from 'lucide-react';
import BillingSubTab from '../dashboard/BillingSubTab';
import SupportTicketsSubTab from '../dashboard/SupportTicketsSubTab';

export default function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'support'>('profile');

  // Los campos inician en blanco; se llenan con lo que la usuaria haya guardado
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  const motherId = user?.id || '';

  useEffect(() => {
    if (!motherId) return;
    getMotherRecord(motherId).then(record => {
      if (!record) return;
      setPhone(record.phone || '');
      setBirthDate(record.birth_date || '');
      setEmergencyName(record.emergency_contact_name || '');
      setEmergencyPhone(record.emergency_contact_phone || '');
      setBloodType(record.blood_type || '');
      setAllergies(record.allergies || '');
    }).catch(err => console.error('[ProfileTab] Error cargando ficha:', err));
  }, [motherId]);

  if (!user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new globalThis.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 150;
          canvas.height = 150;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 150, 150);
            const base64String = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarPreview(base64String);
            
            const updatedUser = { ...user, avatar_url: base64String };
            localStorage.setItem('vitarahealth_user', JSON.stringify(updatedUser));

            const db = getMockDb();
            db.profiles = db.profiles.map(p => p.id === user.id ? { ...p, avatar_url: base64String } : p);
            saveMockDb(db);
            refreshUser();
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await saveMotherRecord(motherId, {
        phone,
        birth_date: birthDate,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        blood_type: bloodType,
        allergies,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar la ficha.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10 select-none text-left">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100 gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-pink-500 text-pink-650 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-4 w-4" />
          Ficha Médica
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'billing' 
              ? 'border-pink-500 text-pink-650 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Planes SaaS
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeTab === 'support' 
              ? 'border-pink-500 text-pink-650 bg-pink-50/20' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Soporte Técnico
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mi Ficha Médica</h2>
            <p className="text-xs text-gray-400 mt-1">Mantén actualizados tus datos clínicos para control y emergencias</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 font-bold shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">{user.full_name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Foto de Perfil</label>
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold transition-colors">
                  <UploadCloud className="h-3.5 w-3.5" /> Cambiar Imagen
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Teléfono Celular</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha de Nacimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Grupo Sanguíneo</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Alergias Conocidas</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="ej. Penicilina, Látex..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-4">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-gray-400">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre Contacto</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Teléfono Contacto</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>

            {showSuccess && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 rounded-2xl text-xs text-center flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span>Ficha médica actualizada exitosamente</span>
              </div>
            )}

            {saveError && (
              <div className="bg-rose-50 text-rose-600 border border-rose-100 p-3 rounded-2xl text-xs text-center font-bold">
                {saveError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {activeTab === 'billing' && <BillingSubTab />}
      {activeTab === 'support' && <SupportTicketsSubTab />}
    </div>
  );
}
