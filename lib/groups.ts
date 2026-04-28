import { supabase } from './supabase';
import type { Database } from '@/types/database.types';

export type GroupRow         = Database['public']['Tables']['groups']['Row'];
export type GroupMemberRow   = Database['public']['Tables']['group_members']['Row'];
export type GroupWithCount   = Database['public']['Views']['groups_with_member_count']['Row'];

export type MemberWithProfile = GroupMemberRow & {
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
};

/** Grupos de un evento con conteo de miembros */
export async function fetchGroupsByEvent(eventId: string): Promise<GroupWithCount[]> {
  const { data, error } = await supabase
    .from('groups_with_member_count')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Detalle de un grupo */
export async function fetchGroupById(groupId: string): Promise<GroupRow | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/** Miembros de un grupo con sus perfiles */
export async function fetchGroupMembers(groupId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(id, display_name, avatar_url, verified)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MemberWithProfile[];
}

/** Grupos a los que pertenece el usuario actual */
export async function fetchMyGroups(): Promise<(GroupWithCount & { events: { name: string; date: string; image_url: string | null } | null })[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: mErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);
  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data, error } = await supabase
    .from('groups_with_member_count')
    .select('*, events(name, date, image_url)')
    .in('id', groupIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as (GroupWithCount & { events: { name: string; date: string; image_url: string | null } | null })[];
}

/** ID del grupo al que pertenece el usuario en un evento dado, o null */
export async function getMyGroupForEvent(eventId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, groups!inner(event_id)')
    .eq('user_id', user.id)
    .eq('groups.event_id', eventId)
    .maybeSingle();
  if (error) throw error;
  return data?.group_id ?? null;
}

/** Crear un grupo y unirse automáticamente como owner */
export async function createGroup(
  eventId: string,
  name: string,
  description: string,
  maxMembers: number,
): Promise<GroupRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ event_id: eventId, name, description: description || null, max_members: maxMembers, created_by: user.id })
    .select()
    .single();
  if (gErr) throw gErr;

  // Unirse como owner
  const { error: mErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner' });
  if (mErr) throw mErr;

  return group;
}

/** Unirse a un grupo mediante la función segura join_group */
export async function joinGroup(groupId: string): Promise<void> {
  const { error } = await supabase.rpc('join_group', { p_group_id: groupId });
  if (error) throw error;
}

/** Salir de un grupo */
export async function leaveGroup(groupId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);
  if (error) throw error;
}

/** Parsea el código de error de join_group en un mensaje legible */
export function parseGroupError(msg: string): string {
  if (msg.includes('UNVERIFIED'))      return 'Debes verificar tu identidad antes de unirte a un grupo.';
  if (msg.includes('ALREADY_IN_GROUP')) return 'Ya estás en un grupo para este evento.';
  if (msg.includes('GROUP_FULL'))       return 'El grupo está completo.';
  if (msg.includes('NOT_FOUND'))        return 'Grupo no encontrado.';
  return msg;
}
