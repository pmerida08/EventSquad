/**
 * Tests for lib/events.ts — pure utility functions
 * No network calls, no mocks needed.
 */

import { formatEventDate, formatDistance } from '../../lib/events'

// ── formatDistance ────────────────────────────────────────────────────────────

describe('formatDistance', () => {
  it('shows metres when under 1 km', () => {
    expect(formatDistance(0.5)).toBe('500 m')
    expect(formatDistance(0.85)).toBe('850 m')
    expect(formatDistance(0.001)).toBe('1 m')
  })

  it('shows km with one decimal when 1 km or more', () => {
    expect(formatDistance(1)).toBe('1,0 km')
    expect(formatDistance(2.5)).toBe('2,5 km')
    expect(formatDistance(455.9)).toBe('455,9 km')
  })

  it('uses comma as decimal separator (Spanish locale)', () => {
    expect(formatDistance(3.7)).toContain(',')
    expect(formatDistance(3.7)).toBe('3,7 km')
  })

  it('rounds metres correctly', () => {
    expect(formatDistance(0.4567)).toBe('457 m')
  })
})

// ── formatEventDate ───────────────────────────────────────────────────────────

describe('formatEventDate', () => {
  // Fixed ISO strings to avoid timezone flakiness
  const MAY_7 = '2026-05-07T19:00:00.000Z'
  const MAY_9 = '2026-05-09T09:30:00.000Z'

  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatEventDate(MAY_7)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('includes the day number', () => {
    const result = formatEventDate(MAY_7)
    // May 7 UTC → 7 or 8 depending on local TZ, but the string must have a number
    expect(result).toMatch(/\d/)
  })

  it('includes the time (HH:MM)', () => {
    const result = formatEventDate(MAY_7)
    // Should contain a time pattern like "21:00" or "19:00"
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('differs for different dates', () => {
    expect(formatEventDate(MAY_7)).not.toBe(formatEventDate(MAY_9))
  })
})
