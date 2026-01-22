# App Shell Worklog

## Done

- Added `Screen` wrapper with safe-area handling, padding presets, optional scroll, and optional keyboard avoiding.
- Updated `AppHeader` to support left/title/right layout and added a `headerOptions()` helper for Stack configs.
- Swapped core app screens to use `Screen` + `headerOptions()` to reduce repeated config.
- Added `useAuthGuard()` hook to handle auth edge cases (deep links, expired sessions, onboarding redirects).
- Added theme system with tokens (colors, spacing, radius, typography) plus `useTheme()` and `cn()` helper.
- Added typed MMKV storage layer with safe get/set/remove, migrations, and optional encrypted store.

## Notes

- `Screen` defaults to `preset="fixed"` and `padding="md"` so screens get consistent spacing out of the box.
- `AppHeader` defaults to a back button; set `showBackButton={false}` for tab-root screens.
