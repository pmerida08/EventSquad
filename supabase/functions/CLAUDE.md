# supabase/functions/ — Edge Functions (Deno)

Deploy: MCP `deploy_edge_function` o `supabase functions deploy <name> --project-ref eixsagtnwwxsylaoyqfp`

## sync-ticketmaster/ (activa, v5)
**Trigger:** cron diario via `pg_net` HTTP POST con header `x-cron-secret`  
**verify_jwt:** false (autenticación propia via `CRON_SECRET`)

### Flujo en 3 pasos
1. **Recoger** — hasta 5 páginas × 200 eventos de Ticketmaster API (`countryCode=ES, classificationName=Music`)
2. **Deduplicar en memoria** — por cada `(name, venue)`, conservar solo el evento con la fecha más próxima en el futuro. Descarta VIP/UPGRADE.
3. **Insertar** — upsert en batches de 200 con `onConflict: 'name,venue'`

### Variables de entorno necesarias
| Variable | Descripción |
|----------|-------------|
| `TICKETMASTER_API_KEY` | Clave API Ticketmaster (`JgVabxLhGaDvupGEUmjrpa9rU97xVJbR`) |
| `SUPABASE_URL` | Auto-inyectada |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-inyectada |
| `CRON_SECRET` | Opcional — protege el endpoint |

### Respuesta de éxito
```json
{ "success": true, "fetched": 950, "upserted": 220, "pages": 5, "duplicates_removed": 730 }
```

## send-push-notification/ (pendiente Fase 6)
Enviará notificaciones push via Expo Push API. Recibirá `{ userId, title, body, data }`.

## scrape-events/ (reservado)
No activa. Reservada para scraping de fuentes adicionales.
