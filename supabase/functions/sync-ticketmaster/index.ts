import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'

// ── Mapeo de géneros Ticketmaster → categorías de la app ───────────────────────
function mapCategory(event: TmEvent): string {
  const name = event.name?.toLowerCase() ?? ''

  for (const c of event.classifications ?? []) {
    const genre    = c.genre?.name?.toLowerCase()    ?? ''
    const subGenre = c.subGenre?.name?.toLowerCase() ?? ''

    if (genre.includes('flamenco') || subGenre.includes('flamenco')) return 'flamenco'

    if (
      genre.includes('electronic') ||
      genre.includes('dance')      ||
      subGenre.includes('electronic') ||
      subGenre.includes('techno')  ||
      subGenre.includes('house')   ||
      subGenre.includes('trance')
    ) return 'electrónica'

    if (
      genre.includes('hip-hop')    ||
      genre.includes('r&b')        ||
      genre.includes('reggaeton')  ||
      genre.includes('urban')      ||
      subGenre.includes('reggaeton')
    ) return 'fiesta'
  }

  if (
    name.includes('festival') ||
    name.includes(' fest ')   ||
    name.endsWith(' fest')
  ) return 'festival'

  return 'concierto'
}

// ── Imagen de mejor calidad (16:9, ≥640px de ancho) ──────────────────────────
function getBestImage(images: TmImage[]): string | null {
  if (!images?.length) return null
  const sorted = [...images]
    .filter(i => i.ratio === '16_9' && i.width >= 640)
    .sort((a, b) => b.width - a.width)
  return sorted[0]?.url ?? images.sort((a, b) => b.width - a.width)[0]?.url ?? null
}

// ── Tipos mínimos de la API ───────────────────────────────────────────────────
interface TmImage  { url: string; width: number; ratio?: string }
interface TmVenue  { name?: string; address?: { line1?: string }; city?: { name?: string }; location?: { latitude?: string; longitude?: string } }
interface TmEvent  {
  id: string
  name: string
  dates?: { start?: { dateTime?: string } }
  classifications?: { genre?: { name: string }; subGenre?: { name: string }; segment?: { name: string } }[]
  images?: TmImage[]
  _embedded?: { venues?: TmVenue[] }
}
interface TmResponse {
  _embedded?: { events?: TmEvent[] }
  page?: { totalPages?: number }
}

type EventRow = {
  name:       string
  date:       string
  venue:      string
  address:    string
  lat:        number
  lng:        number
  image_url:  string | null
  category:   string
  source_id:  string
  scraped_at: string
}

// ── Fetch de una página de eventos ───────────────────────────────────────────
async function fetchPage(apiKey: string, page: number): Promise<TmResponse> {
  const params = new URLSearchParams({
    apikey:             apiKey,
    countryCode:        'ES',
    classificationName: 'Music',
    size:               '200',
    page:               String(page),
    sort:               'date,asc',
  })
  const res = await fetch(`${TM_BASE}/events.json?${params}`)
  if (!res.ok) throw new Error(`Ticketmaster API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<TmResponse>
}

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Proteger el endpoint con un secreto (cabecera x-cron-secret)
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  }

  const apiKey = Deno.env.get('TICKETMASTER_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'TICKETMASTER_API_KEY not configured' }), { status: 500 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let page = 0
  let totalPages = 1
  const allRows: EventRow[] = []

  try {
    // ── 1. Recoger todos los eventos de la API (máx. 5 páginas × 200) ──────────
    while (page < totalPages && page < 5) {
      const data = await fetchPage(apiKey, page)
      totalPages = data.page?.totalPages ?? 1

      const rows = (data._embedded?.events ?? [])
        .map((event: TmEvent): EventRow | null => {
          const venue = event._embedded?.venues?.[0]
          if (!venue?.location?.latitude || !venue?.location?.longitude) return null

          const lat = parseFloat(venue.location.latitude)
          const lng = parseFloat(venue.location.longitude)
          if (isNaN(lat) || isNaN(lng)) return null

          const dateTime = event.dates?.start?.dateTime
          if (!dateTime) return null

          // Excluir listados secundarios (VIP packages, upgrades)
          if (
            event.name.includes(' | VIP') ||
            event.name.includes(' - UPGRADE') ||
            event.name.includes(' - VIP')
          ) return null

          const address = [venue.address?.line1, venue.city?.name]
            .filter(Boolean).join(', ') || venue.city?.name || 'España'

          return {
            name:       event.name,
            date:       dateTime,
            venue:      venue.name ?? 'Venue desconocido',
            address,
            lat,
            lng,
            image_url:  getBestImage(event.images ?? []),
            category:   mapCategory(event),
            source_id:  `tm-${event.id}`,
            scraped_at: new Date().toISOString(),
          }
        })
        .filter((r): r is EventRow => r !== null)

      allRows.push(...rows)
      console.log(`Página ${page + 1}/${totalPages} — ${rows.length} eventos recogidos`)
      page++
    }

    // ── 2. Deduplicar en memoria ──────────────────────────────────────────────
    // Por cada par (name, venue), conservar solo el evento con la fecha más
    // próxima en el futuro. Así la base de datos siempre tendrá un único
    // registro por show+recinto y nunca se verán duplicados en la app.
    const now = new Date()
    const deduped = new Map<string, EventRow>()

    for (const row of allRows) {
      const eventDate = new Date(row.date)
      if (eventDate <= now) continue                    // descartar eventos pasados

      const key = `${row.name}|||${row.venue}`
      const existing = deduped.get(key)

      if (!existing || eventDate < new Date(existing.date)) {
        deduped.set(key, row)                           // conservar la fecha más próxima
      }
    }

    const uniqueRows = Array.from(deduped.values())

    console.log(`Total recogidos: ${allRows.length} | Tras deduplicación: ${uniqueRows.length}`)

    // ── 3. Insertar en la base de datos (ya deduplicados) ─────────────────────
    // El conflict en (name, venue) actualiza el registro existente si el show
    // ya estaba guardado con una fecha anterior que ahora necesita actualizarse.
    if (uniqueRows.length > 0) {
      const BATCH = 200
      for (let i = 0; i < uniqueRows.length; i += BATCH) {
        const batch = uniqueRows.slice(i, i + BATCH)
        const { error } = await supabase
          .from('events')
          .upsert(batch, { onConflict: 'name,venue' })
        if (error) throw new Error(`Supabase upsert error: ${error.message}`)
        console.log(`Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} eventos insertados/actualizados`)
      }
    }

    return new Response(
      JSON.stringify({
        success:    true,
        fetched:    allRows.length,
        upserted:   uniqueRows.length,
        pages:      page,
        duplicates_removed: allRows.length - uniqueRows.length,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('sync-ticketmaster error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
