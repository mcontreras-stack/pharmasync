-- Esquema Unificado para PharmaSync en Supabase
-- Este script consolida todas las migraciones (v2, v3, v4) y el esquema base.

-- Eliminar tipos y tablas existentes para una recreación limpia (solo para desarrollo/pruebas)
-- En producción, se recomienda usar ALTER TABLE para modificar el esquema existente.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

DROP TABLE IF EXISTS public.ai_usage_stats CASCADE;
DROP TABLE IF EXISTS public.privacy_requests CASCADE;
DROP TABLE IF EXISTS public.hipaa_consent_logs CASCADE;
DROP TABLE IF EXISTS public.prescription_audit_logs CASCADE;
DROP TABLE IF EXISTS public.prescription_verifications CASCADE;
DROP TABLE IF EXISTS public.prescription_items CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.doctor_patient_links CASCADE;
DROP TABLE IF EXISTS public.mother_documents CASCADE;
DROP TABLE IF EXISTS public.professional_documents CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.cms_articles CASCADE;
DROP TABLE IF EXISTS public.growth_records CASCADE;
DROP TABLE IF EXISTS public.baby_vaccines CASCADE;
DROP TABLE IF EXISTS public.vaccines CASCADE;
DROP TABLE IF EXISTS public.vital_signs CASCADE;
DROP TABLE IF EXISTS public.symptoms CASCADE;
DROP TABLE IF EXISTS public.ultrasound_results CASCADE;
DROP TABLE IF EXISTS public.lab_results CASCADE;
DROP TABLE IF EXISTS public.pediatric_visits CASCADE;
DROP TABLE IF EXISTS public.prenatal_visits CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.babies CASCADE;
DROP TABLE IF EXISTS public.pregnancies CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.mothers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.prescription_status CASCADE;
DROP TYPE IF EXISTS public.saas_plan CASCADE;
DROP TYPE IF EXISTS public.appointment_state CASCADE;
DROP TYPE IF EXISTS public.doc_status CASCADE;
DROP TYPE IF EXISTS public.attachment_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.link_status CASCADE;
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.pregnancy_status CASCADE;

-- Custom Types (Consolidado de schema.sql, v2, v4)
CREATE TYPE public.user_role AS ENUM (
    'mother',
    'obstetrician',
    'pediatrician',
    'admin'
);
CREATE TYPE public.link_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'revoked'
); -- v2 tiene 'revoked', schema.sql tiene 'active', v4 tiene 'active' en RLS. Usamos v2.
CREATE TYPE public.appointment_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
); -- De schema.sql
CREATE TYPE public.pregnancy_status AS ENUM (
    'active',
    'completed',
    'terminated'
); -- De schema.sql
CREATE TYPE public.prescription_status AS ENUM (
    'activa',
    'expirada',
    'cancelada',
    'dispensada'
); -- De v4, prioriza español
CREATE TYPE public.saas_plan AS ENUM (
    'madre_basico',
    'madre_premium',
    'doc_basico',
    'doc_pro',
    'clinica',
    'hospital',
    'enterprise'
); -- De v4
CREATE TYPE public.doc_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'suspended'
); -- De v4
CREATE TYPE public.attachment_type AS ENUM (
    'image',
    'pdf',
    'audio'
); -- De v4

-- 1. PROFILES Table (Extends Supabase Auth users) - Consolidado de schema.sql y v2
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'mother',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Campos añadidos en v2
    status text DEFAULT 'email_pending' CHECK (status IN ('email_pending', 'pending_documents', 'under_review', 'approved', 'rejected', 'suspended', 'inactive')),
    phone text,
    national_id text,
    nationality text,
    country text,
    city text,
    birth_date date
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. MOTHERS Table - De schema.sql
CREATE TABLE public.mothers (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    phone VARCHAR(50),
    birth_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10),
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mothers ENABLE ROW LEVEL SECURITY;

-- 3. PROFESSIONALS Table (Reemplaza DOCTORS de schema.sql y v2) - Consolidado de v2 y v4
-- Se prioriza 'professionals' sobre 'doctors' para consistencia con migraciones posteriores.
CREATE TABLE public.professionals (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    specialty text NOT NULL CHECK (specialty IN ('obstetrician', 'pediatrician')),
    exequatur text UNIQUE NOT NULL,
    colegiatura text,
    clinic_address text,
    clinic_phone text,
    experience_years integer,
    bio text,
    consultation_hours text,
    signature_url text,
    stamp_url text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Campos añadidos en v4
    cedula text,
    subspecialty text,
    university text,
    graduation_year integer,
    professional_email text,
    professional_phone text,
    website text,
    social_media jsonb,
    is_verified boolean DEFAULT false,
    verification_date timestamp with time zone,
    verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    verification_notes text,
    practice_start_date date,
    languages text[],
    insurance_providers text[],
    telemedicine_available boolean DEFAULT false,
    consultation_fee decimal(10,2),
    rating decimal(2,1),
    num_reviews integer,
    last_login timestamp with time zone,
    metadata jsonb
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 4. PREGNANCIES Table - De schema.sql
CREATE TABLE public.pregnancies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    obstetrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL, -- Referencia a professionals
    status public.pregnancy_status NOT NULL DEFAULT 'active',
    last_menstrual_period DATE NOT NULL,
    estimated_due_date DATE NOT NULL,
    weeks_gestation_offset INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;

-- 5. BABIES Table - De schema.sql
CREATE TABLE public.babies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    pediatrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL, -- Referencia a professionals
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_weight_grams INT,
    birth_height_cm DECIMAL(5,2),
    birth_head_circ_cm DECIMAL(5,2),
    gender VARCHAR(20),
    blood_type VARCHAR(10),
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;

-- 6. DOCTOR-PATIENT LINKS (Connection invitations via codes) - Consolidado de schema.sql y v2
CREATE TABLE public.doctor_patient_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL, -- Referencia a professionals
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    link_code VARCHAR(20) NOT NULL UNIQUE,
    status public.link_status NOT NULL DEFAULT 'pending', -- Usa el tipo link_status de v2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.doctor_patient_links ENABLE ROW LEVEL SECURITY;

-- 7. APPOINTMENTS Table - De schema.sql y v4
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL, -- Referencia a professionals
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.appointment_status NOT NULL DEFAULT 'scheduled', -- Usa el tipo appointment_status de schema.sql
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Campos añadidos en v4
    appointment_type text NOT NULL DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'telemedicine')),
    duration_minutes integer,
    meeting_link text,
    patient_notes text,
    doctor_notes text,
    cancellation_reason text,
    rescheduled_from uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    metadata jsonb
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. PRENATAL VISITS Table - De schema.sql
CREATE TABLE public.prenatal_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    gestational_week INT NOT NULL,
    mother_weight_kg DECIMAL(5,2),
    blood_pressure VARCHAR(20),
    fetal_heart_rate_bpm INT,
    uterine_height_cm DECIMAL(4,1),
    notes TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.prenatal_visits ENABLE ROW LEVEL SECURITY;

-- 9. PEDIATRIC VISITS Table - De schema.sql
CREATE TABLE public.pediatric_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    head_circ_cm DECIMAL(4,1),
    development_status TEXT,
    notes TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pediatric_visits ENABLE ROW LEVEL SECURITY;

-- 10. LAB RESULTS Table - De schema.sql
CREATE TABLE public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL,
    result_summary TEXT,
    file_url TEXT,
    is_normal BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- 11. ULTRASOUND RESULTS Table - De schema.sql
CREATE TABLE public.ultrasound_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE NOT NULL,
    gestational_week INT NOT NULL,
    scan_date DATE NOT NULL,
    image_url TEXT,
    findings TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ultrasound_results ENABLE ROW LEVEL SECURITY;

-- 12. SYMPTOMS Table - De schema.sql
CREATE TABLE public.symptoms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE,
    symptom_name VARCHAR(100) NOT NULL,
    intensity VARCHAR(20) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- 13. VITAL SIGNS Table - De schema.sql
CREATE TABLE public.vital_signs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5,2),
    systolic_bp INT,
    diastolic_bp INT,
    heart_rate_bpm INT,
    temperature_c DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;

-- 14. VACCINES Catalog Table - De schema.sql
CREATE TABLE public.vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_disease VARCHAR(255) NOT NULL,
    recommended_age_months INT NOT NULL,
    dose_number INT NOT NULL DEFAULT 1,
    description TEXT
);

-- Seed basic vaccines (De schema.sql)
INSERT INTO public.vaccines (name, target_disease, recommended_age_months, dose_number, description) VALUES
('BCG', 'Tuberculosis', 0, 1, 'Dosis única al nacer'),
('Hepatitis B (Recién Nacido)', 'Hepatitis B', 0, 1, 'Dentro de las primeras 12h de vida'),
('Hexavalente (Dosis 1)', 'Difteria, Tétanos, Tos Ferina, Hepatitis B, Hib, Polio', 2, 1, 'Primera dosis a los 2 meses'),
('Rotavirus (Dosis 1)', 'Diarrea por rotavirus', 2, 1, 'Primera dosis a los 2 meses'),
('Neumocócica Conjugada (Dosis 1)', 'Infección neumocócica', 2, 1, 'Primera dosis a los 2 meses')
ON CONFLICT (name) DO NOTHING; -- Para evitar errores si ya existen

-- 15. BABY VACCINES Table - De schema.sql
CREATE TABLE public.baby_vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE CASCADE NOT NULL,
    applied_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    lot_number VARCHAR(100),
    pediatrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL, -- Referencia a professionals
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.baby_vaccines ENABLE ROW LEVEL SECURITY;

-- 16. GROWTH RECORDS Table - De schema.sql
CREATE TABLE public.growth_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    record_date DATE NOT NULL,
    age_months INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    head_circ_cm DECIMAL(4,1),
    weight_percentile INT,
    height_percentile INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;

-- 17. DEVELOPMENT MILESTONES Table - De schema.sql
CREATE TABLE public.development_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    target_age_months INT NOT NULL,
    achieved_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.development_milestones ENABLE ROW LEVEL SECURITY;

-- 18. MESSAGES Table - De schema.sql
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 19. NOTIFICATIONS Table - De schema.sql
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 20. PROFESSIONAL DOCUMENTS - De v2
CREATE TABLE public.professional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('id_front', 'id_back', 'degree', 'exequatur', 'colegiatura')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

-- 21. MOTHER DOCUMENTS - De v2
CREATE TABLE public.mother_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('id_front', 'id_back', 'pregnancy_cert', 'birth_cert')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.mother_documents ENABLE ROW LEVEL SECURITY;

-- 22. PRESCRIPTIONS TABLES - Consolidado de v2 y v4
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.professionals(id) ON DELETE RESTRICT, -- Referencia a professionals
  mother_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  baby_id uuid REFERENCES public.babies(id) ON DELETE SET NULL,
  diagnosis text,
  is_controlled boolean DEFAULT false,
  status public.prescription_status DEFAULT 'activa'::public.prescription_status NOT NULL, -- Usa el tipo de v4
  code text UNIQUE NOT NULL,
  expiry_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  -- Campos añadidos en v4
  uuid uuid DEFAULT gen_random_uuid() NOT NULL,
  qr_code_url text,
  validation_code text
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  generic_name text NOT NULL,
  commercial_name text,
  concentration text NOT NULL,
  pharmaceutical_form text NOT NULL,
  presentation text NOT NULL,
  dose text NOT NULL,
  route text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  quantity integer NOT NULL,
  instructions text,
  warnings text
);
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- 23. CLINICAL HISTORIES (Fase 1 de v4) - De v4
CREATE TABLE public.clinical_histories (
  id uuid PRIMARY KEY REFERENCES public.mothers(id) ON DELETE CASCADE,
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
  fam_diabetes boolean DEFAULT false NOT NULL,
  fam_hypertension boolean DEFAULT false NOT NULL,
  fam_cancer boolean DEFAULT false NOT NULL,
  fam_genetic_diseases text,
  fam_cardiovascular boolean DEFAULT false NOT NULL,
  past_pregnancies integer DEFAULT 0 NOT NULL,
  past_abortions integer DEFAULT 0 NOT NULL,
  past_c_sections integer DEFAULT 0 NOT NULL,
  past_vaginal_births integer DEFAULT 0 NOT NULL,
  past_ectopic_pregnancies integer DEFAULT 0 NOT NULL,
  obstetric_complications text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.clinical_histories ENABLE ROW LEVEL SECURITY;

-- 24. PRESCRIPTION VERIFICATIONS - De v4
CREATE TABLE public.prescription_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  verified_by text NOT NULL,
  ip_address text NOT NULL,
  verified_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.prescription_verifications ENABLE ROW LEVEL SECURITY;

-- 25. PRESCRIPTION AUDIT LOGS - De v4
CREATE TABLE public.prescription_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.prescription_audit_logs ENABLE ROW LEVEL SECURITY;

-- 26. GLOBAL AUDIT LOGS - Consolidado de v2 y v4
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text, -- De v4
  user_role text, -- De v4
  ip_address text, -- De v4
  action text NOT NULL, -- De v4
  table_affected text, -- De v4
  record_id text, -- De v4
  old_value jsonb, -- De v4
  new_value jsonb, -- De v4
  created_at timestamp with time zone DEFAULT now(),
  event text, -- De v2
  is_suspicious boolean DEFAULT false -- De v2
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 27. HIPAA CONSENT LOGS - De v3
CREATE TABLE public.hipaa_consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  consent_type text NOT NULL,
  version text NOT NULL,
  ip_address text NOT NULL,
  accepted_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.hipaa_consent_logs ENABLE ROW LEVEL SECURITY;

-- 28. PRIVACY REQUESTS - De v3
CREATE TABLE public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('export', 'delete')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'canceled')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

-- 29. AI USAGE STATS - De v3
CREATE TABLE public.ai_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  model text NOT NULL CHECK (model IN ('gpt-4o', 'claude-3-5-sonnet')),
  tokens_prompt integer NOT NULL,
  tokens_completion integer NOT NULL,
  cost_usd decimal(10, 4) NOT NULL,
  timestamp timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

-- 30. SUPPORT TICKETS - De v2
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  replies jsonb DEFAULT '[]'::jsonb
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 31. CMS ARTICLES - De v2
CREATE TABLE public.cms_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Pregnancy', 'Prenatal', 'Pediatric', 'General')),
  tags text[] DEFAULT '{}'::text[],
  content text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;

-- TRIGGERS Y FUNCIONES (Consolidado de schema.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'mother'::public.user_role), -- Usa el tipo public.user_role
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- POLÍTICAS DE ROW LEVEL SECURITY (RLS) - Consolidado de todas las migraciones

-- Policies for public.profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for public.mothers
CREATE POLICY "Mothers can view their own data." ON public.mothers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Mothers can insert their own data." ON public.mothers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Mothers can update their own data." ON public.mothers FOR UPDATE USING (auth.uid() = id);

-- Policies for public.professionals
CREATE POLICY "Public profiles read professionals details" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Professionals can update their own professional detail" ON public.professionals FOR ALL USING (auth.uid() = id);

-- Policies for public.pregnancies
CREATE POLICY "Mothers can view their own pregnancies." ON public.pregnancies FOR SELECT USING (auth.uid() = mother_id);
CREATE POLICY "Mothers can insert their own pregnancies." ON public.pregnancies FOR INSERT WITH CHECK (auth.uid() = mother_id);
CREATE POLICY "Mothers can update their own pregnancies." ON public.pregnancies FOR UPDATE USING (auth.uid() = mother_id);
CREATE POLICY "Professionals can view linked pregnancies." ON public.pregnancies FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = pregnancies.mother_id AND status = 'accepted'));

-- Policies for public.babies
CREATE POLICY "Mothers can view their own babies." ON public.babies FOR SELECT USING (auth.uid() = mother_id);
CREATE POLICY "Mothers can insert their own babies." ON public.babies FOR INSERT WITH CHECK (auth.uid() = mother_id);
CREATE POLICY "Mothers can update their own babies." ON public.babies FOR UPDATE USING (auth.uid() = mother_id);
CREATE POLICY "Professionals can view linked babies." ON public.babies FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = babies.mother_id AND status = 'accepted'));

-- Policies for public.doctor_patient_links
CREATE POLICY "Users can read links they are involved in" ON public.doctor_patient_links FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = mother_id);
CREATE POLICY "Mothers can create link requests" ON public.doctor_patient_links FOR INSERT WITH CHECK (auth.uid() = mother_id);
CREATE POLICY "Professionals/Mothers can update statuses" ON public.doctor_patient_links FOR UPDATE USING (auth.uid() = doctor_id OR auth.uid() = mother_id);

-- Policies for public.appointments
CREATE POLICY "Users can view their own appointments." ON public.appointments FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = mother_id);
CREATE POLICY "Mothers can create appointments." ON public.appointments FOR INSERT WITH CHECK (auth.uid() = mother_id);
CREATE POLICY "Users can update their own appointments." ON public.appointments FOR UPDATE USING (auth.uid() = doctor_id OR auth.uid() = mother_id);

-- Policies for public.prenatal_visits
CREATE POLICY "Mothers can view their own prenatal visits." ON public.prenatal_visits FOR SELECT USING (EXISTS (SELECT 1 FROM public.pregnancies WHERE id = prenatal_visits.pregnancy_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can manage linked prenatal visits." ON public.prenatal_visits FOR ALL USING (EXISTS (SELECT 1 FROM public.pregnancies p JOIN public.doctor_patient_links dpl ON p.mother_id = dpl.mother_id WHERE p.id = prenatal_visits.pregnancy_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.pediatric_visits
CREATE POLICY "Mothers can view their own pediatric visits." ON public.pediatric_visits FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies WHERE id = pediatric_visits.baby_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can manage linked pediatric visits." ON public.pediatric_visits FOR ALL USING (EXISTS (SELECT 1 FROM public.babies b JOIN public.doctor_patient_links dpl ON b.mother_id = dpl.mother_id WHERE b.id = pediatric_visits.baby_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.lab_results
CREATE POLICY "Users can view their own lab results." ON public.lab_results FOR SELECT USING (auth.uid() = mother_id OR EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = lab_results.mother_id AND status = 'accepted'));
CREATE POLICY "Professionals can upload lab results for linked patients." ON public.lab_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = lab_results.mother_id AND status = 'accepted'));

-- Policies for public.ultrasound_results
CREATE POLICY "Mothers can view their own ultrasound results." ON public.ultrasound_results FOR SELECT USING (EXISTS (SELECT 1 FROM public.pregnancies WHERE id = ultrasound_results.pregnancy_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can upload ultrasound results for linked patients." ON public.ultrasound_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.pregnancies p JOIN public.doctor_patient_links dpl ON p.mother_id = dpl.mother_id WHERE p.id = ultrasound_results.pregnancy_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.symptoms
CREATE POLICY "Mothers can manage their own symptoms." ON public.symptoms FOR ALL USING (auth.uid() = mother_id);
CREATE POLICY "Professionals can view linked patient symptoms." ON public.symptoms FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = symptoms.mother_id AND status = 'accepted'));

-- Policies for public.vital_signs
CREATE POLICY "Users can manage their own vital signs." ON public.vital_signs FOR ALL USING (auth.uid() = mother_id OR EXISTS (SELECT 1 FROM public.babies WHERE id = vital_signs.baby_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can view linked patient vital signs." ON public.vital_signs FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND (mother_id = vital_signs.mother_id OR EXISTS (SELECT 1 FROM public.babies WHERE id = vital_signs.baby_id AND mother_id = doctor_patient_links.mother_id)) AND status = 'accepted'));

-- Policies for public.baby_vaccines
CREATE POLICY "Mothers can view their own baby vaccines." ON public.baby_vaccines FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies WHERE id = baby_vaccines.baby_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can manage linked baby vaccines." ON public.baby_vaccines FOR ALL USING (EXISTS (SELECT 1 FROM public.babies b JOIN public.doctor_patient_links dpl ON b.mother_id = dpl.mother_id WHERE b.id = baby_vaccines.baby_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.growth_records
CREATE POLICY "Mothers can view their own baby growth records." ON public.growth_records FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies WHERE id = growth_records.baby_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can view linked baby growth records." ON public.growth_records FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies b JOIN public.doctor_patient_links dpl ON b.mother_id = dpl.mother_id WHERE b.id = growth_records.baby_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.development_milestones
CREATE POLICY "Mothers can manage their own baby development milestones." ON public.development_milestones FOR ALL USING (EXISTS (SELECT 1 FROM public.babies WHERE id = development_milestones.baby_id AND mother_id = auth.uid()));
CREATE POLICY "Professionals can view linked baby development milestones." ON public.development_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies b JOIN public.doctor_patient_links dpl ON b.mother_id = dpl.mother_id WHERE b.id = development_milestones.baby_id AND dpl.doctor_id = auth.uid() AND dpl.status = 'accepted'));

-- Policies for public.messages
CREATE POLICY "Users can manage their own messages." ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policies for public.notifications
CREATE POLICY "Users can manage their own notifications." ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Policies for professional_documents
CREATE POLICY "Professionals can manage their own professional documents" ON public.professional_documents FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Admins can view and review professional documents" ON public.professional_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for mother_documents
CREATE POLICY "Mothers can manage their own verification documents" ON public.mother_documents FOR ALL USING (auth.uid() = mother_id);
CREATE POLICY "Admins can view and review mother documents" ON public.mother_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for prescriptions
CREATE POLICY "Professionals can manage prescriptions they write" ON public.prescriptions FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Mothers can view prescriptions issued for them" ON public.prescriptions FOR SELECT USING (auth.uid() = mother_id);
CREATE POLICY "Admins can inspect clinical prescriptions for audit" ON public.prescriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for prescription_items
CREATE POLICY "Users can read items if they have access to parent prescription" ON public.prescription_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND (p.doctor_id = auth.uid() OR p.mother_id = auth.uid())));
CREATE POLICY "Professionals can write prescription items" ON public.prescription_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND p.doctor_id = auth.uid()));

-- Policies for clinical_histories
CREATE POLICY "Mothers can view their own clinical history." ON public.clinical_histories FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Mothers can update their own clinical history." ON public.clinical_histories FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Professionals can view linked patient clinical history." ON public.clinical_histories FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctor_patient_links WHERE doctor_id = auth.uid() AND mother_id = clinical_histories.id AND status = 'accepted'));

-- Policies for prescription_verifications
CREATE POLICY "Anyone can read prescription verifications." ON public.prescription_verifications FOR SELECT USING (true);
CREATE POLICY "System can insert prescription verifications." ON public.prescription_verifications FOR INSERT WITH CHECK (true);

-- Policies for prescription_audit_logs
CREATE POLICY "Admins can view prescription audit logs." ON public.prescription_audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert prescription audit logs." ON public.prescription_audit_logs FOR INSERT WITH CHECK (true);

-- Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Policies for hipaa_consent_logs
CREATE POLICY "Users can view their own HIPAA consent logs" ON public.hipaa_consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all HIPAA consent logs" ON public.hipaa_consent_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert their own HIPAA consent logs" ON public.hipaa_consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for privacy_requests
CREATE POLICY "Users can view and manage their own privacy requests" ON public.privacy_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view and update all privacy requests" ON public.privacy_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for ai_usage_stats
CREATE POLICY "Admins can view AI usage statistics" ON public.ai_usage_stats FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can record AI usage statistics" ON public.ai_usage_stats FOR INSERT WITH CHECK (true);

-- Policies for support_tickets
CREATE POLICY "Users can manage their own support tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view and edit all support tickets" ON public.support_tickets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for cms_articles
CREATE POLICY "Anyone can view published cms articles" ON public.cms_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all cms articles" ON public.cms_articles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for vaccines (read-only for all)
CREATE POLICY "Anyone can view vaccines." ON public.vaccines FOR SELECT USING (true);

