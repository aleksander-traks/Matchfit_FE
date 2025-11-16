import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, MapPin, Calendar, DollarSign, Award, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';

export default function Matches() {
  const location = useLocation();
  const navigate = useNavigate();
  const { matches: initialMatches, profileId, isStreaming } = location.state || { matches: [], profileId: null, isStreaming: false };

  const [matches, setMatches] = useState(initialMatches || []);
  const [isLoadingMore, setIsLoadingMore] = useState(isStreaming || false);

  console.log('Matches page data:', { matches: initialMatches, profileId, isStreaming });

  useEffect(() => {
    if (isStreaming) {
      const checkInterval = setInterval(async () => {
        try {
          const updatedMatches = await api.getMatchResults(profileId);
          if (updatedMatches.length > matches.length) {
            setMatches(updatedMatches);
          }
          if (updatedMatches.length >= 10) {
            setIsLoadingMore(false);
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error('Error polling for matches:', error);
        }
      }, 2000);

      return () => clearInterval(checkInterval);
    }
  }, [isStreaming, profileId, matches.length]);

  const handleChooseTrainer = async (expertId: number) => {
    try {
      await api.selectTrainer(profileId, expertId);
      storage.setProfileId(profileId);
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Your Trainer Matches</h1>
          <p className="text-neutral-600">
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more matches... ({matches.length} found so far)
              </span>
            ) : (
              `We found ${matches.length} trainers that match your goals and needs`
            )}
          </p>
        </div>

        <div className="space-y-4">
          {matches.map((match: any) => {
            const expert = match.expert;
            const matchPercentage = Math.round(match.match_score * 100);

            if (!expert) return null;

            return (
              <div key={match.expert_id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      {expert.specialization}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
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
                    <div className="text-3xl font-bold text-emerald-600">{matchPercentage}%</div>
                    <div className="text-sm text-neutral-600">Match</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <DollarSign className="w-4 h-4" />
                    <span>{expert.monthly_budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Calendar className="w-4 h-4" />
                    <span>{expert.availability}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <MapPin className="w-4 h-4" />
                    <span>{expert.cooperation}</span>
                  </div>
                </div>

                {(match.reason_1 || match.reason_2) && (
                  <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Why this trainer?</h4>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {match.reason_1 && <li>• {match.reason_1}</li>}
                      {match.reason_2 && <li>• {match.reason_2}</li>}
                      {!match.reason_1 && !match.reason_2 && (
                        <li>• This trainer matches your goals and experience level</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleChooseTrainer(expert.id)}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Choose this trainer
                  </button>
                  <button className="px-6 py-3 border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-50 transition-colors">
                    Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
