import { supabase } from './supabase';
import type { Database } from '@/types/database.types';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventNear = Database['public']['Functions']['events_near']['Returns'][number];

// Categorías disponibles
export const EVENT_CATEGORIES = [
  'concierto',
  'festival',
  'electrónica',
  'flamenco',
  'fiesta',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Formatea una fecha ISO a texto legible en español */
export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formatea la distancia: "1,2 km" o "850 m" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * Obtiene eventos cercanos usando la RPC events_near (Haversine).
 * Si no hay coordenadas, devuelve todos los eventos ordenados por fecha.
 */
export async function fetchEventsNear(
  lat: number,
  lng: number,
  radiusKm = 200,
  category?: string,
): Promise<EventNear[]> {
  const { data, error } = await supabase.rpc('events_near', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
    cat: category ?? null,
  });

  if (error) throw error;
  return data ?? [];
}

/** Obtiene todos los eventos sin filtro de ubicación, ordenados por fecha */
export async function fetchAllEvents(category?: string): Promise<EventRow[]> {
  let query = supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Obtiene un evento por ID */
export async function fetchEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}
