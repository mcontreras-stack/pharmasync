'use client';

import React, { useState } from 'react';
import { Appointment, Profile } from '@/types/database';
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface AppointmentsCalendarProps {
  user: Profile;
  appointments: Appointment[];
  doctorsList: Profile[];
  onCancel: (id: string) => void;
  onConfirm?: (id: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export default function AppointmentsCalendar({ user, appointments, doctorsList, onCancel, onConfirm }: AppointmentsCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDoctorName = (docId: string) => {
    const doc = doctorsList.find(d => d.id === docId);
    return doc ? doc.full_name : 'Médico Especialista';
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const badges: Record<Appointment['status'], string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
      completed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
      no_show: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return badges[status] || badges.pending;
  };

  // Helper calculations for calendar grid (month view)
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const offset = direction === 'next' ? 1 : -1;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Grid days array
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null); // empty cells before first day
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter(a => {
      const aDate = new Date(a.appointment_date);
      return aDate.getDate() === day && aDate.getMonth() === currentDate.getMonth() && aDate.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 select-none">
      
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-50 pb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-pink-500" />
          <h3 className="font-bold text-gray-800 text-sm capitalize">{monthName}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200/50">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === mode ? 'bg-white text-slate-800 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => navigateMonth('prev')} className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button onClick={() => navigateMonth('next')} className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Days labels */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <span key={d}>{d}</span>)}
          </div>
          
          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              const dayAppts = day ? getAppointmentsForDay(day) : [];
              return (
                <div
                  key={idx}
                  className={`min-h-[75px] border border-gray-100 rounded-xl p-2 flex flex-col justify-between transition-colors ${day ? 'bg-gray-50/20 hover:border-pink-200' : 'bg-transparent border-0'} ${day && isToday(day) ? 'bg-pink-500/5 border-pink-300' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`text-[10px] font-bold ${isToday(day) ? 'bg-pink-500 text-white h-4.5 w-4.5 rounded-full flex items-center justify-center' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      
                      <div className="space-y-0.5 mt-1">
                        {dayAppts.slice(0, 2).map((a) => (
                          <span
                            key={a.id}
                            className="text-[7.5px] font-bold py-0.5 px-1.5 rounded-md border truncate block bg-white/70"
                            style={{ borderColor: a.status === 'confirmed' ? '#86efac' : '#fef08a' }}
                            title={a.reason}
                          >
                            {new Date(a.appointment_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                        {dayAppts.length > 2 && (
                          <span className="text-[7px] text-gray-400 font-bold block text-center">+{dayAppts.length - 2} más</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List schedule format for week / day modes */
        <div className="space-y-4 overflow-y-auto max-h-[360px] animate-in fade-in duration-200">
          {appointments.map((appt) => {
            const dateObj = new Date(appt.appointment_date);
            const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

            return (
              <div
                key={appt.id}
                className="bg-gray-50/50 hover:bg-gray-50 border border-gray-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[8px] px-2.5 py-0.5 rounded-full font-bold border uppercase ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold capitalize">{dateStr} a las {timeStr}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800">{appt.reason}</h4>
                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {user.role === 'mother' ? `Especialista: ${getDoctorName(appt.doctor_id)}` : `Paciente: María López`}
                    </p>
                  </div>
                </div>

                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {user.role !== 'mother' && appt.status === 'pending' && onConfirm && (
                      <button
                        onClick={() => onConfirm(appt.id)}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold shadow-xs cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => onCancel(appt.id)}
                      className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black cursor-pointer"
                    >
                      Cancelar Cita
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {appointments.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-8">No hay citas programadas para el periodo seleccionado.</p>
          )}
        </div>
      )}
    </div>
  );
}
