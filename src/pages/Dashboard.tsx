import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { Star, MessageCircle, Award, Calendar, DollarSign, MapPin, Lightbulb } from 'lucide-react';
import IntroCallModal from '../components/IntroCallModal';
import Toast from '../components/Toast';
import type { IntroCallData } from '../components/IntroCallModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntroCallModal, setShowIntroCallModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const profileId = storage.getProfileId();

    if (!profileId) {
      navigate('/intake/step1');
      return;
    }

    api
      .getDashboard(profileId)
      .then(setDashboard)
      .catch((error) => {
        console.error(error);
        alert('Failed to load dashboard');
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard?.selectedTrainer) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">No trainer selected</h2>
          <p className="text-neutral-600 mb-6">
            Complete the intake wizard to get matched with trainers
          </p>
          <button
            onClick={() => navigate('/intake/step1')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700"
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  const trainer = dashboard.selectedTrainer.experts;
  const profileId = dashboard.profile.id;

  const handleIntroCallSubmit = async (data: IntroCallData) => {
    try {
      await api.scheduleIntroCall({
        clientProfileId: profileId,
        expertId: trainer.id,
        email: data.email,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        notes: data.notes,
      });
      setToast({ message: 'Intro call request sent successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to schedule intro call', type: 'error' });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-neutral-900">MatchFit</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Your Trainer</h2>
          <div className="flex gap-4 mb-4">
            {trainer.image && (
              <img
                src={trainer.image}
                alt={trainer.name || 'Trainer'}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0"
              />
            )}
            <div className="flex-1">
              {trainer.name && (
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">{trainer.name}</h3>
              )}
              <p className="text-emerald-600 font-semibold mb-2">{trainer.specialization}</p>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {trainer.years_of_experience} years experience
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {trainer.client_ratings}/5 rating
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-neutral-700">
              <DollarSign className="w-4 h-4" />
              <span>{trainer.monthly_budget}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700">
              <Calendar className="w-4 h-4" />
              <span>{trainer.availability}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700">
              <MapPin className="w-4 h-4" />
              <span>{trainer.cooperation}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/chat/${dashboard.profile.id}/${trainer.id}`)}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Open chat
            </button>
            <button
              onClick={() => setShowIntroCallModal(true)}
              className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Book intro call
            </button>
          </div>
        </div>

        {dashboard.recommendations && dashboard.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-6 h-6 text-emerald-700" />
              <h2 className="text-xl font-bold text-emerald-900">AI Recommendations</h2>
            </div>
            <ul className="space-y-2">
              {dashboard.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-emerald-900">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dashboard.matches && dashboard.matches.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Other Matches</h2>
            <div className="space-y-3">
              {dashboard.matches.slice(0, 3).map((match: any) => {
                const expert = match.experts;
                const matchPercentage = Math.round(match.match_score);

                return (
                  <div
                    key={match.id}
                    className="border border-neutral-200 rounded-lg p-4 flex gap-3 items-center"
                  >
                    {expert.image && (
                      <img
                        src={expert.image}
                        alt={expert.name || 'Trainer'}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-100 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      {expert.name && (
                        <h4 className="font-semibold text-neutral-900">{expert.name}</h4>
                      )}
                      <p className="text-sm text-emerald-600">{expert.specialization}</p>
                      <p className="text-xs text-neutral-600">
                        {expert.years_of_experience} years • {matchPercentage}% match
                      </p>
                    </div>
                    <button className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 flex-shrink-0">
                      Switch
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dashboard.profile && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Your Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-neutral-700">Goals:</span>{' '}
                <span className="text-neutral-600">{dashboard.profile.goals?.join(', ')}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Training Experience:</span>{' '}
                <span className="text-neutral-600">{dashboard.profile.training_experience}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Sessions per week:</span>{' '}
                <span className="text-neutral-600">{dashboard.profile.sessions_per_week}</span>
              </div>
              {dashboard.profile.age && (
                <div>
                  <span className="font-semibold text-neutral-700">Age:</span>{' '}
                  <span className="text-neutral-600">{dashboard.profile.age}</span>
                </div>
              )}
            </div>
            <button className="mt-4 text-emerald-600 font-semibold hover:text-emerald-700">
              Edit info
            </button>
          </div>
        )}
      </div>

      <IntroCallModal
        isOpen={showIntroCallModal}
        onClose={() => setShowIntroCallModal(false)}
        onSubmit={handleIntroCallSubmit}
        expertId={trainer.id}
        expertName={trainer.name || trainer.specialization}
        clientProfileId={profileId}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
