import { Redirect, Stack } from 'expo-router';

import { useLocationInitializer } from '@/hooks/useLocation';
import { usePushNotificationsInitializer } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);

  // Solicita permisos de ubicación y guarda coords en el store
  useLocationInitializer();
  // Solicita permisos de push y guarda el token en el perfil
  usePushNotificationsInitializer();

  // Sin sesión → flujo de auth
  if (!session) return <Redirect href="/(auth)/onboarding" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="event/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="event-groups/[eventId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="create-group"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="group/[id]/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="group/[id]/chat"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="group/[id]/voting"
        options={{ headerShown: true, title: 'Punto de encuentro', headerBackTitle: 'Atrás' }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{ headerShown: true, title: 'Tu perfil', headerBackTitle: 'Atrás' }}
      />
    </Stack>
  );
}
