import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno. Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.local',
  );
}

// SecureStore tiene límite de 2 KB por clave.
// Los tokens JWT de Supabase pueden superar ese límite,
// así que partimos valores grandes en chunks numerados.
const CHUNK_SIZE = 1800; // margen seguro bajo el límite de 2048 B

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const chunkCount = await SecureStore.getItemAsync(`${key}__n`);
    if (!chunkCount) return SecureStore.getItemAsync(key);

    const n = parseInt(chunkCount, 10);
    const parts = await Promise.all(
      Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}__${i}`)),
    );
    if (parts.some((p) => p === null)) return null;
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await Promise.all(
      Array.from({ length: chunks }, (_, i) =>
        SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)),
      ),
    );
    await SecureStore.setItemAsync(`${key}__n`, String(chunks));
  },

  async removeItem(key: string): Promise<void> {
    const chunkCount = await SecureStore.getItemAsync(`${key}__n`);
    if (chunkCount) {
      const n = parseInt(chunkCount, 10);
      await Promise.all([
        ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}__${i}`)),
        SecureStore.deleteItemAsync(`${key}__n`),
      ]);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// En web (eas update export estático / SSR) expo-secure-store no existe.
// Usamos almacenamiento en memoria: no persiste entre recargas pero evita
// crashear el proceso de exportación. La app real solo corre en nativo.
const WebMemoryStorage = (() => {
  const store: Record<string, string> = {};
  return {
    async getItem(key: string): Promise<string | null> {
      return store[key] ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
      store[key] = value;
    },
    async removeItem(key: string): Promise<void> {
      delete store[key];
    },
  };
})();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? WebMemoryStorage : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type { Database };
