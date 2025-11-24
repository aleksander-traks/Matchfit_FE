import { supabase } from '../supabase';
import type { AppError } from '../errors/AppError';

interface LogContext {
  userAction?: string;
  pageUrl?: string;
  sessionId?: string;
  clientProfileId?: string;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  private sessionId: string;
  private logQueue: any[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly BATCH_DELAY = 2000;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    const stored = sessionStorage.getItem('error_session_id');
    if (stored) return stored;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error_session_id', newId);
    return newId;
  }

  async logError(error: AppError, context?: LogContext): Promise<void> {
    const logEntry = {
      error_id: error.errorId,
      error_code: error.code,
      error_message: error.technicalMessage,
      user_message: error.userMessage,
      severity: error.severity,
      source: error.source,
      user_action: context?.userAction || 'Unknown action',
      page_url: context?.pageUrl || window.location.href,
      user_agent: navigator.userAgent,
      session_id: context?.sessionId || this.sessionId,
      client_profile_id: context?.clientProfileId || null,
      request_data: error.metadata.request || null,
      response_data: error.metadata.response || null,
      stack_trace: error.stack || null,
      metadata: {
        ...error.metadata,
        recoverySuggestions: error.recoverySuggestions,
        isRetryable: error.isRetryable,
        ...context?.additionalData,
      },
      retry_count: error.metadata.retryCount || 0,
      resolved: false,
      created_at: error.timestamp.toISOString(),
    };

    this.logQueue.push(logEntry);

    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flushQueue();
    } else if (!this.isProcessing) {
      this.scheduleFlush();
    }

    console.error(`[${error.code}] ${error.userMessage}`, {
      errorId: error.errorId,
      technical: error.technicalMessage,
      metadata: error.metadata,
    });
  }

  private scheduleFlush(): void {
    setTimeout(() => this.flushQueue(), this.BATCH_DELAY);
  }

  private async flushQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    const batch = [...this.logQueue];
    this.logQueue = [];

    try {
      const { error } = await supabase
        .from('error_logs')
        .insert(batch);

      if (error) {
        console.error('Failed to log errors to database:', error);
        this.logQueue.unshift(...batch);
      }
    } catch (err) {
      console.error('Error flushing log queue:', err);
      this.logQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  async logRecovery(errorId: string): Promise<void> {
    try {
      await supabase
        .from('error_logs')
        .update({ resolved: true })
        .eq('error_id', errorId);
    } catch (err) {
      console.error('Failed to log error recovery:', err);
    }
  }

  async logWarning(message: string, context?: LogContext): Promise<void> {
    const logEntry = {
      error_id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      error_code: 'APP-WARN',
      error_message: message,
      user_message: message,
      severity: 'warning',
      source: 'client',
      user_action: context?.userAction || 'Unknown action',
      page_url: context?.pageUrl || window.location.href,
      user_agent: navigator.userAgent,
      session_id: context?.sessionId || this.sessionId,
      client_profile_id: context?.clientProfileId || null,
      metadata: context?.additionalData || {},
      retry_count: 0,
      resolved: false,
    };

    this.logQueue.push(logEntry);
    if (!this.isProcessing) {
      this.scheduleFlush();
    }
  }

  clearSession(): void {
    sessionStorage.removeItem('error_session_id');
    this.sessionId = this.generateSessionId();
  }
}

export const errorLogger = new ErrorLogger();
