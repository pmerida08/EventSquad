import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Inicializa la sesión de Supabase al arrancar la app y escucha cambios.
 * Debe llamarse UNA SOLA VEZ en el layout raíz.
 */
export function useAuthInitializer() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Recuperar sesión existente. Si el refresh token guardado es inválido
    // (expirado, revocado o de otra instancia), Supabase lanza AuthApiError;
    // en ese caso limpiamos el storage y dejamos al usuario sin sesión.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut().catch(() => null);
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setLoading(false);

      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(console.error);
      }
    }).catch(() => {
      // Red caída u otro error inesperado: dejar sin sesión
      supabase.auth.signOut().catch(() => null);
      setSession(null);
      setLoading(false);
    });

    // Escuchar eventos de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id);
            setProfile(profile);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading]);
}
