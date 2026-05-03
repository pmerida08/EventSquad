/**
 * Tests para lib/notifications.ts
 * Cubre: registerForPushNotifications, savePushTokenToProfile
 */

// ── Mocks (deben ir antes de cualquier import) ────────────────────────────────

jest.mock('expo-notifications', () => ({
  setNotificationHandler:      jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync:         jest.fn(),
  requestPermissionsAsync:     jest.fn(),
  getExpoPushTokenAsync:       jest.fn(),
  AndroidImportance:           { MAX: 5 },
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { eas: { projectId: 'test-project-id' } },
    },
  },
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    auth: { getUser: jest.fn() },
  },
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications'
import { Platform }        from 'react-native'
import { supabase }        from '../../lib/supabase'
import { registerForPushNotifications, savePushTokenToProfile } from '../../lib/notifications'

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockGetPermissions     = Notifications.getPermissionsAsync     as jest.Mock
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock
const mockGetToken           = Notifications.getExpoPushTokenAsync   as jest.Mock
const mockSetChannel         = Notifications.setNotificationChannelAsync as jest.Mock

const FAKE_TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'

beforeEach(() => {
  jest.clearAllMocks()
  // Restaurar mockReturnValue del from mock tras clearAllMocks
  const mockFrom = supabase.from as jest.Mock
  const mockEq   = jest.fn().mockResolvedValue({ data: null, error: null })
  const mockUpd  = jest.fn().mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ update: mockUpd })
})

// ── registerForPushNotifications ──────────────────────────────────────────────

describe('registerForPushNotifications', () => {
  it('devuelve el token cuando los permisos ya estaban concedidos', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' })
    mockGetToken.mockResolvedValueOnce({ data: FAKE_TOKEN })

    const result = await registerForPushNotifications()

    expect(result).toBe(FAKE_TOKEN)
    expect(mockRequestPermissions).not.toHaveBeenCalled()
  })

  it('solicita permisos si no estaban concedidos y devuelve el token al concederlos', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'undetermined' })
    mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' })
    mockGetToken.mockResolvedValueOnce({ data: FAKE_TOKEN })

    const result = await registerForPushNotifications()

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1)
    expect(result).toBe(FAKE_TOKEN)
  })

  it('devuelve null cuando el usuario deniega los permisos', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'undetermined' })
    mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' })

    const result = await registerForPushNotifications()

    expect(result).toBeNull()
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it('devuelve null cuando los permisos ya estaban denegados', async () => {
    // La función siempre llama requestPermissionsAsync si no está 'granted'
    mockGetPermissions.mockResolvedValueOnce({ status: 'denied' })
    mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' })

    const result = await registerForPushNotifications()

    expect(result).toBeNull()
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it('pasa el projectId correcto a getExpoPushTokenAsync', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' })
    mockGetToken.mockResolvedValueOnce({ data: FAKE_TOKEN })

    await registerForPushNotifications()

    expect(mockGetToken).toHaveBeenCalledWith({ projectId: 'test-project-id' })
  })

  it('configura el canal de notificaciones en Android', async () => {
    // Forzar Platform.OS a 'android' para este test
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true, configurable: true })

    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' })
    mockGetToken.mockResolvedValueOnce({ data: FAKE_TOKEN })

    await registerForPushNotifications()

    expect(mockSetChannel).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ importance: Notifications.AndroidImportance.MAX }),
    )

    // Restaurar
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true })
  })

  it('no configura el canal de notificaciones en iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true, configurable: true })

    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' })
    mockGetToken.mockResolvedValueOnce({ data: FAKE_TOKEN })

    await registerForPushNotifications()

    expect(mockSetChannel).not.toHaveBeenCalled()
  })
})

// ── savePushTokenToProfile ────────────────────────────────────────────────────

describe('savePushTokenToProfile', () => {
  it('llama a from("profiles").update().eq() con los argumentos correctos', async () => {
    const mockFrom   = supabase.from as jest.Mock
    const mockEqFn   = jest.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdFn  = jest.fn().mockReturnValue({ eq: mockEqFn })
    mockFrom.mockReturnValue({ update: mockUpdFn })

    await savePushTokenToProfile('user-uuid', FAKE_TOKEN)

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpdFn).toHaveBeenCalledWith({ expo_push_token: FAKE_TOKEN })
    expect(mockEqFn).toHaveBeenCalledWith('id', 'user-uuid')
  })

  it('no lanza excepción aunque Supabase devuelva un error', async () => {
    const mockFrom  = supabase.from as jest.Mock
    const mockEqFn  = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockUpdFn = jest.fn().mockReturnValue({ eq: mockEqFn })
    mockFrom.mockReturnValue({ update: mockUpdFn })

    await expect(savePushTokenToProfile('user-uuid', FAKE_TOKEN)).resolves.toBeUndefined()
  })
})
