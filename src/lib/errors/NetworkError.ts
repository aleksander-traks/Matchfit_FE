import { AppError, type RecoverySuggestion } from './AppError';

export class NetworkError extends AppError {
  constructor({
    code,
    message,
    userMessage,
    isRetryable = true,
    recoverySuggestions = [],
    metadata = {},
  }: {
    code: string;
    message: string;
    userMessage: string;
    isRetryable?: boolean;
    recoverySuggestions?: RecoverySuggestion[];
    metadata?: any;
  }) {
    super({
      code,
      message,
      userMessage,
      severity: 'error',
      source: 'network',
      isRetryable,
      recoverySuggestions: [
        { action: 'Check your internet connection', description: 'Ensure you are connected to the internet' },
        { action: 'Wait a moment and try again', description: 'The service may be temporarily unavailable', automated: true },
        ...recoverySuggestions,
      ],
      metadata,
    });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  static timeout(timeoutMs: number, url: string): NetworkError {
    return new NetworkError({
      code: 'NET-001',
      message: `Request to ${url} timed out after ${timeoutMs}ms`,
      userMessage: 'The request took too long. Our service might be starting up or experiencing high traffic.',
      metadata: { timeoutMs, url },
    });
  }

  static offline(): NetworkError {
    return new NetworkError({
      code: 'NET-003',
      message: 'Network unavailable',
      userMessage: 'You appear to be offline. Please check your internet connection.',
      isRetryable: false,
      metadata: { online: navigator.onLine },
    });
  }

  static serverUnreachable(url: string): NetworkError {
    return new NetworkError({
      code: 'NET-002',
      message: `Unable to reach server at ${url}`,
      userMessage: 'We cannot connect to our servers. They may be down for maintenance.',
      metadata: { url },
    });
  }

  static aborted(): NetworkError {
    return new NetworkError({
      code: 'NET-005',
      message: 'Request was aborted',
      userMessage: 'The request was cancelled.',
      isRetryable: false,
    });
  }

  static corsError(url: string): NetworkError {
    return new NetworkError({
      code: 'NET-004',
      message: `CORS policy blocked request to ${url}`,
      userMessage: 'A security policy is blocking the request. Please contact support.',
      isRetryable: false,
      metadata: { url },
    });
  }
}
