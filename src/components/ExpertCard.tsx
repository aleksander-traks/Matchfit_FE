import { Award, DollarSign, Calendar, MapPin, Loader2, ChevronDown, Building2 } from 'lucide-react';
import type { ExpertWithMatchStatus } from '../data/expertsData';
import { BenefitLogosRow } from './BenefitLogos';
import { pl } from '../lib/i18n/pl';

interface ExpertCardProps {
  expert: ExpertWithMatchStatus;
  position: number;
  isAnimating: boolean;
  onChoose?: (expertId: number) => void;
  onMessage?: (expertId: number) => void;
}

export default function ExpertCard({ expert, position, isAnimating, onChoose, onMessage }: ExpertCardProps) {
  const matchPercentage = expert.match_score ? Math.round(expert.match_score) : null;
  const showScoreLoader = expert.matchStatus === 'pending' || expert.matchStatus === 'calculating-score';
  const showReasonsLoader = expert.matchStatus === 'calculating-reasons' && expert.reasonsLoading;
  const isComplete = expert.matchStatus === 'complete' || expert.matchStatus === 'score-complete';

  const specialties = expert.specialization
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const hasReasons = Boolean(expert.reason1 || expert.reason2 || showReasonsLoader);
  const showExpandableSection = hasReasons || specialties.length > 0 || Boolean(expert.availability);

  return (
    <div
      className={`bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 transition-all duration-700 ease-out hover:shadow-lg hover:border-emerald-200 ${
        isAnimating ? 'transform scale-95' : 'transform scale-100'
      }`}
      style={{
        transform: isAnimating ? `translateY(${position * 10}px)` : 'translateY(0)',
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img
            src={expert.image}
            alt={expert.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-100"
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

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-neutral-900 leading-tight mb-1">{expert.name}</h3>

          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              {expert.years_of_experience} {pl.expertCard.years}
            </span>
          </div>
        </div>

        <div className="text-right min-w-[86px]">
          {showScoreLoader ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-1" />
              <div className="text-xs text-neutral-500">{pl.expertCard.calculating}</div>
            </div>
          ) : matchPercentage !== null ? (
            <div className="animate-fadeIn rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
              <div className="text-3xl font-bold text-emerald-600 leading-none">{matchPercentage}%</div>
              <div className="text-sm text-neutral-600">{pl.expertCard.matchLabel}</div>
            </div>
          ) : (
            <div className="text-3xl font-bold text-neutral-300">—</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-2 text-neutral-700 rounded-lg bg-neutral-50 px-3 py-2">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{expert.monthly_budget ? expert.monthly_budget.replace('PLN/session', 'PLN/sesję') : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-700 rounded-lg bg-neutral-50 px-3 py-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{pl.referenceData.cooperation[expert.cooperation] ?? expert.cooperation}</span>
        </div>
      </div>

      {expert.gym_name && (
        <div className="mb-3">
          {expert.gym_maps_url ? (
            <a
              href={expert.gym_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 transition-colors group rounded-lg bg-neutral-50 px-3 py-2"
            >
              <Building2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-medium group-hover:underline truncate">{expert.gym_name}</span>
              {expert.gym_address && (
                <span className="text-neutral-400 text-xs truncate hidden sm:inline">— {expert.gym_address}</span>
              )}
            </a>
          ) : (
            <div className="flex items-center gap-2 text-sm text-neutral-700 rounded-lg bg-neutral-50 px-3 py-2">
              <Building2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-medium truncate">{expert.gym_name}</span>
            </div>
          )}
        </div>
      )}

      {expert.accepted_benefits && expert.accepted_benefits.length > 0 && (
        <div className="mb-4">
          <BenefitLogosRow benefits={expert.accepted_benefits} size="sm" />
        </div>
      )}

      {showExpandableSection && (
        <details className="group mb-4">
          <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            {pl.expertCard.seeMoreDetails}
            {specialties.length > 0 && <span className="text-neutral-500">({pl.expertCard.specializationsCount(specialties.length)})</span>}
            <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="mt-3 space-y-3 animate-fadeIn">
            {specialties.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">{pl.expertCard.specializations}</h4>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                  <span
                    key={`${specialty}-detail`}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    {pl.expertCard.specializationMap[specialty] ?? specialty}
                  </span>
                  ))}
                </div>
              </div>
            )}

            {expert.availability && (
              <div className="flex items-center gap-2 text-neutral-700 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {expert.availability.split(',').map((d) => pl.intake.step2.days[d.trim() as keyof typeof pl.intake.step2.days] ?? d.trim()).join(', ')}
                </span>
              </div>
            )}

            {hasReasons && matchPercentage && matchPercentage >= 60 && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                <h4 className="font-semibold text-neutral-900 mb-2">{pl.expertCard.whyThisTrainer}</h4>
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
                    {expert.reason1 && <li>• {expert.reason1}</li>}
                    {expert.reason2 && <li>• {expert.reason2}</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
        </details>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onChoose?.(expert.id)}
          disabled={!isComplete || !matchPercentage}
          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          {pl.expertCard.chooseTrainer}
        </button>
        <button
          onClick={() => onMessage?.(expert.id)}
          disabled={!isComplete || !matchPercentage}
          className="px-6 py-3 border border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pl.expertCard.message}
        </button>
      </div>
    </div>
  );
}
