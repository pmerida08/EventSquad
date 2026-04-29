/**
 * Tests for lib/messages.ts — fetch & send functions (Supabase mocked)
 */

import {
  mockSupabaseFrom,
  mockSelect,
  mockEq,
  mockOrder,
  mockLimit,
  mockInsert,
  resetSupabaseMocks,
} from '../utils/supabase.mock'

import { fetchMessages, sendMessage } from '../../lib/messages'

const GROUP_ID = 'group-uuid-1'

const MOCK_MESSAGES = [
  {
    id: 'msg-1', group_id: GROUP_ID, user_id: 'user-1', content: 'Hola!', created_at: '2026-05-10T20:00:00Z',
    profiles: { display_name: 'Ana', avatar_url: null },
  },
  {
    id: 'msg-2', group_id: GROUP_ID, user_id: 'user-2', content: '¿A qué hora llegáis?', created_at: '2026-05-10T19:58:00Z',
    profiles: { display_name: 'Luis', avatar_url: 'https://cdn.test/luis.jpg' },
  },
]

beforeEach(() => resetSupabaseMocks())

// ── fetchMessages ─────────────────────────────────────────────────────────────

describe('fetchMessages', () => {
  it('queries the messages table with group_id filter', async () => {
    mockLimit.mockResolvedValueOnce({ data: MOCK_MESSAGES, error: null })

    await fetchMessages(GROUP_ID)

    expect(mockSupabaseFrom).toHaveBeenCalledWith('messages')
    expect(mockSelect).toHaveBeenCalledWith('*, profiles(display_name, avatar_url)')
    expect(mockEq).toHaveBeenCalledWith('group_id', GROUP_ID)
  })

  it('returns messages array', async () => {
    mockLimit.mockResolvedValueOnce({ data: MOCK_MESSAGES, error: null })

    const result = await fetchMessages(GROUP_ID)

    expect(result).toHaveLength(2)
    expect(result[0].content).toBe('Hola!')
  })

  it('returns empty array when no messages', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchMessages(GROUP_ID)

    expect(result).toEqual([])
  })

  it('throws on Supabase error', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(fetchMessages(GROUP_ID)).rejects.toMatchObject({ message: 'DB error' })
  })
})

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  const MOCK_SENT = {
    id: 'msg-new', group_id: GROUP_ID, user_id: 'user-1',
    content: 'Nos vemos allí', created_at: '2026-05-10T20:05:00Z',
  }

  beforeEach(() => {
    // Mock auth.getUser
    const supabaseMod = require('../../lib/supabase')
    supabaseMod.supabase.auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    }
  })

  it('inserts message with correct fields', async () => {
    const mockSingle = jest.fn().mockResolvedValueOnce({ data: MOCK_SENT, error: null })
    const mockSelectAfterInsert = jest.fn().mockReturnValue({ single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelectAfterInsert })

    await sendMessage(GROUP_ID, '  Nos vemos allí  ')

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      group_id: GROUP_ID,
      user_id:  'user-1',
      content:  'Nos vemos allí',   // trimmed
    }))
  })

  it('returns the inserted message', async () => {
    const mockSingle = jest.fn().mockResolvedValueOnce({ data: MOCK_SENT, error: null })
    const mockSelectAfterInsert = jest.fn().mockReturnValue({ single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelectAfterInsert })

    const result = await sendMessage(GROUP_ID, 'Nos vemos allí')

    expect(result.id).toBe('msg-new')
    expect(result.content).toBe('Nos vemos allí')
  })
})
