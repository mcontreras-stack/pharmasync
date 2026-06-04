-- Database Migration v2: Onboarding, Document Verification and Electronic Prescriptions
-- Target: Supabase PostgreSQL Database Schema

-- 1. EXTEND PROFILES TABLE WITH STATUS AND BIO DATA
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'email_pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- Add check constraint for profile status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profile_status;
ALTER TABLE public.profiles ADD CONSTRAINT check_profile_status 
  CHECK (status IN ('email_pending', 'pending_documents', 'under_review', 'approved', 'rejected', 'suspended', 'inactive'));

-- 2. CREATE PROFESSIONALS DATA TABLE
CREATE TABLE IF NOT EXISTS public.professionals (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- 3. CREATE DOCUMENTS SCHEMAS
CREATE TABLE IF NOT EXISTS public.professional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('id_front', 'id_back', 'degree', 'exequatur', 'colegiatura')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mother_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('id_front', 'id_back', 'pregnancy_cert', 'birth_cert')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'needs_correction')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on documents tables
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mother_documents ENABLE ROW LEVEL SECURITY;

-- 4. CREATE DOCTOR-PATIENT LINKS TABLE
CREATE TABLE IF NOT EXISTS public.doctor_patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  mother_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  baby_id uuid REFERENCES public.babies(id) ON DELETE SET NULL,
  link_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on doctor_patient_links
ALTER TABLE public.doctor_patient_links ENABLE ROW LEVEL SECURITY;

-- 5. CREATE PRESCRIPTIONS TABLES
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  mother_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  baby_id uuid REFERENCES public.babies(id) ON DELETE SET NULL,
  diagnosis text,
  is_controlled boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'canceled')),
  code text UNIQUE NOT NULL,
  expiry_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
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

-- Enable RLS on prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Policies for public.professionals
CREATE POLICY "Public profiles read professionals details"
  ON public.professionals FOR SELECT USING (true);

CREATE POLICY "Doctors can update their own professional detail"
  ON public.professionals FOR ALL USING (auth.uid() = id);

-- Policies for professional_documents
CREATE POLICY "Doctors can manage their own professional documents"
  ON public.professional_documents FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can view and review doctor documents"
  ON public.professional_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for mother_documents
CREATE POLICY "Mothers can manage their own verification documents"
  ON public.mother_documents FOR ALL USING (auth.uid() = mother_id);

CREATE POLICY "Admins can view and review mother documents"
  ON public.mother_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for doctor_patient_links
CREATE POLICY "Users can read links they are involved in"
  ON public.doctor_patient_links FOR SELECT USING (
    auth.uid() = doctor_id OR auth.uid() = mother_id
  );

CREATE POLICY "Mothers can create link requests"
  ON public.doctor_patient_links FOR INSERT WITH CHECK (
    auth.uid() = mother_id
  );

CREATE POLICY "Doctors/Mothers can update statuses"
  ON public.doctor_patient_links FOR UPDATE USING (
    auth.uid() = doctor_id OR auth.uid() = mother_id
  );

-- Policies for prescriptions
CREATE POLICY "Doctors can manage prescriptions they write"
  ON public.prescriptions FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Mothers can view prescriptions issued for them"
  ON public.prescriptions FOR SELECT USING (auth.uid() = mother_id);

CREATE POLICY "Admins can inspect clinical prescriptions for audit"
  ON public.prescriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for prescription_items
CREATE POLICY "Users can read items if they have access to parent prescription"
  ON public.prescription_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions p 
      WHERE p.id = prescription_id AND (p.doctor_id = auth.uid() OR p.mother_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can write prescription items"
  ON public.prescription_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prescriptions p 
      WHERE p.id = prescription_id AND p.doctor_id = auth.uid()
    )
  );


-- ==========================================
-- 6. CREATE AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text,
  event text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  is_suspicious boolean DEFAULT false
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT WITH CHECK (true);


-- ==========================================
-- 7. CREATE SUPPORT TICKETS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
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

CREATE POLICY "Users can manage their own support tickets"
  ON public.support_tickets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and edit all support tickets"
  ON public.support_tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ==========================================
-- 8. CREATE CMS ARTICLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cms_articles (
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

CREATE POLICY "Anyone can view published cms articles"
  ON public.cms_articles FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all cms articles"
  ON public.cms_articles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
