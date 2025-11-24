import { AppError } from './AppError';
import { NetworkError } from './NetworkError';
import { ApiError } from './ApiError';
import { OpenAIError } from './OpenAIError';

export interface ErrorContext {
  userAction?: string;
  pageUrl?: string;
  componentName?: string;
  additionalData?: Record<string, any>;
}

export class ErrorFactory {
  static fromFetchError(error: any, url: string, context?: ErrorContext): AppError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (error.name === 'AbortError') {
      return NetworkError.aborted();
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return NetworkError.timeout(30000, url);
    }

    if (errorMessage.includes('Failed to fetch')) {
      if (!navigator.onLine) {
        return NetworkError.offline();
      }
      return NetworkError.serverUnreachable(url);
    }

    if (errorMessage.includes('NetworkError') || errorMessage.includes('network')) {
      return NetworkError.serverUnreachable(url);
    }

    if (errorMessage.includes('CORS')) {
      return NetworkError.corsError(url);
    }

    return new AppError({
      code: 'NET-000',
      message: `Network error: ${errorMessage}`,
      userMessage: 'A network error occurred. Please check your connection and try again.',
      source: 'network',
      isRetryable: true,
      metadata: { url, originalError: error, ...context },
    });
  }

  static async fromResponse(response: Response, context?: ErrorContext): Promise<AppError> {
    let responseBody;
    try {
      const text = await response.text();
      responseBody = text ? JSON.parse(text) : null;
    } catch {
      responseBody = null;
    }

    if (responseBody?.error && typeof responseBody.error === 'object') {
      if (responseBody.error.code?.startsWith('AI-')) {
        return OpenAIError.fromOpenAIError(responseBody.error);
      }
    }

    return ApiError.fromResponse(response, responseBody);
  }

  static fromOpenAI(error: any, context?: ErrorContext): OpenAIError {
    return OpenAIError.fromOpenAIError(error);
  }

  static fromUnknown(error: any, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';

    return new AppError({
      code: 'APP-000',
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      severity: 'error',
      source: 'client',
      isRetryable: true,
      metadata: { originalError: error, ...context },
    });
  }

  static validationError(field: string, issue: string): AppError {
    return new AppError({
      code: 'VAL-001',
      message: `Validation error on ${field}: ${issue}`,
      userMessage: `Please check the ${field} field: ${issue}`,
      severity: 'warning',
      source: 'client',
      isRetryable: false,
      recoverySuggestions: [
        { action: 'Review your input', description: `Check the ${field} field and make corrections` },
      ],
      metadata: { field, issue },
    });
  }

  static databaseError(operation: string, details: string): AppError {
    return new AppError({
      code: 'DB-001',
      message: `Database error during ${operation}: ${details}`,
      userMessage: 'A database error occurred. Please try again.',
      severity: 'error',
      source: 'database',
      isRetryable: true,
      metadata: { operation, details },
    });
  }
}
