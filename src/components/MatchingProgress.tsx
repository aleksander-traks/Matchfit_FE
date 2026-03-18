import { Check, Loader2 } from 'lucide-react';
import type { MatchingPhase } from '../hooks/useRealTimeMatching';
import { pl } from '../lib/i18n/pl';

interface MatchingProgressProps {
  phase: MatchingPhase;
  progress: number;
  completedScoresCount: number;
  totalExperts: number;
  completedReasonsCount: number;
}

export default function MatchingProgress({
  phase,
  progress,
  completedScoresCount,
  totalExperts,
  completedReasonsCount,
}: MatchingProgressProps) {
  const phases = [
    { id: 'loading-experts', label: pl.matchingProgress.loadingTrainers, completed: progress >= 15 },
    { id: 'calculating-scores', label: pl.matchingProgress.calculatingCompatibility, completed: progress >= 85 },
    { id: 'sorting', label: pl.matchingProgress.rankingResults, completed: progress >= 90 },
    { id: 'calculating-reasons', label: pl.matchingProgress.generatingInsights, completed: progress >= 100 },
  ];

  const getStatusText = () => {
    switch (phase) {
      case 'loading-experts':
        return pl.matchingProgress.statusLoadingTrainers;
      case 'calculating-scores':
        return pl.matchingProgress.statusCalculating(completedScoresCount, totalExperts);
      case 'sorting':
        return pl.matchingProgress.statusRanking;
      case 'calculating-reasons':
        return pl.matchingProgress.statusGenerating(completedReasonsCount, totalExperts);
      case 'complete':
        return pl.matchingProgress.statusComplete;
      default:
        return pl.matchingProgress.statusPreparing;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">{pl.matchingProgress.title}</h3>
        <span className="text-2xl font-bold text-emerald-600">{Math.round(progress)}%</span>
      </div>

      <div className="mb-4">
        <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-700 mb-4">
        {phase !== 'complete' && phase !== 'idle' && (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        )}
        {phase === 'complete' && (
          <Check className="w-4 h-4 text-emerald-600" />
        )}
        <span>{getStatusText()}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {phases.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 text-xs transition-colors ${
              p.completed ? 'text-emerald-600' : 'text-neutral-400'
            }`}
          >
            {p.completed ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 border-2 border-current rounded-full flex-shrink-0" />
            )}
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
