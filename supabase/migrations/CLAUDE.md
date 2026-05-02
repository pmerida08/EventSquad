# supabase/migrations/ — Historial de migraciones

Las migraciones están en orden cronológico. Para aplicar nuevas: usar MCP `apply_migration` o Supabase CLI (`supabase db push --project-ref eixsagtnwwxsylaoyqfp`).

## Migraciones aplicadas

| Archivo | Contenido |
|---------|-----------|
| `001_profiles.sql` | Tabla `profiles`, RLS, trigger `handle_new_user`, bucket `avatars` |
| `20260428103719_events_table.sql` | Tabla `events` (source_id unique), índices, RLS, `events_near` v1, seeds |
| `20260428120000_groups.sql` | Tablas `groups` + `group_members`, vista `groups_with_member_count`, RPCs `join_group` + `create_group` |
| `20260428130000_ticketmaster_cron.sql` | Cron `sync-ticketmaster` via pg_net → Edge Function |
| `20260428140000_events_near_dedup.sql` | `events_near` v2: DISTINCT ON (name,venue), cutoff 2h, filtro VIP/UPGRADE |
| `20260428150000_cleanup_cron.sql` | Cron `cleanup-old-events` — DELETE eventos pasados hace >3 días (02:00 UTC) |
| `20260429100000_messages.sql` | Tabla `messages`, índice, RLS, publicación Realtime |
| `20260429130000_events_dedup_unique.sql` | **Deduplicación DB**: DROP source_id unique, DELETE duplicados, ADD UNIQUE(name,venue) |
| `20260502000000_voting.sql` | Tablas `meetup_proposals` + `meetup_votes`, vista `meetup_proposals_with_votes`, RPCs `add_meetup_proposal` + `vote_for_proposal`, RLS, Realtime |
| `20260502010000_moderation.sql` | Recrea `join_group` sin check UNVERIFIED; tablas `user_reports` + `kick_votes`; RPCs `report_user`, `vote_kick_user`, `kick_member` |

## Estado actual de la tabla events
- 227 registros únicos (tras `20260429130000`) — se actualiza con el cron diario
- Constraint: `UNIQUE(name, venue)`
- El Edge Function `sync-ticketmaster` hace upsert con `onConflict: 'name,venue'`

## Cómo crear una nueva migración
```bash
# Opción 1: MCP
mcp apply_migration project_id=eixsagtnwwxsylaoyqfp name=nombre_descriptivo query="SQL..."

# Opción 2: CLI (requiere supabase login)
supabase migration new nombre_descriptivo
# editar el archivo generado en supabase/migrations/
supabase db push --project-ref eixsagtnwwxsylaoyqfp
```
