-- ── Extensiones necesarias ────────────────────────────────────────────────────
create extension if not exists pg_cron    with schema extensions;
create extension if not exists pg_net     with schema extensions;

-- ── Cron: sincronizar Ticketmaster cada noche a las 03:00 UTC ─────────────────
-- Eliminar si ya existe (idempotente)
select cron.unschedule('sync-ticketmaster')
  where exists (
    select 1 from cron.job where jobname = 'sync-ticketmaster'
  );

select cron.schedule(
  'sync-ticketmaster',
  '0 3 * * *',   -- cada día a las 03:00 UTC
  format(
    $$
    select net.http_post(
      url     := '%s/functions/v1/sync-ticketmaster',
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || '%s',
        'x-cron-secret',  current_setting('app.cron_secret', true)
      ),
      body    := '{}'::jsonb
    );
    $$,
    current_setting('app.supabase_url',       true),
    current_setting('app.service_role_key',   true)
  )
);
