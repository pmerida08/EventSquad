# app/(app)/(tabs)/ — Tabs principales

3 tabs definidos en `_layout.tsx` con iconos FontAwesome y colores del tema.

## index.tsx — Eventos cerca de ti
**Estado:** `events`, `loading`, `refreshing`, `selectedCat`, `query`, `searchFocused`

**Flujo de carga:**
1. `coordsRef` — las coordenadas se leen desde un ref (NO como dependencia de `loadEvents`) para evitar re-fetches automáticos cuando llega la ubicación mid-session.
2. Si hay coords → `fetchEventsNear(lat, lng, 500, category)` (con distancias)
3. Si no hay coords → `fetchAllEvents(category)` (sin distancias, mismos datos deduplicados)
4. Pull-to-refresh re-lee `coordsRef.current` en ese momento → añade distancias si ya llegaron

**Skeleton:** 5× `EventCardSkeleton` mientras `loading === true`  
**Buscador:** filtrado client-side con `useMemo` sobre `events` (name, venue, address)  
**Categorías:** chips horizontales — `Todos | concierto | festival | electrónica | flamenco | fiesta`

## groups.tsx — Mis grupos
- `useFocusEffect` para recargar al volver a la pestaña
- `MyGroupCard` muestra imagen del evento, nombre del grupo, barra de progreso de miembros
- Navega a `/(app)/group/${group.id}` al pulsar

## profile.tsx — Perfil
- Muestra avatar, nombre, bio, estado de verificación
- Banner "Verificar identidad" si `!profile.verified`
- Botón de cerrar sesión con `useAuthStore(s => s.signOut)()`
