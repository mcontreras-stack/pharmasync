'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Doctor, SupportTicket } from '@/lib/mockDb';
import { 
  Settings, 
  MapPin, 
  Clock, 
  Phone, 
  QrCode, 
  Copy, 
  Check, 
  Signature, 
  CreditCard, 
  ShieldCheck, 
  UploadCloud, 
  Trash2,
  FileCheck,
  MessageSquare,
  Send,
  X
} from 'lucide-react';

export default function DoctorSettingsTab() {
  const { user, refreshUser } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activePlan, setActivePlan] = useState<'free' | 'professional' | 'clinic'>('free');

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

  // Find doctor details
  const doctor = db.doctors.find(d => d.id === user?.id) || {
    id: user?.id || '',
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
  
  // Simulated files
  const [signatureName, setSignatureName] = useState(doctor.signature_url ? 'firma_digital.png' : '');
  const [stampName, setStampName] = useState(doctor.stamp_url ? 'sello_medico.png' : '');

  // Subscriptions pricing tiers for Doctors
  const doctorPlans = [
    {
      id: 'free',
      name: 'Free Profesional',
      price: 'RD$ 0',
      period: 'por siempre',
      desc: 'Adecuado para prácticas médicas iniciales y pruebas de funcionalidad.',
      features: [
        'Hasta 10 expedientes de pacientes',
        'Agenda de citas básica',
        'Recetas electrónicas sin firma gráfica',
        'Acceso a chat limitado'
      ]
    },
    {
      id: 'professional',
      name: 'Profesional Médico',
      price: 'RD$ 1,999',
      period: 'al mes',
      desc: 'Para especialistas independientes que requieren recetas impresas ilimitadas.',
      features: [
        'Pacientes y expedientes ilimitados',
        'Recetas con firma y sello digitalizados',
        'Impresión en formato oficial SNS',
        'Chat y alertas ilimitadas',
        'Soporte técnico prioritario'
      ]
    },
    {
      id: 'clinic',
      name: 'Red de Clínicas',
      price: 'RD$ 6,999',
      period: 'al mes',
      desc: 'Para redes de consultorios y clínicas con múltiples médicos y asistentes.',
      features: [
        'Todo lo de Profesional',
        'Múltiples sucursales y consultorios',
        'Perfiles para secretarias / asistentes',
        'Reportes de facturación consolidados',
        'API de integración de farmacias'
      ]
    }
  ];

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
      if (d.id === user?.id) {
        return {
          ...d,
          clinic_address: clinicAddress,
          consultation_hours: consultHours,
          clinic_phone: clinicPhone,
          signature_url: signatureName ? 'https://pharmasync-demo.s3.amazonaws.com/signatures/doctor-sig.png' : undefined,
          stamp_url: stampName ? 'https://pharmasync-demo.s3.amazonaws.com/stamps/doctor-stamp.png' : undefined
        };
      }
      return d;
    });

    const updatedDb = {
      ...db,
      doctors: updatedDoctors
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setSuccessMsg('Configuración guardada correctamente.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFileUpload = (type: 'signature' | 'stamp', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'signature') {
        setSignatureName(file.name);
      } else {
        setStampName(file.name);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Doctor Invite Code card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 md:col-span-1 h-fit">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <QrCode className="h-4.5 w-4.5 text-pink-500 shrink-0" />
            Código de Vinculación
          </h3>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Comparte este código único con las madres. Al ingresarlo en su app, se vinculará su expediente clínico contigo.
          </p>

          <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-center space-y-3">
            <span className="font-mono text-base font-extrabold text-slate-800 tracking-wider block">{doctor.invite_code || 'DR-ROD-9102'}</span>
            
            <button
              onClick={handleCopyCode}
              className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
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
            {/* Mock QR */}
            <div className="h-28 w-28 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center shadow-xs">
              <div className="bg-slate-100 h-full w-full rounded flex items-center justify-center font-mono text-[9px] text-gray-400 font-bold border border-dashed border-gray-300">
                [Código QR Demo]
              </div>
            </div>
            <span className="text-[8px] text-gray-400 font-semibold mt-2">Escáner rápido desde consultorio</span>
          </div>
        </div>

        {/* Doctor Clinic Configuration Form */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 md:col-span-2">
          <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Configuración del Consultorio</h2>
            <p className="text-[10px] text-gray-400 mt-1">Habilita tus firmas y direcciones físicas para emisión de recetas médicas oficiales.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Foto de Perfil Upload Selector */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-150 select-none">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-slate-50 border border-gray-250 flex items-center justify-center text-slate-500 font-bold shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">{user?.full_name?.substring(0, 2).toUpperCase() || 'DR'}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Foto de Perfil Especialista</label>
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold transition-colors">
                  <UploadCloud className="h-3.5 w-3.5" /> Cambiar Foto de Perfil
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
                <p className="text-[8px] text-gray-450 leading-none">Archivos PNG, JPG o WEBP (máx. 2MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Dirección Física de Consulta</label>
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Horario de Consultas</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Teléfono de Citas del Consultorio</label>
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
            </div>

            {/* Signature & Stamp Upload Simulator */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activos Clínicos de Emisión</h4>
              <p className="text-[9px] text-gray-450 leading-normal">
                Suba una imagen PNG con fondo transparente de su firma manuscrita y su sello profesional. Se incrustarán automáticamente en las recetas imprimibles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Signature file upload */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-700">Firma Digitalizada</span>
                    <Signature className="h-4 w-4 text-gray-400" />
                  </div>
                  {signatureName ? (
                    <div className="flex items-center justify-between bg-white border border-gray-255 p-2 rounded-xl text-[9px] mt-2">
                      <span className="font-bold text-emerald-600 truncate max-w-[130px] flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> {signatureName}
                      </span>
                      <button type="button" onClick={() => setSignatureName('')} className="p-1 hover:bg-slate-100 rounded-lg text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-[9px] font-bold text-slate-650 hover:text-slate-900 transition-colors mt-2">
                      <UploadCloud className="h-4 w-4 text-gray-450" /> Subir Firma PNG
                      <input type="file" className="hidden" accept="image/png" onChange={(e) => handleFileUpload('signature', e)} />
                    </label>
                  )}
                </div>

                {/* Stamp file upload */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-700">Sello Profesional</span>
                    <FileCheck className="h-4 w-4 text-gray-405" />
                  </div>
                  {stampName ? (
                    <div className="flex items-center justify-between bg-white border border-gray-255 p-2 rounded-xl text-[9px] mt-2">
                      <span className="font-bold text-emerald-600 truncate max-w-[130px] flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> {stampName}
                      </span>
                      <button type="button" onClick={() => setStampName('')} className="p-1 hover:bg-slate-100 rounded-lg text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-[9px] font-bold text-slate-650 hover:text-slate-900 transition-colors mt-2">
                      <UploadCloud className="h-4 w-4 text-gray-450" /> Subir Sello PNG
                      <input type="file" className="hidden" accept="image/png" onChange={(e) => handleFileUpload('stamp', e)} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {successMsg && (
              <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">{successMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Guardar Configuración
            </button>
          </form>
        </div>
      </div>

      {/* Doctor SaaS Subscription plans list */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-pink-500 shrink-0" />
            Planes de Suscripción Médica (RD$)
          </h3>
          <p className="text-[10px] text-gray-400">Elija el plan que se adapte al volumen de su consulta médica privada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctorPlans.map((plan) => {
            const isCurrent = activePlan === plan.id;
            return (
              <div 
                key={plan.id}
                className={`bg-slate-50 border rounded-3xl p-5 flex flex-col justify-between space-y-5 transition-all relative ${isCurrent ? 'border-pink-500 shadow-md ring-1 ring-pink-500/20' : 'border-gray-150/80 hover:bg-slate-100/50'}`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 bg-pink-500 text-white font-black text-[7px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                    Plan Activo
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">{plan.name}</h4>
                    <p className="text-[9px] text-gray-400 mt-1 leading-normal">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-800">{plan.price}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{plan.period}</span>
                  </div>

                  <ul className="space-y-1.5 border-t border-gray-200/60 pt-3 text-[10px] font-semibold text-slate-650">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-tight">
                        <Check className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setActivePlan(plan.id as any)}
                  className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors ${isCurrent ? 'bg-pink-100 text-pink-700' : 'bg-white hover:bg-slate-200 text-slate-800 border border-gray-250'}`}
                >
                  {isCurrent ? 'Plan Seleccionado' : 'Cambiar a este Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Center Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500 shrink-0" />
            Centro de Soporte Técnico y Ayuda
          </h3>
          <p className="text-[10px] text-gray-400">¿Tienes algún problema con el uso de la plataforma o la emisión de recetas? Abre un ticket de soporte.</p>
        </div>

        {/* Create new ticket form */}
        <form onSubmit={handleCreateTicket} className="space-y-4 bg-slate-50 border border-gray-150 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Crear Nuevo Ticket</span>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Asunto / Problema</label>
              <input
                type="text"
                placeholder="Ej. Problema con la firma digitalizada, no puedo vincular un paciente..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Descripción del problema</label>
              <textarea
                placeholder="Describe el inconveniente en detalle para recibir asistencia técnica..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-emerald-500 h-20 font-medium"
                required
              />
            </div>
          </div>

          {showTicketSuccess && (
            <p className="text-[10px] text-emerald-650 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">Ticket de soporte enviado. El departamento de operaciones te responderá a la brevedad.</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-955 text-white rounded-xl text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
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
                      className={`p-3 rounded-2xl text-xs max-w-[85%] border text-left ${isAgent ? 'bg-sky-50 border-sky-100 self-start' : 'bg-emerald-50/20 border-emerald-100 self-end text-right'}`}
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
                  className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
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
