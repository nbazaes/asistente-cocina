# AGENTS.md

## Tech Stack
- Expo SDK 56 + Expo Router (file-based routing)
- React Native 0.85 + React 19 + TypeScript 6.0 (strict mode)
- expo-sqlite + drizzle-orm (local SQLite DB)
- Zustand v5 for state management
- Multiple AI providers via `openai` npm package (used as universal OpenAI-compatible client)

## Commands
- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — platform-specific starts
- No lint, typecheck, or test scripts configured yet

## Architecture

### DB & Data Layer
- **DB file**: `asistente-cocina.db` (opened via `openDatabaseSync`)
- **Migrations**: Raw SQL in `src/data/database/migrations.ts` — `runMigrations()` creates tables if not exist. Call it before any queries.
- **Seed**: `seedIfEmpty()` in `src/data/database/seed.ts` inserts 6 sample recipes on first launch.
- **Init order** (in `app/_layout.tsx`): `runMigrations()` → `seedIfEmpty()` → render app
- **Schema**: recipes, ingredients, steps, user_pantry tables. `tags` is stored as `JSON.stringify` string.
- **Repository pattern**: `IRecipeRepository` / `IPantryRepository` interfaces with local SQLite implementations. Access via `useRepositories()` hook — requires `RepositoryProvider` wrapping the app tree.

### Routing (Expo Router)
- `app/_layout.tsx` — root Stack with `headerShown: false`
- `app/(tabs)/` — tab group: index (home), recipes, settings
- `app/recipe/[id].tsx` — recipe detail (slides from right)
- `app/recipe/add.tsx` — modal (slides from bottom)
- `app/chatbot.tsx` — chatbot screen (slides from right)

### State Management (Zustand)
- `useRecipeStore` — recipes list, CRUD, search. Actions receive the repo instance as a parameter.
- `useSettingsStore` — API key, provider, model. Setting the API key auto-detects the provider via key prefixes and calls `initializeAI()`.

### AI/Chatbot
- `AIChatbotService.ts` — wraps the `openai` package as a universal client. Must call `initializeAI(apiKey, providerId, model?)` before `sendMessage()`.
- `AIProviderConfig.ts` — registry of 8 providers (OpenAI, OpenRouter, DeepSeek, Groq, Mistral, Gemini, Together, xAI). Provider auto-detection via API key prefix matching.
- Responses are in Spanish (system prompt is in Spanish).

### Theme
- Colors, fonts, spacing, border radius in `src/theme/index.ts`
- Project uses a warm/earthy color palette (sage greens, creams, warm browns)

## Conventions
- `tags` on recipe rows is a JSON-stringified array — parse when reading, stringify when writing
- Ingredient quantities: unscaled units include `unidad`/`unidades`
- Recipe difficulty: `'easy' | 'medium' | 'hard'`
- Recipe type: `'dish' | 'dessert' | 'drink' | 'bakery'`
- No native iOS/Android project folders — they're gitignored, use Expo EAS/development builds

## Skills
This repo has auto-installed skills (tracked in `skills-lock.json`). Relevant skills for this project include: `building-native-ui`, `expo-deployment`, `drizzle`, `react-best-practices`. Load them when relevant.
