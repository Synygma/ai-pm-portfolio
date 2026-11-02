import { SSE_HEARTBEAT_MS } from '@feedback-wall/shared';

/** The subset of an HTTP response the broadcaster needs (easy to fake in tests). */
export interface SseClient {
  write(chunk: string): boolean;
  end(): void;
}

export function formatSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Tracks open SSE connections in memory and pushes events to all of them.
 * Works because the app runs as a single process (see docs/ARCHITECTURE.md).
 */
export function createBroadcaster(heartbeatMs: number = SSE_HEARTBEAT_MS) {
  const clients = new Set<SseClient>();
  let heartbeat: NodeJS.Timeout | null = null;

  function writeAll(chunk: string): void {
    for (const client of clients) {
      try {
        client.write(chunk);
      } catch {
        clients.delete(client);
      }
    }
  }

  function startHeartbeat(): void {
    if (heartbeat) return;
    heartbeat = setInterval(() => writeAll(': ping\n\n'), heartbeatMs);
    heartbeat.unref();
  }

  function stopHeartbeat(): void {
    if (!heartbeat) return;
    clearInterval(heartbeat);
    heartbeat = null;
  }

  return {
    add(client: SseClient): void {
      clients.add(client);
      startHeartbeat();
    },

    remove(client: SseClient): void {
      clients.delete(client);
      if (clients.size === 0) stopHeartbeat();
    },

    broadcast(event: string, data: unknown): void {
      writeAll(formatSseEvent(event, data));
    },

    get size(): number {
      return clients.size;
    },

    /** Ends every open stream (used on shutdown). */
    closeAll(): void {
      for (const client of clients) client.end();
      clients.clear();
      stopHeartbeat();
    },
  };
}

export type Broadcaster = ReturnType<typeof createBroadcaster>;
