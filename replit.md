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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
