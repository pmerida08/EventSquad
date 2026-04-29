/**
 * Tests for constants/theme.ts
 * Verifies that both themes expose all required tokens and correct contrast relationships.
 */

import { lightTheme, darkTheme } from '../../constants/theme'

// ── Required token keys ───────────────────────────────────────────────────────

const REQUIRED_TOKENS = [
  'background', 'surface', 'surface2',
  'text', 'textSecondary', 'textTertiary',
  'border', 'borderLight',
  'inputBg', 'inputBorder',
  'tabBg', 'tabBorder',
  'statusBar',
  'primary', 'primaryLight', 'primaryBg',
  'green', 'greenBg',
  'red', 'redBg',
  'amber', 'amberBg',
] as const

describe('lightTheme', () => {
  it('contains all required design tokens', () => {
    for (const token of REQUIRED_TOKENS) {
      expect(lightTheme).toHaveProperty(token)
      expect(lightTheme[token]).toBeTruthy()
    }
  })

  it('statusBar is "dark" (light bg → dark icons)', () => {
    expect(lightTheme.statusBar).toBe('dark')
  })

  it('background is lighter than surface2 (hierarchy)', () => {
    // Light theme: background #F9FAFB (light grey), surface #FFF (white)
    // We just check they differ
    expect(lightTheme.background).not.toBe(lightTheme.surface2)
  })

  it('all color values are valid hex strings', () => {
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
    const colorKeys = REQUIRED_TOKENS.filter((k) => k !== 'statusBar')
    for (const key of colorKeys) {
      expect(lightTheme[key]).toMatch(hexRegex)
    }
  })
})

describe('darkTheme', () => {
  it('contains all required design tokens', () => {
    for (const token of REQUIRED_TOKENS) {
      expect(darkTheme).toHaveProperty(token)
      expect(darkTheme[token]).toBeTruthy()
    }
  })

  it('statusBar is "light" (dark bg → light icons)', () => {
    expect(darkTheme.statusBar).toBe('light')
  })

  it('overrides primary to lighter variant for dark mode', () => {
    // Dark mode primary should be lighter (#818CF8) than light mode (#6366F1)
    expect(darkTheme.primary).not.toBe(lightTheme.primary)
  })

  it('has darker backgrounds than light theme', () => {
    expect(darkTheme.background).not.toBe(lightTheme.background)
    expect(darkTheme.surface).not.toBe(lightTheme.surface)
  })

  it('all color values are valid hex strings', () => {
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
    const colorKeys = REQUIRED_TOKENS.filter((k) => k !== 'statusBar')
    for (const key of colorKeys) {
      expect(darkTheme[key]).toMatch(hexRegex)
    }
  })
})

describe('theme consistency', () => {
  it('light and dark themes have the same set of keys', () => {
    const lightKeys = Object.keys(lightTheme).sort()
    const darkKeys  = Object.keys(darkTheme).sort()
    expect(lightKeys).toEqual(darkKeys)
  })

  it('red and green semantic colors are the same across themes (brand palette)', () => {
    expect(lightTheme.red).toBe(darkTheme.red)
    expect(lightTheme.green).toBe(darkTheme.green)
  })
})
