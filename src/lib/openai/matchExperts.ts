import { ErrorFactory } from '../errors/errorFactory';

export interface Expert {
  id: number;
  overview: string;
}

export interface MatchResult {
  expert_id: number;
  match_score: number;
  reason1: string;
  reason2: string;
}

export interface ScoreOnlyResult {
  expert_id: number;
  match_score: number;
}

export interface ReasonsOnlyResult {
  expert_id: number;
  reason1: string;
  reason2: string;
}

export interface StreamingMatchCallbacks {
  onMatch: (match: MatchResult) => void;
  onProgress?: (completed: number, total: number) => void;
  onComplete: (matches: MatchResult[]) => void;
  onError: (error: Error) => void;
}

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-experts`;

function getHeaders() {
  return {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function batchCalculateMatchScores(
  clientOverview: string,
  experts: Expert[]
): Promise<MatchResult[]> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clientOverview, experts, stream: false }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw ErrorFactory.createOpenAIError(
        err.error || 'Failed to match experts',
        err.code || 'REQUEST_FAILED'
      );
    }

    const data = await response.json();
    return data.matches as MatchResult[];
  } catch (error: any) {
    console.error('Error batch matching experts:', error);
    throw ErrorFactory.fromError(error);
  }
}

export async function matchExpertsWithStreaming(
  clientOverview: string,
  experts: Expert[],
  callbacks: StreamingMatchCallbacks
): Promise<void> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clientOverview, experts, stream: true }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw ErrorFactory.createOpenAIError(
        err.error || 'Failed to match experts',
        err.code || 'REQUEST_FAILED'
      );
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === 'match') {
            callbacks.onMatch(event.match);
            callbacks.onProgress?.(event.completed, event.total);
          } else if (event.type === 'complete') {
            callbacks.onComplete(event.matches);
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        } catch (parseErr) {
          console.error('Failed to parse SSE event:', parseErr);
        }
      }
    }
  } catch (error: any) {
    console.error('Error streaming expert matches:', error);
    callbacks.onError(ErrorFactory.fromError(error));
  }
}

export async function calculateMatchScore(
  clientOverview: string,
  expert: Expert
): Promise<MatchResult> {
  const results = await batchCalculateMatchScores(clientOverview, [expert]);
  return results[0];
}

export async function calculateScoreOnly(
  clientOverview: string,
  expert: Expert
): Promise<ScoreOnlyResult> {
  const result = await calculateMatchScore(clientOverview, expert);
  return { expert_id: result.expert_id, match_score: result.match_score };
}

export async function calculateReasonsOnly(
  clientOverview: string,
  expert: Expert,
  _score: number
): Promise<ReasonsOnlyResult> {
  const result = await calculateMatchScore(clientOverview, expert);
  return { expert_id: result.expert_id, reason1: result.reason1, reason2: result.reason2 };
}
