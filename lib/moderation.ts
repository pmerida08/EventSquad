import { supabase } from './supabase';

/** Reporta a un usuario dentro de un grupo */
export async function reportUser(
  groupId: string,
  reportedId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc('report_user', {
    p_group_id:    groupId,
    p_reported_id: reportedId,
    p_reason:      reason,
  });
  if (error) throw error;
}

/** Vota para expulsar a un usuario del grupo.
 *  Si la mayoría (>50% de los no-target) vota, el usuario es expulsado automáticamente. */
export async function voteKickUser(
  groupId: string,
  targetId: string,
): Promise<void> {
  const { error } = await supabase.rpc('vote_kick_user', {
    p_group_id:  groupId,
    p_target_id: targetId,
  });
  if (error) throw error;
}

/** Expulsa directamente a un miembro (solo el owner puede). */
export async function kickMember(
  groupId: string,
  targetId: string,
): Promise<void> {
  const { error } = await supabase.rpc('kick_member', {
    p_group_id:  groupId,
    p_target_id: targetId,
  });
  if (error) throw error;
}

/** Traduce los errores de los RPCs de moderación a mensajes legibles */
export function parseModerationError(msg: string): string {
  if (msg.includes('NOT_MEMBER'))        return 'No eres miembro de este grupo.';
  if (msg.includes('SELF_REPORT'))       return 'No puedes reportarte a ti mismo.';
  if (msg.includes('SELF_VOTE'))         return 'No puedes votar para echarte a ti mismo.';
  if (msg.includes('SELF_KICK'))         return 'No puedes echarte a ti mismo.';
  if (msg.includes('USER_NOT_IN_GROUP')) return 'El usuario no está en este grupo.';
  if (msg.includes('CANNOT_KICK_OWNER')) return 'No puedes votar para echar al creador del grupo.';
  if (msg.includes('NOT_OWNER'))         return 'Solo el creador del grupo puede hacer esto.';
  return msg;
}
