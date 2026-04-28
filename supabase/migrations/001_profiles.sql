-- ============================================================
-- Migración 001: Tabla profiles, RLS, trigger y storage bucket
-- ============================================================

-- 1. Tabla profiles
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  verified      BOOLEAN     NOT NULL DEFAULT FALSE,
  expo_push_token TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Activar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Exponer a la Data API
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- 4. Políticas RLS
--    Lectura pública (cualquiera puede ver perfiles)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

--    Solo el propietario puede insertar su propio perfil
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

--    Solo el propietario puede actualizar su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Función y trigger: auto-crear perfil al registrarse
--    SECURITY DEFINER en schema privado para no exponerla via Data API
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Storage bucket para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                        -- público: las URLs no requieren auth
  5242880,                     -- 5 MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS del bucket avatars
--    Solo el propietario puede subir/actualizar/borrar su carpeta
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

--    Lectura pública (bucket ya es público, pero añadimos policy explícita)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
