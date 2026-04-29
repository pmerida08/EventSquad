-- ── events_near v2: deduplication + past-event filter ────────────────────────
-- - Muestra solo el próximo show de cada par (name, venue)
-- - Excluye eventos pasados (>2h de margen)
-- - Excluye listados secundarios de Ticketmaster (VIP packages, upgrades)
CREATE OR REPLACE FUNCTION public.events_near(
  user_lat   double precision,
  user_lng   double precision,
  radius_km  double precision DEFAULT 50,
  cat        text             DEFAULT NULL
)
RETURNS TABLE(
  id          uuid,
  name        text,
  date        timestamptz,
  venue       text,
  address     text,
  lat         double precision,
  lng         double precision,
  image_url   text,
  category    text,
  source_id   text,
  scraped_at  timestamptz,
  distance_km double precision
)
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT
      e.*,
      round(
        (6371 * acos(
          least(1.0,
            cos(radians(user_lat)) * cos(radians(e.lat))
            * cos(radians(e.lng) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(e.lat))
          )
        ))::numeric, 1
      )::double precision AS distance_km
    FROM public.events e
    WHERE
      (6371 * acos(
        least(1.0,
          cos(radians(user_lat)) * cos(radians(e.lat))
          * cos(radians(e.lng) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(e.lat))
        )
      )) <= radius_km
      AND e.date >= now() - interval '2 hours'
      AND (cat IS NULL OR e.category = cat)
      -- Excluir listados secundarios de Ticketmaster
      AND e.name NOT LIKE '% | VIP%'
      AND e.name NOT LIKE '% - UPGRADE%'
  ),
  -- Para shows recurrentes (mismo nombre+recinto), mostrar solo el próximo
  deduped AS (
    SELECT DISTINCT ON (name, venue) *
    FROM base
    ORDER BY name, venue, date ASC
  )
  SELECT
    id, name, date, venue, address, lat, lng,
    image_url, category, source_id, scraped_at, distance_km
  FROM deduped
  ORDER BY date ASC;
$$;
