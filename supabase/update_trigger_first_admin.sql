-- Actualizar el trigger para que el primer usuario sea automáticamente Admin
-- Ejecuta este script en tu consola SQL de Supabase

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
  admin_count INT;
BEGIN
  -- Verificar si hay algún admin en el sistema
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- Si no hay admins, el nuevo usuario será admin
  is_first_user := (admin_count = 0);

  INSERT INTO public.profiles (id, email, full_name, role, status, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'),
    CASE WHEN is_first_user THEN 'admin'::public.user_role ELSE COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'mother'::public.user_role) END,
    CASE WHEN is_first_user THEN 'approved' ELSE 'email_pending' END,
    new.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
