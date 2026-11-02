/** Single source of truth for limits and fixed values shared by client and server. */

export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 280;
export const AUTHOR_MAX_LENGTH = 40;
export const DEFAULT_AUTHOR = 'Anonymous';

/** Optional experience rating (1 = worst, 5 = best). */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const FEEDBACK_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'] as const;

export const PAGE_SIZE_DEFAULT = 50;
export const PAGE_SIZE_MAX = 100;

/** POST /api/feedback: max requests per IP per window. */
export const RATE_LIMIT_MAX_POSTS = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** SSE heartbeat interval. */
export const SSE_HEARTBEAT_MS = 25_000;
export const SSE_EVENT_FEEDBACK_CREATED = 'feedback.created';

export const JSON_BODY_LIMIT = '10kb';

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
