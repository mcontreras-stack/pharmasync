export type PrescriptionStatus = 'activa' | 'expirada' | 'cancelada' | 'dispensada';

export interface PrescriptionItem {
  generic_name: string;
  commercial_name?: string;
  concentration: string;
  pharmaceutical_form: string;
  presentation: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  diagnosis: string;
  is_controlled: boolean;
  code: string;
  expiry_date: string;
  created_at: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_exequatur: string;
  doctor_address: string;
  doctor_phone: string;
  patient_name: string;
  patient_age: number;
  patient_allergies?: string;
  items: PrescriptionItem[];
  // Expansion fields
  uuid: string;
  qr_code_url?: string;
  validation_code?: string;
  status: PrescriptionStatus;
}

export interface PrescriptionVerification {
  id: string;
  prescription_id: string;
  verified_by: string;
  ip_address: string;
  verified_at: string;
}
