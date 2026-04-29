# app/(app)/ — Zona autenticada

Todas las pantallas de esta carpeta requieren sesión activa. El guard está en `_layout.tsx`: si `useAuthStore(s => s.session)` es null, redirige a `/(auth)/onboarding`.

## _layout.tsx
- Registra todas las pantallas en un `Stack` con `headerShown: false` por defecto.
- Llama a `useLocationInitializer()` una sola vez (solicita permisos GPS y guarda coords en `locationStore`).
- Pantallas registradas:

| name | Ruta real | Header |
|------|-----------|--------|
| `(tabs)` | tabs anidados | — |
| `event/[id]` | `/event/:id` | oculto |
| `event-groups/[eventId]` | `/event-groups/:eventId` | oculto |
| `create-group` | `/create-group` | oculto |
| `group/[id]/index` | `/group/:id` | oculto |
| `group/[id]/chat` | `/group/:id/chat` | oculto (cabecera propia) |
| `group/[id]/voting` | `/group/:id/voting` | visible ("Punto de encuentro") |

## Navegación importante
```ts
// ✅ Correcto — index.tsx es la ruta implícita de la carpeta
router.push(`/(app)/group/${id}`)

// ❌ Incorrecto — "/index" es un path literal que no resuelve
router.push(`/(app)/group/${id}/index`)
```

## (tabs)/
Ver `app/(app)/(tabs)/CLAUDE.md`

## group/[id]/
- `index.tsx` — Detalle: nombre, descripción, lista de miembros (`MemberAvatars`), botones unirse/salir/ir al chat.
- `chat.tsx` — Chat completo: `FlatList` invertida, burbujas con avatar, inserción optimista, paginación con cursor, typing indicator.
- `voting.tsx` — Votación de punto de encuentro (Fase 5, pendiente).

## event/[id].tsx
Detalle de un evento: imagen, categoría, fecha, recinto, mapa (pendiente PostGIS), botón "Ver grupos".

## event-groups/[eventId].tsx
Lista de grupos para ese evento. Botón "Crear grupo" → `/(app)/create-group?eventId=...`.
