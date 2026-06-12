'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Appointment, Profile } from '@/lib/mockDb';
import { logDataChange } from '@/services/auditService';
import { getAppointmentsFor, bookAppointment, setAppointmentStatus, getBookableDoctors } from '@/services/appointmentService';
import { Plus } from 'lucide-react';
import AppointmentsCalendar from '../appointments/AppointmentsCalendar';
import BookAppointmentModal from '../appointments/BookAppointmentModal';

export default function AppointmentsTab() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Profile[]>([]);

  const userId = user?.id || '';
  const userRole = user?.role || '';

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [appointments, doctors] = await Promise.all([
        getAppointmentsFor({ id: userId, role: userRole }),
        userRole === 'mother' ? getBookableDoctors(userId) : Promise.resolve([]),
      ]);
      setAppointmentsList(appointments);
      setDoctorsList(doctors);
    } catch (err) {
      console.error('[AppointmentsTab] Error cargando citas:', err);
    }
  }, [userId, userRole]);

  useEffect(() => {
    const t = setTimeout(() => { loadData(); }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  if (!user) return null;

  const isMother = user.role === 'mother';

  const handleCancelAppointment = async (id: string) => {
    try {
      await setAppointmentStatus(id, 'cancelled');
      setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
      logDataChange({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'cancel_appointment',
        tableAffected: 'appointments',
        recordId: id,
        newValue: { status: 'cancelled' }
      });
    } catch (err) {
      console.error('[AppointmentsTab] Error cancelando cita:', err);
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      await setAppointmentStatus(id, 'confirmed');
      setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' as const } : a));
      logDataChange({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'confirm_appointment',
        tableAffected: 'appointments',
        recordId: id,
        newValue: { status: 'confirmed' }
      });
    } catch (err) {
      console.error('[AppointmentsTab] Error confirmando cita:', err);
    }
  };

  const handleBookAppointment = async (data: { doctorId: string; date: string; time: string; reason: string; notes?: string }) => {
    try {
      const appt = await bookAppointment(user.id, {
        doctor_id: data.doctorId,
        appointment_date: `${data.date}T${data.time}:00Z`,
        reason: data.reason,
        notes: data.notes,
      });
      setAppointmentsList(prev => [...prev, appt]);
      logDataChange({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'create_appointment',
        tableAffected: 'appointments',
        recordId: appt.id,
        newValue: appt
      });
    } catch (err) {
      console.error('[AppointmentsTab] Error creando cita:', err);
    }
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
