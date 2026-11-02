import { Router } from 'express';
import {
  CreateFeedbackSchema,
  ListFeedbackQuerySchema,
  SSE_EVENT_FEEDBACK_CREATED,
} from '@feedback-wall/shared';
import type { Broadcaster } from '../realtime/broadcaster.js';
import type { FeedbackService } from '../services/feedbackService.js';
import { createPostRateLimiter } from '../middleware/rateLimit.js';

interface FeedbackRouterDeps {
  service: FeedbackService;
  broadcaster: Broadcaster;
}

export function createFeedbackRouter({ service, broadcaster }: FeedbackRouterDeps): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const query = ListFeedbackQuerySchema.parse(req.query);
    res.json(service.list(query));
  });

  router.post('/', createPostRateLimiter(), (req, res) => {
    const input = CreateFeedbackSchema.parse(req.body ?? {});
    const created = service.create(input);
    broadcaster.broadcast(SSE_EVENT_FEEDBACK_CREATED, created);
    res.status(201).json(created);
  });

  router.get('/stream', (req, res) => {
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    // Tell EventSource how long to wait before reconnecting.
    res.write('retry: 3000\n\n');

    broadcaster.add(res);
    req.on('close', () => broadcaster.remove(res));
  });

  return router;
}
