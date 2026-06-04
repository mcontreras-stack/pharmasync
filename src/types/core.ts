export type UserRole = 'mother' | 'obstetrician' | 'pediatrician' | 'admin';
export type LinkStatus = 'pending' | 'active' | 'inactive';
export type ProfileStatus = 'email_pending' | 'pending_documents' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'inactive';
export type DoctorStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'pending_corrections';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_suspended?: boolean;
  status: ProfileStatus;
  phone?: string;
  national_id?: string;
  nationality?: string;
  country?: string;
  city?: string;
  birth_date?: string;
  password?: string;
}

export interface Mother {
  id: string;
  phone: string;
  birth_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  allergies?: string;
  medicamentos_actuales?: string;
  condiciones_medicas?: string;
  mother_status?: 'pregnant' | 'gave_birth' | 'children_only' | 'pregnant_and_children';
}

export interface Doctor {
  id: string;
  license_number: string;
  specialty: 'obstetrician' | 'pediatrician';
  phone: string;
  clinic_address: string;
  consultation_hours: string;
  verification_status: DoctorStatus;
  document_url?: string;
  exequatur?: string;
  national_id?: string;
  verification_history?: { status: string; note: string; date: string }[];
  colegiatura?: string;
  experience_years?: number;
  bio?: string;
  signature_url?: string;
  stamp_url?: string;
  subspecialty?: string;
  university?: string;
  graduation_year?: number;
  plan_type?: string;
  clinic_phone?: string;
  invite_code?: string;
  cmd_number?: string;
}

export interface Pregnancy {
  id: string;
  mother_id: string;
  obstetrician_id?: string | null;
  status: 'active' | 'completed' | 'terminated';
  last_menstrual_period: string;
  estimated_due_date: string;
  weeks_gestation_offset: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Baby {
  id: string;
  mother_id: string;
  pediatrician_id?: string | null;
  pregnancy_id?: string | null;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_weight_grams?: number;
  birth_height_cm?: number;
  birth_head_circ_cm?: number;
  gender: string;
  blood_type?: string;
  allergies?: string;
  created_at?: string;
}
