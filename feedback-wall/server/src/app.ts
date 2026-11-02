import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { JSON_BODY_LIMIT } from '@feedback-wall/shared';
import type { Db } from './db/client.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createBroadcaster, type Broadcaster } from './realtime/broadcaster.js';
import { createFeedbackRouter } from './routes/feedback.js';
import { createFeedbackService } from './services/feedbackService.js';

export interface AppOptions {
  db: Db;
  broadcaster?: Broadcaster;
  /** Number of trusted reverse proxies (0 = none). */
  trustProxy?: number;
  /** Directory of the built client to serve (production only). */
  clientDistDir?: string;
}

/** Builds the Express app without listening, so tests can import it. */
export function createApp({
  db,
  broadcaster = createBroadcaster(),
  trustProxy = 0,
  clientDistDir,
}: AppOptions): Express {
  const app = express();

  app.set('trust proxy', trustProxy);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(
    '/api/feedback',
    createFeedbackRouter({ service: createFeedbackService(db), broadcaster }),
  );
  app.use('/api', notFoundHandler);

  if (clientDistDir && existsSync(clientDistDir)) {
    const indexHtml = join(clientDistDir, 'index.html');
    app.use(express.static(clientDistDir, { index: false, maxAge: '1h' }));
    // SPA fallback: any other GET returns the app shell.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      res.sendFile(indexHtml);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
