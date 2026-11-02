# Tech Stack

Only use libraries listed here. To add, remove, or replace one, update this file in the same change (and add a decision record in `docs/decisions/` if it is a major swap).

## Overview

| Layer            | Choice                                                   |
| ---------------- | -------------------------------------------------------- |
| Language         | TypeScript (strict)                                      |
| Runtime          | Node.js (current LTS)                                    |
| Frontend         | React + Vite                                             |
| Styling          | Tailwind CSS                                             |
| Backend          | Express                                                  |
| Real-time        | Server-Sent Events (native `EventSource` in the browser) |
| Database         | SQLite (single file)                                     |
| DB driver        | `better-sqlite3`                                         |
| ORM / migrations | Drizzle ORM + `drizzle-kit`                              |
| Validation       | Zod (shared between client and server)                   |
| Testing          | Vitest + Supertest                                       |
| Repo layout      | npm workspaces (`client`, `server`, `shared`)            |

## Frontend (`client/`)

- **react, react-dom** — UI.
- **vite, @vitejs/plugin-react** — dev server and build. The Vite dev proxy forwards `/api` to the Express server, so no CORS setup is needed in development.
- **tailwindcss, @tailwindcss/vite** — styling for the sticky-note cards and layout (Tailwind v4, configured in CSS via `@import 'tailwindcss'` and `@theme`; no `tailwind.config` file).
- **@fontsource-variable/montserrat** — self-hosted UI font (no third-party font requests).
- **State:** plain React state + custom hooks (`useFeedbackWall`). No Redux/Zustand. TanStack Query may be added later if caching needs grow.
- **Time formatting:** `Intl.RelativeTimeFormat` (built-in). No date library.

## Backend (`server/`)

- **express** (v5) — HTTP server and routing. v5 forwards errors thrown in async handlers to the error handler.
- **tsx** — runs TypeScript directly in development (`tsx watch`).
- **helmet** — security headers.
- **express-rate-limit** — limits POST requests per IP.
- **better-sqlite3** — synchronous SQLite driver.
- **drizzle-orm, drizzle-kit** — typed schema, queries, and migrations.
- In production, Express also serves the built client from `client/dist`.

## Shared (`shared/`)

- **zod** (v4) — request schemas and inferred TypeScript types used by both client and server. The server also depends on `zod` directly (to format `ZodError`s).

## Tooling

- **typescript** — compiles `shared` and `server`; type-checks `client`.
- **concurrently** — runs shared (watch), client and server together via `npm run dev`.
- **eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals** — linting (flat config in `eslint.config.js`).
- **prettier** — formatting.
- **vitest** — unit tests (client and server). Client tests cover pure functions only (no DOM testing library yet).
- **supertest** — API route tests.

## Why these choices (short)

- **SSE over WebSockets:** updates only flow server → browser; posting uses normal POST. SSE is plain HTTP, auto-reconnects, needs no extra library.
- **React + Vite over Next.js:** a long-lived server with a local SQLite file and an open SSE connection fits a plain Node server better than serverless-style deployments.
- **better-sqlite3 + Drizzle:** fast, simple, typed, and migrations are versioned in the repo.

## Hosting requirement

SQLite needs a **persistent disk**. Deploy to a host with a mounted volume (e.g. Railway, Fly.io, Render with a disk) or a VPS. Serverless platforms (Vercel/Netlify functions) are not suitable for the backend.
