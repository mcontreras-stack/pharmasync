-- 1. Create verification status type
CREATE TYPE verification_state AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');
CREATE TYPE payment_state AS ENUM ('paid', 'unpaid', 'refunded');

-- 2. Modify DOCTORS table
ALTER TABLE public.doctors 
ADD COLUMN verification_status verification_state NOT NULL DEFAULT 'pending',
ADD COLUMN document_url TEXT;

-- 3. Create SUBSCRIPTIONS Table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'premium_monthly', 'premium_yearly'
    status subscription_status NOT NULL DEFAULT 'active',
    price_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status payment_state NOT NULL DEFAULT 'paid',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for subscriptions
CREATE POLICY "Admins can view and edit all subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Modify doctor link constraints: pending doctors cannot link
CREATE OR REPLACE FUNCTION check_doctor_approval_before_link()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.doctors
    WHERE id = NEW.doctor_id AND verification_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'No se pueden vincular médicos que tengan estado de verificación pendiente.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_doctor_approval_before_link
  BEFORE INSERT ON public.doctor_patient_links
  FOR EACH ROW EXECUTE FUNCTION check_doctor_approval_before_link();
