import { Check, Loader2 } from 'lucide-react';
import type { MatchingPhase } from '../hooks/useRealTimeMatching';

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
    { id: 'loading-experts', label: 'Loading trainers', completed: progress >= 15 },
    { id: 'calculating-scores', label: 'Calculating compatibility', completed: progress >= 85 },
    { id: 'sorting', label: 'Ranking results', completed: progress >= 90 },
    { id: 'calculating-reasons', label: 'Generating insights', completed: progress >= 100 },
  ];

  const getStatusText = () => {
    switch (phase) {
      case 'loading-experts':
        return 'Loading trainers from database...';
      case 'calculating-scores':
        return `Calculating compatibility scores... (${completedScoresCount}/${totalExperts})`;
      case 'sorting':
        return 'Ranking trainers by match score...';
      case 'calculating-reasons':
        return `Generating personalized recommendations... (${completedReasonsCount}/${totalExperts})`;)`;
      case 'complete':
        return 'All matches calculated successfully!';
      default:
        return 'Preparing to match...';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Finding Your Perfect Match</h3>
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
