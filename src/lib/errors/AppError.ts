export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorSource = 'client' | 'server' | 'openai' | 'database' | 'network';

export interface RecoverySuggestion {
  action: string;
  description: string;
  automated?: boolean;
}

export interface ErrorMetadata {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly severity: ErrorSeverity;
  public readonly source: ErrorSource;
  public readonly isRetryable: boolean;
  public readonly recoverySuggestions: RecoverySuggestion[];
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor({
    code,
    message,
    userMessage,
    severity = 'error',
    source = 'client',
    isRetryable = false,
    recoverySuggestions = [],
    metadata = {},
  }: {
    code: string;
    message: string;
    userMessage: string;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    isRetryable?: boolean;
    recoverySuggestions?: RecoverySuggestion[];
    metadata?: ErrorMetadata;
  }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.technicalMessage = message;
    this.severity = severity;
    this.source = source;
    this.isRetryable = isRetryable;
    this.recoverySuggestions = recoverySuggestions;
    this.metadata = metadata;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();

    Object.setPrototypeOf(this, AppError.prototype);
  }

  private generateErrorId(): string {
    return `${this.code}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      errorId: this.errorId,
      code: this.code,
      message: this.technicalMessage,
      userMessage: this.userMessage,
      severity: this.severity,
      source: this.source,
      isRetryable: this.isRetryable,
      recoverySuggestions: this.recoverySuggestions,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  toString(): string {
    return `[${this.code}] ${this.userMessage}`;
  }
}
