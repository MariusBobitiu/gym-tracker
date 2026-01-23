# App Shell Worklog

## Done

- Added `Screen` wrapper with safe-area handling, padding presets, optional scroll, and optional keyboard avoiding.
- Updated `AppHeader` to support left/title/right layout and added a `headerOptions()` helper for Stack configs.
- Swapped core app screens to use `Screen` + `headerOptions()` to reduce repeated config.
- Added `useAuthGuard()` hook to handle auth edge cases (deep links, expired sessions, onboarding redirects).
- Added theme system with tokens (colors, spacing, radius, typography) plus `useTheme()` and `cn()` helper.
- Added typed MMKV storage layer with safe get/set/remove, migrations, and optional encrypted store.
- Added networking layer with a base `apiClient`, typed request helper, MMKV token injection, and refresh-token hook placeholder.
- Added TanStack Query provider, query key helpers, and standardized error-to-toast mapping.
- Added RHF + Zod form foundation with FormField, controlled field components, and shared schemas.
- Added quality defaults: haptics wrapper, accessibility helpers, and reduced motion hook/skeleton handling.

## Notes

- `Screen` defaults to `preset="fixed"` and `padding="md"` so screens get consistent spacing out of the box.
- `AppHeader` defaults to a back button; set `showBackButton={false}` for tab-root screens.
