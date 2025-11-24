const API_URL = 'http://localhost:3001/api/matching';

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
  onError?: (error: string) => void;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private callbacks: StreamCallbacks;

  constructor(callbacks: StreamCallbacks) {
    this.callbacks = callbacks;
  }

  async streamOverviewGeneration(clientData: ClientIntakeData): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/generate-overview-stream`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to start stream');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No reader available');
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
                    const event = line.substring(6).trim();
                    continue;
                  }

                  if (line.startsWith('data:')) {
                    const data = line.substring(5).trim();
                    if (!data) continue;

                    try {
                      const parsed = JSON.parse(data);

                      if (parsed.token && this.callbacks.onOverviewToken) {
                        this.callbacks.onOverviewToken(parsed.token);
                      }

                      if (parsed.overview && this.callbacks.onOverviewComplete) {
                        this.callbacks.onOverviewComplete(parsed.overview, parsed.cached || false);
                      }
                    } catch (e) {
                      console.error('Failed to parse SSE data:', data);
                    }
                  }
                }
              }
            } catch (error: any) {
              if (this.callbacks.onError) {
                this.callbacks.onError(error.message);
              }
              reject(error);
            }
          };

          readStream();
        })
        .catch((error) => {
          if (this.callbacks.onError) {
            this.callbacks.onError(error.message);
          }
          reject(error);
        });
    });
  }

  async streamExpertMatching(overview: string, forceRefresh = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/match-experts-stream`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ overview, forceRefresh }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to start stream');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No reader available');
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
              if (this.callbacks.onError) {
                this.callbacks.onError(error.message);
              }
              reject(error);
            }
          };

          readStream();
        })
        .catch((error) => {
          if (this.callbacks.onError) {
            this.callbacks.onError(error.message);
          }
          reject(error);
        });
    });
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export async function generateOverview(clientData: ClientIntakeData): Promise<string> {
  const response = await fetch(`${API_URL}/generate-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error('Failed to generate overview');
  }

  const data = await response.json();
  return data.overview;
}

export async function matchExperts(overview: string): Promise<MatchResult[]> {
  const response = await fetch(`${API_URL}/match-experts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ overview }),
  });

  if (!response.ok) {
    throw new Error('Failed to match experts');
  }

  const data = await response.json();
  return data.matches;
}

export async function warmCache(clientData: ClientIntakeData): Promise<void> {
  await fetch(`${API_URL}/warm-cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientData }),
  });
}
