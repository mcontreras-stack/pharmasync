-- =============================================================================
-- PharmaSync - Script de Configuración de Supabase
-- EJECUTA ESTO COMPLETO en Supabase Studio > SQL Editor > New Query
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: CREAR LA TABLA PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  full_name     TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'mother'
                            CHECK (role IN ('mother', 'obstetrician', 'pediatrician', 'admin')),
  status        TEXT        NOT NULL DEFAULT 'under_review'
                            CHECK (status IN ('email_pending', 'under_review', 'pending_documents', 'approved', 'suspended', 'rejected')),
  phone         TEXT,
  avatar_url    TEXT,
  suspension_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: HABILITAR RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: POLÍTICAS RLS (limpiar primero para evitar duplicados)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger"        ON public.profiles;
-- Nombres antiguos también por si acaso:
DROP POLICY IF EXISTS "Users can view their own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"    ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles"        ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup"        ON public.profiles;

-- El usuario autenticado ve su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- El usuario autenticado actualiza su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ADMIN: puede SELECT todos los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- ADMIN: puede UPDATE todos los perfiles
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- ADMIN: puede DELETE perfiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS me
      WHERE me.id = auth.uid() AND me.role = 'admin'
    )
  );

-- ⚠️  CLAVE: El trigger se ejecuta como SECURITY DEFINER (service_role),
--     pero necesitamos una política permisiva para INSERT de service_role.
--     Supabase recomienda usar la función auth.uid() IS NOT NULL OR true para triggers.
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (true);   -- El trigger corre como service_role y bypasea RLS,
                       -- pero si hay algún check adicional, este true lo permite.


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: TRIGGER - Auto-crear perfil cuando alguien se registra
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠️ CRÍTICO: El bloque EXCEPTION evita que un error en el trigger
--    cancele el registro del usuario en auth.users.
--    Sin esto, Supabase devuelve "Database error saving new user".

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- corre como superuser, bypasea RLS
SET search_path = public   -- necesario para SECURITY DEFINER functions
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
    SET
      email      = EXCLUDED.email,
      updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero NO falla el registro en auth.users
    RAISE WARNING 'handle_new_user error (non-fatal): % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Limpiar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: INSERTAR EL PERFIL DEL ADMIN MANUALMENTE
-- ─────────────────────────────────────────────────────────────────────────────
-- Si ya tienes el admin creado en Authentication > Users pero no aparece
-- en la tabla profiles, ejecuta esto DESPUÉS de encontrar su UUID:

-- 5a. Buscar el UUID del admin:
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@alvisautomate.com';

-- 5b. Insertar/actualizar su perfil con rol admin:
--     (reemplaza el UUID con el que apareció en 5a)
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
  SET role = 'admin', status = 'approved', updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: VERIFICAR QUE TODO QUEDÓ BIEN
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;
