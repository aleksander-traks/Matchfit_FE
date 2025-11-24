import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRealTimeMatching } from '../hooks/useRealTimeMatching';
import ExpertCard from '../components/ExpertCard';
import MatchingProgress from '../components/MatchingProgress';
import { api } from '../lib/api';
import { storage } from '../lib/storage';

export default function RealTimeMatches() {
  const location = useLocation();
  const navigate = useNavigate();
  const { overview, profileId } = location.state || {};

  const {
    experts,
    matchingPhase,
    completedScoresCount,
    completedReasonsCount,
    error,
    progress,
    startMatching,
  } = useRealTimeMatching();

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!overview) {
      navigate('/intake/step3');
      return;
    }

    startMatching(overview);
  }, [overview, navigate, startMatching]);

  useEffect(() => {
    if (matchingPhase === 'sorting') {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [matchingPhase]);

  useEffect(() => {
    if (matchingPhase === 'complete' && experts.length > 0 && profileId) {
      const saveMatches = async () => {
        const matchResults = experts
          .filter(e => e.match_score !== undefined)
          .map(expert => ({
            client_profile_id: profileId,
            expert_id: expert.id,
            match_score: expert.match_score!,
            reason_1: expert.reason1 || 'Specialized expertise matches your fitness goals',
            reason_2: expert.reason2 || 'Excellent track record with similar clients',
          }));

        console.log('🔄 RealTimeMatches: About to save matches', {
          profileId,
          matchCount: matchResults.length,
          expertIds: matchResults.map(m => m.expert_id).slice(0, 5)
        });

        try {
          await api.saveMatchResults(matchResults);
          console.log('✅ RealTimeMatches: Matches saved successfully');
        } catch (error) {
          console.error('❌ RealTimeMatches: Error saving match results:', error);
        }
      };

      saveMatches();
    }
  }, [matchingPhase, experts, profileId]);

  const handleChooseTrainer = async (expertId: number) => {
    if (!profileId) return;

    try {
      await api.selectTrainer(profileId, expertId);
      storage.setProfileId(profileId);
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to select trainer');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate('/intake/step3')}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Your Trainer Matches</h1>
          <p className="text-neutral-600">
            {matchingPhase === 'complete'
              ? `We found ${experts.length} trainers that match your goals and needs`
              : 'Analyzing trainers to find your perfect match...'}
          </p>
        </div>

        {matchingPhase !== 'idle' && (
          <MatchingProgress
            phase={matchingPhase}
            progress={progress}
            completedScoresCount={completedScoresCount}
            totalExperts={experts.length}
            completedReasonsCount={completedReasonsCount}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {experts.map((expert, index) => (
            <div
              key={expert.id}
              className="transition-all duration-700 ease-out"
              style={{
                opacity: matchingPhase === 'loading-experts' ? 0 : 1,
                transform: matchingPhase === 'loading-experts'
                  ? 'translateY(20px)'
                  : 'translateY(0)',
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <ExpertCard
                expert={expert}
                position={index}
                isAnimating={isAnimating}
                onChoose={handleChooseTrainer}
              />
            </div>
          ))}
        </div>

        {experts.length === 0 && matchingPhase !== 'idle' && (
          <div className="text-center py-12">
            <div className="animate-pulse text-neutral-400">
              <div className="text-lg">Loading trainers...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
