-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 7: Auditoría y endurecimiento de seguridad
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Eliminar INSERT directo en groups ──────────────────────────────────────
-- Cualquier usuario autenticado podía crear grupos directamente sin pasar
-- por el RPC create_group, saltándose la validación de 1 grupo/evento/usuario.
DROP POLICY IF EXISTS "groups_insert_authenticated" ON public.groups;

-- ── 2. Perfiles: solo accesibles para usuarios autenticados ───────────────────
-- Evita que usuarios anónimos puedan leer datos de perfiles (incluido bio, avatar).
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 3. Miembros de grupos: solo accesibles para usuarios autenticados ─────────
DROP POLICY IF EXISTS "group_members_read_public" ON public.group_members;
CREATE POLICY "group_members_read_authenticated"
  ON public.group_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 4. Grupos: solo accesibles para usuarios autenticados ────────────────────
DROP POLICY IF EXISTS "groups_read_public" ON public.groups;
CREATE POLICY "groups_read_authenticated"
  ON public.groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 5. Impedir que el owner abandone el grupo vía DELETE directo ──────────────
-- Sin esta restricción un owner podría abandonar su propio grupo dejándolo
-- sin propietario. Los owners deben usar deleteGroup para eliminarlo completo.
DROP POLICY IF EXISTS "group_members_delete_own" ON public.group_members;
CREATE POLICY "group_members_delete_own"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id AND role = 'member');

-- ── 6. Ocultar expo_push_token de la Data API ─────────────────────────────────
-- El token es write-only desde el cliente: se escribe al registrar notificaciones
-- y solo se lee en triggers (SECURITY DEFINER, no afectados por column-level grants).
REVOKE SELECT (expo_push_token) ON public.profiles FROM authenticated;
REVOKE SELECT (expo_push_token) ON public.profiles FROM anon;
