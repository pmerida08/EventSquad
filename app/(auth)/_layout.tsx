import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);

  // Si ya hay sesión, mandar a la app
  if (session) return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="profile-setup"
        options={{ headerShown: true, title: 'Tu perfil', headerBackVisible: false }}
      />
      <Stack.Screen
        name="verify-identity"
        options={{ headerShown: true, title: 'Verificar identidad', headerBackVisible: false }}
      />
    </Stack>
  );
}
