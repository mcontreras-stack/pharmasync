// Mock Database for PharmaSync Mom & Baby MVP
// Simulates Supabase Postgres tables in localStorage to allow instant demo execution.

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin';
  avatar_url?: string;
  is_suspended?: boolean;
  status: 'email_pending' | 'pending_documents' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'inactive';
  phone?: string;
  national_id?: string;
  nationality?: string;
  country?: string;
  city?: string;
  birth_date?: string;
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
  verification_status: 'pending' | 'approved' | 'rejected' | 'pending_corrections';
  document_url?: string;
  exequatur?: string;
  national_id?: string;
  verification_history?: { status: string; note: string; date: string }[];
  colegiatura?: string;
  experience_years?: number;
  bio?: string;
  signature_url?: string;
  stamp_url?: string;
  invite_code?: string;
  clinic_phone?: string;
}

export interface ProfessionalDoc {
  id: string;
  doctor_id: string;
  type: 'id_front' | 'id_back' | 'degree' | 'exequatur' | 'colegiatura';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction';
  notes?: string;
  created_at: string;
}

export interface MotherDoc {
  id: string;
  mother_id: string;
  type: 'id_front' | 'id_back' | 'pregnancy_cert' | 'birth_cert';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction';
  notes?: string;
  created_at: string;
}

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
  warnings?: string;
}

export interface Prescription {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  diagnosis?: string;
  is_controlled: boolean;
  status: 'active' | 'dispensed' | 'expired' | 'canceled';
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
  patient_weight_kg?: number;
  items: PrescriptionItem[];
}

export interface Pregnancy {
  id: string;
  mother_id: string;
  obstetrician_id: string | null;
  status: 'active' | 'completed' | 'terminated';
  last_menstrual_period: string;
  estimated_due_date: string;
  weeks_gestation_offset: number;
  notes?: string;
}

export interface Baby {
  id: string;
  mother_id: string;
  pediatrician_id: string | null;
  pregnancy_id?: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_weight_grams?: number;
  birth_height_cm?: number;
  birth_head_circ_cm?: number;
  gender: string;
  blood_type?: string;
  allergies?: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
}

export interface PrenatalVisit {
  id: string;
  pregnancy_id: string;
  appointment_id?: string;
  visit_date: string;
  gestational_week: number;
  mother_weight_kg?: number;
  blood_pressure?: string;
  fetal_heart_rate_bpm?: number;
  uterine_height_cm?: number;
  notes?: string;
  recommendations?: string;
}

export interface PediatricVisit {
  id: string;
  baby_id: string;
  appointment_id?: string;
  visit_date: string;
  weight_kg: number;
  height_cm: number;
  head_circ_cm?: number;
  development_status?: string;
  notes?: string;
  recommendations?: string;
}

export interface LabResult {
  id: string;
  pregnancy_id?: string;
  baby_id?: string;
  mother_id?: string;
  test_name: string;
  test_date: string;
  result_summary: string;
  file_url?: string;
  is_normal: boolean;
  uploaded_by: string;
}

export interface UltrasoundResult {
  id: string;
  pregnancy_id: string;
  gestational_week: number;
  scan_date: string;
  image_url?: string;
  findings: string;
  uploaded_by: string;
}

export interface Symptom {
  id: string;
  mother_id: string;
  pregnancy_id?: string;
  symptom_name: string;
  intensity: 'Bajo' | 'Medio' | 'Alto';
  logged_date: string;
  notes?: string;
}

export interface VitalSign {
  id: string;
  mother_id?: string;
  baby_id?: string;
  logged_date: string;
  weight_kg?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate_bpm?: number;
  temperature_c?: number;
}

export interface Vaccine {
  id: string;
  name: string;
  target_disease: string;
  recommended_age_months: number;
  dose_number: number;
  description: string;
}

export interface BabyVaccine {
  id: string;
  baby_id: string;
  vaccine_id: string;
  applied_date?: string;
  status: 'pending' | 'scheduled' | 'applied';
  lot_number?: string;
  pediatrician_id?: string;
  notes?: string;
}

export interface GrowthRecord {
  id: string;
  baby_id: string;
  record_date: string;
  age_months: number;
  weight_kg: number;
  height_cm: number;
  head_circ_cm?: number;
  weight_percentile?: number;
  height_percentile?: number;
}

export interface DevelopmentMilestone {
  id: string;
  baby_id: string;
  category: 'Motor' | 'Cognitivo' | 'Social' | 'Lenguaje';
  milestone_name: string;
  target_age_months: number;
  achieved_date?: string;
  status: 'pending' | 'achieved' | 'delayed';
  notes?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface DoctorPatientLink {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  link_code: string;
  status: 'pending' | 'active' | 'inactive';
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'appointment' | 'alert' | 'system' | 'chat';
  read_at?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: 'free' | 'premium_monthly' | 'premium_yearly';
  status: 'active' | 'past_due' | 'canceled';
  price_paid: number;
  payment_status: 'paid' | 'unpaid' | 'refunded';
  start_date: string;
  end_date: string;
  created_at: string;
}

// Preset entities IDs for consistency
export const MOCK_MOTHER_ID = 'mother-maria-123';
export const MOCK_OBSTETRICIAN_ID = 'doctor-ana-456';
export const MOCK_PEDIATRICIAN_ID = 'doctor-andres-789';
export const MOCK_ADMIN_ID = 'admin-juan-000';
export const MOCK_BABY_ID = 'baby-mateo-999';
export const MOCK_PREGNANCY_ID = 'pregnancy-active-888';

const defaultVaccines: Vaccine[] = [
  { id: 'vac-1', name: 'BCG', target_disease: 'Tuberculosis Meningitis', recommended_age_months: 0, dose_number: 1, description: 'Única dosis al nacer' },
  { id: 'vac-2', name: 'Hepatitis B', target_disease: 'Hepatitis B', recommended_age_months: 0, dose_number: 1, description: 'Dentro de las primeras 12h' },
  { id: 'vac-3', name: 'Hexavalente 1', target_disease: 'Difteria, Tétanos, Tos Ferina, Polio, Hib, Hep B', recommended_age_months: 2, dose_number: 1, description: 'Seguimiento a los 2 meses' },
  { id: 'vac-4', name: 'Rotavirus 1', target_disease: 'Diarrea severa', recommended_age_months: 2, dose_number: 1, description: 'Prevención de deshidratación' },
  { id: 'vac-5', name: 'Neumocócica Conjugada 1', target_disease: 'Neumonía, Meningitis', recommended_age_months: 2, dose_number: 1, description: 'Esquema de 3 dosis' },
  { id: 'vac-6', name: 'Hexavalente 2', target_disease: 'Difteria, Tétanos, Tos Ferina, Polio, Hib, Hep B', recommended_age_months: 4, dose_number: 2, description: 'Segunda dosis' },
  { id: 'vac-7', name: 'Rotavirus 2', target_disease: 'Diarrea severa', recommended_age_months: 4, dose_number: 2, description: 'Segunda dosis' }
];

export interface AuditLog {
  id: string;
  user_id?: string;
  email?: string;
  event: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  is_suspicious: boolean;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  status: 'open' | 'resolved';
  assigned_to?: string;
  created_at: string;
  replies: { sender: string; content: string; created_at: string }[];
}

export interface CmsArticle {
  id: string;
  title: string;
  category: 'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General';
  tags: string[];
  content: string;
  status: 'published' | 'draft';
  author: string;
  created_at: string;
}

export interface HipaaConsentLog {
  id: string;
  user_id: string;
  user_name: string;
  consent_type: string;
  version: string;
  ip_address: string;
  accepted_at: string;
}

export interface PrivacyRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  request_type: 'export' | 'delete';
  status: 'pending' | 'completed' | 'canceled';
  created_at: string;
}

export interface AiUsageStat {
  id: string;
  user_name: string;
  model: 'gpt-4o' | 'claude-3-5-sonnet';
  tokens_prompt: number;
  tokens_completion: number;
  cost_usd: number;
  timestamp: string;
}

export interface MockDatabase {
  profiles: Profile[];
  mothers: Mother[];
  doctors: Doctor[];
  pregnancies: Pregnancy[];
  babies: Baby[];
  appointments: Appointment[];
  prenatal_visits: PrenatalVisit[];
  pediatric_visits: PediatricVisit[];
  lab_results: LabResult[];
  ultrasound_results: UltrasoundResult[];
  symptoms: Symptom[];
  vital_signs: VitalSign[];
  vaccines: Vaccine[];
  baby_vaccines: BabyVaccine[];
  growth_records: GrowthRecord[];
  development_milestones: DevelopmentMilestone[];
  messages: Message[];
  doctor_patient_links: DoctorPatientLink[];
  notifications: Notification[];
  subscriptions: Subscription[];
  audit_logs: AuditLog[];
  support_tickets: SupportTicket[];
  cms_articles: CmsArticle[];
  hipaa_consent_logs: HipaaConsentLog[];
  privacy_requests: PrivacyRequest[];
  ai_usage_stats: AiUsageStat[];
  professional_documents: ProfessionalDoc[];
  mother_documents: MotherDoc[];
  prescriptions: Prescription[];
}

const initialDb: MockDatabase = {
  profiles: [
    { id: MOCK_MOTHER_ID, email: 'maria@gmail.com', full_name: 'María López', role: 'mother', status: 'approved' },
    { id: MOCK_OBSTETRICIAN_ID, email: 'dra.ana@pharmasync.com', full_name: 'Dra. Ana Rodríguez', role: 'obstetrician', status: 'approved' },
    { id: MOCK_PEDIATRICIAN_ID, email: 'dr.andres@pharmasync.com', full_name: 'Dr. Andrés Pérez', role: 'pediatrician', status: 'approved' },
    { id: 'doctor-pedro-111', email: 'dr.pedro@pharmasync.com', full_name: 'Dr. Pedro Gómez', role: 'pediatrician', status: 'under_review' },
    { id: MOCK_ADMIN_ID, email: 'admin@pharmasync.com', full_name: 'Admin Juan', role: 'admin', status: 'approved' }
  ],
  mothers: [
    {
      id: MOCK_MOTHER_ID,
      phone: '+54 9 11 5555-1234',
      birth_date: '1998-04-12',
      emergency_contact_name: 'Juan López (Esposo)',
      emergency_contact_phone: '+54 9 11 5555-9999',
      blood_type: 'O+',
      allergies: 'Penicilina'
    }
  ],
  doctors: [
    {
      id: MOCK_OBSTETRICIAN_ID,
      license_number: 'MN-94827',
      specialty: 'obstetrician',
      phone: '+54 9 11 4444-1111',
      clinic_address: 'Av. Santa Fe 2340, Consultorio 4B, CABA',
      consultation_hours: 'Lunes a Viernes 9:00 - 15:00',
      verification_status: 'approved',
      document_url: 'https://docs.google.com/viewer?url=licence_ana.pdf',
      exequatur: 'EQ-28492',
      colegiatura: 'CMD-94827',
      national_id: '12-345678-9',
      verification_history: [
        { status: 'approved', note: 'Registro verificado contra el sistema oficial del Ministerio de Salud.', date: '2026-01-01T10:00:00Z' }
      ]
    },
    {
      id: MOCK_PEDIATRICIAN_ID,
      license_number: 'MN-85731',
      specialty: 'pediatrician',
      phone: '+54 9 11 4444-2222',
      clinic_address: 'Calle Junín 850, Planta Baja, CABA',
      consultation_hours: 'Martes y Jueves 10:00 - 18:00',
      verification_status: 'approved',
      document_url: 'https://docs.google.com/viewer?url=licence_andres.pdf',
      exequatur: 'EQ-94829',
      colegiatura: 'CMD-85731',
      national_id: '98-765432-1',
      verification_history: [
        { status: 'approved', note: 'Licencia pediátrica convalidada correctamente.', date: '2026-01-01T10:12:00Z' }
      ]
    },
    {
      id: 'doctor-pedro-111',
      license_number: 'MN-11111',
      specialty: 'pediatrician',
      phone: '+54 9 11 4444-3333',
      clinic_address: 'Av. Corrientes 1500, CABA',
      consultation_hours: 'Lunes a Viernes 14:00 - 20:00',
      verification_status: 'pending',
      document_url: 'https://docs.google.com/viewer?url=solicitud_pedro_firma.pdf',
      exequatur: 'EQ-11111',
      national_id: '44-555555-5',
      verification_history: [
        { status: 'pending', note: 'En espera de revisión de exequátur y documento de identidad.', date: '2026-06-03T19:30:00Z' }
      ]
    }
  ],
  pregnancies: [
    {
      id: MOCK_PREGNANCY_ID,
      mother_id: MOCK_MOTHER_ID,
      obstetrician_id: MOCK_OBSTETRICIAN_ID,
      status: 'active',
      last_menstrual_period: '2025-11-20',
      estimated_due_date: '2026-08-27',
      weeks_gestation_offset: 0,
      notes: 'Embarazo primerizo, evolución normal. Control de presión arterial recomendado.'
    }
  ],
  babies: [
    {
      id: MOCK_BABY_ID,
      mother_id: MOCK_MOTHER_ID,
      pediatrician_id: MOCK_PEDIATRICIAN_ID,
      pregnancy_id: 'pregnancy-past-999',
      name: 'Mateo López',
      birth_date: '2026-02-15',
      birth_time: '14:23',
      birth_weight_grams: 3250,
      birth_height_cm: 50,
      birth_head_circ_cm: 34.5,
      gender: 'Masculino',
      blood_type: 'O+',
      allergies: 'Ninguna conocida'
    }
  ],
  appointments: [
    {
      id: 'appt-1',
      doctor_id: MOCK_OBSTETRICIAN_ID,
      mother_id: MOCK_MOTHER_ID,
      appointment_date: '2026-06-22T10:30:00Z',
      status: 'scheduled',
      reason: 'Control prenatal semana 28',
      notes: 'Venir con examen de laboratorio reciente.'
    },
    {
      id: 'appt-2',
      doctor_id: MOCK_PEDIATRICIAN_ID,
      mother_id: MOCK_MOTHER_ID,
      baby_id: MOCK_BABY_ID,
      appointment_date: '2026-06-15T16:00:00Z',
      status: 'scheduled',
      reason: 'Control de crecimiento 4 meses',
      notes: 'Control general y vacunas correspondientes.'
    }
  ],
  prenatal_visits: [
    { id: 'pvisit-1', pregnancy_id: MOCK_PREGNANCY_ID, visit_date: '2026-01-15', gestational_week: 8, mother_weight_kg: 62.1, blood_pressure: '110/70', notes: 'Primera consulta, latido fetal confirmado.' },
    { id: 'pvisit-2', pregnancy_id: MOCK_PREGNANCY_ID, visit_date: '2026-02-19', gestational_week: 13, mother_weight_kg: 63.4, blood_pressure: '115/75', notes: 'Ecografía de translucencia nucal normal.' },
    { id: 'pvisit-3', pregnancy_id: MOCK_PREGNANCY_ID, visit_date: '2026-04-16', gestational_week: 21, mother_weight_kg: 65.8, blood_pressure: '110/70', notes: 'Ecografía morfológica. Anatomía fetal correcta. Se confirma sexo masculino.' },
    { id: 'pvisit-4', pregnancy_id: MOCK_PREGNANCY_ID, visit_date: '2026-05-14', gestational_week: 25, mother_weight_kg: 67.3, blood_pressure: '120/80', notes: 'Control general. Bebé en posición cefálica transitoria.' }
  ],
  pediatric_visits: [
    { id: 'pedvisit-1', baby_id: MOCK_BABY_ID, visit_date: '2026-03-15', weight_kg: 4.2, height_cm: 53.5, head_circ_cm: 36.5, development_status: 'Reflejos normales, sonrisa social activa.', notes: 'Control primer mes.' },
    { id: 'pedvisit-2', baby_id: MOCK_BABY_ID, visit_date: '2026-04-15', weight_kg: 5.1, height_cm: 57.0, head_circ_cm: 38.2, development_status: 'Fija la mirada, sigue objetos.', notes: 'Control segundo mes.' },
    { id: 'pedvisit-3', baby_id: MOCK_BABY_ID, visit_date: '2026-05-15', weight_kg: 6.0, height_cm: 61.2, head_circ_cm: 39.8, development_status: 'Mantiene la cabeza erguida al estar boca abajo.', notes: 'Control tercer mes.' }
  ],
  lab_results: [
    { id: 'lab-1', pregnancy_id: MOCK_PREGNANCY_ID, test_name: 'Hemograma Completo', test_date: '2026-05-10', result_summary: 'Glóbulos rojos: 4.1 M/uL (Normal), Hemoglobina: 12.3 g/dL (Normal).', is_normal: true, uploaded_by: MOCK_OBSTETRICIAN_ID },
    { id: 'lab-2', pregnancy_id: MOCK_PREGNANCY_ID, test_name: 'Glucosa en ayunas', test_date: '2026-05-10', result_summary: 'Glucemia: 84 mg/dL (Normal).', is_normal: true, uploaded_by: MOCK_OBSTETRICIAN_ID },
    { id: 'lab-3', pregnancy_id: MOCK_PREGNANCY_ID, test_name: 'Examen de orina', test_date: '2026-05-10', result_summary: 'Sedimento normal. Cultivo negativo.', is_normal: true, uploaded_by: MOCK_OBSTETRICIAN_ID }
  ],
  ultrasound_results: [
    { id: 'ultra-1', pregnancy_id: MOCK_PREGNANCY_ID, gestational_week: 12, scan_date: '2026-02-12', findings: 'Ecografía translucencia nucal: 1.2mm (Bajo riesgo). Hueso nasal presente. Vitalidad fetal conservada.', uploaded_by: MOCK_OBSTETRICIAN_ID },
    { id: 'ultra-2', pregnancy_id: MOCK_PREGNANCY_ID, gestational_week: 20, scan_date: '2026-04-09', findings: 'Ecografía morfológica: Anatomía fetal sin anomalías detectables. Placenta normoinserta, líquido amniótico normal. Frecuencia cardiaca fetal 142 bpm.', uploaded_by: MOCK_OBSTETRICIAN_ID }
  ],
  symptoms: [
    { id: 'sym-1', mother_id: MOCK_MOTHER_ID, pregnancy_id: MOCK_PREGNANCY_ID, symptom_name: 'Náuseas leves', intensity: 'Bajo', logged_date: '2026-06-01', notes: 'Principalmente por la mañana.' },
    { id: 'sym-2', mother_id: MOCK_MOTHER_ID, pregnancy_id: MOCK_PREGNANCY_ID, symptom_name: 'Dolor lumbar', intensity: 'Medio', logged_date: '2026-06-02', notes: 'Aumenta al estar mucho tiempo de pie.' },
    { id: 'sym-3', mother_id: MOCK_MOTHER_ID, pregnancy_id: MOCK_PREGNANCY_ID, symptom_name: 'Fatiga', intensity: 'Bajo', logged_date: '2026-06-03', notes: 'Sensación de cansancio temprano por la noche.' }
  ],
  vital_signs: [
    { id: 'vit-1', mother_id: MOCK_MOTHER_ID, logged_date: '2026-06-03', weight_kg: 68.5, systolic_bp: 110, diastolic_bp: 70, heart_rate_bpm: 84, temperature_c: 36.6 }
  ],
  vaccines: defaultVaccines,
  baby_vaccines: [
    { id: 'bvac-1', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-1', applied_date: '2026-02-15', status: 'applied', lot_number: 'B4829K', pediatrician_id: MOCK_PEDIATRICIAN_ID, notes: 'Aplicada en sanatorio al nacer.' },
    { id: 'bvac-2', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-2', applied_date: '2026-02-15', status: 'applied', lot_number: 'HB0491', pediatrician_id: MOCK_PEDIATRICIAN_ID, notes: 'Aplicada en muslo izquierdo.' },
    { id: 'bvac-3', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-3', applied_date: '2026-04-18', status: 'applied', lot_number: 'HX9281', pediatrician_id: MOCK_PEDIATRICIAN_ID, notes: 'Ligera fiebre 37.8°C reportada a las 12h, cedió con paracetamol.' },
    { id: 'bvac-4', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-4', applied_date: '2026-04-18', status: 'applied', lot_number: 'RT4918', pediatrician_id: MOCK_PEDIATRICIAN_ID },
    { id: 'bvac-5', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-5', applied_date: '2026-04-18', status: 'applied', lot_number: 'NM0491', pediatrician_id: MOCK_PEDIATRICIAN_ID },
    { id: 'bvac-6', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-6', status: 'pending' },
    { id: 'bvac-7', baby_id: MOCK_BABY_ID, vaccine_id: 'vac-7', status: 'pending' }
  ],
  growth_records: [
    { id: 'gro-1', baby_id: MOCK_BABY_ID, record_date: '2026-02-15', age_months: 0, weight_kg: 3.25, height_cm: 50.0, head_circ_cm: 34.5, weight_percentile: 50, height_percentile: 50 },
    { id: 'gro-2', baby_id: MOCK_BABY_ID, record_date: '2026-03-15', age_months: 1, weight_kg: 4.20, height_cm: 53.5, head_circ_cm: 36.5, weight_percentile: 48, height_percentile: 52 },
    { id: 'gro-3', baby_id: MOCK_BABY_ID, record_date: '2026-04-15', age_months: 2, weight_kg: 5.10, height_cm: 57.0, head_circ_cm: 38.2, weight_percentile: 45, height_percentile: 50 },
    { id: 'gro-4', baby_id: MOCK_BABY_ID, record_date: '2026-05-15', age_months: 3, weight_kg: 6.00, height_cm: 61.2, head_circ_cm: 39.8, weight_percentile: 47, height_percentile: 55 },
    { id: 'gro-5', baby_id: MOCK_BABY_ID, record_date: '2026-06-03', age_months: 4, weight_kg: 6.80, height_cm: 64.0, head_circ_cm: 41.2, weight_percentile: 45, height_percentile: 50 }
  ],
  development_milestones: [
    { id: 'mil-1', baby_id: MOCK_BABY_ID, category: 'Motor', milestone_name: 'Sostiene la cabeza erguida', target_age_months: 3, status: 'achieved', achieved_date: '2026-05-10' },
    { id: 'mil-2', baby_id: MOCK_BABY_ID, category: 'Social', milestone_name: 'Sonrisa social espontánea', target_age_months: 2, status: 'achieved', achieved_date: '2026-03-28' },
    { id: 'mil-3', baby_id: MOCK_BABY_ID, category: 'Lenguaje', milestone_name: 'Balbucea sonidos vocálicos', target_age_months: 4, status: 'achieved', achieved_date: '2026-05-25' },
    { id: 'mil-4', baby_id: MOCK_BABY_ID, category: 'Motor', milestone_name: 'Se voltea boca arriba/abajo', target_age_months: 5, status: 'pending' },
    { id: 'mil-5', baby_id: MOCK_BABY_ID, category: 'Cognitivo', milestone_name: 'Sujeta y agita objetos', target_age_months: 4, status: 'achieved', achieved_date: '2026-06-01' }
  ],
  messages: [
    { id: 'msg-1', sender_id: MOCK_MOTHER_ID, receiver_id: MOCK_OBSTETRICIAN_ID, content: 'Hola Dra. Ana, he tenido unos dolores lumbares leves por las tardes. ¿Es normal?', created_at: '2026-06-02T14:30:00Z' },
    { id: 'msg-2', sender_id: MOCK_OBSTETRICIAN_ID, receiver_id: MOCK_MOTHER_ID, content: 'Hola María. Sí, es totalmente normal en la semana 28 debido al cambio en el centro de gravedad. Intenta descansar de costado con una almohada entre las rodillas y evitar estar mucho tiempo de pie. Si el dolor se vuelve intenso o regular, me avisas.', created_at: '2026-06-02T15:15:00Z' },
    { id: 'msg-3', sender_id: MOCK_MOTHER_ID, receiver_id: MOCK_PEDIATRICIAN_ID, content: 'Hola Dr. Andrés, Mateo durmió un poco más de lo habitual hoy después de la vacuna. ¿Me debo preocupar?', created_at: '2026-04-18T18:00:00Z' },
    { id: 'msg-4', sender_id: MOCK_PEDIATRICIAN_ID, receiver_id: MOCK_MOTHER_ID, content: 'Hola María. No te preocupes, el sueño prolongado es una reacción muy común tras las vacunas del segundo mes (como la Hexavalente). Vigila que no tenga fiebre alta y que tome bien el pecho cuando despierte.', created_at: '2026-04-18T19:22:00Z' }
  ],
  doctor_patient_links: [
    { id: 'link-1', doctor_id: MOCK_OBSTETRICIAN_ID, mother_id: MOCK_MOTHER_ID, link_code: 'OB-ANA-28', status: 'active' },
    { id: 'link-2', doctor_id: MOCK_PEDIATRICIAN_ID, mother_id: MOCK_MOTHER_ID, baby_id: MOCK_BABY_ID, link_code: 'PE-AND-04', status: 'active' }
  ],
  notifications: [
    { id: 'not-1', user_id: MOCK_MOTHER_ID, title: 'Próxima Vacuna Recomendada', content: 'Mateo tiene pendiente la segunda dosis de la vacuna Rotavirus.', type: 'appointment', created_at: '2026-06-03T09:00:00Z' },
    { id: 'not-2', user_id: MOCK_OBSTETRICIAN_ID, title: 'Nueva Paciente Vinculada', content: 'María López se ha vinculado a tu consulta.', type: 'system', created_at: '2026-05-01T10:00:00Z' }
  ],
  subscriptions: [
    {
      id: 'sub-1',
      user_id: MOCK_MOTHER_ID,
      plan_name: 'premium_monthly',
      status: 'active',
      price_paid: 19.99,
      payment_status: 'paid',
      start_date: '2026-05-15T00:00:00Z',
      end_date: '2026-06-15T00:00:00Z',
      created_at: '2026-05-15T00:00:00Z'
    },
    {
      id: 'sub-2',
      user_id: MOCK_OBSTETRICIAN_ID,
      plan_name: 'free',
      status: 'active',
      price_paid: 0.00,
      payment_status: 'paid',
      start_date: '2026-01-01T00:00:00Z',
      end_date: '2030-12-31T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'sub-3',
      user_id: MOCK_PEDIATRICIAN_ID,
      plan_name: 'premium_yearly',
      status: 'past_due',
      price_paid: 149.99,
      payment_status: 'unpaid',
      start_date: '2025-05-01T00:00:00Z',
      end_date: '2026-05-01T00:00:00Z',
      created_at: '2025-05-01T00:00:00Z'
    }
  ],
  audit_logs: [
    { id: 'log-1', user_id: MOCK_MOTHER_ID, event: 'Inicio de sesión exitoso', ip_address: '186.22.94.101', user_agent: 'Chrome/124.0.0.0 (Windows 11)', created_at: '2026-06-03T10:00:00Z', is_suspicious: false },
    { id: 'log-2', user_id: MOCK_OBSTETRICIAN_ID, event: 'Acceso a expediente médico (Embarazo María López)', ip_address: '200.45.112.5', user_agent: 'Safari/17.4 (macOS Sonoma)', created_at: '2026-06-03T11:15:00Z', is_suspicious: false },
    { id: 'log-3', email: 'admin@pharmasync.com', event: 'Intento fallido de inicio de sesión (Contraseña incorrecta)', ip_address: '45.155.205.12', user_agent: 'Firefox/120.0 (Linux)', created_at: '2026-06-03T14:22:00Z', is_suspicious: true },
    { id: 'log-4', user_id: MOCK_ADMIN_ID, event: 'Inicio de sesión exitoso', ip_address: '190.16.200.45', user_agent: 'Chrome/124.0.0.0 (Windows 11)', created_at: '2026-06-03T15:00:00Z', is_suspicious: false },
    { id: 'log-5', user_id: MOCK_MOTHER_ID, event: 'Cambio de información de contacto de emergencia', ip_address: '186.22.94.101', user_agent: 'Chrome/124.0.0.0 (Windows 11)', created_at: '2026-06-03T16:30:00Z', is_suspicious: false },
    { id: 'log-6', email: 'maria@gmail.com', event: 'Inicio de sesión bloqueado (IP inusual en el extranjero)', ip_address: '82.102.23.99', user_agent: 'Edge/123.0 (Android)', created_at: '2026-06-03T18:45:00Z', is_suspicious: true }
  ],
  support_tickets: [
    {
      id: 'tick-1',
      user_id: MOCK_MOTHER_ID,
      user_name: 'María López',
      user_email: 'maria@gmail.com',
      subject: 'Problema al registrar segundo hijo',
      description: 'Hola, intento agregar el perfil de mi segundo bebé pero no me deja cargar la fecha de nacimiento anterior al año pasado. ¿Me pueden ayudar?',
      status: 'open',
      created_at: '2026-06-02T09:00:00Z',
      replies: [
        { sender: 'María López', content: 'Quedo atenta, gracias.', created_at: '2026-06-02T09:00:00Z' }
      ]
    },
    {
      id: 'tick-2',
      user_id: MOCK_OBSTETRICIAN_ID,
      user_name: 'Dra. Ana Rodríguez',
      user_email: 'dra.ana@pharmasync.com',
      subject: 'Error al subir reporte de ultrasonido PDF',
      description: 'El sistema me arrojó un error de red al intentar adjuntar una ecografía morfológica de 15MB. ¿Hay un límite de tamaño?',
      status: 'resolved',
      assigned_to: MOCK_ADMIN_ID,
      created_at: '2026-05-30T10:15:00Z',
      replies: [
        { sender: 'Dra. Ana Rodríguez', content: 'Adjunto el error de red.', created_at: '2026-05-30T10:15:00Z' },
        { sender: 'Admin Juan', content: 'Estimada Dra. Ana, el límite actual por archivo es de 10MB para optimizar el storage. Hemos ampliado temporalmente su perfil para permitir hasta 25MB.', created_at: '2026-05-30T14:00:00Z' },
        { sender: 'Dra. Ana Rodríguez', content: 'Excelente, ya pude subirlo. Muchas gracias.', created_at: '2026-05-30T15:30:00Z' }
      ]
    },
    {
      id: 'tick-3',
      user_id: 'doctor-pedro-111',
      user_name: 'Dr. Pedro Gómez',
      user_email: 'dr.pedro@pharmasync.com',
      subject: 'Consulta sobre el proceso de validación',
      description: 'Hola, cargué mis credenciales hace 24 horas y sigo en estado pendiente. Necesito empezar a atender a mis pacientes.',
      status: 'open',
      assigned_to: MOCK_ADMIN_ID,
      created_at: '2026-06-03T19:30:00Z',
      replies: [
        { sender: 'Dr. Pedro Gómez', content: 'Por favor revisar mi solicitud, adjunté mi exequátur.', created_at: '2026-06-03T19:30:00Z' }
      ]
    }
  ],
  cms_articles: [
    {
      id: 'art-1',
      title: 'Náuseas en el Embarazo: Consejos y Remedios Naturales',
      category: 'Pregnancy',
      tags: ['Nutrición', 'Primer Trimestre', 'Bienestar'],
      content: 'Las náuseas matutinas afectan a más del 70% de las embarazadas. Consumir pequeñas porciones de comida frecuentemente, agregar jengibre a tus infusiones y mantenerte hidratada son claves fundamentales para aliviar los síntomas de forma segura.',
      status: 'published',
      author: 'Dra. Ana Rodríguez',
      created_at: '2026-05-15T08:00:00Z'
    },
    {
      id: 'art-2',
      title: 'Hitos del Desarrollo en Bebés de 0 a 6 Meses',
      category: 'Pediatric',
      tags: ['Hitos', 'Crecimiento', 'Estimulación'],
      content: 'Durante los primeros meses de vida, tu bebé experimenta saltos cognitivos y motores asombrosos: la sonrisa social a los 2 meses, el sostén cefálico a los 3 meses y el voltearse por sí solo alrededor de los 5 meses.',
      status: 'published',
      author: 'Dr. Andrés Pérez',
      created_at: '2026-05-20T10:00:00Z'
    },
    {
      id: 'art-3',
      title: 'Importancia del Control de Presión Arterial Prenatal',
      category: 'Prenatal',
      tags: ['Salud Vascular', 'Preeclampsia', 'Seguridad'],
      content: 'El control regular de la tensión arterial en las consultas obstetricias es vital para prevenir y detectar a tiempo cuadros de preeclampsia, cuidando tanto la salud materna como el flujo sanguíneo de la placenta.',
      status: 'draft',
      author: 'Dra. Ana Rodríguez',
      created_at: '2026-06-01T12:00:00Z'
    }
  ],
  hipaa_consent_logs: [
    { id: 'con-1', user_id: MOCK_MOTHER_ID, user_name: 'María López', consent_type: 'Políticas de Privacidad Médica y HIPAA v2.1', version: '2.1', ip_address: '186.22.94.101', accepted_at: '2026-05-15T00:05:00Z' },
    { id: 'con-2', user_id: MOCK_OBSTETRICIAN_ID, user_name: 'Dra. Ana Rodríguez', consent_type: 'Acuerdo de Socio Comercial (BAA) de Custodia de Datos', version: '1.0', ip_address: '200.45.112.5', accepted_at: '2026-01-01T00:10:00Z' },
    { id: 'con-3', user_id: MOCK_PEDIATRICIAN_ID, user_name: 'Dr. Andrés Pérez', consent_type: 'Acuerdo de Socio Comercial (BAA) de Custodia de Datos', version: '1.0', ip_address: '200.45.112.9', accepted_at: '2026-01-01T00:12:00Z' }
  ],
  privacy_requests: [
    { id: 'req-1', user_id: MOCK_MOTHER_ID, user_name: 'María López', user_email: 'maria@gmail.com', request_type: 'export', status: 'completed', created_at: '2026-05-28T14:00:00Z' },
    { id: 'req-2', user_id: 'user-mock-1700000000000', user_name: 'Usuario Inactivo', user_email: 'inactive-user@gmail.com', request_type: 'delete', status: 'pending', created_at: '2026-06-02T16:00:00Z' }
  ],
  ai_usage_stats: [
    { id: 'ai-1', user_name: 'María López', model: 'gpt-4o', tokens_prompt: 350, tokens_completion: 120, cost_usd: 0.00355, timestamp: '2026-06-03T20:10:00Z' },
    { id: 'ai-2', user_name: 'Dra. Ana Rodríguez', model: 'claude-3-5-sonnet', tokens_prompt: 1200, tokens_completion: 450, cost_usd: 0.01035, timestamp: '2026-06-03T20:25:00Z' },
    { id: 'ai-3', user_name: 'Dr. Andrés Pérez', model: 'claude-3-5-sonnet', tokens_prompt: 2200, tokens_completion: 800, cost_usd: 0.01860, timestamp: '2026-06-03T20:50:00Z' },
    { id: 'ai-4', user_name: 'María López', model: 'gpt-4o', tokens_prompt: 600, tokens_completion: 300, cost_usd: 0.00750, timestamp: '2026-06-03T21:10:00Z' }
  ],
  professional_documents: [
    {
      id: 'doc-pedro-id-front',
      doctor_id: 'doctor-pedro-111',
      type: 'id_front',
      file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/pedro-id-front.jpg',
      status: 'pending',
      created_at: '2026-06-03T19:30:00Z'
    },
    {
      id: 'doc-pedro-id-back',
      doctor_id: 'doctor-pedro-111',
      type: 'id_back',
      file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/pedro-id-back.jpg',
      status: 'pending',
      created_at: '2026-06-03T19:30:00Z'
    },
    {
      id: 'doc-pedro-degree',
      doctor_id: 'doctor-pedro-111',
      type: 'degree',
      file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/pedro-degree.pdf',
      status: 'pending',
      created_at: '2026-06-03T19:30:00Z'
    },
    {
      id: 'doc-pedro-exequatur',
      doctor_id: 'doctor-pedro-111',
      type: 'exequatur',
      file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/pedro-exequatur.pdf',
      status: 'pending',
      created_at: '2026-06-03T19:30:00Z'
    }
  ],
  mother_documents: [],
  prescriptions: [
    {
      id: 'pres-1',
      doctor_id: MOCK_OBSTETRICIAN_ID,
      mother_id: MOCK_MOTHER_ID,
      diagnosis: 'Control prenatal de rutina, anemia gestacional leve.',
      is_controlled: false,
      status: 'active',
      code: 'REC-2849201',
      expiry_date: '2026-09-01T00:00:00Z',
      created_at: '2026-06-02T10:00:00Z',
      doctor_name: 'Dra. Ana Rodríguez',
      doctor_specialty: 'Obstetricia',
      doctor_exequatur: 'EQ-28492',
      doctor_address: 'Av. Santa Fe 2340, Consultorio 4B, CABA',
      doctor_phone: '+54 9 11 4444-1111',
      patient_name: 'María López',
      patient_age: 28,
      patient_allergies: 'Penicilina',
      items: [
        {
          generic_name: 'Hierro Aminoquelado',
          commercial_name: 'Ferinsol',
          concentration: '30 mg',
          pharmaceutical_form: 'Cápsulas',
          presentation: 'Caja con 30 cápsulas',
          dose: '1 cápsula',
          route: 'Vía oral',
          frequency: 'Cada 24 horas',
          duration: '30 días',
          quantity: 1,
          instructions: 'Tomar en ayunas con jugo de naranja para mejorar la absorción. Evitar lácteos 2 horas antes y después.'
        },
        {
          generic_name: 'Ácido Fólico',
          concentration: '1 mg',
          pharmaceutical_form: 'Tabletas',
          presentation: 'Frasco con 90 tabletas',
          dose: '1 tableta',
          route: 'Vía oral',
          frequency: 'Cada 24 horas',
          duration: '90 días',
          quantity: 1,
          instructions: 'Tomar preferiblemente a la misma hora todos los días.'
        }
      ]
    }
  ]
};

const STORAGE_KEY = 'pharmasync_mock_db';

export function getMockDb(): MockDatabase {
  if (typeof window === 'undefined') return initialDb;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
    return initialDb;
  }
  try {
    const parsed = JSON.parse(stored) as MockDatabase;
    let modified = false;
    
    // Dynamically merge missing records (by id) from initialDb to parsed database
    const keys = Object.keys(initialDb) as Array<keyof MockDatabase>;
    for (const key of keys) {
      if (!parsed[key]) {
        parsed[key] = initialDb[key] as any;
        modified = true;
      } else if (Array.isArray(parsed[key])) {
        const initialArray = initialDb[key] as any[];
        const parsedArray = parsed[key] as any[];
        
        for (const item of initialArray) {
          if (item && typeof item === 'object' && 'id' in item) {
            const exists = parsedArray.some(pItem => pItem && pItem.id === item.id);
            if (!exists) {
              parsedArray.push(item);
              modified = true;
            }
          }
        }
      }
    }

    // Auto-heal/sync default seeded accounts for consistent prototype testing
    const approvedProfileIds = [MOCK_MOTHER_ID, MOCK_OBSTETRICIAN_ID, MOCK_PEDIATRICIAN_ID, MOCK_ADMIN_ID];
    for (const p of parsed.profiles) {
      if (approvedProfileIds.includes(p.id) && p.status !== 'approved') {
        p.status = 'approved';
        modified = true;
      }
    }

    const anaDoc = parsed.doctors.find(d => d.id === MOCK_OBSTETRICIAN_ID);
    if (anaDoc) {
      if (anaDoc.verification_status !== 'approved' || !anaDoc.exequatur || !anaDoc.colegiatura) {
        anaDoc.verification_status = 'approved';
        anaDoc.exequatur = 'EQ-28492';
        anaDoc.colegiatura = 'CMD-94827';
        modified = true;
      }
    }

    const andresDoc = parsed.doctors.find(d => d.id === MOCK_PEDIATRICIAN_ID);
    if (andresDoc) {
      if (andresDoc.verification_status !== 'approved' || !andresDoc.exequatur || !andresDoc.colegiatura) {
        andresDoc.verification_status = 'approved';
        andresDoc.exequatur = 'EQ-94829';
        andresDoc.colegiatura = 'CMD-85731';
        modified = true;
      }
    }
    
    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return parsed;
  } catch (e) {
    return initialDb;
  }
}

export function saveMockDb(db: MockDatabase) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving mockDb to localStorage:', e);
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert('Se superó la cuota de almacenamiento del navegador (localStorage). Por favor, intenta subir una imagen de menor tamaño o limpia los datos de tu navegador.');
    }
  }
}

// Helper methods to query and mutate
export function getActivePregnancy(motherId: string): Pregnancy | null {
  const db = getMockDb();
  return db.pregnancies.find(p => p.mother_id === motherId && p.status === 'active') || null;
}

export function getBabies(motherId: string): Baby[] {
  const db = getMockDb();
  return db.babies.filter(b => b.mother_id === motherId);
}

export function getDoctorDetails(doctorId: string): Doctor | null {
  const db = getMockDb();
  return db.doctors.find(d => d.id === doctorId) || null;
}

export function getProfile(id: string): Profile | null {
  const db = getMockDb();
  return db.profiles.find(p => p.id === id) || null;
}
