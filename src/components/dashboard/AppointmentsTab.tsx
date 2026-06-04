'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Appointment } from '@/lib/mockDb';
import { logDataChange } from '@/services/auditService';
import { Plus } from 'lucide-react';
import AppointmentsCalendar from '../appointments/AppointmentsCalendar';
import BookAppointmentModal from '../appointments/BookAppointmentModal';

export default function AppointmentsTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [showAddModal, setShowAddModal] = useState(false);

  if (!user) return null;

  const isMother = user.role === 'mother';

  // Filter appointments for this user
  const appointmentsList = db.appointments.filter(a => {
    if (isMother) return a.mother_id === user.id;
    return a.doctor_id === user.id;
  }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const doctorsList = db.profiles.filter(p => p.role === 'obstetrician' || p.role === 'pediatrician');

  const handleCancelAppointment = (id: string) => {
    const previous = db.appointments.find(a => a.id === id);
    const updated = db.appointments.map(a => 
      a.id === id ? { ...a, status: 'cancelled' as const } : a
    );

    const updatedDb = { ...db, appointments: updated };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    logDataChange({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'cancel_appointment',
      tableAffected: 'appointments',
      recordId: id,
      oldValue: previous,
      newValue: { ...previous, status: 'cancelled' }
    });
  };

  const handleConfirmAppointment = (id: string) => {
    const previous = db.appointments.find(a => a.id === id);
    const updated = db.appointments.map(a => 
      a.id === id ? { ...a, status: 'confirmed' as const } : a
    );

    const updatedDb = { ...db, appointments: updated };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    logDataChange({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'confirm_appointment',
      tableAffected: 'appointments',
      recordId: id,
      oldValue: previous,
      newValue: { ...previous, status: 'confirmed' }
    });
  };

  const handleBookAppointment = (data: { doctorId: string; date: string; time: string; reason: string; notes?: string }) => {
    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      doctor_id: data.doctorId,
      mother_id: user.id,
      appointment_date: `${data.date}T${data.time}:00Z`,
      status: 'pending',
      reason: data.reason,
      notes: data.notes
    };

    const updatedDb = { ...db, appointments: [...db.appointments, newAppt] };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    logDataChange({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'create_appointment',
      tableAffected: 'appointments',
      recordId: newAppt.id,
      newValue: newAppt
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      
      {/* Upper Control Bar */}
      <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-sm font-black text-slate-800">Control de Agenda y Consultas</h2>
          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Revisa tus citas médicas programadas y estatus clínicas.</p>
        </div>

        {isMother && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Programar Cita
          </button>
        )}
      </div>

      {/* Main visual calendar */}
      <AppointmentsCalendar
        user={user}
        appointments={appointmentsList}
        doctorsList={doctorsList}
        onCancel={handleCancelAppointment}
        onConfirm={handleConfirmAppointment}
      />

      {showAddModal && (
        <BookAppointmentModal
          doctorsList={doctorsList}
          onClose={() => setShowAddModal(false)}
          onBook={handleBookAppointment}
        />
      )}
    </div>
  );
}
