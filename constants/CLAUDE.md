# constants/ — Tema y constantes visuales

## theme.ts — Sistema de tema claro/oscuro

```ts
import { useTheme, type Theme } from '@/constants/theme'
```

### Paleta de colores base
| Token | Valor |
|-------|-------|
| `primary` | `#6366F1` (indigo) |
| `primaryLight` | `#818CF8` |
| `primaryBg` | `#EEF2FF` (light) / `#1E1B4B` (dark) |
| `green` | `#10B981` |
| `red` | `#EF4444` |
| `amber` | `#F59E0B` |

### Tokens de tema (varían entre claro/oscuro)
| Token | Uso |
|-------|-----|
| `background` | Fondo de pantalla |
| `surface` | Cards, headers, bars |
| `surface2` | Inputs, skeletons, fondos secundarios |
| `text` | Texto principal |
| `textSecondary` | Texto secundario |
| `textTertiary` | Placeholders, timestamps, labels pequeños |
| `border` | Bordes normales |
| `borderLight` | Bordes suaves |
| `inputBg` / `inputBorder` | Inputs de formulario |
| `tabBg` / `tabBorder` | Tab bar |
| `statusBar` | `'dark'` o `'light'` para `expo-status-bar` |

### `useTheme()`
Hook que lee `useColorScheme()` de React Native y devuelve `lightTheme` o `darkTheme`.

### Obligatorio en toda pantalla / componente con estilos
```tsx
const t = useTheme()
const s = useMemo(() => makeStyles(t), [t])
```

## Colors.ts
Archivo legacy del template Expo. No usar — usar `theme.ts`.
