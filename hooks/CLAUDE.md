# hooks/ — Custom hooks

## useAuth.ts → `useAuthInitializer()`
Inicializa la sesión al arrancar la app. Llama UNA SOLA VEZ en `app/_layout.tsx`.
- Llama `supabase.auth.getSession()` al montar
- Suscribe a `onAuthStateChange` para mantener la sesión sincronizada
- Si hay sesión, carga el perfil desde `public.profiles` y lo guarda en `authStore`
- Pone `isLoading = false` cuando termina

## useLocation.ts → `useLocationInitializer()`
Solicita permisos GPS y guarda coords en `locationStore`. Llama UNA SOLA VEZ en `app/(app)/_layout.tsx`.
- Si ya se preguntó el permiso (`permissionGranted !== null`), no vuelve a ejecutarse
- Usa `expo-location` con `Accuracy.Balanced`
- Fallback en emulador sin GPS: Madrid `{ latitude: 40.4168, longitude: -3.7038 }`

## useColorScheme.ts
Wrapper sobre `useColorScheme` de React Native. Devuelve `'light' | 'dark'`.

## useClientOnlyValue.ts / .web.ts
Utilidad del template Expo para valores que solo tienen sentido en cliente (no SSR).
