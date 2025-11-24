import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateScoreOnly, calculateReasonsOnly } from '../lib/openai/matchExperts';
import type { ExpertWithMatchStatus } from '../data/expertsData';

export type MatchingPhase =
  | 'idle'
  | 'loading-experts'
  | 'calculating-scores'
  | 'sorting'
  | 'calculating-reasons'
  | 'complete';

interface RealTimeMatchingState {
  experts: ExpertWithMatchStatus[];
  matchingPhase: MatchingPhase;
  completedScoresCount: number;
  completedReasonsCount: number;
  error: string | null;
  progress: number;
}

export function useRealTimeMatching() {
  const [state, setState] = useState<RealTimeMatchingState>({
    experts: [],
    matchingPhase: 'idle',
    completedScoresCount: 0,
    completedReasonsCount: 0,
    error: null,
    progress: 0,
  });

  const updateExpertStatus = useCallback((
    expertId: number,
    updates: Partial<ExpertWithMatchStatus>
  ) => {
    setState(prev => ({
      ...prev,
      experts: prev.experts.map(expert =>
        expert.id === expertId
          ? { ...expert, ...updates }
          : expert
      ),
    }));
  }, []);

  const loadAllExperts = useCallback(async () => {
    setState(prev => ({
      ...prev,
      matchingPhase: 'loading-experts',
      progress: 10,
    }));

    try {
      const { data: expertsData, error } = await supabase
        .from('experts')
        .select('*')
        .order('id');

      if (error) throw error;

      const expertsWithStatus: ExpertWithMatchStatus[] = (expertsData || []).map(expert => ({
        ...expert,
        matchStatus: 'pending' as const,
      }));

      setState(prev => ({
        ...prev,
        experts: expertsWithStatus,
        matchingPhase: 'calculating-scores',
        progress: 15,
      }));

      return expertsWithStatus;
    } catch (error) {
      console.error('Error loading experts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load experts',
        matchingPhase: 'idle',
      }));
      return [];
    }
  }, []);

  const calculateScoresInParallel = useCallback(async (
    clientOverview: string,
    experts: ExpertWithMatchStatus[]
  ) => {
    const BATCH_SIZE = 3;
    const totalExperts = experts.length;
    let completedCount = 0;

    for (let i = 0; i < experts.length; i += BATCH_SIZE) {
      const batch = experts.slice(i, i + BATCH_SIZE);

      batch.forEach(expert => {
        updateExpertStatus(expert.id, { matchStatus: 'calculating-score' });
      });

      const batchPromises = batch.map(async (expert) => {
        try {
          const scoreResult = await calculateScoreOnly(clientOverview, {
            id: expert.id,
            overview: expert.overview,
          });

          updateExpertStatus(expert.id, {
            match_score: scoreResult.match_score,
            matchStatus: 'score-complete',
          });

          return scoreResult;
        } catch (error) {
          console.error(`Failed to calculate score for expert ${expert.id}:`, error);
          updateExpertStatus(expert.id, {
            match_score: 0,
            matchStatus: 'score-complete',
          });
          return { expert_id: expert.id, match_score: 0 };
        }
      });

      await Promise.all(batchPromises);
      completedCount += batch.length;

      const progress = 15 + (70 * completedCount / totalExperts);
      setState(prev => ({
        ...prev,
        completedScoresCount: completedCount,
        progress,
      }));
    }
  }, [updateExpertStatus]);

  const sortExpertsByScore = useCallback(() => {
    setState(prev => ({
      ...prev,
      matchingPhase: 'sorting',
      progress: 85,
      experts: [...prev.experts].sort((a, b) =>
        (b.match_score || 0) - (a.match_score || 0)
      ),
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        matchingPhase: 'calculating-reasons',
      }));
    }, 1000);
  }, []);

  const calculateReasonsInParallel = useCallback(async (
    clientOverview: string,
    experts: ExpertWithMatchStatus[]
  ) => {
    const BATCH_SIZE = 2;
    const topExperts = experts.slice(0, 5);
    let completedCount = 0;

    for (let i = 0; i < topExperts.length; i += BATCH_SIZE) {
      const batch = topExperts.slice(i, i + BATCH_SIZE);

      batch.forEach(expert => {
        updateExpertStatus(expert.id, {
          matchStatus: 'calculating-reasons',
          reasonsLoading: true,
        });
      });

      const batchPromises = batch.map(async (expert) => {
        try {
          const reasonsResult = await calculateReasonsOnly(
            clientOverview,
            { id: expert.id, overview: expert.overview },
            expert.match_score || 0
          );

          updateExpertStatus(expert.id, {
            reason1: reasonsResult.reason1,
            reason2: reasonsResult.reason2,
            matchStatus: 'complete',
            reasonsLoading: false,
          });

          return reasonsResult;
        } catch (error) {
          console.error(`Failed to calculate reasons for expert ${expert.id}:`, error);
          updateExpertStatus(expert.id, {
            reason1: 'This trainer matches your fitness goals and experience level.',
            reason2: 'They have the qualifications to help you achieve your objectives.',
            matchStatus: 'complete',
            reasonsLoading: false,
          });
        }
      });

      await Promise.all(batchPromises);
      completedCount += batch.length;

      const progress = 85 + (15 * completedCount / topExperts.length);
      setState(prev => ({
        ...prev,
        completedReasonsCount: completedCount,
        progress,
      }));
    }

    setState(prev => ({
      ...prev,
      matchingPhase: 'complete',
      progress: 100,
    }));
  }, [updateExpertStatus]);

  const startMatching = useCallback(async (clientOverview: string) => {
    setState({
      experts: [],
      matchingPhase: 'idle',
      completedScoresCount: 0,
      completedReasonsCount: 0,
      error: null,
      progress: 0,
    });

    const experts = await loadAllExperts();
    if (experts.length === 0) return;

    await calculateScoresInParallel(clientOverview, experts);

    sortExpertsByScore();

    await new Promise(resolve => setTimeout(resolve, 1000));

    setState(prev => {
      const sortedExperts = [...prev.experts];
      calculateReasonsInParallel(clientOverview, sortedExperts);
      return prev;
    });
  }, [loadAllExperts, calculateScoresInParallel, sortExpertsByScore, calculateReasonsInParallel]);

  const reset = useCallback(() => {
    setState({
      experts: [],
      matchingPhase: 'idle',
      completedScoresCount: 0,
      completedReasonsCount: 0,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    startMatching,
    reset,
  };
}
