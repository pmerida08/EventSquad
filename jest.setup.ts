// Env vars necesarias para que lib/supabase.ts no lance error al importarse
process.env.EXPO_PUBLIC_SUPABASE_URL     = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest'

// Mock de @expo/vector-icons para evitar carga asíncrona de fuentes en tests
jest.mock('@expo/vector-icons/FontAwesome', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return ({ name, ...props }: { name: string; [key: string]: unknown }) =>
    React.createElement(Text, { testID: `icon-${name}`, ...props })
})
