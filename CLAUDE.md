# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm. There is no test suite.

- `pnpm build` — wipes `dist/` then runs tsup (CJS + ESM + `.d.ts`)
- `pnpm dev` — `tsup --watch`
- `pnpm typecheck` — `tsc --noEmit` (also runs in `prepublishOnly`)
- `pnpm lint` — `eslint src`

## What this is

A published npm library (`healthya-pharmacy-analytics`) consumed by a Next.js + Sanity Studio app. It has no app of its own; to see changes working, build and link/install it into a consumer. The README still refers to the old name `@healthya-team/pharmacy-analytics`; the real package name is in `package.json`.

## Architecture

Four entry points, each built for a different runtime (see `tsup.config.ts` and `exports` in `package.json`):

- `src/index.ts` — types only (`export type *` from the three below). Runtime code must be imported from a subpath.
- `src/client` → `/client` — browser tracking (GA4 script, Mixpanel init, `AnalyticsProvider` route tracker, typed event trackers in `analytics.ts`). Built in its own tsup config with a `"use client"` banner because the bundler drops per-file directives.
- `src/server/index.ts` → `/server` — one large file (~1300 lines). `createAnalyticsApiHandler(config)` returns `GET/POST/OPTIONS` for a single Next.js App Router route; default `GET/POST/OPTIONS` are exported too. Requests are dispatched on the `mode` query param (`search-console`, `event-params`, `condition-values`, `top-entities`, `event-count`, etc.); no mode means the GA4 multi-report. Handles CORS via `corsOrigin`.
- `src/studio` → `/studio` — Sanity Studio plugin and `PharmacyAnalyticsDashboard` React component. `UnifiedDashboard.tsx` is the tab switcher (All / Analytics / Custom Analytics / Search Console); `tabs/`, `funnel/`, `search-console/` hold the views.

### Data flow

Dashboard (studio) → fetch helpers (`utils-ga-api.ts`, `utils-mixpanel-api.ts`, `search-console/sc-api.ts`) → the consumer's `/api/analytics` route (server entry) → Google APIs. The server uses a single Google service account (`GA_SERVICE_ACCOUNT_EMAIL` + `GA_PRIVATE_KEY`, PKCS#8) to sign RS256 JWTs with `jose`, caching tokens in memory per `email:scope` for both the GA4 Data API and Search Console. `studio/sanity-client-shim.ts` queries Sanity via plain `fetch` (reads `SANITY_STUDIO_*` / `NEXT_PUBLIC_SANITY_*` env) to avoid a `@sanity/client` dependency.

## Conventions and gotchas

- `react`, `react-dom`, `next`, `sanity` are peer deps and marked `external` in tsup; don't add them to `dependencies`. `next` and `sanity` are optional peers, so keep imports of them confined to the entry that needs them.
- Publishing goes to the public npm registry (`publishConfig`). Version bumps are done manually in `package.json`; a stray `healthya-team-pharmacy-analytics-1.0.0.tgz` in the repo root is an old pack artifact.
