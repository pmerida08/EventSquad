# supabase/ — Backend (Supabase)

Proyecto: `eixsagtnwwxsylaoyqfp`  
URL: `https://eixsagtnwwxsylaoyqfp.supabase.co`

## Estructura
```
supabase/
├── migrations/   ← DDL en orden cronológico
└── functions/    ← Edge Functions (Deno)
    ├── sync-ticketmaster/     ← Sync diario de eventos desde API Ticketmaster
    ├── scrape-events/         ← (reservado, no activo)
    └── send-push-notification/ ← (Fase 6, pendiente)
```

## Esquema de tablas

### `profiles`
```sql
id uuid PK → auth.users(id)   display_name text NOT NULL
avatar_url text                bio text
verified boolean DEFAULT false expo_push_token text
created_at timestamptz
```
- RLS: lectura pública, write solo propio
- Trigger `on_auth_user_created` → auto-crea perfil al registrarse

### `events`
```sql
id uuid PK   name text   date timestamptz   venue text   address text
lat float8   lng float8   image_url text   category text   source_id text
scraped_at timestamptz
UNIQUE(name, venue)   ← añadido en migración 20260429130000
```
- RLS: lectura pública, write solo service_role
- Cron `cleanup-old-events`: borra eventos con `date < now() - 3 days` (02:00 UTC)
- 227 registros activos (tras deduplicación)

### `groups`
```sql
id uuid PK   event_id uuid→events   name text   description text
max_members int [2-50] DEFAULT 10   created_by uuid→profiles   created_at timestamptz
```
- RPC `create_group` (SECURITY DEFINER): valida 1 grupo por evento por usuario
- RPC `join_group` (SECURITY DEFINER): valida max_members y unicidad

### `group_members`
```sql
PK(group_id, user_id)   role text CHECK('owner','member')   joined_at timestamptz
```
- Vista `groups_with_member_count` (security_invoker=true): grupos + COUNT(members)

### `messages`
```sql
id uuid PK   group_id uuid→groups   user_id uuid→profiles
content text CHECK(1-1000 chars)   created_at timestamptz
INDEX (group_id, created_at DESC)
```
- RLS: solo miembros del grupo pueden leer/escribir
- Publicada en `supabase_realtime` para cambios en tiempo real

### `meetup_proposals`
```sql
id uuid PK   group_id uuid→groups   proposed_by uuid→profiles
location_name text CHECK(1-200 chars)   lat float8   lng float8
proposed_time timestamptz   selected boolean DEFAULT false   created_at timestamptz
```
- RLS: lectura solo miembros del grupo; escritura via RPC
- Publicada en `supabase_realtime`

### `meetup_votes`
```sql
PK(proposal_id, user_id)   proposal_id uuid→meetup_proposals   user_id uuid→profiles   created_at timestamptz
```
- 1 voto por usuario por grupo (enforced en RPC `vote_for_proposal`)
- RLS: lectura solo miembros del grupo; escritura via RPC
- Publicada en `supabase_realtime`
- Vista `meetup_proposals_with_votes` (security_invoker=true): propuestas + COUNT(votes)

### `user_reports`
```sql
id uuid PK   group_id uuid→groups   reporter_id uuid→profiles   reported_id uuid→profiles
reason text CHECK(1-500 chars)   created_at timestamptz
UNIQUE(group_id, reporter_id, reported_id)
```
- RLS: lectura solo miembros del grupo; escritura via RPC `report_user`
- Upsert: si ya existe un reporte del mismo reporter→reported en el mismo grupo, se actualiza el motivo

### `kick_votes`
```sql
PK(group_id, target_id, voter_id)   group_id uuid→groups   target_id uuid→profiles   voter_id uuid→profiles   created_at timestamptz
```
- RLS: lectura solo miembros del grupo; escritura via RPC `vote_kick_user`
- Se limpian automáticamente cuando el target es expulsado

## RPCs disponibles
| Función | Auth | Descripción |
|---------|------|-------------|
| `events_near(user_lat, user_lng, radius_km, cat)` | anon/authenticated | Eventos con distancia Haversine + DISTINCT ON (name,venue) |
| `join_group(p_group_id)` | authenticated | Unirse a grupo — valida max_members y unicidad por evento (SECURITY DEFINER) |
| `create_group(p_event_id, p_name, p_description, p_max_members)` | authenticated | Crear grupo (SECURITY DEFINER) |
| `add_meetup_proposal(p_group_id, p_location_name, p_lat, p_lng, p_proposed_time)` | authenticated | Añadir propuesta de encuentro (SECURITY DEFINER) |
| `vote_for_proposal(p_proposal_id)` | authenticated | Votar propuesta; selecciona ganador si todos votaron (SECURITY DEFINER) |
| `report_user(p_group_id, p_reported_id, p_reason)` | authenticated | Reporta un miembro del grupo (SECURITY DEFINER) |
| `vote_kick_user(p_group_id, p_target_id)` | authenticated | Vota para expulsar; expulsa automáticamente si >50% votan (SECURITY DEFINER) |
| `kick_member(p_group_id, p_target_id)` | authenticated | Expulsión directa por el owner (SECURITY DEFINER) |

## Crons (pg_cron)
| Job | Schedule | Acción |
|-----|----------|--------|
| `sync-ticketmaster` | Diario (configurar hora) | Llama Edge Function sync-ticketmaster |
| `cleanup-old-events` | `0 2 * * *` | DELETE eventos con date < now()-3days |

## Seguridad (recordatorio)
- Nunca `raw_user_meta_data` en políticas RLS — usar `raw_app_meta_data`
- Vistas con `security_invoker = true` (Postgres ≥15)
- Funciones SECURITY DEFINER en schema `public` (vigilar exposición)
- `service_role` solo en Edge Functions / server-side, nunca en el cliente
