# API

Base path: `/api`. All request and response bodies are JSON. The request and response shapes are defined as Zod schemas in `shared/src/schemas.ts` — that file and this doc must stay in sync.

## Data shape: Feedback

```json
{
  "id": 42,
  "message": "Loved the session!",
  "author": "Priya",
  "color": "yellow",
  "rating": 5,
  "createdAt": "2026-11-02T10:15:30.000Z"
}
```

- `author` is `"Anonymous"` when not provided.
- `color` is one of: `yellow`, `pink`, `blue`, `green`, `purple`, `orange`.
- `rating` is an integer `1`–`5` (1 = Bored … 5 = Very nice), or `null` when not given.
- `createdAt` is an ISO 8601 UTC string.

## Endpoints

### `GET /api/health`

Liveness check. Returns `200 { "status": "ok" }`.

### `GET /api/feedback`

List notes, newest first, with cursor pagination.

Query params:

| Param    | Type    | Default | Notes                                                    |
| -------- | ------- | ------- | -------------------------------------------------------- |
| `limit`  | integer | `50`    | 1–100                                                    |
| `before` | integer | —       | Return notes with `id` less than this (for "load older") |

Response `200`:

```json
{
  "items": [/* Feedback[] */],
  "nextCursor": 17
}
```

`nextCursor` is the smallest `id` in `items`, or `null` when there are no older notes.

### `POST /api/feedback`

Create a note.

Request body:

```json
{
  "message": "Loved the session!",
  "author": "Priya",
  "color": "yellow",
  "rating": 5
}
```

| Field     | Required | Rules                                               |
| --------- | -------- | --------------------------------------------------- |
| `message` | yes      | Trimmed, 1–280 characters                           |
| `author`  | no       | Trimmed, up to 40 characters; empty → `"Anonymous"` |
| `color`   | no       | One of the palette values; random if omitted        |
| `rating`  | no       | Integer 1–5; stored as `null` if omitted            |

Responses:

- `201` — the created `Feedback` object.
- `400` — validation error.
- `429` — rate limit exceeded.

### `GET /api/feedback/stream`

Server-Sent Events stream (`Content-Type: text/event-stream`).

On connect the server sends a reconnect hint (`retry: 3000`). Events:

```
event: feedback.created
data: { /* Feedback */ }
```

Heartbeat (comment line, ignored by `EventSource`) every 25 seconds:

```
: ping
```

## Errors

All errors use one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message must be 280 characters or fewer.",
    "details": { "fieldErrors": { "message": ["..."] } }
  }
}
```

| Status | `code`                                         |
| ------ | ---------------------------------------------- |
| 400    | `VALIDATION_ERROR` (also malformed/oversized JSON) |
| 404    | `NOT_FOUND`                                    |
| 429    | `RATE_LIMITED`                                 |
| 500    | `INTERNAL_ERROR` (no internal details exposed) |
