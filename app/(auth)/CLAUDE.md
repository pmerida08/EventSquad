# app/(auth)/ — Flujo de autenticación

Guard en `_layout.tsx`: si ya hay sesión → redirige a `/(app)/(tabs)`.

## Pantallas

| Archivo | Descripción |
|---------|-------------|
| `onboarding.tsx` | Primera pantalla — logo `logoEventSquad.jpg` 130×130px centrado, subtítulo "Vive la música con tu gente", 3 feature cards con iconos FontAwesome en contenedores de color (music/indigo, users/azul, map-marker/rojo), CTAs "Crear cuenta" y "Ya tengo cuenta" |
| `login.tsx` | Email/contraseña + magic link. Diseño con iconos FontAwesome inline en inputs, toggle show/hide password. |
| `register.tsx` | Registro con email y contraseña |
| `profile-setup.tsx` | Nombre y avatar tras el registro (header visible, sin botón atrás) |
| `verify-identity.tsx` | Subida de foto DNI para verificación (header visible, sin botón atrás) |

## Convenciones de login.tsx
- Back button: `FontAwesome arrow-left` + texto "Atrás" en fila
- Email input: icono `envelope-o` a la izquierda
- Password input: icono `lock` a la izquierda + botón `eye/eye-slash` a la derecha
- Estado de magic link enviado: icono `envelope` en círculo (no emoji)
- `SafeAreaView edges={['top', 'bottom']}`

## Estado de auth
Gestionado por `useAuthStore` (Zustand). Inicializado en `hooks/useAuth.ts → useAuthInitializer()` que llama en `app/_layout.tsx`.
- `session` — sesión Supabase activa
- `user` — objeto User de Supabase
- `profile` — fila de `public.profiles`
- `isLoading` — true hasta que se resuelve la sesión inicial
