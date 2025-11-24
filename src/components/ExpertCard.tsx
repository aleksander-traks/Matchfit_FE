import { Star, Award, DollarSign, Calendar, MapPin, Loader2 } from 'lucide-react';
import type { ExpertWithMatchStatus } from '../data/expertsData';

interface ExpertCardProps {
  expert: ExpertWithMatchStatus;
  position: number;
  isAnimating: boolean;
  onChoose?: (expertId: number) => void;
}

export default function ExpertCard({ expert, position, isAnimating, onChoose }: ExpertCardProps) {
  const matchPercentage = expert.match_score ? Math.round(expert.match_score) : null;
  const showScoreLoader = expert.matchStatus === 'pending' || expert.matchStatus === 'calculating-score';
  const showReasonsLoader = expert.matchStatus === 'calculating-reasons' && expert.reasonsLoading;
  const isComplete = expert.matchStatus === 'complete' || expert.matchStatus === 'score-complete';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-700 ease-out ${
        isAnimating ? 'transform scale-95' : 'transform scale-100'
      }`}
      style={{
        transform: isAnimating ? `translateY(${position * 10}px)` : 'translateY(0)',
      }}
    >
      <div className="flex gap-4 mb-4">
        <div className="relative">
          <img
            src={expert.image}
            alt={expert.name}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-100"
            loading="lazy"
          />
          {isComplete && matchPercentage && matchPercentage >= 70 && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-neutral-900 mb-1">{expert.name}</h3>
          <p className="text-sm text-emerald-600 font-medium mb-2">{expert.specialization}</p>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              {expert.years_of_experience} years
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {expert.client_ratings}/5
            </span>
          </div>
        </div>

        <div className="text-right">
          {showScoreLoader ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-1" />
              <div className="text-xs text-neutral-500">Calculating...</div>
            </div>
          ) : matchPercentage !== null ? (
            <div className="animate-fadeIn">
              <div className="text-3xl font-bold text-emerald-600">{matchPercentage}%</div>
              <div className="text-sm text-neutral-600">Match</div>
            </div>
          ) : (
            <div className="text-3xl font-bold text-neutral-300">—</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-neutral-700">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{expert.monthly_budget}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-700">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{expert.availability}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-700">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{expert.cooperation}</span>
        </div>
      </div>

      {(expert.reason1 || expert.reason2 || showReasonsLoader) && matchPercentage && matchPercentage >= 60 && (
        <div className="bg-emerald-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-neutral-900 mb-2">Why this trainer?</h4>
          {showReasonsLoader ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <div className="h-4 bg-emerald-100 rounded animate-pulse flex-1"></div>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <div className="h-4 bg-emerald-100 rounded animate-pulse flex-1"></div>
              </div>
            </div>
          ) : (
            <ul className="space-y-1 text-sm text-neutral-700">
              {expert.reason1 && (
                <li className="animate-fadeIn">• {expert.reason1}</li>
              )}
              {expert.reason2 && (
                <li className="animate-fadeIn animation-delay-200">• {expert.reason2}</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onChoose?.(expert.id)}
          disabled={!isComplete || !matchPercentage}
          className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          Choose this trainer
        </button>
        <button
          disabled={!isComplete || !matchPercentage}
          className="px-6 py-3 border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Message
        </button>
      </div>
    </div>
  );
}
