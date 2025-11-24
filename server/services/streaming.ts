import type { Response } from 'express';

export interface SSEMessage {
  event: string;
  data: any;
}

export class SSEStream {
  private res: Response;
  private isConnected: boolean = true;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(res: Response) {
    this.res = res;
    this.setupConnection();
    this.startHeartbeat();
  }

  private setupConnection(): void {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    this.res.on('close', () => {
      this.isConnected = false;
      this.stopHeartbeat();
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendComment('heartbeat');
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendEvent(event: string, data: any): boolean {
    if (!this.isConnected) {
      return false;
    }

    try {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      this.res.write(`event: ${event}\n`);
      this.res.write(`data: ${dataStr}\n\n`);
      return true;
    } catch (error) {
      console.error('Error sending SSE event:', error);
      return false;
    }
  }

  sendComment(comment: string): void {
    if (this.isConnected) {
      this.res.write(`: ${comment}\n\n`);
    }
  }

  sendError(error: string): void {
    this.sendEvent('error', { message: error });
  }

  close(): void {
    this.stopHeartbeat();
    if (this.isConnected) {
      this.res.end();
      this.isConnected = false;
    }
  }

  isActive(): boolean {
    return this.isConnected;
  }
}

export function createSSEResponse(res: Response): SSEStream {
  return new SSEStream(res);
}

export async function streamWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
