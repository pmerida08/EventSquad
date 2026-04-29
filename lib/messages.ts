import { supabase } from './supabase'
import type { Database } from '@/types/database.types'

export type MessageRow = Database['public']['Tables']['messages']['Row']

/** Mensaje enriquecido con datos del perfil del autor */
export type MessageWithProfile = MessageRow & {
  profiles: {
    display_name: string
    avatar_url:   string | null
  }
}

const PAGE_SIZE = 40

/** Carga los últimos mensajes de un grupo (paginados por cursor) */
export async function fetchMessages(
  groupId: string,
  beforeCursor?: string,   // ISO timestamp — carga mensajes anteriores a esta fecha
): Promise<MessageWithProfile[]> {
  let query = supabase
    .from('messages')
    .select('*, profiles(display_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (beforeCursor) {
    query = query.lt('created_at', beforeCursor)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MessageWithProfile[]
}

/** Envía un mensaje al grupo */
export async function sendMessage(groupId: string, content: string): Promise<MessageRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('messages')
    .insert({ group_id: groupId, user_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Suscripción Realtime a nuevos mensajes de un grupo */
export function subscribeToMessages(
  groupId: string,
  onNewMessage: (msg: MessageWithProfile) => void,
) {
  const channel = supabase
    .channel(`messages:${groupId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
      async (payload) => {
        // Enriquecer el nuevo mensaje con el perfil del autor
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(display_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) onNewMessage(data as MessageWithProfile)
      },
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

/** Presence: indicador de "escribiendo..." */
export function subscribeToTyping(
  groupId: string,
  myUserId: string,
  onTypingChange: (typingNames: string[]) => void,
) {
  const channel = supabase.channel(`typing:${groupId}`, {
    config: { presence: { key: myUserId } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ display_name: string }>()
      const names = Object.entries(state)
        .filter(([key]) => key !== myUserId)
        .map(([, presences]) => presences[0]?.display_name ?? 'Alguien')
      onTypingChange(names)
    })
    .subscribe()

  return {
    startTyping: (displayName: string) =>
      channel.track({ display_name: displayName, typing: true }),
    stopTyping: () => channel.untrack(),
    unsubscribe: () => supabase.removeChannel(channel),
  }
}
