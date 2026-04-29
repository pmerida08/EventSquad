# types/ — Definiciones de tipos TypeScript

## database.types.ts
Tipos auto-generados a partir del esquema de Supabase. Contiene la interfaz `Database` con todas las tablas, vistas y funciones RPC.

### Regenerar tras cambios en el esquema
```bash
# Via MCP
mcp generate_typescript_types project_id=eixsagtnwwxsylaoyqfp

# Via CLI
supabase gen types typescript --project-id eixsagtnwwxsylaoyqfp > types/database.types.ts
```

### Tablas incluidas
- `Database['public']['Tables']['profiles']['Row']`
- `Database['public']['Tables']['events']['Row']`
- `Database['public']['Tables']['groups']['Row']`
- `Database['public']['Tables']['group_members']['Row']`
- `Database['public']['Tables']['messages']['Row']`

### Vistas
- `Database['public']['Views']['groups_with_member_count']['Row']`

### Funciones RPC
- `Database['public']['Functions']['events_near']['Returns'][number]` → tipo `EventNear`

### Uso en lib/
```ts
import type { Database } from '@/types/database.types'
type ProfileRow = Database['public']['Tables']['profiles']['Row']
```

### Importante
Cuando se añade una nueva tabla o se modifica el esquema, regenerar este archivo. Los tipos de `lib/` y componentes dependen de él.
