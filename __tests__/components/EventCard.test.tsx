/**
 * Component tests for EventCard
 * Pattern: Arrange → Act → Assert (adapted from the e2e-testing skill's POM approach)
 */

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { EventCard } from '../../components/EventCard'
import type { EventRow, EventNear } from '../../lib/events'

// ── Fixtures (analogous to the skill's fixtures/data.ts) ─────────────────────

const BASE_EVENT: EventRow = {
  id:         'test-uuid-1',
  name:       'Eric Clapton - European Tour 2026',
  date:       '2026-05-10T19:00:00.000Z',
  venue:      'Palau Sant Jordi',
  address:    'Passeig Olímpic, Barcelona',
  lat:        41.3614,
  lng:        2.1528,
  category:   'concierto',
  image_url:  null,
  source_id:  'tm-abc123',
  scraped_at: '2026-04-29T00:00:00.000Z',
}

const EVENT_WITH_DISTANCE: EventNear = {
  ...BASE_EVENT,
  distance_km: 2.5,
}

const FLAMENCO_EVENT: EventRow = {
  ...BASE_EVENT,
  id:       'test-uuid-2',
  name:     'Tablao Flamenco 1911',
  category: 'flamenco',
  venue:    'Tablao Flamenco 1911',
}

// ── EventCard — render tests ──────────────────────────────────────────────────

describe('EventCard', () => {
  const onPress = jest.fn()

  beforeEach(() => onPress.mockClear())

  it('renders the event name', () => {
    render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    expect(screen.getByText('Eric Clapton - European Tour 2026')).toBeTruthy()
  })

  it('renders the venue name', () => {
    render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    expect(screen.getByText('Palau Sant Jordi')).toBeTruthy()
  })

  it('renders the category badge in uppercase', () => {
    render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    expect(screen.getByText('CONCIERTO')).toBeTruthy()
  })

  it('does NOT show distance when not an EventNear', () => {
    render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    expect(screen.queryByText(/km/)).toBeNull()
  })

  it('shows formatted distance when EventNear is provided', () => {
    render(<EventCard event={EVENT_WITH_DISTANCE} onPress={onPress} />)
    expect(screen.getByText('2,5 km')).toBeTruthy()
  })

  it('renders different categories', () => {
    render(<EventCard event={FLAMENCO_EVENT} onPress={onPress} />)
    expect(screen.getByText('FLAMENCO')).toBeTruthy()
  })

  it('renders the date string', () => {
    render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    // formatEventDate should produce some date text — just check it's there
    const dateTexts = screen.getAllByText(/\d{1,2}:\d{2}/)
    expect(dateTexts.length).toBeGreaterThan(0)
  })

  it('is pressable (has onPress handler)', () => {
    const { getByRole } = render(<EventCard event={BASE_EVENT} onPress={onPress} />)
    // Pressable renders as a button role on some platforms; check component exists
    expect(getByRole('button')).toBeTruthy()
  })
})
