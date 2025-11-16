const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://matchfit-be.onrender.com';

export interface MatchResult {
  expert_id: number;
  match_score: number;
  reason1: string;
  reason2: string;
}

export interface StreamingMatchCallbacks {
  onMatch: (match: MatchResult) => void;
  onComplete: (matches: MatchResult[]) => void;
  onError: (error: Error) => void;
  onProgress?: (completed: number, total: number) => void;
}

export async function matchExpertsStreaming(
  clientOverview: string,
  experts: Array<{ id: number; overview: string }>,
  callbacks: StreamingMatchCallbacks
): Promise<void> {
  const BATCH_SIZE = 3;
  const allMatches: MatchResult[] = [];
  let completedCount = 0;
  const totalCount = experts.length;

  try {
    for (let i = 0; i < experts.length; i += BATCH_SIZE) {
      const batch = experts.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (expert) => {
        try {
          const response = await fetch(`${PYTHON_API_URL}/match-experts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_overview: clientOverview,
              experts: [expert],
            }),
            mode: 'cors',
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          return result.matches[0];
        } catch (error: any) {
          console.error(`Failed to match expert ${expert.id}:`, error);
          return {
            expert_id: expert.id,
            match_score: 0,
            reason1: 'Error scoring expert',
            reason2: '',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach((match) => {
        if (match) {
          allMatches.push(match);
          callbacks.onMatch(match);
          completedCount++;
          callbacks.onProgress?.(completedCount, totalCount);
        }
      });
    }

    allMatches.sort((a, b) => b.match_score - a.match_score);
    callbacks.onComplete(allMatches);
  } catch (error: any) {
    callbacks.onError(error);
  }
}
