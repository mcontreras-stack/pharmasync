-- =============================================================================
-- PharmaSync - Script de Configuración Inicial de Supabase
-- Ejecuta esto en Supabase Studio > SQL Editor
-- =============================================================================

-- 1. CREAR TABLA PROFILES (si no existe)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'mother' CHECK (role IN ('mother', 'obstetrician', 'pediatrician', 'admin')),
  status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN ('email_pending', 'under_review', 'pending_documents', 'approved', 'suspended', 'rejected')),
  phone TEXT,
  avatar_url TEXT,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS (Row Level Security)
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS
-- =============================================================================

-- Eliminar políticas anteriores si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;

-- Política: Cada usuario puede ver su propio perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Cada usuario puede actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política: Los admins pueden ver TODOS los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden actualizar TODOS los perfiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Los admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Permitir inserción durante el registro (upsert en signUp)
CREATE POLICY "Allow insert during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. TRIGGER: Auto-crear perfil cuando un usuario se registra en auth
-- =============================================================================
-- Esto crea un perfil automáticamente cuando alguien se registra con Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mother'),
    'under_review',
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFICAR: Ver los perfiles existentes
-- =============================================================================
-- Descomenta esto para verificar qué hay en la tabla:
-- SELECT id, email, full_name, role, status, created_at FROM public.profiles ORDER BY created_at DESC;

-- 6. ADMIN MANUAL: Si el admin fue creado pero no aparece en profiles
-- =============================================================================
-- Reemplaza 'admin@alvisautomate.com' con el correo real de tu admin
-- y el UUID con el que aparece en Authentication > Users en Supabase

-- Primero busca el UUID del admin:
-- SELECT id, email FROM auth.users WHERE email = 'admin@alvisautomate.com';

-- Luego inserta/actualiza el perfil manualmente:
-- INSERT INTO public.profiles (id, email, full_name, role, status)
-- VALUES ('UUID-DEL-ADMIN-AQUI', 'admin@alvisautomate.com', 'Super Admin', 'admin', 'approved')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'approved';
