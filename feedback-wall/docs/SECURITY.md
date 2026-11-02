# Security and Abuse Protection

The wall is public and anonymous, so every input is untrusted.

## Input validation

- All request bodies and query params are validated on the server with the shared Zod schemas. Client-side validation is for UX only.
- Strings are trimmed. Limits: `message` 1–280 chars, `author` ≤ 40 chars.
- `color` must be from the fixed palette. `rating`, if present, must be an integer 1–5.
- Express JSON body limit: `10kb`. Malformed or oversized JSON bodies return `400 VALIDATION_ERROR`.

## Output safety (XSS)

- Notes are always rendered as plain text through React, which escapes content.
- Never use `dangerouslySetInnerHTML`, never auto-link or parse HTML/Markdown in notes. `npm run lint` fails if `dangerouslySetInnerHTML` appears anywhere.

## Rate limiting

- `POST /api/feedback`: **5 requests per minute per IP** (`express-rate-limit`), counting invalid requests too. Exceeding it returns `429` with code `RATE_LIMITED`. Standard `RateLimit` / `RateLimit-Policy` headers are sent.
- Read endpoints are not rate limited for now.
- Express `trust proxy` comes from the `TRUST_PROXY` env var (default `0`). Set it to the number of proxies when deployed behind one so limits apply to real client IPs; leave it `0` otherwise, or clients could spoof `X-Forwarded-For` to dodge the limit.

## Headers

- `helmet()` is applied globally with default settings.
- CORS is not enabled: in development the Vite proxy is used, and in production the client is served from the same origin.

## Errors

- 500 responses never include stack traces or internal messages. Details are logged server-side only.

## Known gaps (accepted for now)

- No authentication, so no way to remove abusive notes except directly via a migration/script.
- No profanity or spam filtering.
- SSE connections are not capped per IP.

Revisit these if the wall is used publicly at scale.
