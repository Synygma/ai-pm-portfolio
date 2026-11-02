import {
  ErrorResponseSchema,
  FeedbackSchema,
  ListFeedbackResponseSchema,
  type CreateFeedbackInput,
  type ErrorCode,
  type Feedback,
  type ListFeedbackResponse,
} from '@feedback-wall/shared';

const API_BASE = '/api';
export const FEEDBACK_STREAM_URL = `${API_BASE}/feedback/stream`;

/** An error returned by the API (or a network failure, with code `NETWORK_ERROR`). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ErrorResponseSchema.safeParse(body);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiError(res.status, code, message, details?.fieldErrors);
    }
    throw new ApiError(res.status, 'INTERNAL_ERROR', 'Something went wrong.');
  }
  return body;
}

export async function listFeedback(
  params: {
    limit?: number;
    before?: number;
  } = {},
): Promise<ListFeedbackResponse> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.before !== undefined) search.set('before', String(params.before));
  const query = search.size > 0 ? `?${search}` : '';
  return ListFeedbackResponseSchema.parse(await request(`/feedback${query}`));
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  const body = await request('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return FeedbackSchema.parse(body);
}
