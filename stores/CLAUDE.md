# stores/ — Estado global (Zustand)

## authStore.ts
```ts
import { useAuthStore } from '@/stores/authStore'
```
| Campo / Acción | Tipo | Descripción |
|---------------|------|-------------|
| `session` | `Session \| null` | Sesión Supabase activa |
| `user` | `User \| null` | Objeto User de Supabase |
| `profile` | `Profile \| null` | Fila de `public.profiles` |
| `isLoading` | `boolean` | True hasta resolver sesión inicial |
| `setSession(session)` | action | Actualiza session + user |
| `setProfile(profile)` | action | Actualiza profile |
| `setLoading(loading)` | action | Actualiza isLoading |
| `signOut()` | action | Limpia session, user, profile |
| `isAuthenticated()` | selector | `session !== null` |
| `isVerified()` | selector | `profile?.verified === true` |
| `hasProfile()` | selector | `profile !== null` |

Inicializado por `hooks/useAuth.ts → useAuthInitializer()` en `app/_layout.tsx`.

## locationStore.ts
```ts
import { useLocationStore } from '@/stores/locationStore'
```
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `coordinates` | `{ latitude, longitude } \| null` | GPS actual del usuario |
| `permissionGranted` | `boolean \| null` | null = no preguntado aún |
| `setCoordinates(coords)` | action | — |
| `setPermissionGranted(granted)` | action | — |

Inicializado por `hooks/useLocation.ts → useLocationInitializer()` en `app/(app)/_layout.tsx`.  
Fallback si GPS falla en emulador: `{ latitude: 40.4168, longitude: -3.7038 }` (Madrid).

## Patrón de uso en componentes
```ts
// Leer un campo
const session = useAuthStore((s) => s.session)

// Leer con ref (para evitar re-renders al cambiar):
const coordsRef = useRef(coordinates)
useEffect(() => { coordsRef.current = coordinates }, [coordinates])
```
