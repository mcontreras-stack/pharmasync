-- Database Migration v3: HIPAA Consent Logs, Privacy Requests, and AI Usage Stats
-- Target: Supabase PostgreSQL Database Schema

-- 1. CREATE HIPAA CONSENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.hipaa_consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  consent_type text NOT NULL,
  version text NOT NULL,
  ip_address text NOT NULL,
  accepted_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on hipaa_consent_logs
ALTER TABLE public.hipaa_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own HIPAA consent logs"
  ON public.hipaa_consent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all HIPAA consent logs"
  ON public.hipaa_consent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own HIPAA consent logs"
  ON public.hipaa_consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 2. CREATE PRIVACY REQUESTS TABLE (GDPR / HIPAA rights)
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('export', 'delete')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'canceled')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on privacy_requests
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own privacy requests"
  ON public.privacy_requests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all privacy requests"
  ON public.privacy_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 3. CREATE AI USAGE STATS TABLE
CREATE TABLE IF NOT EXISTS public.ai_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  model text NOT NULL CHECK (model IN ('gpt-4o', 'claude-3-5-sonnet')),
  tokens_prompt integer NOT NULL,
  tokens_completion integer NOT NULL,
  cost_usd decimal(10, 4) NOT NULL,
  timestamp timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on ai_usage_stats
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI usage statistics"
  ON public.ai_usage_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can record AI usage statistics"
  ON public.ai_usage_stats FOR INSERT
  WITH CHECK (true);
