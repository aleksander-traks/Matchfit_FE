import { AppError, type RecoverySuggestion } from './AppError';

export class OpenAIError extends AppError {
  constructor({
    code,
    message,
    userMessage,
    isRetryable = false,
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
      source: 'openai',
      isRetryable,
      recoverySuggestions,
      metadata,
    });
    this.name = 'OpenAIError';
    Object.setPrototypeOf(this, OpenAIError.prototype);
  }

  static apiKeyMissing(): OpenAIError {
    return new OpenAIError({
      code: 'AI-001',
      message: 'OpenAI API key is missing or invalid',
      userMessage: 'There is a configuration issue with our AI service. We have been notified.',
      isRetryable: false,
      recoverySuggestions: [
        { action: 'Write your overview manually', description: 'You can continue without AI generation' },
        { action: 'Contact support', description: 'Get help from our team' },
      ],
    });
  }

  static modelUnavailable(model: string): OpenAIError {
    return new OpenAIError({
      code: 'AI-002',
      message: `Model ${model} is not available`,
      userMessage: 'The AI model is currently unavailable. We will try an alternative.',
      isRetryable: true,
      metadata: { model },
    });
  }

  static tokenLimitExceeded(tokens: number, limit: number): OpenAIError {
    return new OpenAIError({
      code: 'AI-003',
      message: `Token limit exceeded: ${tokens} > ${limit}`,
      userMessage: 'Your profile is too detailed for automatic processing. Please summarize your information.',
      isRetryable: false,
      metadata: { tokens, limit },
    });
  }

  static contentPolicyViolation(): OpenAIError {
    return new OpenAIError({
      code: 'AI-004',
      message: 'Content policy violation detected',
      userMessage: 'Your input contains content that cannot be processed. Please revise and try again.',
      isRetryable: false,
    });
  }

  static streamingInterrupted(progress: number): OpenAIError {
    return new OpenAIError({
      code: 'AI-005',
      message: `Streaming connection interrupted at ${progress}%`,
      userMessage: 'The connection was interrupted while generating your overview. Your progress has been saved.',
      isRetryable: true,
      recoverySuggestions: [
        { action: 'Continue from where we left off', description: 'Resume generation', automated: true },
        { action: 'Start fresh', description: 'Generate a new overview' },
      ],
      metadata: { progress },
    });
  }

  static parsingError(content: string): OpenAIError {
    return new OpenAIError({
      code: 'AI-006',
      message: `Failed to parse OpenAI response: ${content.substring(0, 100)}`,
      userMessage: 'We received an unexpected response from the AI service. Trying again should help.',
      isRetryable: true,
      metadata: { contentPreview: content.substring(0, 200) },
    });
  }

  static fromOpenAIError(error: any): OpenAIError {
    const message = error?.message || error?.toString() || 'Unknown OpenAI error';
    const errorCode = error?.code || error?.type;

    if (errorCode === 'insufficient_quota' || message.includes('quota')) {
      return new OpenAIError({
        code: 'AI-007',
        message: 'OpenAI API quota exceeded',
        userMessage: 'Our AI service has reached its usage limit. Please try again later or contact support.',
        isRetryable: false,
      });
    }

    if (errorCode === 'invalid_api_key' || message.includes('API key')) {
      return this.apiKeyMissing();
    }

    if (errorCode === 'model_not_found' || message.includes('model')) {
      return this.modelUnavailable(error?.model || 'unknown');
    }

    if (errorCode === 'context_length_exceeded' || message.includes('token')) {
      return this.tokenLimitExceeded(error?.tokens || 0, error?.limit || 0);
    }

    if (errorCode === 'content_filter' || message.includes('content policy')) {
      return this.contentPolicyViolation();
    }

    return new OpenAIError({
      code: 'AI-000',
      message: `OpenAI Error: ${message}`,
      userMessage: 'The AI service encountered an error. Please try again.',
      isRetryable: true,
      metadata: { originalError: error },
    });
  }
}
