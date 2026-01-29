# Gym Tracker RN Starter

Starter template for a React Native app powered by Expo Router, NativeWind, and theme-aware UI primitives.

## App Shell

App shell components live in `src/components` and standardize screen layout and headers.

### Screen

`Screen` wraps safe-area handling, padding presets, optional scrolling, and keyboard avoiding.

```tsx
import { Screen } from '@/components/screen';

export default function Example() {
  return (
    <Screen preset="scroll" padding="md" keyboardAvoiding>
      {/* content */}
    </Screen>
  );
}
```

Props you will likely use:

- `preset`: `fixed` (default) or `scroll`
- `padding`: `none` | `sm` | `md` | `lg`
- `safeAreaEdges`: defaults to `['top']`
- `keyboardAvoiding`: wrap content in `KeyboardAvoidingView`
- `contentContainerClassName`: extra classes for scroll content

### AppHeader + headerOptions

Use `AppHeader` for a consistent title + actions layout and `headerOptions()` to reduce repeated screen config.

```tsx
import { Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { Button } from '@/components/ui';

export default function Account() {
  return (
    <>
      <Stack.Screen options={headerOptions({ title: 'Account' })} />
      <AppHeader
        title="Account"
        right={<Button label="Edit" variant="outline" />}
      />
    </>
  );
}
```

Tips:

- Use `showBackButton={false}` for tab-root screens.
- Override `headerShown` in `headerOptions()` if you need the native header.

## Theme System

Theme tokens and the `useTheme()` hook live in `src/lib`.

```tsx
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/cn';

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const { colors, tokens } = useTheme();

  return (
    <Text
      className={cn('text-lg font-semibold', className)}
      style={{ color: colors.foreground, paddingBottom: tokens.spacing.sm }}
    >
      {children}
    </Text>
  );
}
```

Tokens:

- `colors`: light/dark theme palette used for RN styles
- `spacing`: numeric spacing scale for padding/margin
- `radius`: numeric radius scale
- `typography`: sizes, line heights, weights, letter spacing

## Storage (MMKV + SQLite)

**MMKV** — Typed storage helpers live in `src/lib/storage.ts` and expose `getStorageItem`, `setStorageItem`, and `removeStorageItem` along with typed keys. Use for app settings, theme, session, and small UI flags.

```tsx
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';

const theme = getStorageItem(STORAGE_KEYS.selectedTheme);
setStorageItem(STORAGE_KEYS.selectedTheme, 'dark');
```

Migrations are versioned via `STORAGE_VERSION` and run once on app start:

```tsx
import { runStorageMigrations } from '@/lib/storage';

runStorageMigrations();
```

Optional encrypted storage is available when `EXPO_PUBLIC_MMKV_ENCRYPTION_KEY` is set:

```tsx
import { setSecureItem, SECURE_STORAGE_KEYS } from '@/lib/storage';

setSecureItem(SECURE_STORAGE_KEYS.authToken, { access: '...', refresh: '...' });
```

**SQLite (Planner)** — Plan data (splits, variants, session templates, cycles) lives in SQLite via Drizzle ORM and OP-SQLite. Schema and migrations live in `src/lib/planner-db/`; the repository API is in `src/features/planner/planner-repository.ts`. Migrations run at app start via `PlannerDbProvider` in the (app) layout. Do not persist full plan state to MMKV.

## Networking

The base API client lives in `src/lib/api-client.ts` and provides a typed result shape plus token injection from MMKV.

```tsx
import { apiClient } from '@/lib/api-client';

type Profile = {
  id: string;
  name: string;
};

const result = await apiClient.request<Profile>('/me');

if (result.ok) {
  console.log(result.data.name);
} else {
  console.warn(result.error.message);
}
```

Notes:

- Configure the base URL with `EXPO_PUBLIC_API_URL`.
- **Testing on a physical device with API on your laptop:** use your machine’s LAN IP (e.g. `http://192.168.1.5:3000`) instead of `localhost`, so the phone can reach the API. Ensure the API listens on `0.0.0.0` and phone and laptop are on the same Wi‑Fi.
- Access tokens are read from `SECURE_STORAGE_KEYS.authToken` (secure MMKV) or `STORAGE_KEYS.token`.
- `useRefreshToken()` exists as a placeholder for wiring in refresh flows.

## Query + Caching

TanStack Query is wired in at the root with a shared `QueryClient` that maps errors to a toast.

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Query key helpers live in `src/lib/query-keys.ts`:

```tsx
import { queryKeys } from '@/lib/query-keys';

const workoutsKeys = queryKeys.scope('workouts');
workoutsKeys.list({ range: 'month' });
workoutsKeys.detail('workout-id');
```

Notes:

- Standard error mapping to toast is handled in `src/lib/query-error.ts`.
- `queryClient` is provided in `src/app/_layout.tsx`.

## Forms (RHF + Zod)

Form helpers live in `src/components/forms` and `src/lib` with a baked-in Zod resolver.

```tsx
import { ControlledTextField } from '@/components/forms';
import { useZodForm } from '@/lib/use-zod-form';
import { emailSchema, passwordSchema } from '@/lib/form-schemas';
import * as z from 'zod';

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type FormValues = z.infer<typeof schema>;

const { control, handleSubmit } = useZodForm<FormValues>(schema);
```

Field components:

- `FormField` for label/helper/error layout.
- `ControlledTextField`, `ControlledSelectField`, `ControlledCheckboxField`.

## Quality Defaults

Quality helpers live in `src/lib` and provide haptics, accessibility defaults, and reduced motion support.

```tsx
import { triggerHaptic } from '@/lib/haptics';

await triggerHaptic('success');
```

```tsx
import { getHitSlop } from '@/lib/accessibility';

<Pressable hitSlop={getHitSlop()} />;
```

```tsx
import { useReducedMotion } from '@/lib/motion';

const reduceMotion = useReducedMotion();
```

Notes:

- Buttons default to `accessibilityRole="button"` and use their `label` as an accessibility label.
- `Skeleton` respects reduced motion and renders without animation when enabled.

## Navigation + Access Control

Protected groups live in `src/app/_layout.tsx` via `Stack.Protected` guards.

For edge cases (deep links, expired sessions, onboarding redirects), use `useAuthGuard()` in screens:

```tsx
import { useAuthGuard } from '@/hooks';

export default function Account() {
  useAuthGuard({
    allowlist: ['/reset-password'],
    onboardingRoute: '/onboarding',
    isOnboarded: true,
  });

  return null;
}
```

## Planner

The Planner feature lets users define workout splits (variants A/B/C), set a rotation (e.g. A/B alternating), and view a week-based session list.

- **Data:** Splits, variants, session templates, and cycles are stored in SQLite (Drizzle + OP-SQLite). Repository: `@/features/planner/planner-repository` (`getActivePlan`, `createTemplateSplit`, `createOrUpdateCycle`, `resetPlan`, etc.).
- **Flow:** `/planner` gates between three states: no split (empty → split-template), split but no cycle (needs rotation → rotation), or full week view. Week view is generated from the active plan’s rotation and anchor week (no fixed weekdays).
- **Routes:** `/planner` (main, gated), `/planner/split-template` (choose template or custom), `/planner/split-builder` (custom split), `/planner/rotation` (set rotation), `/planner/plan` (manage plan; accessible via Plan pill in header).
- **Header:** Bell and Settings are global (notifications, app settings). Planner-specific actions use the Plan pill (`AppHeader` `rightAddon`) and go to `/planner/plan`.

## Project Notes

- App shell updates tracked in `docs/app-shell.md`.
