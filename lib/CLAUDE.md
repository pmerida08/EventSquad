# lib/ — Capa de acceso a datos

Funciones async puras que encapsulan todas las llamadas a Supabase. Las pantallas nunca importan `supabase` directamente — siempre usan estas funciones.

## Archivos

### `supabase.ts`
Cliente Supabase singleton con `SecureStoreAdapter` (chunked, límite 1800B por chunk para superar el límite de 2KB de SecureStore con JWTs largos).
```ts
import { supabase } from '@/lib/supabase'
```

### `events.ts`
| Export | Descripción |
|--------|-------------|
| `fetchEventsNear(lat, lng, radiusKm, category?)` | RPC `events_near` — eventos con distancia Haversine, DISTINCT ON (name,venue) |
| `fetchAllEvents(category?)` | Query directa con `date >= now()-2h`, sin filtro de ubicación |
| `fetchEventById(id)` | Evento por ID |
| `formatEventDate(iso)` | ISO → "mié., 29 abr., 16:00" |
| `formatDistance(km)` | km → "1,2 km" o "850 m" |
| `EVENT_CATEGORIES` | `['concierto','festival','electrónica','flamenco','fiesta']` |

**Importante:** `fetchAllEvents` usa el mismo cutoff de 2h que `events_near`. Desde la migración `20260429130000`, la tabla `events` tiene `UNIQUE(name,venue)`, por lo que ambas funciones devuelven datos limpios sin duplicados.

### `groups.ts`
| Export | Descripción |
|--------|-------------|
| `fetchGroupsByEvent(eventId)` | Grupos de un evento (vista `groups_with_member_count`) |
| `fetchGroupById(groupId)` | Detalle de un grupo |
| `fetchGroupMembers(groupId)` | Miembros con join a `profiles` |
| `fetchMyGroups()` | Grupos del usuario actual con datos del evento asociado |
| `getMyGroupForEvent(eventId)` | ID del grupo al que pertenece el usuario en ese evento |
| `joinGroup(groupId)` | RPC `join_group` (SECURITY DEFINER) |
| `leaveGroup(groupId)` | Delete de `group_members` |
| `createGroup(eventId, name, description, maxMembers)` | RPC `create_group` (SECURITY DEFINER) |
| `parseGroupError(e)` | Traduce errores de Postgres a mensajes legibles |

### `messages.ts`
| Export | Descripción |
|--------|-------------|
| `fetchMessages(groupId, beforeCursor?)` | Últimos 40 mensajes (paginado por cursor ISO) |
| `sendMessage(groupId, content)` | Inserta mensaje (content se hace trim) |
| `subscribeToMessages(groupId, onNewMessage)` | Suscripción Realtime INSERT → enriquece con perfil, devuelve unsubscribe fn |
| `subscribeToTyping(groupId, myUserId, onTypingChange)` | Presence channel → devuelve `{ startTyping, stopTyping, unsubscribe }` |
| `MessageWithProfile` | `MessageRow & { profiles: { display_name, avatar_url } }` |

### `auth.ts`
Funciones de auth: `signIn`, `signUp`, `signOut`, `updateProfile`, `uploadAvatar`.

### `notifications.ts`
Funciones de push (pendiente Fase 6): registro de `expo_push_token` en `profiles`.
