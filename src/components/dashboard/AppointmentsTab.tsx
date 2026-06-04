'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Appointment } from '@/lib/mockDb';
import { Calendar, Clock, MapPin, User, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AppointmentsTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [doctorSelect, setDoctorSelect] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [reasonVal, setReasonVal] = useState('');
  const [notesVal, setNotesVal] = useState('');

  if (!user) return null;

  // Query appointments based on role
  let appointmentsList = db.appointments.filter(a => {
    if (user.role === 'mother') return a.mother_id === user.id;
    return a.doctor_id === user.id;
  }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  // Doctor details mapping
  const doctorsList = db.profiles.filter(p => p.role === 'obstetrician' || p.role === 'pediatrician');

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateVal || !timeVal || !reasonVal) return;

    // Resolve doctor ID
    let targetDoctorId = doctorSelect;
    if (user.role !== 'mother') {
      // If doctor is scheduling, targetDoctorId is the logged-in doctor
      targetDoctorId = user.id;
    } else if (!targetDoctorId) {
      // Fallback first doctor
      targetDoctorId = doctorsList[0]?.id || '';
    }

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      doctor_id: targetDoctorId,
      mother_id: user.role === 'mother' ? user.id : 'mother-maria-123', // if doctor schedules, link to Maria for MVP
      appointment_date: `${dateVal}T${timeVal}:00Z`,
      status: 'scheduled',
      reason: reasonVal,
      notes: notesVal
    };

    const updatedDb = {
      ...db,
      appointments: [...db.appointments, newAppt]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setShowAddModal(false);

    // Reset forms
    setDateVal('');
    setTimeVal('');
    setReasonVal('');
    setNotesVal('');
  };

  const handleCancelAppointment = (id: string) => {
    const updatedAppointments = db.appointments.map(a => {
      if (a.id === id) {
        return { ...a, status: 'cancelled' as const };
      }
      return a;
    });
    const updatedDb = { ...db, appointments: updatedAppointments };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Border theme colors
  let roleColor = 'text-pink-600 bg-pink-50 border-pink-100 hover:bg-pink-100';
  let btnColor = 'bg-pink-500 hover:bg-pink-600';
  if (user.role === 'obstetrician') {
    roleColor = 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100';
    btnColor = 'bg-purple-500 hover:bg-purple-600';
  } else if (user.role === 'pediatrician') {
    roleColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100';
    btnColor = 'bg-emerald-500 hover:bg-emerald-600';
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Citas Médicas</h2>
            <p className="text-xs text-gray-400 mt-1">Organiza y lleva el registro de tus controles</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-1.5 px-4 py-2 ${btnColor} text-white rounded-xl text-xs font-bold transition-all shadow-xs`}
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Nueva Cita
          </button>
        </div>

        {/* Appointment Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {appointmentsList.map((appt) => {
            const docInfo = db.profiles.find(p => p.id === appt.doctor_id);
            const docDetails = db.doctors.find(d => d.id === appt.doctor_id);
            const patientInfo = db.profiles.find(p => p.id === appt.mother_id);
            
            const dateObj = new Date(appt.appointment_date);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={appt.id} 
                className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between gap-4 ${appt.status === 'cancelled' ? 'opacity-60' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${appt.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {appt.status === 'scheduled' ? 'Programada' : appt.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{formattedTime}</span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 leading-snug">{appt.reason}</h3>

                  <div className="text-xs text-gray-500 space-y-1.5 pt-1">
                    <p className="flex items-center gap-1.5 font-medium text-gray-700">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {user.role === 'mother' ? `Con: ${docInfo?.full_name}` : `Paciente: ${patientInfo?.full_name}`}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {formattedDate}
                    </p>
                    {user.role === 'mother' && docDetails && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {docDetails.clinic_address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cancel controls */}
                {appt.status === 'scheduled' && (
                  <div className="flex gap-2 border-t border-gray-50 pt-3">
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="w-full text-center py-1.5 bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Cancelar Cita
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {appointmentsList.length === 0 && (
            <div className="col-span-full py-10 text-center italic text-xs text-gray-400">
              No tienes citas registradas.
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE APPOINTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-lg text-gray-800">Programar Nueva Cita</h3>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              {user.role === 'mother' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Seleccionar Médico</label>
                  <select
                    value={doctorSelect}
                    onChange={(e) => setDoctorSelect(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold"
                  >
                    {doctorsList.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.full_name} ({doc.role === 'obstetrician' ? 'Obstetra' : 'Pediatra'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha</label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-semibold">Hora</label>
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Motivo de la Cita</label>
                <input
                  type="text"
                  placeholder="ej. Control prenatal de rutina, Vacunas, Fiebre..."
                  value={reasonVal}
                  onChange={(e) => setReasonVal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Notas previas (Opcional)</label>
                <textarea
                  placeholder="Escribe alguna aclaración o síntoma previo para el doctor..."
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 h-20"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 ${btnColor} text-white rounded-xl text-xs font-bold`}
                >
                  Programar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
