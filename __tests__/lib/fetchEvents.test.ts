/**
 * Tests for lib/events.ts — async fetch functions (with Supabase mocked)
 */

import {
  mockSupabaseRpc,
  mockSupabaseFrom,
  mockSelect,
  mockGte,
  mockOrder,
  mockEq,
  resetSupabaseMocks,
} from '../utils/supabase.mock'

// Import AFTER mock setup (jest.mock hoists automatically)
import { fetchEventsNear, fetchAllEvents, fetchEventById } from '../../lib/events'

const MOCK_EVENTS = [
  { id: '1', name: 'Concierto A', date: '2026-05-10T19:00:00Z', venue: 'Sala 1', address: 'BCN', lat: 41.38, lng: 2.17, category: 'concierto', image_url: null, source_id: 'tm-1', scraped_at: '2026-04-29T00:00:00Z' },
  { id: '2', name: 'Festival B', date: '2026-07-01T20:00:00Z', venue: 'Parque', address: 'MAD', lat: 40.41, lng: -3.70, category: 'festival', image_url: 'https://img.com/b.jpg', source_id: 'tm-2', scraped_at: '2026-04-29T00:00:00Z' },
]

beforeEach(() => resetSupabaseMocks())

// ── fetchEventsNear ───────────────────────────────────────────────────────────

describe('fetchEventsNear', () => {
  it('calls supabase.rpc with correct params', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: MOCK_EVENTS, error: null })

    await fetchEventsNear(41.38, 2.17, 50, 'concierto')

    expect(mockSupabaseRpc).toHaveBeenCalledWith('events_near', {
      user_lat:  41.38,
      user_lng:  2.17,
      radius_km: 50,
      cat:       'concierto',
    })
  })

  it('passes null cat when no category given', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: [], error: null })

    await fetchEventsNear(41.38, 2.17)

    expect(mockSupabaseRpc).toHaveBeenCalledWith('events_near', expect.objectContaining({
      cat: null,
    }))
  })

  it('returns the data array from Supabase', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: MOCK_EVENTS, error: null })

    const result = await fetchEventsNear(41.38, 2.17)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Concierto A')
  })

  it('returns empty array when Supabase returns null data', async () => {
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchEventsNear(41.38, 2.17)

    expect(result).toEqual([])
  })

  it('throws when Supabase returns an error', async () => {
    const mockError = { message: 'Function not found', code: '42883' }
    mockSupabaseRpc.mockResolvedValueOnce({ data: null, error: mockError })

    await expect(fetchEventsNear(41.38, 2.17)).rejects.toEqual(mockError)
  })
})

// ── fetchAllEvents ────────────────────────────────────────────────────────────

describe('fetchAllEvents', () => {
  it('queries the events table', async () => {
    mockOrder.mockResolvedValueOnce({ data: MOCK_EVENTS, error: null })

    await fetchAllEvents()

    expect(mockSupabaseFrom).toHaveBeenCalledWith('events')
    expect(mockSelect).toHaveBeenCalledWith('*')
  })

  it('filters by category when provided', async () => {
    mockEq.mockResolvedValueOnce({ data: [MOCK_EVENTS[0]], error: null })

    await fetchAllEvents('concierto')

    expect(mockEq).toHaveBeenCalledWith('category', 'concierto')
  })

  it('returns events data', async () => {
    mockOrder.mockResolvedValueOnce({ data: MOCK_EVENTS, error: null })

    const result = await fetchAllEvents()

    expect(result).toHaveLength(2)
  })

  it('returns empty array when data is null', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchAllEvents()

    expect(result).toEqual([])
  })

  it('throws on Supabase error', async () => {
    const mockError = { message: 'DB error' }
    mockOrder.mockResolvedValueOnce({ data: null, error: mockError })

    await expect(fetchAllEvents()).rejects.toEqual(mockError)
  })
})

// ── fetchEventById ────────────────────────────────────────────────────────────

describe('fetchEventById', () => {
  it('queries by id', async () => {
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: jest.fn().mockResolvedValueOnce({ data: MOCK_EVENTS[0], error: null }) })

    await fetchEventById('1')

    expect(mockSupabaseFrom).toHaveBeenCalledWith('events')
    expect(mockEq).toHaveBeenCalledWith('id', '1')
  })

  it('returns null for PGRST116 (not found)', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'No rows' },
        }),
      }),
    })

    const result = await fetchEventById('nonexistent')

    expect(result).toBeNull()
  })
})
