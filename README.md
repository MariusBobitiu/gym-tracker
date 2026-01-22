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

## Project Notes

- App shell updates tracked in `docs/app-shell.md`.
