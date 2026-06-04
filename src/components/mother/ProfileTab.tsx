'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, MOCK_MOTHER_ID, Mother, SupportTicket } from '@/lib/mockDb';
import { User, Phone, Calendar, Heart, ShieldAlert, CheckCircle2, CreditCard, Check, UploadCloud, MessageSquare, Send, X, Clock } from 'lucide-react';

export default function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePlan, setActivePlan] = useState<'free' | 'familiar' | 'premium'>('free');

  // Support Tickets states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Filter tickets for this user
  const userTickets = user ? db.support_tickets.filter(t => t.user_id === user.id) : [];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketSubject.trim() || !ticketDescription.trim()) return;

    const newTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      subject: ticketSubject,
      description: ticketDescription,
      status: 'open',
      created_at: new Date().toISOString(),
      replies: []
    };

    const updatedDb = {
      ...db,
      support_tickets: [newTicket, ...db.support_tickets]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setTicketSubject('');
    setTicketDescription('');
    setShowTicketSuccess(true);
    setTimeout(() => setShowTicketSuccess(false), 3000);
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    const newReply = {
      sender: user.full_name,
      content: replyText,
      created_at: new Date().toISOString()
    };

    const updatedTickets = db.support_tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          replies: [...t.replies, newReply]
        };
      }
      return t;
    });

    const updatedDb = {
      ...db,
      support_tickets: updatedTickets
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);

    const refreshedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
    if (refreshedTicket) {
      setSelectedTicket(refreshedTicket);
    }
    setReplyText('');
  };

  // Avatar upload/change simulator
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
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
            
            // Update user state and localStorage
            const updatedUser = { ...user, avatar_url: base64String };
            localStorage.setItem('pharmasync_user', JSON.stringify(updatedUser));
            
            // Update database profiles list
            const updatedDb = {
              ...db,
              profiles: db.profiles.map(p => p.id === user.id ? { ...p, avatar_url: base64String } : p)
            };
            setDb(updatedDb);
            saveMockDb(updatedDb);
            
            // Force refresh user in global auth context
            refreshUser();
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile forms
  const motherDetails = db.mothers.find(m => m.id === MOCK_MOTHER_ID) || {
    id: MOCK_MOTHER_ID,
    phone: '+54 9 11 5555-1234',
    birth_date: '1998-04-12',
    emergency_contact_name: 'Juan López (Esposo)',
    emergency_contact_phone: '+54 9 11 5555-9999',
    blood_type: 'O+',
    allergies: 'Penicilina'
  };

  const [phone, setPhone] = useState(motherDetails.phone);
  const [birthDate, setBirthDate] = useState(motherDetails.birth_date);
  const [emergencyName, setEmergencyName] = useState(motherDetails.emergency_contact_name);
  const [emergencyPhone, setEmergencyPhone] = useState(motherDetails.emergency_contact_phone);
  const [bloodType, setBloodType] = useState(motherDetails.blood_type);
  const [allergies, setAllergies] = useState(motherDetails.allergies || '');

  if (!user) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedMother: Mother = {
      id: MOCK_MOTHER_ID,
      phone,
      birth_date: birthDate,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      blood_type: bloodType,
      allergies
    };

    const updatedMothers = db.mothers.map(m => m.id === MOCK_MOTHER_ID ? updatedMother : m);
    const updatedDb = { ...db, mothers: updatedMothers };
    
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const motherPlans = [
    {
      id: 'free',
      name: 'Plan Free',
      price: 'RD$ 0',
      period: 'por siempre',
      desc: 'Adecuado para seguimiento básico de un único embarazo y bebé.',
      features: [
        '1 perfil de embarazo/bebé activo',
        'Recordatorios de vacunas básicos',
        'Visualización de recetas médicas'
      ]
    },
    {
      id: 'familiar',
      name: 'Plan Familiar',
      price: 'RD$ 299',
      period: 'al mes',
      desc: 'Ideal para familias con múltiples niños que necesitan mensajería directa.',
      features: [
        'Múltiples perfiles de niños',
        'Chat directo con Obstetras y Pediatras',
        'Alarmas y agenda médica compartida',
        'Guardado de estudios de laboratorio'
      ]
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      price: 'RD$ 599',
      period: 'al mes',
      desc: 'Acceso total a analíticas de crecimiento de tu bebé y asistencia inteligente.',
      features: [
        'Todo lo de Familiar',
        'Asesor de Inteligencia Artificial 24/7',
        'Exportación de expedientes a PDF',
        'Gráficos detallados de hitos y percentiles',
        'Alertas de salud tempranas'
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto select-none">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mi Ficha Médica</h2>
          <p className="text-xs text-gray-400 mt-1">Mantén actualizados tus datos clínicos para control y emergencias</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Foto de Perfil Upload Selector */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 select-none">
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
              <p className="text-[8px] text-gray-450 leading-none">Archivos PNG, JPG o WEBP (máx. 2MB)</p>
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold"
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
                  placeholder="ej. Ninguna, Penicilina, Látex"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-pink-500 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4 space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre Contacto</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Teléfono Contacto</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {showSuccess && (
            <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-3 rounded-2xl text-xs text-center flex items-center justify-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>Ficha actualizada exitosamente</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Guardar Cambios
          </button>
        </form>
      </div>

      {/* Mother Subscription Plans */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-pink-500 shrink-0" />
            Planes de Pago Mom & Baby (RD$)
          </h3>
          <p className="text-[10px] text-gray-400">Escoge un plan de acuerdo a los requerimientos de tu familia.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {motherPlans.map((plan) => {
            const isCurrent = activePlan === plan.id;
            return (
              <div 
                key={plan.id}
                onClick={() => setActivePlan(plan.id as any)}
                className={`border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all ${isCurrent ? 'border-pink-500 bg-pink-50/20 shadow-xs ring-1 ring-pink-500/10' : 'border-gray-150/80 hover:bg-slate-50'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{plan.name}</h4>
                    {isCurrent && (
                      <span className="bg-pink-500 text-white text-[7px] uppercase font-black px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-450 leading-relaxed max-w-md">{plan.desc}</p>
                  
                  {/* Features brief inline list */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-600 font-semibold pt-1">
                    {plan.features.slice(0, 2).map((feat, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-pink-500" /> {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 self-end sm:self-center shrink-0">
                  <span className="text-base font-black text-slate-850">{plan.price}</span>
                  <span className="text-[9px] text-gray-400 font-bold">{plan.period}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Center Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-pink-500 shrink-0" />
            Centro de Soporte Técnico y Ayuda
          </h3>
          <p className="text-[10px] text-gray-400">¿Tienes algún problema con el uso de la plataforma o tus recetas? Abre un ticket de soporte.</p>
        </div>

        {/* Create new ticket form */}
        <form onSubmit={handleCreateTicket} className="space-y-4 bg-slate-50 border border-gray-150 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Crear Nuevo Ticket</span>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Asunto / Problema</label>
              <input
                type="text"
                placeholder="Ej. Problema al ver la receta, Error en la firma..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Descripción del problema</label>
              <textarea
                placeholder="Describe el inconveniente en detalle para que nuestro equipo te ayude..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 h-20 font-medium"
                required
              />
            </div>
          </div>

          {showTicketSuccess && (
            <p className="text-[10px] text-emerald-650 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">Ticket enviado exitosamente. Un agente administrativo te responderá pronto.</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Enviar Ticket a Soporte
          </button>
        </form>

        {/* Existing tickets list */}
        <div className="space-y-3">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Mis Tickets Activos ({userTickets.length})</span>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {userTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-800">{ticket.subject}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {ticket.status === 'open' ? 'Abierto' : 'Resuelto'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 truncate max-w-sm">{ticket.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Ver Respuestas ({ticket.replies.length})
                </button>
              </div>
            ))}

            {userTickets.length === 0 && (
              <p className="text-[10px] text-gray-400 italic text-center py-4">No tienes tickets de soporte creados.</p>
            )}
          </div>
        </div>
      </div>

      {/* TICKET CHAT MODAL / DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs select-text text-left">
          <div className="w-full max-w-md bg-white h-screen shadow-2xl p-6 border-l border-gray-100 flex flex-col justify-between animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-md font-bold uppercase block w-max mb-1 ${selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    Caso N° {selectedTicket.id} ({selectedTicket.status === 'open' ? 'Abierto' : 'Resuelto'})
                  </span>
                  <h3 className="text-sm font-black text-slate-800">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat thread list */}
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-2 scrollbar-thin flex flex-col">
                <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl text-xs text-left">
                  <span className="font-bold text-gray-700 block">Tú (Creador)</span>
                  <p className="text-gray-500 font-medium mt-1 leading-relaxed">{selectedTicket.description}</p>
                  <span className="text-[8px] text-gray-400 block text-right mt-1">{new Date(selectedTicket.created_at).toLocaleString('es-ES')}</span>
                </div>

                {selectedTicket.replies.map((rep, idx) => {
                  const isAgent = rep.sender.includes('Soporte') || rep.sender.includes('Admin');
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl text-xs max-w-[85%] border text-left ${isAgent ? 'bg-sky-50 border-sky-100 self-start' : 'bg-pink-50/20 border-pink-100 self-end text-right'}`}
                    >
                      <span className="font-bold text-slate-800 block">{isAgent ? rep.sender : 'Tú'}</span>
                      <p className="text-gray-600 font-medium mt-1 leading-relaxed">{rep.content}</p>
                      <span className="text-[8px] text-gray-400 block mt-1">{new Date(rep.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User reply action */}
            {selectedTicket.status === 'open' ? (
              <form onSubmit={handleReplyTicket} className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe una respuesta para el soporte..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="h-10 w-10 bg-pink-500 hover:bg-pink-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-emerald-800 text-[10px] font-bold mt-4">
                Este caso ha sido cerrado y resuelto por soporte administrativo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
