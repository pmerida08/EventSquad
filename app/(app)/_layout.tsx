import { Redirect, Stack } from 'expo-router';

import { useLocationInitializer } from '@/hooks/useLocation';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);

  // Solicita permisos de ubicación y guarda coords en el store
  useLocationInitializer();

  // Sin sesión → flujo de auth
  if (!session) return <Redirect href="/(auth)/onboarding" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="event/[id]"
        options={{ headerShown: true, title: 'Evento', headerBackTitle: 'Atrás' }}
      />
      <Stack.Screen
        name="group/[id]/index"
        options={{ headerShown: true, title: 'Grupo', headerBackTitle: 'Atrás' }}
      />
      <Stack.Screen
        name="group/[id]/chat"
        options={{ headerShown: true, title: 'Chat', headerBackTitle: 'Atrás' }}
      />
      <Stack.Screen
        name="group/[id]/voting"
        options={{ headerShown: true, title: 'Punto de encuentro', headerBackTitle: 'Atrás' }}
      />
    </Stack>
  );
}
