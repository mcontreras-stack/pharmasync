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
  created_at?: string;
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
  created_at?: string;
}

export interface LabResult {
  id: string;
  pregnancy_id?: string;
  baby_id?: string;
  mother_id?: string;
  test_name: string;
  test_date: string;
  result_summary?: string;
  file_url?: string;
  is_normal: boolean;
  uploaded_by?: string;
  created_at?: string;
}

export interface UltrasoundResult {
  id: string;
  pregnancy_id: string;
  gestational_week: number;
  scan_date: string;
  file_url?: string;
  image_url?: string;
  findings?: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface ClinicalHistory {
  id: string; // matches mother_id
  // Personal
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_asthma: boolean;
  has_heart_disease: boolean;
  has_autoimmune: boolean;
  chronic_illnesses?: string;
  past_surgeries?: string;
  past_hospitalizations?: string;
  allergies?: string;
  permanent_medications?: string;
  // Family
  fam_diabetes: boolean;
  fam_hypertension: boolean;
  fam_cancer: boolean;
  fam_genetic_diseases?: string;
  fam_cardiovascular: boolean;
  // Obstetric
  past_pregnancies: number;
  past_abortions: number;
  past_c_sections: number;
  past_vaginal_births: number;
  past_ectopic_pregnancies: number;
  obstetric_complications?: string;
  updated_at: string;
}

export interface NewbornRecord {
  id: string;
  baby_id: string;
  pregnancy_id?: string;
  apgar_1min?: number;
  apgar_5min?: number;
  birth_weight_grams: number;
  birth_height_cm: number;
  head_circumference_cm?: number;
  complications?: string;
  created_at?: string;
  screenings?: {
    test_name: string;
    result: string;
    date: string;
  }[];
  vaccines?: {
    name: string;
    applied: boolean;
    date?: string;
    lot?: string;
  }[];
}

export interface NewbornScreening {
  id: string;
  newborn_id: string;
  test_name: string;
  result: string;
  notes?: string;
  test_date: string;
}

export interface NewbornVaccine {
  id: string;
  newborn_id: string;
  vaccine_name: string;
  applied_date: string;
  lot_number?: string;
}

export interface Symptom {
  id: string;
  mother_id?: string;
  pregnancy_id: string;
  symptom_name: string;
  intensity: 'Bajo' | 'Medio' | 'Alto';
  log_date?: string;
  logged_date?: string;
  notes?: string;
}

export interface VitalSign {
  id: string;
  mother_id?: string;
  baby_id?: string;
  pregnancy_id?: string;
  weight_kg?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate_bpm?: number;
  temperature_c?: number;
  log_date?: string;
  logged_date?: string;
}

export interface CmsArticle {
  id: string;
  title: string;
  category: 'Pregnancy' | 'Prenatal' | 'Pediatric' | 'General';
  tags: string[];
  content: string;
  status: 'draft' | 'published';
  author: string;
  created_at: string;
}

export interface ProfessionalDoc {
  id: string;
  doctor_id: string;
  type: 'id_front' | 'id_back' | 'degree' | 'exequatur' | 'colegiatura' | string;
  file_url: string;
  status: 'approved' | 'rejected' | 'pending';
  notes?: string;
  created_at: string;
}

export interface MotherDoc {
  id: string;
  mother_id: string;
  type: 'id_front' | 'id_back' | 'pregnancy_cert' | string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
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
  created_at?: string;
}

export interface DevelopmentMilestone {
  id: string;
  baby_id: string;
  category: string;
  milestone_name: string;
  target_age_months: number;
  achieved_date?: string;
  status: 'pending' | 'achieved' | 'delayed';
  notes?: string;
  created_at?: string;
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
  created_at?: string;
}
