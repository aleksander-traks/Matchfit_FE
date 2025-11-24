import { ErrorFactory } from './errors/errorFactory';
import { NetworkError } from './errors/NetworkError';
import { OpenAIError } from './errors/OpenAIError';
import type { AppError } from './errors/AppError';

const API_URL = 'http://localhost:3001/api/matching';
const DEFAULT_TIMEOUT = 60000;

export interface ClientIntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

export interface MatchResult {
  expert_id: number;
  match_score: number;
  reason_1: string;
  reason_2: string;
}

export interface StreamCallbacks {
  onOverviewToken?: (token: string) => void;
  onOverviewComplete?: (overview: string, cached: boolean) => void;
  onMatchScore?: (match: MatchResult) => void;
  onMatchingProgress?: (current: number, total: number, expertId: number) => void;
  onMatchingComplete?: (cached: boolean) => void;
  onError?: (error: AppError) => void;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw NetworkError.timeout(timeoutMs, url);
    }

    throw ErrorFactory.fromFetchError(error, url, {
      userAction: 'Making API request',
      pageUrl: window.location.href,
    });
  }
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private callbacks: StreamCallbacks;
  private abortController: AbortController | null = null;

  constructor(callbacks: StreamCallbacks) {
    this.callbacks = callbacks;
  }

  async streamOverviewGeneration(clientData: ClientIntakeData): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/generate-overview-stream`;
      this.abortController = new AbortController();

      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
      }, DEFAULT_TIMEOUT);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
        signal: this.abortController.signal,
      })
        .then(async (response) => {
          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await ErrorFactory.fromResponse(response, {
              userAction: 'Generating overview with streaming',
              pageUrl: window.location.href,
            });
            if (this.callbacks.onError) {
              this.callbacks.onError(error);
            }
            reject(error);
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            const error = NetworkError.serverUnreachable(url);
            if (this.callbacks.onError) {
              this.callbacks.onError(error);
            }
            reject(error);
            return;
          }

          const readStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  resolve();
                  break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('event:')) {
                    continue;
                  }

                  if (line.startsWith('data:')) {
                    const data = line.substring(5).trim();
                    if (!data) continue;

                    try {
                      const parsed = JSON.parse(data);

                      if (parsed.error) {
                        const error = OpenAIError.fromOpenAIError(parsed.error);
                        if (this.callbacks.onError) {
                          this.callbacks.onError(error);
                        }
                        reject(error);
                        return;
                      }

                      if (parsed.token && this.callbacks.onOverviewToken) {
                        this.callbacks.onOverviewToken(parsed.token);
                      }

                      if (parsed.overview && this.callbacks.onOverviewComplete) {
                        this.callbacks.onOverviewComplete(parsed.overview, parsed.cached || false);
                      }
                    } catch (e) {
                      const error = OpenAIError.parsingError(data);
                      if (this.callbacks.onError) {
                        this.callbacks.onError(error);
                      }
                    }
                  }
                }
              }
            } catch (error: any) {
              const appError = ErrorFactory.fromUnknown(error, {
                userAction: 'Reading streaming response',
                pageUrl: window.location.href,
              });
              if (this.callbacks.onError) {
                this.callbacks.onError(appError);
              }
              reject(appError);
            }
          };

          readStream();
        })
        .catch((error) => {
          clearTimeout(timeoutId);

          let appError: AppError;
          if (error.name === 'AbortError') {
            appError = NetworkError.timeout(DEFAULT_TIMEOUT, url);
          } else {
            appError = ErrorFactory.fromFetchError(error, url, {
              userAction: 'Starting overview generation stream',
              pageUrl: window.location.href,
            });
          }

          if (this.callbacks.onError) {
            this.callbacks.onError(appError);
          }
          reject(appError);
        });
    });
  }

  async streamExpertMatching(overview: string, forceRefresh = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/match-experts-stream`;
      this.abortController = new AbortController();

      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
      }, DEFAULT_TIMEOUT);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ overview, forceRefresh }),
        signal: this.abortController.signal,
      })
        .then(async (response) => {
          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await ErrorFactory.fromResponse(response, {
              userAction: 'Matching experts with streaming',
              pageUrl: window.location.href,
            });
            if (this.callbacks.onError) {
              this.callbacks.onError(error);
            }
            reject(error);
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            const error = NetworkError.serverUnreachable(url);
            if (this.callbacks.onError) {
              this.callbacks.onError(error);
            }
            reject(error);
            return;
          }

          const readStream = async () => {
            try {
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  resolve();
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('event:')) {
                    continue;
                  }

                  if (line.startsWith('data:')) {
                    const data = line.substring(5).trim();
                    if (!data) continue;

                    try {
                      const parsed = JSON.parse(data);

                      if (parsed.error) {
                        const error = ErrorFactory.fromUnknown(parsed.error, {
                          userAction: 'Matching experts',
                          pageUrl: window.location.href,
                        });
                        if (this.callbacks.onError) {
                          this.callbacks.onError(error);
                        }
                        reject(error);
                        return;
                      }

                      if (parsed.expert_id && parsed.match_score !== undefined) {
                        if (this.callbacks.onMatchScore) {
                          this.callbacks.onMatchScore(parsed as MatchResult);
                        }
                      } else if (parsed.current && parsed.total) {
                        if (this.callbacks.onMatchingProgress) {
                          this.callbacks.onMatchingProgress(
                            parsed.current,
                            parsed.total,
                            parsed.expertId
                          );
                        }
                      } else if (parsed.cached !== undefined) {
                        if (this.callbacks.onMatchingComplete) {
                          this.callbacks.onMatchingComplete(parsed.cached);
                        }
                      }
                    } catch (e) {
                      console.error('Failed to parse SSE data:', data);
                    }
                  }
                }
              }
            } catch (error: any) {
              const appError = ErrorFactory.fromUnknown(error, {
                userAction: 'Reading matching stream',
                pageUrl: window.location.href,
              });
              if (this.callbacks.onError) {
                this.callbacks.onError(appError);
              }
              reject(appError);
            }
          };

          readStream();
        })
        .catch((error) => {
          clearTimeout(timeoutId);

          let appError: AppError;
          if (error.name === 'AbortError') {
            appError = NetworkError.timeout(DEFAULT_TIMEOUT, url);
          } else {
            appError = ErrorFactory.fromFetchError(error, url, {
              userAction: 'Starting expert matching stream',
              pageUrl: window.location.href,
            });
          }

          if (this.callbacks.onError) {
            this.callbacks.onError(appError);
          }
          reject(appError);
        });
    });
  }

  close(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export async function generateOverview(clientData: ClientIntakeData): Promise<string> {
  const url = `${API_URL}/generate-overview`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      },
      DEFAULT_TIMEOUT
    );

    if (!response.ok) {
      throw await ErrorFactory.fromResponse(response, {
        userAction: 'Generating overview',
        pageUrl: window.location.href,
      });
    }

    const data = await response.json();
    return data.overview;
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw ErrorFactory.fromFetchError(error, url, {
      userAction: 'Generating overview',
      pageUrl: window.location.href,
    });
  }
}

export async function matchExperts(overview: string): Promise<MatchResult[]> {
  const url = `${API_URL}/match-experts`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ overview }),
      },
      DEFAULT_TIMEOUT
    );

    if (!response.ok) {
      throw await ErrorFactory.fromResponse(response, {
        userAction: 'Matching experts',
        pageUrl: window.location.href,
      });
    }

    const data = await response.json();
    return data.matches;
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw ErrorFactory.fromFetchError(error, url, {
      userAction: 'Matching experts',
      pageUrl: window.location.href,
    });
  }
}

export async function warmCache(clientData: ClientIntakeData): Promise<void> {
  const url = `${API_URL}/warm-cache`;

  try {
    await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientData }),
      },
      10000
    );
  } catch (error) {
    console.warn('Failed to warm cache:', error);
  }
}
