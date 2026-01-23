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

## Storage (MMKV)

Typed storage helpers live in `src/lib/storage.ts` and expose `getStorageItem`, `setStorageItem`, and `removeStorageItem` along with typed keys.

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

## Project Notes

- App shell updates tracked in `docs/app-shell.md`.
