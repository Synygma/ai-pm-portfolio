# 0001 — Server-Sent Events instead of WebSockets

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The wall needs to push new notes to every open browser. Data only flows server → browser; posting a note is a normal `POST`.

## Decision

Use Server-Sent Events at `GET /api/feedback/stream`, consumed with the browser's native `EventSource`. Clients send nothing over the stream.

## Consequences

- Plain HTTP: works through the Vite proxy and typical reverse proxies (with buffering off), no extra library on either side.
- Browsers reconnect automatically; the client refetches the latest page on every (re)connect to fill gaps.
- A heartbeat comment every 25 s keeps idle connections alive.
- If bidirectional features (typing indicators, presence) are ever needed, revisit this and record a new decision.
