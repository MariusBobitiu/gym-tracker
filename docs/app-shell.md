# App Shell Worklog

## Done
- Added `Screen` wrapper with safe-area handling, padding presets, optional scroll, and optional keyboard avoiding.
- Updated `AppHeader` to support left/title/right layout and added a `headerOptions()` helper for Stack configs.
- Swapped core app screens to use `Screen` + `headerOptions()` to reduce repeated config.

## Notes
- `Screen` defaults to `preset="fixed"` and `padding="md"` so screens get consistent spacing out of the box.
- `AppHeader` defaults to a back button; set `showBackButton={false}` for tab-root screens.
