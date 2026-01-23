# React Native/Expo Project

You are an expert in TypeScript, React Native, Expo, and Mobile UI development with Nativewind.

Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context

- App type: React Native app built with Expo and Expo Router.
- Entry: `expo-router/entry` (see `package.json`).
- Project structure:

```
src
  ├── app         ## Expo Router screens and layouts
  │   ├── (app)    ## Authenticated app routes
  │   └── +html.tsx, +not-found.tsx, _layout.tsx, sign-in.tsx
  ├── components  ## Shared components
  │   ├── ui       ## Core UI components (button, input, text, etc.)
  │   └── forms    ## Form helpers and controlled fields
  ├── hooks        ## Reusable hooks (auth, theme, tokens)
  ├── lib          ## Shared utilities, auth, query, storage, config
  ├── store        ## Zustand store(s)
  └── types        ## Shared types
```

- How to use:
  - Install: `pnpm install`
  - Dev: `pnpm start` (dev client) or `pnpm web`
  - Native run: `pnpm ios` / `pnpm android`
  - Lint/format: `pnpm lint` / `pnpm format`

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Ensure components are modular, reusable, and maintainable.
- Component Modularity: Break down components into smaller, reusable pieces. Keep components focused on a single responsibility and shouldn't be more than 80 lines of code.
- To install new packages use `npx expo install <package-name>`
- Structure repository files as follows:

```
src
  ├── api   ## API related code, mainly using axios and react query
  ├── app   ## the main entry point for expo router(file-based routing), when you can find screens and navigation setup
  ├── components  ## shared components
  │   ├── card.tsx
  │   ├── ui  ## core ui components. buttons, inputs, etc
  │   └── forms ## form helpers and controlled fields
  ├── lib  ## shared libraries, auth, env, hooks, i18n, storage, test-utils, utils
  ├── types  ## shared types
```

## Tech Stack

- Expo
- React Native
- TypeScript
- Nativewind ( Tailwind CSS for React Native )
- Expo Router
- React Query with React Query Kit
- Zustand
- React Native Keyboard Controller
- React Native SVG
- React Native MMKV

## Naming Conventions

- Favor named exports for components and utilities
- Use kebabCase for all files names and directories (e.g., visa-form.tsx)

## TypeScript Usage

- Use TypeScript for all code; prefer types over interfaces
- Don't use `any` unless it's completely necessary
- Avoid enums; use const objects with 'as const' assertion
- Use functional components with TypeScript interfaces
- Define strict types for message passing between different parts of the extension
- Use absolute imports for all files @/...
- Avoid try/catch blocks unless there's good reason to translate or handle error in that abstraction
- Use explicit return types for all functions

## State Management

- Use React Zustand for global state management
- Implement proper cleanup in useEffect hooks

## Syntax and Formatting

- Use "function" keyword for pure functions
- Avoid unnecessary curly braces in conditionals
- Use declarative JSX
- Implement proper TypeScript discriminated unions for message types

## UI and Styling

- Use Nativewind for styling and components
- Use built-in ui components such as Button, Input from `@components/ui`
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props.
- Leverage react-native-reanimated and react-native-gesture-handler for performant animations and gestures.
- Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately.
- Make sure to use defined colors and fonts in the tailwind config file.
- Prefer theme tokens and `useTheme()` colors for styling; use `colors.background` (auto dark/light) instead of `bg-background`.

## Haptics and Storage

- Use `triggerHaptic` from `@/lib/haptics` for haptic feedback.
- Store sensitive data in MMKV secure storage (`secureStorage`, `SECURE_STORAGE_KEYS`); ensure `EXPO_PUBLIC_MMKV_ENCRYPTION_KEY` is set.

## Hooks and Data Fetching

- Use `useZodForm` from `@/lib/use-zod-form` for form validation with Zod.
- Use `useAuth` from `@/lib/auth/context` for auth state and actions.
- Prefer shared hooks in `@/hooks` instead of duplicating logic.
- Use TanStack Query via the configured client in `@/lib/query/query-client` and keys from `@/lib/query/query-keys`.

## UI Components and Patterns

- Prefer primitives from `@/components/ui` (Text, Button, Input, Select, Checkbox/Radio/Switch, Card, Modal, List, Image).
- Use typography helpers `H1`, `H2`, `H3`, `P`, `Small` for consistent text scale.
- Use `Screen` for page layout, safe area handling, and optional background gradient.
- Use `FormField` and controlled fields from `@/components/forms` for form layouts.

## Theme, Tokens, and Utilities

- Use `useTheme()` for colors and tokens; avoid hardcoded sizes where tokens exist.
- Use `useThemeConfig()` for React Navigation theme configuration.
- Use `cn` from `@/lib/cn` to merge class names.
- Use `getHitSlop` and `resolveAccessibilityLabel` from `@/lib/accessibility` for touch targets and a11y labels.
- Use `useReducedMotion()` from `@/lib/motion` to respect reduced motion preferences.
- Use `Env` from `@/lib/env` for client environment values (API base URL, keys).

## API and Errors

- Use `apiClient`/`request` from `@/lib/api-client` for network calls.
- Use `showQueryError` (`@/lib/query/query-error`) for query/mutation errors.

## Error Handling

- Log errors appropriately for debugging
- Provide user-friendly error messages

## Testing

- Write unit tests using Jest and React Native Testing Library.
- Write unit tests for utilities and complex components
- The test file should be named like the component file but with the .test.tsx extension (e.g., component-name.test.tsx)
- Do not write unit tests for simple components that only show data

## Git Usage

Commit Message Prefixes:

- "fix:" for bug fixes
- "feat:" for new features
- "perf:" for performance improvements
- "docs:" for documentation changes
- "style:" for formatting changes
- "refactor:" for code refactoring
- "test:" for adding missing tests
- "chore:" for maintenance tasks

Rules:

- Use lowercase for commit messages
- Keep the summary line concise with a maximum of 100 characters
- Reference issue numbers when applicable

## Documentation

- Maintain clear README with the following sections:
  - Setup ( how to install and run the project )
  - Usage ( listing all the commands and how to use them )
  - Stack ( the tech stack used in the project )
  - Folder Structure ( the folder structure of the project only the important ones inside src )
