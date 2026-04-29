# EventSquad — Contexto global del proyecto

## ¿Qué es?
App móvil para descubrir eventos musicales cercanos, unirse a grupos de asistentes y coordinarse (chat, punto de encuentro). React Native + Expo + Supabase.

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React Native, Expo SDK 54, Expo Router v6 (file-based routing) |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Estado | Zustand (`stores/`) |
| Estilos | StyleSheet con sistema de tema claro/oscuro (`constants/theme.ts`) |
| Iconos | `@expo/vector-icons/FontAwesome` — **nunca emojis como iconos estructurales** |
| Tests | Jest + jest-expo + @testing-library/react-native |
| Build | EAS Build (3 perfiles: development APK, preview APK, production AAB) |
| OTA | EAS Update (pendiente configurar) |

## Variables de entorno (.env.local)
```
EXPO_PUBLIC_SUPABASE_URL=https://eixsagtnwwxsylaoyqfp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5DuuuQ2Qxuwtr4KFuJRC-w_h9auG2GT
```
Supabase project ref: `eixsagtnwwxsylaoyqfp`

## Estructura de rutas (Expo Router)
```
app/
├── _layout.tsx               ← Root: fuentes, auth init, ThemeProvider
├── (auth)/                   ← Sin sesión
│   ├── onboarding.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── profile-setup.tsx
│   └── verify-identity.tsx
└── (app)/                    ← Con sesión (guarda con useAuthStore)
    ├── _layout.tsx           ← Stack principal + useLocationInitializer
    ├── (tabs)/
    │   ├── index.tsx         ← Eventos cerca (fetchEventsNear / fetchAllEvents)
    │   ├── groups.tsx        ← Mis grupos (fetchMyGroups)
    │   └── profile.tsx       ← Perfil del usuario
    ├── event/[id].tsx        ← Detalle de evento
    ├── event-groups/[eventId].tsx ← Grupos de un evento
    ├── create-group.tsx      ← Crear grupo
    └── group/[id]/
        ├── index.tsx         ← Detalle del grupo
        ├── chat.tsx          ← Chat (Realtime + Presence)
        └── voting.tsx        ← Votación punto de encuentro
```

## Base de datos (Supabase)
Tablas principales:
- `profiles` — perfil de usuario (ligado a auth.users)
- `events` — eventos musicales (sync desde Ticketmaster), `UNIQUE(name, venue)`
- `groups` — grupos de asistentes a un evento
- `group_members` — membresía (owner / member)
- `messages` — mensajes de chat por grupo, `REALTIME habilitado`

RPCs / Funciones:
- `events_near(user_lat, user_lng, radius_km, cat)` — eventos con distancia Haversine + DISTINCT ON (name, venue)
- `join_group(p_group_id)` — SECURITY DEFINER (bypassa RLS, valida max_members y unicidad por evento)
- `create_group(p_event_id, p_name, p_description, p_max_members)` — SECURITY DEFINER

Vistas: `groups_with_member_count`

## Fases del proyecto
| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Auth (registro, login, perfil, verificación identidad) |
| 2 | ✅ | Mapa de eventos (Ticketmaster sync, geolocalización, dedup) |
| 3 | ✅ | Grupos (crear, unirse, detalle, miembros) |
| 4 | ✅ | Chat de grupo (Realtime, typing indicator Presence, optimistic UI) |
| 5 | 🔜 | Sistema de votación (punto de encuentro, meetup_proposals/votes) |
| 6 | 🔜 | Notificaciones push (expo-notifications + Firebase + Edge Function) |

## Convenciones de código
- **Tema**: siempre `const t = useTheme()` + `makeStyles(t)`. Nunca colores hardcodeados.
- **Iconos**: `FontAwesome` de `@expo/vector-icons/FontAwesome`. Nunca emojis como UI.
- **Accesibilidad**: `accessibilityRole="button"` en todos los `Pressable` interactivos.
- **Navegación**: `router.push('/(app)/group/${id}')` — sin `/index` al final.
- **Alias**: `@/` mapea a la raíz del proyecto (configurado en tsconfig y jest).
- **Supabase client**: importar siempre desde `@/lib/supabase` (usa SecureStore chunked).
- **Auth tokens**: nunca usar `raw_user_meta_data` para autorización — usar `raw_app_meta_data`.

## Tests
```bash
npm test              # run all
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```
Mocks en `__tests__/utils/supabase.mock.ts`. Setup en `jest.setup.ts`.

## Comandos útiles
```bash
npx expo start              # dev server
npx expo start --tunnel     # con túnel (red distinta)
eas build -p android --profile preview   # APK de prueba
eas build -p android --profile development  # dev client APK
```
