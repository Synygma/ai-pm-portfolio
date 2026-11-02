import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHOR,
  FEEDBACK_COLORS,
  FeedbackSchema,
  ListFeedbackResponseSchema,
  RATE_LIMIT_MAX_POSTS,
} from '@feedback-wall/shared';
import { createTestApp } from '../test/createTestApp.js';

let current: ReturnType<typeof createTestApp> | null = null;
let server: Server | null = null;

function setup() {
  current = createTestApp();
  return current;
}

afterEach(async () => {
  if (server) {
    current?.broadcaster.closeAll();
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = null;
  }
  current?.sqlite.close();
  current = null;
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/feedback', () => {
  it('creates a note and returns 201 with the Feedback shape', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/feedback')
      .send({ message: '  Loved the session!  ', author: ' Priya ', color: 'pink' });

    expect(res.status).toBe(201);
    const note = FeedbackSchema.parse(res.body);
    expect(note).toMatchObject({ message: 'Loved the session!', author: 'Priya', color: 'pink' });
    expect(new Date(note.createdAt).toISOString()).toBe(note.createdAt);
  });

  it('defaults author to Anonymous and assigns a palette color', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/feedback').send({ message: 'Hi', author: '   ' });

    expect(res.status).toBe(201);
    expect(res.body.author).toBe(DEFAULT_AUTHOR);
    expect(FEEDBACK_COLORS).toContain(res.body.color);
  });

  it('rejects a message over 280 characters', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/feedback')
      .send({ message: 'x'.repeat(281) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Message must be 280 characters or fewer.');
    expect(res.body.error.details.fieldErrors.message).toHaveLength(1);
  });

  it('rejects a whitespace-only message', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/feedback').send({ message: '    ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing message', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/feedback').send({ author: 'Priya' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.message).toBeDefined();
  });

  it('rejects an author over 40 characters', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/feedback')
      .send({ message: 'Hi', author: 'a'.repeat(41) });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.author).toBeDefined();
  });

  it('rejects a color outside the palette', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/feedback').send({ message: 'Hi', color: 'red' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.color).toBeDefined();
  });

  it('rejects malformed JSON', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/feedback')
      .set('Content-Type', 'application/json')
      .send('{"message":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('stores the message as plain text, unmodified', async () => {
    const { app } = setup();
    const message = '<script>alert(1)</script>';
    await request(app).post('/api/feedback').send({ message });
    const res = await request(app).get('/api/feedback');
    expect(res.body.items[0].message).toBe(message);
  });

  it('stores an optional rating and defaults it to null', async () => {
    const { app } = setup();
    const rated = await request(app).post('/api/feedback').send({ message: 'Great', rating: 5 });
    expect(rated.status).toBe(201);
    expect(rated.body.rating).toBe(5);

    const unrated = await request(app).post('/api/feedback').send({ message: 'No rating' });
    expect(unrated.body.rating).toBeNull();

    const list = await request(app).get('/api/feedback');
    expect(list.body.items.map((n: { rating: number | null }) => n.rating)).toEqual([null, 5]);
  });

  it.each([0, 6, 2.5, '3', null])('rejects rating=%s', async (rating) => {
    const { app } = setup();
    const res = await request(app).post('/api/feedback').send({ message: 'Hi', rating });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.rating).toBeDefined();
  });

  it('round-trips unicode and emoji', async () => {
    const { app } = setup();
    const message = 'Merci beaucoup! 🙏☕ नमस्ते';
    const res = await request(app).post('/api/feedback').send({ message, author: 'Zoë' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ message, author: 'Zoë' });
  });

  it(`returns 429 after ${RATE_LIMIT_MAX_POSTS} posts in a minute`, async () => {
    const { app } = setup();
    for (let i = 0; i < RATE_LIMIT_MAX_POSTS; i++) {
      const ok = await request(app)
        .post('/api/feedback')
        .send({ message: `note ${i}` });
      expect(ok.status).toBe(201);
    }
    const res = await request(app).post('/api/feedback').send({ message: 'one too many' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('broadcasts feedback.created to SSE clients', async () => {
    const { app, broadcaster } = setup();
    const writes: string[] = [];
    broadcaster.add({ write: (chunk) => (writes.push(chunk), true), end: () => {} });

    const res = await request(app).post('/api/feedback').send({ message: 'Live!' });

    expect(writes).toEqual([`event: feedback.created\ndata: ${JSON.stringify(res.body)}\n\n`]);
  });
});

describe('GET /api/feedback', () => {
  it('returns an empty list with a null cursor', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/feedback');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], nextCursor: null });
  });

  it('returns notes newest first and paginates with before/nextCursor', async () => {
    const { app } = setup();
    // 5 posts fit within the per-minute rate limit.
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/feedback')
        .send({ message: `note ${i}` });
    }

    const page1 = await request(app).get('/api/feedback?limit=2');
    const body1 = ListFeedbackResponseSchema.parse(page1.body);
    expect(body1.items.map((n) => n.message)).toEqual(['note 5', 'note 4']);
    expect(body1.nextCursor).toBe(body1.items[1]?.id);

    const page2 = await request(app).get(`/api/feedback?limit=2&before=${body1.nextCursor}`);
    const body2 = ListFeedbackResponseSchema.parse(page2.body);
    expect(body2.items.map((n) => n.message)).toEqual(['note 3', 'note 2']);

    const page3 = await request(app).get(`/api/feedback?limit=2&before=${body2.nextCursor}`);
    const body3 = ListFeedbackResponseSchema.parse(page3.body);
    expect(body3.items.map((n) => n.message)).toEqual(['note 1']);
    expect(body3.nextCursor).toBeNull();
  });

  it('returns a null cursor when the page exactly fits the remaining notes', async () => {
    const { app } = setup();
    await request(app).post('/api/feedback').send({ message: 'a' });
    await request(app).post('/api/feedback').send({ message: 'b' });
    const res = await request(app).get('/api/feedback?limit=2');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.nextCursor).toBeNull();
  });

  it.each(['0', '101', 'abc', '1.5'])('rejects limit=%s', async (limit) => {
    const { app } = setup();
    const res = await request(app).get(`/api/feedback?limit=${limit}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid before cursor', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/feedback?before=-3');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/feedback/stream', () => {
  it('streams feedback.created events over SSE', async () => {
    const { app, broadcaster } = setup();
    server = app.listen(0);
    await new Promise<void>((resolve) => server?.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    const controller = new AbortController();
    const streamRes = await fetch(`${base}/api/feedback/stream`, { signal: controller.signal });
    expect(streamRes.headers.get('content-type')).toContain('text/event-stream');

    // Wait until the server has registered the client.
    while (broadcaster.size === 0) await new Promise((r) => setTimeout(r, 5));

    await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Over the wire' }),
    });

    const reader = streamRes.body!.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (!text.includes('event: feedback.created')) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    controller.abort();

    expect(text).toContain('event: feedback.created');
    expect(text).toContain('"message":"Over the wire"');
  });
});

describe('unknown API routes', () => {
  it('returns 404 NOT_FOUND', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });
});
