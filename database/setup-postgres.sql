-- =============================================================================
-- PharmaSync — Esquema completo para PostgreSQL "puro" (servidor propio)
-- =============================================================================
-- Uso:  psql "$DATABASE_URL" -f database/setup-postgres.sql
--
-- Diferencias con la versión de Supabase:
--   * profiles NO depende de auth.users: la app gestiona contraseñas con
--     password_hash (bcrypt) y sesiones propias (tabla sessions).
--   * No hay RLS: el acceso pasa por las rutas /api del servidor Next.js.
--
-- El script es idempotente: puede ejecutarse varias veces sin error.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Tipos personalizados ────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('mother', 'obstetrician', 'pediatrician', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE link_status AS ENUM ('pending', 'accepted', 'rejected', 'revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pregnancy_status AS ENUM ('active', 'completed', 'terminated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE prescription_status AS ENUM ('activa', 'expirada', 'cancelada', 'dispensada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE saas_plan AS ENUM ('madre_basico', 'madre_premium', 'doc_basico', 'doc_pro', 'clinica', 'hospital', 'enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE doc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE attachment_type AS ENUM ('image', 'pdf', 'audio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. PROFILES (usuarios y credenciales) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'mother',
    avatar_url TEXT,
    password_hash TEXT,
    status TEXT DEFAULT 'email_pending' CHECK (status IN ('email_pending', 'pending_documents', 'under_review', 'approved', 'rejected', 'suspended', 'inactive')),
    suspension_reason TEXT,
    phone TEXT,
    national_id TEXT,
    nationality TEXT,
    country TEXT,
    city TEXT,
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- ─── 1b. SESSIONS (tokens de sesión de la app) ──────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- ─── 2. MOTHERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mothers (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    birth_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10),
    allergies TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. PROFESSIONALS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL CHECK (specialty IN ('obstetrician', 'pediatrician')),
    exequatur TEXT UNIQUE NOT NULL,
    colegiatura TEXT,
    clinic_address TEXT,
    clinic_phone TEXT,
    experience_years INTEGER,
    bio TEXT,
    consultation_hours TEXT,
    signature_url TEXT,
    stamp_url TEXT,
    cedula TEXT,
    subspecialty TEXT,
    university TEXT,
    graduation_year INTEGER,
    professional_email TEXT,
    professional_phone TEXT,
    website TEXT,
    social_media JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verification_notes TEXT,
    practice_start_date DATE,
    languages TEXT[],
    insurance_providers TEXT[],
    telemedicine_available BOOLEAN DEFAULT FALSE,
    consultation_fee DECIMAL(10,2),
    rating DECIMAL(2,1),
    num_reviews INTEGER,
    last_login TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. PREGNANCIES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
    obstetrician_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    status pregnancy_status NOT NULL DEFAULT 'active',
    last_menstrual_period DATE NOT NULL,
    estimated_due_date DATE NOT NULL,
    weeks_gestation_offset INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pregnancies_mother ON pregnancies (mother_id);

-- ─── 5. BABIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS babies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
    pediatrician_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_weight_grams INT,
    birth_height_cm DECIMAL(5,2),
    birth_head_circ_cm DECIMAL(5,2),
    gender VARCHAR(20),
    blood_type VARCHAR(10),
    allergies TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_babies_mother ON babies (mother_id);

-- ─── 6. DOCTOR-PATIENT LINKS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_patient_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    link_code VARCHAR(20) NOT NULL UNIQUE,
    status link_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. APPOINTMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT NOT NULL,
    notes TEXT,
    appointment_type TEXT NOT NULL DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'telemedicine')),
    duration_minutes INTEGER,
    meeting_link TEXT,
    patient_notes TEXT,
    doctor_notes TEXT,
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. PRENATAL VISITS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prenatal_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    gestational_week INT NOT NULL,
    mother_weight_kg DECIMAL(5,2),
    blood_pressure VARCHAR(20),
    fetal_heart_rate_bpm INT,
    uterine_height_cm DECIMAL(4,1),
    notes TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. PEDIATRIC VISITS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pediatric_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    head_circ_cm DECIMAL(4,1),
    development_status TEXT,
    notes TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 10. LAB RESULTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    mother_id UUID REFERENCES mothers(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_date DATE NOT NULL,
    result_summary TEXT,
    file_url TEXT,
    is_normal BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. ULTRASOUND RESULTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ultrasound_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
    gestational_week INT NOT NULL,
    scan_date DATE NOT NULL,
    image_url TEXT,
    findings TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 12. SYMPTOMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    symptom_name VARCHAR(100) NOT NULL,
    intensity VARCHAR(20) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. VITAL SIGNS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_id UUID REFERENCES mothers(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5,2),
    systolic_bp INT,
    diastolic_bp INT,
    heart_rate_bpm INT,
    temperature_c DECIMAL(3,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. VACCINES (catálogo) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaccines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    target_disease VARCHAR(255) NOT NULL,
    recommended_age_months INT NOT NULL,
    dose_number INT NOT NULL DEFAULT 1,
    description TEXT
);

INSERT INTO vaccines (name, target_disease, recommended_age_months, dose_number, description) VALUES
('BCG', 'Tuberculosis', 0, 1, 'Dosis única al nacer'),
('Hepatitis B (Recién Nacido)', 'Hepatitis B', 0, 1, 'Dentro de las primeras 12h de vida'),
('Hexavalente (Dosis 1)', 'Difteria, Tétanos, Tos Ferina, Hepatitis B, Hib, Polio', 2, 1, 'Primera dosis a los 2 meses'),
('Rotavirus (Dosis 1)', 'Diarrea por rotavirus', 2, 1, 'Primera dosis a los 2 meses'),
('Neumocócica Conjugada (Dosis 1)', 'Infección neumocócica', 2, 1, 'Primera dosis a los 2 meses')
ON CONFLICT (name) DO NOTHING;

-- ─── 15. BABY VACCINES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS baby_vaccines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
    applied_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    lot_number VARCHAR(100),
    pediatrician_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 16. GROWTH RECORDS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    age_months INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    head_circ_cm DECIMAL(4,1),
    weight_percentile INT,
    height_percentile INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 17. DEVELOPMENT MILESTONES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS development_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    target_age_months INT NOT NULL,
    achieved_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 18. MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 19. NOTIFICATIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 20. PROFESSIONAL DOCUMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professional_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('id_front', 'id_back', 'degree', 'exequatur', 'colegiatura')),
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 21. MOTHER DOCUMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mother_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mother_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('id_front', 'id_back', 'pregnancy_cert', 'birth_cert')),
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 22. PRESCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES professionals(id) ON DELETE RESTRICT,
    mother_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
    diagnosis TEXT,
    is_controlled BOOLEAN DEFAULT FALSE,
    status prescription_status NOT NULL DEFAULT 'activa',
    code TEXT UNIQUE NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    qr_code_url TEXT,
    validation_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    generic_name TEXT NOT NULL,
    commercial_name TEXT,
    concentration TEXT NOT NULL,
    pharmaceutical_form TEXT NOT NULL,
    presentation TEXT NOT NULL,
    dose TEXT NOT NULL,
    route TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    instructions TEXT,
    warnings TEXT
);

-- ─── 23. CLINICAL HISTORIES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinical_histories (
    id UUID PRIMARY KEY REFERENCES mothers(id) ON DELETE CASCADE,
    has_diabetes BOOLEAN DEFAULT FALSE NOT NULL,
    has_hypertension BOOLEAN DEFAULT FALSE NOT NULL,
    has_asthma BOOLEAN DEFAULT FALSE NOT NULL,
    has_heart_disease BOOLEAN DEFAULT FALSE NOT NULL,
    has_autoimmune BOOLEAN DEFAULT FALSE NOT NULL,
    chronic_illnesses TEXT,
    past_surgeries TEXT,
    past_hospitalizations TEXT,
    allergies TEXT,
    permanent_medications TEXT,
    fam_diabetes BOOLEAN DEFAULT FALSE NOT NULL,
    fam_hypertension BOOLEAN DEFAULT FALSE NOT NULL,
    fam_cancer BOOLEAN DEFAULT FALSE NOT NULL,
    fam_genetic_diseases TEXT,
    fam_cardiovascular BOOLEAN DEFAULT FALSE NOT NULL,
    past_pregnancies INTEGER DEFAULT 0 NOT NULL,
    past_abortions INTEGER DEFAULT 0 NOT NULL,
    past_c_sections INTEGER DEFAULT 0 NOT NULL,
    past_vaginal_births INTEGER DEFAULT 0 NOT NULL,
    past_ectopic_pregnancies INTEGER DEFAULT 0 NOT NULL,
    obstetric_complications TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 24. PRESCRIPTION VERIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescription_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    verified_by TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 25. PRESCRIPTION AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 26. AUDIT LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    ip_address TEXT,
    action TEXT NOT NULL,
    table_affected TEXT,
    record_id TEXT,
    old_value JSONB,
    new_value JSONB,
    event TEXT,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 27. HIPAA CONSENT LOGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hipaa_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    consent_type TEXT NOT NULL,
    version TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 28. PRIVACY REQUESTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 29. AI USAGE STATS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_prompt INTEGER NOT NULL,
    tokens_completion INTEGER NOT NULL,
    cost_usd DECIMAL(10, 4) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 30. SUPPORT TICKETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    replies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 31. CMS ARTICLES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Pregnancy', 'Prenatal', 'Pediatric', 'General')),
    tags TEXT[] DEFAULT '{}'::text[],
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- USUARIO ADMINISTRADOR INICIAL
-- Email: admin@pharmasync.local  /  Contraseña: cambiar123
-- (hash bcrypt de "cambiar123"; CAMBIA la contraseña tras el primer login
--  desde el panel de administración)
-- =============================================================================
INSERT INTO profiles (email, full_name, role, status, password_hash)
VALUES (
  'admin@pharmasync.local',
  'Administrador',
  'admin',
  'approved',
  '$2b$10$lwxYBfPv/hdPKUVbTf/xR.nhJ7xZVSP.ASLd473zPXv7qG2A9EJOa'
)
ON CONFLICT (email) DO NOTHING;
