export type AppointmentState = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'scheduled';

export interface Appointment {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  appointment_date: string;
  status: AppointmentState;
  reason: string;
  notes?: string;
}

export interface AppointmentNote {
  id: string;
  appointment_id: string;
  notes: string;
  created_at: string;
}
