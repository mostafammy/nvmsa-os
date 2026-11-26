import { hc } from 'hono/client';
import type { AppType } from '@server/index';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

interface ServerErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    requestId?: string;
  };
}

export async function parseApiError(res: Response, fallbackMessage: string): Promise<ApiRequestError> {
  try {
    const body = (await res.json()) as ServerErrorEnvelope;
    return new ApiRequestError(
      body.error?.message ?? fallbackMessage,
      res.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.details,
      body.error?.requestId,
    );
  } catch {
    return new ApiRequestError(fallbackMessage, res.status, 'API_ERROR');
  }
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export const apiClient = hc<AppType>('/');
