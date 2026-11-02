import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBroadcaster, formatSseEvent, type SseClient } from './broadcaster.js';

function fakeClient() {
  const writes: string[] = [];
  const client: SseClient & { writes: string[]; ended: boolean } = {
    writes,
    ended: false,
    write: (chunk) => (writes.push(chunk), true),
    end() {
      this.ended = true;
    },
  };
  return client;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('formatSseEvent', () => {
  it('formats an SSE event with JSON data', () => {
    expect(formatSseEvent('feedback.created', { id: 1 })).toBe(
      'event: feedback.created\ndata: {"id":1}\n\n',
    );
  });
});

describe('broadcaster', () => {
  it('sends events to every connected client and stops after removal', () => {
    const b = createBroadcaster();
    const a = fakeClient();
    const c = fakeClient();
    b.add(a);
    b.add(c);
    b.broadcast('x', 1);
    b.remove(a);
    b.broadcast('y', 2);

    expect(a.writes).toEqual(['event: x\ndata: 1\n\n']);
    expect(c.writes).toEqual(['event: x\ndata: 1\n\n', 'event: y\ndata: 2\n\n']);
    expect(b.size).toBe(1);
    b.closeAll();
  });

  it('sends heartbeat comments only while clients are connected', () => {
    vi.useFakeTimers();
    const b = createBroadcaster(1000);
    const a = fakeClient();
    b.add(a);
    vi.advanceTimersByTime(2500);
    expect(a.writes).toEqual([': ping\n\n', ': ping\n\n']);

    b.remove(a);
    vi.advanceTimersByTime(5000);
    expect(a.writes).toHaveLength(2);
  });

  it('drops clients whose write throws', () => {
    const b = createBroadcaster();
    b.add({
      write: () => {
        throw new Error('socket closed');
      },
      end: () => {},
    });
    b.broadcast('x', 1);
    expect(b.size).toBe(0);
  });

  it('closeAll ends every stream', () => {
    const b = createBroadcaster();
    const a = fakeClient();
    b.add(a);
    b.closeAll();
    expect(a.ended).toBe(true);
    expect(b.size).toBe(0);
  });
});
