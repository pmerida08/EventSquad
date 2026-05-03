/**
 * Tests for lib/voting.ts
 * Cubre: fetchProposals, addProposal, voteForProposal, parseVotingError, subscribeToVoting
 */

import {
  mockSupabaseRpc,
  mockSupabaseFrom,
  mockSelect,
  mockEq,
  mockOrder,
  mockIn,
  mockMaybeSingle,
  resetSupabaseMocks,
} from '../utils/supabase.mock'

import {
  fetchProposals,
  addProposal,
  voteForProposal,
  parseVotingError,
  subscribeToVoting,
  type ProposalWithVotes,
} from '../../lib/voting'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GROUP_ID    = 'group-uuid-1'
const PROPOSAL_ID = 'prop-uuid-1'
const USER_ID     = 'user-test'   // coincide con auth mock en supabase.mock.ts

const MOCK_PROPOSALS: ProposalWithVotes[] = [
  {
    id:            PROPOSAL_ID,
    group_id:      GROUP_ID,
    proposed_by:   USER_ID,
    location_name: 'Bar El Sol, C/ Mayor 10',
    lat:           40.4168,
    lng:           -3.7038,
    proposed_time: '2026-06-01T20:00:00Z',
    selected:      false,
    created_at:    '2026-05-01T10:00:00Z',
    vote_count:    2,
  },
  {
    id:            'prop-uuid-2',
    group_id:      GROUP_ID,
    proposed_by:   'user-other',
    location_name: 'Café Central',
    lat:           40.42,
    lng:           -3.70,
    proposed_time: '2026-06-01T21:00:00Z',
    selected:      false,
    created_at:    '2026-05-01T11:00:00Z',
    vote_count:    1,
  },
]

beforeEach(() => resetSupabaseMocks())

// ── fetchProposals ────────────────────────────────────────────────────────────

describe('fetchProposals', () => {
  function setupProposalsQuery(proposals: ProposalWithVotes[], voteData: { proposal_id: string } | null = null) {
    // Primera query: meetup_proposals_with_votes — termina en .order().order()
    mockOrder
      .mockReturnValueOnce({ // primer .order() devuelve chainable
        order:       mockOrder,
        eq:          mockEq,
        select:      mockSelect,
        in:          mockIn,
        maybeSingle: mockMaybeSingle,
      })
      .mockResolvedValueOnce({ data: proposals, error: null }) // segundo .order() resuelve

    // Segunda query: meetup_votes — termina en .maybeSingle()
    mockMaybeSingle.mockResolvedValueOnce({ data: voteData, error: null })
  }

  it('queries meetup_proposals_with_votes con el group_id correcto', async () => {
    setupProposalsQuery(MOCK_PROPOSALS)
    await fetchProposals(GROUP_ID)

    expect(mockSupabaseFrom).toHaveBeenCalledWith('meetup_proposals_with_votes')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('group_id', GROUP_ID)
  })

  it('devuelve las propuestas y el ID de la propuesta votada por el usuario', async () => {
    setupProposalsQuery(MOCK_PROPOSALS, { proposal_id: PROPOSAL_ID })
    const result = await fetchProposals(GROUP_ID)

    expect(result.proposals).toHaveLength(2)
    expect(result.proposals[0].location_name).toBe('Bar El Sol, C/ Mayor 10')
    expect(result.myVotedProposalId).toBe(PROPOSAL_ID)
  })

  it('devuelve myVotedProposalId null si el usuario no ha votado', async () => {
    setupProposalsQuery(MOCK_PROPOSALS, null)
    const result = await fetchProposals(GROUP_ID)

    expect(result.myVotedProposalId).toBeNull()
  })

  it('devuelve proposals vacío y no llama a meetup_votes si no hay propuestas', async () => {
    mockOrder
      .mockReturnValueOnce({ order: mockOrder, eq: mockEq, select: mockSelect, in: mockIn, maybeSingle: mockMaybeSingle })
      .mockResolvedValueOnce({ data: [], error: null })

    const result = await fetchProposals(GROUP_ID)

    expect(result.proposals).toHaveLength(0)
    expect(result.myVotedProposalId).toBeNull()
    // La segunda query no se ejecuta
    expect(mockMaybeSingle).not.toHaveBeenCalled()
  })

  it('devuelve proposals vacío cuando data es null', async () => {
    mockOrder
      .mockReturnValueOnce({ order: mockOrder, eq: mockEq, select: mockSelect, in: mockIn, maybeSingle: mockMaybeSingle })
      .mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchProposals(GROUP_ID)
    expect(result.proposals).toHaveLength(0)
  })

  it('lanza error cuando Supabase devuelve un error', async () => {
    mockOrder
      .mockReturnValueOnce({ order: mockOrder, eq: mockEq, select: mockSelect, in: mockIn, maybeSingle: mockMaybeSingle })
      .mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } })

    await expect(fetchProposals(GROUP_ID)).rejects.toMatchObject({ message: 'permission denied' })
  })

  it('lanza error cuando el usuario no está autenticado', async () => {
    const { supabase } = require('../../lib/supabase')
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    await expect(fetchProposals(GROUP_ID)).rejects.toThrow('No autenticado')
  })

  it('consulta meetup_votes con los IDs de las propuestas', async () => {
    setupProposalsQuery(MOCK_PROPOSALS, { proposal_id: PROPOSAL_ID })
    await fetchProposals(GROUP_ID)

    expect(mockSupabaseFrom).toHaveBeenCalledWith('meetup_votes')
    expect(mockIn).toHaveBeenCalledWith(
      'proposal_id',
      MOCK_PROPOSALS.map((p) => p.id),
    )
  })
})

// ── addProposal ───────────────────────────────────────────────────────────────

describe('addProposal', () => {
  const LOC  = 'Bar El Sol'
  const LAT  = 40.4168
  const LNG  = -3.7038
  const TIME = '2026-06-01T20:00:00.000Z'

  it('llama al RPC add_meetup_proposal con los argumentos correctos', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: PROPOSAL_ID, error: null })

    await addProposal(GROUP_ID, LOC, LAT, LNG, TIME)

    expect(mockSupabaseRpc).toHaveBeenCalledWith('add_meetup_proposal', {
      p_group_id:      GROUP_ID,
      p_location_name: LOC,
      p_lat:           LAT,
      p_lng:           LNG,
      p_proposed_time: TIME,
    })
  })

  it('devuelve el ID de la propuesta creada', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: PROPOSAL_ID, error: null })

    const result = await addProposal(GROUP_ID, LOC, LAT, LNG, TIME)
    expect(result).toBe(PROPOSAL_ID)
  })

  it('lanza error cuando el RPC falla', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'NOT_MEMBER' } })

    await expect(addProposal(GROUP_ID, LOC, LAT, LNG, TIME)).rejects.toMatchObject({
      message: 'NOT_MEMBER',
    })
  })
})

// ── voteForProposal ───────────────────────────────────────────────────────────

describe('voteForProposal', () => {
  it('llama al RPC vote_for_proposal con el proposal_id correcto', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: null })

    await voteForProposal(PROPOSAL_ID)

    expect(mockSupabaseRpc).toHaveBeenCalledWith('vote_for_proposal', {
      p_proposal_id: PROPOSAL_ID,
    })
  })

  it('resuelve sin valor cuando el voto tiene éxito', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: null })

    await expect(voteForProposal(PROPOSAL_ID)).resolves.toBeUndefined()
  })

  it('lanza error en ALREADY_VOTED', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'ALREADY_VOTED' } })

    await expect(voteForProposal(PROPOSAL_ID)).rejects.toMatchObject({ message: 'ALREADY_VOTED' })
  })

  it('lanza error en VOTING_CLOSED', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'VOTING_CLOSED' } })

    await expect(voteForProposal(PROPOSAL_ID)).rejects.toMatchObject({ message: 'VOTING_CLOSED' })
  })
})

// ── parseVotingError ──────────────────────────────────────────────────────────

describe('parseVotingError', () => {
  it('traduce ALREADY_VOTED', () => {
    expect(parseVotingError('ALREADY_VOTED')).toBe('Ya has votado en este grupo.')
  })

  it('traduce VOTING_CLOSED', () => {
    expect(parseVotingError('VOTING_CLOSED')).toBe('La votación ya ha terminado.')
  })

  it('traduce NOT_MEMBER', () => {
    expect(parseVotingError('NOT_MEMBER')).toBe('No eres miembro de este grupo.')
  })

  it('traduce PROPOSAL_NOT_FOUND', () => {
    expect(parseVotingError('PROPOSAL_NOT_FOUND')).toBe('Propuesta no encontrada.')
  })

  it('devuelve el mensaje original para errores desconocidos', () => {
    const msg = 'Unexpected database error'
    expect(parseVotingError(msg)).toBe(msg)
  })

  it('detecta el código aunque venga con prefijo del driver de Supabase', () => {
    expect(parseVotingError('ERROR: ALREADY_VOTED')).toBe('Ya has votado en este grupo.')
    expect(parseVotingError('new row violates: VOTING_CLOSED')).toBe('La votación ya ha terminado.')
  })
})

// ── subscribeToVoting ─────────────────────────────────────────────────────────

describe('subscribeToVoting', () => {
  it('crea un canal con el nombre correcto', () => {
    const { supabase } = require('../../lib/supabase')
    subscribeToVoting(GROUP_ID, jest.fn())

    expect(supabase.channel).toHaveBeenCalledWith(`voting:${GROUP_ID}`)
  })

  it('suscribe a cambios en meetup_proposals', () => {
    const { supabase } = require('../../lib/supabase')
    const mockChannel = supabase.channel()
    subscribeToVoting(GROUP_ID, jest.fn())

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'meetup_proposals', filter: `group_id=eq.${GROUP_ID}` }),
      expect.any(Function),
    )
  })

  it('suscribe a cambios en meetup_votes', () => {
    const { supabase } = require('../../lib/supabase')
    const mockChannel = supabase.channel()
    subscribeToVoting(GROUP_ID, jest.fn())

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'meetup_votes' }),
      expect.any(Function),
    )
  })

  it('devuelve una función de limpieza que elimina el canal', () => {
    const { supabase } = require('../../lib/supabase')
    const channel = supabase.channel()
    const unsub = subscribeToVoting(GROUP_ID, jest.fn())

    unsub()

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel)
  })
})
