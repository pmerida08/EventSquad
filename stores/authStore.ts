import { create } from 'zustand';

import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;

  // Helpers de lectura
  isAuthenticated: () => boolean;
  hasProfile: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () => set({ session: null, user: null, profile: null }),

  isAuthenticated: () => get().session !== null,

  hasProfile: () => {
    const profile = get().profile;
    return profile !== null && profile.display_name.trim().length > 0;
  },
}));
