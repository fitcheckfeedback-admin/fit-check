# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Fit Check — Visual Theme

**Aurora Minimal** — warm cream/peach palette. Hero background uses warm cream gradients (not weather-blue). Cards are white with soft shadows on a warm off-white page.
- `WeatherBackground.tsx` — daytime categories now use warm cream/amber inline-style gradients (clear/partly-cloudy/cloudy/rain/snow/thunderstorm all warm-toned)
- Home.tsx hero logo — frosted glass pill (rgba white backdrop-blur) with `h-9 w-auto` logo at natural proportions, no forced square crop

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Premium Features

### AI Stylist
- Orange gradient card on the Home screen (below the main outfit section)
- POSTs to `POST /api/ai/stylist` on the API server
- Sends current weather data + all closet items (flattened from settings.closet) + style preference
- API route at `artifacts/api-server/src/routes/ai.ts` uses `@workspace/integrations-openai-ai-server` (gpt-5.1)
- Component: `artifacts/fit-check/src/components/AIStylistCard.tsx`

### Trip Planner
- Accessible from a dark "Trip Planner" card at the bottom of the Home screen
- Full page at `/trip` route — `artifacts/fit-check/src/pages/Trip.tsx`
- Uses `fetchTripForecast()` from `artifacts/fit-check/src/lib/weather.ts` (Open-Meteo API with start_date/end_date)
- Shows expandable day-by-day weather cards with outfit recommendations
- Generates a categorized packing list (tops/bottoms/layers/shoes/extras) from all trip days
- City search via `CitySearch` component with date range pickers

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
