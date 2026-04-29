-- ── Cron: limpiar eventos pasados cada noche a las 02:00 UTC ─────────────────
-- Corre 1 hora antes del sync de Ticketmaster (03:00 UTC)
-- Elimina eventos cuya fecha ya pasó hace más de 3 días

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.unschedule('cleanup-old-events')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-events'
  );

SELECT cron.schedule(
  'cleanup-old-events',
  '0 2 * * *',
  $$
    DELETE FROM public.events
    WHERE date < now() - INTERVAL '3 days';
  $$
);
