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
| `joinGroup(groupId)` | RPC `join_group` (SECURITY DEFINER) — no requiere identidad verificada |
| `leaveGroup(groupId)` | Delete de `group_members` |
| `deleteGroup(groupId)` | Delete de `groups` (CASCADE a miembros, mensajes, propuestas) |
| `createGroup(eventId, name, description, maxMembers)` | RPC `create_group` (SECURITY DEFINER) |
| `parseGroupError(e)` | Traduce errores de `join_group`: ALREADY_IN_GROUP, GROUP_FULL, NOT_FOUND |

### `moderation.ts`
| Export | Descripción |
|--------|-------------|
| `reportUser(groupId, reportedId, reason)` | RPC `report_user` — guarda reporte; un reporte por reporter+reported+grupo (upsert) |
| `voteKickUser(groupId, targetId)` | RPC `vote_kick_user` — voto democrático; expulsa si >50% de miembros no-target votan |
| `kickMember(groupId, targetId)` | RPC `kick_member` — expulsión directa (solo owner) |
| `parseModerationError(msg)` | Traduce errores de los RPCs: NOT_MEMBER, SELF_REPORT, CANNOT_KICK_OWNER, NOT_OWNER, etc. |

### `messages.ts`
| Export | Descripción |
|--------|-------------|
| `fetchMessages(groupId, beforeCursor?)` | Últimos 40 mensajes (paginado por cursor ISO) |
| `sendMessage(groupId, content)` | Inserta mensaje (content se hace trim) |
| `subscribeToMessages(groupId, onNewMessage)` | Suscripción Realtime INSERT → enriquece con perfil, devuelve unsubscribe fn |
| `subscribeToTyping(groupId, myUserId, onTypingChange)` | Presence channel → devuelve `{ startTyping, stopTyping, unsubscribe }` |
| `MessageWithProfile` | `MessageRow & { profiles: { display_name, avatar_url } }` |

### `voting.ts`
| Export | Descripción |
|--------|-------------|
| `fetchProposals(groupId)` | Propuestas con conteo de votos + `myVotedProposalId` (null si no votó) |
| `addProposal(groupId, locationName, lat, lng, proposedTime)` | RPC `add_meetup_proposal` (solo miembros) |
| `voteForProposal(proposalId)` | RPC `vote_for_proposal` — 1 voto por usuario por grupo; selecciona ganador automáticamente |
| `parseVotingError(msg)` | Traduce errores de los RPCs a mensajes legibles |
| `subscribeToVoting(groupId, onUpdate)` | Realtime `*` en `meetup_proposals` + `meetup_votes` → devuelve unsubscribe fn |
| `ProposalWithVotes` | Tipo de la vista `meetup_proposals_with_votes` + `vote_count` |

### `auth.ts`
Funciones de auth: `signIn`, `signUp`, `signOut`, `updateProfile`, `uploadAvatar`.

### `notifications.ts`
| Export | Descripción |
|--------|-------------|
| `registerForPushNotifications()` | Solicita permisos, obtiene y devuelve el Expo push token (`string \| null`) |
| `savePushTokenToProfile(userId, token)` | Guarda el token en `profiles.expo_push_token` |

Configura `setNotificationHandler` globalmente al importar. El envío de notificaciones via Edge Function `send-push-notification` está pendiente (Fase 6).
