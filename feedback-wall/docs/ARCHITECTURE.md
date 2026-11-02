# Architecture

## Folder structure

```
feedback-wall/
├── CLAUDE.md
├── package.json              # npm workspaces + root scripts
├── tsconfig.base.json        # strict TS settings extended by each workspace
├── eslint.config.js          # flat config (TS, React hooks, bans dangerouslySetInnerHTML)
├── .env.example              # documented environment variables
├── docs/                     # project context (this folder)
├── shared/                   # compiled to shared/dist (imported as @feedback-wall/shared)
│   └── src/
│       ├── index.ts          # re-exports
│       ├── schemas.ts        # Zod schemas (CreateFeedback, Feedback, etc.)
│       └── constants.ts      # limits, color palette, intervals, error codes
├── server/
│   ├── data/                 # feedback.db lives here (gitignored)
│   ├── drizzle/              # generated migrations (committed)
│   ├── drizzle.config.ts
│   └── src/
│       ├── index.ts          # app bootstrap, listens on PORT, graceful shutdown
│       ├── app.ts            # createApp({ db, broadcaster, ... }) — importable for tests
│       ├── config.ts         # env vars and resolved paths
│       ├── errors.ts         # AppError(code, status, message)
│       ├── db/
│       │   ├── client.ts     # better-sqlite3 + Drizzle setup, pragmas, runMigrations()
│       │   ├── schema.ts     # Drizzle table definitions
│       │   └── migrate.ts    # `npm run db:migrate` entry point
│       ├── routes/
│       │   └── feedback.ts   # GET list, POST create, GET stream
│       ├── services/
│       │   └── feedbackService.ts  # DB reads/writes, row → API mapping
│       ├── realtime/
│       │   └── broadcaster.ts      # tracks SSE clients, broadcasts events, heartbeat
│       ├── middleware/
│       │   ├── errorHandler.ts     # also the 404 handler
│       │   └── rateLimit.ts
│       └── test/
│           └── createTestApp.ts    # app on a migrated :memory: database
└── client/
    ├── index.html
    ├── vite.config.ts        # proxy /api -> http://localhost:3001, Vitest config
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css               # Tailwind entry + note animation
        ├── api/
        │   └── feedbackApi.ts      # fetch wrappers for REST endpoints, ApiError
        ├── hooks/
        │   ├── useFeedbackWall.ts  # initial load, pagination, SSE subscription
        │   └── useNow.ts           # ticking clock for relative times
        ├── lib/
        │   ├── mergeFeedback.ts    # dedupe-by-id merge, newest first
        │   ├── relativeTime.ts     # Intl.RelativeTimeFormat helper
        │   ├── ratings.ts          # emoji rating scale (values, emoji, labels)
        │   └── noteStyle.ts        # color classes, stable per-note tilt
        └── components/
            ├── FeedbackForm.tsx
            ├── RatingScale.tsx
            ├── FeedbackWall.tsx
            ├── FeedbackCard.tsx
            └── LiveIndicator.tsx
```

## Ports

- Client (Vite dev server): `5173`
- Server (Express): `3001` (from `PORT` env var)
- In production, only the Express server runs; it serves the API and the built client on one port (unknown non-API `GET`s return `index.html`).

## Build order

`shared` is compiled to `shared/dist` with `tsc`, and both `server` and `client` import that output. `npm run dev`, `npm run build` and `npm test` build `shared` first automatically; `npm run dev` also runs `shared` in `tsc --watch` and applies migrations before starting.

## Data flow

### Loading the wall

1. Client calls `GET /api/feedback?limit=50`.
2. Server reads newest notes from SQLite and returns them.
3. Client renders the cards, then opens the SSE stream.

### Posting a note

1. User submits the form. Client validates with the shared Zod schema.
2. Client sends `POST /api/feedback`.
3. Server applies rate limiting, validates again with Zod, inserts the row, and returns `201` with the created note.
4. Server's broadcaster sends a `feedback.created` event to **all** connected SSE clients (including the poster).
5. The poster's client also adds the note from the `201` response right away (deduped by `id` against the SSE event), so it appears even while the stream is reconnecting.

### Live updates

1. Client opens `EventSource('/api/feedback/stream')`.
2. On each `feedback.created` event, the hook prepends the note to the list, skipping it if a note with that `id` is already present (dedupe — the poster also receives its own note).
3. The server sends a heartbeat comment every 25 seconds to keep proxies from closing idle connections.
4. On disconnect, `EventSource` reconnects automatically (the server sends `retry: 3000`). Every time the stream opens — the first time and after each reconnect — the client refetches the latest page and merges by `id`, so notes posted between the initial load and the stream opening, or during an outage, aren't missed. If the browser gives up (stream closed for good), the hook creates a new `EventSource` after 5 seconds.

## Broadcaster

An in-memory `Set` of open SSE responses. Clients are added on connect and removed on `close`. This works because the app runs as a **single server process**. Running multiple instances would require a shared pub/sub (e.g. Redis) — record a decision if that ever happens.

## Configuration (environment variables)

| Variable        | Default              | Purpose                                                          |
| --------------- | -------------------- | ---------------------------------------------------------------- |
| `PORT`          | `3001`               | Server port                                                      |
| `DATABASE_PATH` | `./data/feedback.db` | SQLite file location (point at the mounted volume in production) |
| `NODE_ENV`      | `development`        | Enables static client serving in `production`                    |
| `TRUST_PROXY`   | `0`                  | Number of reverse proxies in front of the app (Express `trust proxy`) |

A relative `DATABASE_PATH` is resolved against the `server/` directory.

## Deployment

- Build: `npm run build` (client to `client/dist`, server to `server/dist`).
- Run: `npm run db:migrate && npm start` with `NODE_ENV=production`. (`db:migrate` uses `tsx`, so install dev dependencies on the build host.)
- Requires a persistent volume for `DATABASE_PATH`.
- If behind a reverse proxy, set `TRUST_PROXY=1` (or the number of proxies) so rate limiting sees real client IPs. The stream route sends `X-Accel-Buffering: no`; make sure the proxy doesn't buffer it.
- Serve over HTTPS: helmet's default CSP includes `upgrade-insecure-requests`.
