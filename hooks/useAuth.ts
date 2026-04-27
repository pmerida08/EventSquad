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
    // Recuperar sesión existente (p.ej. token guardado en AsyncStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(console.error);
      }
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
