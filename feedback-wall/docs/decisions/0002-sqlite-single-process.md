# 0002 — SQLite file + single server process

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The app is small, write volume is low (rate-limited posts), and we want zero external services.

## Decision

Store data in a single SQLite file (`better-sqlite3` + Drizzle, WAL mode) and run exactly **one** Express process. The SSE broadcaster is an in-memory `Set` of open connections.

## Consequences

- No database server to run; backups are a single file (use the SQLite backup API).
- Requires a host with a persistent disk; serverless platforms are not suitable.
- Cannot scale horizontally as-is: a second process would neither share the broadcaster nor safely share the file over a network disk. Scaling out would need a shared pub/sub (e.g. Redis) and likely a networked database — record a new decision if that happens.
