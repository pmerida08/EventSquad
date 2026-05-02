import { supabase } from './supabase'

export interface ProposalWithVotes {
  id:            string
  group_id:      string
  proposed_by:   string
  location_name: string
  lat:           number
  lng:           number
  proposed_time: string
  selected:      boolean
  created_at:    string
  vote_count:    number
}

export interface ProposalsResult {
  proposals:          ProposalWithVotes[]
  myVotedProposalId:  string | null
}

/** Propuestas de un grupo con conteo de votos e ID de la propuesta votada por el usuario */
export async function fetchProposals(groupId: string): Promise<ProposalsResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('meetup_proposals_with_votes')
    .select('*')
    .eq('group_id', groupId)
    .order('vote_count', { ascending: false })
    .order('created_at',  { ascending: true })

  if (error) throw error
  const proposals = (data ?? []) as unknown as ProposalWithVotes[]

  let myVotedProposalId: string | null = null
  if (proposals.length > 0) {
    const { data: vote } = await supabase
      .from('meetup_votes')
      .select('proposal_id')
      .eq('user_id', user.id)
      .in('proposal_id', proposals.map((p) => p.id))
      .maybeSingle()
    myVotedProposalId = vote?.proposal_id ?? null
  }

  return { proposals, myVotedProposalId }
}

/** Añade una nueva propuesta de punto de encuentro (solo miembros del grupo) */
export async function addProposal(
  groupId:      string,
  locationName: string,
  lat:          number,
  lng:          number,
  proposedTime: string,   // ISO timestamp
): Promise<string> {
  const { data, error } = await supabase.rpc('add_meetup_proposal', {
    p_group_id:      groupId,
    p_location_name: locationName,
    p_lat:           lat,
    p_lng:           lng,
    p_proposed_time: proposedTime,
  })
  if (error) throw error
  return data as string
}

/** Vota por una propuesta. 1 voto por usuario por grupo. */
export async function voteForProposal(proposalId: string): Promise<void> {
  const { error } = await supabase.rpc('vote_for_proposal', {
    p_proposal_id: proposalId,
  })
  if (error) throw error
}

/** Traduce errores de los RPCs de votación a mensajes legibles */
export function parseVotingError(msg: string): string {
  if (msg.includes('ALREADY_VOTED'))      return 'Ya has votado en este grupo.'
  if (msg.includes('VOTING_CLOSED'))      return 'La votación ya ha terminado.'
  if (msg.includes('NOT_MEMBER'))         return 'No eres miembro de este grupo.'
  if (msg.includes('PROPOSAL_NOT_FOUND')) return 'Propuesta no encontrada.'
  return msg
}

/**
 * Suscripción Realtime a cambios de propuestas y votos de un grupo.
 * Llama a `onUpdate` en cualquier INSERT/UPDATE/DELETE — el componente
 * hace el refetch completo para mantener los conteos actualizados.
 */
export function subscribeToVoting(groupId: string, onUpdate: () => void): () => void {
  const channel = supabase
    .channel(`voting:${groupId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetup_proposals', filter: `group_id=eq.${groupId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetup_votes' },
      onUpdate,
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
