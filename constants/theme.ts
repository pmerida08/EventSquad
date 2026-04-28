import { useColorScheme } from 'react-native';

// ── Paleta de colores ──────────────────────────────────────────────────────────
const palette = {
  primary:       '#6366F1',
  primaryLight:  '#818CF8',
  primaryBg:     '#EEF2FF',
  primaryBgDark: '#1E1B4B',

  green:    '#10B981',
  greenBg:  '#D1FAE5',
  red:      '#EF4444',
  redBg:    '#FEE2E2',
  amber:    '#F59E0B',
  amberBg:  '#FFFBEB',
};

export const lightTheme = {
  // Fondos
  background:  '#F9FAFB',
  surface:     '#FFFFFF',
  surface2:    '#F3F4F6',

  // Texto
  text:           '#111827',
  textSecondary:  '#6B7280',
  textTertiary:   '#9CA3AF',

  // Bordes
  border:     '#E5E7EB',
  borderLight: '#F3F4F6',

  // Inputs
  inputBg:     '#FFFFFF',
  inputBorder: '#E5E7EB',

  // Tab bar
  tabBg:       '#FFFFFF',
  tabBorder:   '#F3F4F6',

  // StatusBar
  statusBar: 'dark' as const,

  ...palette,
};

export const darkTheme = {
  // Fondos
  background:  '#0F172A',
  surface:     '#1E293B',
  surface2:    '#334155',

  // Texto
  text:           '#F1F5F9',
  textSecondary:  '#94A3B8',
  textTertiary:   '#64748B',

  // Bordes
  border:      '#334155',
  borderLight: '#1E293B',

  // Inputs
  inputBg:     '#1E293B',
  inputBorder: '#334155',

  // Tab bar
  tabBg:     '#1E293B',
  tabBorder: '#334155',

  // StatusBar
  statusBar: 'light' as const,

  ...palette,
  primary:      '#818CF8',
  primaryLight: '#6366F1',
  primaryBg:    '#1E1B4B',
};

export type Theme = typeof lightTheme;

/** Hook principal de tema */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
