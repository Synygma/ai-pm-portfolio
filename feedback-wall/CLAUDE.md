# CLAUDE.md — Feedback Wall

A public "digital sticky-note board": anyone can post a short feedback note, and everyone sees all notes appear live on a shared wall.

This file is the entry point for Claude Code. Detailed, authoritative project context lives in `/docs`. Read the relevant doc **before** working on an area, and keep the docs accurate (see "Keeping the docs up to date" below).

## Documentation map

| File                   | Read it when…                                                                |
| ---------------------- | ---------------------------------------------------------------------------- |
| `docs/PRODUCT.md`      | You need to know what the app does, current features, scope and non-goals    |
| `docs/TECH_STACK.md`   | You are adding/choosing a library or tool                                    |
| `docs/ARCHITECTURE.md` | You touch folder structure, data flow, real-time updates, or deployment      |
| `docs/API.md`          | You add or change any HTTP route, request/response shape, or SSE event       |
| `docs/DATABASE.md`     | You change the schema, queries, or migrations                                |
| `docs/SECURITY.md`     | You touch input handling, rate limiting, headers, or anything user-submitted |
| `docs/CONVENTIONS.md`  | You write code (naming, structure, error handling, testing)                  |
| `docs/decisions/`      | You are about to make, or revisit, a significant technical decision          |
| `docs/CHANGELOG.md`    | You want the history of features and notable changes                         |

Do not load every doc for every task. Read only what the task needs.

## Quick facts

- **Language:** TypeScript everywhere (strict mode).
- **Layout:** npm workspaces — `client/` (React + Vite + Tailwind), `server/` (Express), `shared/` (Zod schemas + types).
- **Database:** SQLite file at `server/data/feedback.db` via `better-sqlite3` + Drizzle ORM. WAL mode on. File is gitignored.
- **Real-time:** Server-Sent Events at `GET /api/feedback/stream`. No WebSockets.
- **Validation:** Zod schemas in `shared/` are the single source of truth for both client and server.

## Common commands

```bash
npm install            # install all workspaces
npm run dev            # run client (Vite) + server (tsx watch) together
npm run build          # build client and server
npm start              # run production server (serves built client)
npm test               # run Vitest across workspaces
npm run db:generate    # generate a migration from schema changes (drizzle-kit)
npm run db:migrate     # apply migrations
npm run lint           # ESLint
```

If these scripts don't exist yet, create them as described in `docs/ARCHITECTURE.md`.

## Ground rules

1. Never render user content as HTML. No `dangerouslySetInnerHTML` for notes.
2. All user input is validated on the server with the shared Zod schemas, even if the client already validated it.
3. Don't add a new dependency without checking `docs/TECH_STACK.md` first. If you add one, record it there.
4. Don't change the API contract silently. Update `docs/API.md` in the same change.
5. Schema changes always go through Drizzle migrations; never edit the `.db` file by hand.
6. Keep it simple. This is a small app; prefer the boring, obvious solution.

## Keeping the docs up to date

The docs must describe the app **as it currently is**. Update them only when a change is significant — not on every edit.

**Update the docs when a change:**

- Adds, removes, or meaningfully changes a user-facing feature → `PRODUCT.md` + `CHANGELOG.md`
- Adds, removes, or changes an API route, request/response shape, status code, or SSE event → `API.md`
- Changes the database schema or adds a migration → `DATABASE.md`
- Adds, removes, or swaps a library, tool, or service → `TECH_STACK.md`
- Changes folder structure, data flow, real-time mechanism, or deployment → `ARCHITECTURE.md`
- Changes validation limits, rate limits, or other protections → `SECURITY.md`
- Introduces a new coding pattern the rest of the code should follow → `CONVENTIONS.md`
- Is a drastic or hard-to-reverse decision (e.g. swapping SSE for WebSockets, adding auth, moving off SQLite) → add a new record in `docs/decisions/` **and** update the affected docs

**Do NOT update the docs for:**

- Bug fixes that don't change documented behavior
- Refactors, renames, or cleanup with no external effect
- Styling/visual tweaks, copy changes, and minor UI polish
- Adding or fixing tests
- Dependency patch/minor version bumps

**How to update:**

- Make doc updates in the same task as the code change, at the end, once the change works.
- Edit the existing section in place so the doc reads as current truth. Don't append "update:" notes.
- Add one short line to `docs/CHANGELOG.md` under `Unreleased` for features and notable changes.
- Keep docs concise. Remove information that is no longer true.
- At the end of the task, tell the user in one line which docs you updated (or that none needed updating).
- If unsure whether a change qualifies, ask the user rather than editing docs.
