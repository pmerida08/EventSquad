/**
 * Component tests for EventCardSkeleton
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { EventCardSkeleton } from '../../components/EventCardSkeleton'

describe('EventCardSkeleton', () => {
  it('renders without crashing', () => {
    expect(() => render(<EventCardSkeleton />)).not.toThrow()
  })

  it('renders a non-empty component tree', () => {
    const { toJSON } = render(<EventCardSkeleton />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders multiple skeleton boxes (image + text lines)', () => {
    const { UNSAFE_getAllByType } = render(<EventCardSkeleton />)
    const { Animated } = require('react-native')
    // The skeleton has several Animated.View boxes
    const animatedViews = UNSAFE_getAllByType(Animated.View)
    expect(animatedViews.length).toBeGreaterThanOrEqual(4)
  })
})
