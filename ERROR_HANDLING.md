# Error Handling System

This document describes the comprehensive error handling system implemented in the healthcare matching application.

## Overview

The error handling system transforms generic errors like "Failed to fetch" into specific, actionable error messages with clear recovery paths. It provides a consistent error experience across the application.

## Architecture

### Error Class Hierarchy

**Base Class: `AppError`**
- Located in: `src/lib/errors/AppError.ts`
- Contains: error code, user message, technical message, severity, source, retry info, recovery suggestions
- Provides: unique error IDs, timestamps, metadata tracking

**Specialized Classes:**
- `NetworkError` - Network and connectivity issues (NET-001 to NET-005)
- `ApiError` - HTTP response errors (API-001 to API-006)
- `OpenAIError` - AI service errors (AI-001 to AI-007)

### Error Factory

**Location:** `src/lib/errors/errorFactory.ts`

The error factory intelligently parses errors from different sources:
- `fromFetchError()` - Converts fetch/network errors
- `fromResponse()` - Parses HTTP responses
- `fromOpenAI()` - Handles OpenAI-specific errors
- `fromUnknown()` - Fallback for unexpected errors

### Error Messages

**Location:** `src/lib/errors/errorMessages.ts`

Contains user-friendly message templates for every error code with:
- Clear title
- Plain English description
- Actionable recovery steps
- Technical notes for debugging

### Error Logging

**Location:** `src/lib/logging/errorLogger.ts`

Features:
- Batch logging to Supabase `error_logs` table
- Session tracking for error correlation
- Queue management (max 50 errors, 2s batch delay)
- Automatic error recovery tracking

**Database Table:** `error_logs`
- Stores: error details, user context, stack traces, metadata
- Indexes: error_code, severity, created_at, session_id
- RLS: Public insert, authenticated read

### Retry Strategy

**Location:** `src/lib/errors/retryStrategy.ts`

Features:
- Exponential backoff (1s, 2s, 4s, 8s, ...)
- Maximum 3 retry attempts
- Configurable delays (base: 1s, max: 30s)
- Circuit breaking for non-retryable errors

### UI Components

**ErrorAlert Component** (`src/components/errors/ErrorAlert.tsx`)
- Displays error with severity-based styling
- Shows recovery suggestions
- Collapsible technical details
- Copy error ID for support
- Retry and dismiss actions

**RetryButton Component** (`src/components/errors/RetryButton.tsx`)
- Smart retry with countdown
- Auto-retry with cancellation option
- Shows attempt count
- Loading states

## Integration Points

### API Layer (`src/lib/openaiStream.ts`)

All API calls now:
1. Use `fetchWithTimeout()` with 60s timeout
2. Catch and transform errors using ErrorFactory
3. Return proper AppError instances
4. Handle AbortController for cancellations

### Context Layer (`src/context/IntakeContext.tsx`)

State management:
- `overviewError: AppError | null` (was `string`)
- Logs all errors to Supabase
- Preserves error metadata for UI display

### UI Layer (`src/pages/intake/Step3.tsx`)

User experience:
- Displays ErrorAlert with full error details
- Provides retry functionality with exponential backoff
- Shows recovery suggestions
- Allows error dismissal

## Error Codes Reference

### Network Errors (NET-xxx)
- **NET-001**: Connection Timeout - Request took too long
- **NET-002**: Server Unreachable - Cannot connect to server
- **NET-003**: No Internet Connection - User is offline
- **NET-004**: Security Policy Error - CORS or CSP violation
- **NET-005**: Request Cancelled - Request was aborted

### API Errors (API-xxx)
- **API-001**: Invalid Request - Bad request data (400)
- **API-002**: Authentication Error - Auth failed (401)
- **API-003**: Too Many Requests - Rate limit hit (429)
- **API-004**: Server Error - Internal server error (500)
- **API-005**: Service Unavailable - Temporary outage (503)
- **API-006**: Gateway Timeout - Upstream timeout (504)

### AI Errors (AI-xxx)
- **AI-001**: AI Service Configuration Error - API key missing
- **AI-002**: AI Model Unavailable - Model not accessible
- **AI-003**: Input Too Large - Token limit exceeded
- **AI-004**: Content Not Allowed - Content policy violation
- **AI-005**: Connection Interrupted - Streaming interrupted
- **AI-006**: Unexpected Response - Parse error
- **AI-007**: Service Limit Reached - Quota exceeded

### Other Errors
- **VAL-001**: Missing Required Information - Validation failed
- **DB-001**: Database Error - Database operation failed

## Error Flow Example

When a user tries to generate an overview and the server is not running:

1. **Fetch fails** with `TypeError: Failed to fetch`
2. **ErrorFactory.fromFetchError()** detects connection refused
3. **Creates NetworkError.serverUnreachable()** with code NET-002
4. **Error is caught** in `generateOverviewWithOpenAI()`
5. **errorLogger.logError()** saves to database with context
6. **State updated** with `overviewError: AppError`
7. **ErrorAlert displays**:
   ```
   Server Unreachable
   We cannot connect to our servers. They may be temporarily unavailable.

   What you can do:
   • Check your internet connection
   • Try again in a few minutes
   • Contact support if the issue persists

   [Try Again] [Copy Error ID] [▼ Technical Details]
   ```
8. **User clicks "Try Again"**
9. **Retry strategy** attempts with backoff: 1s, 2s, 4s
10. **If successful**: Error dismissed, overview generated
11. **If all fail**: User can write manual overview

## Key Features

### For Users
- **Clear messages** instead of technical jargon
- **Actionable steps** for recovery
- **Smart retry** with automatic backoff
- **Progress preservation** across errors
- **Error IDs** for support tickets

### For Developers
- **Structured logging** with full context
- **Error correlation** via session IDs
- **Technical details** in collapsed section
- **Stack traces** captured automatically
- **Retry metrics** tracked

### For Operations
- **Centralized error table** in Supabase
- **Query by error code**, severity, time
- **Track resolution** (resolved flag)
- **Monitor patterns** across sessions
- **Debug with full context**

## Usage Examples

### Throwing Errors in API Code

```typescript
// Network timeout
throw NetworkError.timeout(30000, url);

// API error from response
throw await ErrorFactory.fromResponse(response);

// OpenAI specific error
throw OpenAIError.apiKeyMissing();
```

### Catching and Handling Errors

```typescript
try {
  const overview = await generateOverview(clientData);
} catch (error: any) {
  // Log to database
  await errorLogger.logError(error, {
    userAction: 'Generating overview',
    clientProfileId: profileId,
  });

  // Update UI state
  setError(error);
}
```

### Displaying Errors

```tsx
{error && (
  <ErrorAlert
    error={error}
    onRetry={handleRetry}
    onDismiss={() => setError(null)}
  />
)}
```

### Retry with Strategy

```typescript
await defaultRetryStrategy.executeWithRetry(
  async () => await generateOverview(data),
  'overview-generation',
  (attempt, delay, error) => {
    console.log(`Retry ${attempt} in ${delay}ms`);
  }
);
```

## Testing Error Scenarios

To test different errors:

1. **Server not running**: Don't start backend → NET-002
2. **Slow network**: Throttle network → NET-001 (after 60s)
3. **Offline**: Disable network → NET-003
4. **API key missing**: Remove OPENAI_API_KEY → AI-001
5. **Rate limit**: Make many requests → API-003

## Best Practices

### When Adding New API Calls
1. Use `fetchWithTimeout()` wrapper
2. Catch errors with ErrorFactory
3. Log errors with errorLogger
4. Display with ErrorAlert component
5. Add retry for transient errors

### When Adding New Error Types
1. Create error in appropriate class (Network/Api/OpenAI)
2. Add error code and message template
3. Define recovery suggestions
4. Mark as retryable if appropriate
5. Document in this file

### When Debugging Production Errors
1. Get error ID from user
2. Query `error_logs` table by `error_id`
3. Check `session_id` for related errors
4. Review `stack_trace` and `metadata`
5. Track `resolved` flag for fixes

## Future Enhancements

Potential improvements:
- Error rate monitoring/alerting
- Automatic error aggregation
- User feedback on error helpfulness
- A/B testing error messages
- Integration with error tracking service (Sentry)
- Offline error queue for sync later
- Error trend analysis dashboard
