-- ── Tabla events ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date        timestamptz not null,
  venue       text not null,
  address     text not null,
  lat         double precision not null,
  lng         double precision not null,
  image_url   text,
  category    text not null default 'concierto',
  source_id   text unique,
  scraped_at  timestamptz not null default now()
);

create index if not exists events_date_idx     on public.events (date);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_scraped_idx  on public.events (scraped_at);

-- RLS: lectura pública, escritura solo service_role
alter table public.events enable row level security;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to service_role;

create policy "events_read_public"
  on public.events for select using (true);

-- ── RPC: eventos cercanos (Haversine, sin PostGIS) ───────────────────────────
create or replace function public.events_near(
  user_lat   double precision,
  user_lng   double precision,
  radius_km  double precision default 50,
  cat        text            default null
)
returns table (
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
language sql
stable
security invoker
as $$
  select
    e.*,
    round(
      (6371 * acos(
        least(1.0,
          cos(radians(user_lat)) * cos(radians(e.lat))
          * cos(radians(e.lng) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(e.lat))
        )
      ))::numeric, 1
    )::double precision as distance_km
  from public.events e
  where
    (6371 * acos(
      least(1.0,
        cos(radians(user_lat)) * cos(radians(e.lat))
        * cos(radians(e.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(e.lat))
      )
    )) <= radius_km
    and (cat is null or e.category = cat)
  order by e.date asc;
$$;

grant execute on function public.events_near to anon, authenticated;

-- ── Seed data ─────────────────────────────────────────────────────────────────
insert into public.events (name, date, venue, address, lat, lng, image_url, category, source_id) values
('Rosalía — Motomami World Tour',      '2026-05-15 21:00:00+02', 'Palacio Vistalegre',            'Av. Perón, 15, Madrid',                  40.3936, -3.7278, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', 'concierto',   'seed-001'),
('Bad Bunny — Debí Tirar Más Fotos',   '2026-05-20 22:00:00+02', 'Cívitas Metropolitano',         'Av. Luis Aragonés, s/n, Madrid',         40.4363, -3.5998, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', 'concierto',   'seed-002'),
('Dua Lipa — Radical Optimism Tour',   '2026-05-25 21:30:00+02', 'WiZink Center',                 'Av. Felipe II, s/n, Madrid',             40.4273, -3.6627, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800', 'concierto',   'seed-003'),
('Fiesta Electronik — Opening Night',  '2026-05-30 23:59:00+02', 'Fabrik',                        'Av. de la Industria, 82, Fuenlabrada',   40.2916, -3.7968, 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800', 'electrónica', 'seed-004'),
('Festival Tomavistas',                '2026-06-06 17:00:00+02', 'Recinto IFEMA',                 'Av. del Partenón, 5, Madrid',            40.4647, -3.6076, 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800', 'festival',    'seed-005'),
('The Weeknd — After Hours Tour',      '2026-06-12 22:00:00+02', 'Estadio Santiago Bernabéu',     'Av. de Concha Espina, 1, Madrid',        40.4531, -3.6883, 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', 'concierto',   'seed-006'),
('Primavera Sound 2026',               '2026-06-05 16:00:00+02', 'Parc del Fòrum',                'Rambla del Prim, 1, Barcelona',          41.4068,  2.2196, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800', 'festival',    'seed-007'),
('Coldplay — Music of the Spheres',    '2026-07-25 21:00:00+02', 'Estadi Olímpic Lluís Companys', 'Passeig Olímpic, 15-17, Barcelona',      41.3579,  2.1145, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', 'concierto',   'seed-008'),
('Sónar 2026',                         '2026-06-19 22:00:00+02', 'Fira Montjuïc',                 'Av. Reina Maria Cristina, s/n, BCN',     41.3705,  2.1488, 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800', 'electrónica', 'seed-009'),
('Rammstein — Europe Stadium Tour',    '2026-07-02 21:00:00+02', 'Estadi Olímpic Lluís Companys', 'Passeig Olímpic, 15-17, Barcelona',      41.3579,  2.1145, 'https://images.unsplash.com/photo-1567443024551-f3e3cc2be870?w=800', 'concierto',   'seed-010'),
('Medusa Sunbeach Festival',           '2026-07-10 18:00:00+02', 'Playa de Cullera',              'Playa L''Estany, Cullera, Valencia',     39.1667, -0.2333, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'electrónica', 'seed-011'),
('Arenal Sound 2026',                  '2026-08-01 17:00:00+02', 'Playa de Burriana',             'Passeig Marítim, Castelló de la Plana', 39.9874, -0.0133, 'https://images.unsplash.com/photo-1520483601560-389dff434fdf?w=800', 'festival',    'seed-012'),
('Nocturna Festival 2026',             '2026-05-29 22:00:00+02', 'FIBES',                         'Av. de Camas, s/n, Sevilla',             37.3978, -5.9912, 'https://images.unsplash.com/photo-1580821718543-ea38e2ef6851?w=800', 'electrónica', 'seed-013'),
('Flamenco Festival Sevilla',          '2026-06-20 21:00:00+02', 'Teatro de la Maestranza',       'Paseo de Cristóbal Colón, 22, Sevilla',  37.3828, -5.9967, 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800', 'flamenco',    'seed-014'),
('BBK Live 2026',                      '2026-07-09 17:00:00+02', 'Kobetamendi',                   'Barrio Kobetamendi, Bilbao',              43.2781, -2.9343, 'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800', 'festival',    'seed-015')
on conflict (source_id) do nothing;
