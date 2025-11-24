export interface ErrorMessageTemplate {
  title: string;
  description: string;
  actions: string[];
  technicalNote?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessageTemplate> = {
  'NET-001': {
    title: 'Connection Timeout',
    description: "We're having trouble connecting to our servers. This sometimes happens when our AI service is starting up.",
    actions: [
      'Wait 30 seconds and click "Try Again"',
      'Check your internet connection',
      'Refresh the page if the problem continues',
    ],
    technicalNote: 'Request timeout exceeded. The server may be experiencing high load or cold start delays.',
  },
  'NET-002': {
    title: 'Server Unreachable',
    description: 'We cannot connect to our servers. They may be temporarily unavailable.',
    actions: [
      'Check your internet connection',
      'Try again in a few minutes',
      'Contact support if the issue persists',
    ],
    technicalNote: 'DNS resolution failed or server is not responding.',
  },
  'NET-003': {
    title: 'No Internet Connection',
    description: 'You appear to be offline. Please check your internet connection.',
    actions: [
      'Check your Wi-Fi or cellular data',
      'Try again once you are back online',
    ],
    technicalNote: 'navigator.onLine returned false.',
  },
  'NET-004': {
    title: 'Security Policy Error',
    description: 'A security policy is blocking the request.',
    actions: [
      'Please contact support for assistance',
    ],
    technicalNote: 'CORS policy violation or content security policy block.',
  },
  'NET-005': {
    title: 'Request Cancelled',
    description: 'The request was cancelled.',
    actions: [
      'Click "Try Again" to restart',
    ],
    technicalNote: 'Request was aborted by user or system.',
  },
  'API-001': {
    title: 'Invalid Request',
    description: 'The request contains invalid data.',
    actions: [
      'Go back and check your inputs',
      'Make sure all required fields are filled',
    ],
    technicalNote: 'Server returned 400 Bad Request.',
  },
  'API-002': {
    title: 'Authentication Error',
    description: 'Authentication failed.',
    actions: [
      'Contact support for assistance',
    ],
    technicalNote: 'Server returned 401 Unauthorized.',
  },
  'API-003': {
    title: 'Too Many Requests',
    description: 'Too many requests have been made. Please wait before trying again.',
    actions: [
      'Wait a moment before retrying',
      'The service will be available shortly',
    ],
    technicalNote: 'Server returned 429 Too Many Requests. Rate limit exceeded.',
  },
  'API-004': {
    title: 'Server Error',
    description: 'Our server encountered an error. We have been notified and are working on it.',
    actions: [
      'Try again in a few minutes',
      'Contact support if the issue persists',
    ],
    technicalNote: 'Server returned 500 Internal Server Error.',
  },
  'API-005': {
    title: 'Service Temporarily Unavailable',
    description: 'The service is temporarily unavailable.',
    actions: [
      'Wait a moment and try again',
      'The service should be back shortly',
    ],
    technicalNote: 'Server returned 503 Service Unavailable.',
  },
  'API-006': {
    title: 'Gateway Timeout',
    description: 'The server took too long to respond.',
    actions: [
      'Try again with a shorter request',
      'Wait a moment and retry',
    ],
    technicalNote: 'Server returned 504 Gateway Timeout.',
  },
  'AI-001': {
    title: 'AI Service Configuration Error',
    description: 'There is a configuration issue with our AI service.',
    actions: [
      'Write your overview manually below',
      'Contact support if you need assistance',
    ],
    technicalNote: 'OpenAI API key is missing or invalid.',
  },
  'AI-002': {
    title: 'AI Model Unavailable',
    description: 'The AI model is currently unavailable. We will try an alternative.',
    actions: [
      'Wait a moment - we are trying a different model',
      'Try again if the automatic retry fails',
    ],
    technicalNote: 'Requested OpenAI model is not available.',
  },
  'AI-003': {
    title: 'Input Too Large',
    description: 'Your profile contains too much detail for automatic processing.',
    actions: [
      'Go back and provide less detail',
      'Or write a shorter manual overview',
    ],
    technicalNote: 'Token limit exceeded for the selected model.',
  },
  'AI-004': {
    title: 'Content Not Allowed',
    description: 'Your input contains content that cannot be processed.',
    actions: [
      'Review your responses for inappropriate content',
      'Try rephrasing your goals and experiences',
    ],
    technicalNote: 'OpenAI content policy violation detected.',
  },
  'AI-005': {
    title: 'Connection Interrupted',
    description: 'The connection was interrupted while generating your overview.',
    actions: [
      'Click "Continue" to resume from where we left off',
      'Or start fresh with "Generate New Overview"',
    ],
    technicalNote: 'SSE streaming connection closed unexpectedly.',
  },
  'AI-006': {
    title: 'Unexpected Response',
    description: 'We received an unexpected response from the AI service.',
    actions: [
      'Try again - this is usually a temporary issue',
      'Contact support if it keeps happening',
    ],
    technicalNote: 'Failed to parse OpenAI response format.',
  },
  'AI-007': {
    title: 'Service Limit Reached',
    description: 'Our AI service has reached its usage limit for now.',
    actions: [
      'Try again later',
      'Write your overview manually',
      'Contact support for immediate assistance',
    ],
    technicalNote: 'OpenAI API quota exceeded.',
  },
  'VAL-001': {
    title: 'Missing Required Information',
    description: 'Some required information is missing.',
    actions: [
      'Go back and complete all required fields',
      'Or skip automatic generation and write manually',
    ],
    technicalNote: 'Client-side validation failed.',
  },
  'DB-001': {
    title: 'Database Error',
    description: 'A database error occurred while saving your information.',
    actions: [
      'Try again - your data has been preserved',
      'Contact support if the issue persists',
    ],
    technicalNote: 'Database operation failed.',
  },
};

export function getErrorMessage(code: string): ErrorMessageTemplate {
  return ERROR_MESSAGES[code] || {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred.',
    actions: [
      'Try again',
      'Contact support if the issue persists',
    ],
    technicalNote: `Unknown error code: ${code}`,
  };
}
