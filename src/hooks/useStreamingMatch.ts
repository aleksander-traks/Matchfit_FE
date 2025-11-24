import { useState, useCallback } from 'react';
import { streamClientOverview, type ClientIntakeData } from '../lib/openai/generateOverview';
import { matchExpertsWithStreaming, type MatchResult } from '../lib/openai/matchExperts';
import { supabase } from '../lib/supabase';

interface StreamingState {
  isStreaming: boolean;
  overview: string;
  partialOverview: string;
  matches: MatchResult[];
  progress: { current: number; total: number } | null;
  error: string | null;
  isComplete: boolean;
}

export function useStreamingMatch() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    overview: '',
    partialOverview: '',
    matches: [],
    progress: null,
    error: null,
    isComplete: false,
  });

  const startOverviewGeneration = useCallback(async (clientData: ClientIntakeData) => {
    setState((prev) => ({
      ...prev,
      isStreaming: true,
      partialOverview: '',
      overview: '',
      error: null,
      isComplete: false,
    }));

    try {
      let fullOverview = '';
      for await (const token of streamClientOverview(clientData)) {
        fullOverview += token;
        setState((prev) => ({
          ...prev,
          partialOverview: fullOverview,
        }));
      }

      setState((prev) => ({
        ...prev,
        overview: fullOverview,
        isStreaming: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate overview',
        isStreaming: false,
      }));
    }
  }, []);

  const startExpertMatching = useCallback(async (overview: string) => {
    setState((prev) => ({
      ...prev,
      isStreaming: true,
      matches: [],
      progress: null,
      error: null,
      isComplete: false,
    }));

    try {
      const { data: experts, error: expertsError } = await supabase
        .from('experts')
        .select('id, overview');

      if (expertsError) throw expertsError;
      if (!experts || experts.length === 0) {
        throw new Error('No experts found in database.');
      }

      const expertsWithOverview = experts
        .filter(e => e.overview)
        .map(e => ({ id: e.id, overview: e.overview! }));

      await matchExpertsWithStreaming(overview, expertsWithOverview, {
        onMatch: (match) => {
          setState((prev) => ({
            ...prev,
            matches: [...prev.matches, match],
          }));
        },
        onProgress: (completed, total) => {
          setState((prev) => ({
            ...prev,
            progress: { current: completed, total },
          }));
        },
        onComplete: () => {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            isComplete: true,
          }));
        },
        onError: (error) => {
          setState((prev) => ({
            ...prev,
            error: error.message,
            isStreaming: false,
          }));
        },
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to match experts',
        isStreaming: false,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      overview: '',
      partialOverview: '',
      matches: [],
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
    matchesArray: state.matches.sort((a, b) => b.match_score - a.match_score),
  };
}
