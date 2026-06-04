-- Database Migration v4: Production Grade HealthTech Upgrade (HIPAA, GDPR, SaaS & Advanced Clinical Records)
-- Target: Supabase PostgreSQL Database Schema

-- Custom Types
CREATE TYPE public.prescription_status AS ENUM ('activa', 'expirada', 'cancelada', 'dispensada');
CREATE TYPE public.saas_plan AS ENUM ('madre_basico', 'madre_premium', 'doc_basico', 'doc_pro', 'clinica', 'hospital', 'enterprise');
CREATE TYPE public.appointment_state AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.doc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended');
CREATE TYPE public.attachment_type AS ENUM ('image', 'pdf', 'audio');

-- ==========================================
-- 1. CLINICAL HISTORIES (Fase 1)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clinical_histories (
  id uuid PRIMARY KEY REFERENCES public.mothers(id) ON DELETE CASCADE,
  -- Antecedentes Personales
  has_diabetes boolean DEFAULT false NOT NULL,
  has_hypertension boolean DEFAULT false NOT NULL,
  has_asthma boolean DEFAULT false NOT NULL,
  has_heart_disease boolean DEFAULT false NOT NULL,
  has_autoimmune boolean DEFAULT false NOT NULL,
  chronic_illnesses text,
  past_surgeries text,
  past_hospitalizations text,
  allergies text,
  permanent_medications text,
  -- Antecedentes Familiares
  fam_diabetes boolean DEFAULT false NOT NULL,
  fam_hypertension boolean DEFAULT false NOT NULL,
  fam_cancer boolean DEFAULT false NOT NULL,
  fam_genetic_diseases text,
  fam_cardiovascular boolean DEFAULT false NOT NULL,
  -- Antecedentes Obstétricos
  past_pregnancies integer DEFAULT 0 NOT NULL,
  past_abortions integer DEFAULT 0 NOT NULL,
  past_c_sections integer DEFAULT 0 NOT NULL,
  past_vaginal_births integer DEFAULT 0 NOT NULL,
  past_ectopic_pregnancies integer DEFAULT 0 NOT NULL,
  obstetric_complications text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.clinical_histories ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. PRESCRIPTIONS EXPANSION (Fase 2)
-- ==========================================
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS uuid uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS validation_code text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS status public.prescription_status DEFAULT 'activa'::public.prescription_status NOT NULL;

CREATE TABLE IF NOT EXISTS public.prescription_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  verified_by text NOT NULL, -- e.g., Farmacia X
  ip_address text NOT NULL,
  verified_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.prescription_verifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.prescription_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL, -- e.g., 'created', 'cancelled', 'dispensada'
  previous_state jsonb,
  new_state jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.prescription_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. GLOBAL AUDIT LOGS (Fase 3)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_role text NOT NULL,
  ip_address text NOT NULL,
  action text NOT NULL,
  table_affected text NOT NULL,
  record_id text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. PROFESSIONAL VALIDATION (Fase 4)
-- ==========================================
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS cedula text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS subspecialty text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS university text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS status public.doc_status DEFAULT 'pending'::public.doc_status NOT NULL;

CREATE TABLE IF NOT EXISTS public.doctor_verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status public.doc_status NOT NULL,
  new_status public.doc_status NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.doctor_verification_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. APPOINTMENTS SYSTEM EXPANSION (Fase 5)
-- ==========================================
-- Add status if not existing
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status_new public.appointment_state DEFAULT 'pending'::public.appointment_state NOT NULL;

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  send_date timestamp with time zone NOT NULL,
  type text NOT NULL CHECK (type IN ('sms', 'email')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'failed'))
);

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.appointment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  notes text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. SECURE MESSAGING EXPANSION (Fase 6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.message_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  read_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type public.attachment_type NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL, -- in bytes
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. MEDICAL AI ASSISTANT EXPANSION (Fase 7)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  tokens_prompt integer NOT NULL,
  tokens_completion integer NOT NULL,
  cost_usd decimal(10,4) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_risk_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id uuid REFERENCES public.pregnancies(id) ON DELETE CASCADE,
  baby_id uuid REFERENCES public.babies(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  trigger_reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_patient_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  summary_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_patient_summaries ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. SAAS SUBSCRIPTIONS EXPANSION (Fase 8)
-- ==========================================
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_type public.saas_plan DEFAULT 'madre_basico'::public.saas_plan NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS patient_limit integer;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS document_limit integer;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS ai_limit integer;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS storage_limit integer; -- in Megabytes

-- ==========================================
-- 9. NEONATAL MODULE (Fase 9)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.newborn_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
  pregnancy_id uuid REFERENCES public.pregnancies(id) ON DELETE CASCADE,
  apgar_1min integer CHECK (apgar_1min >= 0 AND apgar_1min <= 10),
  apgar_5min integer CHECK (apgar_5min >= 0 AND apgar_5min <= 10),
  birth_weight_grams integer NOT NULL,
  birth_height_cm decimal(5,2) NOT NULL,
  head_circumference_cm decimal(5,2),
  complications text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.newborn_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.newborn_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newborn_id uuid REFERENCES public.newborn_records(id) ON DELETE CASCADE NOT NULL,
  test_name text NOT NULL, -- e.g., 'Metabólico', 'Auditivo', 'Visual'
  result text NOT NULL,
  notes text,
  test_date date DEFAULT current_date NOT NULL
);

ALTER TABLE public.newborn_screenings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.newborn_vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newborn_id uuid REFERENCES public.newborn_records(id) ON DELETE CASCADE NOT NULL,
  vaccine_name text NOT NULL, -- e.g., 'BCG', 'Hepatitis B'
  applied_date date DEFAULT current_date NOT NULL,
  lot_number text
);

ALTER TABLE public.newborn_vaccines ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. HIPAA & SECURITY ACCESS LOGS (Fase 11)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  accessed_table text NOT NULL,
  accessed_record_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
  revoked_at timestamp with time zone
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- e.g., 'failed_login', 'unauthorized_access', 'hipaa_violation_attempt'
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- RLS SECURITY POLICIES FOR NEW TABLES
-- ==========================================

-- clinical_histories
CREATE POLICY "Clinical histories access for mothers" ON public.clinical_histories
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Clinical histories read for active doctors" ON public.clinical_histories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = clinical_histories.id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Clinical histories write for active doctors" ON public.clinical_histories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = clinical_histories.id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Clinical histories insert for active doctors" ON public.clinical_histories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = clinical_histories.id AND dpl.status = 'active'
    )
  );

-- audit_logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins with auditor role can read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- newborn_records
CREATE POLICY "Newborn access for mothers" ON public.newborn_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = newborn_records.baby_id AND b.mother_id = auth.uid()
    )
  );

CREATE POLICY "Newborn access for doctors" ON public.newborn_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = newborn_records.baby_id AND b.pediatrician_id = auth.uid()
    )
  );

-- access_logs
CREATE POLICY "Admins can view access logs" ON public.access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can record access logs" ON public.access_logs
  FOR INSERT WITH CHECK (true);

-- doctor_verification_history
CREATE POLICY "Admins can manage verification history" ON public.doctor_verification_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Doctors can read own verification history" ON public.doctor_verification_history
  FOR SELECT USING (doctor_id = auth.uid());
