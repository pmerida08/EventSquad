# __tests__/ — Tests unitarios

Framework: **Jest + jest-expo + @testing-library/react-native**

## Comandos
```bash
npm test                  # run all
npm run test:watch        # watch mode
npm run test:coverage     # coverage report
```

## Estructura
```
__tests__/
├── utils/
│   └── supabase.mock.ts  ← Mock compartido del cliente Supabase
├── lib/
│   ├── events.test.ts        ← fetchEventsNear, fetchAllEvents, fetchEventById
│   ├── fetchEvents.test.ts   ← Tests adicionales de events
│   ├── messages.test.ts      ← fetchMessages, sendMessage
│   └── theme.test.ts         ← useTheme, lightTheme, darkTheme
└── components/
    ├── EventCard.test.tsx        ← Render, accesibilidad, onPress
    └── EventCardSkeleton.test.tsx ← Render, animación
```

## supabase.mock.ts — Mock compartido
```ts
import {
  mockSupabaseFrom, mockSelect, mockEq, mockGte, mockLt,
  mockOrder, mockLimit, mockSingle, mockUpsert, mockInsert,
  resetSupabaseMocks,
} from '../utils/supabase.mock'
```
- Todos los métodos son chainables (retornan el mismo objeto)
- `resetSupabaseMocks()` en `beforeEach` para estado limpio
- También mockea `supabase.auth.getUser` y `supabase.channel`
- El mock de `@supabase/supabase-js` se activa con `jest.mock('../../lib/supabase', ...)`

## Patrón para mockear una query completa
```ts
// Query que termina en .limit()
mockLimit.mockResolvedValueOnce({ data: MOCK_DATA, error: null })

// Query que termina en .single()
mockSingle.mockResolvedValueOnce({ data: MOCK_ROW, error: null })

// insert().select().single()
const mockSingleFn = jest.fn().mockResolvedValueOnce({ data: MOCK_ROW, error: null })
const mockSelectFn = jest.fn().mockReturnValue({ single: mockSingleFn })
mockInsert.mockReturnValue({ select: mockSelectFn })
```

## jest.setup.ts
Configura variables de entorno antes de cualquier import:
```ts
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest'
```
También mockea `@expo/vector-icons/FontAwesome` para evitar warnings de fuentes.

## Alias @/
Configurado en `package.json` bajo `jest.moduleNameMapper`:
```json
"^@/(.*)$": "<rootDir>/$1"
```
