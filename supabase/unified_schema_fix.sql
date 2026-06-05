-- Esquema Unificado para PharmaSync en Supabase (Versión de Reparación)
-- Este script limpia el esquema existente y lo recrea para evitar errores de "ya existe".

-- 1. LIMPIEZA TOTAL (En orden de dependencias)
DO $$ 
BEGIN
    -- Eliminar triggers
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    
    -- Eliminar tablas si existen
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

    -- Eliminar tipos si existen
    DROP TYPE IF EXISTS public.user_role CASCADE;
    DROP TYPE IF EXISTS public.link_status CASCADE;
    DROP TYPE IF EXISTS public.appointment_status CASCADE;
    DROP TYPE IF EXISTS public.pregnancy_status CASCADE;
    DROP TYPE IF EXISTS public.prescription_status CASCADE;
    DROP TYPE IF EXISTS public.saas_plan CASCADE;
    DROP TYPE IF EXISTS public.doc_status CASCADE;
    DROP TYPE IF EXISTS public.attachment_type CASCADE;
END $$;

-- 2. CREACIÓN DE TIPOS
CREATE TYPE public.user_role AS ENUM ('mother', 'obstetrician', 'pediatrician', 'admin');
CREATE TYPE public.link_status AS ENUM ('pending', 'accepted', 'rejected', 'revoked');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE public.pregnancy_status AS ENUM ('active', 'completed', 'terminated');
CREATE TYPE public.prescription_status AS ENUM ('activa', 'expirada', 'cancelada', 'dispensada');
CREATE TYPE public.saas_plan AS ENUM ('madre_basico', 'madre_premium', 'doc_basico', 'doc_pro', 'clinica', 'hospital', 'enterprise');
CREATE TYPE public.doc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended');
CREATE TYPE public.attachment_type AS ENUM ('image', 'pdf', 'audio');

-- 3. CREACIÓN DE TABLAS (Mismo orden que el script anterior)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'mother',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text DEFAULT 'email_pending' CHECK (status IN ('email_pending', 'pending_documents', 'under_review', 'approved', 'rejected', 'suspended', 'inactive')),
    phone text,
    national_id text,
    nationality text,
    country text,
    city text,
    birth_date date
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE public.pregnancies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    obstetrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    status public.pregnancy_status NOT NULL DEFAULT 'active',
    last_menstrual_period DATE NOT NULL,
    estimated_due_date DATE NOT NULL,
    weeks_gestation_offset INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.babies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    pediatrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
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

CREATE TABLE public.doctor_patient_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    link_code VARCHAR(20) NOT NULL UNIQUE,
    status public.link_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.doctor_patient_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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

CREATE TABLE public.vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    target_disease VARCHAR(255) NOT NULL,
    recommended_age_months INT NOT NULL,
    dose_number INT NOT NULL DEFAULT 1,
    description TEXT
);

INSERT INTO public.vaccines (name, target_disease, recommended_age_months, dose_number, description) VALUES
('BCG', 'Tuberculosis', 0, 1, 'Dosis única al nacer'),
('Hepatitis B (Recién Nacido)', 'Hepatitis B', 0, 1, 'Dentro de las primeras 12h de vida'),
('Hexavalente (Dosis 1)', 'Difteria, Tétanos, Tos Ferina, Hepatitis B, Hib, Polio', 2, 1, 'Primera dosis a los 2 meses'),
('Rotavirus (Dosis 1)', 'Diarrea por rotavirus', 2, 1, 'Primera dosis a los 2 meses'),
('Neumocócica Conjugada (Dosis 1)', 'Infección neumocócica', 2, 1, 'Primera dosis a los 2 meses')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE public.baby_vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE CASCADE NOT NULL,
    applied_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    lot_number VARCHAR(100),
    pediatrician_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.baby_vaccines ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.professionals(id) ON DELETE RESTRICT,
  mother_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  baby_id uuid REFERENCES public.babies(id) ON DELETE SET NULL,
  diagnosis text,
  is_controlled boolean DEFAULT false,
  status public.prescription_status DEFAULT 'activa'::public.prescription_status NOT NULL,
  code text UNIQUE NOT NULL,
  expiry_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
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

CREATE TABLE public.prescription_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  verified_by text NOT NULL,
  ip_address text NOT NULL,
  verified_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.prescription_verifications ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  ip_address text,
  action text NOT NULL,
  table_affected text,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  event text,
  is_suspicious boolean DEFAULT false
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

-- 4. TRIGGERS Y FUNCIONES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'mother'::public.user_role),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. POLÍTICAS DE RLS (Resumen de las más críticas)
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile." ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Mothers can manage their own data." ON public.mothers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Professionals can manage their own data." ON public.professionals FOR ALL USING (auth.uid() = id);

CREATE POLICY "Mothers can view their own pregnancies." ON public.pregnancies FOR SELECT USING (auth.uid() = mother_id);
CREATE POLICY "Mothers can view their own babies." ON public.babies FOR SELECT USING (auth.uid() = mother_id);

CREATE POLICY "Users can read links they are involved in" ON public.doctor_patient_links FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = mother_id);
CREATE POLICY "Mothers can manage their own clinical history." ON public.clinical_histories FOR ALL USING (auth.uid() = id);
