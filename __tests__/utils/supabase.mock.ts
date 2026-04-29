/**
 * Shared Supabase mock — import this in any test that calls lib/* with supabase queries.
 */

export const mockSupabaseRpc    = jest.fn()
export const mockSupabaseFrom   = jest.fn()
export const mockSelect         = jest.fn()
export const mockEq             = jest.fn()
export const mockGte            = jest.fn()
export const mockLt             = jest.fn()
export const mockOrder          = jest.fn()
export const mockLimit          = jest.fn()
export const mockSingle         = jest.fn()
export const mockUpsert         = jest.fn()
export const mockInsert         = jest.fn()

/** All chainable query methods return the same object */
const chainable = {
  select: mockSelect,
  eq:     mockEq,
  gte:    mockGte,
  lt:     mockLt,
  order:  mockOrder,
  limit:  mockLimit,
  single: mockSingle,
  upsert: mockUpsert,
  insert: mockInsert,
}

function restoreChain() {
  Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable))
  mockSupabaseFrom.mockReturnValue(chainable)
}

restoreChain()

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc:  mockSupabaseRpc,
    from: mockSupabaseFrom,
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-test' } } }),
    },
    channel:       jest.fn().mockReturnValue({
      on:        jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}))

export function resetSupabaseMocks() {
  mockSupabaseRpc.mockReset()
  mockSupabaseFrom.mockReset()
  mockSelect.mockReset()
  mockEq.mockReset()
  mockGte.mockReset()
  mockLt.mockReset()
  mockOrder.mockReset()
  mockLimit.mockReset()
  mockSingle.mockReset()
  mockUpsert.mockReset()
  mockInsert.mockReset()
  restoreChain()
}
