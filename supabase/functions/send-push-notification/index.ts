// Edge Function: send-push-notification
// Recibe un array de notificaciones y las envía via Expo Push API.
// Llamada desde triggers de base de datos (pg_net) con service_role_key.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface IncomingNotification {
  token: string
  title: string
  body: string
  data?: Record<string, unknown>
}

interface ExpoMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound: 'default'
  priority: 'high'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Solo acepta llamadas con la service_role_key
  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: { notifications?: IncomingNotification[] }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const incoming = body.notifications ?? []
  if (incoming.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Filtrar tokens Expo válidos y construir mensajes
  const messages: ExpoMessage[] = incoming
    .filter(
      (n) =>
        typeof n.token === 'string' &&
        (n.token.startsWith('ExponentPushToken[') || n.token.startsWith('ExpoPushToken[')),
    )
    .map((n) => ({
      to: n.token,
      title: n.title,
      body: n.body,
      data: n.data,
      sound: 'default',
      priority: 'high',
    }))

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Expo permite hasta 100 mensajes por request
  const CHUNK = 100
  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK)
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk),
      })
      if (res.ok) {
        sent += chunk.length
      } else {
        const text = await res.text()
        errors.push(`chunk ${i / CHUNK}: ${res.status} ${text}`)
      }
    } catch (e) {
      errors.push(`chunk ${i / CHUNK}: ${(e as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ sent, errors: errors.length > 0 ? errors : undefined }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
