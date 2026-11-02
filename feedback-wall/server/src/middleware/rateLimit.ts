import { rateLimit } from 'express-rate-limit';
import { ERROR_CODES, RATE_LIMIT_MAX_POSTS, RATE_LIMIT_WINDOW_MS } from '@feedback-wall/shared';
import { AppError } from '../errors.js';

/** Limits note creation per client IP. Create one per app so tests get a fresh store. */
export function createPostRateLimiter() {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX_POSTS,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new AppError(
          ERROR_CODES.RATE_LIMITED,
          429,
          "You're posting too fast, try again in a minute.",
        ),
      );
    },
  });
}
