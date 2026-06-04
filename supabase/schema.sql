-- Create custom types for roles and link status
CREATE TYPE user_role AS ENUM ('mother', 'obstetrician', 'pediatrician', 'admin');
CREATE TYPE link_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE pregnancy_status AS ENUM ('active', 'completed', 'terminated');

-- 1. PROFILES Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'mother',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. MOTHERS Table
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

-- 3. DOCTORS Table
CREATE TABLE public.doctors (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    specialty VARCHAR(100) NOT NULL, -- 'obstetrician' or 'pediatrician'
    phone VARCHAR(50),
    clinic_address TEXT,
    consultation_hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 4. PREGNANCIES Table
CREATE TABLE public.pregnancies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    obstetrician_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    status pregnancy_status NOT NULL DEFAULT 'active',
    last_menstrual_period DATE NOT NULL,
    estimated_due_date DATE NOT NULL,
    weeks_gestation_offset INT DEFAULT 0, -- manual calibration if needed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;

-- 5. BABIES Table
CREATE TABLE public.babies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    pediatrician_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE SET NULL, -- Link to pregnancy context
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

-- 6. DOCTOR-PATIENT LINKS (Connection invitations via codes)
CREATE TABLE public.doctor_patient_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE, -- Optional, if linking baby to pediatrician
    link_code VARCHAR(20) NOT NULL UNIQUE,
    status link_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.doctor_patient_links ENABLE ROW LEVEL SECURITY;

-- 7. APPOINTMENTS Table
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE, -- Nullable (pregnancy appt vs pediatrician appt)
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. PRENATAL VISITS Table (Obstetrician notes per control)
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

-- 9. PEDIATRIC VISITS Table (Pediatrician notes per control)
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

-- 10. LAB RESULTS Table (Medical studies)
CREATE TABLE public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE, -- If pregnancy-related
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,           -- If baby-related
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE,         -- If general mother-related
    test_name VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL,
    result_summary TEXT,
    file_url TEXT,
    is_normal BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- 11. ULTRASOUND RESULTS Table (Ecografías)
CREATE TABLE public.ultrasound_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE NOT NULL,
    gestational_week INT NOT NULL,
    scan_date DATE NOT NULL,
    image_url TEXT, -- storage URL for the scan image
    findings TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ultrasound_results ENABLE ROW LEVEL SECURITY;

-- 12. SYMPTOMS Table (Logs by Mother)
CREATE TABLE public.symptoms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mother_id UUID REFERENCES public.mothers(id) ON DELETE CASCADE NOT NULL,
    pregnancy_id UUID REFERENCES public.pregnancies(id) ON DELETE CASCADE, -- optional
    symptom_name VARCHAR(100) NOT NULL,
    intensity VARCHAR(20) NOT NULL, -- low, medium, high
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- 13. VITAL SIGNS Table (Logs by Mother/Doctor)
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

-- 14. VACCINES Catalog Table
CREATE TABLE public.vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_disease VARCHAR(255) NOT NULL,
    recommended_age_months INT NOT NULL,
    dose_number INT NOT NULL DEFAULT 1,
    description TEXT
);

-- Seed basic vaccines
INSERT INTO public.vaccines (name, target_disease, recommended_age_months, dose_number, description) VALUES
('BCG', 'Tuberculosis', 0, 1, 'Dosis única al nacer'),
('Hepatitis B (Recién Nacido)', 'Hepatitis B', 0, 1, 'Dentro de las primeras 12h de vida'),
('Hexavalente (Dosis 1)', 'Difteria, Tétanos, Tos Ferina, Hepatitis B, Hib, Polio', 2, 1, 'Primera dosis a los 2 meses'),
('Rotavirus (Dosis 1)', 'Diarrea por rotavirus', 2, 1, 'Primera dosis a los 2 meses'),
('Neumocócica Conjugada (Dosis 1)', 'Infección neumocócica', 2, 1, 'Primera dosis a los 2 meses');

-- 15. BABY VACCINES Table (Record of applied vaccines)
CREATE TABLE public.baby_vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE CASCADE NOT NULL,
    applied_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, scheduled, applied
    lot_number VARCHAR(100),
    pediatrician_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.baby_vaccines ENABLE ROW LEVEL SECURITY;

-- 16. GROWTH RECORDS Table (Plotting curves)
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

-- 17. DEVELOPMENT MILESTONES Table (Hitos)
CREATE TABLE public.development_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL, -- motor, cognitivo, social, lenguaje
    milestone_name VARCHAR(255) NOT NULL,
    target_age_months INT NOT NULL,
    achieved_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, achieved, delayed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.development_milestones ENABLE ROW LEVEL SECURITY;

-- 18. MESSAGES Table (Direct Doctor-Patient Chat)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 19. NOTIFICATIONS Table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- appointment, alert, system, chat
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Triggers for User Syncing from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'mother'::user_role),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
