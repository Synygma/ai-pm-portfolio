# Coding Conventions

## General

- TypeScript strict mode everywhere. Avoid `any`; use `unknown` and narrow.
- Prefer small, single-purpose functions and files.
- Use named exports (except where a framework requires a default export).
- Constants (limits, palette, intervals) live in `shared/src/constants.ts`. No magic numbers in components or routes.

## Naming

- Files: React components `PascalCase.tsx`; everything else `camelCase.ts`.
- Database columns: `snake_case`. API/TypeScript fields: `camelCase`. Map between them in the service layer.
- Domain term in code is `feedback` (one note = one feedback item).

## Shared schemas

- Define request/response shapes once in `shared/src/schemas.ts` with Zod and infer types with `z.infer`. Don't redeclare these types elsewhere.

## Server

- Layering: **route** (HTTP parsing, status codes) → **service** (business logic + DB) → **db** (Drizzle).
- Routes don't query the database directly.
- Throw typed errors (e.g. `AppError(code, status, message)`) and let `errorHandler` format the response per `docs/API.md`.
- `app.ts` builds the app without listening so tests can import it.

## Client

- Data fetching lives in `src/api/`; components don't call `fetch` directly.
- Wall state (loading, pagination, SSE) lives in `useFeedbackWall`; components stay presentational where possible.
- Always dedupe notes by `id` when merging SSE events and fetched pages.
- Accessible markup: labeled form inputs, visible focus states, sufficient color contrast on every note color.

## Testing

- Vitest for unit tests; Supertest for API routes using an in-memory SQLite database (`:memory:`).
- Every API route has tests for the success case and main error cases.
- Test files sit next to the code: `thing.test.ts`.

## Git

- Small, focused commits with clear messages (e.g. `feat: add load-older pagination`, `fix: dedupe SSE notes`).
