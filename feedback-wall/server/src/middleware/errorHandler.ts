import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { ERROR_CODES, type ErrorResponse } from '@feedback-wall/shared';
import { AppError } from '../errors.js';

function hasType(err: unknown): err is { type: string } {
  return (
    typeof err === 'object' && err !== null && typeof (err as { type?: unknown }).type === 'string'
  );
}

function toAppError(err: unknown): AppError | null {
  if (err instanceof AppError) return err;

  if (err instanceof z.ZodError) {
    const { fieldErrors } = z.flattenError(err);
    const message = err.issues[0]?.message ?? 'Invalid request.';
    return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, message, {
      fieldErrors: fieldErrors as Record<string, string[]>,
    });
  }

  // Errors raised by express.json()
  if (hasType(err)) {
    if (err.type === 'entity.parse.failed') {
      return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body must be valid JSON.');
    }
    if (err.type === 'entity.too.large') {
      return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is too large.');
    }
  }

  return null;
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(ERROR_CODES.NOT_FOUND, 404, 'Not found.'));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);
  let body: ErrorResponse;
  let status: number;

  if (appError) {
    status = appError.status;
    body = { error: { code: appError.code, message: appError.message } };
    if (appError.details) body.error.details = appError.details;
  } else {
    console.error('Unhandled error:', err);
    status = 500;
    body = { error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong.' } };
  }

  res.status(status).json(body);
};
