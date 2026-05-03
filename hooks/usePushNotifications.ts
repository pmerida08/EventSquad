import { useEffect } from 'react'

import { registerForPushNotifications, savePushTokenToProfile } from '@/lib/notifications'
import { useAuthStore } from '@/stores/authStore'

export function usePushNotificationsInitializer() {
  const userId = useAuthStore((s) => s.session?.user?.id)

  useEffect(() => {
    if (!userId) return
    registerForPushNotifications()
      .then((token) => {
        if (token) savePushTokenToProfile(userId, token)
      })
      .catch(() => {
        // Firebase/FCM no disponible en este build — ignorar silenciosamente
      })
  }, [userId])
}
