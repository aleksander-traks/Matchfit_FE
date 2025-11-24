import type { AppError } from './AppError';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrorCodes: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrorCodes: [
    'NET-001',
    'NET-002',
    'API-003',
    'API-004',
    'API-005',
    'API-006',
    'AI-002',
    'AI-005',
    'AI-006',
  ],
};

export class RetryStrategy {
  private attempts: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();

  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  shouldRetry(error: AppError, operationId: string): boolean {
    if (!error.isRetryable) {
      return false;
    }

    if (!this.config.retryableErrorCodes.includes(error.code)) {
      return false;
    }

    const attempts = this.attempts.get(operationId) || 0;
    if (attempts >= this.config.maxAttempts) {
      return false;
    }

    const now = Date.now();
    const lastAttempt = this.lastAttempt.get(operationId) || 0;
    const timeSinceLastAttempt = now - lastAttempt;
    const requiredDelay = this.calculateDelay(attempts);

    if (timeSinceLastAttempt < requiredDelay) {
      return false;
    }

    return true;
  }

  calculateDelay(attemptNumber: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.config.maxDelay);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    onRetry?: (attempt: number, delay: number, error: AppError) => void
  ): Promise<T> {
    let lastError: AppError | null = null;

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        this.lastAttempt.set(operationId, Date.now());
        this.attempts.set(operationId, attempt);

        const result = await operation();

        this.clearAttempts(operationId);
        return result;
      } catch (error: any) {
        lastError = error as AppError;

        if (attempt < this.config.maxAttempts - 1 && this.shouldRetry(lastError, operationId)) {
          const delay = this.calculateDelay(attempt);

          if (onRetry) {
            onRetry(attempt + 1, delay, lastError);
          }

          await this.delay(delay);
        } else {
          break;
        }
      }
    }

    this.clearAttempts(operationId);
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAttemptCount(operationId: string): number {
    return this.attempts.get(operationId) || 0;
  }

  clearAttempts(operationId: string): void {
    this.attempts.delete(operationId);
    this.lastAttempt.delete(operationId);
  }

  reset(): void {
    this.attempts.clear();
    this.lastAttempt.clear();
  }
}

export const defaultRetryStrategy = new RetryStrategy();
