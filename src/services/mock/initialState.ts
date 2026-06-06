import { 
  Profile, Mother, Doctor, Pregnancy, Baby, Appointment, 
  PrenatalVisit, PediatricVisit, LabResult, UltrasoundResult, 
  Symptom, VitalSign, Prescription, ClinicalHistory, NewbornRecord, 
  NewbornScreening, NewbornVaccine, AuditLog,
  SaaSSubscription, CmsArticle, ProfessionalDoc, PrivacyRequest,
  HipaaConsentLog, SupportTicket, MotherDoc, BabyVaccine,
  DevelopmentMilestone, GrowthRecord, AIInteraction, AIRiskAlert,
  AccessLog, SecurityEvent, UserSession, DoctorPatientLink, Message,
  Vaccine
} from '@/types/database';

export const MOCK_MOTHER_ID = 'mother-maria-123';
export const MOCK_OBSTETRICIAN_ID = 'doctor-ana-456';
export const MOCK_PEDIATRICIAN_ID = 'doctor-pedro-111';
export const MOCK_ADMIN_ID = 'admin-super-999';

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
  notifications: unknown[];
  support_tickets: SupportTicket[];
  cms_articles: CmsArticle[];
  professional_documents: ProfessionalDoc[];
  mother_documents: MotherDoc[];
  prescriptions: Prescription[];
  // New tables for production upgrade
  clinical_histories: ClinicalHistory[];
  prescription_verifications: unknown[];
  prescription_audit_logs: unknown[];
  audit_logs: AuditLog[];
  doctor_verification_history: unknown[];
  appointment_reminders: unknown[];
  appointment_notes: unknown[];
  message_read_status: unknown[];
  message_attachments: unknown[];
  ai_interactions: AIInteraction[];
  ai_risk_alerts: AIRiskAlert[];
  ai_patient_summaries: unknown[];
  newborn_records: NewbornRecord[];
  newborn_screenings: NewbornScreening[];
  newborn_vaccines: NewbornVaccine[];
  access_logs: AccessLog[];
  user_sessions: UserSession[];
  security_events: SecurityEvent[];
  privacy_requests: PrivacyRequest[];
  hipaa_consent_logs: HipaaConsentLog[];
  subscriptions: SaaSSubscription[];
}

export const initialDb: MockDatabase = {
  profiles: [
    { id: MOCK_MOTHER_ID, email: 'maria@vitarahealth.com', full_name: 'María López', role: 'mother', status: 'approved', phone: '+1 809-555-0101', password: '123456' },
    { id: MOCK_OBSTETRICIAN_ID, email: 'ana.rodriguez@vitarahealth.com', full_name: 'Dra. Ana Rodríguez', role: 'obstetrician', status: 'approved', phone: '+1 809-555-0202', password: '123456' },
    { id: MOCK_PEDIATRICIAN_ID, email: 'andres.pediatra@vitarahealth.com', full_name: 'Dr. Andrés Pérez', role: 'pediatrician', status: 'approved', phone: '+1 809-555-0303', password: '123456' },
    { id: MOCK_ADMIN_ID, email: 'admin@vitarahealth.com', full_name: 'Admin Vitara Health', role: 'admin', status: 'approved', phone: '+1 809-555-9999', password: '123456' }
  ],
  mothers: [
    { id: MOCK_MOTHER_ID, phone: '+1 809-555-0101', birth_date: '1998-05-15', emergency_contact_name: 'Juan López', emergency_contact_phone: '+1 809-555-0199', blood_type: 'O+', allergies: 'Penicilina' }
  ],
  doctors: [
    { id: MOCK_OBSTETRICIAN_ID, license_number: 'LIC-OB-94829', specialty: 'obstetrician', phone: '+1 809-555-0202', clinic_address: 'Hosp. Metropolitano Santiago (HOMS), Suite 402', consultation_hours: 'Lun-Vie 9:00 AM - 4:00 PM', verification_status: 'approved', exequatur: 'EQ-94829', colegiatura: 'CMD-85731', university: 'UNIBE', graduation_year: 2012 },
    { id: MOCK_PEDIATRICIAN_ID, license_number: 'LIC-PE-83719', specialty: 'pediatrician', phone: '+1 809-555-0303', clinic_address: 'Hosp. Metropolitano Santiago (HOMS), Suite 405', consultation_hours: 'Lun-Vie 8:00 AM - 2:00 PM', verification_status: 'approved', exequatur: 'EQ-83719', colegiatura: 'CMD-92841', university: 'UASD', graduation_year: 2010 }
  ],
  pregnancies: [
    { id: 'preg-maria-active', mother_id: MOCK_MOTHER_ID, obstetrician_id: MOCK_OBSTETRICIAN_ID, status: 'active', last_menstrual_period: '2025-11-20', estimated_due_date: '2026-08-27', weeks_gestation_offset: 0 }
  ],
  babies: [
    { id: 'baby-mateo-999', mother_id: MOCK_MOTHER_ID, pediatrician_id: MOCK_PEDIATRICIAN_ID, pregnancy_id: 'preg-maria-past', name: 'Mateo López', birth_date: '2026-02-10', birth_time: '14:30', birth_weight_grams: 3250, birth_height_cm: 50, birth_head_circ_cm: 34.5, gender: 'Masculino', blood_type: 'O+', allergies: 'Ninguna' }
  ],
  appointments: [
    { id: 'appt-1', doctor_id: MOCK_OBSTETRICIAN_ID, mother_id: MOCK_MOTHER_ID, appointment_date: '2026-06-15T10:00:00Z', status: 'confirmed', reason: 'Control Prenatal - Semana 30' },
    { id: 'appt-2', doctor_id: MOCK_PEDIATRICIAN_ID, mother_id: MOCK_MOTHER_ID, baby_id: 'baby-mateo-999', appointment_date: '2026-06-20T11:00:00Z', status: 'pending', reason: 'Control Pediátrico 4 Meses' }
  ],
  prenatal_visits: [
    { id: 'pv-1', pregnancy_id: 'preg-maria-active', visit_date: '2026-05-15', gestational_week: 25, mother_weight_kg: 68.5, blood_pressure: '110/70', fetal_heart_rate_bpm: 142, notes: 'Desarrollo fetal normal. Presión arterial controlada.', recommendations: 'Continuar con ácido fólico y hierro. Caminata diaria de 30 minutos.' }
  ],
  pediatric_visits: [
    { id: 'pedv-1', baby_id: 'baby-mateo-999', visit_date: '2026-04-10', weight_kg: 5.8, height_cm: 60.5, head_circ_cm: 38.2, development_status: 'Reflejos normales. Sigue objetos con la mirada.', notes: 'Bebé saludable.', recommendations: 'Lactancia materna exclusiva. Baños de sol por la mañana.' }
  ],
  lab_results: [
    { id: 'lab-1', pregnancy_id: 'preg-maria-active', test_name: 'Hemograma Completo', test_date: '2026-04-20', result_summary: 'Hemoglobina: 11.5 g/dL (Normal)', is_normal: true }
  ],
  ultrasound_results: [
    { id: 'ultra-1', pregnancy_id: 'preg-maria-active', scan_date: '2026-04-25', gestational_week: 22, findings: 'Feto único, activo. Frecuencia cardíaca: 145 bpm. Placenta anterior.', file_url: 'https://vitarahealth-demo.s3.amazonaws.com/ultrasounds/scan1.jpg' }
  ],
  symptoms: [
    { id: 'sym-1', pregnancy_id: 'preg-maria-active', symptom_name: 'Náuseas matutinas', intensity: 'Medio', log_date: '2026-06-03', notes: 'Leve mareo al despertar' }
  ],
  vital_signs: [
    { id: 'vit-1', pregnancy_id: 'preg-maria-active', weight_kg: 69.2, systolic_bp: 112, diastolic_bp: 72, log_date: '2026-06-03' }
  ],
  vaccines: [
    { id: 'vac-1', name: 'BCG', target_disease: 'Tuberculosis', recommended_age_months: 0 },
    { id: 'vac-2', name: 'Rotavirus (Dosis 1)', target_disease: 'Diarrea por rotavirus', recommended_age_months: 2 },
    { id: 'vac-3', name: 'Poliomielitis (Dosis 1)', target_disease: 'Poliomielitis', recommended_age_months: 2 }
  ],
  baby_vaccines: [
    { id: 'bvac-1', baby_id: 'baby-mateo-999', vaccine_id: 'vac-1', status: 'applied', applied_date: '2026-02-10', lot_number: 'BCG-992A' },
    { id: 'bvac-2', baby_id: 'baby-mateo-999', vaccine_id: 'vac-2', status: 'pending' }
  ],
  growth_records: [
    { id: 'gro-1', baby_id: 'baby-mateo-999', record_date: '2026-02-10', age_months: 0, weight_kg: 3.25, height_cm: 50.0, head_circ_cm: 34.5, weight_percentile: 50, height_percentile: 50 }
  ],
  development_milestones: [
    { id: 'dm-1', baby_id: 'baby-mateo-999', milestone_name: 'Sostiene la cabeza brevemente', category: 'Motor', target_age_months: 2, status: 'achieved', achieved_date: '2026-04-12' },
    { id: 'dm-2', baby_id: 'baby-mateo-999', milestone_name: 'Sonríe socialmente', category: 'Social', target_age_months: 2, status: 'achieved', achieved_date: '2026-04-10' }
  ],
  messages: [
    { id: 'msg-1', sender_id: MOCK_MOTHER_ID, receiver_id: MOCK_OBSTETRICIAN_ID, content: 'Hola Dra. Ana, he sentido un leve dolor de cabeza hoy.', created_at: '2026-06-03T18:00:00Z' },
    { id: 'msg-2', sender_id: MOCK_OBSTETRICIAN_ID, receiver_id: MOCK_MOTHER_ID, content: 'Hola María. Asegúrate de descansar, toma suficiente agua y mide tu presión. Escríbeme si sube de 130/80.', created_at: '2026-06-03T18:15:00Z' }
  ],
  doctor_patient_links: [
    { id: 'link-ob-1', doctor_id: MOCK_OBSTETRICIAN_ID, mother_id: MOCK_MOTHER_ID, status: 'active', created_at: '2026-05-01T10:00:00Z' },
    { id: 'link-pe-1', doctor_id: MOCK_PEDIATRICIAN_ID, mother_id: MOCK_MOTHER_ID, status: 'active', created_at: '2026-05-01T10:00:00Z' }
  ],
  notifications: [
    { id: 'not-1', user_id: MOCK_MOTHER_ID, title: 'Próxima Cita Médica', content: 'Tienes una cita con la Dra. Ana Rodríguez el 15 de junio.', type: 'appointment', created_at: '2026-06-03T08:00:00Z' }
  ],
  support_tickets: [
    { id: 'tick-1', user_id: MOCK_MOTHER_ID, user_name: 'María López', user_email: 'maria@vitarahealth.com', subject: 'Problema al subir ecografía', description: 'El portal da error cuando intento subir un archivo de 8MB.', status: 'open', created_at: '2026-06-03T12:00:00Z', replies: [] }
  ],
  cms_articles: [
    { id: 'art-1', title: 'Alimentación saludable en el tercer trimestre', category: 'Pregnancy', tags: ['Alimentación', 'Nutrición'], content: 'Es fundamental el consumo de hierro y calcio...', status: 'published', author: 'Dra. Ana Rodríguez', created_at: '2026-06-01T09:00:00Z' }
  ],
  professional_documents: [
    { id: 'pdoc-1', doctor_id: MOCK_OBSTETRICIAN_ID, type: 'exequatur', file_url: 'https://vitarahealth-demo.s3.amazonaws.com/docs/exequatur-ana.pdf', status: 'approved', created_at: '2026-05-01T10:00:00Z' }
  ],
  mother_documents: [],
  prescriptions: [
    { id: 'pres-1', doctor_id: MOCK_OBSTETRICIAN_ID, mother_id: MOCK_MOTHER_ID, diagnosis: 'Control prenatal de rutina, anemia gestacional leve.', is_controlled: false, code: 'REC-2849201', expiry_date: '2026-09-01T00:00:00Z', created_at: '2026-06-02T10:00:00Z', doctor_name: 'Dra. Ana Rodríguez', doctor_specialty: 'Obstetricia', doctor_exequatur: 'EQ-94829', doctor_address: 'Hosp. Metropolitano Santiago (HOMS), Suite 402', doctor_phone: '+1 809-555-0202', patient_name: 'María López', patient_age: 28, patient_allergies: 'Penicilina', items: [{ generic_name: 'Hierro Aminoquelado', commercial_name: 'Ferinsol', concentration: '30 mg', pharmaceutical_form: 'Cápsulas', presentation: 'Caja con 30', dose: '1 cápsula', route: 'Vía oral', frequency: 'Cada 24 horas', duration: '30 días', quantity: 1, instructions: 'Tomar en ayunas con jugo de naranja.' }], uuid: 'd3b07384-d113-4a30-8012-bd7492c10b42', status: 'activa', validation_code: 'VLD-2849' }
  ],
  clinical_histories: [
    { id: MOCK_MOTHER_ID, has_diabetes: false, has_hypertension: false, has_asthma: true, has_heart_disease: false, has_autoimmune: false, chronic_illnesses: 'Asma bronquial controlada', permanent_medications: 'Salbutamol en aerosol en caso de crisis', past_surgeries: 'Apendicectomía (2018)', past_hospitalizations: 'Ninguna reciente', allergies: 'Penicilina', fam_diabetes: true, fam_hypertension: true, fam_cancer: false, fam_genetic_diseases: 'Ninguna conocida', fam_cardiovascular: false, past_pregnancies: 1, past_abortions: 0, past_c_sections: 0, past_vaginal_births: 1, past_ectopic_pregnancies: 0, obstetric_complications: 'Ninguna en parto previo', updated_at: '2026-06-04T12:00:00Z' }
  ],
  prescription_verifications: [],
  prescription_audit_logs: [],
  audit_logs: [],
  doctor_verification_history: [],
  appointment_reminders: [],
  appointment_notes: [],
  message_read_status: [],
  message_attachments: [],
  ai_interactions: [],
  ai_risk_alerts: [],
  ai_patient_summaries: [],
  newborn_records: [
    { id: 'newborn-mateo', baby_id: 'baby-mateo-999', pregnancy_id: 'preg-maria-past', apgar_1min: 9, apgar_5min: 10, birth_weight_grams: 3250, birth_height_cm: 50.0, head_circumference_cm: 34.5, complications: 'Ninguna', created_at: '2026-02-10T14:30:00Z' }
  ],
  newborn_screenings: [
    { id: 'scr-1', newborn_id: 'newborn-mateo', test_name: 'Tamiz Metabólico Neonatal', result: 'Normal', notes: 'Resultados negativos para hipotiroidismo y fenilcetonuria.', test_date: '2026-02-15' }
  ],
  newborn_vaccines: [
    { id: 'nvac-1', newborn_id: 'newborn-mateo', vaccine_name: 'BCG', applied_date: '2026-02-10', lot_number: 'BCG-992A' },
    { id: 'nvac-2', newborn_id: 'newborn-mateo', vaccine_name: 'Hepatitis B (Pediátrica)', applied_date: '2026-02-10', lot_number: 'HEPB-102B' }
  ],
  access_logs: [],
  user_sessions: [],
  security_events: [],
  privacy_requests: [
    { id: 'pr-1', user_id: MOCK_MOTHER_ID, user_name: 'María López', user_email: 'maria@vitarahealth.com', request_type: 'export', status: 'pending', created_at: '2026-06-04T10:00:00Z' }
  ],
  hipaa_consent_logs: [
    { id: 'hcl-1', user_id: MOCK_MOTHER_ID, user_name: 'María López', consent_type: 'HIPAA & Privacy Policy Consent', version: '1.0', ip_address: '186.6.12.45', accepted_at: '2026-05-01T08:30:00Z' },
    { id: 'hcl-2', user_id: MOCK_OBSTETRICIAN_ID, user_name: 'Dra. Ana Rodríguez', consent_type: 'HIPAA & Professional Terms Agreement', version: '1.0', ip_address: '186.6.24.11', accepted_at: '2026-05-01T09:00:00Z' }
  ],
  subscriptions: [
    { id: 'sub-maria-1', user_id: MOCK_MOTHER_ID, plan_name: 'Gratuito', plan_type: 'madre_basico', status: 'active', price_paid: 0.00, payment_status: 'paid', start_date: '2026-05-01T00:00:00Z', end_date: '2027-05-01T00:00:00Z', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' }
  ]
};
