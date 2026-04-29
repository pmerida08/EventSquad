-- ── Deduplicación a nivel de base de datos ────────────────────────────────────
-- Problema: el sync de Ticketmaster insertaba TODAS las fechas de un show
-- recurrente (ej. Tablao Flamenco 1911 × 20 fechas). La dedup solo ocurría
-- en la función events_near (DISTINCT ON), no en la tabla.
--
-- Solución:
--   1. Eliminar el constraint único de source_id (reemplazado por name+venue)
--   2. Borrar duplicados: conservar solo la próxima fecha de cada (name, venue)
--   3. Añadir constraint UNIQUE (name, venue) → futuros upserts ya no duplican

-- 1. Quitar el constraint único de source_id
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_source_id_key;

-- 2. Borrar duplicados conservando, para cada (name, venue), la fila con
--    la fecha más próxima en el futuro (o la menos antigua si todas son pasadas)
DELETE FROM public.events
WHERE id NOT IN (
  SELECT DISTINCT ON (name, venue) id
  FROM public.events
  ORDER BY
    name,
    venue,
    -- Primero eventos futuros (0), luego pasados (1)
    CASE WHEN date > now() - interval '2 hours' THEN 0 ELSE 1 END ASC,
    date ASC
);

-- 3. Añadir constraint única para mantener la invariante en adelante
ALTER TABLE public.events
  ADD CONSTRAINT events_name_venue_unique UNIQUE (name, venue);
