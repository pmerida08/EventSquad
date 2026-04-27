import { Stack } from 'expo-router';

export default function AppLayout() {
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
