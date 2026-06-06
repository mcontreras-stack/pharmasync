-- =============================================================================
-- PharmaSync - Script de Configuración de Supabase
-- EJECUTA ESTO COMPLETO en Supabase Studio > SQL Editor > New Query
-- Compatible con tablas existentes (agrega columnas faltantes)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: CREAR LA TABLA PROFILES (si no existe)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  full_name     TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'mother',
  status        TEXT        NOT NULL DEFAULT 'under_review',
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar columnas que pueden no existir en tablas ya creadas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone             TEXT;

-- Agregar constraints de CHECK si no existen (ignorar error si ya existen)
DO $$
BEGIN
  -- Constraint de role
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('mother', 'obstetrician', 'pediatrician', 'admin'));
  END IF;

  -- Constraint de status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_status_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('email_pending', 'under_review', 'pending_documents', 'approved', 'suspended', 'rejected'));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: HABILITAR RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: POLÍTICAS RLS
-- ─────────────────────────────────────────────────────────────────────────────
-- Limpiar políticas anteriores para evitar duplicados
DROP POLICY IF EXISTS "profiles_select_own"                ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"                ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger"            ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles"         ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup"         ON public.profiles;

-- Usuario autenticado: ve su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Usuario autenticado: actualiza su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin: ve TODOS los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- Admin: actualiza TODOS los perfiles
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- Admin: elimina perfiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- Trigger (service_role): puede insertar sin auth.uid()
-- WITH CHECK (true) es necesario porque el trigger corre antes de la sesión
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: TRIGGER - Auto-crear perfil al registrarse
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mother'),
    'under_review',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;   -- solo email, sin updated_at para máxima compatibilidad

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error (no bloquea registro): % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: ASEGURAR QUE EL ADMIN TENGA PERFIL CON ROLE='admin'
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'),
  'admin',
  'approved'
FROM auth.users
WHERE email = 'admin@alvisautomate.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin', status = 'approved';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: VERIFICAR EL RESULTADO FINAL
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
