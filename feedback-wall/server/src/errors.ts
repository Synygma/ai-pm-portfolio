import type { ErrorCode } from '@feedback-wall/shared';

export interface AppErrorDetails {
  fieldErrors?: Record<string, string[]>;
}

/** An expected error with a stable API code. Formatted by `errorHandler`. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly details?: AppErrorDetails,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
