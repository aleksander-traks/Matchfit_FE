import { AppError, type RecoverySuggestion } from './AppError';

export class ApiError extends AppError {
  public readonly statusCode: number;
  public readonly responseBody?: any;

  constructor({
    code,
    message,
    userMessage,
    statusCode,
    responseBody,
    isRetryable = false,
    recoverySuggestions = [],
    metadata = {},
  }: {
    code: string;
    message: string;
    userMessage: string;
    statusCode: number;
    responseBody?: any;
    isRetryable?: boolean;
    recoverySuggestions?: RecoverySuggestion[];
    metadata?: any;
  }) {
    super({
      code,
      message,
      userMessage,
      severity: statusCode >= 500 ? 'error' : 'warning',
      source: 'server',
      isRetryable,
      recoverySuggestions,
      metadata: { ...metadata, statusCode, responseBody },
    });
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(response: Response, responseBody?: any): ApiError {
    const statusCode = response.status;

    switch (statusCode) {
      case 400:
        return new ApiError({
          code: 'API-001',
          message: `Bad Request: ${JSON.stringify(responseBody)}`,
          userMessage: 'The request contains invalid data. Please check your inputs.',
          statusCode,
          responseBody,
          isRetryable: false,
        });

      case 401:
        return new ApiError({
          code: 'API-002',
          message: 'Unauthorized: Authentication failed',
          userMessage: 'Authentication failed. Please contact support.',
          statusCode,
          responseBody,
          isRetryable: false,
        });

      case 429:
        const retryAfter = response.headers.get('Retry-After');
        return new ApiError({
          code: 'API-003',
          message: 'Too many requests',
          userMessage: 'Too many requests. Please wait a moment before trying again.',
          statusCode,
          responseBody,
          isRetryable: true,
          recoverySuggestions: [
            {
              action: `Wait ${retryAfter || '60'} seconds`,
              description: 'Rate limit will reset automatically',
              automated: true,
            },
          ],
          metadata: { retryAfter },
        });

      case 500:
        return new ApiError({
          code: 'API-004',
          message: 'Internal Server Error',
          userMessage: 'Our server encountered an error. We have been notified and are working on it.',
          statusCode,
          responseBody,
          isRetryable: true,
        });

      case 503:
        return new ApiError({
          code: 'API-005',
          message: 'Service Unavailable',
          userMessage: 'The service is temporarily unavailable. Please try again in a moment.',
          statusCode,
          responseBody,
          isRetryable: true,
        });

      case 504:
        return new ApiError({
          code: 'API-006',
          message: 'Gateway Timeout',
          userMessage: 'The server took too long to respond. Please try again.',
          statusCode,
          responseBody,
          isRetryable: true,
        });

      default:
        return new ApiError({
          code: 'API-000',
          message: `HTTP ${statusCode}: ${response.statusText}`,
          userMessage: `An error occurred (${statusCode}). Please try again.`,
          statusCode,
          responseBody,
          isRetryable: statusCode >= 500,
        });
    }
  }
}
