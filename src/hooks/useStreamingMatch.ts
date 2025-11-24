import { useState, useCallback, useRef } from 'react';
import { SSEClient, type MatchResult, type ClientIntakeData } from '../lib/openaiStream';

interface StreamingState {
  isStreaming: boolean;
  overview: string;
  partialOverview: string;
  matches: Map<number, MatchResult>;
  progress: { current: number; total: number } | null;
  error: string | null;
  isComplete: boolean;
}

export function useStreamingMatch() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    overview: '',
    partialOverview: '',
    matches: new Map(),
    progress: null,
    error: null,
    isComplete: false,
  });

  const clientRef = useRef<SSEClient | null>(null);

  const startOverviewGeneration = useCallback(async (clientData: ClientIntakeData) => {
    setState((prev) => ({
      ...prev,
      isStreaming: true,
      partialOverview: '',
      overview: '',
      error: null,
      isComplete: false,
    }));

    const client = new SSEClient({
      onOverviewToken: (token) => {
        setState((prev) => ({
          ...prev,
          partialOverview: prev.partialOverview + token,
        }));
      },
      onOverviewComplete: (overview, cached) => {
        setState((prev) => ({
          ...prev,
          overview,
          partialOverview: overview,
          isStreaming: false,
        }));
      },
      onError: (error) => {
        setState((prev) => ({
          ...prev,
          error,
          isStreaming: false,
        }));
      },
    });

    clientRef.current = client;

    try {
      await client.streamOverviewGeneration(clientData);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to generate overview',
        isStreaming: false,
      }));
    }
  }, []);

  const startExpertMatching = useCallback(async (overview: string, forceRefresh = false) => {
    setState((prev) => ({
      ...prev,
      isStreaming: true,
      matches: new Map(),
      progress: null,
      error: null,
      isComplete: false,
    }));

    const client = new SSEClient({
      onMatchScore: (match) => {
        setState((prev) => {
          const newMatches = new Map(prev.matches);
          newMatches.set(match.expert_id, match);
          return {
            ...prev,
            matches: newMatches,
          };
        });
      },
      onMatchingProgress: (current, total, expertId) => {
        setState((prev) => ({
          ...prev,
          progress: { current, total },
        }));
      },
      onMatchingComplete: (cached) => {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isComplete: true,
        }));
      },
      onError: (error) => {
        setState((prev) => ({
          ...prev,
          error,
          isStreaming: false,
        }));
      },
    });

    clientRef.current = client;

    try {
      await client.streamExpertMatching(overview, forceRefresh);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to match experts',
        isStreaming: false,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }

    setState({
      isStreaming: false,
      overview: '',
      partialOverview: '',
      matches: new Map(),
      progress: null,
      error: null,
      isComplete: false,
    });
  }, []);

  return {
    ...state,
    startOverviewGeneration,
    startExpertMatching,
    reset,
    matchesArray: Array.from(state.matches.values()).sort((a, b) => b.match_score - a.match_score),
  };
}
