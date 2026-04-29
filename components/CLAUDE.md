# components/ — Componentes reutilizables

## Convenciones obligatorias
- Colores: siempre desde `useTheme()` / token del tema. Nunca hex hardcodeado.
- Iconos: `FontAwesome` de `@expo/vector-icons/FontAwesome`. Nunca emojis como iconos.
- Accesibilidad: `accessibilityRole="button"` + `accessibilityLabel` en todos los `Pressable`.
- Estilos: patrón `makeStyles(t: Theme)` devolviendo `StyleSheet.create({...})`.

## Componentes principales

### `EventCard.tsx`
Tarjeta de evento para la lista principal. Props: `event: EventNear | EventRow`, `onPress`.
- Imagen con `expo-image`, badge de categoría, distancia (si `event.distance_km`), nombre, recinto, fecha.
- `android_ripple={{ color: t.primaryBg }}`

### `EventCardSkeleton.tsx`
Placeholder animado mientras cargan los eventos. Usa `Animated.loop` con opacidad 0.4→1→0.4 (750ms cada dirección). Misma altura y layout que `EventCard`.

### `GroupCard.tsx`
Tarjeta de grupo en la pantalla de grupos por evento. Muestra nombre, descripción, contador de miembros, barra de progreso.

### `MemberAvatars.tsx`
Stack horizontal de avatares de miembros. Máximo N visibles + contador "+X más".

### `VotingCard.tsx`
Tarjeta de propuesta de punto de encuentro (Fase 5, pendiente uso).

## components/ui/
Componentes base del template Expo (pueden ignorarse salvo `Themed.tsx`).

## Patrón makeStyles
```tsx
function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { backgroundColor: t.background },
    title:     { color: t.text, fontSize: 16, fontWeight: '700' },
  })
}

export default function MyComponent() {
  const t = useTheme()
  const s = useMemo(() => makeStyles(t), [t])
  // ...
}
```
