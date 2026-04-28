# EventSquad — App móvil para ir a eventos acompañado

App de React Native + Supabase que permite a personas que van solas a eventos (conciertos, fiestas, festivales) encontrar compañeros y vivir la experiencia juntos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo (SDK 52+) |
| Backend / DB | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Navegación | Expo Router (file-based) |
| Estado global | Zustand |
| Estilos | NativeWind (Tailwind para RN) |
| Chat en tiempo real | Supabase Realtime (subscriptions) |
| Push notifications | Expo Notifications + Supabase Edge Function |
| Web scraping de eventos | Supabase Edge Function (Deno + cheerio) |
| Verificación de identidad | Face Liveness (AWS Rekognition o similar) |
| Mapas / Geolocalización | expo-location + react-native-maps |

---

## Fase 0 — Setup y arquitectura

- [x] Inicializar proyecto con `npx create-expo-app eventsquad --template tabs`
- [x] Configurar Expo Router con rutas: `(auth)`, `(app)/(tabs)`, `(app)/event/[id]`, `(app)/group/[id]`
- [x] Crear proyecto en Supabase y guardar variables de entorno
- [x] Configurar `supabase-js` client con singleton (`lib/supabase.ts`) — usa SecureStore con chunking en lugar de AsyncStorage (compatibilidad nueva arquitectura + Expo Go)
- [ ] Configurar EAS Build para iOS y Android
- [x] Configurar ESLint + Prettier + TypeScript estricto
- [x] Instalar dependencias base:
  - `@supabase/supabase-js`
  - `expo-location`
  - `expo-notifications`
  - `expo-image-picker`
  - `expo-camera`
  - `react-native-maps`
  - `zustand`
  - `nativewind` — instalado pero pendiente de configurar
  - `react-native-gifted-chat`
  - `date-fns`

---

## Fase 1 — Autenticación y perfil de usuario

### Base de datos (Supabase)
- [x] Tabla `profiles` con: `id` (uuid, FK auth.users), `display_name`, `avatar_url`, `bio`, `verified`, `expo_push_token`, `created_at`
- [x] Storage bucket `avatars` con RLS (solo el propio usuario puede subir/actualizar)
- [x] RLS policies en `profiles`: lectura pública, escritura solo propietario
- [x] Trigger `on_auth_user_created` → inserta fila en `profiles`
- [x] Tipos TypeScript generados desde Supabase MCP → `types/database.types.ts`

### Pantallas
- [x] Pantalla de onboarding (`app/(auth)/onboarding.tsx`) — logo, 3 cards de features, CTAs
- [x] Pantalla de registro con email/contraseña o magic link (`app/(auth)/register.tsx`)
- [x] Pantalla de login (`app/(auth)/login.tsx`) — email+contraseña + magic link
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

## Fase 2 — Permisos de ubicación y descubrimiento de eventos

### Geolocalización
- [ ] Solicitar permiso de ubicación al iniciar la app (`expo-location`)
- [ ] Guardar coordenadas en memoria (Zustand store — `stores/locationStore.ts` ya existe como placeholder)
- [ ] Pantalla de mapa con `react-native-maps` centrado en la ubicación del usuario

### Web scraping / Fuente de eventos
- [ ] Supabase Edge Function `scrape-events`:
  - Recibe `lat`, `lng`, `radius_km`
  - Fuente a decidir: Ticketmaster API (oficial), Eventbrite API, o scraping con cheerio
  - Devuelve lista de eventos: `{ id, name, date, venue, address, lat, lng, image_url, category }`
- [ ] Tabla `events` para cachear resultados con TTL de 1h
- [ ] Migración SQL: tabla `events` + RLS (lectura pública, escritura solo service_role)
- [ ] Pantalla de listado de eventos próximos con filtros por categoría
- [ ] Pantalla de detalle de evento: foto, fecha, lugar, mapa, grupos activos (`app/(app)/event/[id].tsx` — placeholder existente)

---

## Fase 3 — Grupos de evento

### Base de datos (Supabase)
- [ ] Tabla `groups`:
  - `id`, `event_id` (FK events), `name`, `description`, `max_members` (default 10), `created_by` (FK profiles), `created_at`
- [ ] Tabla `group_members`:
  - `group_id`, `user_id`, `role` (owner | member), `joined_at`
- [ ] RLS: solo miembros del grupo pueden leer mensajes y datos del grupo
- [ ] Función Postgres `join_group(group_id)` que verifica que el grupo no esté lleno y que el usuario esté verificado

### Pantallas
- [ ] Lista de grupos disponibles para un evento (con número de miembros y foto de cada integrante)
- [ ] Pantalla "Crear grupo": nombre, descripción, tamaño máximo
- [ ] Pantalla de detalle de grupo: avatares de miembros, descripción, botón "Unirse"
- [ ] Confirmación al unirse a un grupo (mostrar los miembros actuales)
- [ ] Lógica para que un usuario solo pueda estar en un grupo por evento

---

## Fase 4 — Chat de grupo

### Base de datos (Supabase)
- [ ] Tabla `messages`:
  - `id`, `group_id` (FK groups), `user_id` (FK profiles), `content`, `created_at`
- [ ] RLS: solo miembros del grupo pueden leer/escribir mensajes
- [ ] Índice en `(group_id, created_at)` para queries paginadas

### Real-time
- [ ] Suscripción a `messages` con Supabase Realtime por `group_id`
- [ ] Actualización optimista de la UI al enviar mensajes
- [ ] Paginación con cursor (cargar mensajes anteriores al hacer scroll)

### Pantallas
- [ ] Pantalla de chat con `react-native-gifted-chat` o implementación propia
  - Burbujas con nombre y avatar de cada usuario
  - Indicador "escribiendo..." (usando Realtime Presence)
  - Mostrar foto de perfil de cada integrante en la cabecera del chat

---

## Fase 5 — Sistema de votación para punto de encuentro

### Base de datos (Supabase)
- [ ] Tabla `meetup_proposals`:
  - `id`, `group_id`, `proposed_by`, `location_name`, `lat`, `lng`, `proposed_time`, `created_at`
- [ ] Tabla `meetup_votes`:
  - `proposal_id`, `user_id`, `created_at` (voto positivo = insertar fila)
- [ ] Vista `meetup_proposals_with_votes` que agrega el conteo de votos
- [ ] Trigger: cuando todos los miembros han votado → marcar propuesta ganadora (`selected: boolean`)

### Pantallas
- [ ] Pantalla de votación dentro del chat/grupo:
  - Lista de propuestas de lugar y hora (cada miembro puede añadir una)
  - Chips de hora y lugar propuestos
  - Botón de voto en cada propuesta
  - Barra de progreso de votos
  - Resultado final destacado cuando todos han votado
- [ ] Formulario para añadir propuesta propia: lugar en mapa + selector de hora

---

## Fase 6 — Notificaciones push

### Configuración
- [ ] Configurar `expo-notifications` con permisos en iOS y Android
- [ ] Guardar `expo_push_token` en tabla `profiles` al iniciar sesión
- [ ] Supabase Edge Function `send-push-notification` que llama a la API de Expo

### Triggers de notificación
- [ ] Nuevo mensaje en el grupo del usuario
- [ ] Alguien se une al grupo del usuario
- [ ] Votación completada: recordatorio con hora y lugar del encuentro
- [ ] 2 horas antes del evento: recordatorio automático con el punto de encuentro acordado
- [ ] Scheduled Edge Function (cron) para los recordatorios temporales

---

## Fase 7 — Pulido, testing y despliegue

### Testing
- [ ] Tests unitarios de lógica de negocio (Jest + Testing Library)
- [ ] Tests de integración de Edge Functions (Deno test)
- [ ] Tests E2E de flujos críticos con Maestro
- [ ] Prueba de RLS policies con `supabase test`

### Seguridad
- [ ] Auditoría de RLS policies (ninguna tabla sin policy)
- [ ] Rate limiting en Edge Functions
- [ ] Validación de inputs en todos los formularios
- [ ] Revisar que datos sensibles no se exponen en el cliente

### Despliegue
- [ ] Configurar EAS Build con perfiles `development`, `preview`, `production`
- [ ] App icons y splash screen definitivos
- [ ] Configurar OTA updates con EAS Update
- [ ] Publicar en TestFlight (iOS) y Play Console (Android) para beta testers

---

## Decisiones pendientes

- [ ] **Nombre de la app**: ¿EventSquad? ¿Juntamos? ¿BuddyUp? Definir branding
- [ ] **Fuentes de eventos**: Evaluar si usar Eventbrite API, Ticketmaster API, o scraping directo. Las APIs oficiales son más fiables y no violan términos de servicio
- [ ] **Verificación de identidad**: Elegir entre implementación propia con `expo-face-detector` (gratuito, menos robusto) o servicio externo como Veriff/Onfido (de pago, más fiable)
- [ ] **Límite de integrantes por grupo**: ¿5? ¿10? ¿Configurable por el creador?

---

## Estructura de carpetas sugerida

```
eventsquad/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-identity.tsx
│   ├── (app)/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Mapa + lista de eventos
│   │   │   ├── groups.tsx         # Mis grupos
│   │   │   └── profile.tsx        # Perfil del usuario
│   │   ├── event/[id].tsx         # Detalle de evento
│   │   ├── group/[id]/
│   │   │   ├── index.tsx          # Detalle de grupo
│   │   │   ├── chat.tsx           # Chat del grupo
│   │   │   └── voting.tsx         # Votación punto de encuentro
│   │   └── _layout.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/                        # Componentes atómicos
│   ├── EventCard.tsx
│   ├── GroupCard.tsx
│   ├── MemberAvatars.tsx
│   └── VotingCard.tsx
├── lib/
│   ├── supabase.ts                # Cliente Supabase
│   └── notifications.ts
├── stores/
│   ├── authStore.ts               # Zustand store de autenticación
│   └── locationStore.ts           # Zustand store de ubicación
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── functions/
│       ├── scrape-events/
│       └── send-push-notification/
└── types/
    └── database.types.ts          # Tipos generados por Supabase CLI
```
