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

## RPCs disponibles
| Función | Auth | Descripción |
|---------|------|-------------|
| `events_near(user_lat, user_lng, radius_km, cat)` | anon/authenticated | Eventos con distancia Haversine + DISTINCT ON (name,venue) |
| `join_group(p_group_id)` | authenticated | Unirse a grupo (SECURITY DEFINER) |
| `create_group(p_event_id, p_name, p_description, p_max_members)` | authenticated | Crear grupo (SECURITY DEFINER) |

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
