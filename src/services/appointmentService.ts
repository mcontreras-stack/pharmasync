import { supabase } from '@/lib/supabase';

export interface Appointment {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  appointment_type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine';
  duration_minutes?: number;
  meeting_link?: string;
  patient_notes?: string;
  doctor_notes?: string;
  cancellation_reason?: string;
  rescheduled_from?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Crear una nueva cita
 */
export async function createAppointment(
  doctorId: string,
  motherId: string,
  appointmentDate: string,
  reason: string,
  appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine' = 'consultation',
  babyId?: string,
  notes?: string
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          doctor_id: doctorId,
          mother_id: motherId,
          baby_id: babyId,
          appointment_date: appointmentDate,
          status: 'scheduled',
          reason,
          notes,
          appointment_type: appointmentType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error creating appointment:', err);
    throw err;
  }
}

/**
 * Obtener una cita por ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error fetching appointment:', err);
    throw err;
  }
}

/**
 * Obtener citas de una madre
 */
export async function getMotherAppointments(motherId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('mother_id', motherId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    return (data || []) as Appointment[];
  } catch (err) {
    console.error('Error fetching mother appointments:', err);
    throw err;
  }
}

/**
 * Obtener citas de un doctor
 */
export async function getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    return (data || []) as Appointment[];
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    throw err;
  }
}

/**
 * Obtener citas en un rango de fechas
 */
export async function getAppointmentsByDateRange(
  doctorId: string,
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Appointment[];
  } catch (err) {
    console.error('Error fetching appointments by date range:', err);
    throw err;
  }
}

/**
 * Actualizar una cita
 */
export async function updateAppointment(
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error updating appointment:', err);
    throw err;
  }
}

/**
 * Cancelar una cita
 */
export async function cancelAppointment(
  appointmentId: string,
  cancellationReason?: string
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellationReason,
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    throw err;
  }
}

/**
 * Marcar una cita como completada
 */
export async function completeAppointment(
  appointmentId: string,
  doctorNotes?: string
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        doctor_notes: doctorNotes,
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error completing appointment:', err);
    throw err;
  }
}

/**
 * Reprogramar una cita
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newAppointmentDate: string
): Promise<Appointment> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        appointment_date: newAppointmentDate,
        status: 'scheduled',
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data as Appointment;
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    throw err;
  }
}

/**
 * Obtener citas próximas de un doctor
 */
export async function getUpcomingAppointments(doctorId: string, days: number = 7): Promise<Appointment[]> {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'scheduled')
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', future.toISOString())
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Appointment[];
  } catch (err) {
    console.error('Error fetching upcoming appointments:', err);
    throw err;
  }
}

/**
 * Registrar una visita prenatal
 */
export async function recordPrenatalVisit(
  pregnancyId: string,
  appointmentId: string,
  visitDate: string,
  gestationalWeek: number,
  motherWeightKg?: number,
  bloodPressure?: string,
  fetalHeartRateBpm?: number,
  uterineHeightCm?: number,
  notes?: string,
  recommendations?: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('prenatal_visits')
      .insert([
        {
          pregnancy_id: pregnancyId,
          appointment_id: appointmentId,
          visit_date: visitDate,
          gestational_week: gestationalWeek,
          mother_weight_kg: motherWeightKg,
          blood_pressure: bloodPressure,
          fetal_heart_rate_bpm: fetalHeartRateBpm,
          uterine_height_cm: uterineHeightCm,
          notes,
          recommendations,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error recording prenatal visit:', err);
    throw err;
  }
}

/**
 * Registrar una visita pediátrica
 */
export async function recordPediatricVisit(
  babyId: string,
  appointmentId: string,
  visitDate: string,
  weightKg: number,
  heightCm: number,
  headCircCm?: number,
  developmentStatus?: string,
  notes?: string,
  recommendations?: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('pediatric_visits')
      .insert([
        {
          baby_id: babyId,
          appointment_id: appointmentId,
          visit_date: visitDate,
          weight_kg: weightKg,
          height_cm: heightCm,
          head_circ_cm: headCircCm,
          development_status: developmentStatus,
          notes,
          recommendations,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error recording pediatric visit:', err);
    throw err;
  }
}
