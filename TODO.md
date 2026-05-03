# EventSquad — App móvil para ir a eventos acompañado

App de React Native + Supabase que permite a personas que van solas a eventos (conciertos, fiestas, festivales) encontrar compañeros y vivir la experiencia juntos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo SDK 54 |
| Backend / DB | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Navegación | Expo Router v6 (file-based routing) |
| Estado global | Zustand |
| Estilos | StyleSheet con sistema de tema claro/oscuro (`constants/theme.ts`) |
| Chat en tiempo real | Supabase Realtime (subscriptions + Presence) |
| Push notifications | Expo Notifications + Supabase Edge Function *(Fase 6 pendiente)* |
| Fuente de eventos | Ticketmaster API (Edge Function `sync-ticketmaster`) |
| Verificación de identidad | Selfie MVP (liveness real con Veriff/AWS pendiente Fase 7) |
| Geolocalización | expo-location |
| Iconos | @expo/vector-icons/FontAwesome |

---

## Fase 0 — Setup y arquitectura

- [x] Inicializar proyecto con `npx create-expo-app eventsquad --template tabs`
- [x] Configurar Expo Router con rutas: `(auth)`, `(app)/(tabs)`, `(app)/event/[id]`, `(app)/group/[id]`
- [x] Crear proyecto en Supabase y guardar variables de entorno
- [x] Configurar `supabase-js` client con singleton (`lib/supabase.ts`) — usa SecureStore con chunking en lugar de AsyncStorage (compatibilidad nueva arquitectura)
- [x] Configurar EAS Build con 3 perfiles: `development` (APK + dev client), `preview` (APK distribución interna), `production` (AAB Play Store)
- [x] Configurar ESLint + Prettier + TypeScript estricto
- [x] Instalar dependencias base:
  - `@supabase/supabase-js`
  - `expo-location`
  - `expo-notifications`
  - `expo-image-picker`
  - `expo-camera`
  - `zustand`
  - `date-fns`
  - `expo-image`

---

## Fase 1 — Autenticación y perfil de usuario ✅

### Base de datos (Supabase)
- [x] Tabla `profiles` con: `id` (uuid, FK auth.users), `display_name`, `avatar_url`, `bio`, `verified`, `expo_push_token`, `created_at`
- [x] Storage bucket `avatars` con RLS (solo el propio usuario puede subir/actualizar)
- [x] RLS policies en `profiles`: lectura pública, escritura solo propietario
- [x] Trigger `on_auth_user_created` → inserta fila en `profiles`
- [x] Tipos TypeScript generados desde Supabase MCP → `types/database.types.ts`

### Pantallas
- [x] Pantalla de onboarding (`app/(auth)/onboarding.tsx`) — logo 130×130px, subtítulo, 3 feature cards con iconos FontAwesome en contenedores de color, CTAs "Crear cuenta" / "Ya tengo cuenta"
- [x] Pantalla de registro con email/contraseña (`app/(auth)/register.tsx`)
- [x] Pantalla de login (`app/(auth)/login.tsx`) — email+contraseña + magic link, iconos en inputs, show/hide password
- [x] Pantalla de configuración de perfil (`app/(auth)/profile-setup.tsx`) — nombre, bio, foto
- [x] Flujo de subida de foto de perfil con `expo-image-picker` (`lib/auth.ts → pickAndUploadAvatar`)
- [x] Tab de perfil con datos reales (`app/(app)/(tabs)/profile.tsx`)

### Auth / Estado global
- [x] `lib/auth.ts` — helpers signUp/signIn/signOut/getProfile/updateProfile/uploadAvatar/markUserAsVerified
- [x] `hooks/useAuth.ts` — inicializa sesión y listener onAuthStateChange
- [x] `stores/authStore.ts` — estado global session/user/profile con Zustand
- [x] Fix race condition register → profile-setup (setSession antes de navegar)

### Verificación de identidad
- [x] Liveness check básico con cámara frontal (`app/(auth)/verify-identity.tsx`) — selfie MVP
- [x] Campo `verified: boolean` en `profiles`, actualizado tras la captura
- [x] `components/ui/VerifiedBadge.tsx` — badge verde, tamaños sm/md/lg
- [x] Banner "Verifica tu identidad" en perfil para usuarios no verificados
- [ ] TODO (Fase 7): integrar Veriff / AWS Rekognition para liveness check real

---

## Fase 2 — Permisos de ubicación y descubrimiento de eventos ✅

### Geolocalización
- [x] Solicitar permiso de ubicación al iniciar la app (`expo-location`) — `hooks/useLocation.ts`
- [x] Guardar coordenadas en memoria (Zustand store — `stores/locationStore.ts`)
- [x] Fallback en emulador: Madrid `{ latitude: 40.4168, longitude: -3.7038 }`
- [ ] Pantalla de mapa con `react-native-maps` centrado en ubicación del usuario *(pendiente, vista lista implementada)*

### Fuente de eventos (Ticketmaster API)
- [x] Supabase Edge Function `sync-ticketmaster` (Deno):
  - Cron diario via `pg_net` HTTP POST
  - Recoge hasta 5 páginas × 200 eventos (`countryCode=ES, classificationName=Music`)
  - Deduplica en memoria por `(name, venue)`, conserva fecha más próxima al futuro, descarta VIP/UPGRADE
  - Upsert en batches de 200 con `onConflict: 'name,venue'`
- [x] Tabla `events` con 227 registros únicos (`UNIQUE(name, venue)`)
- [x] Cron `cleanup-old-events` — DELETE eventos pasados hace >3 días (02:00 UTC)
- [x] Migración `events_near` v2 — DISTINCT ON (name,venue), cutoff 2h, filtro VIP/UPGRADE
- [x] Pantalla de listado de eventos con filtros por categoría (`app/(app)/(tabs)/index.tsx`)
  - `coordsRef` pattern para evitar re-fetches automáticos al llegar la ubicación
  - 5 chips de categoría + búsqueda client-side
  - Skeletons durante carga
- [x] Pantalla de detalle de evento (`app/(app)/event/[id].tsx`) — imagen, categoría, fecha, recinto, botón "Ver grupos"

---

## Fase 3 — Grupos de evento ✅

### Base de datos (Supabase)
- [x] Tabla `groups`: `id`, `event_id`, `name`, `description`, `max_members` (2-50, default 10), `created_by`, `created_at`
- [x] Tabla `group_members`: `(group_id, user_id)` PK, `role` (owner|member), `joined_at`
- [x] Vista `groups_with_member_count` (security_invoker=true)
- [x] RPC `create_group` (SECURITY DEFINER): valida 1 grupo por evento por usuario
- [x] RPC `join_group` (SECURITY DEFINER): valida max_members y unicidad por evento

### Pantallas
- [x] Lista de grupos para un evento (`app/(app)/event-groups/[eventId].tsx`) — con conteo de miembros y barra de progreso
- [x] Pantalla "Crear grupo" (`app/(app)/create-group.tsx`) — nombre, descripción, tamaño máximo
- [x] Pantalla de detalle de grupo (`app/(app)/group/[id]/index.tsx`) — miembros con `MemberAvatars`, botones unirse/salir/ir al chat
- [x] Lógica para que un usuario solo pueda estar en un grupo por evento (RPC + guard en UI)

---

## Fase 4 — Chat de grupo ✅

### Base de datos (Supabase)
- [x] Tabla `messages`: `id`, `group_id`, `user_id`, `content` (1-1000 chars), `created_at`
- [x] RLS: solo miembros del grupo pueden leer/escribir mensajes
- [x] Índice en `(group_id, created_at DESC)` para queries paginadas
- [x] Publicada en `supabase_realtime`

### Real-time
- [x] Suscripción a `messages` con Supabase Realtime (INSERT) por `group_id`
- [x] Actualización optimista de la UI al enviar mensajes
- [x] Paginación con cursor (cargar mensajes anteriores al hacer scroll — `fetchMessages(groupId, beforeCursor)`)
- [x] Indicador "escribiendo..." con Supabase Realtime Presence

### Pantallas
- [x] Pantalla de chat implementación propia (`app/(app)/group/[id]/chat.tsx`) *(no gifted-chat)*
  - FlatList invertida con burbujas por usuario
  - Nombre y avatar de cada usuario (join a `profiles`)
  - Indicador "X está escribiendo..." (Presence)
  - Foto de perfil de miembros en la cabecera
  - Paginación al llegar al top de la lista

---

## Fase 5 — Sistema de votación para punto de encuentro ✅

### Base de datos (Supabase)
- [x] Tabla `meetup_proposals`: `id`, `group_id`, `proposed_by`, `location_name`, `lat`, `lng`, `proposed_time`, `selected`, `created_at`
- [x] Tabla `meetup_votes`: `proposal_id`, `user_id`, `created_at` (voto positivo = insertar fila)
- [x] Vista `meetup_proposals_with_votes` que agrega el conteo de votos
- [x] RPC `vote_for_proposal` — selecciona ganadora automáticamente cuando todos los miembros han votado (desempate por antigüedad)

### Pantallas
- [x] Pantalla de votación dentro del grupo (`app/(app)/group/[id]/voting.tsx`):
  - Lista de propuestas con `VotingCard` (lugar, hora, barra de progreso de votos)
  - Botón de voto en cada propuesta; feedback de spinner mientras vota
  - Banner ganador destacado cuando la votación concluye
  - Realtime via `subscribeToVoting` (INSERT/UPDATE en propuestas y votos)
- [x] Formulario para añadir propuesta: lugar + selector de fecha/hora (spinner nativo sin DateTimePicker)

### Sistema de moderación (bonus Fase 5)
- [x] Tablas `user_reports` + `kick_votes`
- [x] RPCs `report_user`, `vote_kick_user`, `kick_member`
- [x] UI: long-press en mensajes → reportar; botón "···" en miembros → reportar / votar para echar / echar (owner)

---

## Fase 6 — Notificaciones push ✅

### Configuración
- [x] Configurar `expo-notifications` con permisos en iOS y Android (plugin en `app.json`, canal Android, `POST_NOTIFICATIONS`)
- [x] Guardar `expo_push_token` en tabla `profiles` al iniciar sesión (`hooks/usePushNotifications.ts` + `lib/notifications.ts`)
- [x] Supabase Edge Function `send-push-notification` — batch hasta 100 tokens, llama a Expo Push API, autenticada con `service_role_key`

### Triggers de notificación
- [x] Nuevo mensaje en el chat → notifica a todos los miembros del grupo excepto el emisor
- [x] Alguien se une al grupo → notifica al owner del grupo
- [x] Votación completada (ganador seleccionado) → notifica a todos los miembros con lugar y hora
- [x] Recordatorio 2 horas antes del evento → cron cada 10 min detecta window 115-125 min, notifica a todos los miembros

---

## Fase 7 — Pulido, testing y despliegue 🔜

### Testing
- [x] Tests unitarios de `lib/events.ts`, `lib/messages.ts`, `constants/theme.ts` (Jest + jest-expo)
- [x] Tests de componentes `EventCard`, `EventCardSkeleton` (@testing-library/react-native)
- [ ] Tests de integración de Edge Functions (Deno test)
- [ ] Tests E2E de flujos críticos (Maestro / Playwright)
- [ ] Prueba de RLS policies con `supabase test`

### Seguridad
- [ ] Auditoría completa de RLS policies (ninguna tabla sin policy)
- [ ] Rate limiting en Edge Functions
- [ ] Validación exhaustiva de inputs en todos los formularios
- [ ] Revisar que datos sensibles no se exponen en el cliente

### Despliegue
- [x] Configurar EAS Build con perfiles `development`, `preview`, `production`
- [x] App icons y splash screen definitivos (pin + nota musical, indigo `#6366F1`)
- [ ] Configurar OTA updates con EAS Update
- [ ] Publicar en TestFlight (iOS) y Play Console (Android) para beta testers
- [ ] Integrar Veriff / AWS Rekognition para liveness check real

---

## Decisiones resueltas ✅

- [x] **Nombre de la app**: EventSquad — logo pin+nota musical, color indigo `#6366F1`, tagline "Vive la música con tu gente"
- [x] **Fuentes de eventos**: Ticketmaster API oficial (`countryCode=ES, classificationName=Music`)
- [x] **Límite de integrantes por grupo**: Configurable por el creador (2–50, default 10)
- [ ] **Verificación de identidad real**: Pendiente elegir entre Veriff / Onfido / AWS Rekognition (actualmente selfie MVP)

---

## Estructura de carpetas actual

```
eventsquad/
├── app/
│   ├── _layout.tsx               ← Root: fuentes, auth init, ThemeProvider
│   ├── (auth)/
│   │   ├── onboarding.tsx        ← Logo, 3 feature cards, CTAs
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── profile-setup.tsx
│   │   └── verify-identity.tsx
│   └── (app)/
│       ├── _layout.tsx           ← Stack + useLocationInitializer
│       ├── (tabs)/
│       │   ├── index.tsx         ← Eventos (fetchEventsNear / fetchAllEvents)
│       │   ├── groups.tsx        ← Mis grupos
│       │   └── profile.tsx       ← Perfil del usuario
│       ├── event/[id].tsx
│       ├── event-groups/[eventId].tsx
│       ├── create-group.tsx
│       └── group/[id]/
│           ├── index.tsx         ← Detalle del grupo
│           ├── chat.tsx          ← Chat (Realtime + Presence)
│           └── voting.tsx        ← Placeholder (Fase 5)
├── components/
│   ├── ui/                       ← VerifiedBadge y otros atómicos
│   ├── EventCard.tsx
│   ├── EventCardSkeleton.tsx
│   ├── GroupCard.tsx
│   ├── MemberAvatars.tsx
│   └── VotingCard.tsx            ← Placeholder (Fase 5)
├── lib/
│   ├── supabase.ts               ← Cliente Supabase (SecureStore chunked)
│   ├── auth.ts
│   ├── events.ts
│   ├── groups.ts
│   ├── messages.ts
│   └── notifications.ts          ← Placeholder (Fase 6)
├── stores/
│   ├── authStore.ts
│   └── locationStore.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useLocation.ts
│   └── useColorScheme.ts
├── constants/
│   └── theme.ts                  ← Sistema claro/oscuro
├── supabase/
│   ├── migrations/               ← 8 migraciones aplicadas
│   └── functions/
│       ├── sync-ticketmaster/    ← Activa (v5, cron diario)
│       ├── scrape-events/        ← Reservado
│       └── send-push-notification/ ← Pendiente Fase 6
└── types/
    └── database.types.ts         ← Tipos generados por Supabase CLI
```
