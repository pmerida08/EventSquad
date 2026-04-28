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

  let totalUpserted = 0
  let page = 0
  let totalPages = 1

  try {
    // Máximo 5 páginas × 200 eventos = 1 000 eventos por ejecución
    while (page < totalPages && page < 5) {
      const data = await fetchPage(apiKey, page)
      totalPages = data.page?.totalPages ?? 1

      const rows = (data._embedded?.events ?? [])
        .map((event: TmEvent) => {
          const venue = event._embedded?.venues?.[0]
          if (!venue?.location?.latitude || !venue?.location?.longitude) return null

          const lat = parseFloat(venue.location.latitude)
          const lng = parseFloat(venue.location.longitude)
          if (isNaN(lat) || isNaN(lng)) return null

          const dateTime = event.dates?.start?.dateTime
          if (!dateTime) return null

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
        .filter(Boolean)

      if (rows.length > 0) {
        const { error } = await supabase
          .from('events')
          .upsert(rows, { onConflict: 'source_id' })
        if (error) throw new Error(`Supabase upsert error: ${error.message}`)
        totalUpserted += rows.length
      }

      console.log(`Page ${page + 1}/${totalPages} — ${rows.length} events processed`)
      page++
    }

    return new Response(
      JSON.stringify({ success: true, upserted: totalUpserted, pages: page }),
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
